import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './Auth.css';

const PASSWORD_RULES = [
  { id: 'length', label: 'Au moins 8 caractères', test: (p) => p && p.length >= 8 },
  { id: 'uppercase', label: 'Au moins une majuscule (A–Z)', test: (p) => /[A-Z]/.test(p || '') },
  { id: 'lowercase', label: 'Au moins une minuscule (a–z)', test: (p) => /[a-z]/.test(p || '') },
  { id: 'digit', label: 'Au moins un chiffre (0–9)', test: (p) => /[0-9]/.test(p || '') },
  { id: 'special', label: 'Au moins un caractère spécial', test: (p) => /[!@#$%&*()[\]{};:'",.<>?\\\/\-_+=`~]/.test(p || '') },
];

const RegisterParent = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { login } = useAuth();

  const [invitation, setInvitation] = useState(null);
  const [loadingInvitation, setLoadingInvitation] = useState(!!token);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    gdpr_consent: false,
    parental_consent: false,
  });
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!token) {
      setLoadingInvitation(false);
      return;
    }
    axios
      .get(`/api/auth/invitation/${token}`)
      .then((res) => {
        if (res.data.valid) {
          setInvitation(res.data);
          setFormData((prev) => ({ ...prev, email: res.data.guardian_email || '' }));
        } else {
          setInvitation({ valid: false });
        }
      })
      .catch(() => setInvitation({ valid: false }))
      .finally(() => setLoadingInvitation(false));
  }, [token]);

  const isPasswordValid = (p) => PASSWORD_RULES.every((rule) => rule.test(p));

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invitation?.valid || !token) {
      toast.error('Lien d\'invitation invalide ou expiré.');
      return;
    }
    if (!isPasswordValid(formData.password)) {
      setPasswordError('Le mot de passe ne respecte pas tous les critères.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    if (!formData.gdpr_consent || !formData.parental_consent) {
      toast.error('Vous devez accepter les CGU et le consentement parental.');
      return;
    }
    setPasswordError('');
    setLoading(true);
    try {
      await axios.post('/api/auth/register-parent', {
        token,
        email: formData.email.trim(),
        password: formData.password,
        gdpr_consent: formData.gdpr_consent,
        parental_consent: formData.parental_consent,
      });
      toast.success('Compte parent créé avec succès.');
      const result = await login(formData.email.trim(), formData.password);
      if (result.success) {
        navigate('/guardian');
      } else {
        navigate('/login');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de la création du compte.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingInvitation) {
    return (
      <>
        <Navbar />
        <div className="auth-container">
          <div className="auth-card">
            <h2>Chargement...</h2>
            <p>Vérification du lien d&apos;invitation.</p>
          </div>
        </div>
      </>
    );
  }

  if (!token || (invitation && !invitation.valid)) {
    return (
      <>
        <Navbar />
        <div className="auth-container">
          <div className="auth-card">
            <h2>Lien invalide ou expiré</h2>
            <p>Ce lien d&apos;invitation parent n&apos;existe pas ou a expiré. Demandez un nouvel email d&apos;invitation depuis l&apos;inscription de l&apos;enfant.</p>
            <Link to="/register" className="btn btn-primary">Retour à l&apos;inscription</Link>
            <p className="auth-link">
              <Link to="/login">← Connexion</Link>
            </p>
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
          <h2>Créer votre compte parent</h2>
          <p className="forgot-password-desc">
            Vous avez été invité en tant que tuteur de <strong>{invitation.child_name}</strong>. Choisissez un mot de passe pour activer votre compte.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="email@exemple.com"
                readOnly={!!invitation.guardian_email}
              />
            </div>

            <div className="form-group">
              <label>Mot de passe *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />
            </div>
            <ul className="password-rules">
              {PASSWORD_RULES.map((rule) => (
                <li key={rule.id} className={rule.test(formData.password) ? 'valid' : ''}>
                  {rule.label}
                </li>
              ))}
            </ul>

            <div className="form-group">
              <label>Confirmer le mot de passe *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />
            </div>
            {passwordError && <p className="error-message">{passwordError}</p>}

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="gdpr_consent"
                  checked={formData.gdpr_consent}
                  onChange={handleChange}
                />
                J&apos;accepte les conditions d&apos;utilisation et la politique de confidentialité (CGU)
              </label>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="parental_consent"
                  checked={formData.parental_consent}
                  onChange={handleChange}
                />
                Je confirme être le tuteur légal et donner mon consentement parental pour l&apos;utilisation du service par mon enfant
              </label>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Création en cours...' : 'Créer mon compte parent'}
            </button>
          </form>

          <p className="auth-link">
            <Link to="/login">← Déjà un compte ? Se connecter</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default RegisterParent;
