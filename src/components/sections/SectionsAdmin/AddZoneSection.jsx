import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, DollarSign, Clock, Save, Globe, 
  CheckCircle, AlertCircle 
} from 'lucide-react';

const AddZoneSection = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nom: '',
    code: '',
    tarifBase: '',
    tarifKm: '',
    delai: '',
    statut: 'actif'
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Mettre le code en majuscules automatiquement
    const finalValue = name === 'code' ? value.toUpperCase() : value;
    
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    
    // Effacer l'erreur du champ lors de la modification
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nom.trim()) newErrors.nom = 'Le nom de la zone est requis';
    if (!formData.code.trim()) newErrors.code = 'Le code de la zone est requis';
    if (!formData.tarifBase || formData.tarifBase <= 0) newErrors.tarifBase = 'Le tarif de base doit être supérieur à 0';
    if (!formData.tarifKm || formData.tarifKm < 0) newErrors.tarifKm = 'Le tarif au km doit être 0 ou plus';
    if (!formData.delai.trim()) newErrors.delai = 'Le délai estimé est requis (ex: 30-45 min)';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    
    // Simulation d'appel API
    // const data = new FormData();
    // Object.keys(formData).forEach(key => data.append(key, formData[key]));
    // await fetch('/api/admin/zones', { method: 'POST', body: data });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    
    alert(`La zone "${formData.nom}" a été ajoutée avec succès !`);
    navigate('/admin/zones');
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
          <h2>Ajouter une nouvelle zone</h2>
          <p className="section-subtitle">
            Configurez les paramètres de couverture et la grille tarifaire pour cette zone.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="info-card">
          <div className="card-header">
            <h3><Globe size={18} style={{ marginRight: '8px' }} /> Informations de la zone</h3>
          </div>
          <div className="card-body">
            <div className="form-grid-2">
              {/* Nom de la zone */}
              <div className="form-group">
                <label className="form-label">
                  <MapPin size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  Nom de la zone <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  className={`form-input ${errors.nom ? 'input-error' : ''}`}
                  placeholder="Ex : Libreville, Akanda..."
                />
                {errors.nom && <p className="error-text">{errors.nom}</p>}
              </div>

              {/* Code de la zone */}
              <div className="form-group">
                <label className="form-label">
                  Code abrégé <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className={`form-input ${errors.code ? 'input-error' : ''}`}
                  placeholder="Ex : LBV, AKA"
                  maxLength={5}
                  style={{ textTransform: 'uppercase' }}
                />
                {errors.code && <p className="error-text">{errors.code}</p>}
              </div>

              {/* Délai estimé */}
              <div className="form-group">
                <label className="form-label">
                  <Clock size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  Délai de livraison estimé <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="delai"
                  value={formData.delai}
                  onChange={handleChange}
                  className={`form-input ${errors.delai ? 'input-error' : ''}`}
                  placeholder="Ex : 30-45 min"
                />
                {errors.delai && <p className="error-text">{errors.delai}</p>}
              </div>

              {/* Statut */}
              <div className="form-group">
                <label className="form-label">Statut initial</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    <input
                      type="radio"
                      name="statut"
                      value="actif"
                      checked={formData.statut === 'actif'}
                      onChange={handleChange}
                      style={{ accentColor: '#16a34a' }}
                    />
                    <span className="badge badge-success" style={{ fontSize: '12px', padding: '2px 8px' }}>Actif</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    <input
                      type="radio"
                      name="statut"
                      value="inactif"
                      checked={formData.statut === 'inactif'}
                      onChange={handleChange}
                      style={{ accentColor: '#dc2626' }}
                    />
                    <span className="badge badge-danger" style={{ fontSize: '12px', padding: '2px 8px' }}>Inactif</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="info-card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <h3><DollarSign size={18} style={{ marginRight: '8px' }} /> Grille tarifaire (en FCFA)</h3>
          </div>
          <div className="card-body">
            <div className="form-grid-2">
              {/* Tarif de base */}
              <div className="form-group">
                <label className="form-label">
                  Tarif de base <span className="required">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    name="tarifBase"
                    value={formData.tarifBase}
                    onChange={handleChange}
                    className={`form-input ${errors.tarifBase ? 'input-error' : ''}`}
                    placeholder="500"
                    min="0"
                  />
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>
                    FCFA
                  </span>
                </div>
                {errors.tarifBase && <p className="error-text">{errors.tarifBase}</p>}
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Montant minimum pour toute livraison dans cette zone.</p>
              </div>

              {/* Tarif au km */}
              <div className="form-group">
                <label className="form-label">
                  Tarif additionnel par km <span className="required">*</span>
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
                  />
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>
                    FCFA / km
                  </span>
                </div>
                {errors.tarifKm && <p className="error-text">{errors.tarifKm}</p>}
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Coût ajouté pour chaque kilomètre au-delà de la base.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions" style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => navigate('/admin/zones')}
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
                <Save size={16} /> Enregistrer la zone
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default AddZoneSection;