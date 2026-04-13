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
    <nav className="navbar navbar-expand-lg">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold" to="/">
          <i className="bi bi-mortarboard-fill me-2"></i>
          StudentSystem
        </Link>

        <div className="d-flex align-items-center gap-3">
          <span className="text-white">
            <i className="bi bi-person-circle me-1"></i>
            {user?.full_name}
            <span className="badge bg-warning text-dark ms-2">
              {user?.role === 'admin' ? 'Преподаватель' : 'Студент'}
            </span>
          </span>
          <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right me-1"></i> Выход
          </button>
        </div>
      </div>
    </nav>
  );
}