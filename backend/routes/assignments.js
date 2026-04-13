const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const upload = require('../config/multer');
const path = require('path');
const fs = require('fs');

// ========================
// СТАРЫЕ МАРШРУТЫ (CRUD)
// ========================

// Получить задания урока
router.get('/lesson/:lessonId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM assignments WHERE lesson_id=$1 ORDER BY created_at',
      [req.params.lessonId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать задание (admin)
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { lesson_id, title, description, max_score, deadline } = req.body;
    const result = await pool.query(
      `INSERT INTO assignments (lesson_id, title, description, max_score, deadline)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [lesson_id, title, description, max_score || 100, deadline || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить задание (admin)
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { title, description, max_score, deadline } = req.body;
    const result = await pool.query(
      `UPDATE assignments SET title=$1, description=$2, max_score=$3, deadline=$4 WHERE id=$5 RETURNING *`,
      [title, description, max_score, deadline, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить задание (admin)
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM assignments WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Не найден' });
    res.json({ message: 'Задание удалено' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ========================
// НОВЫЕ МАРШРУТЫ (ФАЙЛЫ)
// ========================

// backend/routes/assignments.js

// Загрузить файл в задание (admin)
router.post('/:id/files', 
  authenticateToken, 
  authorizeRole('admin'), 
  upload.single('file'),  // ✅ Должно быть так!
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ error: 'Файл не загружен' });

      const result = await pool.query(
        `INSERT INTO assignment_files (assignment_id, file_name, file_path, file_size, mime_type, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          req.params.id,
          file.originalname,
          `/uploads/assignments/${file.filename}`,  // ✅ Правильный путь!
          file.size,
          file.mimetype,
          req.user.id
        ]
      );

      res.status(201).json({
        id: result.rows[0].id,
        name: file.originalname,
        url: `/uploads/assignments/${file.filename}`,  // ✅ Правильный URL!
        size: file.size,
        uploaded_at: result.rows[0].uploaded_at
      });
    } catch (err) {
      console.error('Ошибка загрузки файла:', err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
);

// ✅ Получить файлы задания
router.get('/:id/files', authenticateToken, async (req, res) => {
  try {
    console.log(`📥 GET /api/assignments/${req.params.id}/files`);
    
    const files = await pool.query(
      `SELECT af.*, u.full_name as uploader_name 
       FROM assignment_files af
       LEFT JOIN users u ON af.uploaded_by = u.id
       WHERE af.assignment_id = $1
       ORDER BY af.uploaded_at`,
      [req.params.id]
    );
    
    console.log(`✅ Найдено файлов: ${files.rows.length}`);
    res.json(files.rows);
  } catch (err) {
    console.error('❌ Ошибка получения файлов задания:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить файл из задания (admin)
router.delete('/:assignmentId/files/:fileId', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const file = await pool.query(
      'SELECT file_path FROM assignment_files WHERE id=$1 AND assignment_id=$2',
      [req.params.fileId, req.params.assignmentId]
    );
    if (file.rows.length === 0) return res.status(404).json({ error: 'Файл не найден' });

    const filePath = path.join(__dirname, '..', file.rows[0].file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await pool.query('DELETE FROM assignment_files WHERE id=$1', [req.params.fileId]);
    res.json({ message: 'Файл удалён' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;