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
        } catch (err) { filesMap[topic.id] = []; }
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
    <div className="container-fluid">
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/courses">Курсы</Link></li>
          <li className="breadcrumb-item active">{course.title}</li>
        </ol>
      </nav>

      <div className="card mb-4 shadow-sm">
        {/* Заголовок курса с кнопкой */}
        <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
          <h4 className="mb-0 flex-grow-1 text-break">{course.title}</h4>
          {user.role === 'admin' && (
            <Link to={`/admin/submissions/${courseId}`} className="btn btn-primary btn-sm flex-shrink-0">
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

      <h5 className="fw-bold mb-3 text-primary">
        <i className="bi bi-layers-fill me-2"></i> Содержание курса
      </h5>

      {topics.length === 0 ? (
        <div className="card"><div className="card-body text-muted text-center">Тем пока нет</div></div>
      ) : (
        topics.map(topic => (
          <div key={topic.id} className="card mb-3 border-start border-primary border-4">
            <div className="card-body">
              <h6 className="fw-bold mb-2 text-break">
                <i className="bi bi-folder2-open me-2 text-primary"></i> {topic.title}
              </h6>
              {topic.description && <p className="text-muted small mb-3">{topic.description}</p>}

              {/* Файлы темы */}
              {topicFiles[topic.id] && topicFiles[topic.id].length > 0 && (
                <div className="mb-3 p-2 bg-light rounded">
                  <small className="text-muted d-block mb-2 fw-bold">
                    <i className="bi bi-paperclip me-1"></i> Файлы темы:
                  </small>
                  {topicFiles[topic.id].map((file) => (
                    <div key={file.id} className="d-flex flex-wrap justify-content-between align-items-center py-1 border-bottom">
                      <a 
                        href={file.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-decoration-none text-primary me-2 d-flex align-items-center"
                        download={file.name}
                      >
                        <i className="bi bi-file-earmark me-2"></i>
                        <span className="text-break">{file.name}</span>
                      </a>
                      <div className="d-flex align-items-center gap-2 flex-shrink-0">
                        <small className="text-muted">{formatSize(file.size)}</small>
                        <a href={file.url} download={file.name} className="btn btn-sm btn-outline-primary py-0 px-2">
                          <i className="bi bi-download"></i>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Уроки */}
              {lessons[topic.id]?.length > 0 ? (
                <div className="ps-3 border-start">
                  {lessons[topic.id].map(lesson => (
                    <Link
                      key={lesson.id}
                      to={`/lessons/${lesson.id}`}
                      className="text-decoration-none d-block py-2 text-break"
                    >
                      <div className="d-flex justify-content-between align-items-center hover-bg-light p-2 rounded">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-play-circle-fill me-2 text-success fs-5"></i>
                          <strong className="text-dark">{lesson.title}</strong>
                        </div>
                        <i className="bi bi-chevron-right text-muted"></i>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted small ms-3">Уроков пока нет</p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}