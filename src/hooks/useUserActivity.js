// src/hooks/useUserActivity.js
import { useEffect, useRef } from 'react';
import apiClient from '../services/apiClient';

export const useUserActivity = () => {
  const activityTimeoutRef = useRef(null);

  useEffect(() => {
    // Fonction pour signaler l'activité au backend
    const pingActivity = async () => {
      try {
        await apiClient.post('/users/activity', {}, { timeout: 2000 });
      } catch (error) {
        // Silencieux en cas d'échec
      }
    };

    // Envoyer un ping immédiatement
    pingActivity();
    
    // Puis toutes les 2 minutes
    const interval = setInterval(pingActivity, 120000);

    // Réinitialiser le timer à chaque activité utilisateur
    const resetActivityTimer = () => {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      activityTimeoutRef.current = setTimeout(pingActivity, 1000);
    };

    // Écouter les événements d'activité
    window.addEventListener('mousemove', resetActivityTimer);
    window.addEventListener('keydown', resetActivityTimer);
    window.addEventListener('click', resetActivityTimer);
    window.addEventListener('scroll', resetActivityTimer);

    return () => {
      clearInterval(interval);
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      window.removeEventListener('mousemove', resetActivityTimer);
      window.removeEventListener('keydown', resetActivityTimer);
      window.removeEventListener('click', resetActivityTimer);
      window.removeEventListener('scroll', resetActivityTimer);
    };
  }, []);
};