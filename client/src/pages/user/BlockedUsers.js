import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './BlockedUsers.css';

const BlockedUsers = () => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      const response = await axios.get('/api/users/blocked');
      setBlockedUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      toast.error('Erreur lors du chargement des utilisateurs bloqués');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir débloquer cet utilisateur ?')) {
      return;
    }

    try {
      await axios.delete(`/api/users/block/${userId}`);
      toast.success('Utilisateur débloqué avec succès');
      fetchBlockedUsers();
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error('Erreur lors du déblocage');
    }
  };

  const getReasonLabel = (reason) => {
    const reasons = {
      harassment: 'Harcèlement',
      inappropriate_content: 'Contenu inapproprié',
      spam: 'Spam',
      fake_profile: 'Faux profil',
      other: 'Autre'
    };
    return reasons[reason] || reason;
  };

  if (loading) {
    return (
      <>
        <div className="blocked-users-container">
          <div className="loading">Chargement...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="blocked-users-container">
        <div className="blocked-users-header">
          <h2>Utilisateurs bloqués</h2>
          <p>
            Les utilisateurs bloqués ne peuvent plus vous envoyer de messages,
            voir votre profil ou interagir avec vous de quelque manière que ce soit.
          </p>
        </div>

        {blockedUsers.length === 0 ? (
          <div className="no-blocked-users">
            <p>Vous n'avez bloqué aucun utilisateur.</p>
          </div>
        ) : (
          <div className="blocked-users-list">
            {blockedUsers.map((user) => (
              <div key={user.id} className="blocked-user-card">
                <div className="blocked-user-info">
                  <img
                    src={user.profile_picture_url || '/default-avatar.png'}
                    alt={`${user.first_name} ${user.last_name}`}
                    className="blocked-user-avatar"
                  />
                  <div className="blocked-user-details">
                    <h3>{user.first_name} {user.last_name}</h3>
                    <p className="block-reason">
                      Raison : {getReasonLabel(user.reason)}
                    </p>
                    {user.notes && (
                      <p className="block-notes">Notes : {user.notes}</p>
                    )}
                    <p className="block-date">
                      Bloqué le {new Date(user.blocked_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleUnblock(user.id)}
                  className="btn-unblock"
                >
                  Débloquer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default BlockedUsers;
