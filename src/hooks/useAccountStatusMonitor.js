import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';

export const useAccountStatusMonitor = () => {
  const navigate = useNavigate();
  const intervalRef = useRef(null);

  const checkStatus = async () => {
    try {
      const response = await apiClient.get('/me/status');
      const data = response.data;
      const status = data?.status;
      const role = data?.role;

      // 🛡️ EXCEPTION CRITIQUE : Ne rien faire si l'utilisateur est un Admin
      if (role === 'admin') {
        return; 
      }

      // 🚨 Si le compte (vendeur/livreur) n'est plus 'valide', on déconnecte
      if (status !== 'valide') {
        handleForceLogout(status);
      }
    } catch (error) {
      // Si le backend renvoie 401 ou 423, on vérifie le rôle avant de déconnecter
      if (error.response?.status === 401 || error.response?.status === 423) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            const roles = user.roles || [];
            const isAdmin = roles.some(r => r.slug === 'admin' || r.name === 'admin');
            
            // On ne déconnecte que si ce n'est PAS un admin
            if (!isAdmin) {
              handleForceLogout('suspendu');
            }
          } catch (e) {
            console.error("Erreur lecture user:", e);
          }
        }
      }
    }
  };

  const handleForceLogout = (reason) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    // Vider tout le stockage
    localStorage.clear();
    
    // Afficher un message
    alert(reason === 'suspendu' 
      ? '⚠️ Votre compte a été suspendu par l\'administrateur.' 
      : '⚠️ Votre compte est en attente de validation ou a été rejeté.');
    
    // Redirection forcée vers la page de connexion (qui est '/auth' dans ton App.jsx)
    navigate('/auth', { replace: true });
  };

  useEffect(() => {
    // 1. Vérifier immédiatement au chargement
    checkStatus();

    // 2. Polling toutes les 10 secondes
    intervalRef.current = setInterval(checkStatus, 10000);

    // 3. Vérifier quand l'utilisateur revient sur l'onglet du navigateur
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkStatus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Nettoyage
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [navigate]);
};