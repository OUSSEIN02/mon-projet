import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { X, MapPin, Check, Loader2, Search } from 'lucide-react';
import { useGoogleMaps } from '../../../hooks/useGoogleMaps'; // ← Utiliser le hook centralisé
import '../../css/MapPickerModal.css';

const MapPickerModal = ({ isOpen, onClose, onSelect, initialLat, initialLng }) => {
  const { isLoaded, loadError } = useGoogleMaps();

  const [markerPosition, setMarkerPosition] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const mapRef = useRef(null);
  const geocoderRef = useRef(null);

  // --- Nouvelle Places API : état pour la recherche custom ---
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const sessionTokenRef = useRef(null);
  const debounceRef = useRef(null);
  const searchWrapperRef = useRef(null);

  const defaultCenter = { lat: 0.4162, lng: 9.4673 };

  useEffect(() => {
    if (isOpen) {
      if (initialLat && initialLng) {
        setMarkerPosition({ lat: initialLat, lng: initialLng });
      } else {
        setMarkerPosition(null);
      }
      setSelectedAddress('');
      setSearchInput('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [initialLat, initialLng, isOpen]);

  // Ferme la liste de suggestions si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;

    if (window.google && window.google.maps) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }

    if (markerPosition) {
      map.panTo(markerPosition);
      map.setZoom(15);
    } else {
      map.setZoom(13);
      map.panTo(defaultCenter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMapClick = useCallback((e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const newPos = { lat, lng };

    setMarkerPosition(newPos);
    setSelectedAddress('Récupération de l\'adresse...');
    setShowSuggestions(false);

    if (geocoderRef.current) {
      geocoderRef.current.geocode({ location: newPos }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setSelectedAddress(results[0].formatted_address);
          setSearchInput(results[0].formatted_address);
        } else {
          setSelectedAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      });
    }
  }, []);

  // --- Nouvelle Places API : recherche de suggestions (remplace Autocomplete) ---
  const fetchSuggestions = useCallback(async (input) => {
    if (!input || input.trim().length < 2 || !window.google?.maps?.places) {
      setSuggestions([]);
      return;
    }

    // Un session token regroupe les requêtes d'une même recherche pour la facturation Google
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
    }

    setIsSearching(true);
    try {
      const { suggestions: results } =
        await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          sessionToken: sessionTokenRef.current,
          // Décommentez pour restreindre les résultats à un pays, ex. Bénin :
          // includedRegionCodes: ['bj'],
        });
      setSuggestions(results || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Erreur autocomplete Places:', err);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300); // debounce pour limiter les appels API pendant la frappe
  };

  const handleSuggestionClick = async (suggestion) => {
    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({ fields: ['location', 'formattedAddress', 'displayName'] });

      const lat = place.location.lat();
      const lng = place.location.lng();
      const newPos = { lat, lng };
      const address = place.formattedAddress || suggestion.placePrediction.text.text;

      setMarkerPosition(newPos);
      setSelectedAddress(address);
      setSearchInput(address);
      setShowSuggestions(false);
      setSuggestions([]);

      // Nouvelle session pour la prochaine recherche (bonne pratique de facturation Google)
      sessionTokenRef.current = null;

      if (mapRef.current) {
        mapRef.current.panTo(newPos);
        mapRef.current.setZoom(15);
      }
    } catch (err) {
      console.error('Erreur lors de la sélection du lieu:', err);
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

  if (loadError) {
    return (
      <div className="mp-overlay">
        <div className="mp-error-box">
          <X size={48} />
          <p>Erreur de chargement de Google Maps.</p>
          <p className="mp-error-sub">Vérifiez votre clé API ou votre connexion.</p>
          <button onClick={onClose} className="mp-btn mp-btn-secondary">
            Fermer
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="mp-overlay">
        <div className="mp-loading-box">
          <Loader2 size={48} className="animate-spin mp-text-orange" />
          <p>Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mp-overlay">
      <div className="mp-modal">
        {/* Header */}
        <div className="mp-header">
          <h3 className="mp-title">
            <MapPin size={20} className="mp-text-orange" />
            Choisir un lieu sur la carte
          </h3>
          <button onClick={onClose} className="mp-close-btn" aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        {/* Search Bar (nouvelle Places API, sans <Autocomplete> legacy) */}
        <div className="mp-search-bar" ref={searchWrapperRef} style={{ position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}
            />
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              onFocus={() => searchInput.length >= 2 && setShowSuggestions(true)}
              placeholder="Rechercher un lieu..."
              className="mp-search-input"
              style={{ paddingLeft: 32 }}
              autoComplete="off"
            />
            {isSearching && (
              <Loader2
                size={16}
                className="animate-spin"
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}
              />
            )}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <ul
              className="mp-suggestions-list"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 20,
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                marginTop: 4,
                maxHeight: 240,
                overflowY: 'auto',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                listStyle: 'none',
                padding: 4,
              }}
            >
              {suggestions.map((suggestion, idx) => {
                const prediction = suggestion.placePrediction;
                return (
                  <li
                    key={prediction.placeId || idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      cursor: 'pointer',
                      borderRadius: 6,
                      fontSize: 14,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <MapPin size={14} style={{ opacity: 0.5, flexShrink: 0 }} />
                    <span>{prediction.text.text}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Map */}
        <div className="mp-map-container">
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
              zoomControl: true,
              clickableIcons: false,
            }}
          >
            {markerPosition && <Marker position={markerPosition} />}
          </GoogleMap>

          {/* Coordinates & Address display */}
          {markerPosition && (
            <div className="mp-info-card">
              <p className="mp-info-address">
                {selectedAddress}
              </p>
              <p className="mp-info-coords">
                Lat: {markerPosition.lat.toFixed(5)}, Lng: {markerPosition.lng.toFixed(5)}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mp-footer">
          <button
            type="button"
            onClick={onClose}
            className="mp-btn mp-btn-secondary"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!markerPosition}
            className="mp-btn mp-btn-primary"
          >
            <Check size={18} /> Confirmer la sélection
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapPickerModal;
