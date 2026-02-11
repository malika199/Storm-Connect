import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import { toast } from 'react-toastify';
import './Global.css';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
    const interval = setInterval(fetchStatistics, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await axios.get('/api/admin/statistics');
      setStats(response.data.statistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-loading">
          <div className="spinner"></div>
          <p>Chargement des statistiques...</p>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    { title: 'Total Utilisateurs', value: stats?.totalUsers || 0, icon: '👥', color: '#6366f1', link: '/users' },
    { title: 'Utilisateurs Actifs', value: stats?.activeUsers || 0, icon: '✅', color: '#10b981', link: '/users' },
    { title: 'Profils en Attente', value: stats?.pendingProfileValidations || 0, icon: '⏳', color: '#f59e0b', link: '/validations', urgent: true },
    { title: 'Matches en Attente', value: stats?.pendingMatchValidations || 0, icon: '💕', color: '#f59e0b', link: '/matchmaking', urgent: true },
    { title: 'Matches Validés', value: stats?.validatedMatches || 0, icon: '🎉', color: '#6366f1', link: '/statistics' },
    { title: 'Revenus Totaux', value: `${stats?.totalRevenue?.toFixed(2) || '0.00'} €`, icon: '💰', color: '#10b981', link: '/statistics' },
    { title: 'Abonnements Actifs', value: stats?.activeSubscriptions || 0, icon: '⭐', color: '#8b5cf6', link: '/users' },
    { title: 'Utilisateurs Vérifiés', value: stats?.verifiedUsers || 0, icon: '🔒', color: '#06b6d4', link: '/users' },
  ];

  return (
    <AdminLayout>
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <h1>📊 Dashboard Administrateur</h1>
          <p className="dashboard-subtitle">Vue d'ensemble de la plateforme</p>
        </div>

        <div className="stats-grid">
          {statCards.map((card, index) => (
            <Link
              key={index}
              to={card.link}
              className={`stat-card ${card.urgent ? 'urgent' : ''}`}
            >
              <div className="stat-card-icon" style={{ backgroundColor: `${card.color}20`, color: card.color }}>
                {card.icon}
              </div>
              <div className="stat-card-content">
                <h3>{card.title}</h3>
                <p className="stat-value" style={{ color: card.color }}>{card.value}</p>
              </div>
              {card.urgent && <div className="urgent-badge">!</div>}
            </Link>
          ))}
        </div>

        <div className="dashboard-section">
          <h2>⚡ Actions Rapides</h2>
          <div className="quick-actions">
            <Link to="/validations" className="action-card primary">
              <div className="action-icon">⚡</div>
              <div className="action-content">
                <h3>Gérer les Validations</h3>
                <p>Valider les profils et matches en attente</p>
                {(stats?.pendingProfileValidations > 0 || stats?.pendingMatchValidations > 0) && (
                  <span className="action-badge">
                    {stats.pendingProfileValidations + stats.pendingMatchValidations} en attente
                  </span>
                )}
              </div>
            </Link>
            <Link to="/users" className="action-card">
              <div className="action-icon">👥</div>
              <div className="action-content">
                <h3>Gérer les Utilisateurs</h3>
                <p>Voir et gérer tous les utilisateurs</p>
              </div>
            </Link>
            <Link to="/matchmaking" className="action-card">
              <div className="action-icon">💕</div>
              <div className="action-content">
                <h3>Matchmaking</h3>
                <p>Gérer les demandes de mise en relation</p>
              </div>
            </Link>
            <Link to="/statistics" className="action-card">
              <div className="action-icon">📈</div>
              <div className="action-content">
                <h3>Statistiques Détaillées</h3>
                <p>Analyses approfondies de la plateforme</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>📋 Activité Récente</h2>
          <div className="activity-card">
            <div className="activity-item">
              <div className="activity-icon">👤</div>
              <div className="activity-content">
                <p><strong>{stats?.totalUsers || 0}</strong> utilisateurs inscrits</p>
                <span className="activity-time">Total</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">✅</div>
              <div className="activity-content">
                <p><strong>{stats?.activeUsers || 0}</strong> utilisateurs actifs</p>
                <span className="activity-time">Actuellement</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">💕</div>
              <div className="activity-content">
                <p><strong>{stats?.validatedMatches || 0}</strong> matches validés</p>
                <span className="activity-time">Total</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">💰</div>
              <div className="activity-content">
                <p><strong>{stats?.totalRevenue?.toFixed(2) || '0.00'} €</strong> de revenus</p>
                <span className="activity-time">Total</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
