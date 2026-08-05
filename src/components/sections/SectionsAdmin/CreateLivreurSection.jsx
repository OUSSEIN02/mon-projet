import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, User, Bike, AlertCircle, MapPin, FileText,
  Shield, CheckCircle, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';
import '../../css/CreateLivreurSection.css'; 

const CreateLivreurSection = ({ onGoBack, onSuccess }) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    nom: '', prenom: '', whatsapp: '', email: '',
    password: '', password_confirmation: '',      
    photoIdentite: null, photoPieceIdentite: null, photoMoto: null,
    numeroPlaque: '', numeroPlaqueSuffix: '',
    etatMoto: '', experience: '', zonesLivraison: [],
    status: 'en_attente', 
    disponibilite: 'disponible'
  });
  
  const [errors, setErrors] = useState({});
  const [previews, setPreviews] = useState({
    photoIdentite: null, photoPieceIdentite: null, photoMoto: null
  });

  const zonesGabon = [
    'Estuaire (Libreville, Owendo, Akanda)', 'Haut-Ogooué (Franceville)', 
    'Moyen-Ogooué (Lambaréné)', 'Ngounié (Mouila)', 'Nyanga (Tchibanga)', 
    'Ogooué-Ivindo (Makokou)', 'Ogooué-Lolo (Koulamoutou)', 
    'Ogooué-Maritime (Port-Gentil)', 'Woleu-Ntem (Oyem)'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      const file = files[0];
      setFormData(prev => ({ ...prev, [name]: file }));
      if (file) {
        const objectUrl = URL.createObjectURL(file);
        setPreviews(prev => {
          if (prev[name]) URL.revokeObjectURL(prev[name]);
          return { ...prev, [name]: objectUrl };
        });
      }
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        zonesLivraison: checked 
          ? [...prev.zonesLivraison, value]
          : prev.zonesLivraison.filter(z => z !== value)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!formData.prenom.trim()) newErrors.prenom = 'Le prénom est requis';
    if (!formData.whatsapp.trim()) newErrors.whatsapp = 'Le numéro WhatsApp est requis'; // <-- CHANGÉ
    if (!formData.email.trim()) newErrors.email = 'L\'email est requis';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email invalide';
    
    if (!formData.password) newErrors.password = 'Le mot de passe est requis';
    else if (formData.password.length < 6) newErrors.password = 'Minimum 6 caractères';
    
    if (formData.password !== formData.password_confirmation) { // <-- CHANGÉ
      newErrors.password_confirmation = 'Les mots de passe ne correspondent pas';
    }

    if (!formData.photoIdentite) newErrors.photoIdentite = 'Photo d\'identité requise';
    if (!formData.photoPieceIdentite) newErrors.photoPieceIdentite = 'Photo de la pièce d\'identité requise';
    if (!formData.photoMoto) newErrors.photoMoto = 'Photo du véhicule requise';
    
    const fullPlaque = `${formData.numeroPlaque}${formData.numeroPlaqueSuffix}`;
    if (!fullPlaque.trim()) newErrors.numeroPlaque = 'Numéro de plaque requis';
    
    if (!formData.etatMoto) newErrors.etatMoto = 'Veuillez sélectionner l\'état du véhicule';
    if (!formData.experience) newErrors.experience = 'Veuillez répondre à la question sur l\'expérience';
    if (formData.zonesLivraison.length === 0) {
      newErrors.zonesLivraison = 'Veuillez sélectionner au moins une zone';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs dans le formulaire.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
  
    setIsSubmitting(true);
    
    const data = new FormData();
    data.append('nom', formData.nom);
    data.append('prenom', formData.prenom);
    data.append('whatsapp', formData.whatsapp); // <-- CHANGÉ
    data.append('email', formData.email);
    data.append('password', formData.password);
    data.append('password_confirmation', formData.password_confirmation); // <-- CHANGÉ (Important pour Laravel)
    
    data.append('numero_plaque', `${formData.numeroPlaque}${formData.numeroPlaqueSuffix}`);
    data.append('etat_moto', formData.etatMoto);
    data.append('experience', formData.experience);
    
    // Ajout des champs admin
    data.append('status', formData.status);
    data.append('disponibilite', formData.disponibilite);
    
    if (formData.photoIdentite) data.append('photo_identite', formData.photoIdentite);
    if (formData.photoPieceIdentite) data.append('photo_piece_identite', formData.photoPieceIdentite);
    if (formData.photoMoto) data.append('photo_moto', formData.photoMoto);
    
    formData.zonesLivraison.forEach(zone => {
      data.append('zones_livraison[]', zone);
    });
  
    try {
      // Assurez-vous que cette route pointe vers votre méthode registerLivreur
      const response = await apiClient.post('/livreurs/register', data, { // Ou '/admin/livreurs' selon vos routes
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success(response.data.message || "Livreur créé avec succès !");
      
      if (onSuccess) onSuccess();
      
      // Réinitialisation (mettre à jour les noms ici aussi)
      setFormData({
        nom: '', prenom: '', whatsapp: '', email: '',
        password: '', password_confirmation: '',
        photoIdentite: null, photoPieceIdentite: null, photoMoto: null,
        numeroPlaque: '', numeroPlaqueSuffix: '',
        etatMoto: '', experience: '', zonesLivraison: [],
        status: 'en_attente', disponibilite: 'disponible'
      });
      setPreviews({ photoIdentite: null, photoPieceIdentite: null, photoMoto: null });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (err) {
      console.error("Erreur création livreur:", err);
      
      if (err.response?.status === 422) {
        const apiErrors = err.response.data.errors;
        const mappedErrors = {};
        
        // Mapping précis des erreurs Laravel vers React
        if (apiErrors.whatsapp) mappedErrors.whatsapp = apiErrors.whatsapp[0];
        if (apiErrors.email) mappedErrors.email = apiErrors.email[0];
        if (apiErrors.password) mappedErrors.password = apiErrors.password[0];
        if (apiErrors.password_confirmation) mappedErrors.password_confirmation = apiErrors.password_confirmation[0];
        
        if (apiErrors.numero_plaque) mappedErrors.numeroPlaque = apiErrors.numero_plaque[0];
        if (apiErrors.photo_identite) mappedErrors.photoIdentite = apiErrors.photo_identite[0];
        if (apiErrors.photo_piece_identite) mappedErrors.photoPieceIdentite = apiErrors.photo_piece_identite[0];
        if (apiErrors.photo_moto) mappedErrors.photoMoto = apiErrors.photo_moto[0];
        if (apiErrors.zones_livraison) mappedErrors.zonesLivraison = apiErrors.zones_livraison[0];
        
        ['nom', 'prenom', 'etat_moto', 'experience'].forEach(field => {
          if (apiErrors[field]) mappedErrors[field] = apiErrors[field][0];
        });
  
        setErrors(mappedErrors);
        toast.error("Veuillez corriger les erreurs indiquées.");
      } else {
        toast.error(err.response?.data?.message || "Une erreur est survenue.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const FileUploadZone = ({ name, label, icon: Icon, preview }) => (
    <div className="file-upload-zone">
      <input type="file" name={name} accept="image/*" onChange={handleChange} className="file-input" id={name} />
      <label htmlFor={name} className={`file-upload-label ${errors[name] ? 'border-error' : ''}`}>
        {preview ? (
          <div className="file-preview">
            <img src={preview} alt={label} />
            <div className="file-preview-overlay"><span>Modifier</span></div>
          </div>
        ) : (
          <>
            <Icon size={32} className="upload-icon" />
            <span className="upload-text">{label}</span>
            <span className="upload-hint">PNG, JPEG (Max 2Mo)</span>
          </>
        )}
      </label>
      {errors[name] && <p className="error-text">{errors[name]}</p>}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="admin-livreur-container"
    >
      {/* Header */}
      <div className="form-header">
        <Link to="/dashboard/livreurs" className="back-btn">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="page-title">
            <Bike size={28} className="title-icon" />
            Créer un nouveau livreur
          </h2>
          <p className="page-subtitle">Formulaire d'inscription administrateur (parcours optimisé)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="livreur-form">
        
        {/* Section 1 : Informations Personnelles */}
        <section className="form-section">
          <h3 className="section-title"><User size={20} /> Informations Personnelles</h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Nom *</label>
              <input type="text" name="nom" value={formData.nom} onChange={handleChange} placeholder="Ex: MOUSSAVOU" className={errors.nom ? 'error' : ''} />
              {errors.nom && <p className="error-text">{errors.nom}</p>}
            </div>
            <div className="form-group">
              <label>Prénom(s) *</label>
              <input type="text" name="prenom" value={formData.prenom} onChange={handleChange} placeholder="Ex: Jean" className={errors.prenom ? 'error' : ''} />
              {errors.prenom && <p className="error-text">{errors.prenom}</p>}
            </div>
            <div className="form-group">
              <label>Téléphone / WhatsApp *</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+241 077 00 00 00" className={errors.phone ? 'error' : ''} />
              {errors.phone && <p className="error-text">{errors.phone}</p>}
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="votre@email.com" className={errors.email ? 'error' : ''} />
              {errors.email && <p className="error-text">{errors.email}</p>}
            </div>
            <div className="form-group">
              <label>Mot de passe *</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Minimum 6 caractères" className={errors.password ? 'error' : ''} />
              {errors.password && <p className="error-text">{errors.password}</p>}
            </div>
            <div className="form-group">
              <label>Confirmer le mot de passe *</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Répétez le mot de passe" className={errors.confirmPassword ? 'error' : ''} />
              {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
            </div>
          </div>

          <div className="form-grid file-grid">
            <div className="form-group full-width">
              <label>Photo d'identité (Selfie) *</label>
              <FileUploadZone name="photoIdentite" label="Photo de vous" icon={User} preview={previews.photoIdentite} />
            </div>
            <div className="form-group full-width">
              <label>Photo de la pièce d'identité *</label>
              <FileUploadZone name="photoPieceIdentite" label="CNI / Passeport / Permis" icon={FileText} preview={previews.photoPieceIdentite} />
            </div>
          </div>
        </section>

        {/* Section 2 : Informations sur le véhicule */}
        <section className="form-section">
          <h3 className="section-title"><Bike size={20} /> Informations sur le véhicule</h3>
          
          <div className="form-group full-width" style={{ marginBottom: '20px' }}>
            <label>Photo du véhicule *</label>
            <FileUploadZone name="photoMoto" label="Cliquez pour téléverser la photo" icon={Bike} preview={previews.photoMoto} />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Numéro de plaque *</label>
              <div className="plaque-input-group">
                <input 
                  type="text" 
                  name="numeroPlaque" 
                  value={formData.numeroPlaque} 
                  onChange={handleChange} 
                  placeholder="2AA" 
                  maxLength={3}
                  className={`plaque-prefix ${errors.numeroPlaque ? 'error' : ''}`} 
                />
                <span className="plaque-separator">-</span>
                <input 
                  type="text" 
                  name="numeroPlaqueSuffix" 
                  value={formData.numeroPlaqueSuffix} 
                  onChange={handleChange} 
                  placeholder="0000" 
                  maxLength={4}
                  className={`plaque-number ${errors.numeroPlaque ? 'error' : ''}`} 
                />
              </div>
              {errors.numeroPlaque && <p className="error-text">{errors.numeroPlaque}</p>}
            </div>
            <div className="form-group">
              <label>État du véhicule *</label>
              <select name="etatMoto" value={formData.etatMoto} onChange={handleChange} className={errors.etatMoto ? 'error' : ''}>
                <option value="">Sélectionnez l'état</option>
                <option value="excellent">Excellent</option>
                <option value="bon">Bon</option>
                <option value="moyen">Moyen</option>
                <option value="correct">Correct</option>
              </select>
              {errors.etatMoto && <p className="error-text">{errors.etatMoto}</p>}
            </div>
          </div>
        </section>

        {/* Section 3 : Expérience & Zones */}
        <section className="form-section">
          <h3 className="section-title"><MapPin size={20} /> Expérience & Zones de livraison</h3>
          
          <div className="form-group full-width experience-group">
            <label>Avez-vous déjà travaillé comme livreur ? *</label>
            <div className="radio-group">
              <label className="radio-label">
                <input type="radio" name="experience" value="oui" checked={formData.experience === 'oui'} onChange={handleChange} />
                <span className="radio-custom"></span> Oui
              </label>
              <label className="radio-label">
                <input type="radio" name="experience" value="non" checked={formData.experience === 'non'} onChange={handleChange} />
                <span className="radio-custom"></span> Non
              </label>
            </div>
            {errors.experience && <p className="error-text">{errors.experience}</p>}
          </div>

          <div className="zones-section">
            <div className="zones-header">
              <MapPin size={20} />
              <h4>Zones de livraison *</h4>
            </div>
            <p className="zones-description">Sélectionnez les provinces du Gabon où vous souhaitez effectuer des livraisons.</p>
            <div className={`zones-grid ${errors.zonesLivraison ? 'error-border' : ''}`}>
              {zonesGabon.map((zone) => (
                <label key={zone} className="checkbox-label">
                  <input type="checkbox" value={zone} checked={formData.zonesLivraison.includes(zone)} onChange={handleChange} />
                  <span className="checkmark"></span>
                  {zone}
                </label>
              ))}
            </div>
            {errors.zonesLivraison && (
              <div className="warning-message">
                <AlertCircle size={16} />
                {errors.zonesLivraison}
              </div>
            )}
          </div>
        </section>

        {/* Section 4 : Paramètres Administrateur */}
        <section className="form-section admin-section">
          <h3 className="section-title admin-title"><Shield size={20} /> Paramètres Administrateur</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Statut initial du compte</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="pending">En attente de validation</option>
                <option value="active">Actif (Validé immédiatement)</option>
                <option value="suspended">Suspendu</option>
              </select>
            </div>
            <div className="form-group">
              <label>Disponibilité initiale</label>
              <select name="disponibilite" value={formData.disponibilite} onChange={handleChange}>
                <option value="disponible">Disponible</option>
                <option value="indisponible">Indisponible</option>
              </select>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="form-actions">
          <Link to="/dashboard/livreurs" className="btn-secondary">
            Annuler
          </Link>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Création en cours...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Créer le compte livreur
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default CreateLivreurSection;