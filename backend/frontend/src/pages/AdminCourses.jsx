import React, { useEffect, useState } from 'react';
import axios from 'axios';
import FileUpload from '../components/FileUpload';

// 🔥 НАДЕЖНОЕ определение адреса бэкенда
const getApiUrl = () => {
  // Если мы на продакшене (vercel.app) — используем Railway
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://believable-blessing-production.up.railway.app';
  }
  // Локально — localhost
  return 'http://localhost:5000';
};

const API_URL = getApiUrl();

// 🔥 Функция для исправления любых URL файлов
const normalizeFileUrl = (filePath) => {
  if (!filePath) return '';
  
  // Если уже https://railway.app — оставляем как есть
  if (filePath.includes('railway.app')) {
    return filePath;
  }
  
  // Заменяем любой localhost:5000 на актуальный API_URL
  return filePath.replace(/http:\/\/localhost:5000/g, API_URL.replace(/\/$/, ''));
};

export default function AdminCourses() {
  // Для отладки — выводим API_URL в консоль
  useEffect(() => {
    console.log('🔗 API_URL установлен:', API_URL);
  }, []);

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [topics, setTopics] = useState({});
  const [lessons, setLessons] = useState({});
  const [assignments, setAssignments] = useState({});
  const [topicFiles, setTopicFiles] = useState({});
  const [assignFiles, setAssignFiles] = useState({});

  const [courseForm, setCourseForm] = useState({ title: '', description: '', id: null });
  const [topicForm, setTopicForm] = useState({ title: '', description: '', order_index: 0, course_id: '', id: null });
  const [lessonForm, setLessonForm] = useState({ title: '', content: '', order_index: 0, topic_id: '', id: null });
  const [assignForm, setAssignForm] = useState({ title: '', description: '', max_score: 100, deadline: '', lesson_id: '', id: null });
  const [enrollForm, setEnrollForm] = useState({ student_id: '', course_id: '' });

  useEffect(() => {
    fetchCourses();
    fetchStudents();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await axios.get('/api/courses');
      setCourses(res.data);

      const topicsMap = {};
      const lessonsMap = {};
      const assignMap = {};
      const topicFilesMap = {};
      const assignFilesMap = {};

      for (const course of res.data) {
        const tRes = await axios.get(`/api/topics/course/${course.id}`);
        topicsMap[course.id] = tRes.data;

        for (const topic of tRes.data) {
          try {
            const tfRes = await axios.get(`/api/topics/${topic.id}/files`);
            topicFilesMap[topic.id] = (tfRes.data || []).map(f => ({
              id: f.id,
              name: f.file_name || f.name || 'Без названия',
              // 🔥 Используем надежную нормализацию
              url: normalizeFileUrl(f.file_path || f.url),
              size: f.file_size || f.size || 0
            }));
          } catch (err) { topicFilesMap[topic.id] = []; }

          const lRes = await axios.get(`/api/lessons/topic/${topic.id}`);
          lessonsMap[topic.id] = lRes.data;

          for (const lesson of lRes.data) {
            const aRes = await axios.get(`/api/assignments/lesson/${lesson.id}`);
            assignMap[lesson.id] = aRes.data;

            for (const assign of aRes.data) {
              try {
                const afRes = await axios.get(`/api/assignments/${assign.id}/files`);
                assignFilesMap[assign.id] = (afRes.data || []).map(f => ({
                  id: f.id,
                  name: f.file_name || f.name || 'Без названия',
                  // 🔥 Используем надежную нормализацию
                  url: normalizeFileUrl(f.file_path || f.url),
                  size: f.file_size || f.size || 0
                }));
              } catch (err) { assignFilesMap[assign.id] = []; }
            }
          }
        }
      }
      setTopics(topicsMap);
      setLessons(lessonsMap);
      setAssignments(assignMap);
      setTopicFiles(topicFilesMap);
      setAssignFiles(assignFilesMap);
    } catch (err) { console.error('Ошибка загрузки курсов:', err); }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get('/api/users');
      setStudents(res.data.filter(u => u.role === 'student'));
    } catch (err) { console.error(err); }
  };

  const handleCourseSave = async (e) => {
    e.preventDefault();
    try {
      if (courseForm.id) await axios.put(`/api/courses/${courseForm.id}`, courseForm);
      else await axios.post('/api/courses', courseForm);
      setShowCourseModal(false);
      setCourseForm({ title: '', description: '', id: null });
      fetchCourses();
    } catch (err) { console.error(err); }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Удалить курс?')) return;
    await axios.delete(`/api/courses/${id}`);
    fetchCourses();
  };

  const handleTopicSave = async (e) => {
    e.preventDefault();
    try {
      if (topicForm.id) await axios.put(`/api/topics/${topicForm.id}`, topicForm);
      else await axios.post('/api/topics', topicForm);
      setShowTopicModal(false);
      setTopicForm({ title: '', description: '', order_index: 0, course_id: '', id: null });
      fetchCourses();
    } catch (err) { console.error(err); }
  };

  const handleDeleteTopic = async (id) => {
    if (!window.confirm('Удалить тему?')) return;
    await axios.delete(`/api/topics/${id}`);
    fetchCourses();
  };

  const handleLessonSave = async (e) => {
    e.preventDefault();
    try {
      if (lessonForm.id) await axios.put(`/api/lessons/${lessonForm.id}`, lessonForm);
      else await axios.post('/api/lessons', lessonForm);
      setShowLessonModal(false);
      setLessonForm({ title: '', content: '', order_index: 0, topic_id: '', id: null });
      fetchCourses();
    } catch (err) { console.error(err); }
  };

  const handleDeleteLesson = async (id) => {
    if (!window.confirm('Удалить урок?')) return;
    await axios.delete(`/api/lessons/${id}`);
    fetchCourses();
  };

  const handleAssignSave = async (e) => {
    e.preventDefault();
    try {
      if (assignForm.id) await axios.put(`/api/assignments/${assignForm.id}`, assignForm);
      else await axios.post('/api/assignments', assignForm);
      setShowAssignModal(false);
      setAssignForm({ title: '', description: '', max_score: 100, deadline: '', lesson_id: '', id: null });
      fetchCourses();
    } catch (err) { console.error(err); }
  };

  const handleDeleteAssign = async (id) => {
    if (!window.confirm('Удалить задание?')) return;
    await axios.delete(`/api/assignments/${id}`);
    fetchCourses();
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/courses/${enrollForm.course_id}/enroll`, { student_id: enrollForm.student_id });
      setShowEnrollModal(false);
      setEnrollForm({ student_id: '', course_id: '' });
    } catch (err) { console.error(err); }
  };

  // 🔥 Загрузка файла в тему
  const handleTopicFileUpload = async (topicId, fileList) => {
    if (!fileList || fileList.length === 0) {
      alert('Выберите файл');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', fileList[0]);
      const res = await axios.post(`/api/topics/${topicId}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const uploaded = res.data;
      const newFile = {
        id: uploaded.id,
        name: uploaded.file_name || uploaded.name || fileList[0].name,
        // 🔥 Надежная нормализация URL
        url: normalizeFileUrl(uploaded.file_path || uploaded.url),
        size: uploaded.file_size || uploaded.size || fileList[0].size
      };
      
      setTopicFiles(prev => ({
        ...prev,
        [topicId]: [...(prev[topicId] || []), newFile]
      }));
      await fetchCourses();
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      alert('Не удалось загрузить файл: ' + (err.response?.data?.error || err.message));
    }
  };

  // 🔥 Загрузка файла в задание
  const handleAssignFileUpload = async (assignId, fileList) => {
    if (!fileList || fileList.length === 0) {
      alert('Выберите файл');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', fileList[0]);
      const res = await axios.post(`/api/assignments/${assignId}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const uploaded = res.data;
      const newFile = {
        id: uploaded.id,
        name: uploaded.file_name || uploaded.name || fileList[0].name,
        // 🔥 Надежная нормализация URL
        url: normalizeFileUrl(uploaded.file_path || uploaded.url),
        size: uploaded.file_size || uploaded.size || fileList[0].size
      };
      
      setAssignFiles(prev => ({
        ...prev,
        [assignId]: [...(prev[assignId] || []), newFile]
      }));
      await fetchCourses();
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      alert('Не удалось загрузить файл: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleFileDelete = async (type, parentId, fileId) => {
    if (!window.confirm('Удалить файл?')) return;
    try {
      await axios.delete(`/api/${type}/${parentId}/files/${fileId}`);
      if (type === 'topics') {
        setTopicFiles(prev => ({ ...prev, [parentId]: (prev[parentId] || []).filter(f => f.id !== fileId) }));
      } else {
        setAssignFiles(prev => ({ ...prev, [parentId]: (prev[parentId] || []).filter(f => f.id !== fileId) }));
      }
      await fetchCourses();
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Не удалось удалить файл');
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="container-fluid px-3">
      {/* Заголовок страницы */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <h3 className="fw-bold mb-0 text-truncate" style={{ color: '#486188', maxWidth: '100%' }}>
          <i className="bi bi-collection-fill me-2"></i> Управление курсами
        </h3>
        <div className="d-flex gap-2 flex-shrink-0">
          <button className="btn btn-outline-primary btn-sm" onClick={() => setShowEnrollModal(true)}>
            <i className="bi bi-person-plus me-1"></i> <span className="d-none d-md-inline">Записать</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => { setCourseForm({ title: '', description: '', id: null }); setShowCourseModal(true); }}>
            <i className="bi bi-plus-lg me-1"></i> <span className="d-none d-md-inline">Курс</span>
          </button>
        </div>
      </div>

      {courses.map(course => (
        <div key={course.id} className="card mb-3 shadow-sm" style={{ overflow: 'hidden' }}>
          {/* Курс: Заголовок + Кнопки */}
          <div className="card-header d-flex flex-wrap align-items-center gap-2 py-2" style={{ background: '#486188', color: 'white' }}>
            <h5 className="mb-0 flex-grow-1 text-truncate" style={{ minWidth: 0, fontSize: '1rem', color: 'white' }}>
              <i className="bi bi-journal me-2"></i> {course.title}
            </h5>
            <div className="d-flex gap-1 flex-shrink-0">
              <button className="btn btn-sm btn-light" onClick={() => { setCourseForm({ title: course.title, description: course.description, id: course.id }); setShowCourseModal(true); }}>
                <i className="bi bi-pencil"></i>
              </button>
              <button className="btn btn-sm btn-light text-danger" onClick={() => handleDeleteCourse(course.id)}>
                <i className="bi bi-trash"></i>
              </button>
            </div>
          </div>
          
          <div className="card-body p-3">
            <p className="text-muted mb-2 small text-break">{course.description}</p>
            
            {/* Темы */}
            <div className="mt-2">
              <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom">
                <span className="fw-bold text-primary small">Темы</span>
                <button className="btn btn-sm btn-outline-primary" onClick={() => { setTopicForm({ title: '', description: '', order_index: 0, course_id: course.id, id: null }); setShowTopicModal(true); }}>
                  <i className="bi bi-plus me-1"></i> Тема
                </button>
              </div>

              {topics[course.id]?.map(topic => (
                <div key={topic.id} className="card mb-2 border-start border-primary border-3">
                  <div className="card-body p-2">
                    {/* Тема: Заголовок + Кнопки */}
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                      <h6 className="mb-0 flex-grow-1 text-break small" style={{ minWidth: 0, fontSize: '0.9rem' }}>
                        <i className="bi bi-folder2-open me-2"></i> {topic.title}
                      </h6>
                      <div className="d-flex gap-1 flex-shrink-0">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => { setTopicForm({ ...topic, id: topic.id }); setShowTopicModal(true); }}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteTopic(topic.id)}>
                          <i className="bi bi-trash"></i>
                        </button>
                        <button className="btn btn-sm btn-success" onClick={() => { setLessonForm({ title: '', content: '', order_index: 0, topic_id: topic.id, id: null }); setShowLessonModal(true); }}>
                          <i className="bi bi-play-circle"></i> Урок
                        </button>
                      </div>
                    </div>

                    {/* Файлы темы */}
                    <div className="ps-3 mb-2">
                      {topicFiles[topic.id]?.slice(0, 3).map(file => (
                        <div key={file.id} className="d-flex justify-content-between align-items-center py-1 small">
                          <a href={file.url} target="_blank" rel="noreferrer" className="text-decoration-none text-primary text-truncate me-2" style={{ maxWidth: '70%' }}>
                            <i className="bi bi-file-earmark me-1"></i> {file.name}
                          </a>
                          <button className="btn btn-sm btn-link text-danger p-0 flex-shrink-0" onClick={() => handleFileDelete('topics', topic.id, file.id)}>
                            <i className="bi bi-x-circle"></i>
                          </button>
                        </div>
                      ))}
                      <FileUpload 
                        onUpload={(files) => handleTopicFileUpload(topic.id, files)} 
                        label="+ Файл" 
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.ppt,.pptx,.txt,.zip,.rar" 
                        maxSize={100} 
                      />
                    </div>

                    {/* Уроки */}
                    {lessons[topic.id]?.map(lesson => (
                      <div key={lesson.id} className="ms-3 ps-2 border-start mb-2" style={{ borderColor: '#e9ecef' }}>
                        <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                          <span className="flex-grow-1 text-break small" style={{ minWidth: 0 }}>
                            <i className="bi bi-play-fill text-success me-1"></i> {lesson.title}
                          </span>
                          <div className="d-flex gap-1 flex-shrink-0">
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => { setLessonForm({ ...lesson, id: lesson.id }); setShowLessonModal(true); }}>
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteLesson(lesson.id)}>
                              <i className="bi bi-trash"></i>
                            </button>
                            <button className="btn btn-sm btn-info text-white" onClick={() => { setAssignForm({ title: '', description: '', max_score: 100, deadline: '', lesson_id: lesson.id, id: null }); setShowAssignModal(true); }}>
                              <i className="bi bi-clipboard-check"></i> Задание
                            </button>
                          </div>
                        </div>

                        {/* Задания */}
                        {assignments[lesson.id]?.map(assign => (
                          <div key={assign.id} className="ms-3 ps-2 border-start mb-2" style={{ borderColor: '#dee2e6' }}>
                            <div className="d-flex flex-wrap align-items-center gap-1 mb-1">
                              <span className="flex-grow-1 fw-bold text-break small" style={{ minWidth: 0 }}>
                                <i className="bi bi-list-task me-1 text-info"></i> {assign.title}
                              </span>
                              <div className="d-flex gap-1 flex-shrink-0">
                                <button className="btn btn-sm btn-outline-secondary" onClick={() => { setAssignForm({ ...assign, id: assign.id }); setShowAssignModal(true); }}>
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteAssign(assign.id)}>
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </div>
                            
                            {/* Файлы задания */}
                            {assignFiles[assign.id]?.slice(0, 2).map(file => (
                              <div key={file.id} className="d-flex justify-content-between align-items-center py-1 ps-3 small">
                                <a href={file.url} target="_blank" rel="noreferrer" className="text-decoration-none text-muted text-truncate me-2" style={{ maxWidth: '70%' }}>
                                  <i className="bi bi-paperclip me-1"></i> {file.name}
                                </a>
                                <button className="btn btn-sm btn-link text-danger p-0 flex-shrink-0" onClick={() => handleFileDelete('assignments', assign.id, file.id)}>
                                  <i className="bi bi-x-circle"></i>
                                </button>
                              </div>
                            ))}
                            <FileUpload 
                              onUpload={(files) => handleAssignFileUpload(assign.id, files)} 
                              label="+ Материал" 
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.ppt,.pptx,.txt,.zip,.rar,.mp4,.mp3" 
                              maxSize={100} 
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* --- MODALS --- */}
      {showCourseModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{courseForm.id ? 'Курс' : 'Новый курс'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowCourseModal(false)}></button>
              </div>
              <form onSubmit={handleCourseSave} className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Название</label>
                  <input className="form-control" value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Описание</label>
                  <textarea className="form-control" rows="3" value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} />
                </div>
                <button type="submit" className="btn btn-primary w-100">Сохранить</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showTopicModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{topicForm.id ? 'Тема' : 'Новая тема'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowTopicModal(false)}></button>
              </div>
              <form onSubmit={handleTopicSave} className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Название</label>
                  <input className="form-control" value={topicForm.title} onChange={e => setTopicForm({...topicForm, title: e.target.value})} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Описание</label>
                  <textarea className="form-control" rows="2" value={topicForm.description} onChange={e => setTopicForm({...topicForm, description: e.target.value})} />
                </div>
                <button type="submit" className="btn btn-primary w-100">Сохранить</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showLessonModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{lessonForm.id ? 'Урок' : 'Новый урок'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowLessonModal(false)}></button>
              </div>
              <form onSubmit={handleLessonSave} className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Название</label>
                  <input className="form-control" value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Содержание</label>
                  <textarea className="form-control" rows="6" value={lessonForm.content} onChange={e => setLessonForm({...lessonForm, content: e.target.value})} />
                </div>
                <button type="submit" className="btn btn-primary w-100">Сохранить</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{assignForm.id ? 'Задание' : 'Новое задание'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowAssignModal(false)}></button>
              </div>
              <form onSubmit={handleAssignSave} className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Название</label>
                  <input className="form-control" value={assignForm.title} onChange={e => setAssignForm({...assignForm, title: e.target.value})} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Описание</label>
                  <textarea className="form-control" rows="3" value={assignForm.description} onChange={e => setAssignForm({...assignForm, description: e.target.value})} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Дедлайн</label>
                  <input type="datetime-local" className="form-control" value={assignForm.deadline?.substring(0, 16) || ''} onChange={e => setAssignForm({...assignForm, deadline: e.target.value})} />
                </div>
                <button type="submit" className="btn btn-primary w-100">Сохранить</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showEnrollModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Запись на курс</h5>
                <button type="button" className="btn-close" onClick={() => setShowEnrollModal(false)}></button>
              </div>
              <form onSubmit={handleEnroll} className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Курс</label>
                  <select className="form-select" value={enrollForm.course_id} onChange={e => setEnrollForm({...enrollForm, course_id: e.target.value})} required>
                    <option value="">Выберите курс</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Студент</label>
                  <select className="form-select" value={enrollForm.student_id} onChange={e => setEnrollForm({...enrollForm, student_id: e.target.value})} required>
                    <option value="">Выберите студента</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary w-100">Записать</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}