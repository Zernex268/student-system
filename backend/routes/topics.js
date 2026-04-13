const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const upload = require('../config/multer');
const path = require('path');
const fs = require('fs');

// === СУЩЕСТВУЮЩИЕ МАРШРУТЫ ===

// Получить темы курса
router.get('/course/:courseId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM topics WHERE course_id=$1 ORDER BY order_index',
      [req.params.courseId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать тему (admin)
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { course_id, title, description, order_index } = req.body;
    const result = await pool.query(
      `INSERT INTO topics (course_id, title, description, order_index)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [course_id, title, description, order_index || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить тему (admin)
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { title, description, order_index } = req.body;
    const result = await pool.query(
      `UPDATE topics SET title=$1, description=$2, order_index=$3 WHERE id=$4 RETURNING *`,
      [title, description, order_index, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить тему (admin)
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM topics WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Не найден' });
    res.json({ message: 'Тема удалена' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// === НОВЫЕ МАРШРУТЫ ДЛЯ ФАЙЛОВ ===

// backend/routes/topics.js

// Загрузить файл в тему (admin)
router.post('/:id/files', 
  authenticateToken, 
  authorizeRole('admin'), 
  upload.single('file'),
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ error: 'Файл не загружен' });

      const result = await pool.query(
        `INSERT INTO topic_files (topic_id, file_name, file_path, file_size, mime_type, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          req.params.id,
          file.originalname,
          `/uploads/topics/${file.filename}`,  // ✅ Правильный путь!
          file.size,
          file.mimetype,
          req.user.id
        ]
      );

      res.status(201).json({
        id: result.rows[0].id,
        name: file.originalname,
        url: `/uploads/topics/${file.filename}`,  // ✅ Правильный URL!
        size: file.size,
        uploaded_at: result.rows[0].uploaded_at
      });
    } catch (err) {
      console.error('Ошибка загрузки файла:', err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
);

// Получить файлы темы
// ✅ Получить файлы темы
router.get('/:id/files', authenticateToken, async (req, res) => {
  try {
    console.log(`📥 GET /api/topics/${req.params.id}/files`);
    
    const files = await pool.query(
      `SELECT tf.*, u.full_name as uploader_name 
       FROM topic_files tf
       LEFT JOIN users u ON tf.uploaded_by = u.id
       WHERE tf.topic_id = $1
       ORDER BY tf.uploaded_at`,
      [req.params.id]
    );
    
    console.log(`✅ Найдено файлов: ${files.rows.length}`);
    res.json(files.rows);
  } catch (err) {
    console.error('❌ Ошибка получения файлов темы:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить файл из темы
router.delete('/:topicId/files/:fileId', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const file = await pool.query(
      'SELECT file_path FROM topic_files WHERE id=$1 AND topic_id=$2',
      [req.params.fileId, req.params.topicId]
    );
    if (file.rows.length === 0) return res.status(404).json({ error: 'Файл не найден' });

    const filePath = path.join(__dirname, '..', file.rows[0].file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await pool.query('DELETE FROM topic_files WHERE id=$1', [req.params.fileId]);
    res.json({ message: 'Файл удалён' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;