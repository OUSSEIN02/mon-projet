import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from "react-router-dom";
import { 
  User, Mail, Phone, Lock, Eye, EyeOff, CheckCircle, 
  Shield, Calendar, AlertCircle, Save, XCircle, MapPin, Building, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

import apiClient from '../../../services/apiClient';
import Loader from '../../../utils/Loader';
import '../../css/ProfilSection.css';

const ProfilSection = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [errors, setErrors] = useState({});
  
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);

  // États pour la modale de confirmation
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'profile' ou 'password'

  // --- 1. CHARGEMENT INITIAL ---
  useEffect(() => {
    const fetchProfile = async () => {
      setInitialLoading(true);
      try {
        const response = await apiClient.get('/user/profile');
        const userData = response.data.data;
        const vendeurData = userData.vendeur || {};

        setProfile({
          name: userData.name || '',
          email: userData.email || '',
          phone: vendeurData.phone || userData.phone || '',
          address: vendeurData.address || userData.address || '',
          city: vendeurData.city || '',
          country: vendeurData.country || '',
          company_name: vendeurData.company_name || userData.name || '',
          role: userData.role || 'Utilisateur',
          created_at: userData.created_at,
          is_verified: userData.is_verified || userData.email_verified_at,
          avatar: userData.avatar,
          _isSeller: !!userData.vendeur 
        });
      } catch (err) {
        console.error("Erreur chargement profil:", err);
        toast.error("Impossible de charger votre profil.");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // --- HANDLERS DE SAISIE ---
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // --- DÉCLENCHEMENT DE LA MODALE ---
  const requestProfileUpdate = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!profile.name.trim()) newErrors.name = 'Le nom est requis';
    if (!profile.email.trim()) newErrors.email = 'L\'email est requis';
    else if (!/\S+@\S+\.\S+/.test(profile.email)) newErrors.email = 'L\'email doit être valide';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Veuillez corriger les erreurs dans le formulaire.");
      return;
    }
    setPendingAction('profile');
    setShowConfirmModal(true);
  };

  const requestPasswordUpdate = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!passwords.current) newErrors.current = 'Le mot de passe actuel est requis';
    if (!passwords.new) newErrors.new = 'Le nouveau mot de passe est requis';
    else if (passwords.new.length < 6) newErrors.new = 'Le mot de passe doit contenir au moins 6 caractères';
    if (passwords.new !== passwords.confirm) newErrors.confirm = 'Les mots de passe ne correspondent pas';

    if (Object.keys(newErrors).length > 0) { 
      setErrors(newErrors); 
      toast.error("Veuillez corriger les erreurs dans le formulaire.");
      return; 
    }
    setPendingAction('password');
    setShowConfirmModal(true);
  };

  // --- EXÉCUTION RÉELLE APRÈS CONFIRMATION ---
  const executeAction = async () => {
    setShowConfirmModal(false);

    if (pendingAction === 'profile') {
      setIsLoadingProfile(true);
      try {
        const response = await apiClient.put('/user/profile', {
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
          city: profile.city,
          country: profile.country,
          company_name: profile.company_name,
        });
        
        const updatedData = response.data.data;
        const updatedVendeur = updatedData.vendeur || {};
        
        setProfile(prev => ({
          ...prev,
          name: updatedData.name,
          email: updatedData.email,
          phone: updatedVendeur.phone || updatedData.phone || '',
          address: updatedVendeur.address || updatedData.address || '',
          city: updatedVendeur.city || '',
          country: updatedVendeur.country || '',
          company_name: updatedVendeur.company_name || updatedData.name || '',
        }));
        
        toast.success("Profil mis à jour avec succès !");
      } catch (err) {
        console.error(err);
        if (err.response?.data?.errors) {
          setErrors(err.response.data.errors);
          toast.error("Certaines informations sont invalides.");
        } else {
          toast.error(err.response?.data?.message || "Une erreur est survenue lors de la mise à jour.");
        }
      } finally {
        setIsLoadingProfile(false);
      }
    } 
    
    else if (pendingAction === 'password') {
      setIsLoadingPassword(true);
      try {
        await apiClient.put('/user/password', {
          current_password: passwords.current,
          new_password: passwords.new,
          new_password_confirmation: passwords.confirm
        });
        setPasswords({ current: '', new: '', confirm: '' });
        toast.success("Mot de passe modifié avec succès !");
      } catch (err) {
        if (err.response?.data?.errors?.current_password) {
          setErrors({ current: "Le mot de passe actuel est incorrect." });
          toast.error("Le mot de passe actuel est incorrect.");
        } else {
          toast.error(err.response?.data?.message || "Erreur lors du changement de mot de passe.");
        }
      } finally {
        setIsLoadingPassword(false);
      }
    }
    
    setPendingAction(null);
  };

  // --- UTILITAIRES ---
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { level: 'empty', text: '', color: '#e2e8f0' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
    if (score <= 1) return { level: 'weak', text: 'Faible', color: '#ef4444' };
    if (score === 2) return { level: 'medium', text: 'Moyen', color: '#f59e0b' };
    return { level: 'strong', text: 'Fort', color: '#10b981' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non spécifié';
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const strength = getPasswordStrength(passwords.new);

  if (initialLoading || !profile) {
    return <Loader text="Chargement de votre profil..." fullScreen={true} size="lg" />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pr-page-container">
      <div className="pr-header">
        <div>
          <h2 className="pr-title">Mon profil</h2>
          <p className="pr-subtitle">Gérez vos informations personnelles et votre mot de passe.</p>
        </div>
      </div>

      <div className="pr-grid">
        <div className="pr-main-col">
          {/* 1. Formulaire Profil */}
          <form onSubmit={requestProfileUpdate}>
            <div className="pr-card">
              <div className="pr-card-header">
                <div>
                  <h3 className="pr-card-title">Informations {profile._isSeller ? 'de l\'entreprise' : 'personnelles'}</h3>
                  <p className="pr-card-desc">Mettez à jour vos informations de base</p>
                </div>
              </div>
              <div className="pr-card-body pr-form-container">
                <div className="pr-form-group">
                  <label className="pr-form-label">{profile._isSeller ? 'Nom de l\'entreprise' : 'Nom complet'} <span className="pr-required">*</span></label>
                  <input type="text" name="name" value={profile.name} onChange={handleProfileChange} className={`pr-form-input ${errors.name ? 'pr-input-error' : ''}`} />
                  {errors.name && <p className="pr-error-text">{errors.name}</p>}
                </div>

                {profile._isSeller && (
                  <div className="pr-form-group">
                    <label className="pr-form-label">Raison sociale / Nom commercial</label>
                    <div className="pr-password-wrapper">
                      <Building size={18} className="pr-input-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input type="text" name="company_name" value={profile.company_name} onChange={handleProfileChange} className="pr-form-input" style={{ paddingLeft: '40px' }} placeholder="Nom commercial" />
                    </div>
                  </div>
                )}

                <div className="pr-form-group">
                  <label className="pr-form-label">Adresse email <span className="pr-required">*</span></label>
                  <div className="pr-password-wrapper">
                    <Mail size={18} className="pr-input-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input type="email" name="email" value={profile.email} onChange={handleProfileChange} className={`pr-form-input ${errors.email ? 'pr-input-error' : ''}`} style={{ paddingLeft: '40px' }} />
                  </div>
                  {errors.email && <p className="pr-error-text">{errors.email}</p>}
                </div>

                <div className="pr-form-group">
                  <label className="pr-form-label">Numéro de téléphone</label>
                  <div className="pr-password-wrapper">
                    <Phone size={18} className="pr-input-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input type="tel" name="phone" value={profile.phone} onChange={handleProfileChange} className="pr-form-input" style={{ paddingLeft: '40px' }} placeholder="+241 XX XX XX XX" />
                  </div>
                </div>

                {profile._isSeller && (
                  <>
                    <div className="pr-form-group">
                      <label className="pr-form-label">Adresse physique</label>
                      <div className="pr-password-wrapper">
                        <MapPin size={18} className="pr-input-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                        <input type="text" name="address" value={profile.address} onChange={handleProfileChange} className="pr-form-input" style={{ paddingLeft: '40px' }} placeholder="Quartier, rue, bâtiment..." />
                      </div>
                    </div>
                    <div className="pr-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="pr-form-group">
                        <label className="pr-form-label">Ville</label>
                        <input type="text" name="city" value={profile.city} onChange={handleProfileChange} className="pr-form-input" placeholder="Ville" />
                      </div>
                      <div className="pr-form-group">
                        <label className="pr-form-label">Pays</label>
                        <input type="text" name="country" value={profile.country} onChange={handleProfileChange} className="pr-form-input" placeholder="Pays" />
                      </div>
                    </div>
                  </>
                )}

                <div className="pr-form-actions">
                  <button type="submit" disabled={isLoadingProfile} className="pr-btn pr-btn-primary">
                    {isLoadingProfile ? <span className="pr-spinner"></span> : <><Save size={16} /> Mettre à jour</>}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* 2. Formulaire Mot de passe */}
          <form onSubmit={requestPasswordUpdate}>
             <div className="pr-card">
              <div className="pr-card-header">
                <div>
                  <h3 className="pr-card-title">Changer le mot de passe</h3>
                  <p className="pr-card-desc">Mettez à jour votre mot de passe pour sécuriser votre compte</p>
                </div>
              </div>
              <div className="pr-card-body pr-form-container">
                <div className="pr-form-group">
                  <label className="pr-form-label">Mot de passe actuel <span className="pr-required">*</span></label>
                  <div className="pr-password-wrapper">
                    <input type={showPasswords.current ? 'text' : 'password'} name="current" value={passwords.current} onChange={handlePasswordChange} className={`pr-form-input ${errors.current ? 'pr-input-error' : ''}`} />
                    <button type="button" onClick={() => togglePasswordVisibility('current')} className="pr-password-toggle">{showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                  {errors.current && <p className="pr-error-text">{errors.current}</p>}
                </div>
                <div className="pr-form-group">
                  <label className="pr-form-label">Nouveau mot de passe <span className="pr-required">*</span></label>
                  <div className="pr-password-wrapper">
                    <input type={showPasswords.new ? 'text' : 'password'} name="new" value={passwords.new} onChange={handlePasswordChange} className={`pr-form-input ${errors.new ? 'pr-input-error' : ''}`} />
                    <button type="button" onClick={() => togglePasswordVisibility('new')} className="pr-password-toggle">{showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                  {errors.new && <p className="pr-error-text">{errors.new}</p>}
                  {passwords.new && (
                    <div className="pr-strength-container">
                      <div className="pr-strength-bar-bg"><div className="pr-strength-bar-fill" style={{ width: strength.level === 'weak' ? '33%' : strength.level === 'medium' ? '66%' : '100%', backgroundColor: strength.color }}></div></div>
                      <div className="pr-strength-text" style={{ color: strength.color }}>Force : {strength.text}</div>
                    </div>
                  )}
                </div>
                <div className="pr-form-group">
                  <label className="pr-form-label">Confirmer le nouveau mot de passe <span className="pr-required">*</span></label>
                  <div className="pr-password-wrapper">
                    <input type={showPasswords.confirm ? 'text' : 'password'} name="confirm" value={passwords.confirm} onChange={handlePasswordChange} className={`pr-form-input ${errors.confirm ? 'pr-input-error' : ''}`} />
                    <button type="button" onClick={() => togglePasswordVisibility('confirm')} className="pr-password-toggle">{showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                  {errors.confirm && <p className="pr-error-text">{errors.confirm}</p>}
                </div>
                <div className="pr-form-actions pr-form-actions-gap">
                  <button type="button" onClick={() => { setPasswords({ current: '', new: '', confirm: '' }); setErrors({}); }} className="pr-btn pr-btn-secondary">Annuler</button>
                  <button type="submit" disabled={isLoadingPassword} className="pr-btn pr-btn-primary">
                    {isLoadingPassword ? <span className="pr-spinner"></span> : <><Lock size={16} /> Changer le mot de passe</>}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* === COLONNE LATÉRALE === */}
        <div className="pr-sidebar-col">
          <div className="pr-card">
            <div className="pr-card-header"><h3 className="pr-card-title">Informations du compte</h3></div>
            <div className="pr-card-body">
              <div className="pr-account-summary">
                <div className="pr-avatar-box">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="Avatar" className="pr-avatar-img" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}} />
                  ) : (
                    <div className="pr-avatar-fallback" style={{width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontSize: '24px', fontWeight: 'bold'}}>
                      {profile.name ? profile.name.charAt(0).toUpperCase() : <User size={32} />}
                    </div>
                  )}
                </div>
                <div className="pr-account-info">
                  <h4 className="pr-account-name">{profile.name}</h4>
                  <p className="pr-account-email">{profile.email}</p>
                </div>
              </div>

              <dl className="pr-details-list">
                <div className="pr-detail-item">
                  <dt className="pr-detail-label">Rôle</dt>
                  <dd className="pr-detail-value">
                    <Shield size={14} className="pr-detail-icon" /> 
                    {profile.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Utilisateur'}
                  </dd>
                </div>
                <div className="pr-detail-item">
                  <dt className="pr-detail-label">Compte créé le</dt>
                  <dd className="pr-detail-value">
                    <Calendar size={14} className="pr-detail-icon" /> {formatDate(profile.created_at)}
                  </dd>
                </div>
                <div className="pr-detail-item">
                  <dt className="pr-detail-label">Statut du compte</dt>
                  <dd className={`pr-detail-value ${profile.is_verified ? 'pr-verified' : 'pr-unverified'}`}>
                    {profile.is_verified ? (
                      <><CheckCircle size={14} className="pr-detail-icon" style={{color: '#10b981'}} /> Vérifié</>
                    ) : (
                      <><AlertCircle size={14} className="pr-detail-icon" style={{color: '#f59e0b'}} /> Non vérifié</>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          
          <div className="pr-card">
            <div className="pr-card-header"><h3 className="pr-card-title">Conseils de sécurité</h3></div>
            <div className="pr-card-body pr-tips-container">
              <div className="pr-tip-item"><CheckCircle size={20} className="pr-tip-icon pr-tip-success" /><div><p className="pr-tip-title">Utilisez un mot de passe fort</p><p className="pr-tip-desc">Minimum 8 caractères avec lettres, chiffres et symboles</p></div></div>
              <div className="pr-tip-item"><CheckCircle size={20} className="pr-tip-icon pr-tip-success" /><div><p className="pr-tip-title">Gardez vos informations à jour</p><p className="pr-tip-desc">Assurez-vous que votre email est correct pour les notifications</p></div></div>
              <div className="pr-tip-item"><AlertCircle size={20} className="pr-tip-icon pr-tip-warning" /><div><p className="pr-tip-title">Déconnectez-vous régulièrement</p><p className="pr-tip-desc">Surtout si vous utilisez un ordinateur partagé</p></div></div>
            </div>
          </div>
        </div>
      </div>

      {/* === MODALE DE CONFIRMATION === */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="pr-modal-overlay" 
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="pr-modal-content" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pr-modal-header">
                <div className="pr-modal-icon-wrapper">
                  <AlertTriangle size={24} className="text-orange-500" />
                </div>
                <h3>Confirmation requise</h3>
              </div>
              <div className="pr-modal-body">
                <p className="pr-modal-text">
                  {pendingAction === 'profile' 
                    ? "Êtes-vous sûr de vouloir mettre à jour ces informations ?" 
                    : "Êtes-vous sûr de vouloir changer votre mot de passe ? Cette action est irréversible."}
                </p>
              </div>
              <div className="pr-modal-footer">
                <button onClick={() => setShowConfirmModal(false)} className="pr-btn pr-btn-secondary">
                  Annuler
                </button>
                <button onClick={executeAction} className="pr-btn pr-btn-primary">
                  {isLoadingProfile || isLoadingPassword ? (
                    <span className="pr-spinner-small"></span>
                  ) : (
                    "Confirmer"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProfilSection;