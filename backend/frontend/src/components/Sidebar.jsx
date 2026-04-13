import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <div className="sidebar">
      <ul className="nav flex-column">
        <li className="nav-item">
          <NavLink className="nav-link" to="/">
            <i className="bi bi-speedometer2 me-2"></i> Дашборд
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink className="nav-link" to="/courses">
            <i className="bi bi-journal-bookmark-fill me-2"></i> Мои курсы
          </NavLink>
        </li>

        {user?.role === 'admin' && (
          <>
            <li className="nav-item mt-3">
              <div className="px-3 text-uppercase text-muted" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
                Администрирование
              </div>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/admin/users">
                <i className="bi bi-people-fill me-2"></i> Пользователи
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/admin/courses">
                <i className="bi bi-collection-fill me-2"></i> Управление курсами
              </NavLink>
            </li>
          </>
        )}
      </ul>
    </div>
  );
}