// src/hooks/useGoogleMaps.js
import { useJsApiLoader } from '@react-google-maps/api';

// IMPORTANT : ce tableau doit être défini une seule fois, en dehors du composant/hook,
// sinon @react-google-maps/api considère que les "libraries" changent à chaque render
// et recharge le script (ce qui provoque les erreurs "already defined").
const libraries = ['places']; // nécessaire pour la recherche/autocomplétion d'adresses (MapPickerModal)

/**
 * Hook global pour charger l'API Google Maps une seule fois dans toute l'application.
 * Utilisez CE hook (et jamais <LoadScript>) dans tous les composants qui affichent une carte.
 */
export const useGoogleMaps = () => {
  return useJsApiLoader({
    id: 'google-map-script', // ID FIXE — doit être identique partout dans l'app
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });
};