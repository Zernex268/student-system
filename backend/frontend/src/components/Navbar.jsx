import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ✅ Экспорт по умолчанию — обязательно для import Navbar from './Navbar'
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
      <div className="container-fluid">
        {/* Логотип */}
        <Link className="navbar-brand fw-bold" to="/">
          <i className="bi bi-mortarboard-fill me-2"></i>
          StudentSystem
        </Link>

        {/* Кнопка гамбургер для мобильных */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Меню */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                <i className="bi bi-speedometer2 me-1"></i> Дашборд
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/courses">
                <i className="bi bi-journal-bookmark-fill me-1"></i> Курсы
              </Link>
            </li>
          </ul>

          {/* Информация о пользователе и выход */}
          {user ? (
            <div className="d-flex align-items-center">
              <span className="text-light me-3 small d-none d-md-block">
                <i className="bi bi-person-circle me-1"></i>
                {user.full_name}
                <span className="text-muted ms-1">
                  ({user.role === 'admin' ? 'Админ' : 'Студент'})
                </span>
              </span>
              <button
                className="btn btn-outline-light btn-sm"
                onClick={handleLogout}
                type="button"
              >
                <i className="bi bi-box-arrow-right me-1"></i>
                Выйти
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-outline-light btn-sm">
              Войти
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}