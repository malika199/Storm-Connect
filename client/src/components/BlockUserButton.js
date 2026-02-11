import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './BlockUserButton.css';

const BlockUserButton = ({ userId, userName, onBlockChange }) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('other');
  const [blockNotes, setBlockNotes] = useState('');

  useEffect(() => {
    checkBlockStatus();
  }, [userId]);

  const checkBlockStatus = async () => {
    try {
      const response = await axios.get(`/api/users/block-status/${userId}`);
      setIsBlocked(response.data.is_blocked);
    } catch (error) {
      console.error('Error checking block status:', error);
    }
  };

  const handleBlockClick = () => {
    if (isBlocked) {
      handleUnblock();
    } else {
      setShowBlockModal(true);
    }
  };

  const handleBlock = async () => {
    setLoading(true);
    try {
      await axios.post(`/api/users/block/${userId}`, {
        reason: blockReason,
        notes: blockNotes
      });
      setIsBlocked(true);
      setShowBlockModal(false);
      setBlockReason('other');
      setBlockNotes('');
      toast.success(`${userName} a été bloqué`);
      if (onBlockChange) onBlockChange(true);
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du blocage');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async () => {
    if (!window.confirm(`Êtes-vous sûr de vouloir débloquer ${userName} ?`)) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`/api/users/block/${userId}`);
      setIsBlocked(false);
      toast.success(`${userName} a été débloqué`);
      if (onBlockChange) onBlockChange(false);
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error('Erreur lors du déblocage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleBlockClick}
        className={`block-user-btn ${isBlocked ? 'blocked' : ''}`}
        disabled={loading}
      >
        {loading ? 'Chargement...' : isBlocked ? 'Débloquer' : 'Bloquer'}
      </button>

      {showBlockModal && (
        <div className="block-modal-overlay" onClick={() => setShowBlockModal(false)}>
          <div className="block-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Bloquer {userName}</h3>
            <p>Cet utilisateur ne pourra plus vous contacter ni voir votre profil.</p>

            <div className="form-group">
              <label>Raison du blocage</label>
              <select
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              >
                <option value="other">Autre</option>
                <option value="harassment">Harcèlement</option>
                <option value="inappropriate_content">Contenu inapproprié</option>
                <option value="spam">Spam</option>
                <option value="fake_profile">Faux profil</option>
              </select>
            </div>

            <div className="form-group">
              <label>Notes (optionnel)</label>
              <textarea
                value={blockNotes}
                onChange={(e) => setBlockNotes(e.target.value)}
                placeholder="Ajoutez des notes sur le blocage..."
                rows="3"
              />
            </div>

            <div className="block-modal-actions">
              <button
                onClick={() => setShowBlockModal(false)}
                className="btn-cancel"
                disabled={loading}
              >
                Annuler
              </button>
              <button
                onClick={handleBlock}
                className="btn-confirm-block"
                disabled={loading}
              >
                {loading ? 'Blocage...' : 'Confirmer le blocage'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BlockUserButton;
