// src/services/directionsService.js
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

/**
 * Décode une polyline encodée (format Google/OSRM)
 * Algorithme identique à la version mobile Flutter
 */
export function decodePolyline(encoded) {
  const points = [];
  let index = 0, lat = 0, lng = 0;

  while (index < encoded.length) {
    let shift = 0, result = 0, b;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += ((result & 1) ? ~(result >> 1) : (result >> 1));

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += ((result & 1) ? ~(result >> 1) : (result >> 1));

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

/**
 * Récupère un itinéraire routier entre deux points
 * Essaie Google d'abord, puis OSRM en fallback
 */
export async function getRoute(origin, destination) {
  // Essayer Google d'abord (meilleure qualité)
  if (GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== 'VOTRE_CLE_API') {
    const googleRoute = await getGoogleRoute(origin, destination);
    if (googleRoute) return googleRoute;
  }
  
  // Fallback sur OSRM (gratuit, pas de clé nécessaire)
  return await getOsrmRoute(origin, destination);
}

/**
 * Google Directions API
 */
async function getGoogleRoute(origin, destination) {
  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json` +
      `?origin=${origin.lat},${origin.lng}` +
      `&destination=${destination.lat},${destination.lng}` +
      `&mode=driving&language=fr&key=${GOOGLE_MAPS_API_KEY}`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== 'OK' || !data.routes?.length) {
      console.warn('Google Directions:', data.status);
      return null;
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    return {
      polylinePoints: decodePolyline(route.overview_polyline.points),
      totalDistanceM: leg.distance.value,
      totalDurationS: leg.duration.value,
      steps: leg.steps.map(s => ({
        instruction: s.html_instructions?.replace(/<[^>]*>/g, '') || 'Continuez',
        distanceMeters: s.distance.value,
        durationSeconds: s.duration.value,
      })),
    };
  } catch (e) {
    console.error('Google route error:', e);
    return null;
  }
}

/**
 * OSRM (Open Source Routing Machine) - GRATUIT
 * Utilisé en fallback ou si pas de clé Google
 */
async function getOsrmRoute(origin, destination) {
  try {
    // OSRM utilise l'ordre lng,lat (contrairement à Google)
    const url = `https://router.project-osrm.org/route/v1/driving/` +
      `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
      `?overview=full&geometries=polyline&steps=true`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) {
      console.warn('OSRM:', data.code);
      return null;
    }

    const route = data.routes[0];

    return {
      polylinePoints: decodePolyline(route.geometry),
      totalDistanceM: Math.round(route.distance),
      totalDurationS: Math.round(route.duration),
      steps: [],
    };
  } catch (e) {
    console.error('OSRM route error:', e);
    return null;
  }
}

/**
 * Formate une distance en texte lisible
 */
export function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

/**
 * Formate une durée en texte lisible
 */
export function formatDuration(seconds) {
  const min = Math.ceil(seconds / 60);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60}`;
}