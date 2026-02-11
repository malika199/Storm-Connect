import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AuthContext = createContext();

/** Décode le payload du JWT (sans vérification) pour lire exp. Retourne null si invalide. */
function getTokenExpiration(token) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded.exp ? decoded.exp * 1000 : null; // exp en secondes -> ms
  } catch {
    return null;
  }
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [likesReceivedCount, setLikesReceivedCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Fonction pour rafraîchir le compteur de messages non lus
  const refreshUnreadCount = useCallback(async () => {
    if (!token || !user || user.role === 'admin' || user.role === 'guardian') {
      return;
    }
    try {
      const response = await axios.get('/api/matching/unread-count');
      setUnreadMessagesCount(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [token, user]);

  // Fonction pour rafraîchir le compteur de likes reçus
  const refreshLikesCount = useCallback(async () => {
    if (!token || !user || user.role === 'admin' || user.role === 'guardian') {
      return;
    }
    try {
      const response = await axios.get('/api/matching/likes-received-count');
      setLikesReceivedCount(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching likes count:', error);
    }
  }, [token, user]);

  // Fonction pour rafraîchir le compteur de notifications non lues
  const refreshNotificationsCount = useCallback(async () => {
    if (!token || !user || user.role === 'admin' || user.role === 'guardian') {
      return;
    }
    try {
      const response = await axios.get('/api/notifications/unread-count');
      setUnreadNotificationsCount(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching notifications count:', error);
    }
  }, [token, user]);

  // Fonction pour rafraîchir tous les compteurs
  const refreshAllCounts = useCallback(async () => {
    await Promise.all([refreshUnreadCount(), refreshLikesCount(), refreshNotificationsCount()]);
  }, [refreshUnreadCount, refreshLikesCount, refreshNotificationsCount]);

  // Fonction centralisée pour gérer la déconnexion automatique
  const handleSessionExpired = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setUnreadMessagesCount(0);
    setLikesReceivedCount(0);
    setUnreadNotificationsCount(0);
    delete axios.defaults.headers.common['Authorization'];
    toast.warning('Votre session a expiré. Veuillez vous reconnecter.');
  }, []);

  // Fonction pour récupérer les informations utilisateur
  const fetchUser = useCallback(async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
      // Si erreur 401 ou session expirée, utiliser la fonction centralisée
      if (error.response?.status === 401 || error.response?.data?.expired) {
        handleSessionExpired();
      } else {
        // Autre erreur, nettoyer quand même
        localStorage.removeItem('token');
        setToken(null);
        delete axios.defaults.headers.common['Authorization'];
      }
    } finally {
      setLoading(false);
    }
  }, [handleSessionExpired]);

  // Vérifier la session au démarrage avec la route check-session (plus légère)
  useEffect(() => {
    const checkSession = async () => {
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          // Utiliser check-session pour une vérification rapide
          const response = await axios.get('/api/auth/check-session');
          if (response.data.valid) {
            // Si la session est valide, récupérer les infos complètes de l'utilisateur
            await fetchUser();
          } else {
            handleSessionExpired();
          }
        } catch (error) {
          // Si erreur 401 ou session expirée, déconnecter
          if (error.response?.status === 401 || error.response?.data?.expired) {
            handleSessionExpired();
          } else {
            // Autre erreur, essayer quand même fetchUser
            await fetchUser();
          }
        }
      } else {
        setLoading(false);
      }
    };

    checkSession();
  }, [token, handleSessionExpired, fetchUser]);

  // Écouter l'événement de session expirée déclenché par l'intercepteur axios
  useEffect(() => {
    const handleSessionExpiredEvent = () => {
      handleSessionExpired();
    };

    window.addEventListener('session-expired', handleSessionExpiredEvent);
    return () => {
      window.removeEventListener('session-expired', handleSessionExpiredEvent);
    };
  }, [handleSessionExpired]);

  // Timer côté client : déconnecter automatiquement à l'heure d'expiration du token
  useEffect(() => {
    if (!token) return;

    const expMs = getTokenExpiration(token);
    if (!expMs) return;

    const delay = expMs - Date.now();
    if (delay <= 0) {
      handleSessionExpired();
      return;
    }

    const timeoutId = setTimeout(handleSessionExpired, delay);
    return () => clearTimeout(timeoutId);
  }, [token, handleSessionExpired]);

  // Vérification périodique de la session (toutes les 5 min) au cas où l'heure du client dérive
  useEffect(() => {
    if (!token || !user) return;

    const intervalId = setInterval(async () => {
      try {
        await axios.get('/api/auth/check-session');
      } catch (err) {
        if (err.response?.status === 401) {
          handleSessionExpired();
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(intervalId);
  }, [token, user, handleSessionExpired]);

  // Rafraîchir les compteurs quand l'utilisateur est connecté
  useEffect(() => {
    if (user && user.role === 'user') {
      refreshAllCounts();
      // Rafraîchir toutes les 30 secondes
      const interval = setInterval(refreshAllCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [user, refreshAllCounts]);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      toast.success('Connexion réussie');
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || 'Erreur lors de la connexion';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      const { token: newToken, user: userDataResponse, invitation_link: invitationLink, invitation_email_sent: invitationEmailSent } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userDataResponse);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      toast.success('Inscription réussie');
      return { success: true, invitation_link: invitationLink, invitation_email_sent: invitationEmailSent };
    } catch (error) {
      const message = error.response?.data?.message || 'Erreur lors de l\'inscription';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setUnreadMessagesCount(0);
    setLikesReceivedCount(0);
    delete axios.defaults.headers.common['Authorization'];
    toast.info('Déconnexion réussie');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isGuardian: user?.role === 'guardian',
    unreadMessagesCount,
    likesReceivedCount,
    unreadNotificationsCount,
    refreshUnreadCount,
    refreshLikesCount,
    refreshNotificationsCount,
    refreshAllCounts
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
