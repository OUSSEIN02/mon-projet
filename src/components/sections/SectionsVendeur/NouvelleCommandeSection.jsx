import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Package, Clock, AlertCircle, Save, Camera, X, Loader2,
  Truck, Phone, User, Route, Calendar, DollarSign, ArrowLeft,
  CheckCircle, RefreshCw, Info, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';
import GooglePlacesAutocomplete from './GooglePlacesAutocomplete';
import MapPickerModal from './MapPickerModal';
import '../../css/NouvelleCommandeSection.css';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo

// ═══════════════════════════════════════════════════════════
// FORMULE DE HAVERSINE
// ═══════════════════════════════════════════════════════════
const degToRad = (deg) => deg * (Math.PI / 180);

const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = degToRad(lat2 - lat1);
  const dLng = degToRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degToRad(lat1)) *
      Math.cos(degToRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const DEFAULT_PRICE_PER_KM = 500;
const MIN_FEE = 1500;
const FRAGILE_SURCHARGE = 500;

// ═══════════════════════════════════════════════════════════
const NouvelleCommandeSection = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState({ isOpen: false, type: null });

  const [formData, setFormData] = useState({
    pickupName: '',
    pickupCountryCode: '+241',
    pickupContact: '',
    pickupAddress: '',
    dropoffName: '',
    dropoffCountryCode: '+241',
    dropoffContact: '',
    dropoffAddress: '',
    pickupLat: null,
    pickupLng: null,
    dropoffLat: null,
    dropoffLng: null,
    weight: '',
    isFragile: false,
    declaredValue: '',
    deliveryType: 'immediat',
    scheduledTime: '',
    instructions: '',
    packagePhoto: null,
  });

  const [photoPreview, setPhotoPreview] = useState(null);

  const distance = useMemo(() => {
    if (formData.pickupLat && formData.pickupLng && formData.dropoffLat && formData.dropoffLng) {
      return calculateDistance(
        formData.pickupLat, formData.pickupLng, formData.dropoffLat, formData.dropoffLng
      );
    }
    return null;
  }, [formData.pickupLat, formData.pickupLng, formData.dropoffLat, formData.dropoffLng]);

  // ═══════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'file') {
      const file = files[0];
      if (file && file.size > MAX_FILE_SIZE) {
        toast.error('La photo ne doit pas dépasser 5 Mo.');
        e.target.value = '';
        return;
      }
      setFormData((prev) => ({ ...prev, [name]: file }));
      if (file) setPhotoPreview(URL.createObjectURL(file));
      else setPhotoPreview(null);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }

    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handlePickupAddressChange = (value) => {
    setFormData((prev) => ({ ...prev, pickupAddress: value }));
    if (formErrors.pickupAddress) setFormErrors((prev) => ({ ...prev, pickupAddress: '' }));
  };

  const handlePickupPlaceSelect = (place) => {
    setFormData((prev) => ({
      ...prev,
      pickupAddress: place.address,
      pickupLat: place.lat,
      pickupLng: place.lng,
      pickupName: prev.pickupName || place.address.split(',')[0],
    }));
  };

  const handleDropoffAddressChange = (value) => {
    setFormData((prev) => ({ ...prev, dropoffAddress: value }));
    if (formErrors.dropoffAddress) setFormErrors((prev) => ({ ...prev, dropoffAddress: '' }));
  };

  const handleDropoffPlaceSelect = (place) => {
    setFormData((prev) => ({
      ...prev,
      dropoffAddress: place.address,
      dropoffLat: place.lat,
      dropoffLng: place.lng,
      dropoffName: prev.dropoffName || place.address.split(',')[0],
    }));
  };

  const handleMapSelection = (location) => {
    if (mapModalOpen.type === 'pickup') {
      setFormData((prev) => ({
        ...prev,
        pickupAddress: location.address,
        pickupLat: location.lat,
        pickupLng: location.lng,
        pickupName: prev.pickupName || location.address.split(',')[0],
      }));
      if (formErrors.pickupAddress) setFormErrors((prev) => ({ ...prev, pickupAddress: '' }));
    } else if (mapModalOpen.type === 'dropoff') {
      setFormData((prev) => ({
        ...prev,
        dropoffAddress: location.address,
        dropoffLat: location.lat,
        dropoffLng: location.lng,
        dropoffName: prev.dropoffName || location.address.split(',')[0],
      }));
      if (formErrors.dropoffAddress) setFormErrors((prev) => ({ ...prev, dropoffAddress: '' }));
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, packagePhoto: null }));
    setPhotoPreview(null);
    const fileInput = document.getElementById('packagePhoto');
    if (fileInput) fileInput.value = '';
    if (formErrors.packagePhoto) setFormErrors((prev) => ({ ...prev, packagePhoto: '' }));
  };

  // ═══════════════════════════════════════════════════════════
  // VALIDATION
  // ═══════════════════════════════════════════════════════════
  const validateForm = () => {
    const localErrors = {};

    if (!formData.pickupName.trim()) localErrors.pickupName = 'Le lieu de récupération est requis.';
    if (!formData.pickupContact.trim()) localErrors.pickupContact = "Le contact de l'expéditeur est requis.";
    if (!formData.pickupAddress.trim()) localErrors.pickupAddress = "L'adresse de récupération est requise.";
    if (!formData.dropoffName.trim()) localErrors.dropoffName = 'Le destinataire est requis.';
    if (!formData.dropoffContact.trim()) localErrors.dropoffContact = 'Le contact du destinataire est requis.';
    if (!formData.dropoffAddress.trim()) localErrors.dropoffAddress = "L'adresse de livraison est requise.";

    if (!formData.declaredValue || Number(formData.declaredValue) <= 0) {
      localErrors.declaredValue = "La valeur déclarée du colis est obligatoire.";
    }

    if (!formData.packagePhoto) localErrors.packagePhoto = 'La photo du colis est obligatoire.';

    if (formData.deliveryType === 'programme' && !formData.scheduledTime) {
      localErrors.scheduledTime = "L'heure de livraison est requise.";
    }

    if (distance === null) {
      toast.error('Veuillez sélectionner les deux adresses sur la carte.', { icon: '⚠️' });
      return false;
    }

    if (Object.keys(localErrors).length > 0) {
      setFormErrors(localErrors);
      const firstError = Object.values(localErrors)[0];
      toast.error(firstError);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }

    return true;
  };

  const handleGoToSummary = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setShowSummary(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="nc-page-container"
    >
      <AnimatePresence mode="wait">
        {showSummary ? (
          <OrderSummaryStep
            key="summary"
            formData={formData}
            distance={distance}
            onBack={() => setShowSummary(false)}
            onSuccess={() => navigate('/dashboard/commandes')}
          />
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="nc-header">
              <div className="nc-header-icon"><Truck size={28} /></div>
              <div>
                <h2>Créer une livraison</h2>
                <p className="nc-subtitle">Remplissez les détails pour créer une demande de livraison.</p>
              </div>
            </div>

            <form onSubmit={handleGoToSummary} className="nc-form-page">
              {/* ═══ 1. ADRESSES ═══ */}
              <div className="nc-card">
                <h4 className="nc-card-title"><MapPin size={18} /> Adresses</h4>
                <div className="nc-grid-2">
                  {/* PICKUP */}
                  <div className="nc-field">
                    <label>Lieu de récupération (Expéditeur) <span className="nc-required">*</span></label>
                    <input
                      type="text"
                      name="pickupName"
                      placeholder="Nom du lieu / Contact"
                      value={formData.pickupName}
                      onChange={handleInputChange}
                      className={formErrors.pickupName ? 'nc-input-error' : ''}
                    />
                    {formErrors.pickupName && <p className="nc-error-text">{formErrors.pickupName}</p>}

                    <label className="nc-field-label-sm">
                      <Phone size={12} className="inline mr-1" /> Téléphone expéditeur <span className="nc-required">*</span>
                    </label>
                    <div className="nc-phone-input-group">
                      <select
                        name="pickupCountryCode"
                        value={formData.pickupCountryCode}
                        onChange={handleInputChange}
                        className="nc-country-select"
                      >
                        <option value="+241">🇬🇦 +241</option>
                        <option value="00241">🇬🇦 00241</option>
                        <option value="+237">🇨🇲 +237</option>
                        <option value="+242">🇨🇬 +242</option>
                      </select>
                      <input
                        type="tel"
                        name="pickupContact"
                        placeholder="Ex: 07412345"
                        value={formData.pickupContact}
                        onChange={handleInputChange}
                        className={formErrors.pickupContact ? 'nc-input-error' : ''}
                      />
                    </div>
                    {formErrors.pickupContact && <p className="nc-error-text">{formErrors.pickupContact}</p>}

                    <div className="nc-address-row">
                      <div className="nc-address-input">
                        <GooglePlacesAutocomplete
                          value={formData.pickupAddress}
                          onChange={handlePickupAddressChange}
                          onPlaceSelect={handlePickupPlaceSelect}
                          placeholder="Tapez une adresse au Gabon..."
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setMapModalOpen({ isOpen: true, type: 'pickup' })}
                        className="nc-map-picker-btn"
                        title="Choisir sur la carte"
                      >
                        <MapPin size={18} /><span>Carte</span>
                      </button>
                    </div>
                    {formErrors.pickupAddress && <p className="nc-error-text">{formErrors.pickupAddress}</p>}
                    {formData.pickupLat && formData.pickupLng && (
                      <div className="nc-geo-badge"><Save size={12} /> Adresse géolocalisée</div>
                    )}
                  </div>

                  {/* DROPOFF */}
                  <div className="nc-field">
                    <label>Lieu de livraison (Destinataire) <span className="nc-required">*</span></label>
                    <input
                      type="text"
                      name="dropoffName"
                      placeholder="Nom du destinataire"
                      value={formData.dropoffName}
                      onChange={handleInputChange}
                      className={formErrors.dropoffName ? 'nc-input-error' : ''}
                    />
                    {formErrors.dropoffName && <p className="nc-error-text">{formErrors.dropoffName}</p>}

                    <label className="nc-field-label-sm">
                      <Phone size={12} className="inline mr-1" /> Téléphone destinataire <span className="nc-required">*</span>
                    </label>
                    <div className="nc-phone-input-group">
                      <select
                        name="dropoffCountryCode"
                        value={formData.dropoffCountryCode}
                        onChange={handleInputChange}
                        className="nc-country-select"
                      >
                        <option value="+241">🇬🇦 +241</option>
                        <option value="00241">🇬🇦 00241</option>
                        <option value="+237">🇨🇲 +237</option>
                        <option value="+242">🇨🇬 +242</option>
                      </select>
                      <input
                        type="tel"
                        name="dropoffContact"
                        placeholder="Ex: 06612345"
                        value={formData.dropoffContact}
                        onChange={handleInputChange}
                        className={formErrors.dropoffContact ? 'nc-input-error' : ''}
                      />
                    </div>
                    {formErrors.dropoffContact && <p className="nc-error-text">{formErrors.dropoffContact}</p>}

                    <div className="nc-address-row">
                      <div className="nc-address-input">
                        <GooglePlacesAutocomplete
                          value={formData.dropoffAddress}
                          onChange={handleDropoffAddressChange}
                          onPlaceSelect={handleDropoffPlaceSelect}
                          placeholder="Tapez une adresse au Gabon..."
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setMapModalOpen({ isOpen: true, type: 'dropoff' })}
                        className="nc-map-picker-btn"
                        title="Choisir sur la carte"
                      >
                        <MapPin size={18} /><span>Carte</span>
                      </button>
                    </div>
                    {formErrors.dropoffAddress && <p className="nc-error-text">{formErrors.dropoffAddress}</p>}
                    {formData.dropoffLat && formData.dropoffLng && (
                      <div className="nc-geo-badge"><Save size={12} /> Adresse géolocalisée</div>
                    )}
                  </div>
                </div>

                {distance !== null && (
                  <div className="nc-distance-badge">
                    <div className="nc-distance-icon"><Route size={18} /></div>
                    <div className="nc-distance-text">Distance estimée : {distance.toFixed(2)} km</div>
                  </div>
                )}
              </div>

              {/* ═══ 2. DÉTAILS DU COLIS ═══ */}
              <div className="nc-card">
                <h4 className="nc-card-title"><Package size={18} /> Détails du colis</h4>
                <div className="nc-grid-3">
                  <div className="nc-field">
                    <label>Poids / Volume approx.</label>
                    <input
                      type="text"
                      name="weight"
                      placeholder="Ex: 2.5 kg"
                      value={formData.weight}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="nc-field">
                    <label>Valeur déclarée du colis (FCFA) <span className="nc-required">*</span></label>
                    <input
                      type="number"
                      name="declaredValue"
                      placeholder="Ex: 50000"
                      value={formData.declaredValue}
                      onChange={handleInputChange}
                      className={formErrors.declaredValue ? 'nc-input-error' : ''}
                      min="1"
                    />
                    {formErrors.declaredValue && <p className="nc-error-text">{formErrors.declaredValue}</p>}
                  </div>
                  <div className="nc-checkbox-wrap">
                    <label className="nc-checkbox-label">
                      <input
                        type="checkbox"
                        name="isFragile"
                        checked={formData.isFragile}
                        onChange={handleInputChange}
                      />
                      <span className="nc-checkmark"></span>
                      <AlertCircle size={16} className="nc-fragile-icon" />
                      <span>Colis fragile</span>
                    </label>
                  </div>
                </div>

                <div className="nc-field nc-mt-6">
                  <label>Photo du colis <span className="nc-required">*</span></label>
                  <div className="nc-file-wrap">
                    <input
                      type="file"
                      name="packagePhoto"
                      accept="image/jpeg, image/png, image/jpg"
                      onChange={handleInputChange}
                      className="nc-file-input"
                      id="packagePhoto"
                    />
                    <label htmlFor="packagePhoto" className={`nc-file-label ${formErrors.packagePhoto ? 'nc-file-error' : ''}`}>
                      <Camera size={24} />
                      <span>{formData.packagePhoto ? formData.packagePhoto.name : 'Importer une photo du colis'}</span>
                    </label>
                    {formErrors.packagePhoto && <p className="nc-error-text">{formErrors.packagePhoto}</p>}
                    {photoPreview && (
                      <div className="nc-img-preview">
                        <img src={photoPreview} alt="Aperçu" />
                        <button type="button" onClick={handleRemovePhoto} className="nc-img-preview-remove">
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="nc-help-text"><Info size={13} /> Formats acceptés : JPG, PNG. Taille maximale : 5 Mo.</p>
                </div>
              </div>

              {/* ═══ 3. CRÉNEAU ET INSTRUCTIONS ═══ */}
              <div className="nc-card">
                <h4 className="nc-card-title"><Clock size={18} /> Créneau et Instructions</h4>
                <div className="nc-field">
                  <label>Type de livraison</label>
                  <div className="nc-radio-group">
                    <label className="nc-radio-label">
                      <input
                        type="radio"
                        name="deliveryType"
                        value="immediat"
                        checked={formData.deliveryType === 'immediat'}
                        onChange={handleInputChange}
                      />
                      <span className="nc-radio-custom"></span>
                      <span>Immédiat</span>
                    </label>
                    <label className="nc-radio-label">
                      <input
                        type="radio"
                        name="deliveryType"
                        value="programme"
                        checked={formData.deliveryType === 'programme'}
                        onChange={handleInputChange}
                      />
                      <span className="nc-radio-custom"></span>
                      <span>Programmé (Jour même)</span>
                    </label>
                  </div>
                </div>
                
                {formData.deliveryType === 'programme' && (
                  <div className="nc-field nc-mt-3">
                    <label>Heure de livraison souhaitée <span className="nc-required">*</span></label>
                    <input
                      type="time"
                      name="scheduledTime"
                      value={formData.scheduledTime}
                      onChange={handleInputChange}
                      className={formErrors.scheduledTime ? 'nc-input-error' : ''}
                    />
                    {formErrors.scheduledTime && <p className="nc-error-text">{formErrors.scheduledTime}</p>}
                  </div>
                )}
                
                <div className="nc-field nc-mt-3">
                  <label>Instructions spécifiques</label>
                  <textarea
                    name="instructions"
                    rows="3"
                    placeholder="Code d'entrée, étage, contact client..."
                    value={formData.instructions}
                    onChange={handleInputChange}
                    className={formErrors.instructions ? 'nc-input-error' : ''}
                  ></textarea>
                  {formErrors.instructions && <p className="nc-error-text">{formErrors.instructions}</p>}
                </div>
              </div>

              <div className="nc-actions">
                <button type="submit" className="nc-btn-primary">
                  Voir le récapitulatif <ArrowLeft size={18} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <MapPickerModal
        isOpen={mapModalOpen.isOpen}
        onClose={() => setMapModalOpen({ isOpen: false, type: null })}
        onSelect={handleMapSelection}
        initialLat={mapModalOpen.type === 'pickup' ? formData.pickupLat : formData.dropoffLat}
        initialLng={mapModalOpen.type === 'pickup' ? formData.pickupLng : formData.dropoffLng}
      />
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════
// 📋 ÉCRAN DE RÉCAPITULATIF
// ═══════════════════════════════════════════════════════════
const OrderSummaryStep = ({ formData, distance, onBack, onSuccess }) => {
  const navigate = useNavigate();
  
  const [pricePerKm, setPricePerKm] = useState(null);
  const [minFee, setMinFee] = useState(MIN_FEE);
  const [fragileSurcharge, setFragileSurcharge] = useState(FRAGILE_SURCHARGE);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [priceError, setPriceError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPricingConfig = async () => {
    setIsLoadingPrice(true);
    setPriceError(null);
    try {
      const response = await apiClient.get('/dashboard/pricing');
      const data = response.data?.data || response.data;
      const parseDouble = (val) => {
        if (val == null) return null;
        if (typeof val === 'number') return val;
        const parsed = parseFloat(val);
        return isNaN(parsed) ? null : parsed;
      };
      setPricePerKm(parseDouble(data.price_per_km) ?? DEFAULT_PRICE_PER_KM);
      setMinFee(parseDouble(data.min_fee) ?? MIN_FEE);
      setFragileSurcharge(parseDouble(data.fragile_surcharge) ?? FRAGILE_SURCHARGE);
    } catch (err) {
      console.error('Erreur pricing:', err);
      setPriceError('Impossible de charger la tarification.');
    } finally {
      setIsLoadingPrice(false);
    }
  };

  useEffect(() => {
    fetchPricingConfig();
  }, []);

  const totalPrice = useMemo(() => {
    if (pricePerKm == null) return 0;
    let basePrice = distance * pricePerKm;
    let surcharge = formData.isFragile ? fragileSurcharge : 0;
    let total = basePrice + surcharge;
    if (total < minFee) total = minFee;
    return total;
  }, [pricePerKm, distance, formData.isFragile, fragileSurcharge, minFee]);

  const handleSubmitOrder = async () => {
    if (pricePerKm == null) {
      toast.error('Tarification non disponible. Réessayez.');
      return;
    }
  
    setIsSubmitting(true);
    const loadingToast = toast.loading('Création de la commande en cours...');
  
    try {
      const data = new FormData();
  
      // 1. Informations Expéditeur
      data.append('pickup_name', formData.pickupName);
      data.append('pickup_contact', `${formData.pickupCountryCode}${formData.pickupContact}`);
      data.append('pickup_address', formData.pickupAddress);
      data.append('pickup_lat', formData.pickupLat);
      data.append('pickup_lng', formData.pickupLng);
  
      // 2. Informations Destinataire
      data.append('dropoff_name', formData.dropoffName);
      data.append('dropoff_contact', `${formData.dropoffCountryCode}${formData.dropoffContact}`);
      data.append('dropoff_address', formData.dropoffAddress);
      data.append('dropoff_lat', formData.dropoffLat);
      data.append('dropoff_lng', formData.dropoffLng);
  
      // 3. Détails du colis
      data.append('weight', formData.weight);
      data.append('is_fragile', formData.isFragile ? 1 : 0);
      
      if (formData.deliveryType === 'programme' && formData.scheduledTime) {
        const today = new Date().toISOString().split('T')[0];
        data.append('scheduled_date', `${today}T${formData.scheduledTime}:00`);
      }
  
      data.append('delivery_type', formData.deliveryType);
      data.append('instructions', formData.instructions);
      
      if (formData.packagePhoto) {
        data.append('package_photo', formData.packagePhoto);
      }
  
      // 🟢 NOUVEAU : Envoi explicite des 3 valeurs financières
      const deliveryFee = totalPrice; // Frais de livraison calculés
      const productValue = parseFloat(formData.declaredValue) || 0; // Prix du colis/produits
      const totalAmount = deliveryFee + productValue; // Total général

      data.append('distance', distance.toFixed(2));
      data.append('delivery_fee', deliveryFee.toFixed(2));
      data.append('product_value', productValue.toFixed(2));
      data.append('total_amount', totalAmount.toFixed(2));
      
      // On garde declared_value pour la rétrocompatibilité avec votre ancien code
      data.append('declared_value', productValue.toFixed(2)); 
  
      const token = localStorage.getItem('access_token');
      const response = await apiClient.post('/orders', data, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      toast.success('Commande créée avec succès !', { id: loadingToast });
  
      const responseData = response.data?.data || response.data;
      const rawId = responseData?.order_id || responseData?.id;
  
      if (!rawId) {
        toast.error('ID de commande non reçu du serveur', { id: loadingToast });
        return;
      }
  
      const orderId = typeof rawId === 'number' ? rawId : parseInt(rawId.toString());
  
      setTimeout(() => {
        navigate('/dashboard/order-searching', {
          state: {
            orderId,
            pickupLat: formData.pickupLat,
            pickupLng: formData.pickupLng,
            dropoffLat: formData.dropoffLat,
            dropoffLng: formData.dropoffLng,
            pickupAddress: formData.pickupAddress,
            dropoffAddress: formData.dropoffAddress,
            distance,
            deliveryFee,
            productValue,
            totalAmount,
          },
        });
      }, 1500);
  
    } catch (error) {
      if (error.response && error.response.status === 422) {
        const apiErrors = error.response.data.errors;
        const firstError = Object.values(apiErrors)[0][0];
        toast.error(firstError, { id: loadingToast });
      } else {
        console.error('Erreur serveur:', error);
        toast.error(error.response?.data?.message || 'Une erreur est survenue.', { id: loadingToast });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return `${timeStr} (Aujourd'hui)`;
  };

  if (isLoadingPrice) {
    return (
      <div className="nc-page-container">
        <div className="nc-card nc-loader-wrap">
          <Loader2 size={48} className="animate-spin" />
          <p>Chargement de la tarification…</p>
        </div>
      </div>
    );
  }

  if (priceError) {
    return (
      <div className="nc-page-container">
        <div className="nc-card nc-empty-state">
          <AlertCircle size={48} />
          <p>{priceError}</p>
          <div className="nc-empty-actions">
            <button onClick={onBack} className="nc-btn-secondary"><ArrowLeft size={16} /> Retour</button>
            <button onClick={fetchPricingConfig} className="nc-btn-primary"><RefreshCw size={16} /> Réessayer</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="nc-page-container"
    >
      <div className="nc-header">
        <button onClick={onBack} className="nc-back-btn" title="Retour au formulaire">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2>Récapitulatif</h2>
          <p className="nc-subtitle">Vérifiez les informations avant de confirmer.</p>
        </div>
      </div>

      <div className="nc-form-page">
        <div className="nc-card">
          <h4 className="nc-card-title"><Route size={18} /> Trajet</h4>
          <SummaryRow icon={<User size={18} />} label="Expéditeur" value={formData.pickupName} />
          <SummaryRow icon={<Phone size={18} />} label="Contact expéditeur" value={`${formData.pickupCountryCode} ${formData.pickupContact}`} />
          <SummaryRow icon={<MapPin size={18} />} label="Départ" value={formData.pickupAddress} />
          <div className="nc-divider"></div>
          <SummaryRow icon={<User size={18} />} label="Destinataire" value={formData.dropoffName} />
          <SummaryRow icon={<Phone size={18} />} label="Contact destinataire" value={`${formData.dropoffCountryCode} ${formData.dropoffContact}`} />
          <SummaryRow icon={<MapPin size={18} />} label="Arrivée" value={formData.dropoffAddress} />
          <div className="nc-highlight-box">
            <Route size={18} /><span>Distance : {distance.toFixed(2)} km</span>
          </div>
        </div>

        <div className="nc-card">
          <h4 className="nc-card-title"><Package size={18} /> Détails du colis</h4>
          {formData.weight && <SummaryRow icon={<Package size={18} />} label="Poids" value={formData.weight} />}
          <SummaryRow icon={<DollarSign size={18} />} label="Valeur déclarée" value={`${formData.declaredValue} FCFA`} />
          <SummaryRow
            icon={formData.isFragile ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            label="Fragile"
            value={formData.isFragile ? 'Oui' : 'Non'}
          />
        </div>

        <div className="nc-card">
          <h4 className="nc-card-title"><Clock size={18} /> Type de livraison</h4>
          <SummaryRow icon={<Truck size={18} />} label="Type" value={formData.deliveryType === 'immediat' ? 'Immédiat' : 'Programmé (Jour même)'} />
          {formData.deliveryType === 'programme' && formData.scheduledTime && (
            <SummaryRow icon={<Calendar size={18} />} label="Heure de livraison" value={formatTime(formData.scheduledTime)} />
          )}
          {formData.instructions && <SummaryRow icon={<Info size={18} />} label="Instructions" value={formData.instructions} />}
        </div>

        {/* 🟢 NOUVEAU : RÉCAPITULATIF FINANCIER SÉPARÉ */}
        <div className="nc-card">
          <h4 className="nc-card-title"><DollarSign size={18} /> Récapitulatif Financier</h4>
          
          {/* Bloc 1 : Frais de Livraison */}
          <div className="nc-pricing-section">
            <div className="nc-pricing-section-title">Frais de Livraison</div>
            <PriceRow label="Distance" value={`${distance.toFixed(2)} km`} />
            <PriceRow label="Tarif au km" value={`${pricePerKm.toFixed(0)} FCFA`} />
            <PriceRow label="Sous-total course" value={`${(distance * pricePerKm).toFixed(0)} FCFA`} />
            {formData.isFragile && <PriceRow label="Supplément fragile" value={`+${fragileSurcharge.toFixed(0)} FCFA`} />}
            <div className="nc-divider"></div>
            <PriceRow label="Total des frais de livraison" value={`${totalPrice.toFixed(0)} FCFA`} isTotal />
          </div>

          {/* Séparateur visuel */}
          <div className="nc-pricing-divider"></div>

          {/* Bloc 2 : Valeur du Colis (Information) */}
          <div className="nc-pricing-section">
            <div className="nc-pricing-section-title nc-info-title">
              <Shield size={14} />
              Valeur du colis (Assurance / Référence)
            </div>
            <PriceRow 
              label="Valeur déclarée par l'expéditeur" 
              value={`${formData.declaredValue} FCFA`} 
              isDeclaredValue 
            />
            <p className="nc-pricing-note">
              Ce montant représente la valeur du bien transporté. Il ne s'ajoute pas aux frais de livraison, mais sert de référence en cas de litige ou de perte.
            </p>
          </div>

        </div>

        <div className="nc-actions">
          <button onClick={onBack} className="nc-btn-secondary" disabled={isSubmitting}>
            <ArrowLeft size={18} /> Retour
          </button>
          <button onClick={handleSubmitOrder} className="nc-btn-primary" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Traitement...</> : <><CheckCircle size={18} /> Confirmer la commande</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════
// COMPOSANTS HELPER
// ═══════════════════════════════════════════════════════════
const SummaryRow = ({ icon, label, value }) => (
  <div className="nc-summary-row">
    <div className="nc-summary-icon">{icon}</div>
    <div className="nc-summary-content">
      <div className="nc-summary-label">{label}</div>
      <div className="nc-summary-value">{value}</div>
    </div>
  </div>
);

const PriceRow = ({ label, value, isTotal = false, isDeclaredValue = false }) => (
  <div className={`nc-price-row ${isTotal ? 'nc-price-total' : ''} ${isDeclaredValue ? 'nc-price-declared' : ''}`}>
    <span className="nc-price-label">{label}</span>
    <span className="nc-price-value">{value}</span>
  </div>
);

export default NouvelleCommandeSection;