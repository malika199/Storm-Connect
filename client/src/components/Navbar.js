import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

// URL du back office admin (app séparée sur le port 3001)
const ADMIN_APP_URL = process.env.REACT_APP_ADMIN_URL || 'http://localhost:3001';

const Navbar = () => {
  const auth = useAuth();
  const { user, logout, isAdmin, isGuardian, unreadMessagesCount, likesReceivedCount } = auth;
  const unreadNotificationsCount = auth.unreadNotificationsCount ?? 0;
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (isGuardian) return '/guardian';
    if (isAdmin) return '/'; // Admin : reste sur le site client, lien "Back Office" ouvre l'app admin
    return '/user';
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to={getDashboardLink()} className="navbar-brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-text">Storm Connect</span>
        </Link>
        
        {user && (
          <>
            {/* Menu Desktop */}
            <div className="navbar-menu desktop-menu">
              {!isAdmin && !isGuardian && (
                <>
                  <Link 
                    to="/user/match" 
                    className={`nav-item ${isActive('/user/match') ? 'active' : ''}`}
                  >
                    <span className="nav-icon">💕</span>
                    <span className="nav-label">Match</span>
                    {likesReceivedCount > 0 && (
                      <span className="nav-badge likes">
                        {likesReceivedCount > 99 ? '99+' : likesReceivedCount}
                      </span>
                    )}
                  </Link>
                  <Link 
                    to="/user/conversations" 
                    className={`nav-item ${isActive('/user/conversations') ? 'active' : ''}`}
                  >
                    <span className="nav-icon">💬</span>
                    <span className="nav-label">Messages</span>
                    {unreadMessagesCount > 0 && (
                      <span className="nav-badge messages">
                        {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                      </span>
                    )}
                  </Link>
                  <Link 
                    to="/user/profile" 
                    className={`nav-item ${isActive('/user/profile') ? 'active' : ''}`}
                  >
                    <span className="nav-icon">👤</span>
                    <span className="nav-label">Profil</span>
                  </Link>
                  <Link 
                    to="/user/notifications" 
                    className={`nav-item ${isActive('/user/notifications') ? 'active' : ''}`}
                  >
                    <span className="nav-icon">🔔</span>
                    <span className="nav-label">Notifications</span>
                    {unreadNotificationsCount > 0 && (
                      <span className="nav-badge notifications">
                        {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                      </span>
                    )}
                  </Link>
                  <Link 
                    to="/user/blocked" 
                    className={`nav-item ${isActive('/user/blocked') ? 'active' : ''}`}
                  >
                    <span className="nav-icon">🚫</span>
                    <span className="nav-label">Bloqués</span>
                  </Link>
                </>
              )}
              
              {isGuardian && (
                <>
                  <Link to="/guardian" className={`nav-item ${isActive('/guardian') && location.pathname === '/guardian' ? 'active' : ''}`}>
                    <span className="nav-icon">📊</span>
                    <span className="nav-label">Tableau de bord</span>
                  </Link>
                  <Link to="/guardian/discussions" className={`nav-item ${isActive('/guardian/discussions') ? 'active' : ''}`}>
                    <span className="nav-icon">💬</span>
                    <span className="nav-label">Discussions</span>
                  </Link>
                </>
              )}
              
              {isAdmin && (
                <a href={ADMIN_APP_URL} target="_blank" rel="noopener noreferrer" className="nav-item nav-item-external">
                  <span className="nav-icon">⚡</span>
                  <span className="nav-label">Back Office</span>
                </a>
              )}

              <button onClick={handleLogout} className="logout-btn">
                <span className="logout-icon">🚪</span>
                <span className="logout-text">Déconnexion</span>
              </button>
            </div>

            {/* Bouton Menu Mobile */}
            <button 
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}></span>
            </button>

            {/* Menu Mobile */}
            {mobileMenuOpen && (
              <div className="mobile-menu">
                {!isAdmin && !isGuardian && (
                  <>
                    <Link to="/user/match" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                      <span>💕</span> Match
                      {likesReceivedCount > 0 && <span className="mobile-badge">{likesReceivedCount}</span>}
                    </Link>
                    <Link to="/user/conversations" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                      <span>💬</span> Messages
                      {unreadMessagesCount > 0 && <span className="mobile-badge">{unreadMessagesCount}</span>}
                    </Link>
                    <Link to="/user/profile" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                      <span>👤</span> Profil
                    </Link>
                    <Link to="/user/notifications" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                      <span>🔔</span> Notifications
                      {unreadNotificationsCount > 0 && <span className="mobile-badge">{unreadNotificationsCount}</span>}
                    </Link>
                    <Link to="/user/blocked" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                      <span>🚫</span> Bloqués
                    </Link>
                  </>
                )}
                {isGuardian && (
                  <>
                    <Link to="/guardian" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                      <span>📊</span> Tableau de bord
                    </Link>
                    <Link to="/guardian/discussions" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                      <span>💬</span> Discussions
                    </Link>
                  </>
                )}
                {isAdmin && (
                  <a href={ADMIN_APP_URL} target="_blank" rel="noopener noreferrer" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                    <span>⚡</span> Back Office
                  </a>
                )}
                <button onClick={handleLogout} className="mobile-logout-btn">
                  <span>🚪</span> Déconnexion
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
