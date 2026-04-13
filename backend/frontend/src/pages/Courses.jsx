import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/courses')
      .then(res => setCourses(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div>
      <h3 className="fw-bold mb-4" style={{ color: '#486188' }}>
        <i className="bi bi-journal-bookmark-fill me-2"></i> Мои курсы
      </h3>

      {courses.length === 0 ? (
        <div className="card">
          <div className="card-body text-center p-5 text-muted">
            <i className="bi bi-inbox" style={{ fontSize: '3rem' }}></i>
            <p className="mt-3">У вас пока нет курсов</p>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {courses.map(course => (
            <div className="col-md-4" key={course.id}>
              <Link to={`/courses/${course.id}`} className="text-decoration-none">
                <div className="card course-card h-100">
                  <div className="card-body">
                    <h5 className="card-title" style={{ color: '#486188' }}>{course.title}</h5>
                    <p className="card-text text-muted">{course.description || 'Без описания'}</p>
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <small className="text-muted">
                        <i className="bi bi-person me-1"></i>{course.creator_name || 'Неизвестно'}
                      </small>
                      <span className="btn btn-sm btn-outline-primary">
                        Перейти <i className="bi bi-arrow-right ms-1"></i>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}