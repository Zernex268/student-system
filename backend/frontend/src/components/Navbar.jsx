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
    <nav 
      className="navbar navbar-expand-lg navbar-dark fixed-top"
      style={{ 
        backgroundColor: '#486188',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}
    >
      <div className="container-fluid px-3">
        
        {/* Логотип */}
        <Link className="navbar-brand fw-bold d-flex align-items-center" to="/">
          <i className="bi bi-mortarboard-fill me-2" style={{ fontSize: '1.4rem' }}></i>
          <span className="d-none d-sm-inline">StudentSystem</span>
          <span className="d-sm-none">SS</span>
        </Link>

        {/* Кнопка гамбургер для мобильных */}
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Контент навбара */}
        <div className="collapse navbar-collapse" id="navbarContent">
          
          {/* Ссылки меню (слева) */}
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link 
                className="nav-link text-white px-3" 
                to="/"
                style={{ transition: 'opacity 0.2s' }}
              >
                <i className="bi bi-speedometer2 me-1"></i> Дашборд
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className="nav-link text-white px-3" 
                to="/courses"
                style={{ transition: 'opacity 0.2s' }}
              >
                <i className="bi bi-journal-bookmark-fill me-1"></i> Курсы
              </Link>
            </li>
          </ul>

          {/* Профиль и выход (справа) - ms-auto толкает вправо */}
          <div className="d-flex align-items-center ms-auto">
            {user ? (
              <>
                <span className="text-white me-3 small d-none d-md-block">
                  <i className="bi bi-person-circle me-1"></i>
                  {user.full_name?.split(' ')[0]}
                  <span className="text-white-50 ms-1">
                    ({user.role === 'admin' ? 'Админ' : 'Студент'})
                  </span>
                </span>
                <button 
                  className="btn btn-outline-light btn-sm" 
                  onClick={handleLogout}
                  style={{ 
                    borderRadius: '20px',
                    padding: '4px 16px',
                    fontWeight: '500'
                  }}
                >
                  <i className="bi bi-box-arrow-right me-1"></i> Выйти
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                className="btn btn-outline-light btn-sm"
                style={{ borderRadius: '20px', padding: '4px 16px' }}
              >
                Войти
              </Link>
            )}
          </div>
          
        </div>
      </div>
    </nav>
  );
}