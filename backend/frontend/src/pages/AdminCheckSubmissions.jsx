import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

export default function AdminCheckSubmissions() {
  const { courseId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, graded, late

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    try {
      const courseRes = await axios.get(`/api/courses/${courseId}`);
      setCourse(courseRes.data);

      const subsRes = await axios.get(`/api/submissions/course/${courseId}`);
      setSubmissions(subsRes.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const filtered = submissions.filter(s => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div>
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/admin/courses">Курсы</Link></li>
          <li className="breadcrumb-item"><Link to={`/courses/${courseId}`}>{course?.title}</Link></li>
          <li className="breadcrumb-item active">Ответы студентов</li>
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold" style={{ color: '#486188' }}>
          <i className="bi bi-clipboard-check me-2"></i> Ответы студентов
        </h3>
        <div>
          <select className="form-select d-inline-block w-auto" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">Все ({submissions.length})</option>
            <option value="pending">Ожидают ({submissions.filter(s => s.status === 'pending').length})</option>
            <option value="graded">Оценены ({submissions.filter(s => s.status === 'graded').length})</option>
            <option value="late">Просрочены ({submissions.filter(s => s.status === 'late').length})</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><div className="card-body text-center text-muted p-5">
          <i className="bi bi-inbox" style={{ fontSize: '3rem' }}></i>
          <p className="mt-2">Нет ответов</p>
        </div></div>
      ) : (
        <div className="card">
          <div className="card-body p-0">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Студент</th>
                  <th>Задание</th>
                  <th>Урок</th>
                  <th>Дата отправки</th>
                  <th>Статус</th>
                  <th>Оценка</th>
                  <th className="text-end">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(sub => (
                  <tr key={sub.id}>
                    <td>
                      <strong>{sub.student_name}</strong>
                      <br />
                      <small className="text-muted">{sub.student_email}</small>
                    </td>
                    <td>{sub.assignment_title}</td>
                    <td>{sub.lesson_title}</td>
                    <td>{new Date(sub.submitted_at).toLocaleString('ru')}</td>
                    <td>
                      <span className={`badge status-badge status-${sub.status}`}>
                        {sub.status === 'pending' ? 'Ожидает' : sub.status === 'graded' ? 'Оценён' : 'Просрочен'}
                      </span>
                    </td>
                    <td>
                      {sub.score !== null && sub.score !== undefined ? (
                        <strong>{sub.score}</strong>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="text-end">
                      <Link to={`/admin/grade/${sub.id}`} className="btn btn-sm btn-primary">
                        <i className="bi bi-eye me-1"></i> Проверить
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}