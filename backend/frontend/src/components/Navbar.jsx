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
    <>
      <nav className="navbar navbar-expand-lg navbar-dark fixed-top" style={{ backgroundColor: '#486188', minHeight: '56px' }}>
        <div className="container-fluid">
          
          {/* Логотип */}
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <i className="bi bi-mortarboard-fill me-2" style={{ fontSize: '1.5rem' }}></i>
            <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>StudentSystem</span>
          </Link>

          {/* Кнопка меню для мобильных */}
          <button
            className="navbar-toggler border-0 shadow-none"
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
                <Link className="nav-link px-3" to="/">
                  <i className="bi bi-speedometer2 me-1"></i> Дашборд
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link px-3" to="/courses">
                  <i className="bi bi-journal-bookmark-fill me-1"></i> Курсы
                </Link>
              </li>
            </ul>

            {/* Профиль и выход (справа) */}
            <div className="d-flex align-items-center gap-2">
              {user ? (
                <>
                  <span className="text-white-50 small d-none d-md-inline">
                    <i className="bi bi-person-circle me-1"></i>
                    {user.full_name?.split(' ')[0]}
                    <span className="ms-1 opacity-75">
                      ({user.role === 'admin' ? 'Админ' : 'Студент'})
                    </span>
                  </span>
                  <button 
                    className="btn btn-outline-light btn-sm d-flex align-items-center gap-1" 
                    onClick={handleLogout}
                    style={{ borderRadius: '6px', padding: '4px 12px' }}
                  >
                    <i className="bi bi-box-arrow-right"></i> 
                    <span className="d-none d-sm-inline">Выйти</span>
                  </button>
                </>
              ) : (
                <Link 
                  to="/login" 
                  className="btn btn-outline-light btn-sm"
                  style={{ borderRadius: '6px', padding: '4px 16px' }}
                >
                  Войти
                </Link>
              )}
            </div>
            
          </div>
        </div>
      </nav>
      
      {/* ВАЖНО: Отступ для контента под fixed-top навбаром */}
      <div style={{ marginTop: '56px' }}></div>
    </>
  );
}