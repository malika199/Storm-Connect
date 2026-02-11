import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, requireAdmin = false, requireGuardian = false }) => {
  const { isAuthenticated, loading, isAdmin, isGuardian } = useAuth();

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/user" replace />;
  }

  if (requireGuardian && !isGuardian) {
    return <Navigate to="/user" replace />;
  }

  return children;
};

export default PrivateRoute;
