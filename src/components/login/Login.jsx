import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
  LogIn,
  Users,
  ShieldCheck,
  Zap,
  Headphones,
  LockKeyhole
} from "lucide-react";
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    if (loginError) setLoginError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'L\'email est requis';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Format d\'email invalide';
    if (!formData.password) newErrors.password = 'Le mot de passe est requis';
    else if (formData.password.length < 6) newErrors.password = '6 caractères minimum';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setLoginError('');

    try {
      const response = await apiClient.post('/login', {
        email: formData.email,
        password: formData.password,
      });

      const { access_token, data: responseData } = response.data;

      if (access_token) {
        // 🟢 Utilise les valeurs renvoyées directement par le backend si disponibles
        const userRole = responseData.role || responseData.user?.roles?.[0]?.slug || 'user';
        const accountStatus = responseData.account_status || 'en_attente';

        const isLivreur = userRole === 'livreur' || responseData.user?.livreur;

        if (isLivreur) {
          navigate('/livreur-app');
          return;
        }

        // 🟢 1. BLOQUER SI SUSPENDU OU REJETÉ
        if (accountStatus === 'suspendu' || accountStatus === 'rejeté') {
          setLoginError(`Votre compte a été ${accountStatus}. Veuillez contacter le support.`);
          setIsLoading(false);
          return; // On arrête tout, pas de redirection
        }

        // 🟢 2. REDIRIGER VERS LA PAGE D'ATTENTE SI EN ATTENTE
        if (accountStatus === 'en_attente') {
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('user', JSON.stringify(responseData.user));
          localStorage.setItem('role', userRole);
          navigate('/account-pending');
          return; // On arrête tout
        }

        // 🟢 3. CONNEXION NORMALE SI 'valide'
        const duration = formData.rememberMe 
          ? (30 * 24 * 60 * 60 * 1000) 
          : (24 * 60 * 60 * 1000);
          
        const expirationTime = Date.now() + duration;

        localStorage.setItem('access_token', access_token);
        localStorage.setItem('user', JSON.stringify(responseData.user));
        localStorage.setItem('role', userRole);
        localStorage.setItem('session_expires_at', expirationTime.toString());

        if (responseData.permissions) {
          localStorage.setItem('permissions', JSON.stringify(responseData.permissions));
        }

        navigate('/dashboard');
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 422) {
        setLoginError('Email ou mot de passe incorrect.');
      } else {
        setLoginError(error.response?.data?.message || 'Erreur de connexion au serveur.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="login-page">
      {/* TOPBAR */}
      <Header />

      {/* MAIN */}
      <main className="login-main">
        {/* HERO */}
        <div className="login-hero">
          <div className="hero-image-wrapper">
            <img src={cta} alt="Livreur Gabon Express" className="hero-image" />
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-icon">
                <Users size={18} />
              </div>
              <span>Plus de 1000 vendeurs actifs</span>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-icon">
                <ShieldCheck size={18} />
              </div>
              <span>Paiements 100% sécurisés</span>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-icon">
                <Zap size={18} />
              </div>
              <span>Livraison rapide et fiable</span>
            </div>
          </div>
        </div>

        {/* CARD */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="login-card"
        >
          <h1 className="login-title">Bon retour parmi nous </h1>
          <p className="login-subtitle">
            Connectez-vous pour gérer votre boutique et suivre vos commandes.
          </p>

          {loginError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="login-error"
            >
              <AlertCircle size={18} />
              {loginError}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="login-form2">
            <div className="form-group2">
              <label className="form-label2">Email</label>
              <div className="input-wrapper2">
                <Mail size={18} className="input-icon2" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input2 ${errors.email ? 'error' : ''}`}
                  placeholder="Entrez votre email"
                />
              </div>
              {errors.email && <p className="error-text">{errors.email}</p>}
            </div>

            <div className="form-group2">
              <label className="form-label2">Mot de passe</label>
              <div className="input-wrapper2">
                <Lock size={18} className="input-icon2" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-input2 ${errors.password ? 'error' : ''}`}
                  placeholder="Entrez votre mot de passe"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="error-text">{errors.password}</p>}
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <span className="checkmark"></span>
                <span className="checkbox-text">Se souvenir de moi</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Mot de passe oublié ?
              </Link>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className="btn-submit2"
            >
              {isLoading ? (
                <div className="spinner"></div>
              ) : (
                <>
                  <LockKeyhole size={18} /> Se connecter
                </>
              )}
            </motion.button>

            <div className="login-divider">
              <span className="divider-line"></span>
              <span className="divider-text">ou continuer avec</span>
              <span className="divider-line"></span>
            </div>

            <button type="button" className="social-btn google">
              <svg className="social-icon" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuer avec Google
            </button>
          </form>
        </motion.div>
      </main>

      {/* FOOTER */}
     <Footer />
    </div>
  );
}
