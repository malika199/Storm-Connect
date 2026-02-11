import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import './Login.css';

// Identifiants admin (admin/.env) — doivent correspondre au .env racine utilisé par create-admin
const DEFAULT_ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL || 'admin@sitederencontre.com';
const DEFAULT_ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || 'admin123';

const Login = () => {
  const [email, setEmail] = useState(DEFAULT_ADMIN_EMAIL);
  const [password, setPassword] = useState(DEFAULT_ADMIN_PASSWORD);
  const [submitting, setSubmitting] = useState(false);
  const { login, isAuthenticated, loading } = useAdminAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="admin-login-container" style={{ justifyContent: 'center' }}>
        <p>Chargement...</p>
      </div>
    );
  }
  if (isAuthenticated) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-logo">⚡</div>
          <h1>Back Office Administrateur</h1>
          <p>Espace de gestion réservé aux administrateurs</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label>Email administrateur</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn-admin-login"
            disabled={submitting}
          >
            {submitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="admin-login-footer">
          <p className="admin-credentials">
            Identifiants : <strong>{DEFAULT_ADMIN_EMAIL}</strong> / <strong>{DEFAULT_ADMIN_PASSWORD}</strong>
          </p>
          <p className="security-note">🔒 Connexion sécurisée - Accès restreint</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
