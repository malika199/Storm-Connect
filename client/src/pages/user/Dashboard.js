import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalMatches: 0,
    unreadMessages: 0,
    unreadNotifications: 0
  });
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [matchesRes, unreadRes, notificationsRes] = await Promise.allSettled([
        axios.get('/api/matching/matches'),
        axios.get('/api/matching/unread-count'),
        axios.get('/api/notifications/unread-count')
      ]);

      const matches = matchesRes.status === 'fulfilled' ? matchesRes.value.data.matches || [] : [];
      const unreadCount = unreadRes.status === 'fulfilled' ? unreadRes.value.data.count || 0 : 0;
      const notifCount = notificationsRes.status === 'fulfilled' ? notificationsRes.value.data.count || 0 : 0;

      // Filtrer les matches valides
      const validMatches = matches.filter(m => m && m.user && m.user.first_name);

      setStats({
        totalMatches: validMatches.length,
        unreadMessages: unreadCount,
        unreadNotifications: notifCount
      });

      setRecentMatches(validMatches.slice(0, 4));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="container">
          <div className="loading">
            <div className="spinner" />
            <p>Chargement...</p>
          </div>
        </div>
      </>
    );
  }

  const targetGender = user?.gender === 'male' ? 'femmes' : 'hommes';

  return (
    <>
      <div className="container" style={{ paddingTop: '30px', paddingBottom: '30px' }}>
        {/* Welcome Section */}
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white',
          marginBottom: '30px'
        }}>
          <h1 style={{ marginBottom: '10px' }}>
            Bonjour {user?.first_name} ! 👋
          </h1>
          <p style={{ opacity: 0.9, marginBottom: '20px' }}>
            Découvrez des {targetGender} qui pourraient vous correspondre
          </p>
          <button 
            onClick={() => navigate('/user/match')} 
            style={{
              background: 'white',
              color: '#764ba2',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '30px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={e => e.target.style.transform = 'scale(1)'}
          >
            💕 Commencer à matcher
          </button>
        </div>
        
        {/* Stats Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px', 
          marginBottom: '30px' 
        }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>💕</div>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff6b6b' }}>
              {stats.totalMatches}
            </p>
            <p style={{ color: '#666' }}>Matches</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>💬</div>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea' }}>
              {stats.unreadMessages}
            </p>
            <p style={{ color: '#666' }}>Messages non lus</p>
          </div>
          
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔔</div>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff9800' }}>
              {stats.unreadNotifications}
            </p>
            <p style={{ color: '#666' }}>Notifications</p>
          </div>
        </div>

        {/* Recent Matches */}
        {recentMatches.length > 0 && (
          <div className="card" style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Vos derniers matches 💕</h2>
              <Link to="/user/conversations" style={{ color: '#667eea', textDecoration: 'none' }}>
                Voir tout →
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
              {recentMatches.map(match => (
                <div 
                  key={match.id} 
                  onClick={() => navigate('/user/conversations')}
                  style={{ 
                    textAlign: 'center', 
                    cursor: 'pointer',
                    padding: '15px',
                    borderRadius: '15px',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    margin: '0 auto 10px',
                    border: '3px solid #667eea'
                  }}>
                    {match.user?.profile_picture_url ? (
                      <img 
                        src={match.user.profile_picture_url} 
                        alt={match.user?.first_name || 'Profil'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '30px',
                        fontWeight: 'bold'
                      }}>
                        {match.user?.first_name?.[0] || '?'}
                      </div>
                    )}
                  </div>
                  <p style={{ fontWeight: '500', color: '#333' }}>{match.user?.first_name || 'Utilisateur'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Quick Actions */}
        <div className="card">
          <h2 style={{ marginBottom: '20px' }}>Actions rapides</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <Link 
              to="/user/match" 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                padding: '20px',
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)',
                color: 'white',
                borderRadius: '15px',
                textDecoration: 'none',
                transition: 'transform 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span style={{ fontSize: '30px' }}>💕</span>
              <div>
                <strong>Découvrir</strong>
                <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>Trouver l'amour</p>
              </div>
            </Link>

            <Link 
              to="/user/conversations" 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                padding: '20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '15px',
                textDecoration: 'none',
                transition: 'transform 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span style={{ fontSize: '30px' }}>💬</span>
              <div>
                <strong>Messages</strong>
                <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>Discuter avec vos matches</p>
              </div>
            </Link>

            <Link 
              to="/user/profile" 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                padding: '20px',
                background: '#f5f5f5',
                color: '#333',
                borderRadius: '15px',
                textDecoration: 'none',
                transition: 'transform 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span style={{ fontSize: '30px' }}>👤</span>
              <div>
                <strong>Mon profil</strong>
                <p style={{ fontSize: '0.9rem', color: '#666' }}>Modifier mes infos</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserDashboard;
