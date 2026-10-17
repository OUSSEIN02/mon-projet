import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../header/header';
import Footer from '../footer/footer';
import cta from "../../assets/cta-delivery-removebg-preview.png";
import apiClient from '../../services/apiClient';

import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  KeyRound,
  ShieldCheck
} from "lucide-react";
import './Login.css'; // Réutilise vos styles existants

export default function ForgotPassword() {
  const navigate = useNavigate();
  
  // États pour les 4 étapes : 'email', 'otp', 'password', 'success'
  const [step, setStep] = useState('email');
  
  // États des formulaires
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // États d'interface
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Nettoyage des erreurs à la saisie
  const clearError = () => setError('');

  // ─── ÉTAPE 1 : Envoi de l'OTP ───────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    clearError();

    if (!email) return setError('L\'email est requis.');
    if (!/\S+@\S+\.\S+/.test(email)) return setError('Format d\'email invalide.');

    setIsLoading(true);
    try {
      await apiClient.post('/forgot-password/send-otp', { email });
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible d\'envoyer le code. Vérifiez votre email.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── ÉTAPE 2 : Vérification de l'OTP ────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    clearError();

    if (otp.length !== 6) return setError('Le code doit contenir exactement 6 chiffres.');

    setIsLoading(true);
    try {
      await apiClient.post('/forgot-password/verify-otp', { email, otp });
      setStep('password');
    } catch (err) {
      setError(err.response?.data?.message || 'Code OTP incorrect ou expiré.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── ÉTAPE 3 : Réinitialisation du mot de passe ─────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearError();

    if (newPassword.length < 8) return setError('Le mot de passe doit contenir au moins 8 caractères.');
    if (newPassword !== confirmPassword) return setError('Les mots de passe ne correspondent pas.');

    setIsLoading(true);
    try {
      await apiClient.post('/forgot-password/reset', {
        email,
        otp,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la réinitialisation.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Rendu conditionnel des étapes ──────────────────────────
  const renderStep = () => {
    switch (step) {
      case 'email':
        return (
          <motion.form 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            onSubmit={handleSendOtp} className="login-form2"
          >
            <div className="form-group2">
              <label className="form-label2">Adresse Email</label>
              <div className="input-wrapper2">
                <Mail size={18} className="input-icon2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError(); }}
                  className={`form-input2 ${error ? 'error' : ''}`}
                  placeholder="exemple@email.com"
                />
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="login-error">
                <AlertCircle size={16} /> {error}
              </motion.div>
            )}

            <motion.button type="submit" disabled={isLoading} whileTap={{ scale: 0.98 }} className="btn-submit2">
              {isLoading ? <div className="spinner"></div> : <><Mail size={18} /> Envoyer le code</>}
            </motion.button>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Link to="/auth" className="forgot-link" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <ArrowLeft size={16} /> Retour à la connexion
              </Link>
            </div>
          </motion.form>
        );

      case 'otp':
        return (
          <motion.form 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            onSubmit={handleVerifyOtp} className="login-form2"
          >
            <div className="form-group2">
              <label className="form-label2">Code de vérification</label>
              <div className="input-wrapper2">
                <KeyRound size={18} className="input-icon2" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); clearError(); }}
                  className={`form-input2 ${error ? 'error' : ''}`}
                  placeholder="000000"
                  style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '20px', fontWeight: 'bold' }}
                />
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', textAlign: 'center' }}>
                Un code à 6 chiffres a été envoyé à <strong>{email}</strong>
              </p>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="login-error">
                <AlertCircle size={16} /> {error}
              </motion.div>
            )}

            <motion.button type="submit" disabled={isLoading} whileTap={{ scale: 0.98 }} className="btn-submit2">
              {isLoading ? <div className="spinner"></div> : <><ShieldCheck size={18} /> Vérifier le code</>}
            </motion.button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button type="button" onClick={handleSendOtp} disabled={isLoading} className="forgot-link" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f97316', fontWeight: '600' }}>
                Renvoyer le code
              </button>
            </div>
          </motion.form>
        );

      case 'password':
        return (
          <motion.form 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            onSubmit={handleResetPassword} className="login-form2"
          >
            <div className="form-group2">
              <label className="form-label2">Nouveau mot de passe</label>
              <div className="input-wrapper2">
                <Lock size={18} className="input-icon2" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); clearError(); }}
                  className={`form-input2 ${error ? 'error' : ''}`}
                  placeholder="Minimum 8 caractères"
                />
                <button type="button" className="password-toggle" onClick={() => setShowNewPassword(!showNewPassword)}>
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group2">
              <label className="form-label2">Confirmer le mot de passe</label>
              <div className="input-wrapper2">
                <Lock size={18} className="input-icon2" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }}
                  className={`form-input2 ${error ? 'error' : ''}`}
                  placeholder="Répétez le mot de passe"
                />
                <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="login-error">
                <AlertCircle size={16} /> {error}
              </motion.div>
            )}

            <motion.button type="submit" disabled={isLoading} whileTap={{ scale: 0.98 }} className="btn-submit2">
              {isLoading ? <div className="spinner"></div> : <><Lock size={18} /> Réinitialiser</>}
            </motion.button>
          </motion.form>
        );

      case 'success':
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', padding: '20px 0' }}
          >
            <div style={{ 
              width: '80px', height: '80px', borderRadius: '50%', 
              background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              margin: '0 auto 24px auto' 
            }}>
              <CheckCircle size={40} color="#16a34a" />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>Succès !</h2>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', marginBottom: '32px' }}>
              Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter à votre compte.
            </p>
            <motion.button 
              whileTap={{ scale: 0.98 }} 
              className="btn-submit2"
              onClick={() => navigate('/auth')}
            >
              <ArrowLeft size={18} /> Se connecter
            </motion.button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="login-page">
      <Header />

      <main className="login-main">
        <div className="login-hero">
          <div className="hero-image-wrapper">
            <img src={cta} alt="Livreur Gabon Express" className="hero-image" />
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-icon"><ShieldCheck size={18} /></div>
              <span>Sécurité renforcée</span>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-icon"><KeyRound size={18} /></div>
              <span>Récupération rapide</span>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="login-card"
          style={{ minHeight: step === 'success' ? '400px' : 'auto' }}
        >
          {step !== 'success' && (
            <>
              <h1 className="login-title">
                {step === 'email' && 'Mot de passe oublié ?'}
                {step === 'otp' && 'Vérification'}
                {step === 'password' && 'Nouveau mot de passe'}
              </h1>
              <p className="login-subtitle">
                {step === 'email' && 'Entrez votre email pour recevoir un code de vérification.'}
                {step === 'otp' && `Entrez le code à 6 chiffres envoyé à ${email}.`}
                {step === 'password' && 'Créez un mot de passe sécurisé pour votre compte.'}
              </p>
              <div style={{ height: '24px' }} />
            </>
          )}

          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}