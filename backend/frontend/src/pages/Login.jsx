import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="text-center mb-4">
          <i className="bi bi-mortarboard-fill" style={{ fontSize: '3rem', color: '#486188' }}></i>
          <h2 className="mt-2">StudentSystem</h2>
          <p className="text-muted">Система сдачи работ для студентов</p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ borderRadius: 0 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-bold">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="student@example.com"
            />
          </div>

          <div className="mb-4">
            <label className="form-label fw-bold">Пароль</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
            {loading ? (
              <span>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Вход...
              </span>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right me-2"></i> Войти
              </>
            )}
          </button>
        </form>

        <div className="mt-4 p-3" style={{ background: '#f4f6f9', border: '1px solid #dee2e6' }}>
          <small className="text-muted">
            <strong>Демо доступ:</strong><br />
            Админ: admin@school.com / admin123<br />
            Студент: student@school.com / student123
          </small>
        </div>
      </div>
    </div>
  );
}