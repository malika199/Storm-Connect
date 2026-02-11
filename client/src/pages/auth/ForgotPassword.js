import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import { toast } from 'react-toastify';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSent(false);
    setPreviewUrl(null);

    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      setSent(true);
      if (res.data.previewUrl) {
        setPreviewUrl(res.data.previewUrl);
        toast.success('Mode développement : cliquez sur le lien ci-dessous pour voir l\'email et le lien de réinitialisation.');
      } else {
        toast.success('Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Erreur lors de l\'envoi. Veuillez réessayer.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="auth-container">
        <div className="auth-card">
          <h2>Mot de passe oublié</h2>
          
          {sent ? (
            <div className="forgot-password-success">
              {previewUrl ? (
                <>
                  <p className="forgot-password-dev-title">📧 Mode développement (Ethereal)</p>
                  <p>L'email n'est pas envoyé à une vraie boîte mail. Cliquez sur le lien ci-dessous pour voir l'email et récupérer le lien de réinitialisation :</p>
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="forgot-password-preview-link">
                    Voir l'email (lien de réinitialisation à l'intérieur)
                  </a>
                </>
              ) : (
                <>
                  <p>✅ Vérifiez votre boîte mail.</p>
                  <p>Si un compte existe avec cet email, vous recevrez un lien pour réinitialiser votre mot de passe.</p>
                  <p className="forgot-password-hint">Pensez à vérifier vos spams.</p>
                </>
              )}
              <Link to="/login" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <p className="forgot-password-desc">
                Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
                </button>
              </form>
            </>
          )}
          
          <p className="auth-link">
            <Link to="/login">← Retour à la connexion</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
