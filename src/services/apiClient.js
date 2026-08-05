// src/services/apiClient.js
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// 1. Création de l'instance Axios avec l'URL de base centralisée
const apiClient = axios.create({
  baseURL: API_BASE_URL, // <-- Ici, l'URL est injectée automatiquement
  headers: {
    'Accept': 'application/json',
    // Ne mettez PAS 'Content-Type': 'multipart/form-data' ici. 
    // Axios le gère tout seul quand vous envoyez un objet FormData.
  },
});

// 2. (Optionnel mais recommandé) Intercepteur pour ajouter le token d'authentification automatiquement
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token'); // Adaptez selon votre stockage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. (Optionnel) Intercepteur pour gérer les erreurs globalement (ex: déconnexion si token expiré)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Gérer la déconnexion automatique ici si besoin
      console.warn('Session expirée');
    }
    return Promise.reject(error);
  }
);

export default apiClient;