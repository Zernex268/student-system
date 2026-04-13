const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const upload = require('../config/multer');
const path = require('path');
const fs = require('fs');

// ============================================
// === НОВЫЕ МАРШРУТЫ ДЛЯ ФАЙЛОВ ===
// ⚠️ ВАЖНО: Специфичные маршруты ДО общего /:id
// ============================================

// POST: Загрузить файл к ответу (студент)
router.post('/:submissionId/files', authenticateToken, authorizeRole('student'), upload.single('file'), async (req, res) => {
  try {
    console.log('📥 POST /api/submissions/:submissionId/files');
    
    const { submissionId } = req.params;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    // Проверяем, что ответ существует и принадлежит студенту
    const submission = await pool.query(
      'SELECT id, student_id FROM submissions WHERE id = $1',
      [submissionId]
    );

    if (submission.rows.length === 0) {
      return res.status(404).json({ error: 'Ответ не найден' });
    }

    // Студент может загружать файлы только к своим ответам
    if (submission.rows[0].student_id !== req.user.id) {
      return res.status(403).json({ error: 'Нет доступа' });
    }

    // Добавляем файл в базу
    const result = await pool.query(
      `INSERT INTO submission_files (submission_id, file_name, file_path, file_size, mime_type)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        submissionId,
        file.originalname,
        `/uploads/submissions/${file.filename}`,
        file.size,
        file.mimetype
      ]
    );

    console.log('✅ Файл сохранён:', result.rows[0]);

    res.status(201).json({
      id: result.rows[0].id,
      file_name: file.originalname,
      file_path: `/uploads/submissions/${file.filename}`,
      file_size: file.size,
      mime_type: file.mimetype,
      url: `/uploads/submissions/${file.filename}`
    });
  } catch (err) {
    console.error('❌ Ошибка загрузки файла:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET: Получить файлы ответа
router.get('/:submissionId/files', authenticateToken, async (req, res) => {
  try {
    console.log('📥 GET /api/submissions/:submissionId/files');
    
    const { submissionId } = req.params;

    // Проверяем доступ
    const submission = await pool.query(
      'SELECT student_id FROM submissions WHERE id = $1',
      [submissionId]
    );

    if (submission.rows.length === 0) {
      return res.status(404).json({ error: 'Ответ не найден' });
    }

    // Студент видит только свои файлы, админ — все
    if (req.user.role === 'student' && submission.rows[0].student_id !== req.user.id) {
      return res.status(403).json({ error: 'Нет доступа' });
    }

    const files = await pool.query(
      'SELECT * FROM submission_files WHERE submission_id = $1 ORDER BY uploaded_at',
      [submissionId]
    );
    
    console.log('✅ Найдено файлов:', files.rows.length);
    res.json(files.rows);
  } catch (err) {
    console.error('❌ Ошибка получения файлов:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE: Удалить файл ответа
router.delete('/:submissionId/files/:fileId', authenticateToken, async (req, res) => {
  try {
    const { submissionId, fileId } = req.params;

    // Проверяем доступ
    const submission = await pool.query(
      'SELECT student_id FROM submissions WHERE id = $1',
      [submissionId]
    );

    if (submission.rows.length === 0) {
      return res.status(404).json({ error: 'Ответ не найден' });
    }

    if (req.user.role === 'student' && submission.rows[0].student_id !== req.user.id) {
      return res.status(403).json({ error: 'Нет доступа' });
    }

    // Получаем путь к файлу
    const file = await pool.query(
      'SELECT file_path FROM submission_files WHERE id = $1 AND submission_id = $2',
      [fileId, submissionId]
    );

    if (file.rows.length === 0) {
      return res.status(404).json({ error: 'Файл не найден' });
    }

    // Удаляем файл с диска
    const filePath = path.join(__dirname, '..', file.rows[0].file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('🗑️ Файл удалён с диска:', filePath);
    }

    // Удаляем из базы
    await pool.query('DELETE FROM submission_files WHERE id = $1', [fileId]);
    console.log('✅ Файл удалён из БД');

    res.json({ message: 'Файл удалён' });
  } catch (err) {
    console.error('❌ Ошибка удаления файла:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ============================================
// === СТАРЫЕ МАРШРУТЫ (основная логика) ===
// ============================================

// Отправить ответ (с поддержкой загрузки файла)
router.post('/', authenticateToken, authorizeRole('student'), upload.single('file'), async (req, res) => {
  try {
    const { assignment_id, answer_text } = req.body;
    const file = req.file;

    // Проверка дедлайна
    const assignment = await pool.query('SELECT deadline FROM assignments WHERE id=$1', [assignment_id]);
    if (assignment.rows.length === 0) return res.status(404).json({ error: 'Задание не найдено' });

    let status = 'pending';
    const deadline = assignment.rows[0].deadline;
    if (deadline && new Date() > new Date(deadline)) {
      status = 'late';
    }

    // Создаём/обновляем запись ответа
    const subResult = await pool.query(
      `INSERT INTO submissions (assignment_id, student_id, answer_text, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (assignment_id, student_id)
       DO UPDATE SET answer_text=$3, status=$4, submitted_at=NOW()
       RETURNING *`,
      [assignment_id, req.user.id, answer_text || '', status]
    );
    const submission = subResult.rows[0];

    // Если есть файл — сохраняем в submission_files
    if (file) {
      await pool.query(
        `INSERT INTO submission_files (submission_id, file_name, file_path, file_size, mime_type)
         VALUES ($1, $2, $3, $4, $5)`,
        [submission.id, file.originalname, `/uploads/submissions/${file.filename}`, file.size, file.mimetype]
      );
    }

    res.status(201).json({
      ...submission,
      file: file ? {
        name: file.originalname,
        url: `/uploads/submissions/${file.filename}`,
        size: file.size
      } : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить ответ студента на задание
router.get('/my/:assignmentId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, g.score, g.feedback, g.graded_at
       FROM submissions s
       LEFT JOIN grades g ON s.id = g.submission_id
       WHERE s.assignment_id = $1 AND s.student_id = $2`,
      [req.params.assignmentId, req.user.id]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить все ответы для курса (admin)
router.get('/course/:courseId', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, a.title as assignment_title, l.title as lesson_title,
             u.full_name as student_name, u.email as student_email,
             g.score, g.feedback, g.graded_at
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN lessons l ON a.lesson_id = l.id
      JOIN topics t ON l.topic_id = t.id
      JOIN users u ON s.student_id = u.id
      LEFT JOIN grades g ON s.id = g.submission_id
      WHERE t.course_id = $1
      ORDER BY s.submitted_at DESC
    `, [req.params.courseId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ============================================
// === ОБНОВИТЬ ОТВЕТ (студент) ===
// ============================================
router.put('/:id', authenticateToken, authorizeRole('student'), async (req, res) => {
  try {
    console.log('📝 PUT /api/submissions/:id');
    
    const { id } = req.params;
    const { answer_text } = req.body;

    // Проверяем, что ответ существует и принадлежит студенту
    const submission = await pool.query(
      'SELECT id, student_id, assignment_id FROM submissions WHERE id = $1',
      [id]
    );

    if (submission.rows.length === 0) {
      return res.status(404).json({ error: 'Ответ не найден' });
    }

    // Студент может обновлять только свои ответы
    if (submission.rows[0].student_id !== req.user.id) {
      return res.status(403).json({ error: 'Нет доступа' });
    }

    // Проверяем дедлайн
    const assignment = await pool.query(
      'SELECT deadline FROM assignments WHERE id = $1',
      [submission.rows[0].assignment_id]
    );

    let status = 'pending';
    const deadline = assignment.rows[0]?.deadline;
    if (deadline && new Date() > new Date(deadline)) {
      status = 'late';
    }

    // Обновляем ответ

    const result = await pool.query(
    `UPDATE submissions 
    SET answer_text = $1, status = $2 
    WHERE id = $3 
   RETURNING *`,
  [answer_text || '', status, id]
);

    console.log('✅ Ответ обновлён:', result.rows[0]);
    res.json(result.rows[0]);
    
  } catch (err) {
    console.error('❌ Ошибка обновления ответа:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить ответ на задание (admin) — ОБЩИЙ МАРШРУТ, ПОЭТОМУ В КОНЦЕ
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, a.title as assignment_title, a.description as assignment_description,
             a.max_score, a.deadline, l.title as lesson_title,
             u.full_name as student_name, u.email as student_email
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN lessons l ON a.lesson_id = l.id
      JOIN users u ON s.student_id = u.id
      WHERE s.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;