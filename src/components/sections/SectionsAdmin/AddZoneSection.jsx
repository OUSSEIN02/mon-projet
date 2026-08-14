import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, DollarSign, Save, Globe, 
  CheckSquare, Square, AlertCircle
} from 'lucide-react';
import apiClient from '../../../services/apiClient';

const zonesGabon = [
  'Estuaire (Libreville, Owendo, Akanda)', 
  'Haut-Ogooué (Franceville)', 
  'Moyen-Ogooué (Lambaréné)', 
  'Ngounié (Mouila)', 
  'Nyanga (Tchibanga)', 
  'Ogooué-Ivindo (Makokou)', 
  'Ogooué-Lolo (Koulamoutou)', 
  'Ogooué-Maritime (Port-Gentil)', 
  'Woleu-Ntem (Oyem)'
];

const AddZoneSection = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    zones: [],
    tarifKm: '',
    statut: 'actif'
  });

  const [errors, setErrors] = useState({});

  const handleZoneToggle = (zone) => {
    setFormData(prev => {
      const isSelected = prev.zones.includes(zone);
      return {
        ...prev,
        zones: isSelected 
          ? prev.zones.filter(z => z !== zone)
          : [...prev.zones, zone]
      };
    });
    
    if (errors.zones) {
      setErrors(prev => ({ ...prev, zones: '' }));
    }
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setError(null);
  };

  const validateForm = () => {
    const newErrors = {};
    if (formData.zones.length === 0) {
      newErrors.zones = 'Veuillez sélectionner au moins une zone';
    }
    if (formData.tarifKm === '' || Number(formData.tarifKm) < 0) {
      newErrors.tarifKm = 'Le tarif au km doit être 0 ou plus';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post('/dashboard/zones', {
        zones: formData.zones,
        tarif_km: Number(formData.tarifKm),
        statut: formData.statut
      });

      const responseData = response.data;
      
      alert(responseData.message || 'Zones enregistrées avec succès !');
      navigate('/admin/zones');
      
    } catch (err) {
      console.error("Erreur lors de l'enregistrement:", err);
      
      // Gestion des erreurs de validation
      if (err.response?.data?.errors) {
        const apiErrors = err.response.data.errors;
        const formattedErrors = {};
        
        if (apiErrors.zones) formattedErrors.zones = apiErrors.zones[0];
        if (apiErrors.tarif_km) formattedErrors.tarifKm = apiErrors.tarif_km[0];
        
        setErrors(formattedErrors);
      }
      
      setError(
        err.response?.data?.message || 
        "Une erreur est survenue lors de l'enregistrement."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="section-container"
    >
      {/* Header de section */}
      <div className="section-header">
        <div>
          <button onClick={() => navigate('/admin/zones')} className="back-link">
            <ArrowLeft size={16} /> Retour aux zones
          </button>
          <h2>Configurer les zones de livraison</h2>
          <p className="section-subtitle">
            Sélectionnez les provinces couvertes et définissez le tarif kilométrique applicable.
          </p>
        </div>
      </div>

      {/* Message d'erreur global */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          marginBottom: '20px',
          color: '#991b1b',
          fontSize: '14px'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="info-card">
          <div className="card-header">
            <h3><Globe size={18} style={{ marginRight: '8px' }} /> Zones de couverture (Gabon)</h3>
          </div>
          <div className="card-body">
            <label className="form-label" style={{ display: 'block', marginBottom: '12px' }}>
              <MapPin size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              Sélectionnez les zones actives <span className="required">*</span>
            </label>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {zonesGabon.map((zone) => {
                const isSelected = formData.zones.includes(zone);
                return (
                  <label 
                    key={zone}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      border: `2px solid ${isSelected ? '#2563eb' : '#e2e8f0'}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                      transition: 'all 0.2s ease',
                      fontSize: '14px',
                      fontWeight: isSelected ? '500' : '400',
                      color: isSelected ? '#1e3a8a' : '#334155'
                    }}
                  >
                    {isSelected ? (
                      <CheckSquare size={20} style={{ color: '#2563eb', flexShrink: 0 }} />
                    ) : (
                      <Square size={20} style={{ color: '#94a3b8', flexShrink: 0 }} />
                    )}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleZoneToggle(zone)}
                      style={{ display: 'none' }}
                    />
                    <span>{zone}</span>
                  </label>
                );
              })}
            </div>
            {errors.zones && <p className="error-text" style={{ marginTop: '12px', color: '#dc2626' }}>{errors.zones}</p>}
          </div>
        </div>

        <div className="info-card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <h3><DollarSign size={18} style={{ marginRight: '8px' }} /> Tarification (en FCFA)</h3>
          </div>
          <div className="card-body">
            <div style={{ maxWidth: '400px' }}>
              <div className="form-group">
                <label className="form-label">
                  Montant par kilomètre <span className="required">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    name="tarifKm"
                    value={formData.tarifKm}
                    onChange={handleChange}
                    className={`form-input ${errors.tarifKm ? 'input-error' : ''}`}
                    placeholder="150"
                    min="0"
                    step="0.01"
                    style={{ width: '100%', paddingRight: '80px' }}
                  />
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>
                    FCFA / km
                  </span>
                </div>
                {errors.tarifKm && <p className="error-text" style={{ color: '#dc2626' }}>{errors.tarifKm}</p>}
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Tarif appliqué pour chaque kilomètre parcouru dans les zones sélectionnées.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => navigate('/dashboard/zones')}
          >
            Annuler
          </button>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {isLoading ? (
              <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
            ) : (
              <>
                <Save size={16} /> Enregistrer les zones
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default AddZoneSection;