// backend/frontend/src/pages/AdminCourses.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import FileUpload from '../components/FileUpload';

export default function AdminCourses() {
  // === СОСТОЯНИЯ МОДАЛОК ===
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  // === ДАННЫЕ ===
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [topics, setTopics] = useState({});
  const [lessons, setLessons] = useState({});
  const [assignments, setAssignments] = useState({});
  
  // === НОВОЕ: Файлы для тем и заданий ===
  const [topicFiles, setTopicFiles] = useState({});
  const [assignFiles, setAssignFiles] = useState({});

  // === ФОРМЫ ===
  const [courseForm, setCourseForm] = useState({ title: '', description: '', id: null });
  const [topicForm, setTopicForm] = useState({ title: '', description: '', order_index: 0, course_id: '', id: null });
  const [lessonForm, setLessonForm] = useState({ title: '', content: '', order_index: 0, topic_id: '', id: null });
  const [assignForm, setAssignForm] = useState({ title: '', description: '', max_score: 100, deadline: '', lesson_id: '', id: null });
  const [enrollForm, setEnrollForm] = useState({ student_id: '', course_id: '' });

  // === ЗАГРУЗКА ДАННЫХ ПРИ МОНТИРОВАНИИ ===
  useEffect(() => {
    fetchCourses();
    fetchStudents();
  }, []);

  // === ЗАГРУЗКА ВСЕХ КУРСОВ С ВЛОЖЕННЫМИ ДАННЫМИ ===
  const fetchCourses = async () => {
    try {
      console.log('🔄 Загрузка курсов...');
      const res = await axios.get('/api/courses');
      setCourses(res.data);
      console.log('✅ Курсы загружены:', res.data.length);

      const topicsMap = {};
      const lessonsMap = {};
      const assignMap = {};
      const topicFilesMap = {};
      const assignFilesMap = {};

      for (const course of res.data) {
        console.log(`📚 Курс: ${course.title}`);
        
        // Загружаем темы курса
        const tRes = await axios.get(`/api/topics/course/${course.id}`);
        topicsMap[course.id] = tRes.data;
        console.log(`  Тем: ${tRes.data.length}`);

        for (const topic of tRes.data) {
          // Загружаем файлы темы
          try {
            console.log(`    📁 Загрузка файлов темы ${topic.id}...`);
            const tfRes = await axios.get(`/api/topics/${topic.id}/files`);
            // ✅ Нормализуем данные файлов
            topicFilesMap[topic.id] = (tfRes.data || []).map(f => ({
              id: f.id,
              name: f.file_name || f.name,
              url: f.file_path?.startsWith('http') ? f.file_path : `http://localhost:5000${f.file_path || f.url}`,
              size: f.file_size || f.size,
              mime_type: f.mime_type,
              uploader_name: f.uploader_name
            }));
            console.log(`    ✅ Файлов темы: ${topicFilesMap[topic.id].length}`);
          } catch (err) {
            console.warn(`    ⚠️ Не удалось загрузить файлы темы ${topic.id}:`, err.message);
            topicFilesMap[topic.id] = [];
          }

          // Загружаем уроки темы
          const lRes = await axios.get(`/api/lessons/topic/${topic.id}`);
          lessonsMap[topic.id] = lRes.data;
          console.log(`    Уроков: ${lRes.data.length}`);

          for (const lesson of lRes.data) {
            // Загружаем задания урока
            const aRes = await axios.get(`/api/assignments/lesson/${lesson.id}`);
            assignMap[lesson.id] = aRes.data;
            console.log(`      Заданий: ${aRes.data.length}`);

            // Загружаем файлы заданий
            for (const assign of aRes.data) {
              try {
                console.log(`        📁 Загрузка файлов задания ${assign.id}...`);
                const afRes = await axios.get(`/api/assignments/${assign.id}/files`);
                // ✅ Нормализуем данные файлов
                assignFilesMap[assign.id] = (afRes.data || []).map(f => ({
                  id: f.id,
                  name: f.file_name || f.name,
                  url: f.file_path?.startsWith('http') ? f.file_path : `http://localhost:5000${f.file_path || f.url}`,
                  size: f.file_size || f.size,
                  mime_type: f.mime_type,
                  uploader_name: f.uploader_name
                }));
                console.log(`        ✅ Файлов задания: ${assignFilesMap[assign.id].length}`);
              } catch (err) {
                console.warn(`        ⚠️ Не удалось загрузить файлы задания ${assign.id}:`, err.message);
                assignFilesMap[assign.id] = [];
              }
            }
          }
        }
      }

      setTopics(topicsMap);
      setLessons(lessonsMap);
      setAssignments(assignMap);
      setTopicFiles(topicFilesMap);
      setAssignFiles(assignFilesMap);
      
      console.log('✅ Все данные загружены!');
      
    } catch (err) {
      console.error('❌ Ошибка загрузки курсов:', err);
    }
  };

  // === ЗАГРУЗКА СТУДЕНТОВ (для записи на курс) ===
  const fetchStudents = async () => {
    try {
      const res = await axios.get('/api/users');
      setStudents(res.data.filter(u => u.role === 'student'));
    } catch (err) {
      console.error('Ошибка загрузки студентов:', err);
    }
  };

  // ============================================
  // === ОБРАБОТЧИКИ: COURSE CRUD ===
  // ============================================
  const handleCourseSave = async (e) => {
    e.preventDefault();
    try {
      if (courseForm.id) {
        await axios.put(`/api/courses/${courseForm.id}`, courseForm);
      } else {
        await axios.post('/api/courses', courseForm);
      }
      setShowCourseModal(false);
      setCourseForm({ title: '', description: '', id: null });
      fetchCourses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Удалить курс и все связанные данные?')) return;
    await axios.delete(`/api/courses/${id}`);
    fetchCourses();
  };

  // ============================================
  // === ОБРАБОТЧИКИ: TOPIC CRUD ===
  // ============================================
  const handleTopicSave = async (e) => {
    e.preventDefault();
    try {
      if (topicForm.id) {
        await axios.put(`/api/topics/${topicForm.id}`, topicForm);
      } else {
        await axios.post('/api/topics', topicForm);
      }
      setShowTopicModal(false);
      setTopicForm({ title: '', description: '', order_index: 0, course_id: '', id: null });
      fetchCourses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTopic = async (id) => {
    if (!window.confirm('Удалить тему?')) return;
    await axios.delete(`/api/topics/${id}`);
    fetchCourses();
  };

  // ============================================
  // === ОБРАБОТЧИКИ: LESSON CRUD ===
  // ============================================
  const handleLessonSave = async (e) => {
    e.preventDefault();
    try {
      if (lessonForm.id) {
        await axios.put(`/api/lessons/${lessonForm.id}`, lessonForm);
      } else {
        await axios.post('/api/lessons', lessonForm);
      }
      setShowLessonModal(false);
      setLessonForm({ title: '', content: '', order_index: 0, topic_id: '', id: null });
      fetchCourses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLesson = async (id) => {
    if (!window.confirm('Удалить урок?')) return;
    await axios.delete(`/api/lessons/${id}`);
    fetchCourses();
  };

  // ============================================
  // === ОБРАБОТЧИКИ: ASSIGNMENT CRUD ===
  // ============================================
  const handleAssignSave = async (e) => {
    e.preventDefault();
    try {
      if (assignForm.id) {
        await axios.put(`/api/assignments/${assignForm.id}`, assignForm);
      } else {
        await axios.post('/api/assignments', assignForm);
      }
      setShowAssignModal(false);
      setAssignForm({ title: '', description: '', max_score: 100, deadline: '', lesson_id: '', id: null });
      fetchCourses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAssign = async (id) => {
    if (!window.confirm('Удалить задание?')) return;
    await axios.delete(`/api/assignments/${id}`);
    fetchCourses();
  };

  // ============================================
  // === ОБРАБОТЧИКИ: ENROLLMENT ===
  // ============================================
  const handleEnroll = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/courses/${enrollForm.course_id}/enroll`, { 
        student_id: enrollForm.student_id 
      });
      setShowEnrollModal(false);
      setEnrollForm({ student_id: '', course_id: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnenroll = async (courseId, studentId) => {
    if (!window.confirm('Отчислить студента?')) return;
    await axios.delete(`/api/courses/${courseId}/enroll/${studentId}`);
    fetchCourses();
  };

  // ============================================
  // === НОВЫЕ ФУНКЦИИ: ЗАГРУЗКА ФАЙЛОВ ===
  // ============================================
  
  // Загрузка файла в тему
  const handleTopicFileUpload = async (topicId, fileList) => {
    if (!fileList || fileList.length === 0) return;
    
    const formData = new FormData();
    formData.append('file', fileList[0]);
    
    const res = await axios.post(
      `/api/topics/${topicId}/files`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' }}
    );
    
    // ✅ Нормализуем ответ и обновляем стейт
    const normalizedFile = {
      id: res.data.id,
      name: res.data.file_name || res.data.name,
      url: res.data.file_path?.startsWith('http') ? res.data.file_path : `http://localhost:5000${res.data.file_path || res.data.url}`,
      size: res.data.file_size || res.data.size,
      mime_type: res.data.mime_type,
      uploader_name: res.data.uploader_name
    };
    
    setTopicFiles(prev => ({
      ...prev,
      [topicId]: [...(prev[topicId] || []), normalizedFile]
    }));
  };

  // Загрузка файла в задание
  const handleAssignFileUpload = async (assignId, fileList) => {
    if (!fileList || fileList.length === 0) return;
    
    const formData = new FormData();
    formData.append('file', fileList[0]);
    
    const res = await axios.post(
      `/api/assignments/${assignId}/files`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' }}
    );
    
    // ✅ Нормализуем ответ и обновляем стейт
    const normalizedFile = {
      id: res.data.id,
      name: res.data.file_name || res.data.name,
      url: res.data.file_path?.startsWith('http') ? res.data.file_path : `http://localhost:5000${res.data.file_path || res.data.url}`,
      size: res.data.file_size || res.data.size,
      mime_type: res.data.mime_type,
      uploader_name: res.data.uploader_name
    };
    
    setAssignFiles(prev => ({
      ...prev,
      [assignId]: [...(prev[assignId] || []), normalizedFile]
    }));
  };

  // Удаление файла (из темы или задания)
  const handleFileDelete = async (type, parentId, fileId) => {
    if (!window.confirm('Удалить этот файл?')) return;
    
    try {
      await axios.delete(`/api/${type}/${parentId}/files/${fileId}`);
      
      if (type === 'topics') {
        setTopicFiles(prev => ({
          ...prev,
          [parentId]: (prev[parentId] || []).filter(f => f.id !== fileId)
        }));
      } else {
        setAssignFiles(prev => ({
          ...prev,
          [parentId]: (prev[parentId] || []).filter(f => f.id !== fileId)
        }));
      }
    } catch (err) {
      console.error('Ошибка удаления файла:', err);
      alert('Не удалось удалить файл');
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

  // ============================================
  // === JSX: ОТРИСОВКА ===
  // ============================================
  return (
    <div>
      {/* Заголовок + кнопки */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h3 className="fw-bold mb-0" style={{ color: '#486188' }}>
          <i className="bi bi-collection-fill me-2"></i> Управление курсами
        </h3>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary" onClick={() => setShowEnrollModal(true)}>
            <i className="bi bi-person-plus me-1"></i> Записать на курс
          </button>
          <button className="btn btn-primary" onClick={() => {
            setCourseForm({ title: '', description: '', id: null });
            setShowCourseModal(true);
          }}>
            <i className="bi bi-plus-lg me-1"></i> Новый курс
          </button>
        </div>
      </div>

      {/* Список курсов */}
      {courses.map(course => (
        <div key={course.id} className="card mb-4">
          <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
            <span className="flex-grow-1 text-truncate" style={{ minWidth: 0 }}>
              <i className="bi bi-journal me-2"></i>
              {course.title}
            </span>
            <div className="d-flex gap-1 flex-shrink-0">
              <button 
                className="btn btn-sm btn-outline-light me-1" 
                onClick={() => {
                  setCourseForm({ title: course.title, description: course.description, id: course.id });
                  setShowCourseModal(true);
                }}
              >
                <i className="bi bi-pencil"></i>
              </button>
              <button 
                className="btn btn-sm btn-outline-danger" 
                onClick={() => handleDeleteCourse(course.id)}
              >
                <i className="bi bi-trash"></i>
              </button>
            </div>
          </div>
          
          <div className="card-body">
            <p className="text-muted">{course.description}</p>
            <small className="text-muted">
              Студентов: {course.student_count || 0}
            </small>

            {/* === РАЗДЕЛ: ТЕМЫ === */}
            <div className="mt-4">
              <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                <h6 className="fw-bold mb-0" style={{ color: '#486188' }}>Темы</h6>
                <button 
                  className="btn btn-sm btn-outline-primary flex-shrink-0" 
                  onClick={() => {
                    setTopicForm({ title: '', description: '', order_index: 0, course_id: course.id, id: null });
                    setShowTopicModal(true);
                  }}
                >
                  <i className="bi bi-plus me-1"></i> Тема
                </button>
              </div>

              {topics[course.id]?.map(topic => (
                <div key={topic.id} className="topic-section mb-3">
                  {/* Заголовок темы + кнопки */}
                  <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <strong className="d-flex align-items-center flex-grow-1 text-truncate" style={{ minWidth: 0 }}>
                      <i className="bi bi-folder2 me-2" style={{ color: '#486188' }}></i>
                      {topic.title}
                    </strong>
                    <div className="d-flex gap-1 flex-shrink-0 flex-wrap">
                      <button 
                        className="btn btn-sm btn-outline-primary me-1" 
                        onClick={() => {
                          setTopicForm({ ...topic, id: topic.id });
                          setShowTopicModal(true);
                        }}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger me-1" 
                        onClick={() => handleDeleteTopic(topic.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                      <button 
                        className="btn btn-sm btn-primary" 
                        onClick={() => {
                          setLessonForm({ title: '', content: '', order_index: 0, topic_id: topic.id, id: null });
                          setShowLessonModal(true);
                        }}
                      >
                        <i className="bi bi-plus me-1"></i> Урок
                      </button>
                    </div>
                  </div>

                  {/* === НОВОЕ: Файлы темы === */}
                  <div className="ps-4 mb-3">
                    {/* Список существующих файлов */}
                    {topicFiles[topic.id] && topicFiles[topic.id].length > 0 && (
                      <div className="mb-2">
                        <small className="text-muted d-block mb-1 fw-bold">
                          <i className="bi bi-paperclip me-1"></i>Файлы темы:
                        </small>
                        {topicFiles[topic.id].map((file, index) => (
                          <div 
                            key={file.id || index} 
                            className="d-flex align-items-center justify-content-between small py-1 flex-wrap gap-2"
                            style={{ borderBottom: '1px dashed var(--border)' }}
                          >
                            <a 
                              href={file.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-decoration-none"
                              style={{ color: '#486188', fontWeight: 500 }}
                              download={file.name}
                            >
                              <i className="bi bi-file-earmark me-1"></i>
                              {file.name}
                            </a>
                            <div className="d-flex align-items-center gap-2">
                              <small className="text-muted">{formatSize(file.size)}</small>
                              <button 
                                className="btn btn-sm btn-outline-danger py-0 px-2"
                                onClick={() => handleFileDelete('topics', topic.id, file.id)}
                                title="Удалить"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Компонент загрузки нового файла */}
                    <FileUpload
                      onUpload={(files) => handleTopicFileUpload(topic.id, files)}
                      label="+ Добавить файл в тему"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.txt,.md"
                      maxSize={100}
                      multiple={false}
                    />
                  </div>

                  {/* === УРОКИ ТЕМЫ === */}
                  {lessons[topic.id]?.map(lesson => (
                    <div key={lesson.id} className="lesson-item ms-4 mt-2 mb-2 p-2" 
                         style={{ background: 'rgba(72,97,136,0.04)', borderLeft: '3px solid #486188' }}>
                      
                      {/* Заголовок урока + кнопки */}
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <span className="d-flex align-items-center flex-grow-1 text-truncate" style={{ minWidth: 0 }}>
                          <i className="bi bi-play-circle me-2" style={{ color: '#486188' }}></i>
                          {lesson.title}
                        </span>
                        <div className="d-flex gap-1 flex-shrink-0 flex-wrap">
                          <button 
                            className="btn btn-sm btn-outline-primary me-1" 
                            onClick={() => {
                              setLessonForm({ ...lesson, id: lesson.id });
                              setShowLessonModal(true);
                            }}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger me-1" 
                            onClick={() => handleDeleteLesson(lesson.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-primary" 
                            onClick={() => {
                              setAssignForm({ title: '', description: '', max_score: 100, deadline: '', lesson_id: lesson.id, id: null });
                              setShowAssignModal(true);
                            }}
                          >
                            <i className="bi bi-plus me-1"></i> Задание
                          </button>
                        </div>
                      </div>

                      {/* === ЗАДАНИЯ УРОКА === */}
                      {assignments[lesson.id]?.map(assign => (
                        <div key={assign.id} className="assignment-item ms-4 mt-2 mb-2 p-2"
                             style={{ background: 'rgba(72,97,136,0.08)', border: '1px solid var(--border)' }}>
                          
                          {/* Заголовок задания + кнопки */}
                          <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                            <span className="d-flex align-items-center flex-grow-1 text-truncate" style={{ minWidth: 0 }}>
                              <i className="bi bi-clipboard-check me-2" style={{ color: '#486188' }}></i>
                              <strong className="text-truncate">{assign.title}</strong>
                              <small className="text-muted ms-2 flex-shrink-0">
                                (макс. {assign.max_score} бал.)
                              </small>
                            </span>
                            <div className="d-flex gap-1 flex-shrink-0">
                              <button 
                                className="btn btn-sm btn-outline-primary me-1" 
                                onClick={() => {
                                  setAssignForm({ ...assign, id: assign.id });
                                  setShowAssignModal(true);
                                }}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-danger" 
                                onClick={() => handleDeleteAssign(assign.id)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </div>

                          {/* === НОВОЕ: Файлы задания === */}
                          <div className="ps-3">
                            {/* Список существующих файлов */}
                            {assignFiles[assign.id] && assignFiles[assign.id].length > 0 && (
                              <div className="mb-2">
                                <small className="text-muted d-block mb-1 fw-bold">
                                  <i className="bi bi-paperclip me-1"></i>Материалы:
                                </small>
                                {assignFiles[assign.id].map((file, index) => (
                                  <div 
                                    key={file.id || index} 
                                    className="d-flex align-items-center justify-content-between small py-1 flex-wrap gap-2"
                                    style={{ borderBottom: '1px dashed var(--border)' }}
                                  >
                                    <a 
                                      href={file.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-decoration-none"
                                      style={{ color: '#486188', fontWeight: 500 }}
                                      download={file.name}
                                    >
                                      <i className="bi bi-file-earmark me-1"></i>
                                      {file.name}
                                    </a>
                                    <div className="d-flex align-items-center gap-2">
                                      <small className="text-muted">{formatSize(file.size)}</small>
                                      <button 
                                        className="btn btn-sm btn-outline-danger py-0 px-2"
                                        onClick={() => handleFileDelete('assignments', assign.id, file.id)}
                                        title="Удалить"
                                      >
                                        <i className="bi bi-trash"></i>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Компонент загрузки нового файла */}
                            <FileUpload
                              onUpload={(files) => handleAssignFileUpload(assign.id, files)}
                              label="+ Добавить материал"
                              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.mp4,.mp3,.txt,.md"
                              maxSize={100}
                              multiple={false}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* ============================================ */}
      {/* === МОДАЛКИ === */}
      {/* ============================================ */}

      {/* Course Modal */}
      {showCourseModal && (
        <ModalWrapper title={courseForm.id ? 'Редактировать курс' : 'Новый курс'} onClose={() => setShowCourseModal(false)}>
          <form onSubmit={handleCourseSave}>
            <div className="mb-3">
              <label className="form-label fw-bold">Название</label>
              <input className="form-control" value={courseForm.title}
                onChange={e => setCourseForm({...courseForm, title: e.target.value})} required />
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Описание</label>
              <textarea className="form-control" rows="3" value={courseForm.description}
                onChange={e => setCourseForm({...courseForm, description: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary">Сохранить</button>
          </form>
        </ModalWrapper>
      )}

      {/* Topic Modal */}
      {showTopicModal && (
        <ModalWrapper title={topicForm.id ? 'Редактировать тему' : 'Новая тема'} onClose={() => setShowTopicModal(false)}>
          <form onSubmit={handleTopicSave}>
            <div className="mb-3">
              <label className="form-label fw-bold">Название</label>
              <input className="form-control" value={topicForm.title}
                onChange={e => setTopicForm({...topicForm, title: e.target.value})} required />
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Описание</label>
              <textarea className="form-control" rows="2" value={topicForm.description}
                onChange={e => setTopicForm({...topicForm, description: e.target.value})} />
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Порядок</label>
              <input type="number" className="form-control" value={topicForm.order_index}
                onChange={e => setTopicForm({...topicForm, order_index: parseInt(e.target.value)})} />
            </div>
            <button type="submit" className="btn btn-primary">Сохранить</button>
          </form>
        </ModalWrapper>
      )}

      {/* Lesson Modal */}
      {showLessonModal && (
        <ModalWrapper title={lessonForm.id ? 'Редактировать урок' : 'Новый урок'} onClose={() => setShowLessonModal(false)}>
          <form onSubmit={handleLessonSave}>
            <div className="mb-3">
              <label className="form-label fw-bold">Название</label>
              <input className="form-control" value={lessonForm.title}
                onChange={e => setLessonForm({...lessonForm, title: e.target.value})} required />
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Содержание (HTML)</label>
              <textarea className="form-control" rows="5" value={lessonForm.content}
                onChange={e => setLessonForm({...lessonForm, content: e.target.value})} />
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Порядок</label>
              <input type="number" className="form-control" value={lessonForm.order_index}
                onChange={e => setLessonForm({...lessonForm, order_index: parseInt(e.target.value)})} />
            </div>
            <button type="submit" className="btn btn-primary">Сохранить</button>
          </form>
        </ModalWrapper>
      )}

      {/* Assignment Modal */}
      {showAssignModal && (
        <ModalWrapper title={assignForm.id ? 'Редактировать задание' : 'Новое задание'} onClose={() => setShowAssignModal(false)}>
          <form onSubmit={handleAssignSave}>
            <div className="mb-3">
              <label className="form-label fw-bold">Название</label>
              <input className="form-control" value={assignForm.title}
                onChange={e => setAssignForm({...assignForm, title: e.target.value})} required />
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Описание</label>
              <textarea className="form-control" rows="3" value={assignForm.description}
                onChange={e => setAssignForm({...assignForm, description: e.target.value})} />
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Дедлайн</label>
              <input type="datetime-local" className="form-control" value={assignForm.deadline?.substring(0, 16) || ''}
                onChange={e => setAssignForm({...assignForm, deadline: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary">Сохранить</button>
          </form>
        </ModalWrapper>
      )}

      {/* Enroll Modal */}
      {showEnrollModal && (
        <ModalWrapper title="Записать студента на курс" onClose={() => setShowEnrollModal(false)}>
          <form onSubmit={handleEnroll}>
            <div className="mb-3">
              <label className="form-label fw-bold">Курс</label>
              <select className="form-select" value={enrollForm.course_id}
                onChange={e => setEnrollForm({...enrollForm, course_id: e.target.value})} required>
                <option value="">Выберите курс</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Студент</label>
              <select className="form-select" value={enrollForm.student_id}
                onChange={e => setEnrollForm({...enrollForm, student_id: e.target.value})} required>
                <option value="">Выберите студента</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Записать</button>
          </form>
        </ModalWrapper>
      )}
    </div>
  );
}

// ============================================
// === ВСПОМОГАТЕЛЬНЫЙ КОМПОНЕНТ: MODAL ===
// ============================================
function ModalWrapper({ title, children, onClose }) {
  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </div>
  );
}