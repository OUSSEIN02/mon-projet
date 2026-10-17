// src/hooks/useLitigesCount.js
import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient'; // Adapte le chemin si nécessaire

export const useLitigesCount = (isAdmin, pollingInterval = 30000) => {
  const [litigesCount, setLitigesCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchCount = async () => {
      try {
        const response = await apiClient.get('/dashboard/litiges/count-pending');
        if (response.data.success) {
          setLitigesCount(response.data.count);
        }
      } catch (error) {
        console.error("Erreur lors du chargement du compteur de litiges:", error);
      }
    };

    fetchCount(); // Appel immédiat
    const interval = setInterval(fetchCount, pollingInterval); // Polling toutes les 30s

    return () => clearInterval(interval);
  }, [isAdmin, pollingInterval]);

  return litigesCount;
};