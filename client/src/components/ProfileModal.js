import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ProfileModal.css';

const ProfileModal = ({ userId, userName, onClose }) => {
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
        onClose();
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId, onClose]);

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

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="profile-modal-close" onClick={onClose} aria-label="Fermer">
          ✕
        </button>

        {loading ? (
          <div className="profile-modal-loading">
            <div className="spinner"></div>
            <p>Chargement du profil...</p>
          </div>
        ) : profile ? (
          <>
            <div className="profile-modal-header">
              {profile.profile_picture_url ? (
                <img src={profile.profile_picture_url} alt={profile.first_name} />
              ) : (
                <div className="profile-modal-avatar-placeholder">
                  {profile.first_name?.[0]}{profile.last_name?.[0]}
                </div>
              )}
              <h2>{profile.first_name} {profile.last_name}{profile.date_of_birth ? `, ${calculateAge(profile.date_of_birth)} ans` : ''}</h2>
              {profile.city && (
                <p className="profile-modal-location">📍 {profile.city}{profile.country ? `, ${profile.country}` : ''}</p>
              )}
            </div>

            <div className="profile-modal-body">
              {profile.profession && (
                <div className="profile-detail">
                  <span className="profile-detail-icon">💼</span>
                  <span>{profile.profession}</span>
                </div>
              )}
              {profile.education && (
                <div className="profile-detail">
                  <span className="profile-detail-icon">🎓</span>
                  <span>{profile.education}</span>
                </div>
              )}
              {profile.religion && (
                <div className="profile-detail">
                  <span className="profile-detail-icon">🙏</span>
                  <span>{profile.religion}</span>
                </div>
              )}
              {profile.height_cm && (
                <div className="profile-detail">
                  <span className="profile-detail-icon">📏</span>
                  <span>{profile.height_cm} cm</span>
                </div>
              )}
              {(profile.smoker === true || profile.smoker === false) && (
                <div className="profile-detail">
                  <span className="profile-detail-icon">🚬</span>
                  <span>Fumeur : {profile.smoker ? 'Oui' : 'Non'}</span>
                </div>
              )}
              {(profile.halal === true || profile.halal === false) && (
                <div className="profile-detail">
                  <span className="profile-detail-icon">🍖</span>
                  <span>Viande halal : {profile.halal ? 'Oui' : 'Non'}</span>
                </div>
              )}
              {(profile.alcohol === true || profile.alcohol === false) && (
                <div className="profile-detail">
                  <span className="profile-detail-icon">🍷</span>
                  <span>Boit de l'alcool : {profile.alcohol ? 'Oui' : 'Non'}</span>
                </div>
              )}
              {profile.bio && (
                <div className="profile-bio">
                  <h4>À propos</h4>
                  <p>{profile.bio}</p>
                </div>
              )}
              {profile.photos && profile.photos.length > 0 && (
                <div className="profile-photos">
                  <h4>Photos</h4>
                  <div className="profile-photos-grid">
                    {profile.photos.map((photo, index) => (
                      <img key={index} src={photo} alt={`Photo ${index + 1}`} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ProfileModal;
