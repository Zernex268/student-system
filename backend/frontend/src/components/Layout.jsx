import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <>
      <Navbar />
      <div className="d-flex">
        <div className="sidebar" style={{ width: '250px', flexShrink: 0 }}>
          <Sidebar />
        </div>
        <div className="flex-grow-1 p-4" style={{ minHeight: 'calc(100vh - 56px)' }}>
          <Outlet />
        </div>
      </div>
    </>
  );
}