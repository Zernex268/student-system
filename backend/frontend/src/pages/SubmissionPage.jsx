// backend/frontend/src/pages/SubmissionPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import FileUpload from '../components/FileUpload';

export default function SubmissionPage() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  
  // Состояния
  const [assignment, setAssignment] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [files, setFiles] = useState([]);                    // Новые файлы для отправки
  const [uploadedFiles, setUploadedFiles] = useState([]);     // Уже загруженные файлы
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Загрузка данных при монтировании
  useEffect(() => {
    fetchData();
  }, [assignmentId]);

  // Загрузка данных задания и существующего ответа
  const fetchData = async () => {
    try {
      console.log('📥 Загрузка данных для задания:', assignmentId);
      
      // 1. Проверяем, есть ли уже ответ студента на это задание
      const subRes = await axios.get(`/api/submissions/my/${assignmentId}`);
      setExistingSubmission(subRes.data);

      if (subRes.data) {
        setAnswerText(subRes.data.answer_text || '');
        
        // 2. Загружаем прикреплённые файлы к этому ответу
        console.log('📁 Загрузка файлов для ответа:', subRes.data.id);
        const filesRes = await axios.get(`/api/submissions/${subRes.data.id}/files`);
        
        // Нормализуем данные файлов
        const normalizedFiles = (filesRes.data || []).map(file => ({
          id: file.id,
          name: file.file_name || file.name || 'Без названия',
          url: file.file_path?.startsWith('http') 
            ? file.file_path 
            : `http://localhost:5000${file.file_path || file.url || ''}`,
          size: file.file_size || file.size || 0,
        }));
        
        setUploadedFiles(normalizedFiles);
        console.log('✅ Файлов загружено:', normalizedFiles.length);
      }

      // 3. Получаем информацию о задании
      if (subRes.data?.id) {
        const detailRes = await axios.get(`/api/submissions/${subRes.data.id}`);
        if (detailRes.data) {
          setAssignment({
            title: detailRes.data.assignment_title,
            description: detailRes.data.assignment_description,
            max_score: detailRes.data.max_score,
            deadline: detailRes.data.deadline,
          });
        }
      }
    } catch (err) {
      console.error('❌ Ошибка загрузки данных:', err);
      setError('Не удалось загрузить данные задания');
    } finally {
      setLoading(false);
    }
  };

  // Обработка загрузки файла через FileUpload компонент
  // ⚠️ Эта функция ТОЛЬКО добавляет файлы в локальный стейт
  // Реальная загрузка происходит в handleSubmit после создания ответа
  const handleFileUpload = async (fileList) => {
    console.log('📎 Файлы выбраны:', fileList.map(f => f.name));
    setFiles(prev => [...prev, ...fileList]);
  };

  // Удаление уже загруженного файла
  const handleFileDelete = async (fileId) => {
    if (!existingSubmission) return;
    if (!window.confirm('Удалить этот файл?')) return;
    
    try {
      console.log('🗑️ Удаление файла:', fileId);
      await axios.delete(`/api/submissions/${existingSubmission.id}/files/${fileId}`);
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      console.error('❌ Ошибка удаления файла:', err);
      setError('Не удалось удалить файл');
    }
  };

  // Отправка формы с ответом и файлами
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      console.log('📤 Отправка ответа...');
      
      const submissionData = {
        assignment_id: assignmentId,
        answer_text: answerText,
      };

      let submission;

      if (existingSubmission?.id) {
        // Обновляем существующий ответ
        console.log('✏️ Обновление ответа:', existingSubmission.id);
        const res = await axios.put(`/api/submissions/${existingSubmission.id}`, submissionData);
        submission = res.data;
      } else {
        // Создаём новый ответ
        console.log('🆕 Создание нового ответа');
        const res = await axios.post('/api/submissions', submissionData);
        submission = res.data;
      }

      console.log('✅ Ответ сохранён, ID:', submission.id);

      // Загружаем новые файлы, если они есть
      if (files.length > 0) {
        console.log('📁 Загрузка файлов:', files.map(f => f.name));
        
        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);
          
          // ✅ ВАЖНО: Правильный URL — множественное число + слеш
          const uploadUrl = `/api/submissions/${submission.id}/files`;
          console.log('🔗 Загрузка файла по URL:', uploadUrl);
          
          await axios.post(
            uploadUrl,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' }}
          );
          console.log('✅ Файл загружен:', file.name);
        }
      }

      console.log('🎉 Всё успешно!');
      navigate(-1);
      
    } catch (err) {
      console.error('❌ Ошибка отправки:', err);
      
      // Подробная информация об ошибке
      if (err.response) {
        console.error('📋 Ответ сервера:', err.response.status, err.response.data);
        setError(err.response.data?.error || `Ошибка ${err.response.status}`);
      } else if (err.request) {
        console.error('📡 Нет ответа от сервера');
        setError('Сервер не отвечает');
      } else {
        setError(err.message || 'Ошибка отправки ответа');
      }
    } finally {
      setSubmitting(false);
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

  return (
    <div>
      {/* Кнопка назад */}
      <button className="btn btn-outline-primary mb-3" onClick={() => navigate(-1)}>
        <i className="bi bi-arrow-left me-1"></i> Назад
      </button>

      <div className="card">
        <div className="card-header">
          <i className="bi bi-send-fill me-2"></i>
          {existingSubmission ? 'Изменить ответ' : 'Отправить ответ'}
        </div>
        
        <div className="card-body">
          {/* Информация о задании */}
          {assignment && (
            <div className="mb-4 p-3" style={{ background: '#f4f6f9', border: '1px solid var(--border)' }}>
              <h6 className="fw-bold mb-2">{assignment.title}</h6>
              {assignment.description && (
                <p className="text-muted mb-2">{assignment.description}</p>
              )}
              <small className="text-muted d-block">
                <i className="bi bi-trophy me-1"></i> 
                Макс. балл: <strong>{assignment.max_score}</strong>
              </small>
              {assignment.deadline && (
                <small className="text-muted d-block">
                  <i className="bi bi-clock me-1"></i> 
                  Дедлайн: {new Date(assignment.deadline).toLocaleString('ru')}
                </small>
              )}
            </div>
          )}

          {/* Сообщения об ошибках */}
          {error && <div className="alert alert-danger" style={{ borderRadius: 0 }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Текстовый ответ */}
            <div className="mb-4">
              <label className="form-label fw-bold">Ваш ответ *</label>
              <textarea
                className="form-control"
                rows="8"
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Введите ваш ответ здесь..."
                required
              />
            </div>

            {/* Загрузка файлов */}
            <div className="mb-4">
              <label className="form-label fw-bold">Прикрепить файл</label>
              <FileUpload
                onUpload={handleFileUpload}
                uploadedFiles={uploadedFiles}
                onDelete={handleFileDelete}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.zip,.rar,.jpg,.png,.gif"
                maxSize={50}
                multiple={false}
                label="Выбрать файл (до 50MB)"
              />
              
              {/* Отображение файлов, выбранных для отправки */}
              {files.length > 0 && (
                <div className="mt-3 p-2" style={{ background: 'rgba(46, 204, 113, 0.1)', border: '1px solid #2ecc71' }}>
                  <small className="text-success">
                    <i className="bi bi-check-circle me-1"></i>
                    Файлов для отправки: {files.length}
                  </small>
                  <ul className="mb-0 mt-1 small">
                    {files.map((f, i) => (
                      <li key={i}>{f.name} ({formatSize(f.size)})</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Кнопки действий */}
            <div className="d-flex gap-2">
              <button 
                type="submit" 
                className="btn btn-primary flex-grow-1" 
                disabled={submitting || (!answerText.trim() && files.length === 0 && uploadedFiles.length === 0)}
              >
                {submitting ? (
                  <span>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Отправка...
                  </span>
                ) : (
                  <>
                    <i className="bi bi-send me-1"></i> 
                    {existingSubmission ? 'Обновить ответ' : 'Отправить ответ'}
                  </>
                )}
              </button>
              <button 
                type="button" 
                className="btn btn-outline-secondary" 
                onClick={() => navigate(-1)}
                disabled={submitting}
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 🔍 Отладка (удалите в продакшене) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 small">
          <summary>🔍 Debug</summary>
          <pre style={{ background: '#f4f6f9', padding: '10px', fontSize: '11px', overflow: 'auto' }}>
{`existingSubmission: ${JSON.stringify(existingSubmission, null, 2)}
files: ${JSON.stringify(files.map(f => ({name: f.name, size: f.size})), null, 2)}
uploadedFiles: ${JSON.stringify(uploadedFiles.map(f => ({name: f.name, url: f.url})), null, 2)}`}
          </pre>
        </details>
      )}
    </div>
  );
}