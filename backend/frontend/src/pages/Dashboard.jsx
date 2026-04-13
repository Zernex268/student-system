import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const coursesRes = await axios.get('/api/courses');
      setCourses(coursesRes.data);

      if (user.role === 'student') {
        // Получаем ответы студента через курсы
        const allSubs = [];
        for (const course of coursesRes.data) {
          const lessonsRes = await axios.get(`/api/topics/course/${course.id}`);
          for (const topic of lessonsRes.data) {
            const lessonsRes2 = await axios.get(`/api/lessons/topic/${topic.id}`);
            for (const lesson of lessonsRes2.data) {
              const assignRes = await axios.get(`/api/assignments/lesson/${lesson.id}`);
              for (const assign of assignRes.data) {
                const subRes = await axios.get(`/api/submissions/my/${assign.id}`);
                if (subRes.data) allSubs.push(subRes.data);
              }
            }
          }
        }
        setSubmissions(allSubs);
      } else {
        // Админ: считаем общие данные
        const totalSubs = coursesRes.data.reduce((acc, c) => acc + (c.student_count || 0), 0);
        setSubmissions(new Array(totalSubs));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const gradedCount = submissions.filter(s => s.status === 'graded').length;
  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  return (
    <div>
      <h3 className="fw-bold mb-4" style={{ color: '#486188' }}>
        Добро пожаловать, {user.full_name}!
      </h3>

      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="dashboard-stat">
            <div className="stat-value">{courses.length}</div>
            <div className="stat-label">Курсов</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="dashboard-stat">
            <div className="stat-value">{submissions.length}</div>
            <div className="stat-label">Ответов отправлено</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="dashboard-stat">
            <div className="stat-value">{gradedCount}</div>
            <div className="stat-label">Оценено</div>
          </div>
        </div>
      </div>

      {pendingCount > 0 && user.role === 'student' && (
        <div className="alert alert-warning" style={{ borderRadius: 0 }}>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          У вас <strong>{pendingCount}</strong> ответов ожидают проверки
        </div>
      )}

      <div className="card mt-4">
        <div className="card-header">
          <i className="bi bi-journal-text me-2"></i>
          {user.role === 'admin' ? 'Все курсы' : 'Мои курсы'}
        </div>
        <div className="card-body p-0">
          {courses.length === 0 ? (
            <div className="p-4 text-center text-muted">
              {user.role === 'student'
                ? 'Вам пока не назначены курсы. Обратитесь к преподавателю.'
                : 'Нет курсов. Создайте первый курс!'}
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {courses.map(course => (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                >
                  <div>
                    <strong>{course.title}</strong>
                    <br />
                    <small className="text-muted">{course.description?.substring(0, 80)}...</small>
                  </div>
                  <i className="bi bi-chevron-right text-muted"></i>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {user.role === 'admin' && (
        <div className="row mt-4 g-3">
          <div className="col-md-6">
            <Link to="/admin/users" className="btn btn-primary w-100 py-3">
              <i className="bi bi-people-fill me-2"></i> Управление пользователями
            </Link>
          </div>
          <div className="col-md-6">
            <Link to="/admin/courses" className="btn btn-outline-primary w-100 py-3">
              <i className="bi bi-collection-fill me-2"></i> Управление курсами
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}