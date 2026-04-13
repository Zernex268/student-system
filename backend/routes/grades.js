const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Поставить оценку (admin)
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { submission_id, score, feedback } = req.body;

    const submission = await pool.query(
      'SELECT id FROM submissions WHERE id=$1', [submission_id]
    );
    if (submission.rows.length === 0) return res.status(404).json({ error: 'Ответ не найден' });

    const result = await pool.query(
      `INSERT INTO grades (submission_id, score, feedback, graded_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [submission_id, score, feedback || '', req.user.id]
    );

    // Обновить статус ответа
    await pool.query("UPDATE submissions SET status='graded' WHERE id=$1", [submission_id]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить оценку (admin)
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { score, feedback } = req.body;
    const result = await pool.query(
      `UPDATE grades SET score=$1, feedback=$2, graded_at=NOW() WHERE id=$3 RETURNING *`,
      [score, feedback, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить оценки студента
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT g.*, s.submitted_at, a.title as assignment_title, c.title as course_title
      FROM grades g
      JOIN submissions s ON g.submission_id = s.id
      JOIN assignments a ON s.assignment_id = a.id
      JOIN lessons l ON a.lesson_id = l.id
      JOIN topics t ON l.topic_id = t.id
      JOIN courses c ON t.course_id = c.id
      WHERE s.student_id = $1
      ORDER BY g.graded_at DESC
    `, [req.params.studentId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;