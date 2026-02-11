import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import { toast } from 'react-toastify';
import './Global.css';
import './Statistics.css';

const Statistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await axios.get('/api/admin/statistics');
      setStats(response.data.statistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
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

  const userStats = {
    total: stats?.totalUsers || 0,
    active: stats?.activeUsers || 0,
    verified: stats?.verifiedUsers || 0,
    activationRate: stats?.totalUsers ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : 0,
  };

  const matchStats = {
    pending: stats?.pendingMatchValidations || 0,
    validated: stats?.validatedMatches || 0,
    total: (stats?.pendingMatchValidations || 0) + (stats?.validatedMatches || 0),
    validationRate:
      (stats?.pendingMatchValidations || 0) + (stats?.validatedMatches || 0) > 0
        ? (
            ((stats?.validatedMatches || 0) /
              ((stats?.pendingMatchValidations || 0) + (stats?.validatedMatches || 0))) *
            100
          ).toFixed(1)
        : 0,
  };

  const revenueStats = {
    total: stats?.totalRevenue || 0,
    subscriptions: stats?.activeSubscriptions || 0,
    average: stats?.activeSubscriptions ? (stats.totalRevenue / stats.activeSubscriptions).toFixed(2) : 0,
  };

  return (
    <AdminLayout>
      <div className="admin-statistics">
        <div className="admin-page-header">
          <h1>📈 Statistiques Détaillées</h1>
          <p className="admin-page-subtitle">Analyses approfondies de la plateforme</p>
        </div>

        <div className="stats-sections">
          <div className="admin-card stats-card">
            <div className="stats-card-header">
              <div className="stats-icon" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
                👥
              </div>
              <h2>Utilisateurs</h2>
            </div>
            <div className="stats-content">
              <div className="stat-row">
                <span className="stat-label">Total utilisateurs</span>
                <span className="stat-value">{userStats.total}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Utilisateurs actifs</span>
                <span className="stat-value success">{userStats.active}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Utilisateurs vérifiés</span>
                <span className="stat-value info">{userStats.verified}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Taux d'activation</span>
                <span className="stat-value">{userStats.activationRate}%</span>
              </div>
              <div className="stat-progress">
                <div
                  className="stat-progress-bar"
                  style={{ width: `${userStats.activationRate}%`, background: '#10b981' }}
                />
              </div>
            </div>
          </div>

          <div className="admin-card stats-card">
            <div className="stats-card-header">
              <div className="stats-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' }}>
                💕
              </div>
              <h2>Matches</h2>
            </div>
            <div className="stats-content">
              <div className="stat-row">
                <span className="stat-label">Matches en attente</span>
                <span className="stat-value warning">{matchStats.pending}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Matches validés</span>
                <span className="stat-value success">{matchStats.validated}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Total matches</span>
                <span className="stat-value">{matchStats.total}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Taux de validation</span>
                <span className="stat-value">{matchStats.validationRate}%</span>
              </div>
              <div className="stat-progress">
                <div
                  className="stat-progress-bar"
                  style={{ width: `${matchStats.validationRate}%`, background: '#6366f1' }}
                />
              </div>
            </div>
          </div>

          <div className="admin-card stats-card">
            <div className="stats-card-header">
              <div className="stats-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                💰
              </div>
              <h2>Revenus</h2>
            </div>
            <div className="stats-content">
              <div className="stat-row">
                <span className="stat-label">Revenus totaux</span>
                <span className="stat-value success large">{revenueStats.total.toFixed(2)} €</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Abonnements actifs</span>
                <span className="stat-value">{revenueStats.subscriptions}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Revenu moyen</span>
                <span className="stat-value">{revenueStats.average} €</span>
              </div>
            </div>
          </div>

          <div className="admin-card stats-card">
            <div className="stats-card-header">
              <div className="stats-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                ⚡
              </div>
              <h2>Validations</h2>
            </div>
            <div className="stats-content">
              <div className="stat-row">
                <span className="stat-label">Profils en attente</span>
                <span className="stat-value warning">{stats?.pendingProfileValidations || 0}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Matches en attente</span>
                <span className="stat-value warning">{stats?.pendingMatchValidations || 0}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Total en attente</span>
                <span className="stat-value">
                  {(stats?.pendingProfileValidations || 0) + (stats?.pendingMatchValidations || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Statistics;
