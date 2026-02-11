import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ViewProfile.css';

const ViewProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`/api/users/profile/${userId}`);
        setProfile(response.data.user);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Impossible de charger le profil');
        navigate('/user/conversations');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId, navigate]);

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getGenderLabel = (gender) => {
    const labels = { male: 'Homme', female: 'Femme', other: 'Autre' };
    return labels[gender] || gender;
  };

  const displayValue = (value, type = 'text') => {
    if (type === 'boolean') {
      if (value === true) return 'Oui';
      if (value === false) return 'Non';
      return 'Non renseigné';
    }
    if (value !== undefined && value !== null && value !== '') return String(value);
    return 'Non renseigné';
  };

  if (loading) {
    return (
      <>
        <div className="view-profile-container">
          <div className="view-profile-loading">
            <div className="spinner"></div>
            <p>Chargement du profil...</p>
          </div>
        </div>
      </>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <>
      <div className="view-profile-container">
        <button className="view-profile-back" onClick={() => navigate(-1)}>
          ← Retour
        </button>

        <div className="view-profile-card">
          {/* En-tête avec photo principale */}
          <div className="view-profile-header">
            {profile.profile_picture_url ? (
              <img src={profile.profile_picture_url} alt={profile.first_name} className="view-profile-main-photo" />
            ) : (
              <div className="view-profile-avatar-placeholder">
                {profile.first_name?.[0]}{profile.last_name?.[0]}
              </div>
            )}
            <h1>{profile.first_name} {profile.last_name}</h1>
            <p className="view-profile-age">
              {profile.date_of_birth ? `${calculateAge(profile.date_of_birth)} ans` : 'Non renseigné'}
            </p>
            <p className="view-profile-gender">{profile.gender ? getGenderLabel(profile.gender) : 'Non renseigné'}</p>
            <p className="view-profile-location">
              📍 {profile.city || profile.country ? [profile.city, profile.country].filter(Boolean).join(', ') : 'Non renseigné'}
            </p>
          </div>

          {/* Informations détaillées */}
          <div className="view-profile-body">
            <section className="view-profile-section">
              <h3>Informations</h3>
              <div className="view-profile-details">
                <div className="view-profile-detail-item">
                  <span className="detail-icon">💼</span>
                  <div>
                    <span className="detail-label">Profession</span>
                    <span className="detail-value">{displayValue(profile.profession)}</span>
                  </div>
                </div>
                <div className="view-profile-detail-item">
                  <span className="detail-icon">🎓</span>
                  <div>
                    <span className="detail-label">Études</span>
                    <span className="detail-value">{displayValue(profile.education)}</span>
                  </div>
                </div>
                <div className="view-profile-detail-item">
                  <span className="detail-icon">🙏</span>
                  <div>
                    <span className="detail-label">Religion</span>
                    <span className="detail-value">{displayValue(profile.religion)}</span>
                  </div>
                </div>
                <div className="view-profile-detail-item">
                  <span className="detail-icon">📏</span>
                  <div>
                    <span className="detail-label">Taille</span>
                    <span className="detail-value">{profile.height_cm ? `${profile.height_cm} cm` : 'Non renseigné'}</span>
                  </div>
                </div>
                <div className="view-profile-detail-item">
                  <span className="detail-icon">🚬</span>
                  <div>
                    <span className="detail-label">Fumeur</span>
                    <span className="detail-value">{displayValue(profile.smoker, 'boolean')}</span>
                  </div>
                </div>
                <div className="view-profile-detail-item">
                  <span className="detail-icon">🍖</span>
                  <div>
                    <span className="detail-label">Viande halal</span>
                    <span className="detail-value">{displayValue(profile.halal, 'boolean')}</span>
                  </div>
                </div>
                <div className="view-profile-detail-item">
                  <span className="detail-icon">🍷</span>
                  <div>
                    <span className="detail-label">Boit de l'alcool</span>
                    <span className="detail-value">{displayValue(profile.alcohol, 'boolean')}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="view-profile-section">
              <h3>À propos</h3>
              <p className="view-profile-bio">{displayValue(profile.bio)}</p>
            </section>

            <section className="view-profile-section">
              <h3>Photos</h3>
              {profile.photos && profile.photos.length > 0 ? (
                <div className="view-profile-photos">
                  {profile.photos.map((photo, index) => (
                    <img key={index} src={photo} alt={`Photo ${index + 1}`} />
                  ))}
                </div>
              ) : (
                <p className="view-profile-bio">Non renseigné</p>
              )}
            </section>
          </div>

          <div className="view-profile-actions">
            <button className="btn btn-primary" onClick={() => navigate(-1)}>
              💬 Retour à la conversation
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewProfile;
