import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAccountStatusMonitor } from '../hooks/useAccountStatusMonitor';

const ProtectedRoute = () => {

  useAccountStatusMonitor();

  const token = localStorage.getItem('access_token');
  const sessionExpiresAt = localStorage.getItem('session_expires_at');

  // 1. Vérifier si l'utilisateur est connecté (token présent)
  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  // 2. 🟢 NOUVEAU : Vérifier si la session a expiré
  if (sessionExpiresAt) {
    const now = Date.now();
    const expirationTime = parseInt(sessionExpiresAt, 10);

    if (now > expirationTime) {
      // Session expirée : nettoyage complet et redirection
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.removeItem('permissions');
      localStorage.removeItem('session_expires_at');
      
      return <Navigate to="/auth" replace />;
    }
  }

  // Si tout est OK (token valide et non expiré), afficher les routes enfants
  return <Outlet />;
};

export default ProtectedRoute;