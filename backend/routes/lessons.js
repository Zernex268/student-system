const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Получить уроки темы
router.get('/topic/:topicId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM lessons WHERE topic_id=$1 ORDER BY order_index',
      [req.params.topicId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить урок по ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lessons WHERE id=$1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать урок (admin)
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { topic_id, title, content, order_index } = req.body;
    const result = await pool.query(
      `INSERT INTO lessons (topic_id, title, content, order_index)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [topic_id, title, content, order_index || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить урок (admin)
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { title, content, order_index } = req.body;
    const result = await pool.query(
      `UPDATE lessons SET title=$1, content=$2, order_index=$3 WHERE id=$4 RETURNING *`,
      [title, content, order_index, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить урок (admin)
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM lessons WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Не найден' });
    res.json({ message: 'Урок удалён' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;