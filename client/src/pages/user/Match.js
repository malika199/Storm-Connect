import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import GlobalMatchFilters from '../../components/GlobalMatchFilters';
import './Match.css';

const UserMatch = () => {
  const { user, refreshLikesCount } = useAuth();
  const navigate = useNavigate();
  
  // Onglet actif : 'discover' ou 'likes'
  const [activeTab, setActiveTab] = useState('likes');
  
  // Profils à découvrir
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Personnes qui nous ont liké
  const [likesReceived, setLikesReceived] = useState([]);
  
  const [loading, setLoading] = useState(true);
  // Removed: Users MUST NOT see pending matches - only admin-validated matches are visible
  const [swipeDirection, setSwipeDirection] = useState(null);

  const fetchProfiles = useCallback(async () => {
    try {
      const response = await axios.get('/api/matching/discover');
      const validProfiles = (response.data.profiles || []).filter(
        p => p && p.first_name && p._id
      );
      
      // S'assurer qu'on ne réaffiche pas les profils déjà dans la liste locale
      setProfiles(prev => {
        const existingIds = prev.map(p => p._id.toString());
        const newProfiles = validProfiles.filter(p => !existingIds.includes(p._id.toString()));
        return newProfiles.length > 0 ? newProfiles : validProfiles;
      });
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setProfiles([]);
    }
  }, []);

  const fetchLikesReceived = useCallback(async () => {
    try {
      const response = await axios.get('/api/matching/likes-received');
      const validProfiles = (response.data.profiles || []).filter(
        p => p && p.first_name
      );
      setLikesReceived(validProfiles);
    } catch (error) {
      console.error('Error fetching likes received:', error);
      setLikesReceived([]);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchProfiles(), fetchLikesReceived()]);
    setLoading(false);
  }, [fetchProfiles, fetchLikesReceived]);

  useEffect(() => {
    fetchAllData();
    // Rafraîchir les likes reçus toutes les 30 secondes pour voir les changements de statut de match
    const interval = setInterval(() => {
      fetchLikesReceived();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchAllData, fetchLikesReceived]);

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleLike = async (profile, fromLikesTab = false) => {
    if (!fromLikesTab) {
      setSwipeDirection('right');
    }

    // RETIRER LE PROFIL IMMÉDIATEMENT AVANT LA REQUÊTE
    // Remove profile from UI IMMEDIATELY, then send request in background
    if (!fromLikesTab) {
      const currentProfileIndex = currentIndex;
      const updatedProfiles = profiles.filter(p => p._id !== profile._id);
      
      // Update profiles IMMEDIATELY - profile disappears right away
      setProfiles(updatedProfiles);
      
      // Adjust index after animation
      setTimeout(() => {
        setSwipeDirection(null);
        if (updatedProfiles.length === 0) {
          fetchProfiles();
          setCurrentIndex(0);
        } else if (currentProfileIndex >= updatedProfiles.length) {
          setCurrentIndex(updatedProfiles.length - 1);
        }
        // Otherwise index stays same - next profile automatically appears
      }, 300);
    }

    try {
      const response = await axios.post(`/api/matching/like/${profile._id}`);
      
      // Afficher le message approprié selon le statut
      if (response.data.isReciprocal) {
        // Like réciproque détecté
        toast.success(`Vous avez liké en retour`);
      } else {
        // Premier like
        toast.success(`Vous avez liké cette personne`);
      }
      
      // STRICT: Users MUST NOT see pending matches
      // No match information is returned - matches are only visible after admin validation

      if (fromLikesTab) {
        // Retirer de la liste des likes reçus après avoir liké en retour
        setLikesReceived(prev => prev.filter(p => p._id !== profile._id));
        refreshLikesCount();
      }
    } catch (error) {
      setSwipeDirection(null);
      const message = error.response?.data?.message || 'Erreur lors du like';
      
      // Afficher le message d'erreur spécifique selon le type d'erreur
      if (error.response?.status === 403) {
        if (message.includes('valider votre profil')) {
          toast.error('Il faut valider votre profil par l\'admin avant de pouvoir matcher');
        } else if (message.includes('pas encore validé')) {
          toast.error('Ce profil n\'est pas encore validé par l\'admin. Vous ne pouvez liker que les profils validés.');
        } else {
          toast.error(message);
        }
      } else {
        toast.error(message);
      }
      // On error, restore the profile (optional - you might want to keep it removed)
    }
  };

  const handleSkip = async (profile, fromLikesTab = false) => {
    if (!fromLikesTab) {
      setSwipeDirection('left');
    }

    // RETIRER LE PROFIL IMMÉDIATEMENT AVANT LA REQUÊTE (même comportement que LIKE)
    if (!fromLikesTab) {
      const currentProfileIndex = currentIndex;
      const updatedProfiles = profiles.filter(p => p._id !== profile._id);
      
      // Update profiles IMMEDIATELY - profile disappears right away
      setProfiles(updatedProfiles);
      
      // Adjust index after animation
      setTimeout(() => {
        setSwipeDirection(null);
        if (updatedProfiles.length === 0) {
          fetchProfiles();
          setCurrentIndex(0);
        } else if (currentProfileIndex >= updatedProfiles.length) {
          setCurrentIndex(updatedProfiles.length - 1);
        }
        // Otherwise index stays same - next profile automatically appears
      }, 300);
    }

    try {
      await axios.post(`/api/matching/skip/${profile._id}`);
    } catch (error) {
      console.error('Error skipping:', error);
    }

    if (fromLikesTab) {
      // Retirer de la liste des likes reçus
      setLikesReceived(prev => prev.filter(p => p._id !== profile._id));
      refreshLikesCount();
    }
  };

  // Removed: Match modal functions - users MUST NOT see pending matches

  const currentProfile = profiles[currentIndex];
  const targetGender = user?.gender === 'male' ? 'femmes' : 'hommes';

  if (loading) {
    return (
      <>
        <div className="match-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Recherche de profils...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="match-container">
        <div className="match-layout">
          {/* Sidebar gauche avec filtres */}
          <div className="match-sidebar">
            <GlobalMatchFilters />
          </div>

          {/* Contenu principal */}
          <div className="match-content">
            {/* Tabs */}
            <div className="match-tabs">
              <button 
                className={`match-tab ${activeTab === 'likes' ? 'active' : ''}`}
                onClick={() => setActiveTab('likes')}
              >
                ❤️ Ils vous aiment
                {likesReceived.length > 0 && (
                  <span className="tab-badge">{likesReceived.length}</span>
                )}
              </button>
              <button 
                className={`match-tab ${activeTab === 'discover' ? 'active' : ''}`}
                onClick={() => setActiveTab('discover')}
              >
                🔍 Découvrir
              </button>
            </div>

            {/* Contenu selon l'onglet */}
        {activeTab === 'likes' ? (
          // Section "Ils vous aiment"
          <div className="likes-section">
            <div className="section-header">
              <h2>❤️ Ces personnes vous ont liké</h2>
              <p>Likez-les en retour pour créer un match ! Le match sera validé par un administrateur avant d'être effectif.</p>
            </div>

            {likesReceived.length === 0 ? (
              <div className="no-profiles">
                <div className="no-profiles-icon">💝</div>
                <h2>Pas encore de likes</h2>
                <p>Continuez à utiliser l'application, les likes arriveront bientôt !</p>
                <button onClick={() => setActiveTab('discover')} className="btn btn-primary">
                  Découvrir des profils
                </button>
              </div>
            ) : (
              <div className="likes-grid">
                {likesReceived.map(profile => (
                  <div key={profile._id} className="like-card">
                    <div className="like-card-image">
                      {profile.profile_picture_url ? (
                        <img src={profile.profile_picture_url} alt={profile.first_name} />
                      ) : (
                        <div className="like-card-placeholder">
                          {profile.first_name[0]}{profile.last_name?.[0]}
                        </div>
                      )}
                      <div className="like-card-gradient"></div>
                      <div className="like-card-info-overlay">
                        <h3>{profile.first_name}, {calculateAge(profile.date_of_birth)}</h3>
                        {profile.city && (
                          <p className="like-card-location">📍 {profile.city}{profile.country ? `, ${profile.country}` : ''}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="like-card-details">
                      <div className="details-organized">
                        {/* Groupe Professionnel */}
                        <div className="info-group">
                          <div className="info-item">
                            <span className="info-icon">💼</span>
                            <span className="info-value">{profile.profession || 'Non renseigné'}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-icon">🎓</span>
                            <span className="info-value">{profile.education || 'Non renseigné'}</span>
                          </div>
                        </div>

                        {/* Groupe Physique & Localisation */}
                        <div className="info-group">
                          <div className="info-item">
                            <span className="info-icon">📏</span>
                            <span className="info-value">{profile.height_cm ? `${profile.height_cm} cm` : 'Non renseigné'}</span>
                          </div>
                          {profile.religion && (
                            <div className="info-item">
                              <span className="info-icon">🙏</span>
                              <span className="info-value">{profile.religion}</span>
                            </div>
                          )}
                        </div>

                        {/* Badges Préférences */}
                        <div className="preferences-badges">
                          <span className={`pref-badge ${profile.smoker === true ? 'yes' : profile.smoker === false ? 'no' : 'unknown'}`}>
                            🚬 {profile.smoker === true ? 'Fumeur' : profile.smoker === false ? 'Non fumeur' : 'Non renseigné'}
                          </span>
                          <span className={`pref-badge ${profile.halal === true ? 'yes' : profile.halal === false ? 'no' : 'unknown'}`}>
                            🍖 {profile.halal === true ? 'Halal' : profile.halal === false ? 'Non halal' : 'Non renseigné'}
                          </span>
                          <span className={`pref-badge ${profile.alcohol === true ? 'yes' : profile.alcohol === false ? 'no' : 'unknown'}`}>
                            🍷 {profile.alcohol === true ? 'Boit' : profile.alcohol === false ? 'Ne boit pas' : 'Non renseigné'}
                          </span>
                        </div>

                        {/* Bio */}
                        {profile.bio && (
                          <div className="bio-section">
                            <p>{profile.bio}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {profile.photos && profile.photos.length > 0 && (
                      <div className="card-photos">
                        {profile.photos.slice(0, 3).map((photo, index) => (
                          <img key={index} src={photo} alt={`Photo ${index + 1}`} className="mini-photo" />
                        ))}
                      </div>
                    )}

                    <div className="like-card-actions">
                      <button 
                        className="like-action-btn skip"
                        onClick={() => handleSkip(profile, true)}
                      >
                        ✕
                      </button>
                      <button 
                        className="like-action-btn accept"
                        onClick={() => handleLike(profile, true)}
                      >
                        ❤
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Section "Découvrir"
          <div className="discover-section">
            <div className="section-header">
              <h2>🔍 Découvrir</h2>
              <p>Découvrez des {targetGender} qui pourraient vous correspondre</p>
            </div>

            {profiles.length === 0 || !profiles[currentIndex] ? (
              <div className="no-profiles">
                {!user?.is_verified ? (
                  <>
                    <div className="no-profiles-icon">📋</div>
                    <h2>Profil en attente de validation</h2>
                    <p>Pour débloquer la découverte et faire de belles rencontres, votre profil doit d'abord être validé par notre équipe. C'est une dernière étape avant de pouvoir explorer !</p>
                    <button onClick={() => navigate('/user/profile')} className="btn btn-primary">
                      Voir mon profil
                    </button>
                  </>
                ) : (
                  <>
                    <div className="no-profiles-icon">💔</div>
                    <h2>Plus de profils disponibles</h2>
                    <p>Revenez plus tard pour découvrir de nouveaux profils !</p>
                    <button onClick={fetchAllData} className="btn btn-primary">
                      Rafraîchir
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="card-stack">
                <div className={`profile-card ${swipeDirection ? `swipe-${swipeDirection}` : ''}`}>
                  <div className="card-image-container">
                    {currentProfile.profile_picture_url ? (
                      <img 
                        src={currentProfile.profile_picture_url} 
                        alt={currentProfile.first_name}
                        className="card-image"
                      />
                    ) : (
                      <div className="card-image-placeholder">
                        <span>{currentProfile.first_name[0]}{currentProfile.last_name?.[0]}</span>
                      </div>
                    )}
                    <div className="card-gradient"></div>
                    <div className="card-info-overlay">
                      <h2>{currentProfile.first_name}, {calculateAge(currentProfile.date_of_birth)}</h2>
                      {currentProfile.city && (
                        <p className="location">📍 {currentProfile.city}{currentProfile.country ? `, ${currentProfile.country}` : ''}</p>
                      )}
                    </div>
                  </div>

                  <div className="card-details">
                    <div className="details-organized">
                      {/* Groupe Professionnel */}
                      <div className="info-group">
                        <div className="info-item">
                          <span className="info-icon">💼</span>
                          <span className="info-value">{currentProfile.profession || 'Non renseigné'}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-icon">🎓</span>
                          <span className="info-value">{currentProfile.education || 'Non renseigné'}</span>
                        </div>
                      </div>

                      {/* Groupe Physique & Localisation */}
                      <div className="info-group">
                        <div className="info-item">
                          <span className="info-icon">📏</span>
                          <span className="info-value">{currentProfile.height_cm ? `${currentProfile.height_cm} cm` : 'Non renseigné'}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-icon">📍</span>
                          <span className="info-value">
                            {currentProfile.city || currentProfile.country 
                              ? `${currentProfile.city || ''}${currentProfile.city && currentProfile.country ? ', ' : ''}${currentProfile.country || ''}`.trim()
                              : 'Non renseigné'}
                          </span>
                        </div>
                      </div>

                      {/* Groupe Religion */}
                      {currentProfile.religion && (
                        <div className="info-group">
                          <div className="info-item">
                            <span className="info-icon">🙏</span>
                            <span className="info-value">{currentProfile.religion}</span>
                          </div>
                        </div>
                      )}

                      {/* Badges Préférences */}
                      <div className="preferences-badges">
                        <span className={`pref-badge ${currentProfile.smoker === true ? 'yes' : currentProfile.smoker === false ? 'no' : 'unknown'}`}>
                          🚬 {currentProfile.smoker === true ? 'Fumeur' : currentProfile.smoker === false ? 'Non fumeur' : 'Non renseigné'}
                        </span>
                        <span className={`pref-badge ${currentProfile.halal === true ? 'yes' : currentProfile.halal === false ? 'no' : 'unknown'}`}>
                          🍖 {currentProfile.halal === true ? 'Halal' : currentProfile.halal === false ? 'Non halal' : 'Non renseigné'}
                        </span>
                        <span className={`pref-badge ${currentProfile.alcohol === true ? 'yes' : currentProfile.alcohol === false ? 'no' : 'unknown'}`}>
                          🍷 {currentProfile.alcohol === true ? 'Boit' : currentProfile.alcohol === false ? 'Ne boit pas' : 'Non renseigné'}
                        </span>
                      </div>

                      {/* Bio */}
                      {currentProfile.bio && (
                        <div className="bio-section">
                          <p>{currentProfile.bio}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {currentProfile.photos && currentProfile.photos.length > 0 && (
                    <div className="card-photos">
                      {currentProfile.photos.slice(0, 3).map((photo, index) => (
                        <img key={index} src={photo} alt={`Photo ${index + 1}`} className="mini-photo" />
                      ))}
                    </div>
                  )}
                </div>

                <div className="action-buttons">
                  <button className="action-btn skip-btn" onClick={() => handleSkip(currentProfile, false)}>
                    <span>✕</span>
                  </button>
                  <button 
                    className={`action-btn like-btn ${!currentProfile.is_verified ? 'disabled' : ''}`}
                    onClick={() => handleLike(currentProfile, false)}
                    disabled={!currentProfile.is_verified}
                    title={!currentProfile.is_verified ? 'Ce profil n\'est pas encore validé par l\'admin' : 'Liker ce profil'}
                  >
                    <span>❤</span>
                  </button>
                </div>

                <div className="profiles-remaining">
                  {profiles.length - currentIndex - 1} profils restants
                </div>
              </div>
            )}
          </div>
        )}

            {/* Removed: Match modal - users MUST NOT see pending matches */}
          </div>
        </div>
      </div>
    </>
  );
};

export default UserMatch;
