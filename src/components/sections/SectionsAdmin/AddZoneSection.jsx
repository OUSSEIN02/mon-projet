// components/dashboard/sections/AddZoneSection.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, DollarSign, Save, Globe, CheckSquare, Square, AlertCircle, Lock } from 'lucide-react';
import toast from 'react-hot-toast'; // <-- Import du toaster
import apiClient from '../../../services/apiClient';

const toutesLesZonesGabon = [
  'Estuaire (Libreville, Owendo, Akanda)', 'Haut-Ogooué (Franceville)', 'Moyen-Ogooué (Lambaréné)', 
  'Ngounié (Mouila)', 'Nyanga (Tchibanga)', 'Ogooué-Ivindo (Makokou)', 
  'Ogooué-Lolo (Koulamoutou)', 'Ogooué-Maritime (Port-Gentil)', 'Woleu-Ntem (Oyem)'
];

const AddZoneSection = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingZones, setIsLoadingZones] = useState(true);
  const [error, setError] = useState(null);
  const [existingZones, setExistingZones] = useState([]);
  
  const [formData, setFormData] = useState({ zones: [], tarifKm: '', statut: 'actif' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchExistingZones = async () => {
      try {
        const response = await apiClient.get('/dashboard/zones');
        const data = response.data.data || response.data;
        setExistingZones(Array.isArray(data) ? data.map(z => z.nom) : []);
      } catch (err) {
        console.error("Erreur chargement zones existantes:", err);
      } finally {
        setIsLoadingZones(false);
      }
    };
    fetchExistingZones();
  }, []);

  const zonesDejaConfigurees = toutesLesZonesGabon.filter(z => existingZones.includes(z));
  const zonesDisponibles = toutesLesZonesGabon.filter(z => !existingZones.includes(z));

  const handleZoneToggle = (zone) => {
    setFormData(prev => ({
      ...prev,
      zones: prev.zones.includes(zone) ? prev.zones.filter(z => z !== zone) : [...prev.zones, zone]
    }));
    if (errors.zones) setErrors(prev => ({ ...prev, zones: '' }));
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setError(null);
  };

  const validateForm = () => {
    const newErrors = {};
    if (formData.zones.length === 0) newErrors.zones = 'Veuillez sélectionner au moins une nouvelle zone';
    if (formData.tarifKm === '' || Number(formData.tarifKm) < 0) newErrors.tarifKm = 'Le tarif doit être 0 ou plus';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const zonesAajouter = formData.zones.filter(z => !existingZones.includes(z));
      const response = await apiClient.post('/dashboard/zones', {
        zones: zonesAajouter,
        tarif_km: Number(formData.tarifKm),
        statut: formData.statut
      });

      // ✅ Utilisation du Toast au lieu de alert()
      toast.success(response.data.message || 'Nouvelles zones enregistrées avec succès !');
      navigate('/dashboard/zones');
      
    } catch (err) {
      console.error("Erreur lors de l'enregistrement:", err);
      if (err.response?.data?.errors) {
        const formattedErrors = {};
        if (err.response.data.errors.zones) formattedErrors.zones = err.response.data.errors.zones[0];
        if (err.response.data.errors.tarif_km) formattedErrors.tarifKm = err.response.data.errors.tarif_km[0];
        setErrors(formattedErrors);
      }
      // ✅ Utilisation du Toast d'erreur
      toast.error(err.response?.data?.message || "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingZones) {
    return (
      <div className="az-container" style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <span className="az-spinner az-spinner-dark"></span>
        <span style={{ marginLeft: '12px', color: 'var(--az-muted-text)' }}>Chargement des zones...</span>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="az-container">
      <div className="az-header">
        <button onClick={() => navigate('/dashboard/zones')} className="az-back-link">
          <ArrowLeft size={16} /><span>Retour aux zones</span>
        </button>
        <h2 className="az-title">Configurer les zones de livraison</h2>
        <p className="az-subtitle">Les zones déjà configurées sont verrouillées. Sélectionnez les nouvelles provinces à ajouter.</p>
      </div>

      {error && (
        <div className="az-error-box">
          <AlertCircle size={18} className="az-error-icon" />
          <span className="az-error-text">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {zonesDejaConfigurees.length > 0 && (
          <div className="az-card az-card-existing">
            <div className="az-card-header az-card-header-muted">
              <h3 className="az-card-title"><Lock size={18} className="az-icon-muted" />Zones déjà configurées ({zonesDejaConfigurees.length})</h3>
            </div>
            <div className="az-card-body">
              <div className="az-zones-grid">
                {zonesDejaConfigurees.map((zone) => (
                  <div key={zone} className="az-zone-item az-zone-item-existing">
                    <CheckSquare size={20} className="az-zone-icon-existing" />
                    <span className="az-zone-text">{zone}</span>
                    <span className="az-badge-existing">Déjà active</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="az-card az-card-spaced">
          <div className="az-card-header">
            <h3 className="az-card-title"><Globe size={18} className="az-icon" />Zones disponibles à l'ajout ({zonesDisponibles.length})</h3>
          </div>
          <div className="az-card-body">
            {zonesDisponibles.length === 0 ? (
              <div className="az-empty-message">
                <CheckSquare size={24} className="az-icon-success" />
                <p>Toutes les zones du Gabon sont déjà configurées.</p>
              </div>
            ) : (
              <>
                <label className="az-label az-label-block">
                  <MapPin size={14} className="az-icon-inline" />Sélectionnez les nouvelles zones <span className="az-required">*</span>
                </label>
                <div className="az-zones-grid">
                  {zonesDisponibles.map((zone) => {
                    const isSelected = formData.zones.includes(zone);
                    return (
                      <label key={zone} className={`az-zone-item ${isSelected ? 'az-zone-item-selected' : 'az-zone-item-default'}`}>
                        {isSelected ? <CheckSquare size={20} className="az-zone-icon-checked" /> : <Square size={20} className="az-zone-icon-unchecked" />}
                        <input type="checkbox" checked={isSelected} onChange={() => handleZoneToggle(zone)} className="az-hidden-checkbox" />
                        <span className="az-zone-text">{zone}</span>
                      </label>
                    );
                  })}
                </div>
                {errors.zones && <p className="az-error-text-field">{errors.zones}</p>}
              </>
            )}
          </div>
        </div>

        <div className="az-card az-card-spaced">
          <div className="az-card-header">
            <h3 className="az-card-title"><DollarSign size={18} className="az-icon" />Tarification pour les nouvelles zones (en FCFA)</h3>
          </div>
          <div className="az-card-body">
            <div className="az-form-wrapper">
              <label className="az-label">Montant par kilomètre <span className="az-required">*</span></label>
              <div className="az-input-wrapper">
                <input type="number" name="tarifKm" value={formData.tarifKm} onChange={handleChange} className={`az-input ${errors.tarifKm ? 'az-input-error' : ''}`} placeholder="150" min="0" step="0.01" />
                <span className="az-input-suffix">FCFA / km</span>
              </div>
              {errors.tarifKm && <p className="az-error-text-field">{errors.tarifKm}</p>}
              <p className="az-helper-text">Ce tarif sera appliqué à chaque kilomètre parcouru dans les nouvelles zones sélectionnées.</p>
            </div>
          </div>
        </div>

        <div className="az-actions">
          <button type="button" className="az-btn az-btn-secondary" onClick={() => navigate('/dashboard/zones')}>Annuler</button>
          <button type="submit" className="az-btn az-btn-primary" disabled={isLoading || zonesDisponibles.length === 0}>
            {isLoading ? <span className="az-spinner"></span> : <><Save size={16} /><span>Enregistrer les nouvelles zones</span></>}
          </button>
        </div>
      </form>

      <style>{`
        .az-container { --az-primary: #f97316; --az-primary-hover: #f97316; --az-primary-light: #eff6ff; --az-primary-dark: #1e3a8a; --az-success: #10b981; --az-success-light: #d1fae5; --az-success-text: #065f46; --az-muted-bg: #f8fafc; --az-muted-text: #64748b; --az-muted-border: #e2e8f0; --az-red: #dc2626; --az-red-light: #fef2f2; --az-red-border: #fecaca; --az-red-text: #991b1b; --az-text: #0f172a; --az-border: #e2e8f0; --az-bg: #ffffff; --az-radius: 12px; --az-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);  color: var(--az-text); background: transparent; width: 100%; box-sizing: border-box; }
        .az-container * { box-sizing: border-box; }
        .az-header { margin-bottom: 24px; }
        .az-back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--az-muted-text); font-size: 14px; font-weight: 500; background: none; border: none; cursor: pointer; padding: 4px 0; margin-bottom: 8px; transition: color 0.2s; }
        .az-back-link:hover { color: var(--az-primary); }
        .az-title { margin: 0 0 4px 0; font-size: 24px; font-weight: 700; }
        .az-subtitle { margin: 0; font-size: 14px; color: var(--az-muted-text); }
        .az-error-box { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background-color: var(--az-red-light); border: 1px solid var(--az-red-border); border-radius: 8px; margin-bottom: 20px; color: var(--az-red-text); font-size: 14px; }
        .az-error-icon { flex-shrink: 0; } .az-error-text { flex: 1; }
        .az-card { background: var(--az-bg); border: 1px solid var(--az-border); border-radius: var(--az-radius); box-shadow: var(--az-shadow); overflow: hidden; }
        .az-card-spaced { margin-top: 24px; }
        .az-card-header { padding: 16px 20px; border-bottom: 1px solid var(--az-border); background: var(--az-muted-bg); }
        .az-card-header-muted { background: #f1f5f9; border-bottom-color: #cbd5e1; }
        .az-card-title { margin: 0; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .az-icon { color: var(--az-primary); } .az-icon-muted { color: var(--az-muted-text); } .az-icon-success { color: var(--az-success); }
        .az-card-body { padding: 20px; }
        .az-label { font-size: 14px; font-weight: 500; color: var(--az-text); display: inline-flex; align-items: center; gap: 6px; }
        .az-label-block { display: flex; margin-bottom: 12px; } .az-icon-inline { display: inline-flex; vertical-align: middle; } .az-required { color: var(--az-red); }
        .az-zones-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
        .az-zone-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 10px; transition: all 0.2s ease; border: 2px solid transparent; }
        .az-zone-item-default { border-color: var(--az-border); background-color: var(--az-bg); color: #334155; cursor: pointer; }
        .az-zone-item-default:hover { border-color: #cbd5e1; background-color: #f8fafc; }
        .az-zone-item-selected { border-color: var(--az-primary); background-color: var(--az-primary-light); color: var(--az-primary-dark); font-weight: 500; cursor: pointer; }
        .az-zone-icon-checked { color: var(--az-primary); flex-shrink: 0; } .az-zone-icon-unchecked { color: #94a3b8; flex-shrink: 0; } .az-hidden-checkbox { display: none; } .az-zone-text { font-size: 14px; line-height: 1.4; flex: 1; }
        .az-card-existing { border-color: #cbd5e1; }
        .az-zone-item-existing { border-color: var(--az-muted-border); background-color: #f8fafc; color: var(--az-muted-text); cursor: not-allowed; opacity: 0.8; }
        .az-zone-icon-existing { color: var(--az-success); flex-shrink: 0; }
        .az-badge-existing { font-size: 11px; font-weight: 600; padding: 2px 8px; background: var(--az-success-light); color: var(--az-success-text); border-radius: 12px; white-space: nowrap; }
        .az-error-text-field { margin-top: 12px; color: var(--az-red); font-size: 13px; font-weight: 500; }
        .az-empty-message { display: flex; align-items: center; gap: 12px; padding: 20px; background: var(--az-success-light); border-radius: 8px; color: var(--az-success-text); font-weight: 500; }
        .az-empty-message p { margin: 0; }
        .az-form-wrapper { max-width: 400px; }
        .az-input-wrapper { position: relative; margin-top: 8px; }
        .az-input { width: 100%; padding: 10px 12px; padding-right: 90px; border: 1px solid var(--az-border); border-radius: 8px; font-size: 14px; outline: none; transition: border-color 0.2s, box-shadow 0.2s; background: var(--az-bg); }
        .az-input:focus { border-color: var(--az-primary); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
        .az-input-error { border-color: var(--az-red); }
        .az-input-error:focus { border-color: var(--az-red); box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1); }
        .az-input-suffix { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--az-muted-text); font-size: 13px; font-weight: 600; pointer-events: none; }
        .az-helper-text { font-size: 12px; color: var(--az-muted-text); margin-top: 6px; line-height: 1.4; }
        .az-actions { margin-top: 32px; display: flex; justify-content: flex-end; gap: 12px; }
        .az-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; border: 1px solid transparent; white-space: nowrap; }
        .az-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .az-btn-secondary { background: var(--az-muted-bg); color: var(--az-text); border-color: var(--az-border); }
        .az-btn-secondary:hover:not(:disabled) { background: #f1f5f9; }
        .az-btn-primary { background: var(--az-primary); color: white; }
        .az-btn-primary:hover:not(:disabled) { background: var(--az-primary-hover); }
        .az-spinner { width: 16px; height: 16px; border: 2px solid #ffffff; border-top-color: transparent; border-radius: 50%; animation: az-spin 0.8s linear infinite; }
        .az-spinner-dark { border: 2px solid var(--az-muted-border); border-top-color: var(--az-primary); }
        @keyframes az-spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .az-zones-grid { grid-template-columns: 1fr; } }
        @media (max-width: 640px) { .az-title { font-size: 20px; } .az-card-body { padding: 16px; } .az-actions { flex-direction: column-reverse; gap: 12px; } .az-actions .az-btn { width: 100%; } .az-input { padding-right: 80px; } .az-input-suffix { font-size: 12px; right: 8px; } .az-empty-message { flex-direction: column; text-align: center; } }
      `}</style>
    </motion.div>
  );
};

export default AddZoneSection;