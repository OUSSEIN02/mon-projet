// src/utils/sessionManager.js

export const checkSessionValidity = () => {
    const expiresAt = localStorage.getItem('session_expires_at');
    
    // Si aucune date d'expiration n'est définie, on considère la session comme expirée par sécurité
    if (!expiresAt) {
      clearSession();
      return false;
    }
  
    const now = Date.now();
    const expirationTime = parseInt(expiresAt, 10);
  
    // Si l'heure actuelle dépasse l'heure d'expiration
    if (now > expirationTime) {
      clearSession();
      return false;
    }
  
    return true;
  };
  
  export const clearSession = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('permissions');
    localStorage.removeItem('session_expires_at');
  };