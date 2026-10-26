import React from 'react';
import { createRoot } from 'react-dom/client';
import AdminPage from './pages/AdminPage.jsx';
import HomePage from './pages/HomePage.jsx';
import AuthCallbackPage from './pages/AuthCallbackPage.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>{window.location.pathname.replace(/\/$/, '') === '/admin' ? <AdminPage /> : window.location.pathname === '/auth/callback' ? <AuthCallbackPage /> : <HomePage />}</React.StrictMode>,
);
