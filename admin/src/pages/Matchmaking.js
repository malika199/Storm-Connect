import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import { toast } from 'react-toastify';
import './Global.css';
import './Matchmaking.css';

const Matchmaking = () => {
  const [requests, setRequests] = useState([]);
  const [pendingMatches, setPendingMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [matchmakingRes, matchesRes] = await Promise.all([
        axios.get('/api/admin/matchmaking/pending'),
        axios.get('/api/admin/matches/pending')
      ]);
      setRequests(matchmakingRes.data.requests || []);
      setPendingMatches(matchesRes.data.matches || []);
    } catch (error) {
      console.error('Error fetching:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const totalPending = requests.length + pendingMatches.length;

  const handleValidateMatchmaking = async (id) => {
    try {
      await axios.post(`/api/matchmaking/${id}/validate`, { admin_notes: adminNotes });
      toast.success('Demande de mise en relation validée');
      setAdminNotes('');
      setSelectedItem(null);
      fetchAll();
    } catch (error) {
      console.error('Error validating request:', error);
      toast.error('Erreur lors de la validation');
    }
  };

  const handleRejectMatchmaking = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir rejeter cette demande ?')) return;
    try {
      await axios.post(`/api/matchmaking/${id}/reject`, { admin_notes: adminNotes });
      toast.success('Demande rejetée');
      setAdminNotes('');
      setSelectedItem(null);
      fetchAll();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Erreur lors du rejet');
    }
  };

  const handleValidateMatch = async (id) => {
    try {
      await axios.post(`/api/admin/matches/${id}/validate`, { notes: adminNotes });
      toast.success('Match validé : les deux utilisateurs peuvent maintenant discuter');
      setAdminNotes('');
      setRejectionReason('');
      setSelectedItem(null);
      fetchAll();
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
    if (!window.confirm('Êtes-vous sûr de vouloir rejeter ce match ?')) return;
    try {
      await axios.post(`/api/admin/matches/${id}/reject`, { reason: rejectionReason });
      toast.success('Match rejeté');
      setAdminNotes('');
      setRejectionReason('');
      setSelectedItem(null);
      fetchAll();
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

  const matchmakingItems = requests.map((r) => ({ type: 'matchmaking', ...r }));
  const matchItems = pendingMatches.map((m) => ({ type: 'match', ...m }));
  const allItems = [...matchmakingItems, ...matchItems];

  const isSelected = (item) => {
    if (!selectedItem) return false;
    const id = item._id || item.id;
    return (selectedItem._id || selectedItem.id) === id && selectedItem.type === item.type;
  };

  return (
    <AdminLayout>
      <div className="admin-matchmaking">
        <div className="admin-page-header">
          <h1>💕 Gestion des Demandes de Mise en Relation</h1>
          <p className="admin-page-subtitle">Gérer les demandes de matchmaking spéciales et valider les matches (likes mutuels) pour autoriser les conversations</p>
        </div>

        <div className="matchmaking-grid">
          <div className="requests-list">
            <h2>Demandes en attente ({totalPending})</h2>
            {allItems.length === 0 ? (
              <div className="admin-empty-state">
                <div className="admin-empty-icon">✅</div>
                <h3>Aucune demande en attente</h3>
                <p>Toutes les demandes ont été traitées</p>
              </div>
            ) : (
              <div className="requests-items">
                {requests.map((request) => {
                  const rid = request._id || request.id;
                  const requester = request.requester_id || {};
                  const target = request.target_id || {};
                  const guardian = request.guardian || {};
                  const item = { type: 'matchmaking', ...request };
                  return (
                    <div
                      key={`m-${rid}`}
                      className={`request-item ${isSelected(item) ? 'selected' : ''}`}
                      onClick={() => setSelectedItem(item)}
                    >
                      <span className="request-type-badge matchmaking-badge">Mise en relation</span>
                      <div className="request-header">
                        <div className="request-users">
                          <span className="requester">{requester.first_name} {requester.last_name}</span>
                          <span className="arrow">→</span>
                          <span className="target">{target.first_name} {target.last_name}</span>
                        </div>
                      </div>
                      <div className="request-meta">
                        <span className="request-date">
                          {request.createdAt && new Date(request.createdAt).toLocaleString('fr-FR')}
                        </span>
                        {guardian.guardian_name && (
                          <span className="guardian-badge">👤 Tuteur: {guardian.guardian_name}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {pendingMatches.map((match) => {
                  const mid = match._id || match.id;
                  const u1 = match.user1 || {};
                  const u2 = match.user2 || {};
                  const item = { type: 'match', ...match };
                  return (
                    <div
                      key={`match-${mid}`}
                      className={`request-item ${isSelected(item) ? 'selected' : ''}`}
                      onClick={() => setSelectedItem(item)}
                    >
                      <span className="request-type-badge match-badge">Match réciproque</span>
                      <div className="request-header">
                        <div className="request-users">
                          <span className="requester">{u1.first_name} {u1.last_name}</span>
                          <span className="arrow">💕</span>
                          <span className="target">{u2.first_name} {u2.last_name}</span>
                        </div>
                      </div>
                      <div className="request-meta">
                        <span className="request-date">
                          {match.createdAt && new Date(match.createdAt).toLocaleString('fr-FR')}
                        </span>
                        <span className="match-hint">Les deux se sont likés — valider pour autoriser la conversation</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedItem && selectedItem.type === 'matchmaking' && (
            <div className="request-details">
              <div className="details-header">
                <h2>Détails de la demande</h2>
                <button
                  className="close-btn"
                  onClick={() => { setSelectedItem(null); setAdminNotes(''); }}
                >
                  ✕
                </button>
              </div>
              <div className="details-section">
                <h3>👤 Demandeur</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Nom:</span>
                    <span className="info-value">
                      {(selectedItem.requester_id?.first_name || '')} {(selectedItem.requester_id?.last_name || '')}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{selectedItem.requester_id?.email || '-'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Téléphone:</span>
                    <span className="info-value">{selectedItem.requester_id?.phone || 'Non renseigné'}</span>
                  </div>
                  {selectedItem.requester_id?.bio && (
                    <div className="info-item">
                      <span className="info-label">Bio:</span>
                      <span className="info-value">{selectedItem.requester_id.bio}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="details-section">
                <h3>🎯 Cible</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Nom:</span>
                    <span className="info-value">
                      {(selectedItem.target_id?.first_name || '')} {(selectedItem.target_id?.last_name || '')}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{selectedItem.target_id?.email || '-'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Téléphone:</span>
                    <span className="info-value">{selectedItem.target_id?.phone || 'Non renseigné'}</span>
                  </div>
                </div>
              </div>
              {selectedItem.guardian?.guardian_name && (
                <div className="details-section">
                  <h3>👨‍👩‍👧 Tuteur</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Nom:</span>
                      <span className="info-value">{selectedItem.guardian.guardian_name}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{selectedItem.guardian.guardian_email}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Téléphone:</span>
                      <span className="info-value">{selectedItem.guardian.guardian_phone || 'Non renseigné'}</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="details-section">
                <label>Notes administratives</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Ajoutez des notes..."
                  rows={4}
                  className="notes-input"
                />
              </div>
              <div className="action-buttons">
                <button
                  onClick={() => handleValidateMatchmaking(selectedItem._id || selectedItem.id)}
                  className="admin-btn admin-btn-success"
                >
                  ✅ Valider
                </button>
                <button
                  onClick={() => handleRejectMatchmaking(selectedItem._id || selectedItem.id)}
                  className="admin-btn admin-btn-danger"
                >
                  ❌ Rejeter
                </button>
              </div>
            </div>
          )}

          {selectedItem && selectedItem.type === 'match' && (
            <div className="request-details">
              <div className="details-header">
                <h2>Match réciproque — Validation</h2>
                <button
                  className="close-btn"
                  onClick={() => { setSelectedItem(null); setAdminNotes(''); setRejectionReason(''); }}
                >
                  ✕
                </button>
              </div>
              <p className="match-validation-desc">Les deux utilisateurs se sont mutuellement likés. Validez le match pour qu’ils puissent commencer à discuter.</p>
              <div className="match-preview-row">
                <div className="match-user-card">
                  <div className="preview-avatar">
                    {selectedItem.user1?.profile_picture_url ? (
                      <img src={selectedItem.user1.profile_picture_url} alt={selectedItem.user1.first_name} />
                    ) : (
                      <div className="avatar-placeholder large">{selectedItem.user1?.first_name?.[0]}</div>
                    )}
                  </div>
                  <h3>{selectedItem.user1?.first_name} {selectedItem.user1?.last_name}</h3>
                  <p>{selectedItem.user1?.email}</p>
                  {selectedItem.user1?.city && <p>📍 {selectedItem.user1.city}</p>}
                </div>
                <div className="match-connector-large">💕</div>
                <div className="match-user-card">
                  <div className="preview-avatar">
                    {selectedItem.user2?.profile_picture_url ? (
                      <img src={selectedItem.user2.profile_picture_url} alt={selectedItem.user2.first_name} />
                    ) : (
                      <div className="avatar-placeholder large">{selectedItem.user2?.first_name?.[0]}</div>
                    )}
                  </div>
                  <h3>{selectedItem.user2?.first_name} {selectedItem.user2?.last_name}</h3>
                  <p>{selectedItem.user2?.email}</p>
                  {selectedItem.user2?.city && <p>📍 {selectedItem.user2.city}</p>}
                </div>
              </div>
              <div className="details-section">
                <label>Notes (optionnel)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Notes de validation..."
                  rows={2}
                  className="notes-input"
                />
              </div>
              <div className="action-buttons">
                <button
                  onClick={() => handleValidateMatch(selectedItem._id || selectedItem.id)}
                  className="admin-btn admin-btn-success"
                >
                  ✅ Valider le match
                </button>
                <button
                  onClick={() => handleRejectMatch(selectedItem._id || selectedItem.id)}
                  className="admin-btn admin-btn-danger"
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
                  rows={2}
                  className="notes-input"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Matchmaking;
