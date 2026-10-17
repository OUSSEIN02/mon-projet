import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  MapPin, Route, DollarSign, ArrowLeft, CheckCircle, 
  AlertCircle, RefreshCw, Receipt, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';
import '../../css/OrderSearchingScreen.css';

const POLLING_INTERVAL = 2000;    // 2 secondes
const RADIUS_TIMEOUT = 20000;     // 20s pour tests
const RADII = [2.0, 3.0, 5.0];

const OrderSearchingScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const data = location.state;

  // ═══════════════════════════════════════════════════════════
  // ÉTATS (pour l'affichage)
  // ═══════════════════════════════════════════════════════════
  const [currentRadius, setCurrentRadius] = useState(RADII[0]);
  const [searchStep, setSearchStep] = useState(0);
  const [isSearching, setIsSearching] = useState(true);
  const [livreurFound, setLivreurFound] = useState(false);
  const [selectedLivreur, setSelectedLivreur] = useState(null);
  const [showNoLivreurDialog, setShowNoLivreurDialog] = useState(false);
  const [isReportingFailure, setIsReportingFailure] = useState(false);
  const [failureReported, setFailureReported] = useState(false);
  const [totalAttempts, setTotalAttempts] = useState(0);

  // ═══════════════════════════════════════════════════════════
  // 🔑 REFS (pour les closures asynchrones - TOUJOURS à jour)
  // ═══════════════════════════════════════════════════════════
  const pollingTimerRef = useRef(null);
  const radiusTimerRef = useRef(null);
  const isCheckingRef = useRef(false);
  const livreurAcceptedRef = useRef(false);
  const attemptsRef = useRef(0);
  const searchStepRef = useRef(0);
  const currentRadiusRef = useRef(RADII[0]);

  // Synchroniser les refs avec les states
  useEffect(() => {
    searchStepRef.current = searchStep;
  }, [searchStep]);

  useEffect(() => {
    currentRadiusRef.current = currentRadius;
  }, [currentRadius]);

  // Validation initiale
  useEffect(() => {
    if (!data || !data.orderId) {
      toast.error('Données de commande manquantes');
      navigate('/dashboard/commandes');
    }
  }, [data, navigate]);

  // ═══════════════════════════════════════════════════════════
  // POLLING
  // ═══════════════════════════════════════════════════════════
  const checkForLivreur = async () => {
    if (isCheckingRef.current || livreurAcceptedRef.current) return;
    isCheckingRef.current = true;

    attemptsRef.current += 1;
    setTotalAttempts(attemptsRef.current);

    try {
      const response = await apiClient.get(
        `/livreur/nearby?order_id=${data.orderId}` +
        `&lat=${data.pickupLat}&lng=${data.pickupLng}` +
        `&radius=${currentRadiusRef.current}`
      );

      const responseData = response.data;

      if (responseData?.success === true) {
        if (responseData.assigned === true && Array.isArray(responseData.data)) {
          const livreurs = responseData.data;
          if (livreurs.length > 0) {
            onLivreurAccepted(livreurs[0]);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Erreur API nearby:', error);
    } finally {
      isCheckingRef.current = false;
    }
  };

  const onLivreurAccepted = (livreur) => {
    if (livreurAcceptedRef.current) return;
    livreurAcceptedRef.current = true;
    stopAllTimers();
    
    setLivreurFound(true);
    setSelectedLivreur(livreur);
    setIsSearching(false);
    
    setTimeout(() => navigateToTracking(livreur), 2000);
  };

  const navigateToTracking = (livreur) => {
    navigate('/dashboard/order-tracking', {
      state: {
        livreur,
        pickupLat: data.pickupLat,
        pickupLng: data.pickupLng,
        dropoffLat: data.dropoffLat,
        dropoffLng: data.dropoffLng,
        pickupAddress: data.pickupAddress,
        dropoffAddress: data.dropoffAddress,
        distance: data.distance,
        totalAmount: data.totalAmount, // 🟢 MODIFIÉ : totalPrice -> totalAmount
        orderId: data.orderId.toString(),
      },
    });
  };

  const startRadiusSearch = () => {
    if (livreurAcceptedRef.current) return;
    
    checkForLivreur();
    
    pollingTimerRef.current = setInterval(() => {
      if (livreurAcceptedRef.current) {
        stopAllTimers();
        return;
      }
      checkForLivreur();
    }, POLLING_INTERVAL);

    radiusTimerRef.current = setTimeout(() => {
      if (!livreurAcceptedRef.current) {
        moveToNextRadius();
      }
    }, RADIUS_TIMEOUT);
  };

  const moveToNextRadius = async () => {
    if (livreurAcceptedRef.current) return;
    stopAllTimers();

    const currentStep = searchStepRef.current;

    console.log(`🔄 moveToNextRadius - Step actuel: ${currentStep}, Rayon: ${currentRadiusRef.current}km`);

    if (currentStep === 0) {
      console.log('➡️ Passage au rayon 3km');
      setSearchStep(1);
      setCurrentRadius(RADII[1]);
      startRadiusSearch();
    } else if (currentStep === 1) {
      console.log('➡️ Passage au rayon 5km');
      setSearchStep(2);
      setCurrentRadius(RADII[2]);
      startRadiusSearch();
    } else {
      console.log('🚨 Échec final - aucun livreur trouvé');
      setIsSearching(false);
      await reportFailedSearch();
      setShowNoLivreurDialog(true);
    }
  };

  const reportFailedSearch = async () => {
    if (isReportingFailure || failureReported) return;
    setIsReportingFailure(true);

    try {
      const response = await apiClient.post(
        `/orders/${data.orderId}/search-failed`,
        {
          reason: 'NO_DRIVER_FOUND',
          max_radius_reached: RADII[RADII.length - 1],
          total_attempts: attemptsRef.current,
          pickup_lat: data.pickupLat,
          pickup_lng: data.pickupLng,
          dropoff_lat: data.dropoffLat,
          dropoff_lng: data.dropoffLng,
          total_distance: data.distance,
          total_amount: data.totalAmount, // 🟢 MODIFIÉ : total_price -> total_amount
        }
      );

      if (response.data?.success) {
        setFailureReported(true);
        console.log('✅ Échec enregistré en BDD');
      }
    } catch (error) {
      console.error('❌ Erreur enregistrement échec:', error);
    } finally {
      setIsReportingFailure(false);
    }
  };

  const stopAllTimers = () => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    if (radiusTimerRef.current) {
      clearTimeout(radiusTimerRef.current);
      radiusTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (data?.orderId) {
      console.log('🚀 Démarrage recherche - Rayon initial: 2km');
      startRadiusSearch();
    }
    return () => stopAllTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.orderId]);

  const handleRetry = () => {
    setShowNoLivreurDialog(false);
    setSearchStep(0);
    searchStepRef.current = 0;
    setCurrentRadius(RADII[0]);
    currentRadiusRef.current = RADII[0];
    setIsSearching(true);
    setLivreurFound(false);
    setSelectedLivreur(null);
    setFailureReported(false);
    attemptsRef.current = 0;
    setTotalAttempts(0);
    livreurAcceptedRef.current = false;
    isCheckingRef.current = false;
    startRadiusSearch();
  };

  const handleGoBack = () => {
    stopAllTimers();
    navigate('/dashboard/commandes');
  };

  if (!data) return null;

  return (
    <div className="os-page">
      <header className="os-header">
        <button onClick={handleGoBack} className="os-back-btn" aria-label="Retour">
          <ArrowLeft size={18} />
        </button>
        <div className="os-header-text">
          <h2 className="os-title">Recherche de livreur</h2>
        </div>
      </header>

      <main className="os-main">
        <div className="os-radar-area">
          <div className="os-radar-container">
            {RADII.map((radius, index) => {
              const isActive = index <= searchStep;
              const size = ((index + 1) / 3) * 100;
              return (
                <div
                  key={radius}
                  className={`os-radar-circle ${isActive ? 'active' : ''}`}
                  style={{ width: `${size}%`, height: `${size}%` }}
                >
                  {isActive && index === searchStep && isSearching && (
                    <div className="os-radius-label">{radius} km</div>
                  )}
                </div>
              );
            })}
            {isSearching && <div className="os-radar-sweep" />}
            <div className="os-radar-center">
              <MapPin size={14} color="white" />
            </div>
            <AnimatePresence>
              {livreurFound && selectedLivreur && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="os-livreur-badge"
                >
                  <img src={selectedLivreur.photo} alt={selectedLivreur.name} className="os-livreur-avatar" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className={`os-status-card ${livreurFound ? 'success' : 'searching'}`}>
          <div className="os-status-row">
            {isSearching ? (
              <div className="os-spinner" />
            ) : livreurFound ? (
              <div className="os-check-circle"><CheckCircle size={16} /></div>
            ) : null}
            <span className="os-status-text">
              {livreurFound ? 'Livreur trouvé !' : 'Recherche en cours...'}
            </span>
          </div>
          <p className="os-status-sub">
            {livreurFound
              ? 'Connexion avec le livreur...'
              : `Rayon de recherche : ${(currentRadius || 0).toFixed(0)} km`}
          </p>
        </div>

        <div className="os-details-card">
          <div className="os-card-header">
            <Receipt size={18} className="os-icon-orange" />
            <h3>Détails de la course</h3>
          </div>
          <div className="os-info-row">
            <MapPin size={18} className="os-info-icon" />
            <div className="os-info-content">
              <span className="os-info-label">Départ</span>
              <span className="os-info-value">{data.pickupAddress}</span>
            </div>
          </div>
          <div className="os-info-row">
            <MapPin size={18} className="os-info-icon" />
            <div className="os-info-content">
              <span className="os-info-label">Arrivée</span>
              <span className="os-info-value">{data.dropoffAddress}</span>
            </div>
          </div>
          <div className="os-divider" />
          <div className="os-chips">
            <div className="os-chip">
              <Route size={16} className="os-chip-icon" />
              <span>{(data.distance || 0).toFixed(1)} km</span>
            </div>
            <div className="os-chip">
              <DollarSign size={16} className="os-chip-icon" />
              {/* 🟢 MODIFIÉ : Utilisation de totalAmount au lieu de totalPrice */}
              <span>{(data.totalAmount || 0).toFixed(0)} FCFA</span>
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
      {showNoLivreurDialog && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="os-dialog-overlay"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="os-dialog os-dialog-failure"
          >
            <div className="os-failure-icon-wrap">
              {isReportingFailure ? (
                <Loader2 size={32} className="animate-spin os-icon-orange" />
              ) : failureReported ? (
                <CheckCircle size={32} className="os-icon-success" />
              ) : (
                <AlertCircle size={32} className="os-icon-warning" />
              )}
            </div>

            <h3 className="os-failure-title">
              {failureReported 
                ? 'Commande transmise à notre équipe' 
                : 'Aucun livreur disponible'}
            </h3>

            <p className="os-failure-message">
              {failureReported 
                ? "Votre demande a bien été enregistrée. Notre équipe a été alertée et traitera votre commande dans les plus brefs délais. Vous serez contacté rapidement."
                : "Nous n'avons trouvé aucun livreur disponible dans votre zone pour le moment. Votre demande est en cours d'enregistrement auprès de notre équipe."}
            </p>

            <div className="os-dialog-actions">
              <button
                onClick={handleGoBack}
                className="os-btn os-btn-primary os-btn-full"
                disabled={isReportingFailure}
              >
                {isReportingFailure ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Retour aux commandes'
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

export default OrderSearchingScreen;