import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CourseDetail() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [topics, setTopics] = useState([]);
  const [lessons, setLessons] = useState({});
  const [topicFiles, setTopicFiles] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const courseRes = await axios.get(`/api/courses/${courseId}`);
      setCourse(courseRes.data);

      const topicsRes = await axios.get(`/api/topics/course/${courseId}`);
      setTopics(topicsRes.data);

      // Загружаем файлы для каждой темы
      const filesMap = {};
      for (const topic of topicsRes.data) {
        try {
          const filesRes = await axios.get(`/api/topics/${topic.id}/files`);
          filesMap[topic.id] = (filesRes.data || []).map(file => ({
            id: file.id,
            name: file.file_name || file.name || 'Без названия',
            url: file.file_path?.startsWith('http') 
              ? file.file_path 
              : `http://localhost:5000${file.file_path || file.url || ''}`,
            size: file.file_size || file.size || 0,
            uploader_name: file.uploader_name
          }));
        } catch (err) {
          console.warn(`Не удалось загрузить файлы темы ${topic.id}:`, err);
          filesMap[topic.id] = [];
        }
      }
      setTopicFiles(filesMap);

      const lessonsMap = {};
      for (const topic of topicsRes.data) {
        const lessonsRes = await axios.get(`/api/lessons/topic/${topic.id}`);
        lessonsMap[topic.id] = lessonsRes.data;
      }
      setLessons(lessonsMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;
  if (!course) return <div className="alert alert-danger">Курс не найден</div>;

  return (
    <div className="container-fluid px-3">
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/courses">Курсы</Link></li>
          <li className="breadcrumb-item active">{course.title}</li>
        </ol>
      </nav>

      <div className="card mb-4 shadow-sm">
        {/* Заголовок курса — ИСПРАВЛЕНО: темный фон, белый текст */}
        <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2" style={{ background: '#486188', color: 'white' }}>
          <h4 className="mb-0 flex-grow-1 text-break" style={{ color: 'white' }}>{course.title}</h4>
          {user.role === 'admin' && (
            <Link to={`/admin/submissions/${courseId}`} className="btn btn-light btn-sm flex-shrink-0">
              <i className="bi bi-clipboard-check me-1"></i> Проверить ответы
            </Link>
          )}
        </div>
        <div className="card-body">
          <p className="text-muted">{course.description}</p>
          <small className="text-muted">
            <i className="bi bi-person me-1"></i> {course.creator_name}
          </small>
        </div>
      </div>

      <h5 className="fw-bold mb-3" style={{ color: '#486188' }}>
        <i className="bi bi-layers-fill me-2"></i> Содержание курса
      </h5>

      {topics.length === 0 ? (
        <div className="card"><div className="card-body text-muted text-center">Тем пока нет</div></div>
      ) : (
        topics.map(topic => (
          <div key={topic.id} className="card mb-3 border-start border-primary border-4">
            <div className="card-body">
              <h6 className="fw-bold mb-2 text-break" style={{ color: '#486188' }}>
                <i className="bi bi-folder2-open me-2"></i> {topic.title}
              </h6>
              {topic.description && <p className="text-muted small mb-3">{topic.description}</p>}

              {/* Файлы темы — РАСШИРЕНО: все форматы */}
              {topicFiles[topic.id] && topicFiles[topic.id].length > 0 && (
                <div className="mb-3 p-2" style={{ 
                  background: 'rgba(72, 97, 136, 0.06)', 
                  border: '1px solid var(--border)',
                  borderLeft: '3px solid #486188'
                }}>
                  <small className="text-muted d-block mb-2 fw-bold">
                    <i className="bi bi-paperclip me-1"></i>Файлы темы:
                  </small>
                  {topicFiles[topic.id].map((file) => (
                    <div key={file.id} className="small mb-2 d-flex flex-wrap align-items-center justify-content-between gap-2">
                      <a 
                        href={file.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-decoration-none text-primary d-flex align-items-center"
                        style={{ maxWidth: '70%', fontWeight: 500 }}
                        download={file.name}
                      >
                        <i className="bi bi-file-earmark me-2 flex-shrink-0"></i>
                        <span className="text-truncate">{file.name}</span>
                      </a>
                      <div className="d-flex align-items-center gap-2 flex-shrink-0">
                        <small className="text-muted">{formatSize(file.size)}</small>
                        <a
                          href={file.url}
                          download={file.name}
                          className="btn btn-sm btn-outline-primary py-0 px-2"
                          title="Скачать"
                        >
                          <i className="bi bi-download"></i>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {lessons[topic.id]?.length === 0 ? (
                <p className="text-muted small">Уроков пока нет</p>
              ) : (
                lessons[topic.id]?.map(lesson => (
                  <Link
                    key={lesson.id}
                    to={`/lessons/${lesson.id}`}
                    className="text-decoration-none d-block"
                  >
                    <div className="d-flex justify-content-between align-items-center p-2 rounded hover-bg-light">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-play-circle-fill me-2 text-success fs-5"></i>
                        <strong className="text-dark text-break">{lesson.title}</strong>
                      </div>
                      <i className="bi bi-chevron-right text-muted flex-shrink-0"></i>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}