import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import { toast } from 'react-toastify';
import './Dashboard.css';

const RELATIONSHIP_LABELS = {
  parent: 'Parent',
  sibling: 'Frère / Sœur',
  friend: 'Ami(e)',
  other: 'Autre'
};

const GuardianDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchNotifications();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/guardians/me-and-ward');
      setProfile(response.data);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching profile:', error);
        toast.error('Erreur lors du chargement du profil');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/guardians/notifications');
      setNotifications(response.data.notifications || []);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching notifications:', error);
        toast.error('Erreur lors du chargement des notifications');
      }
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container">
          <div className="loading">Chargement...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <h1>Tableau de bord Tuteur</h1>

        {profile && (
          <>
            <div className="card guardian-profile-cards">
              <h2>👤 Vos informations</h2>
              <dl className="guardian-info-list">
                <dt>Nom</dt>
                <dd>{profile.guardian.guardian_name}</dd>
                <dt>Email</dt>
                <dd>{profile.guardian.guardian_email}</dd>
                {profile.guardian.guardian_phone && (
                  <>
                    <dt>Téléphone</dt>
                    <dd>{profile.guardian.guardian_phone}</dd>
                  </>
                )}
                <dt>Lien avec le candidat</dt>
                <dd>{RELATIONSHIP_LABELS[profile.guardian.guardian_relationship] || profile.guardian.guardian_relationship}</dd>
              </dl>
            </div>

            <div className="card guardian-ward-card">
              <h2>👤 Vous êtes le tuteur de</h2>
              {profile.ward ? (
                <div className="ward-info">
                  <p className="ward-name">
                    <strong>{profile.ward.first_name} {profile.ward.last_name}</strong>
                  </p>
                  {profile.ward.email && <p className="ward-detail">📧 {profile.ward.email}</p>}
                  {(profile.ward.city || profile.ward.country) && (
                    <p className="ward-detail">📍 {[profile.ward.city, profile.ward.country].filter(Boolean).join(', ')}</p>
                  )}
                  {profile.ward.date_of_birth && (
                    <p className="ward-detail">🎂 Né(e) le {new Date(profile.ward.date_of_birth).toLocaleDateString('fr-FR')}</p>
                  )}
                </div>
              ) : (
                <p>Aucune personne associée.</p>
              )}
            </div>
          </>
        )}
        
        <div className="card">
          <h2>Notifications récentes</h2>
          {notifications.length === 0 ? (
            <p>Aucune notification</p>
          ) : (
            <div>
              {notifications.map(notif => (
                <div
                  key={notif._id || notif.id}
                  className="card"
                  style={{
                    backgroundColor: notif.is_read ? 'var(--bg-color)' : 'var(--bg-light)',
                    cursor: 'pointer'
                  }}
                  onClick={() => !notif.is_read && markAsRead(notif._id || notif.id)}
                >
                  <h3>{notif.title}</h3>
                  <p>{notif.message}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                    {new Date(notif.createdAt || notif.created_at).toLocaleString('fr-FR')}
                  </p>
                  {!notif.is_read && (
                    <span style={{ color: 'var(--secondary-color)', fontSize: '12px' }}>Nouveau</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2>Actions rapides</h2>
          <Link to="/guardian/discussions" className="btn btn-primary">
            Voir les discussions
          </Link>
        </div>
      </div>
    </>
  );
};

export default GuardianDashboard;
