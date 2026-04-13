// backend/frontend/src/pages/LessonDetail.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LessonDetail() {
  const { lessonId } = useParams();
  const { user } = useAuth();
  
  // Состояния
  const [lesson, setLesson] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [assignmentFiles, setAssignmentFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [fileError, setFileError] = useState({});

  // Загрузка данных при монтировании
  useEffect(() => {
    fetchLesson();
  }, [lessonId]);

  // Загрузка урока, заданий, ответов и файлов
  const fetchLesson = async () => {
    try {
      console.log('📥 Загрузка урока...', lessonId);
      
      // 1. Загружаем урок
      const lessonRes = await axios.get(`/api/lessons/${lessonId}`);
      setLesson(lessonRes.data);
      console.log('✅ Урок загружен:', lessonRes.data.title);

      // 2. Загружаем задания урока
      const assignRes = await axios.get(`/api/assignments/lesson/${lessonId}`);
      setAssignments(assignRes.data);
      console.log('✅ Заданий:', assignRes.data.length);

      // 3. Загружаем файлы для каждого задания
      const filesMap = {};
      for (const assign of assignRes.data) {
        try {
          console.log(`📁 Загрузка файлов для задания ${assign.id}...`);
          const filesRes = await axios.get(`/api/assignments/${assign.id}/files`);
          
          // ✅ Нормализуем данные файлов (универсальная обработка полей)
          filesMap[assign.id] = (filesRes.data || []).map(file => ({
            id: file.id,
            name: file.file_name || file.name || 'Без названия',
            url: file.file_path?.startsWith('http') 
              ? file.file_path 
              : `http://localhost:5000${file.file_path || file.url || ''}`,
            size: file.file_size || file.size || 0,
            mime_type: file.mime_type,
            uploader_name: file.uploader_name
          }));
          
          console.log(`✅ Файлов задания ${assign.id}:`, filesMap[assign.id].length);
        } catch (err) {
          console.warn(`⚠️ Не удалось загрузить файлы для задания ${assign.id}:`, err.message);
          filesMap[assign.id] = [];
        }
      }
      setAssignmentFiles(filesMap);

      // 4. Загружаем ответы студента (только для роли student)
      if (user.role === 'student') {
        const subs = {};
        for (const assign of assignRes.data) {
          try {
            const subRes = await axios.get(`/api/submissions/my/${assign.id}`);
            subs[assign.id] = subRes.data;
          } catch (err) {
            subs[assign.id] = null;
          }
        }
        setSubmissions(subs);
        console.log('✅ Ответы студента загружены');
      }
    } catch (err) {
      console.error('❌ Ошибка загрузки урока:', err);
    } finally {
      setLoading(false);
    }
  };

  // Обработка ошибки загрузки файла
  const handleFileError = (fileId, error) => {
    setFileError(prev => ({ ...prev, [fileId]: true }));
    console.error(`Ошибка загрузки файла ${fileId}:`, error);
  };

  // Форматирование размера файла
  const formatSize = (bytes) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // ✅ Исправленные функции (в начале компонента)
const getGradeText = (grade) => {
  const numGrade = Number(grade); // ✅ Конвертируем в число
  const grades = {
    2: 'Неудовлетворительно',
    3: 'Удовлетворительно',
    4: 'Хорошо',
    5: 'Отлично'
  };
  return grades[numGrade] || '';
};

const getGradeColor = (grade) => {
  const numGrade = Number(grade); // ✅ Конвертируем в число
  if (numGrade === 5) return 'bg-success';
  if (numGrade === 4) return 'bg-primary';
  if (numGrade === 3) return 'bg-warning text-dark';
  return 'bg-danger';
};
  // Лоадер
  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return <div className="alert alert-danger">Урок не найден</div>;
  }

  return (
    <div>
      {/* Хлебные крошки */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/courses">Курсы</Link>
          </li>
          <li className="breadcrumb-item active">{lesson.title}</li>
        </ol>
      </nav>

      {/* Карточка урока */}
      <div className="card mb-4">
        <div className="card-header">
          <i className="bi bi-play-circle-fill me-2"></i>
          {lesson.title}
        </div>
        <div className="card-body">
          <div 
            dangerouslySetInnerHTML={{ 
              __html: lesson.content || '<p class="text-muted">Содержимое отсутствует</p>' 
            }} 
          />
        </div>
      </div>

      {/* Заголовок раздела заданий */}
      {assignments.length > 0 && (
        <h5 className="fw-bold mb-3" style={{ color: '#486188' }}>
          <i className="bi bi-pencil-square me-2"></i> Задания
        </h5>
      )}

      {/* Список заданий */}
      {assignments.map(assign => {
        const sub = submissions[assign.id];
        const files = assignmentFiles[assign.id] || [];

        return (
          <div key={assign.id} className="assignment-item mb-3">
            <div className="d-flex justify-content-between align-items-start">
              <div className="flex-grow-1">
                <h6 className="fw-bold mb-1">{assign.title}</h6>
                {assign.description && (
                  <p className="text-muted small mb-2">{assign.description}</p>
                )}
                
                {/* Мета-информация задания */}
                <small className="text-muted d-block">
                  <i className="bi bi-trophy me-1"></i> 
                  Макс. балл: <strong>{assign.max_score}</strong>
                  {assign.deadline && (
                    <>
                      {' '}| <i className="bi bi-clock me-1"></i> 
                      Дедлайн: {new Date(assign.deadline).toLocaleString('ru')}
                    </>
                  )}
                </small>

                {/* === ФАЙЛЫ ЗАДАНИЯ (МАТЕРИАЛЫ) === */}
                {files.length > 0 && (
                  <div className="mt-3 p-3" style={{ 
                    background: 'rgba(72, 97, 136, 0.06)', 
                    border: '1px solid var(--border)',
                    borderLeft: '3px solid #486188',
                    borderRadius: '0'
                  }}>
                    <small className="text-muted d-block mb-2 fw-bold">
                      <i className="bi bi-paperclip me-1"></i>Материалы:
                    </small>
                    {files.map((file, index) => (
                      <div key={file.id || index} className="small mb-2 d-flex align-items-center justify-content-between">
                        <a 
                          href={file.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-decoration-none d-flex align-items-center"
                          style={{ color: '#486188', fontWeight: 500 }}
                          download={file.name}
                        >
                          <i className="bi bi-file-earmark me-2"></i>
                          <span>{file.name}</span>
                        </a>
                        <div className="d-flex align-items-center gap-2">
                          <small className="text-muted">
                            {formatSize(file.size)}
                          </small>
                          <a
                            href={file.url}
                            download={file.name}
                            className="btn btn-sm btn-outline-primary py-0 px-2"
                            title="Скачать"
                            style={{ fontSize: '0.75rem' }}
                          >
                            <i className="bi bi-download"></i>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Кнопка отправки ответа (только для студентов) */}
              {user.role === 'student' && (
                <div className="ms-3">
                  <Link
                    to={`/submit/${assign.id}`}
                    className={`btn btn-sm ${sub ? 'btn-outline-primary' : 'btn-primary'}`}
                  >
                    {sub ? (
                      <>
                        <i className="bi bi-arrow-repeat me-1"></i>
                        {sub.status === 'graded' ? 'Просмотр' : 'Переотправить'}
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send me-1"></i> Отправить
                      </>
                    )}
                  </Link>
                </div>
              )}
            </div>

            {/* ✅ Статус ответа студента с оценкой 2-5 */}
            {/* ✅ Статус ответа студента с оценкой 2-5 */}
{sub && user.role === 'student' && (
  <div className="mt-3 pt-2" style={{ borderTop: '1px dashed var(--border)' }}>
    {sub.status === 'graded' ? (
      <div className="feedback-box">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <strong className="text-success">
            <i className="bi bi-check-circle-fill me-1"></i> Оценено
          </strong>
          {/* ✅ Исправленное отображение оценки */}
          {sub.score !== null && sub.score !== undefined ? (
            <span className={`badge fs-6 ${getGradeColor(sub.score)}`}>
              {Number(sub.score)} {getGradeText(sub.score)}
            </span>
          ) : (
            <span className="badge bg-secondary fs-6">Нет оценки</span>
          )}
        </div>
        {sub.feedback && (
          <div className="mt-2">
            <strong>Комментарий преподавателя:</strong>
            <p className="mb-0 small" style={{ whiteSpace: 'pre-wrap' }}>
              {sub.feedback}
            </p>
          </div>
        )}
      </div>
    ) : (
      <div className="alert alert-warning py-2 mb-0 small">
        <i className="bi bi-hourglass-split me-1"></i> 
        Ожидает проверки
        {sub.status === 'late' && (
          <span className="ms-2 text-danger">• Просрочено</span>
        )}
      </div>
    )}
  </div>
)}
          </div>
        );
      })}

      {/* Если заданий нет */}
      {assignments.length === 0 && (
        <div className="card">
          <div className="card-body text-muted text-center py-4">
            <i className="bi bi-inbox" style={{ fontSize: '2rem' }}></i>
            <p className="mt-2 mb-0">Заданий пока нет</p>
          </div>
        </div>
      )}

      {/* 🔍 Отладка (удалите в продакшене) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 small">
          <summary>🔍 Debug: assignmentFiles</summary>
          <pre style={{ background: '#f4f6f9', padding: '10px', fontSize: '11px', overflow: 'auto' }}>
            {JSON.stringify(assignmentFiles, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}