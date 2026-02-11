import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import { toast } from 'react-toastify';
import './Global.css';
import './Validations.css';

const Validations = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam === 'matches' ? 'matches' : 'profiles');
  const [pendingProfiles, setPendingProfiles] = useState([]);
  const [pendingMatches, setPendingMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [validationNotes, setValidationNotes] = useState('');

  // Ouvrir l'onglet "matches" si l'URL contient ?tab=matches (ex: depuis le Dashboard "Matches en Attente")
  useEffect(() => {
    if (tabParam === 'matches') setActiveTab('matches');
  }, [tabParam]);

  useEffect(() => {
    if (activeTab === 'profiles') {
      fetchPendingProfiles();
    } else {
      fetchPendingMatches();
    }
  }, [activeTab]);

  const fetchPendingProfiles = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/users/pending-profile-validation');
      setPendingProfiles(response.data.users || []);
    } catch (error) {
      console.error('Error fetching pending profiles:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingMatches = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/matches/pending');
      setPendingMatches(response.data.matches || []);
    } catch (error) {
      console.error('Error fetching pending matches:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateProfile = async (id) => {
    try {
      await axios.post(`/api/admin/users/${id}/validate-profile`, { notes: validationNotes });
      toast.success('Profil validé avec succès');
      setValidationNotes('');
      setSelectedProfile(null);
      fetchPendingProfiles();
    } catch (error) {
      console.error('Error validating profile:', error);
      toast.error('Erreur lors de la validation');
    }
  };

  const handleRejectProfile = async (id) => {
    if (!rejectionReason.trim()) {
      toast.error('Veuillez indiquer une raison de rejet');
      return;
    }
    try {
      await axios.post(`/api/admin/users/${id}/reject-profile`, { reason: rejectionReason });
      toast.success('Profil rejeté');
      setRejectionReason('');
      setSelectedProfile(null);
      fetchPendingProfiles();
    } catch (error) {
      console.error('Error rejecting profile:', error);
      toast.error('Erreur lors du rejet');
    }
  };

  const handleValidateMatch = async (id) => {
    try {
      await axios.post(`/api/admin/matches/${id}/validate`, { notes: validationNotes });
      toast.success('Match validé avec succès');
      setValidationNotes('');
      setSelectedMatch(null);
      fetchPendingMatches();
    } catch (error) {
      console.error('Error validating match:', error);
      toast.error('Erreur lors de la validation');
    }
  };

  const handleRejectMatch = async (id) => {
    if (!rejectionReason.trim()) {
      toast.error('Veuillez indiquer une raison de rejet');
      return;
    }
    try {
      await axios.post(`/api/admin/matches/${id}/reject`, { reason: rejectionReason });
      toast.success('Match rejeté');
      setRejectionReason('');
      setSelectedMatch(null);
      fetchPendingMatches();
    } catch (error) {
      console.error('Error rejecting match:', error);
      toast.error('Erreur lors du rejet');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-loading">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-validations">
        <div className="validations-header">
          <h1>⚡ Gestion des Validations</h1>
          <p className="validations-subtitle">Valider les profils et matches en attente</p>
        </div>

        <div className="validations-tabs">
          <button
            className={`tab-button ${activeTab === 'profiles' ? 'active' : ''}`}
            onClick={() => setActiveTab('profiles')}
          >
            <span className="tab-icon">👤</span>
            <span>Validation des Profils</span>
            {pendingProfiles.length > 0 && (
              <span className="tab-badge">{pendingProfiles.length}</span>
            )}
          </button>
          <button
            className={`tab-button ${activeTab === 'matches' ? 'active' : ''}`}
            onClick={() => setActiveTab('matches')}
          >
            <span className="tab-icon">💕</span>
            <span>Validation des Matches</span>
            {pendingMatches.length > 0 && (
              <span className="tab-badge">{pendingMatches.length}</span>
            )}
          </button>
        </div>

        <div className="validations-content">
          {activeTab === 'profiles' ? (
            <div className="validations-grid">
              <div className="validations-list">
                <h2>Profils en attente ({pendingProfiles.length})</h2>
                {pendingProfiles.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">✅</div>
                    <h3>Aucun profil en attente</h3>
                    <p>Tous les profils ont été traités</p>
                  </div>
                ) : (
                  <div className="items-list">
                    {pendingProfiles.map((profile) => {
                      const pid = profile._id || profile.id;
                      return (
                        <div
                          key={pid}
                          className={`validation-item ${selectedProfile?._id === pid || selectedProfile?.id === pid ? 'selected' : ''}`}
                          onClick={() => setSelectedProfile(profile)}
                        >
                          <div className="item-avatar">
                            {profile.profile_picture_url ? (
                              <img src={profile.profile_picture_url} alt={profile.first_name} />
                            ) : (
                              <div className="avatar-placeholder">{profile.first_name?.[0]}</div>
                            )}
                          </div>
                          <div className="item-info">
                            <h3>{profile.first_name} {profile.last_name}</h3>
                            <p>{profile.email}</p>
                            <span className="item-date">
                              {profile.createdAt && new Date(profile.createdAt).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedProfile && (
                <div className="validation-details">
                  <div className="details-header">
                    <h2>Détails du profil</h2>
                    <button
                      className="close-btn"
                      onClick={() => {
                        setSelectedProfile(null);
                        setValidationNotes('');
                        setRejectionReason('');
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="profile-preview">
                    <div className="preview-avatar">
                      {selectedProfile.profile_picture_url ? (
                        <img src={selectedProfile.profile_picture_url} alt={selectedProfile.first_name} />
                      ) : (
                        <div className="avatar-placeholder large">{selectedProfile.first_name?.[0]}</div>
                      )}
                    </div>
                    <h3>{selectedProfile.first_name} {selectedProfile.last_name}</h3>
                    <p className="preview-email">{selectedProfile.email}</p>
                  </div>
                  <div className="details-section">
                    <h4>Informations</h4>
                    <div className="info-grid">
                      {selectedProfile.bio && (
                        <div className="info-item">
                          <span className="info-label">Bio:</span>
                          <span className="info-value">{selectedProfile.bio}</span>
                        </div>
                      )}
                      {selectedProfile.city && (
                        <div className="info-item">
                          <span className="info-label">Ville:</span>
                          <span className="info-value">{selectedProfile.city}</span>
                        </div>
                      )}
                      {selectedProfile.country && (
                        <div className="info-item">
                          <span className="info-label">Pays:</span>
                          <span className="info-value">{selectedProfile.country}</span>
                        </div>
                      )}
                      {selectedProfile.profession && (
                        <div className="info-item">
                          <span className="info-label">Profession:</span>
                          <span className="info-value">{selectedProfile.profession}</span>
                        </div>
                      )}
                      {selectedProfile.education && (
                        <div className="info-item">
                          <span className="info-label">Éducation:</span>
                          <span className="info-value">{selectedProfile.education}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="details-section">
                    <label>Notes de validation (optionnel)</label>
                    <textarea
                      value={validationNotes}
                      onChange={(e) => setValidationNotes(e.target.value)}
                      placeholder="Ajoutez des notes..."
                      rows={3}
                      className="notes-input"
                    />
                  </div>
                  <div className="action-buttons">
                    <button
                      onClick={() => handleValidateProfile(selectedProfile._id || selectedProfile.id)}
                      className="btn-validate"
                    >
                      ✅ Valider
                    </button>
                    <button
                      onClick={() => handleRejectProfile(selectedProfile._id || selectedProfile.id)}
                      className="btn-reject"
                    >
                      ❌ Rejeter
                    </button>
                  </div>
                  <div className="details-section">
                    <label>Raison du rejet (requis pour rejeter)</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Indiquez la raison du rejet..."
                      rows={3}
                      className="notes-input"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="validations-grid">
              <div className="validations-list">
                <h2>Matches en attente ({pendingMatches.length})</h2>
                {pendingMatches.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">✅</div>
                    <h3>Aucun match en attente</h3>
                    <p>Tous les matches ont été traités</p>
                  </div>
                ) : (
                  <div className="items-list">
                    {pendingMatches.map((match) => {
                      const mid = match._id || match.id;
                      const u1 = match.user1 || {};
                      const u2 = match.user2 || {};
                      return (
                        <div
                          key={mid}
                          className={`validation-item ${selectedMatch?._id === mid || selectedMatch?.id === mid ? 'selected' : ''}`}
                          onClick={() => setSelectedMatch(match)}
                        >
                          <div className="match-users">
                            <div className="match-user">
                              <div className="item-avatar small">
                                {u1.profile_picture_url ? (
                                  <img src={u1.profile_picture_url} alt={u1.first_name} />
                                ) : (
                                  <div className="avatar-placeholder">{u1.first_name?.[0]}</div>
                                )}
                              </div>
                              <span>{u1.first_name}</span>
                            </div>
                            <span className="match-connector">💕</span>
                            <div className="match-user">
                              <div className="item-avatar small">
                                {u2.profile_picture_url ? (
                                  <img src={u2.profile_picture_url} alt={u2.first_name} />
                                ) : (
                                  <div className="avatar-placeholder">{u2.first_name?.[0]}</div>
                                )}
                              </div>
                              <span>{u2.first_name}</span>
                            </div>
                          </div>
                          <span className="item-date">
                            {match.createdAt && new Date(match.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedMatch && (
                <div className="validation-details">
                  <div className="details-header">
                    <h2>Détails du match</h2>
                    <button
                      className="close-btn"
                      onClick={() => {
                        setSelectedMatch(null);
                        setValidationNotes('');
                        setRejectionReason('');
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="match-preview">
                    <div className="match-user-card">
                      <div className="preview-avatar">
                        {selectedMatch.user1?.profile_picture_url ? (
                          <img src={selectedMatch.user1.profile_picture_url} alt={selectedMatch.user1.first_name} />
                        ) : (
                          <div className="avatar-placeholder large">
                            {selectedMatch.user1?.first_name?.[0]}
                          </div>
                        )}
                      </div>
                      <h3>{selectedMatch.user1?.first_name} {selectedMatch.user1?.last_name}</h3>
                      <p>{selectedMatch.user1?.email}</p>
                      {selectedMatch.user1?.city && <p>📍 {selectedMatch.user1.city}</p>}
                    </div>
                    <div className="match-connector-large">💕</div>
                    <div className="match-user-card">
                      <div className="preview-avatar">
                        {selectedMatch.user2?.profile_picture_url ? (
                          <img src={selectedMatch.user2.profile_picture_url} alt={selectedMatch.user2.first_name} />
                        ) : (
                          <div className="avatar-placeholder large">
                            {selectedMatch.user2?.first_name?.[0]}
                          </div>
                        )}
                      </div>
                      <h3>{selectedMatch.user2?.first_name} {selectedMatch.user2?.last_name}</h3>
                      <p>{selectedMatch.user2?.email}</p>
                      {selectedMatch.user2?.city && <p>📍 {selectedMatch.user2.city}</p>}
                    </div>
                  </div>
                  <div className="details-section">
                    <label>Notes de validation (optionnel)</label>
                    <textarea
                      value={validationNotes}
                      onChange={(e) => setValidationNotes(e.target.value)}
                      placeholder="Ajoutez des notes..."
                      rows={3}
                      className="notes-input"
                    />
                  </div>
                  <div className="action-buttons">
                    <button
                      onClick={() => handleValidateMatch(selectedMatch._id || selectedMatch.id)}
                      className="btn-validate"
                    >
                      ✅ Valider
                    </button>
                    <button
                      onClick={() => handleRejectMatch(selectedMatch._id || selectedMatch.id)}
                      className="btn-reject"
                    >
                      ❌ Rejeter
                    </button>
                  </div>
                  <div className="details-section">
                    <label>Raison du rejet (requis pour rejeter)</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Indiquez la raison du rejet..."
                      rows={3}
                      className="notes-input"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Validations;
