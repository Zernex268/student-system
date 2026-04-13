const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Все курсы (для студентов — только назначенные, для админа — все)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let courses;
    if (req.user.role === 'admin') {
      courses = await pool.query(`
        SELECT c.*, u.full_name as creator_name,
          (SELECT COUNT(*) FROM student_courses WHERE course_id = c.id) as student_count
        FROM courses c LEFT JOIN users u ON c.created_by = u.id
        ORDER BY c.created_at DESC
      `);
    } else {
      courses = await pool.query(`
        SELECT c.*, u.full_name as creator_name
        FROM courses c
        JOIN student_courses sc ON c.id = sc.course_id
        LEFT JOIN users u ON c.created_by = u.id
        WHERE sc.student_id = $1
        ORDER BY c.created_at DESC
      `, [req.user.id]);
    }
    res.json(courses.rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить курс по ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.full_name as creator_name FROM courses c
      LEFT JOIN users u ON c.created_by = u.id WHERE c.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Не найден' });

    // Проверка доступа студента
    if (req.user.role === 'student') {
      const access = await pool.query(
        'SELECT id FROM student_courses WHERE student_id=$1 AND course_id=$2',
        [req.user.id, req.params.id]
      );
      if (access.rows.length === 0) return res.status(403).json({ error: 'Нет доступа' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать курс (admin)
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { title, description } = req.body;
    const result = await pool.query(
      `INSERT INTO courses (title, description, created_by)
       VALUES ($1, $2, $3) RETURNING *`,
      [title, description, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить курс (admin)
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { title, description } = req.body;
    const result = await pool.query(
      `UPDATE courses SET title=$1, description=$2, updated_at=NOW() WHERE id=$3 RETURNING *`,
      [title, description, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить курс (admin)
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM courses WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Не найден' });
    res.json({ message: 'Курс удалён' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Назначить курс студенту (admin)
router.post('/:id/enroll', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { student_id } = req.body;
    const result = await pool.query(
      `INSERT INTO student_courses (student_id, course_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING RETURNING *`,
      [student_id, req.params.id]
    );
    res.status(201).json(result.rows[0] || { message: 'Уже записан' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Отчислить студента (admin)
router.delete('/:id/enroll/:student_id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM student_courses WHERE course_id=$1 AND student_id=$2',
      [req.params.id, req.params.student_id]
    );
    res.json({ message: 'Студент отчислен' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить студентов курса
router.get('/:id/students', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.username, u.email, u.full_name, sc.enrolled_at
      FROM users u
      JOIN student_courses sc ON u.id = sc.student_id
      WHERE sc.course_id = $1
      ORDER BY u.full_name
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;