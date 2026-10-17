import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { useGoogleMaps } from '../../../hooks/useGoogleMaps';
import '../../css/GooglePlacesAutocomplete.css';

const GooglePlacesAutocomplete = ({ value, onChange, onPlaceSelect, placeholder }) => {
  const { isLoaded } = useGoogleMaps();
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);

  // Initialiser les services Google Maps
  useEffect(() => {
    if (isLoaded && window.google && window.google.maps) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      
      // Créer un div temporaire pour le PlacesService (requis par l'API)
      const tempDiv = document.createElement('div');
      placesServiceRef.current = new window.google.maps.places.PlacesService(tempDiv);
    }
  }, [isLoaded]);

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce pour les suggestions
  useEffect(() => {
    if (!isLoaded || !autocompleteServiceRef.current) return;

    if (value.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(true);
      
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: value,
          componentRestrictions: { country: 'ga' }, // Gabon
          types: ['geocode', 'establishment'],
        },
        (predictions, status) => {
          setIsLoading(false);
          
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
            setIsOpen(true);
            setActiveIndex(-1);
          } else {
            setSuggestions([]);
            setIsOpen(value.length >= 3);
          }
        }
      );
    }, 400);

    return () => clearTimeout(timer);
  }, [value, isLoaded]);

  // Navigation au clavier
  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelect(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleSelect = (prediction) => {
    setIsOpen(false);
    setActiveIndex(-1);
    onChange(prediction.description);
    
    // Récupérer les détails du lieu (coordonnées)
    if (placesServiceRef.current) {
      placesServiceRef.current.getDetails(
        {
          placeId: prediction.place_id,
          fields: ['geometry', 'formatted_address'],
        },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry) {
            onPlaceSelect({
              address: place.formatted_address || prediction.description,
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            });
          }
        }
      );
    }
  };

  if (!isLoaded) {
    return (
      <div className="autocomplete-wrapper">
        <MapPin className="autocomplete-icon" size={18} />
        <input
          type="text"
          value={value}
          placeholder="Chargement..."
          disabled
          className="autocomplete-input"
        />
        <div className="autocomplete-loader">
          <Loader2 className="animate-spin" size={18} />
        </div>
      </div>
    );
  }

  return (
    <div className="autocomplete-wrapper" ref={wrapperRef}>
      <MapPin className="autocomplete-icon" size={18} />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => value.length >= 3 && setIsOpen(true)}
        placeholder={placeholder}
        className="autocomplete-input"
        autoComplete="off"
      />
      
      {isLoading && (
        <div className="autocomplete-loader">
          <Loader2 className="animate-spin" size={18} />
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <ul className="autocomplete-dropdown">
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.place_id}
              className={`autocomplete-item ${index === activeIndex ? 'active' : ''}`}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <MapPin size={16} className="item-icon" />
              <span className="item-text">{suggestion.description}</span>
            </li>
          ))}
        </ul>
      )}
      
      {isOpen && value.length >= 3 && suggestions.length === 0 && !isLoading && (
        <ul className="autocomplete-dropdown">
          <li className="autocomplete-item no-results">
            <MapPin size={16} className="item-icon" />
            <span className="item-text">Aucune adresse trouvée au Gabon</span>
          </li>
        </ul>
      )}
    </div>
  );
};

export default GooglePlacesAutocomplete;