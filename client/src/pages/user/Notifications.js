import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './Notifications.css';

const UserNotifications = () => {
  const { user, refreshNotificationsCount } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications');
      setNotifications(response.data.notifications || []);
      refreshNotificationsCount();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, is_read: true } : n))
      );
      refreshNotificationsCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      refreshNotificationsCount();
      toast.success('Toutes les notifications ont été marquées comme lues');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Erreur');
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getIcon = (type) => {
    switch (type) {
      case 'profile_approved':
        return '✅';
      case 'match_approved':
        return '💕';
      case 'profile_rejected':
        return '❌';
      default:
        return '🔔';
    }
  };

  if (loading) {
    return (
      <>
        <div className="notifications-container">
          <div className="notifications-loading">Chargement...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="notifications-container">
        <div className="notifications-card">
          <div className="notifications-header">
            <h1>🔔 Notifications</h1>
            {notifications.some(n => !n.is_read) && (
              <button onClick={markAllAsRead} className="btn btn-secondary btn-sm">
                Tout marquer comme lu
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="notifications-empty">
              <p>Aucune notification pour le moment.</p>
              <Link to="/user/match" className="btn btn-primary">Découvrir des profils</Link>
            </div>
          ) : (
            <ul className="notifications-list">
              {notifications.map((notif) => (
                <li
                  key={notif._id}
                  className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                  onClick={() => !notif.is_read && markAsRead(notif._id)}
                >
                  <span className="notification-icon">{getIcon(notif.type)}</span>
                  <div className="notification-content">
                    <strong>{notif.title}</strong>
                    <p>{notif.message}</p>
                    <span className="notification-date">{formatDate(notif.createdAt)}</span>
                  </div>
                  {!notif.is_read && <span className="notification-dot" />}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default UserNotifications;
