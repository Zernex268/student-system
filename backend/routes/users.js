const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Получить всех пользователей (admin)
router.get('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, full_name, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить одного пользователя
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, full_name, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать пользователя (admin)
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { username, email, password, role, full_name } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, full_name)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, full_name`,
      [username, email, passwordHash, role || 'student', full_name]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить пользователя (admin)
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { username, email, role, full_name, password } = req.body;
    let query = 'UPDATE users SET username=$1, email=$2, role=$3, full_name=$4, updated_at=NOW()';
    let params = [username, email, role, full_name];

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      query += ', password_hash=$5';
      params.push(hash);
    }

    query += ' WHERE id=$' + (params.length + 1) + ' RETURNING id, username, email, role, full_name';
    params.push(req.params.id);

    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить пользователя (admin)
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Не найден' });
    res.json({ message: 'Удалён' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;