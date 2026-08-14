import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import { X, MapPin, Check, Loader2 } from 'lucide-react';

// ⚠️ Remplacez par votre clé API (depuis vos variables d'environnement)
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "VOTRE_CLE_API";

const MapPickerModal = ({ isOpen, onClose, onSelect, initialLat, initialLng }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: API_KEY,
    libraries: ['places'],
  });

  const [markerPosition, setMarkerPosition] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);
  const geocoderRef = useRef(null);

  // Centre par défaut (Libreville, Gabon)
  const defaultCenter = { lat: 0.4162, lng: 9.4673 };

  useEffect(() => {
    if (initialLat && initialLng) {
      setMarkerPosition({ lat: initialLat, lng: initialLng });
    } else {
      setMarkerPosition(null);
    }
  }, [initialLat, initialLng, isOpen]);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    geocoderRef.current = new window.google.maps.Geocoder();
    
    if (markerPosition) {
      map.panTo(markerPosition);
      map.setZoom(15);
    } else {
      map.setZoom(13);
      map.panTo(defaultCenter);
    }
  }, [markerPosition]);

  const onMapClick = useCallback((e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const newPos = { lat, lng };
    
    setMarkerPosition(newPos);
    setSelectedAddress('Récupération de l\'adresse...');
    
    // Géocodage inversé pour obtenir l'adresse à partir des coordonnées
    if (geocoderRef.current) {
      geocoderRef.current.geocode({ location: newPos }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setSelectedAddress(results[0].formatted_address);
        } else {
          setSelectedAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      });
    }
  }, []);

  const onAutocompleteLoad = useCallback((ref) => {
    autocompleteRef.current = ref;
  }, []);

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const newPos = { lat, lng };
        
        setMarkerPosition(newPos);
        setSelectedAddress(place.formatted_address);
        
        if (mapRef.current) {
          mapRef.current.panTo(newPos);
          mapRef.current.setZoom(15);
        }
      }
    }
  };

  const handleConfirm = () => {
    if (markerPosition) {
      onSelect({
        lat: markerPosition.lat,
        lng: markerPosition.lng,
        address: selectedAddress || 'Localisation sélectionnée sur la carte',
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  if (loadError) return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"><div className="bg-white p-6 rounded-lg text-red-500">Erreur de chargement de la carte</div></div>;

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
        <div className="bg-white p-6 rounded-lg flex items-center gap-3">
          <Loader2 className="animate-spin text-orange-500" />
          <span>Chargement de la carte...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <MapPin size={20} className="text-orange-500" />
            Choisir un lieu sur la carte
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b bg-gray-50">
          <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
            <input
              type="text"
              placeholder="Rechercher un lieu..."
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </Autocomplete>
        </div>

        {/* Map */}
        <div className="flex-grow relative">
          <GoogleMap
            onLoad={onMapLoad}
            onClick={onMapClick}
            center={markerPosition || defaultCenter}
            zoom={markerPosition ? 15 : 13}
            mapContainerStyle={{ width: '100%', height: '100%' }}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
          >
            {markerPosition && <Marker position={markerPosition} />}
          </GoogleMap>
          
          {/* Coordinates & Address display */}
          {markerPosition && (
            <div className="absolute bottom-4 left-4 right-4 sm:left-4 sm:right-auto sm:max-w-[80%] bg-white p-3 rounded-lg shadow-lg border border-gray-200">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {selectedAddress}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Lat: {markerPosition.lat.toFixed(5)}, Lng: {markerPosition.lng.toFixed(5)}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-white flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!markerPosition}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={18} /> Confirmer la sélection
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapPickerModal;