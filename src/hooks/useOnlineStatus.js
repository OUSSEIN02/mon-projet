
import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';

export const useOnlineStatus = (userId) => {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);

  useEffect(() => {
    if (!userId) return;

    // Fonction pour récupérer le statut
    const fetchStatus = async () => {
      try {
        const response = await apiClient.get(`/users/${userId}/status`);
        setIsOnline(response.data.is_online);
        setLastSeen(response.data.last_seen);
      } catch (error) {
        console.error("Erreur récupération statut:", error);
      }
    };

    fetchStatus();
    
    // Polling toutes les 30 secondes
    const interval = setInterval(fetchStatus, 30000);
    
    return () => clearInterval(interval);
  }, [userId]);

  return { isOnline, lastSeen };
};