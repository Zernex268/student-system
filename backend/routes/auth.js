const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Регистрация
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role, full_name } = req.body;

    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Пользователь уже существует' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, full_name)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, full_name`,
      [username, email, passwordHash, role || 'student', full_name]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Вход
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;