import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import { toast } from 'react-toastify';
import './Global.css';
import './Users.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, filterStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      const response = await axios.get('/api/admin/users', { params });

      let filteredUsers = response.data.users || [];

      if (filterStatus === 'active') {
        filteredUsers = filteredUsers.filter((u) => u.is_active);
      } else if (filterStatus === 'inactive') {
        filteredUsers = filteredUsers.filter((u) => !u.is_active);
      } else if (filterStatus === 'pending') {
        filteredUsers = filteredUsers.filter((u) => !u.is_verified);
      }

      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id) => {
    try {
      await axios.post(`/api/admin/users/${id}/verify`);
      toast.success('Profil vérifié');
      fetchUsers();
    } catch (error) {
      console.error('Error verifying user:', error);
      toast.error('Erreur lors de la vérification');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await axios.post(`/api/admin/users/${id}/toggle-active`);
      toast.success('Statut modifié');
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user:', error);
      toast.error('Erreur lors de la modification');
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
      <div className="admin-users">
        <div className="admin-page-header">
          <h1>👥 Gestion des Utilisateurs</h1>
          <p className="admin-page-subtitle">
            Gérer tous les utilisateurs - Valider les profils pour permettre le matching
          </p>
        </div>

        <div className="admin-card">
          <div className="filters-row">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tous</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
              <option value="pending">En attente</option>
            </select>
          </div>
        </div>

        <div className="admin-card">
          <h2>Liste des utilisateurs ({users.length})</h2>
          {users.length === 0 ? (
            <div className="admin-empty-state">
              <div className="admin-empty-icon">👤</div>
              <h3>Aucun utilisateur trouvé</h3>
              <p>Essayez de modifier vos critères de recherche</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Genre</th>
                    <th>Statut</th>
                    <th>Validation</th>
                    <th>Abonnement</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const userId = user._id || user.id;
                    return (
                      <tr
                        key={userId}
                        style={{
                          backgroundColor: !user.is_verified ? '#fff9e6' : 'transparent',
                        }}
                      >
                        <td>
                          <div className="user-cell">
                            <strong>{user.first_name} {user.last_name}</strong>
                            {!user.is_verified && (
                              <span className="admin-badge admin-badge-warning" style={{ marginLeft: '8px', fontSize: '10px' }}>
                                ⚠️ À valider
                              </span>
                            )}
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>{user.gender === 'male' ? '👨 Homme' : '👩 Femme'}</td>
                        <td>
                          {user.is_active ? (
                            <span className="admin-badge admin-badge-success">Actif</span>
                          ) : (
                            <span className="admin-badge admin-badge-danger">Inactif</span>
                          )}
                        </td>
                        <td>
                          <div className="validation-status">
                            {user.is_verified ? (
                              <span className="admin-badge admin-badge-success">Validé</span>
                            ) : (
                              <span className="admin-badge admin-badge-warning">En attente</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`admin-badge ${
                              user.subscription_status === 'vip'
                                ? 'admin-badge-info'
                                : user.subscription_status === 'premium'
                                ? 'admin-badge-success'
                                : 'admin-badge-warning'
                            }`}
                          >
                            {user.subscription_status || 'free'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            {user.id_verification_status === 'pending' && (
                              <button
                                onClick={() => handleVerify(userId)}
                                className="admin-btn admin-btn-success"
                                style={{ padding: '6px 12px', fontSize: '12px', marginRight: '8px' }}
                              >
                                Vérifier ID
                              </button>
                            )}
                            <button
                              onClick={() => handleToggleActive(userId)}
                              className={`admin-btn ${user.is_active ? 'admin-btn-danger' : 'admin-btn-success'}`}
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              {user.is_active ? 'Désactiver' : 'Activer'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Users;
