import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    //  DÉCONNEXION INSTANTANÉE SI LE COMPTE EST BLOQUÉ CÔTÉ BACKEND
    if (error.response?.status === 401 || error.response?.status === 423) {
      localStorage.clear();
      // Utilisation de window.location pour une redirection brute et garantie
      window.location.href = '/auth'; 
    }
    return Promise.reject(error);
  }
);

// 🟢 INTERCEPTEUR DE RÉPONSE AMÉLIORÉ
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Session expirée ou token invalide côté serveur');
      
      // Nettoyage complet du localStorage en cas de 401
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.removeItem('permissions');
      localStorage.removeItem('session_expires_at');
      
      // Redirection forcée et immédiate vers la page de connexion
      window.location.href = '/auth'; 
    }
    return Promise.reject(error);
  }
);

export default apiClient;