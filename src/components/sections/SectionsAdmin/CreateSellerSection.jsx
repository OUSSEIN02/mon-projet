import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../../services/apiClient'; 
import toast from 'react-hot-toast';
import Loader from '../../../utils/Loader'; 
import {
  Mail,
  CheckCircle2,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  Upload,
  MapPin,
  Store,
  Camera,
  ArrowLeft,
  Shield,
  UserPlus
} from "lucide-react";

export default function CreateSellerSection({ onSuccess }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    acceptTerms: false,
    acceptPrivacy: false,
    companyName: '',
    phone: '',
    country: 'GA',
    city: '',
    address: '',
    password: '',
    confirmPassword: '',
    idFront: null,
    idBack: null,
    selfie: null
  });

  const [errors, setErrors] = useState({});

  const countries = [
    { code: 'GA', name: 'Gabon', flag: '🇬🇦', dialCode: '+241' },
    { code: 'SN', name: 'Sénégal', flag: '🇸🇳', dialCode: '+221' },
    { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', dialCode: '+225' },
    { code: 'CM', name: 'Cameroun', flag: '🇨🇲', dialCode: '+237' },
    { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33' },
  ];

  const citiesByCountry = {
    GA: ['Libreville', 'Port-Gentil', 'Franceville', 'Oyem', 'Moanda'],
    SN: ['Dakar', 'Thiès', 'Saint-Louis'],
    CI: ['Abidjan', 'Bouaké', 'Yamoussoukro'],
    CM: ['Douala', 'Yaoundé', 'Garoua'],
    FR: ['Paris', 'Lyon', 'Marseille'],
  };

  const selectedCountry = countries.find(c => c.code === formData.country) || countries[0];
  const availableCities = citiesByCountry[formData.country] || [];

  // --- FONCTION D'ANNULATION ---
  const handleCancel = () => {
    navigate('/dashboard/vendeurs');
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'file' ? files?.[0] || null : type === 'checkbox' ? checked : value,
      ...(name === 'country' ? { city: '' } : {})
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // --- VALIDATIONS ---
  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'L\'email est requis';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Format d\'email invalide';
    if (!formData.acceptTerms) newErrors.acceptTerms = 'Requis';
    if (!formData.acceptPrivacy) newErrors.acceptPrivacy = 'Requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.companyName) newErrors.companyName = 'Nom de l\'entreprise requis';
    if (!formData.phone) newErrors.phone = 'Téléphone requis';
    if (!formData.city) newErrors.city = 'Ville requise';
    if (!formData.address) newErrors.address = 'Adresse requise';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (!formData.password || formData.password.length < 6) newErrors.password = '6 caractères minimum';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    if (!formData.idFront) newErrors.idFront = 'Pièce d\'identité (recto) requise';
    if (!formData.idBack) newErrors.idBack = 'Pièce d\'identité (verso) requise';
    if (!formData.selfie) newErrors.selfie = 'Photo selfie requise';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  
    // --- NAVIGATION ---
    const nextStep = async () => {
      if (currentStep === 1) {
        // 1. Validation de base (format, cases cochées)
        if (!validateStep1()) return;
  
        // 2. Vérification auprès de la base de données
        setIsCheckingEmail(true);
        try {
          // Adaptez cette route selon votre API backend (ex: GET /api/sellers/check-email?email=...)
          const response = await apiClient.get('/sellers/check-email', {
            params: { email: formData.email }
          });
          
          // Supposons que votre backend renvoie { exists: true } ou { available: false }
          if (response.data.exists) {
            setErrors(prev => ({ 
              ...prev, 
              email: 'Cet email est déjà utilisé par un autre vendeur.' 
            }));
            toast.error('Cet email est déjà associé à un compte existant.');
            return; // On arrête ici, on ne passe pas à l'étape 2
          }
          
          // 3. Si l'email est disponible, on passe à l'étape suivante
          setCurrentStep(2);
          setErrors({}); // Nettoyer les erreurs au changement d'étape
          
        } catch (error) {
          console.error("Erreur lors de la vérification de l'email:", error);
          toast.error('Impossible de vérifier l\'email. Veuillez réessayer.');
        } finally {
          setIsCheckingEmail(false);
        }
  
      } else if (currentStep === 2 && validateStep2()) {
        setCurrentStep(3);
        setErrors({});
      }
    };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  // --- SOUMISSION ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep3()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading('Création du compte vendeur en cours...');

    try {
      const data = new FormData();
      data.append('email', formData.email);
      data.append('company_name', formData.companyName);
      data.append('phone', formData.phone);
      data.append('country', formData.country);
      data.append('city', formData.city);
      data.append('address', formData.address);
      data.append('password', formData.password);
      data.append('password_confirmation', formData.confirmPassword);
      
      if (formData.idFront) data.append('id_front', formData.idFront);
      if (formData.idBack) data.append('id_back', formData.idBack);
      if (formData.selfie) data.append('selfie', formData.selfie);

      const response = await apiClient.post('/sellers/register', data);
    
      toast.success('Vendeur créé avec succès !', { id: loadingToast });
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
        else navigate('/dashboard/vendeurs');
      }, 2000);
      
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Erreur lors de la création du vendeur';
      toast.error(errorMsg, { id: loadingToast });
      setIsLoading(false);
    }
  };

  const steps = [
    { num: 1, label: 'Vérification', icon: Mail },
    { num: 2, label: 'Profil', icon: Store },
    { num: 3, label: 'Validation', icon: CheckCircle2 },
  ];

  if (isLoading) {
    return (
      <div className="cs-container">
        <div className="cs-card cs-loader-wrapper">
          <Loader text="Création du compte vendeur en cours..." fullScreen={false} size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="cs-container">
      <div className="cs-header">
        <Link to="/dashboard/vendeurs" className="cs-back-btn" title="Retour à la liste">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="cs-main-title">
            <UserPlus size={28} className="cs-title-icon" />
            Créer un nouveau vendeur
          </h2>
          <p className="cs-subtitle">Remplissez les étapes ci-dessous pour créer le compte du vendeur</p>
        </div>
      </div>

      <div className="cs-signup-progress">
        {steps.map((step, idx) => (
          <React.Fragment key={step.num}>
            <div className={`cs-step ${currentStep >= step.num ? 'active' : ''} ${currentStep === step.num ? 'current' : ''}`}>
              <div className="cs-step-number">
                {currentStep > step.num ? <CheckCircle2 size={16} /> : step.num}
              </div>
              <span className="cs-step-label">{step.label}</span>
            </div>
            {idx < steps.length - 1 && <div className={`cs-step-line ${currentStep > step.num ? 'active' : ''}`} />}
          </React.Fragment>
        ))}
      </div>

      <motion.div 
        className="cs-signup-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        key={currentStep}
      >
        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            
            {/* ================= ÉTAPE 1: Email & Conditions ================= */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="cs-step-content"
              >
                <h2 className="cs-step-title">Étape 1: Vérification</h2>
                <p className="cs-step-subtitle">Commençons par l'adresse email professionnelle du vendeur.</p>

                <div className="cs-form-group">
                  <label className="cs-form-label">Email professionnel <span className="cs-required">*</span></label>
                  <div className="cs-input-with-icon">
                    <Mail size={18} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="exemple@entreprise.com"
                      className={`cs-form-input ${errors.email ? 'error' : ''}`}
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && <p className="cs-error-text">{errors.email}</p>}
                </div>

                <div className="cs-checkboxes-group">
                  <label className="cs-checkbox-label">
                    <input type="checkbox" name="acceptTerms" checked={formData.acceptTerms} onChange={handleChange} />
                    <span className="cs-checkmark" />
                    <span>J'accepte les <Link to="/terms" className="cs-link">conditions de service</Link></span>
                  </label>
                  {errors.acceptTerms && <p className="cs-error-text">{errors.acceptTerms}</p>}

                  <label className="cs-checkbox-label">
                    <input type="checkbox" name="acceptPrivacy" checked={formData.acceptPrivacy} onChange={handleChange} />
                    <span className="cs-checkmark" />
                    <span>J'accepte la <Link to="/privacy" className="cs-link">politique de confidentialité</Link></span>
                  </label>
                  {errors.acceptPrivacy && <p className="cs-error-text">{errors.acceptPrivacy}</p>}
                </div>

                <div className="cs-step-actions">
                  <button 
                    type="button" 
                    className="cs-btn-cancel" 
                    onClick={handleCancel}
                    disabled={isCheckingEmail}
                  >
                    <ArrowLeft size={16} /> Annuler
                  </button>
                  
                  <button 
                    type="button" 
                    className="cs-btn-continue" 
                    onClick={nextStep}
                    disabled={isCheckingEmail} // Désactive le bouton pendant la vérification
                  >
                    {isCheckingEmail ? (
                      <span className="flex items-center gap-2">
                        {/* Si votre composant Loader le permet, sinon un simple texte suffit */}
                        <span className="animate-spin">⏳</span> Vérification...
                      </span>
                    ) : (
                      <>Continuer <ArrowRight size={18} /></>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ================= ÉTAPE 2: Profil Entreprise ================= */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="cs-step-content"
              >
                <h2 className="cs-step-title">Étape 2: Profil</h2>
                <p className="cs-step-subtitle">Informations de l'entreprise</p>

                <div className="cs-form-group">
                  <label className="cs-form-label">Nom de l'entreprise <span className="cs-required">*</span></label>
                  <div className="cs-input-with-icon">
                    <Store size={18} />
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="Ma Boutique SARL"
                      className={`cs-form-input ${errors.companyName ? 'error' : ''}`}
                    />
                  </div>
                  {errors.companyName && <p className="cs-error-text">{errors.companyName}</p>}
                </div>

                <div className="cs-form-group">
                  <label className="cs-form-label">Téléphone <span className="cs-required">*</span></label>
                  <div className="cs-phone-input-group">
                    <div className="cs-country-selector">
                      <span className="cs-flag">{selectedCountry.flag}</span>
                      <span className="cs-dial-code">{selectedCountry.dialCode}</span>
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="07 12 34 56"
                      className={`cs-form-input ${errors.phone ? 'error' : ''}`}
                    />
                  </div>
                  {errors.phone && <p className="cs-error-text">{errors.phone}</p>}
                </div>

                <div className="cs-form-row">
                  <div className="cs-form-group">
                    <label className="cs-form-label">Pays <span className="cs-required">*</span></label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className={`cs-form-select ${errors.country ? 'error' : ''}`}
                    >
                      {countries.map(c => (
                        <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="cs-form-group">
                    <label className="cs-form-label">Ville <span className="cs-required">*</span></label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={`cs-form-select ${errors.city ? 'error' : ''}`}
                    >
                      <option value="">Sélectionner</option>
                      {availableCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                    {errors.city && <p className="cs-error-text">{errors.city}</p>}
                  </div>
                </div>

                <div className="cs-form-group">
                  <label className="cs-form-label">Adresse complète <span className="cs-required">*</span></label>
                  <div className="cs-input-with-icon">
                    <MapPin size={18} />
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Rue, quartier, bâtiment..."
                      className={`cs-form-input ${errors.address ? 'error' : ''}`}
                    />
                  </div>
                  {errors.address && <p className="cs-error-text">{errors.address}</p>}
                </div>

                <div className="cs-step-actions">
                  <button type="button" className="cs-btn-cancel" onClick={prevStep}>
                    <ArrowLeft size={16} /> Retour
                  </button>
                  <button type="button" className="cs-btn-continue" onClick={nextStep}>
                    Continuer <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ================= ÉTAPE 3: Validation & KYC ================= */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="cs-step-content"
              >
                <h2 className="cs-step-title">Étape 3: Validation</h2>
                <p className="cs-step-subtitle">Sécurisez le compte et finalisez l'inscription</p>

                <div className="cs-form-group">
                  <label className="cs-form-label">Mot de passe <span className="cs-required">*</span></label>
                  <div className="cs-password-input">
                    <Lock size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Minimum 6 caractères"
                      className={`cs-form-input ${errors.password ? 'error' : ''}`}
                    />
                    <button type="button" className="cs-toggle-password" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="cs-error-text">{errors.password}</p>}
                </div>

                <div className="cs-form-group">
                  <label className="cs-form-label">Confirmer le mot de passe <span className="cs-required">*</span></label>
                  <div className="cs-password-input">
                    <Lock size={18} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirmez votre mot de passe"
                      className={`cs-form-input ${errors.confirmPassword ? 'error' : ''}`}
                    />
                    <button type="button" className="cs-toggle-password" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="cs-error-text">{errors.confirmPassword}</p>}
                </div>

                <div className="cs-documents-section">
                  <h3 className="cs-documents-title">Documents requis (KYC)</h3>
                  
                  <div className="cs-file-upload">
                    <label className="cs-file-label">
                      <Upload size={20} />
                      <span>Pièce d'identité - Recto</span>
                      <input type="file" name="idFront" accept="image/*" onChange={handleChange} hidden />
                    </label>
                    {formData.idFront && <span className="cs-file-name">✅ {formData.idFront.name}</span>}
                    {errors.idFront && <p className="cs-error-text">{errors.idFront}</p>}
                  </div>

                  <div className="cs-file-upload">
                    <label className="cs-file-label">
                      <Upload size={20} />
                      <span>Pièce d'identité - Verso</span>
                      <input type="file" name="idBack" accept="image/*" onChange={handleChange} hidden />
                    </label>
                    {formData.idBack && <span className="cs-file-name">✅ {formData.idBack.name}</span>}
                    {errors.idBack && <p className="cs-error-text">{errors.idBack}</p>}
                  </div>

                  <div className="cs-file-upload">
                    <label className="cs-file-label">
                      <Camera size={20} />
                      <span>Photo selfie</span>
                      <input type="file" name="selfie" accept="image/*" capture="user" onChange={handleChange} hidden />
                    </label>
                    {formData.selfie && <span className="cs-file-name">✅ {formData.selfie.name}</span>}
                    {errors.selfie && <p className="cs-error-text">{errors.selfie}</p>}
                  </div>
                </div>

                <div className="cs-step-actions">
                  <button type="button" className="cs-btn-cancel" onClick={prevStep}>
                    <ArrowLeft size={16} /> Retour
                  </button>
                  <button type="submit" className="cs-btn-submit" disabled={isLoading}>
                    {isLoading ? 'Création...' : 'Créer le compte'} <CheckCircle2 size={18} />
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </form>
      </motion.div>

      {/* CSS Unique et Préfixé (cs-) */}
      <style>{`
        .cs-container {
          max-width: 700px;
          margin: 0 auto;
          padding: 20px;
        }
        .cs-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .cs-back-btn {
          padding: 8px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f5f9;
          color: #0f172a;
          text-decoration: none;
          transition: background 0.2s;
        }
        .cs-back-btn:hover {
          background: #e2e8f0;
        }
        .cs-main-title {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0;
        }
        .cs-title-icon {
          color: #f0672b;
        }
        .cs-subtitle {
          color: #64748b;
          font-size: 14px;
          margin-top: 4px;
          margin-bottom: 0;
        }
        .cs-signup-progress {
          display: flex;
          justify-content: space-between;
          margin-bottom: 32px;
          position: relative;
          padding: 0 20px;
        }
        .cs-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          z-index: 1;
          flex: 1;
        }
        .cs-step-number {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #e2e8f0;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.3s;
        }
        .cs-step.active .cs-step-number {
          background: #f0672b;
          color: white;
        }
        .cs-step-label {
          font-size: 13px;
          font-weight: 500;
          color: #94a3b8;
          transition: color 0.3s;
        }
        .cs-step.active .cs-step-label, .cs-step.current .cs-step-label {
          color: #0f172a;
          font-weight: 600;
        }
        .cs-step-line {
          position: absolute;
          top: 18px;
          left: 60px;
          right: 60px;
          height: 2px;
          background: #e2e8f0;
          z-index: 0;
          transition: background 0.3s;
        }
        .cs-step-line.active {
          background: #f0672b;
        }
        .cs-signup-card {
          background: white;
          border-radius: 12px;
          padding: 32px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .cs-loader-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }
        .cs-step-content {
          width: 100%;
        }
        .cs-step-title {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px 0;
        }
        .cs-step-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0 0 24px 0;
        }
        .cs-form-row {
          display: flex;
          gap: 16px;
        }
        .cs-form-group {
          margin-bottom: 20px;
        }
        .cs-form-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #0f172a;
          margin-bottom: 6px;
        }
        .cs-required {
          color: #ef4444;
        }
        .cs-input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }
        .cs-input-with-icon svg {
          position: absolute;
          left: 12px;
          color: #94a3b8;
        }
        .cs-form-input, .cs-form-select {
          width: 100%;
          padding: 10px 14px 10px 40px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
          background: white;
        }
        .cs-form-select {
          padding: 10px 14px;
          cursor: pointer;
        }
        .cs-form-input:focus, .cs-form-select:focus {
          outline: none;
          border-color: #f0672b;
          box-shadow: 0 0 0 3px rgba(240, 103, 43, 0.1);
        }
        .cs-form-input.error, .cs-form-select.error {
          border-color: #ef4444;
        }
        .cs-error-text {
          color: #ef4444;
          font-size: 12px;
          margin-top: 4px;
          margin-bottom: 0;
        }
        .cs-phone-input-group {
          display: flex;
          gap: 8px;
        }
        .cs-country-selector {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #f8fafc;
          font-size: 14px;
          white-space: nowrap;
        }
        .cs-phone-input-group .cs-form-input {
          padding-left: 14px;
        }
        .cs-password-input {
          position: relative;
          display: flex;
          align-items: center;
        }
        .cs-password-input svg:first-child {
          position: absolute;
          left: 12px;
          color: #94a3b8;
        }
        .cs-toggle-password {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
        }
        .cs-checkboxes-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }
        .cs-checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
          font-size: 14px;
          color: #0f172a;
        }
        .cs-checkbox-label input[type="checkbox"] {
          margin-top: 2px;
          accent-color: #f0672b;
          width: 16px;
          height: 16px;
        }
        .cs-link {
          color: #f0672b;
          text-decoration: none;
        }
        .cs-link:hover {
          text-decoration: underline;
        }
        .cs-step-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 32px;
          gap: 12px;
        }
        .cs-btn-cancel, .cs-btn-continue, .cs-btn-submit {
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          border: none;
        }
        .cs-btn-cancel {
          background: #f1f5f9;
          color: #0f172a;
        }
        .cs-btn-cancel:hover {
          background: #e2e8f0;
        }
        .cs-btn-continue, .cs-btn-submit {
          background: #f0672b;
          color: white;
        }
        .cs-btn-continue:hover, .cs-btn-submit:hover:not(:disabled) {
          background: #d9551f;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(240, 103, 43, 0.3);
        }
        .cs-btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .cs-documents-section {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #f1f5f9;
        }
        .cs-documents-title {
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 16px 0;
        }
        .cs-file-upload {
          margin-bottom: 16px;
        }
        .cs-file-label {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          border: 1px dashed #cbd5e1;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          background: #f8fafc;
        }
        .cs-file-label:hover {
          border-color: #f0672b;
          background: #fff7ed;
        }
        .cs-file-name {
          display: block;
          font-size: 13px;
          color: #16a34a;
          margin-top: 6px;
          margin-left: 4px;
        }
        @media (max-width: 640px) {
          .cs-form-row {
            flex-direction: column;
            gap: 0;
          }
          .cs-step-label {
            display: none;
          }
          .cs-signup-progress {
            padding: 0;
          }
          .cs-step-line {
            left: 40px;
            right: 40px;
          }
        }
      `}</style>
    </div>
  );
}