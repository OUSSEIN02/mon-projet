import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, Package, Clock, AlertCircle, Save, Camera, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient'; 
import GooglePlacesAutocomplete from './GooglePlacesAutocomplete';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo en octets

const NouvelleCommandeSection = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    pickupName: '', 
    pickupAddress: '', 
    dropoffName: '', 
    dropoffAddress: '',
    pickupLat: null,
    pickupLng: null,
    dropoffLat: null,
    dropoffLng: null,
    weight: '', 
    isFragile: false, 
    declaredValue: '', 
    deliveryType: 'immediat',
    scheduledDate: '', 
    instructions: '',
    packagePhoto: null
  });

  const [photoPreview, setPhotoPreview] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      const file = files[0];
      
      // 🚨 VALIDATION DE LA TAILLE DU FICHIER
      if (file && file.size > MAX_FILE_SIZE) {
        toast.error('La photo ne doit pas dépasser 5 Mo.');
        // Réinitialiser l'input file
        e.target.value = '';
        return;
      }

      setFormData(prev => ({ ...prev, [name]: file }));
      if (file) {
        setPhotoPreview(URL.createObjectURL(file));
      } else {
        setPhotoPreview(null);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
    
    // Effacer l'erreur du champ quand l'utilisateur modifie la valeur
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePickupAddressChange = (value) => {
    setFormData(prev => ({ ...prev, pickupAddress: value }));
    if (formErrors.pickupAddress) setFormErrors(prev => ({ ...prev, pickupAddress: '' }));
  };

  const handlePickupPlaceSelect = (place) => {
    setFormData(prev => ({
      ...prev,
      pickupAddress: place.address,
      pickupLat: place.lat,
      pickupLng: place.lng,
      pickupName: prev.pickupName || place.address.split(',')[0]
    }));
  };

  const handleDropoffAddressChange = (value) => {
    setFormData(prev => ({ ...prev, dropoffAddress: value }));
    if (formErrors.dropoffAddress) setFormErrors(prev => ({ ...prev, dropoffAddress: '' }));
  };

  const handleDropoffPlaceSelect = (place) => {
    setFormData(prev => ({
      ...prev,
      dropoffAddress: place.address,
      dropoffLat: place.lat,
      dropoffLng: place.lng,
      dropoffName: prev.dropoffName || place.address.split(',')[0]
    }));
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, packagePhoto: null }));
    setPhotoPreview(null);
    const fileInput = document.getElementById('packagePhoto');
    if (fileInput) fileInput.value = '';
    if (formErrors.packagePhoto) setFormErrors(prev => ({ ...prev, packagePhoto: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const loadingToast = toast.loading('Création de la commande en cours...');

    try {
      const data = new FormData();
      
      // Mapping des données vers le format attendu par Laravel (snake_case)
      data.append('pickup_name', formData.pickupName);
      data.append('pickup_address', formData.pickupAddress);
      data.append('pickup_lat', formData.pickupLat);
      data.append('pickup_lng', formData.pickupLng);
      
      data.append('dropoff_name', formData.dropoffName);
      data.append('dropoff_address', formData.dropoffAddress);
      data.append('dropoff_lat', formData.dropoffLat);
      data.append('dropoff_lng', formData.dropoffLng);
      
      data.append('weight', formData.weight);
      data.append('is_fragile', formData.isFragile ? 1 : 0);
      data.append('declared_value', formData.declaredValue || 0);
      data.append('delivery_type', formData.deliveryType);
      
      if (formData.deliveryType === 'programme' && formData.scheduledDate) {
        data.append('scheduled_date', formData.scheduledDate);
      }
      
      data.append('instructions', formData.instructions);
      
      if (formData.packagePhoto) {
        data.append('package_photo', formData.packagePhoto);
      }

      const token = localStorage.getItem('access_token');
      // Envoi à l'API
      const response = await apiClient.post('/orders', data, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      toast.success('Commande créée avec succès !', { id: loadingToast });
      
      // Redirection vers la liste des commandes après un court délai
      setTimeout(() => {
        navigate('/vendeurs/commandes');
      }, 1500);

    } catch (error) {
      if (error.response && error.response.status === 422) {
        // Gestion des erreurs de validation Laravel
        const apiErrors = error.response.data.errors;
        const mappedErrors = {};
        
        // Traduction des clés Laravel (snake_case) vers React (camelCase) si nécessaire
        const keyMap = {
          'pickup_address': 'pickupAddress',
          'dropoff_address': 'dropoffAddress',
          'package_photo': 'packagePhoto',
          'declared_value': 'declaredValue'
        };

        for (const [key, messages] of Object.entries(apiErrors)) {
          const reactKey = keyMap[key] || key;
          mappedErrors[reactKey] = messages[0];
        }
        
        setFormErrors(mappedErrors);
        
        // Afficher la première erreur dans un toast
        const firstError = Object.values(apiErrors)[0][0];
        toast.error(firstError, { id: loadingToast });
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        console.error("Erreur serveur:", error);
        toast.error("Une erreur est survenue lors de la création de la commande.", { id: loadingToast });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="section-container">
      <div className="section-header2">
        <div>
          <h2>Nouvelle commande de livraison</h2>
          <p className="section-subtitle2">Remplissez les détails pour créer une demande de livraison.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="order-form-page">
        {/* 1. Adresses */}
        <div className="form-card">
          <h4 className="section-title"><MapPin size={18} /> Adresses</h4>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Lieu de récupération (Expéditeur) <span className="required">*</span></label>
              <input 
                type="text" 
                name="pickupName" 
                placeholder="Nom du lieu / Contact" 
                value={formData.pickupName} 
                onChange={handleInputChange} 
                className={formErrors.pickupName ? 'input-error' : ''}
              />
              {formErrors.pickupName && <p className="error-text">{formErrors.pickupName}</p>}
              
              <GooglePlacesAutocomplete
                value={formData.pickupAddress}
                onChange={handlePickupAddressChange}
                onPlaceSelect={handlePickupPlaceSelect}
                placeholder="Tapez une adresse au Gabon..."
              />
              {formErrors.pickupAddress && <p className="error-text">{formErrors.pickupAddress}</p>}
              
              {formData.pickupLat && formData.pickupLng && (
                <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <Save size={12} /> Adresse géolocalisée avec succès
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Lieu de livraison (Destinataire) <span className="required">*</span></label>
              <input 
                type="text" 
                name="dropoffName" 
                placeholder="Nom du destinataire" 
                value={formData.dropoffName} 
                onChange={handleInputChange} 
                className={formErrors.dropoffName ? 'input-error' : ''}
              />
              {formErrors.dropoffName && <p className="error-text">{formErrors.dropoffName}</p>}
              
              <GooglePlacesAutocomplete
                value={formData.dropoffAddress}
                onChange={handleDropoffAddressChange}
                onPlaceSelect={handleDropoffPlaceSelect}
                placeholder="Tapez une adresse au Gabon..."
              />
              {formErrors.dropoffAddress && <p className="error-text">{formErrors.dropoffAddress}</p>}
              
              {formData.dropoffLat && formData.dropoffLng && (
                <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <Save size={12} /> Adresse géolocalisée avec succès
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Détails du colis + Photo */}
        <div className="form-card">
          <h4 className="section-title"><Package size={18} /> Détails du colis</h4>
          <div className="form-grid-3">
            <div className="form-group">
              <label>Poids / Volume approx.</label>
              <input type="text" name="weight" placeholder="Ex: 2.5 kg" value={formData.weight} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Valeur déclarée (FCFA)</label>
              <input 
                type="number" 
                name="declaredValue" 
                placeholder="Optionnel" 
                value={formData.declaredValue} 
                onChange={handleInputChange} 
                className={formErrors.declaredValue ? 'input-error' : ''}
              />
              {formErrors.declaredValue && <p className="error-text">{formErrors.declaredValue}</p>}
            </div>
            <div className="form-group checkbox-group-vertical">
              <label className="checkbox-label-custom">
                <input type="checkbox" name="isFragile" checked={formData.isFragile} onChange={handleInputChange} />
                <span className="checkmark-custom"></span>
                <AlertCircle size={16} className="fragile-icon" />
                <span>Colis fragile</span>
              </label>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '24px' }}>
            <label>Photo du colis <span className="required">*</span></label>
            <div className="file-upload-wrapper">
              <input 
                type="file" 
                name="packagePhoto" 
                accept="image/jpeg, image/png, image/jpg" 
                onChange={handleInputChange} 
                className="file-input" 
                id="packagePhoto" 
              />
              <label htmlFor="packagePhoto" className={`file-upload-label ${formErrors.packagePhoto ? 'border-red-500 bg-red-50' : ''}`}>
                <Camera size={20} />
                <span>{formData.packagePhoto ? formData.packagePhoto.name : 'Importer une photo du colis'}</span>
              </label>
              
              {formErrors.packagePhoto && <p className="error-text">{formErrors.packagePhoto}</p>}
              
              {photoPreview && (
                <div className="image-preview-container" style={{ marginTop: '16px', position: 'relative', display: 'inline-block' }}>
                  <img src={photoPreview} alt="Aperçu" style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px', border: '1px solid #e2e8f0', objectFit: 'cover' }} />
                  <button type="button" onClick={handleRemovePhoto} style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#ef4444', color: 'white', border: '2px solid white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
            <p className="help-text" style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
              Formats acceptés : JPG, PNG. Taille maximale : 5 Mo.
            </p>
          </div>
        </div>

        {/* 3. Créneau et Instructions */}
        <div className="form-card">
          <h4 className="section-title"><Clock size={18} /> Créneau et Instructions</h4>
          <div className="form-group">
            <label>Type de livraison</label>
            <div className="radio-group">
              <label className="radio-label2">
                <input type="radio" name="deliveryType" value="immediat" checked={formData.deliveryType === 'immediat'} onChange={handleInputChange} />
                <span className="radio-custom"></span> Immédiat
              </label>
              <label className="radio-label2">
                <input type="radio" name="deliveryType" value="programme" checked={formData.deliveryType === 'programme'} onChange={handleInputChange} />
                <span className="radio-custom"></span> Programmé
              </label>
            </div>
          </div>
          {formData.deliveryType === 'programme' && (
            <div className="form-group mt-2">
              <label>Date et heure souhaitées <span className="required">*</span></label>
              <input 
                type="datetime-local" 
                name="scheduledDate" 
                value={formData.scheduledDate} 
                onChange={handleInputChange} 
                className={formErrors.scheduledDate ? 'input-error' : ''}
              />
              {formErrors.scheduledDate && <p className="error-text">{formErrors.scheduledDate}</p>}
            </div>
          )}
          <div className="form-group mt-2">
            <label>Instructions spécifiques</label>
            <textarea 
              name="instructions" 
              rows="3" 
              placeholder="Code d'entrée, étage, contact client..." 
              value={formData.instructions} 
              onChange={handleInputChange}
              className={formErrors.instructions ? 'input-error' : ''}
            ></textarea>
            {formErrors.instructions && <p className="error-text">{formErrors.instructions}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions-footer">
          <button type="submit" className="btn-primary" disabled={isLoading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minWidth: '200px' }}>
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Traitement...
              </>
            ) : (
              <>
                <Save size={18} /> Créer la commande
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default NouvelleCommandeSection;