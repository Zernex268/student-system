import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    // Используем ваш фирменный цвет вместо bg-dark
    <nav className="navbar navbar-expand-lg" style={{ backgroundColor: '#486188', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div className="container-fluid">
        
        {/* Логотип */}
        <Link className="navbar-brand text-white fw-bold d-flex align-items-center" to="/">
          <i className="bi bi-mortarboard-fill me-2" style={{ fontSize: '1.5rem' }}></i>
          StudentSystem
        </Link>

        {/* Кнопка для мобильных */}
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <i className="bi bi-list text-white fs-4"></i>
        </button>

        {/* Основное меню */}
        <div className="collapse navbar-collapse" id="navbarNav">
          {/* Ссылки слева */}
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link text-white opacity-75 hover-opacity-100" to="/">
                <i className="bi bi-speedometer2 me-1"></i> Дашборд
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white opacity-75" to="/courses">
                <i className="bi bi-journal-bookmark-fill me-1"></i> Курсы
              </Link>
            </li>
          </ul>

          {/* Блок справа (ms-auto отодвигает его в конец) */}
          <div className="d-flex align-items-center ms-auto">
            {user ? (
              <>
                <span className="text-white me-3 small d-none d-md-block opacity-75">
                  <i className="bi bi-person-circle me-1"></i>
                  {user.full_name}
                  <span className="ms-1 opacity-50">({user.role === 'admin' ? 'Админ' : 'Студент'})</span>
                </span>
                <button 
                  className="btn btn-outline-light btn-sm" 
                  onClick={handleLogout}
                  style={{ borderRadius: '20px', padding: '5px 15px' }}
                >
                  <i className="bi bi-box-arrow-right me-1"></i> Выйти
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-outline-light btn-sm">
                Войти
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}