import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, LogOut, RefreshCw, CheckCircle } from 'lucide-react';
import apiClient from '../../services/apiClient';
import Header from '../header/header';
import Footer from '../footer/footer';

export default function AccountPending() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('en_attente');
  const [isChecking, setIsChecking] = useState(false);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 10));
    }, 1000);

    const checkInterval = setInterval(() => {
      checkStatus();
    }, 10000);

    checkStatus(); // Premier appel immédiat

    return () => {
      clearInterval(timer);
      clearInterval(checkInterval);
    };
  }, []);

  const checkStatus = async () => {
    if (isChecking) return;
    setIsChecking(true);
    try {
      const response = await apiClient.get('/me/status');
      const newStatus = response.data?.status;
      setStatus(newStatus);

      if (newStatus === 'valide') {
        navigate('/dashboard', { replace: true });
      } else if (newStatus === 'suspendu' || newStatus === 'rejeté') {
        handleLogout();
      }
    } catch (error) {
      console.error("Erreur de vérification:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  const getTitle = () => {
    if (status === 'suspendu') return 'Compte suspendu';
    if (status === 'rejeté') return 'Compte refusé';
    return 'Compte en attente de validation';
  };

  const getMessage = () => {
    if (status === 'suspendu') return 'Votre compte a été suspendu par l\'administrateur. Veuillez contacter le support.';
    if (status === 'rejeté') return 'Votre compte a été refusé. Veuillez corriger vos documents et contacter le support.';
    return 'Votre compte a été créé avec succès mais doit être validé par un administrateur avant de pouvoir accéder à toutes les fonctionnalités.';
  };

  return (
    <div className="login-page">
      <Header />
      <main className="login-main">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="login-card"
          style={{ maxWidth: '500px', textAlign: 'center', padding: '40px' }}
        >
          <div style={{ marginBottom: '24px' }}>
            {status === 'valide' ? (
              <CheckCircle size={64} color="#16a34a" />
            ) : (
              <AlertCircle size={64} color={status === 'rejeté' ? '#ef4444' : '#f97316'} />
            )}
          </div>

          <h1 className="login-title">{getTitle()}</h1>
          <p className="login-subtitle" style={{ marginTop: '16px', lineHeight: '1.6' }}>
            {getMessage()}
          </p>

          {status === 'en_attente' && (
            <div style={{ marginTop: '32px', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#64748b', fontSize: '14px' }}>
                {isChecking ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <CheckCircle size={16} color={countdown < 4 ? '#f97316' : '#94a3b8'} />
                )}
                <span>{isChecking ? 'Vérification...' : `Prochaine vérification dans ${countdown}s`}</span>
              </div>
            </div>
          )}

          <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {status === 'en_attente' && (
              <button 
                onClick={checkStatus} 
                disabled={isChecking}
                className="btn-submit2"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <RefreshCw size={18} className={isChecking ? 'animate-spin' : ''} />
                Vérifier maintenant
              </button>
            )}
            
            <button 
              onClick={handleLogout}
              className="btn-submit2"
              style={{ background: 'transparent', border: '1px solid #e2e8f0', color: '#64748b' }}
            >
              <LogOut size={18} />
              Se déconnecter
            </button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}