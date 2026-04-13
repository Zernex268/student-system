// backend/frontend/src/pages/GradeSubmission.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

export default function GradeSubmission() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [files, setFiles] = useState([]);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [existingGrade, setExistingGrade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubmission();
  }, [submissionId]);

  const fetchSubmission = async () => {
    try {
      // Загружаем информацию об ответе
      const res = await axios.get(`/api/submissions/${submissionId}`);
      setSubmission(res.data);

      // Загружаем файлы ответа
      const filesRes = await axios.get(`/api/submissions/${submissionId}/files`);
      const normalizedFiles = (filesRes.data || []).map(file => ({
        id: file.id,
        name: file.file_name || file.name,
        url: file.file_path?.startsWith('http') 
          ? file.file_path 
          : `http://localhost:5000${file.file_path || file.url}`,
        size: file.file_size || file.size,
      }));
      setFiles(normalizedFiles);

      // Если уже оценено
      if (res.data.score !== null && res.data.score !== undefined) {
        setScore(String(res.data.score)); // ✅ Конвертируем в строку для select
        setFeedback(res.data.feedback || '');
        setExistingGrade(res.data);
      } else {
        setScore(''); // ✅ Пустое значение по умолчанию
      }
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  // Форматирование размера файла
  const formatSize = (bytes) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Текст оценки для отображения
  const getGradeText = (grade) => {
    const grades = {
      '2': 'Неудовлетворительно',
      '3': 'Удовлетворительно',
      '4': 'Хорошо',
      '5': 'Отлично'
    };
    return grades[grade] || '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const gradeData = {
        submission_id: submissionId,
        score: parseInt(score), // ✅ Преобразуем строку в число для БД
        feedback: feedback,
      };

      if (existingGrade && existingGrade.id) {
        await axios.put(`/api/grades/${existingGrade.id}`, {
          score: parseInt(score),
          feedback: feedback,
        });
      } else {
        await axios.post('/api/grades', gradeData);
      }

      navigate(-1);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка сохранения оценки');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;
  if (!submission) return <div className="alert alert-danger">Ответ не найден</div>;

  return (
    <div>
      <button className="btn btn-outline-primary mb-3" onClick={() => navigate(-1)}>
        <i className="bi bi-arrow-left me-1"></i> Назад
      </button>

      <div className="row g-4">
        {/* Информация об ответе */}
        <div className="col-lg-7">
          <div className="card mb-4">
            <div className="card-header">
              <i className="bi bi-file-earmark-text me-2"></i> Ответ студента
            </div>
            <div className="card-body">
              <div className="mb-3">
                <strong>Студент:</strong> {submission.student_name}
              </div>
              <div className="mb-3">
                <strong>Email:</strong> {submission.student_email}
              </div>
              <div className="mb-3">
                <strong>Задание:</strong> {submission.assignment_title}
              </div>
              <div className="mb-3">
                <strong>Макс. балл:</strong> {submission.max_score}
              </div>
              {submission.deadline && (
                <div className="mb-3">
                  <strong>Дедлайн:</strong> {new Date(submission.deadline).toLocaleString('ru')}
                </div>
              )}
              <div className="mb-3">
                <strong>Отправлено:</strong> {new Date(submission.submitted_at).toLocaleString('ru')}
              </div>

              <hr />

              {/* ОТОБРАЖЕНИЕ ФАЙЛОВ */}
              {files.length > 0 && (
                <div className="mb-3">
                  <strong>
                    <i className="bi bi-paperclip me-1"></i>Прикреплённые файлы:
                  </strong>
                  <div className="mt-2">
                    {files.map((file, index) => (
                      <div 
                        key={file.id || index} 
                        className="d-flex align-items-center justify-content-between p-2 mb-2"
                        style={{ 
                          background: 'rgba(72, 97, 136, 0.06)', 
                          border: '1px solid var(--border)',
                          borderRadius: '0'
                        }}
                      >
                        <a 
                          href={file.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-decoration-none"
                          style={{ color: '#486188', fontWeight: 500 }}
                          download={file.name}
                        >
                          <i className="bi bi-file-earmark me-2"></i>
                          {file.name}
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
                </div>
              )}

              <h6 className="fw-bold">Текст ответа:</h6>
              <div className="p-3" style={{ background: '#f4f6f9', border: '1px solid #dee2e6', whiteSpace: 'pre-wrap' }}>
                {submission.answer_text || <em className="text-muted">Нет текстового ответа</em>}
              </div>
            </div>
          </div>
        </div>

        {/* Форма оценки */}
        <div className="col-lg-5">
          <div className="card">
            <div className="card-header">
              <i className="bi bi-star-fill me-2"></i>
              {existingGrade ? 'Изменить оценку' : 'Поставить оценку'}
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}

              <form onSubmit={handleSubmit}>
                {/* ✅ SELECT ДЛЯ ОЦЕНКИ 2-5 */}
                <div className="mb-3">
                  <label className="form-label fw-bold">Оценка</label>
                  <select
                    className="form-select"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    required
                  >
                    <option value="">Выберите оценку</option>
                    <option value="2">2 - Неудовлетворительно</option>
                    <option value="3">3 - Удовлетворительно</option>
                    <option value="4">4 - Хорошо</option>
                    <option value="5">5 - Отлично</option>
                  </select>
                  {score && (
                    <small className={`text-muted d-block mt-1 ${
                      score === '5' ? 'text-success' :
                      score === '4' ? 'text-primary' :
                      score === '3' ? 'text-warning' :
                      'text-danger'
                    }`}>
                      {getGradeText(score)}
                    </small>
                  )}
                </div>

                <div className="mb-4">
                  <label className="form-label fw-bold">Фидбек</label>
                  <textarea
                    className="form-control"
                    rows="5"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Комментарий к работе..."
                  />
                </div>

                <button type="submit" className="btn btn-primary w-100 py-2" disabled={submitting}>
                  {submitting ? (
                    <span>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Сохранение...
                    </span>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-1"></i> 
                      {existingGrade ? 'Обновить оценку' : 'Оценить'}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}