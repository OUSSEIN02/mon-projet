import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { GoogleMap, MarkerF, PolylineF } from '@react-google-maps/api';
import { FedaCheckoutButton } from 'fedapay-reactjs';
import {
  ArrowLeft, Phone, MessageCircle, Check, CheckCircle,
  Bike, Package, Truck, PartyPopper, Star, MapPin, Clock,
  Route, DollarSign, AlertTriangle, CreditCard, Loader2, ShieldCheck, Home
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/apiClient';
import { useGoogleMaps } from '../../hooks/useGoogleMaps';
import '../css/OrderTrackingScreen.css';

const POLLING_INTERVAL = 3000;
const FEDAPAY_PUBLIC_KEY = import.meta.env.VITE_FEDAPAY_PUBLIC_KEY || 'pk_sandbox_XXXXXXXXXXXXX';

const COLORS = {
  orange: '#f97316', orangeDark: '#ea580c', orangeLight: '#fed7aa',
  black: '#111827', blackSoft: '#1f2937', gray: '#6b7280',
  grayLight: '#f3f4f6', white: '#ffffff',
  success: '#16a34a', successDark: '#15803d',
};

// ═══════════════════════════════════════════════════════════
// 🛠️ LOCALSTORAGE AVEC TIMESTAMP (expire après 5 minutes)
// ═══════════════════════════════════════════════════════════
const STORAGE_KEY_PREFIX = 'delivo_payment_';
const PENDING_MAX_AGE = 5 * 60 * 1000; // 5 minutes

const getStorageKey = (orderId) => `${STORAGE_KEY_PREFIX}${orderId}`;

const setPaymentPending = (orderId) => {
  try {
    localStorage.setItem(getStorageKey(orderId), JSON.stringify({
      status: 'pending',
      timestamp: Date.now(),
    }));
  } catch (e) {}
};

const clearPaymentPending = (orderId) => {
  try {
    localStorage.removeItem(getStorageKey(orderId));
  } catch (e) {}
};

const getPaymentPendingInfo = (orderId) => {
  try {
    const raw = localStorage.getItem(getStorageKey(orderId));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.timestamp > PENDING_MAX_AGE) {
      localStorage.removeItem(getStorageKey(orderId));
      return null;
    }
    return data;
  } catch (e) {
    return null;
  }
};

// ═══════════════════════════════════════════════════════════
// 🧹 NETTOYAGE AGRESSIF DU WIDGET FEDAPAY
// ═══════════════════════════════════════════════════════════
const cleanupFedaPayWidget = () => {
  try {
    if (window.FedaPay) {
      if (typeof window.FedaPay.close === 'function') {
        try { window.FedaPay.close(); } catch (e) {}
      }
      if (window.FedaPay.instances && typeof window.FedaPay.instances === 'object') {
        Object.values(window.FedaPay.instances).forEach(instance => {
          if (instance && typeof instance.close === 'function') {
            try { instance.close(); } catch (e) {}
          }
        });
      }
    }

    const fedaSelectors = [
      'iframe[src*="fedapay"]', 'iframe[src*="feda"]',
      '.fedapay-overlay', '.fedapay-container', '.fedapay-modal', '.fedapay-iframe',
      '.checkout-overlay', '[class*="fedapay"]', '[id*="fedapay"]',
      '[class*="FedaPay"]', '[id*="FedaPay"]',
    ];
    fedaSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        try { el.remove(); } catch (e) {}
      });
    });

    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.classList.remove('feda-open', 'fedapay-open', 'fedapay-body-hidden');
  } catch (err) {
    console.error('Erreur nettoyage FedaPay:', err);
  }
};

const PublicOrderTrackingScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoaded: isMapsLoaded } = useGoogleMaps();

  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [livreurPosition, setLivreurPosition] = useState(null);
  const [currentPhase, setCurrentPhase] = useState('accepted');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [remainingMinutes, setRemainingMinutes] = useState(25);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);

  const [paymentToken, setPaymentToken] = useState(null);
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
  const [isVerifyingAfterPayment, setIsVerifyingAfterPayment] = useState(false);

  // 🌟 NOUVEAUX ÉTATS POUR LA NOTATION
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const mapRef = useRef(null);
  const pollingTimerRef = useRef(null);
  const paymentCheckRef = useRef(null);
  const previousPaidStatusRef = useRef(null);

  const stepsRef = useRef([
    { title: 'Commande acceptée', subtitle: 'Le livreur a accepté votre course', icon: CheckCircle, time: '' },
    { title: 'En route vers le lieu de récupération', subtitle: 'Le livreur arrive bientôt', icon: Bike, time: '' },
    { title: 'Colis récupéré', subtitle: 'Votre colis est en sécurité', icon: Package, time: '' },
    { title: 'En route vers la destination', subtitle: 'Votre colis arrive chez le destinataire', icon: Truck, time: '' },
    { title: 'Livré', subtitle: "Merci d'avoir utilisé Delivo !", icon: PartyPopper, time: '' },
  ]);
  const [steps, setSteps] = useState(stepsRef.current);

  const checkIfPaid = useCallback((data) => {
    if (!data) return false;
    return data.is_paid === true || data.status === 'payee' || data.payment_status === 'paid';
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 🔄 VÉRIFICATION RAPIDE APRÈS PAIEMENT
  // ═══════════════════════════════════════════════════════════
  const startPostPaymentVerification = useCallback(() => {
    setIsVerifyingAfterPayment(true);
    setIsVerifyingPayment(true);
    setPaymentPending(id);

    let attempts = 0;
    const MAX_ATTEMPTS = 15;

    const verifyOnce = async () => {
      attempts++;
      try {
        const res = await apiClient.get(`/orders/${id}/payment-status`);
        const data = res.data?.data;
        const isPaid = data?.is_paid || data?.order_status === 'payee';

        if (isPaid) {
          setPaymentStatus('paid');
          setIsVerifyingAfterPayment(false);
          setIsVerifyingPayment(false);
          clearPaymentPending(id);
          cleanupFedaPayWidget();
          setShowPaymentSuccessModal(true);
          
          if (pollingTimerRef.current) {
            clearInterval(pollingTimerRef.current);
            pollingTimerRef.current = null;
          }
          if (paymentCheckRef.current) {
            clearInterval(paymentCheckRef.current);
            paymentCheckRef.current = null;
          }
          return true;
        }

        if (attempts >= MAX_ATTEMPTS) {
          setIsVerifyingAfterPayment(false);
          setIsVerifyingPayment(false);
          clearPaymentPending(id);
          toast('Vérification en cours. Rechargez la page dans quelques instants.', { icon: '⏳' });
          if (paymentCheckRef.current) {
            clearInterval(paymentCheckRef.current);
            paymentCheckRef.current = null;
          }
          return false;
        }
        return false;
      } catch (err) {
        console.error('Erreur vérification:', err);
        return false;
      }
    };

    verifyOnce().then((ok) => {
      if (ok) return;
      paymentCheckRef.current = setInterval(async () => {
        const ok = await verifyOnce();
        if (ok && paymentCheckRef.current) {
          clearInterval(paymentCheckRef.current);
          paymentCheckRef.current = null;
        }
      }, 1000);
    });
  }, [id]);

  // ═══════════════════════════════════════════════════════════
  // CHARGEMENT INITIAL
  // ═══════════════════════════════════════════════════════════
  const fetchInitialOrderData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/orders/public/${id}`);
      const responseData = response.data?.data || response.data;
      setOrderData(responseData);

      const isPaid = checkIfPaid(responseData);
      setPaymentStatus(isPaid ? 'paid' : 'unpaid');
      previousPaidStatusRef.current = isPaid;

      if (responseData?.status === 'completed' ||
          responseData?.phase === 'completed' ||
          responseData?.status === 'payee') {
        setIsCompleted(true);
      }

      const pendingInfo = getPaymentPendingInfo(id);

      if (isPaid) {
        clearPaymentPending(id);
      } else if (pendingInfo) {
        setTimeout(() => startPostPaymentVerification(), 500);
      }

      setError(null);
    } catch (err) {
      console.error('Erreur chargement:', err);
      setError('Impossible de charger les détails de cette commande.');
    } finally {
      setLoading(false);
    }
  }, [id, checkIfPaid, startPostPaymentVerification]);

  useEffect(() => {
    fetchInitialOrderData();
  }, [fetchInitialOrderData]);

  // ═══════════════════════════════════════════════════════════
  // POLLING TEMPS RÉEL
  // ═══════════════════════════════════════════════════════════
  const fetchTrackingData = useCallback(async () => {
    try {
      if (isVerifyingAfterPayment) return;

      const response = await apiClient.get(`/orders/public/${id}`);
      const responseData = response.data?.data || response.data;

      const lat = parseFloat(responseData?.latitude);
      const lng = parseFloat(responseData?.longitude);

      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        setLivreurPosition({ lat, lng });
        if (mapRef.current) mapRef.current.panTo({ lat, lng });
      }

      const phase = responseData?.phase || 'accepted';
      setCurrentPhase(phase);
      updateStepFromPhase(phase);

      if (responseData?.remainingMinutes !== undefined) {
        setRemainingMinutes(parseInt(responseData.remainingMinutes));
      }

      const newIsPaid = checkIfPaid(responseData);

      if (newIsPaid && previousPaidStatusRef.current === false) {
        setPaymentStatus('paid');
        cleanupFedaPayWidget();
        setShowPaymentSuccessModal(true);
        clearPaymentPending(id);
        setIsVerifyingAfterPayment(false);
        setIsVerifyingPayment(false);

        if (pollingTimerRef.current) {
          clearInterval(pollingTimerRef.current);
          pollingTimerRef.current = null;
        }
      }

      previousPaidStatusRef.current = newIsPaid;
      setPaymentStatus(newIsPaid ? 'paid' : 'unpaid');

      if (phase === 'completed' ||
          responseData?.status === 'completed' ||
          responseData?.status === 'payee') {
        onDeliveryCompleted();
      }
    } catch (error) {
      console.error('Erreur polling:', error);
    }
  }, [id, checkIfPaid, isVerifyingAfterPayment]);

  const updateStepFromPhase = (phase) => {
    let newIndex = 0;
    switch (phase) {
      case 'start': case 'accepted': case 'pending': newIndex = 0; break;
      case 'toPickup': case 'assigned': newIndex = 1; break;
      case 'picked': case 'picked_up': newIndex = 2; break;
      case 'toDropoff': case 'in_transit': newIndex = 3; break;
      case 'completed': case 'delivered': newIndex = 4; break;
      default: newIndex = 0;
    }

    if (newIndex > currentStepIndex) {
      setCurrentStepIndex(newIndex);
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setSteps((prev) => {
        const newSteps = [...prev];
        newSteps[newIndex] = { ...newSteps[newIndex], time: timeStr };
        return newSteps;
      });
      setRemainingMinutes(Math.max(0, 25 - newIndex * 5));
    }
  };

  const onDeliveryCompleted = () => {
    if (!isCompleted) {
      setIsCompleted(true);
      if (paymentStatus !== 'paid' && !isVerifyingAfterPayment) {
        setTimeout(() => setShowCompletionDialog(true), 1000);
      }
    }
  };

  useEffect(() => {
    if (!orderData) return;
    if (paymentStatus === 'paid') return;
    if (isVerifyingAfterPayment) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setSteps((prev) => {
      const newSteps = [...prev];
      newSteps[0] = { ...newSteps[0], time: timeStr };
      return newSteps;
    });

    fetchTrackingData();
    pollingTimerRef.current = setInterval(() => {
      if (paymentStatus !== 'paid' && !isCompleted && !isVerifyingAfterPayment) {
        fetchTrackingData();
      }
    }, POLLING_INTERVAL);

    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [orderData, fetchTrackingData, isCompleted, paymentStatus, isVerifyingAfterPayment]);

  // ═══════════════════════════════════════════════════════════
  // 💳 PAIEMENT FEDAPAY
  // ═══════════════════════════════════════════════════════════
  const preparePayment = async () => {
    if (paymentStatus === 'paid' || isVerifyingAfterPayment) return;
    if (isPreparingPayment || paymentToken) return;

    setIsPreparingPayment(true);
    const loadingToast = toast.loading('Préparation du paiement...');

    try {
      const response = await apiClient.post(`/orders/${id}/init-payment`);
      const data = response.data?.data || response.data;

      if (!data?.token) throw new Error('Token de paiement non reçu');

      toast.success('Paiement prêt !', { id: loadingToast });
      setPaymentToken(data.token);
      setIsPreparingPayment(false);
    } catch (error) {
      console.error('Erreur préparation:', error);
      toast.error(error.message || 'Impossible de préparer le paiement', { id: loadingToast });
      setIsPreparingPayment(false);
    }
  };

  const getCheckoutButtonOptions = () => {
    const montant = Math.round(parseFloat(orderData?.total_price || orderData?.total_amount || 0));
  
    return {
      public_key: FEDAPAY_PUBLIC_KEY,
      transaction_token: paymentToken,
      transaction: {
        amount: montant,
        description: `Livraison Delivo #${orderData?.id}`
      },
      currency: { iso: 'XOF' },
      button: {
        class: 'fedapay-pay-btn',
        text: `💳 Payer ${montant.toFixed(0)} FCFA`,
      },
      onComplete(resp) {
        const FedaPay = window['FedaPay'];
  
        if (resp.reason === FedaPay.DIALOG_DISMISSED) {
          toast('Vous avez fermé la fenêtre de paiement', { icon: '⚠️' });
          setPaymentToken(null);
          setTimeout(() => cleanupFedaPayWidget(), 300);
          return;
        }
  
        toast.success('Transaction terminée ! Vérification en cours...', { id: 'payment-verify' });
        setPaymentToken(null);
        
        setTimeout(() => {
          cleanupFedaPayWidget();
          startPostPaymentVerification();
        }, 300);
      },
    };
  };

  useEffect(() => {
    return () => {
      if (paymentCheckRef.current) clearInterval(paymentCheckRef.current);
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      cleanupFedaPayWidget();
    };
  }, []);

  const handleCallLivreur = () => {
    if (orderData?.livreur?.phone) {
      window.location.href = `tel:${orderData.livreur.phone}`;
    }
  };

  const handleMessageLivreur = () => {
    toast('Messagerie bientôt disponible', { icon: '💬' });
  };

  // 🌟 MODIFICATION : Ouvrir la modale de notation après le succès
  const handleCloseSuccessModal = () => {
    setShowPaymentSuccessModal(false);
    if (orderData?.livreur) {
      setShowRatingModal(true);
    }
  };

  // 🌟 NOUVELLE FONCTION : Soumettre la note
  const submitRating = async () => {
    if (rating === 0) {
      toast.error('Veuillez sélectionner au moins une étoile.');
      return;
    }
    
    setIsSubmittingRating(true);
    try {
      // ⚠️ Adaptez cet endpoint selon votre backend (ex: POST /orders/{id}/rate)
      await apiClient.post(`/orders/${id}/rate`, {
        rating: rating,
        comment: ratingComment.trim(),
        livreur_id: orderData.livreur?.id
      });
      
      toast.success('Merci pour votre évaluation ! 🌟');
      setShowRatingModal(false);
    } catch (error) {
      console.error('Erreur notation:', error);
      // Si l'erreur est "déjà noté", on ferme quand même la modale
      if (error.response?.status === 409 || error.response?.data?.message?.includes('déjà')) {
        toast('Vous avez déjà évalué ce livreur.');
        setShowRatingModal(false);
      } else {
        toast.error("Impossible d'envoyer la note. Veuillez réessayer.");
      }
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleFinish = () => {
    setShowCompletionDialog(false);
    window.close();
  };

  const mapCenter = React.useMemo(() => {
    if (orderData?.pickup_lat && orderData?.dropoff_lat) {
      return {
        lat: (parseFloat(orderData.pickup_lat) + parseFloat(orderData.dropoff_lat)) / 2,
        lng: (parseFloat(orderData.pickup_lng) + parseFloat(orderData.dropoff_lng)) / 2,
      };
    }
    return { lat: 0.4162, lng: 9.4673 };
  }, [orderData]);

  if (loading) {
    return (
      <div className="ot-page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="ot-spinner" style={{ margin: '0 auto 1rem' }} />
            <p>Chargement du suivi...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="ot-page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '2rem' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '400px' }}
          >
            <AlertTriangle size={48} style={{ color: COLORS.orange, margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: COLORS.black }}>Commande introuvable</h2>
            <p style={{ color: COLORS.gray, marginBottom: '1.5rem' }}>{error || "Informations indisponibles."}</p>
            <button onClick={() => window.history.back()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', background: COLORS.black, color: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>
              <ArrowLeft size={18} /> Retour
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (isVerifyingAfterPayment && paymentStatus !== 'paid') {
    return (
      <div className="ot-page" style={{ background: COLORS.grayLight, minHeight: '100vh' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1rem', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ background: 'white', borderRadius: '1.5rem', padding: '3rem 2rem', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', width: '100%' }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              style={{ width: '80px', height: '80px', borderRadius: '50%', background: `linear-gradient(135deg, ${COLORS.orange}20, ${COLORS.orange}10)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: `3px solid ${COLORS.orange}`, borderTopColor: 'transparent' }}
            />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: COLORS.black, marginBottom: '0.75rem' }}>Vérification du paiement...</h1>
            <p style={{ color: COLORS.gray, fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>Nous confirmons votre paiement auprès de FedaPay.<br />Veuillez patienter quelques instants.</p>
            <div style={{ background: COLORS.grayLight, borderRadius: '0.75rem', padding: '1rem', fontSize: '0.85rem', color: COLORS.gray, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={16} />
              <span>Ne fermez pas cette fenêtre</span>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const isFullyCompleted = paymentStatus === 'paid' && (isCompleted || orderData?.status === 'payee');

  if (isFullyCompleted && !showPaymentSuccessModal && !showRatingModal) {
    return (
      <div className="ot-page" style={{ background: COLORS.grayLight, minHeight: '100vh' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1rem' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ background: 'white', borderRadius: '1.5rem', padding: '2.5rem 1.5rem', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              style={{ width: '80px', height: '80px', borderRadius: '50%', background: `linear-gradient(135deg, ${COLORS.orange}, ${COLORS.orangeDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: `0 10px 30px ${COLORS.orange}40` }}
            >
              <CheckCircle size={44} color="white" />
            </motion.div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: COLORS.black, marginBottom: '0.5rem' }}>Commande terminée !</h1>
            <p style={{ color: COLORS.gray, fontSize: '1rem', marginBottom: '2rem' }}>Votre livraison #{orderData.id} a été effectuée et payée avec succès.</p>

            <div style={{ background: COLORS.grayLight, borderRadius: '1rem', padding: '1.25rem', marginBottom: '2rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: COLORS.gray, fontSize: '0.9rem' }}>N° Commande</span>
                <span style={{ fontWeight: 'bold', color: COLORS.black }}>#{orderData.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: COLORS.gray, fontSize: '0.9rem' }}>Montant payé</span>
                <span style={{ fontWeight: 'bold', color: COLORS.black }}>{parseFloat(orderData.total_price || 0).toFixed(0)} FCFA</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.gray, fontSize: '0.9rem' }}>Statut</span>
                <span style={{ fontWeight: 'bold', color: COLORS.success, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Check size={14} /> Payé & Livré
                </span>
              </div>
            </div>

            <p style={{ color: COLORS.gray, fontSize: '0.9rem', marginBottom: '1.5rem' }}>Merci d'avoir utilisé <strong style={{ color: COLORS.orange }}>Delivo</strong> ! 🧡</p>

            <button
              onClick={() => window.close()}
              style={{ width: '100%', padding: '1rem', borderRadius: '0.75rem', background: COLORS.black, color: 'white', border: 'none', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Home size={18} /> Fermer
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="ot-page">
      <header className="ot-header">
        <button onClick={isCompleted ? handleFinish : () => window.history.back()} className="ot-back-btn">
          <ArrowLeft size={18} />
        </button>
        <div className="ot-header-text">
          <h2 className="ot-title">Suivi de livraison</h2>
          <p className="ot-subtitle">Commande #{orderData.id}</p>
        </div>
        <div className={`ot-status-badge ${isCompleted ? 'completed' : 'ongoing'}`}>
          {isCompleted ? <><CheckCircle size={14} /><span>Livré</span></> : <><span className="ot-status-dot" /><span>En cours</span></>}
        </div>
      </header>

      <div className="ot-map-container">
        {!isMapsLoaded ? (
          <div className="ot-map-loading"><div className="ot-spinner" /><p>Chargement...</p></div>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={mapCenter}
            zoom={13}
            onLoad={(map) => { mapRef.current = map; }}
            options={{ disableDefaultUI: false, zoomControl: false, streetViewControl: false, mapTypeControl: false, fullscreenControl: false, clickableIcons: false }}
          >
            {orderData.pickup_lat && orderData.pickup_lng && (
              <MarkerF position={{ lat: parseFloat(orderData.pickup_lat), lng: parseFloat(orderData.pickup_lng) }} icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png', scaledSize: new window.google.maps.Size(40, 40) }} />
            )}
            {orderData.dropoff_lat && orderData.dropoff_lng && (
              <MarkerF position={{ lat: parseFloat(orderData.dropoff_lat), lng: parseFloat(orderData.dropoff_lng) }} icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png', scaledSize: new window.google.maps.Size(40, 40) }} />
            )}
            {orderData.pickup_lat && orderData.dropoff_lat && (
              <PolylineF path={[{ lat: parseFloat(orderData.pickup_lat), lng: parseFloat(orderData.pickup_lng) }, { lat: parseFloat(orderData.dropoff_lat), lng: parseFloat(orderData.dropoff_lng) }]} options={{ strokeColor: COLORS.orange, strokeOpacity: 0.7, strokeWeight: 4, geodesic: true }} />
            )}
            {livreurPosition && (
              <MarkerF position={livreurPosition} icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png', scaledSize: new window.google.maps.Size(40, 40) }} />
            )}
          </GoogleMap>
        )}
      </div>

      <main className="ot-content">
        {orderData.livreur && paymentStatus !== 'paid' && !isVerifyingAfterPayment && (
          <div className="ot-livreur-card">
            <div className="ot-livreur-avatar-wrap">
              <img src={orderData.livreur.photo || 'https://i.pravatar.cc/150?img=10'} alt={orderData.livreur.name} className="ot-livreur-avatar" />
              <div className="ot-online-dot"><Check size={10} color="white" /></div>
            </div>
            <div className="ot-livreur-info">
              <h4 className="ot-livreur-name">{orderData.livreur.name || 'Livreur'}</h4>
              <div className="ot-livreur-meta">
                <div className="ot-vehicle-badge">
                  {orderData.livreur.vehicule?.includes('Moto') ? <Truck size={12} /> : <Bike size={12} />}
                  <span>{orderData.livreur.vehicule || 'Moto'}</span>
                </div>
                <div className="ot-rating"><Star size={14} className="ot-star-icon" /><span>{orderData.livreur.rating || '4.8'}</span></div>
              </div>
            </div>
            <div className="ot-livreur-actions">
              <button onClick={handleCallLivreur} className="ot-action-btn ot-action-green"><Phone size={18} /></button>
              <button onClick={handleMessageLivreur} className="ot-action-btn ot-action-orange"><MessageCircle size={18} /></button>
            </div>
          </div>
        )}

        {!isCompleted && orderData.distance && orderData.total_price && paymentStatus !== 'paid' && !isVerifyingAfterPayment && (
          <div className="ot-eta-card">
            <div className="ot-eta-item"><Clock size={20} className="ot-eta-icon" /><span className="ot-eta-value">{remainingMinutes} min</span><span className="ot-eta-label">Temps estimé</span></div>
            <div className="ot-eta-divider" />
            <div className="ot-eta-item"><Route size={20} className="ot-eta-icon" /><span className="ot-eta-value">{parseFloat(orderData.distance).toFixed(1)} km</span><span className="ot-eta-label">Distance</span></div>
            <div className="ot-eta-divider" />
            <div className="ot-eta-item"><DollarSign size={20} className="ot-eta-icon" /><span className="ot-eta-value">{parseFloat(orderData.total_price).toFixed(0)} F</span><span className="ot-eta-label">Total</span></div>
          </div>
        )}

        <div className="ot-timeline-card">
          <h3 className="ot-card-title">Progression</h3>
          <div className="ot-timeline">
            {steps.map((step, index) => {
              const isCompletedStep = index < currentStepIndex;
              const isCurrentStep = index === currentStepIndex;
              const isLast = index === steps.length - 1;
              const Icon = step.icon;
              return (
                <div key={index} className="ot-timeline-step">
                  <div className="ot-timeline-indicator">
                    <div className={`ot-timeline-circle ${isCompletedStep ? 'completed' : isCurrentStep ? 'current' : 'pending'}`}>
                      {isCompletedStep ? <Check size={16} color="white" /> : isCurrentStep ? <div className="ot-timeline-dot" /> : <Icon size={16} color="white" />}
                    </div>
                    {!isLast && <div className={`ot-timeline-line ${isCompletedStep ? 'completed' : ''}`} />}
                  </div>
                  <div className="ot-timeline-content">
                    <div className="ot-timeline-header">
                      <h4 className={`ot-timeline-title ${isCurrentStep || isCompletedStep ? 'active' : ''}`}>{step.title}</h4>
                      {step.time && <span className="ot-timeline-time">{step.time}</span>}
                    </div>
                    <p className={`ot-timeline-subtitle ${isCurrentStep ? 'current' : ''}`}>{step.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="ot-summary-card">
          <h3 className="ot-card-title">Détails de la livraison</h3>
          <div className="ot-detail-row"><MapPin size={18} className="ot-detail-icon" /><div className="ot-detail-content"><span className="ot-detail-label">Départ</span><span className="ot-detail-value">{orderData.pickup_address}</span></div></div>
          <div className="ot-detail-row"><MapPin size={18} className="ot-detail-icon" /><div className="ot-detail-content"><span className="ot-detail-label">Arrivée</span><span className="ot-detail-value">{orderData.dropoff_address}</span></div></div>
        </div>

        {isCompleted && paymentStatus !== 'paid' && !isVerifyingAfterPayment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ background: `linear-gradient(135deg, ${COLORS.orange} 0%, ${COLORS.orangeDark} 100%)`, borderRadius: '1rem', padding: '1.5rem', color: 'white', boxShadow: `0 10px 25px ${COLORS.orange}40` }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>Paiement requis</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>Finalisez votre commande</p>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ opacity: 0.8 }}>Montant à payer</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{parseFloat(orderData.total_price).toFixed(0)} FCFA</span>
              </div>
            </div>

            {!paymentToken ? (
              <button onClick={preparePayment} disabled={isPreparingPayment} style={{ width: '100%', padding: '1rem', borderRadius: '0.75rem', background: 'white', color: COLORS.orange, border: 'none', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: isPreparingPayment ? 0.7 : 1 }}>
                {isPreparingPayment ? <><Loader2 size={18} className="animate-spin" /> Préparation...</> : <><CreditCard size={18} /> Préparer le paiement</>}
              </button>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <FedaCheckoutButton options={getCheckoutButtonOptions()} />
                <button onClick={() => { setPaymentToken(null); setTimeout(() => cleanupFedaPayWidget(), 300); }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.5rem' }}>
                  Annuler et recommencer
                </button>
              </div>
            )}
          </motion.div>
        )}
      </main>

      {!isCompleted && orderData.livreur?.phone && paymentStatus !== 'paid' && !isVerifyingAfterPayment && (
        <div className="ot-bottom-actions">
          <button onClick={handleCallLivreur} className="ot-btn ot-btn-primary"><Phone size={18} /><span>Contacter le livreur</span></button>
        </div>
      )}

      {/* MODALE DE FIN DE LIVRAISON (NON PAYÉE) */}
      <AnimatePresence>
        {showCompletionDialog && paymentStatus !== 'paid' && !isVerifyingAfterPayment && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="ot-dialog-overlay">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="ot-dialog">
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: `linear-gradient(135deg, ${COLORS.orange}, ${COLORS.orangeDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <CheckCircle size={36} color="white" />
              </div>
              <h3 style={{ textAlign: 'center', marginBottom: '0.5rem', color: COLORS.black }}>Livraison terminée !</h3>
              <p style={{ textAlign: 'center', color: COLORS.gray, marginBottom: '1rem' }}>Votre colis a été livré avec succès.</p>
              <p style={{ textAlign: 'center', fontWeight: 'bold', color: COLORS.orange, marginBottom: '1.5rem' }}>
                Montant à payer : {parseFloat(orderData.total_price).toFixed(0)} FCFA
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setShowCompletionDialog(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', background: COLORS.grayLight, color: COLORS.black, border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                  Payer plus tard
                </button>
                <button onClick={() => { setShowCompletionDialog(false); preparePayment(); }} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', background: COLORS.orange, color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <CreditCard size={18} /> Payer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALE DE SUCCÈS DE PAIEMENT */}
      <AnimatePresence>
        {showPaymentSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem', backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              style={{ background: 'white', borderRadius: '1.5rem', padding: '2.5rem 2rem', maxWidth: '420px', width: '100%', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                style={{ width: '90px', height: '90px', borderRadius: '50%', background: `linear-gradient(135deg, ${COLORS.success}, ${COLORS.successDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: `0 15px 35px ${COLORS.success}50` }}
              >
                <CheckCircle size={50} color="white" />
              </motion.div>

              <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: COLORS.black, marginBottom: '0.5rem' }}>Paiement réussi ! 🎉</h2>
              <p style={{ color: COLORS.gray, marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Merci pour votre paiement. Votre commande <strong>#{orderData.id}</strong> est maintenant finalisée.
              </p>

              <div style={{ background: COLORS.grayLight, borderRadius: '1rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: COLORS.gray }}>Montant payé</span>
                  <span style={{ fontWeight: 'bold', color: COLORS.success }}>{parseFloat(orderData.total_price || 0).toFixed(0)} FCFA</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: COLORS.gray }}>Méthode</span>
                  <span style={{ fontWeight: 'bold', color: COLORS.black }}>FedaPay</span>
                </div>
              </div>

              <button
                onClick={handleCloseSuccessModal}
                style={{ width: '100%', padding: '1rem', borderRadius: '0.75rem', background: COLORS.black, color: 'white', border: 'none', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Check size={18} /> Continuer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🌟 NOUVELLE MODALE : NOTATION DU LIVREUR */}
      <AnimatePresence>
        {showRatingModal && orderData?.livreur && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowRatingModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              style={{ background: 'white', borderRadius: '1.5rem', padding: '2rem', maxWidth: '450px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 1rem', border: `3px solid ${COLORS.orange}` }}>
                  <img src={orderData.livreur.photo || 'https://i.pravatar.cc/150?img=10'} alt="Livreur" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: COLORS.black, marginBottom: '0.25rem' }}>
                  Comment s'est passé la livraison ?
                </h2>
                <p style={{ color: COLORS.gray, fontSize: '0.9rem' }}>
                  Avec <strong>{orderData.livreur.name}</strong>
                </p>
              </div>

              {/* Étoiles de notation */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'transform 0.2s' }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Star 
                      size={36} 
                      fill={star <= (hoverRating || rating) ? COLORS.orange : 'none'} 
                      color={star <= (hoverRating || rating) ? COLORS.orange : '#cbd5e1'} 
                      strokeWidth={2}
                    />
                  </button>
                ))}
              </div>

              {/* Commentaire optionnel */}
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Laissez un commentaire (optionnel)..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #e5e7eb',
                  fontSize: '0.9rem',
                  resize: 'none',
                  marginBottom: '1.5rem',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.target.style.borderColor = COLORS.orange}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />

              {/* Boutons d'action */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setShowRatingModal(false)}
                  disabled={isSubmittingRating}
                  style={{
                    flex: 1,
                    padding: '0.85rem',
                    borderRadius: '0.75rem',
                    background: COLORS.grayLight,
                    color: COLORS.black,
                    border: 'none',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Passer
                </button>
                <button
                  onClick={submitRating}
                  disabled={isSubmittingRating || rating === 0}
                  style={{
                    flex: 2,
                    padding: '0.85rem',
                    borderRadius: '0.75rem',
                    background: rating === 0 ? '#cbd5e1' : COLORS.orange,
                    color: 'white',
                    border: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 'bold',
                    cursor: rating === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isSubmittingRating ? (
                    <><Loader2 size={18} className="animate-spin" /> Envoi...</>
                  ) : (
                    <><Star size={18} fill="white" /> Envoyer la note</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicOrderTrackingScreen;