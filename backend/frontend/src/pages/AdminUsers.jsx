import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', role: 'student', full_name: ''
  });
  const [error, setError] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/users');
      setUsers(res.data);
    } catch (err) { console.error(err); }
  };

  const openCreate = () => {
    setEditingUser(null);
    setFormData({ username: '', email: '', password: '', role: 'student', full_name: '' });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setFormData({ username: user.username, email: user.email, password: '', role: user.role, full_name: user.full_name });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingUser) {
        await axios.put(`/api/users/${editingUser.id}`, formData);
      } else {
        await axios.post('/api/users', formData);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка сохранения');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить пользователя?')) return;
    try {
      await axios.delete(`/api/users/${id}`);
      fetchUsers();
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold" style={{ color: '#486188' }}>
          <i className="bi bi-people-fill me-2"></i> Пользователи
        </h3>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-plus-lg me-1"></i> Создать пользователя
        </button>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Имя</th>
                <th>Username</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Дата создания</th>
                <th className="text-end">Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.full_name}</strong></td>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'bg-danger' : 'bg-success'}`}>
                      {u.role === 'admin' ? 'Преподаватель' : 'Студент'}
                    </span>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString('ru')}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(u)}>
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(u.id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingUser ? 'Редактировать пользователя' : 'Новый пользователь'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger">{error}</div>}

                  <div className="mb-3">
                    <label className="form-label fw-bold">Полное имя</label>
                    <input className="form-control" value={formData.full_name}
                      onChange={e => setFormData({...formData, full_name: e.target.value})} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Username</label>
                    <input className="form-control" value={formData.username}
                      onChange={e => setFormData({...formData, username: e.target.value})} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Email</label>
                    <input type="email" className="form-control" value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Пароль {editingUser && '(оставьте пустым, если не меняете)'}
                    </label>
                    <input type="password" className="form-control" value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      required={!editingUser} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Роль</label>
                    <select className="form-select" value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value})}>
                      <option value="student">Студент</option>
                      <option value="admin">Преподаватель</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Отмена</button>
                  <button type="submit" className="btn btn-primary">
                    {editingUser ? 'Сохранить' : 'Создать'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}