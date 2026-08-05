import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import '../../css/GooglePlacesAutocomplete.css';

const GooglePlacesAutocomplete = ({ value, onChange, onPlaceSelect, placeholder }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1); // Pour la navigation au clavier
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

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

  // Debounce pour éviter trop d'appels API
  useEffect(() => {
    if (value.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
            'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text.text'
          },
          body: JSON.stringify({
            input: value,
            includedRegionCodes: ['ga'],
            languageCode: 'fr'
          })
        });

        const data = await response.json();
        if (data.suggestions) {
          setSuggestions(data.suggestions);
          setIsOpen(true);
          setActiveIndex(-1);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error('Erreur de géolocalisation:', error);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [value]);

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

  const handleSelect = async (prediction) => {
    setIsOpen(false);
    setActiveIndex(-1);
    onChange(prediction.placePrediction.text.text);
    
    try {
      const detailsResponse = await fetch(`https://places.googleapis.com/v1/places/${prediction.placePrediction.placeId}`, {
        method: 'GET',
        headers: {
          'X-Goog-Api-Key': import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'location,formattedAddress'
        }
      });
      const detailsData = await detailsResponse.json();
      
      if (detailsData.location) {
        onPlaceSelect({
          address: detailsData.formattedAddress || prediction.placePrediction.text.text,
          lat: detailsData.location.latitude,
          lng: detailsData.location.longitude
        });
      }
    } catch (error) {
      console.error('Erreur détails lieu:', error);
    }
  };

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
              key={suggestion.placePrediction.placeId}
              className={`autocomplete-item ${index === activeIndex ? 'active' : ''}`}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <MapPin size={16} className="item-icon" />
              <span className="item-text">{suggestion.placePrediction.text.text}</span>
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