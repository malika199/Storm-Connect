import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import './Auth.css';

// Critères de validation du mot de passe (alignés avec le backend)
const PASSWORD_RULES = [
  { id: 'length', label: 'Au moins 8 caractères', test: (p) => p && p.length >= 8 },
  { id: 'uppercase', label: 'Au moins une majuscule (A–Z)', test: (p) => /[A-Z]/.test(p || '') },
  { id: 'lowercase', label: 'Au moins une minuscule (a–z)', test: (p) => /[a-z]/.test(p || '') },
  { id: 'digit', label: 'Au moins un chiffre (0–9)', test: (p) => /[0-9]/.test(p || '') },
  { id: 'special', label: 'Au moins un caractère spécial (! @ # $ % & * …)', test: (p) => /[!@#$%&*()[\]{};:'",.<>?\\\/\-_+=`~]/.test(p || '') },
];

const Register = () => {
  const [parentInvitationLink, setParentInvitationLink] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    gender: 'male',
    date_of_birth: '',
    phone: '',
    smoker: '',
    halal: '',
    alcohol: '',
    guardian_email: '',
    guardian_phone: '',
    guardian_name: '',
    guardian_relationship: 'parent',
    gdpr_consent: false
  });
  
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const isPasswordValid = (p) => PASSWORD_RULES.every((rule) => rule.test(p));

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isPasswordValid(formData.password)) {
      setPasswordError('Le mot de passe ne respecte pas tous les critères ci-dessous.');
      return;
    }
    setPasswordError('');
    setLoading(true);

    const result = await register(formData);
    
    if (result.success) {
      if (result.invitation_link) {
        setParentInvitationLink({ link: result.invitation_link, emailSent: result.invitation_email_sent });
      } else {
        navigate('/user/profile');
      }
    } else if (result.error) {
      setPasswordError(result.error);
    }
    
    setLoading(false);
  };

  const copyInvitationLink = () => {
    if (parentInvitationLink?.link) {
      navigator.clipboard.writeText(parentInvitationLink.link);
      setParentInvitationLink((prev) => prev ? { ...prev, copied: true } : null);
    }
  };

  const goToProfile = () => {
    setParentInvitationLink(null);
    navigate('/user/profile');
  };

  if (parentInvitationLink) {
    return (
      <>
        <Navbar />
        <div className="auth-container">
          <div className="auth-card">
            <h2>Inscription réussie</h2>
            {parentInvitationLink.emailSent ? (
              <p>Un email d&apos;invitation a été envoyé au parent (<strong>{formData.guardian_email}</strong>) pour qu&apos;il crée son compte. Vous pouvez aussi lui transmettre le lien ci-dessous.</p>
            ) : (
              <p>L&apos;email n&apos;a pas pu être envoyé au parent (configuration email du serveur). <strong>Transmettez ce lien au parent</strong> pour qu&apos;il puisse créer son compte (valable 7 jours) :</p>
            )}
            <div className="form-group" style={{ marginTop: 16 }}>
              <label>Lien d&apos;invitation parent</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="text"
                  readOnly
                  value={parentInvitationLink.link}
                  style={{ flex: 1, minWidth: 200 }}
                />
                <button type="button" className="btn btn-primary" onClick={copyInvitationLink}>
                  {parentInvitationLink.copied ? 'Copié !' : 'Copier le lien'}
                </button>
              </div>
            </div>
            <button type="button" className="btn btn-primary btn-block" onClick={goToProfile}>
              Aller à mon profil
            </button>
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
          <h2>Inscription</h2>
          <form onSubmit={handleSubmit}>
            <h3>Informations personnelles</h3>
            
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Mot de passe *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={(e) => {
                  handleChange(e);
                  setPasswordError('');
                }}
                required
                minLength={8}
                autoComplete="new-password"
                className={passwordError ? 'input-error' : ''}
              />
              <ul className="password-rules" aria-label="Critères du mot de passe">
                {PASSWORD_RULES.map((rule) => (
                  <li key={rule.id} className={rule.test(formData.password) ? 'valid' : ''}>
                    {rule.test(formData.password) ? '✓' : '○'} {rule.label}
                  </li>
                ))}
              </ul>
              {passwordError && <p className="error-message">{passwordError}</p>}
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Prénom *</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Nom *</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Genre *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="male">Homme</option>
                  <option value="female">Femme</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Date de naissance *</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Téléphone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Fumeur</label>
                <select name="smoker" value={formData.smoker} onChange={handleChange}>
                  <option value="">Non renseigné</option>
                  <option value="yes">Oui</option>
                  <option value="no">Non</option>
                </select>
              </div>
              <div className="form-group">
                <label>Viande halal</label>
                <select name="halal" value={formData.halal} onChange={handleChange}>
                  <option value="">Non renseigné</option>
                  <option value="yes">Oui</option>
                  <option value="no">Non</option>
                </select>
              </div>
              <div className="form-group">
                <label>Boit de l'alcool</label>
                <select name="alcohol" value={formData.alcohol} onChange={handleChange}>
                  <option value="">Non renseigné</option>
                  <option value="yes">Oui</option>
                  <option value="no">Non</option>
                </select>
              </div>
            </div>
            
            <h3>Informations du tuteur (obligatoire)</h3>
            
            <div className="form-group">
              <label>Nom du tuteur *</label>
              <input
                type="text"
                name="guardian_name"
                value={formData.guardian_name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Email du tuteur *</label>
              <input
                type="email"
                name="guardian_email"
                value={formData.guardian_email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Téléphone du tuteur</label>
                <input
                  type="tel"
                  name="guardian_phone"
                  value={formData.guardian_phone}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label>Relation *</label>
                <select
                  name="guardian_relationship"
                  value={formData.guardian_relationship}
                  onChange={handleChange}
                  required
                >
                  <option value="parent">Parent</option>
                  <option value="sibling">Frère/Sœur</option>
                  <option value="friend">Ami(e)</option>
                  <option value="other">Autre</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="gdpr_consent"
                  checked={formData.gdpr_consent}
                  onChange={handleChange}
                  required
                />
                J'accepte le traitement de mes données personnelles (RGPD) *
              </label>
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Inscription...' : 'S\'inscrire'}
            </button>
          </form>
          
          <p className="auth-link">
            Déjà un compte ? <Link to="/login">Se connecter</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Register;
