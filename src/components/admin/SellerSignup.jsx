import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../header/header';
import Footer from '../footer/footer';
import apiClient from '../../services/apiClient';
import toast from 'react-hot-toast';
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
  Shield
} from "lucide-react";
import './SellerSignup.css';

export default function SellerSignup() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  
  const [formData, setFormData] = useState({
    // Étape 1
    email: '',
    acceptTerms: false,
    acceptPrivacy: false,
    
    // Étape 3
    companyName: '',
    phone: '',
    country: 'GA',
    city: '',
    address: '',
    
    // Étape 4
    password: '',
    confirmPassword: '',
    idFront: null,
    idBack: null,
    selfie: null
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  
  // Référence pour focaliser automatiquement sur le champ OTP
  const otpInputRef = useRef(null);

  // Liste des pays
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

  // Focus automatique sur le champ OTP quand on arrive à l'étape 2
  useEffect(() => {
    if (currentStep === 2 && otpInputRef.current) {
      setTimeout(() => otpInputRef.current.focus(), 100);
    }
  }, [currentStep]);

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
    if (!otpCode || otpCode.length < 4) newErrors.otp = 'Code OTP requis (min. 4 caractères)';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (!formData.companyName) newErrors.companyName = 'Nom de l\'entreprise requis';
    if (!formData.phone) newErrors.phone = 'Téléphone requis';
    if (!formData.city) newErrors.city = 'Ville requise';
    if (!formData.address) newErrors.address = 'Adresse requise';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
    const newErrors = {};
    if (!formData.password || formData.password.length < 6) newErrors.password = '6 caractères minimum';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    if (!formData.idFront) newErrors.idFront = 'Pièce d\'identité (recto) requise';
    if (!formData.idBack) newErrors.idBack = 'Pièce d\'identité (verso) requise';
    if (!formData.selfie) newErrors.selfie = 'Photo selfie requise';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- ACTIONS ---

  // 1. Envoyer OTP et PASSER À L'ÉTAPE 2
  const handleSendOTP = async () => {
    if (!validateStep1()) return;
    
    setIsLoading(true);
    try {
      await apiClient.post('/sellers/send-otp', { email: formData.email });
      toast.success(`Code OTP envoyé à ${formData.email}`);
      
      // ✅ C'EST CETTE LIGNE QUI MANQUAIT : passer à l'étape suivante
      setCurrentStep(2); 
      
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Erreur lors de l\'envoi du code';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Vérifier OTP et PASSER À L'ÉTAPE 3
  const handleVerifyOTP = async () => {
    if (!validateStep2()) return;
    
    setIsLoading(true);
    try {
      await apiClient.post('/sellers/verify-otp', { 
        email: formData.email,
        otp: otpCode
      });
      toast.success('Email vérifié avec succès !');
      setCurrentStep(3);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Code OTP incorrect ou expiré';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Soumission finale
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep4()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading('Inscription en cours...');

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

      // 1. Récupérer la réponse de l'API
      const response = await apiClient.post('/sellers/register', data);
      
      // 2. Extraire le token et les infos utilisateur
      const { access_token, data: responseData } = response.data;

      // 3. Stocker dans le localStorage (ou sessionStorage / Context)
      if (access_token) {
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('user', JSON.stringify(responseData.user));
        localStorage.setItem('seller', JSON.stringify(responseData.seller));
        
        if (responseData.permissions) {
          localStorage.setItem('permissions', JSON.stringify(responseData.permissions));
        }
      }

      toast.success('Inscription réussie ! Redirection...', { id: loadingToast });
      
      setTimeout(() => navigate('/vendeurs'), 2000);
      
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Erreur lors de l\'inscription';
      toast.error(errorMsg, { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({}); // Nettoyer les erreurs quand on revient en arrière
    }
  };

  const steps = [
    { num: 1, label: 'Vérification', icon: Mail },
    { num: 2, label: 'Code OTP', icon: Shield },
    { num: 3, label: 'Profil', icon: Store },
    { num: 4, label: 'Validation', icon: CheckCircle2 },
  ];

  return (
    <div className="seller-signup-page">
      <Header />
      
      <div className="simplified-signup-container">
        {/* Progress Steps */}
        <div className="signup-progress">
          {steps.map((step, idx) => (
            <React.Fragment key={step.num}>
              <div className={`step ${currentStep >= step.num ? 'active' : ''} ${currentStep === step.num ? 'current' : ''}`}>
                <div className="step-number">
                  {currentStep > step.num ? <CheckCircle2 size={16} /> : step.num}
                </div>
                <span className="step-label">{step.label}</span>
              </div>
              {idx < steps.length - 1 && <div className={`step-line ${currentStep > step.num ? 'active' : ''}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Main Form Card */}
        <motion.div 
          className="signup-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          key={currentStep} // Force le re-render avec animation à chaque changement d'étape
        >
          <AnimatePresence mode="wait">
            
            {/* ================= ÉTAPE 1: Email ================= */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="step-content"
              >
                <h2 className="step-title">Étape 1: Vérification</h2>
                <p className="step-subtitle">Commençons par vérifier votre adresse email professionnelle.</p>

                <div className="form-group">
                  <label className="form-label">Email professionnel <span className="required">*</span></label>
                  <p className="help-text">Un code de vérification à 6 chiffres sera envoyé à cette adresse.</p>
                  
                  <div className="input-with-icon">
                    <Mail size={18} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="exemple@entreprise.com"
                      className={`form-input ${errors.email ? 'error' : ''}`}
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && <p className="error-text">{errors.email}</p>}
                </div>

                <div className="checkboxes-group">
                  <label className="checkbox-label">
                    <input type="checkbox" name="acceptTerms" checked={formData.acceptTerms} onChange={handleChange} />
                    <span className="checkmark" />
                    <span>J'accepte les <Link to="/terms" className="link">conditions de service</Link></span>
                  </label>
                  {errors.acceptTerms && <p className="error-text">{errors.acceptTerms}</p>}

                  <label className="checkbox-label">
                    <input type="checkbox" name="acceptPrivacy" checked={formData.acceptPrivacy} onChange={handleChange} />
                    <span className="checkmark" />
                    <span>J'accepte la <Link to="/privacy" className="link">politique de confidentialité</Link></span>
                  </label>
                  {errors.acceptPrivacy && <p className="error-text">{errors.acceptPrivacy}</p>}
                </div>

                <div className="step-actions">
                  <button type="button" className="btn-cancel" onClick={() => navigate('/')}>
                    Annuler
                  </button>
                  <button 
                    type="button" 
                    className="btn-continue"
                    onClick={handleSendOTP} // ✅ Appel direct à la fonction qui envoie ET change d'étape
                    disabled={isLoading}
                  >
                    {isLoading ? 'Envoi en cours...' : 'Recevoir le code'} <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ================= ÉTAPE 2: OTP ================= */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="step-content"
              >
                <h2 className="step-title">Étape 2: Code OTP</h2>
                <p className="step-subtitle">Entrez le code à 6 chiffres reçu sur <strong>{formData.email}</strong></p>

                <div className="form-group">
                  <label className="form-label">Code de vérification</label>
                  <input
                    ref={otpInputRef}
                    type="text"
                    inputMode="numeric"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className={`form-input otp-input ${errors.otp ? 'error' : ''}`}
                    maxLength={6}
                  />
                  {errors.otp && <p className="error-text">{errors.otp}</p>}
                </div>

                <button 
                  type="button" 
                  className="resend-code"
                  onClick={handleSendOTP} // ✅ Permet de renvoyer le code si perdu
                  disabled={isLoading}
                >
                  Renvoyer le code par email
                </button>

                <div className="step-actions">
                  <button type="button" className="btn-cancel" onClick={prevStep}>
                    <ArrowLeft size={16} /> Modifier l'email
                  </button>
                  <button 
                    type="button" 
                    className="btn-continue"
                    onClick={handleVerifyOTP}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Vérification...' : 'Vérifier le code'} <CheckCircle2 size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ================= ÉTAPE 3: Profil ================= */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="step-content"
              >
                <h2 className="step-title">Étape 3: Profil</h2>
                <p className="step-subtitle">Informations de votre entreprise</p>

                <div className="form-group">
                  <label className="form-label">Nom de l'entreprise <span className="required">*</span></label>
                  <div className="input-with-icon">
                    <Store size={18} />
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="Ma Boutique SARL"
                      className={`form-input ${errors.companyName ? 'error' : ''}`}
                    />
                  </div>
                  {errors.companyName && <p className="error-text">{errors.companyName}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Téléphone <span className="required">*</span></label>
                  <div className="phone-input-group">
                    <div className="country-selector">
                      <span className="flag">{selectedCountry.flag}</span>
                      <span className="dial-code">{selectedCountry.dialCode}</span>
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="07 12 34 56"
                      className={`form-input ${errors.phone ? 'error' : ''}`}
                    />
                  </div>
                  {errors.phone && <p className="error-text">{errors.phone}</p>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Pays <span className="required">*</span></label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className={`form-select ${errors.country ? 'error' : ''}`}
                    >
                      {countries.map(c => (
                        <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ville <span className="required">*</span></label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={`form-select ${errors.city ? 'error' : ''}`}
                    >
                      <option value="">Sélectionner</option>
                      {availableCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                    {errors.city && <p className="error-text">{errors.city}</p>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Adresse complète <span className="required">*</span></label>
                  <div className="input-with-icon">
                    <MapPin size={18} />
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Rue, quartier, bâtiment..."
                      className={`form-input ${errors.address ? 'error' : ''}`}
                    />
                  </div>
                  {errors.address && <p className="error-text">{errors.address}</p>}
                </div>

                <div className="step-actions">
                  <button type="button" className="btn-cancel" onClick={prevStep}>
                    <ArrowLeft size={16} /> Retour
                  </button>
                  <button 
                    type="button" 
                    className="btn-continue"
                    onClick={() => { if(validateStep3()) setCurrentStep(4); }}
                  >
                    Continuer <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ================= ÉTAPE 4: Validation ================= */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="step-content"
              >
                <h2 className="step-title">Étape 4: Validation</h2>
                <p className="step-subtitle">Sécurisez votre compte et finalisez l'inscription</p>

                <div className="form-group">
                  <label className="form-label">Mot de passe <span className="required">*</span></label>
                  <div className="password-input">
                    <Lock size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Minimum 6 caractères"
                      className={`form-input ${errors.password ? 'error' : ''}`}
                    />
                    <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="error-text">{errors.password}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Confirmer le mot de passe <span className="required">*</span></label>
                  <div className="password-input">
                    <Lock size={18} />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirmez votre mot de passe"
                      className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                    />
                  </div>
                  {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
                </div>

                <div className="documents-section">
                  <h3>Documents requis (KYC)</h3>
                  
                  <div className="file-upload">
                    <label className="file-label">
                      <Upload size={20} />
                      <span>Pièce d'identité - Recto</span>
                      <input type="file" name="idFront" accept="image/*" onChange={handleChange} hidden />
                    </label>
                    {formData.idFront && <span className="file-name">✅ {formData.idFront.name}</span>}
                    {errors.idFront && <p className="error-text">{errors.idFront}</p>}
                  </div>

                  <div className="file-upload">
                    <label className="file-label">
                      <Upload size={20} />
                      <span>Pièce d'identité - Verso</span>
                      <input type="file" name="idBack" accept="image/*" onChange={handleChange} hidden />
                    </label>
                    {formData.idBack && <span className="file-name">✅ {formData.idBack.name}</span>}
                    {errors.idBack && <p className="error-text">{errors.idBack}</p>}
                  </div>

                  <div className="file-upload">
                    <label className="file-label">
                      <Camera size={20} />
                      <span>Photo selfie</span>
                      <input type="file" name="selfie" accept="image/*" capture="user" onChange={handleChange} hidden />
                    </label>
                    {formData.selfie && <span className="file-name">✅ {formData.selfie.name}</span>}
                    {errors.selfie && <p className="error-text">{errors.selfie}</p>}
                  </div>
                </div>

                <div className="step-actions">
                  <button type="button" className="btn-cancel" onClick={prevStep}>
                    <ArrowLeft size={16} /> Retour
                  </button>
                  <button 
                    type="submit" 
                    className="btn-submit"
                    onClick={handleSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Création du compte...' : 'Créer mon compte'} <CheckCircle2 size={18} />
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}