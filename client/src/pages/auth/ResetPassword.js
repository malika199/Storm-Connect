import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import { toast } from 'react-toastify';
import './Auth.css';

const PASSWORD_RULES = [
  { id: 'length', label: 'Au moins 8 caractères', test: (p) => p && p.length >= 8 },
  { id: 'uppercase', label: 'Au moins une majuscule (A–Z)', test: (p) => /[A-Z]/.test(p || '') },
  { id: 'lowercase', label: 'Au moins une minuscule (a–z)', test: (p) => /[a-z]/.test(p || '') },
  { id: 'digit', label: 'Au moins un chiffre (0–9)', test: (p) => /[0-9]/.test(p || '') },
  { id: 'special', label: 'Au moins un caractère spécial (! @ # $ % & * …)', test: (p) => /[!@#$%&*()[\]{};:'",.<>?\\\/\-_+=`~]/.test(p || '') },
];

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const isPasswordValid = (p) => PASSWORD_RULES.every((rule) => rule.test(p));

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isPasswordValid(password)) {
      setPasswordError('Le mot de passe ne respecte pas tous les critères ci-dessous.');
      return;
    }
    
    if (password !== confirmPassword) {
      setPasswordError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setPasswordError('');
    setLoading(true);

    try {
      await axios.post(`/api/auth/reset-password/${token}`, { password });
      setSuccess(true);
      toast.success('Mot de passe réinitialisé avec succès !');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      const message = error.response?.data?.message || 'Erreur lors de la réinitialisation.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <>
        <Navbar />
        <div className="auth-container">
          <div className="auth-card">
            <h2>Lien invalide</h2>
            <p>Ce lien de réinitialisation est invalide. Veuillez faire une nouvelle demande.</p>
            <Link to="/forgot-password" className="btn btn-primary">Demander un nouveau lien</Link>
            <p className="auth-link">
              <Link to="/login">← Retour à la connexion</Link>
            </p>
          </div>
        </div>
      </>
    );
  }

  if (success) {
    return (
      <>
        <Navbar />
        <div className="auth-container">
          <div className="auth-card">
            <h2>✅ Mot de passe réinitialisé</h2>
            <p>Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers la page de connexion...</p>
            <Link to="/login" className="btn btn-primary">Se connecter</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="auth-container">
        <div className="auth-card">
          <h2>Nouveau mot de passe</h2>
          <p className="forgot-password-desc">
            Choisissez un nouveau mot de passe sécurisé.
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nouveau mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                required
                minLength={8}
                autoComplete="new-password"
                className={passwordError ? 'input-error' : ''}
              />
              <ul className="password-rules" aria-label="Critères du mot de passe">
                {PASSWORD_RULES.map((rule) => (
                  <li key={rule.id} className={rule.test(password) ? 'valid' : ''}>
                    {rule.test(password) ? '✓' : '○'} {rule.label}
                  </li>
                ))}
              </ul>
              {passwordError && <p className="error-message">{passwordError}</p>}
            </div>

            <div className="form-group">
              <label>Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            </button>
          </form>
          
          <p className="auth-link">
            <Link to="/login">← Retour à la connexion</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
