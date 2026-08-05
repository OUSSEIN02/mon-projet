// src/config/api.js

// On récupère l'URL depuis le fichier .env, avec une valeur par défaut de secours
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
export const photoUrl = import.meta.env.VITE_ASSETS_BASE_URL || 'http://localhost:8000';

// Vous pouvez aussi y mettre d'autres constantes globales si besoin
export const APP_NAME = 'Gabon Livraison Express';