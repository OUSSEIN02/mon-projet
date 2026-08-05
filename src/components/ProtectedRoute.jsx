import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Récupérer le token et les données utilisateur sauvegardés lors du login/register
  const token = localStorage.getItem('access_token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // 1. Vérifier si l'utilisateur est connecté
  if (!token) {
    return <Navigate to="/auth" replace />;
  }


  // Si tout est OK, afficher le composant enfant (ou les routes sous-jacentes)
  return <Outlet />;
};

export default ProtectedRoute;