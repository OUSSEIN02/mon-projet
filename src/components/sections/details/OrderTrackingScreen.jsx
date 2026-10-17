import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleMap, MarkerF, PolylineF } from '@react-google-maps/api';
import {
  ArrowLeft, Phone, MessageCircle, X, Check, CheckCircle,
  Bike, Package, Truck, PartyPopper, Star, MapPin, Clock,
  Route, DollarSign, AlertTriangle, Radio, Share2, Copy // 🟢 AJOUT : Share2 et Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';
import { useGoogleMaps } from '../../../hooks/useGoogleMaps';
import '../../css/OrderTrackingScreen.css';

const POLLING_INTERVAL = 3000;

const OrderTrackingScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const data = location.state;

  const { isLoaded: isMapsLoaded, loadError: mapsLoadError } = useGoogleMaps();

  // États
  const [livreurPosition, setLivreurPosition] = useState(null);
  const [livreurHeading, setLivreurHeading] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('accepted');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [remainingMinutes, setRemainingMinutes] = useState(25);
  const [isPositionFresh, setIsPositionFresh] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);

  const mapRef = useRef(null);
  const pollingTimerRef = useRef(null);
  const stepsRef = useRef([
    { title: 'Commande acceptée', subtitle: 'Le livreur a accepté votre course', icon: CheckCircle, time: '' },
    { title: 'En route vers le lieu de récupération', subtitle: 'Le livreur arrive bientôt', icon: Bike, time: '' },
    { title: 'Colis récupéré', subtitle: 'Votre colis est en sécurité', icon: Package, time: '' },
    { title: 'En route vers la destination', subtitle: 'Votre colis arrive chez le destinataire', icon: Truck, time: '' },
    { title: 'Livré', subtitle: "Merci d'avoir utilisé Delivo !", icon: PartyPopper, time: '' },
  ]);
  const [steps, setSteps] = useState(stepsRef.current);

  // 🟢 NOUVEAU : Génération de l'URL de suivi
  const trackingUrl = `${window.location.origin}/suivi/${data?.orderId}`;

  // 🟢 NOUVEAU : Fonction pour copier le lien
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      toast.success('Lien de suivi copié dans le presse-papiers !', { icon: '📋' });
    } catch (err) {
      toast.error('Impossible de copier le lien automatiquement.');
    }
  };

  // 🟢 NOUVEAU : Fonction pour partager sur WhatsApp
  const handleShareWhatsApp = () => {
    const message = `Bonjour ! 👋\nVotre commande Delivo #${data?.orderId} est en cours de livraison. 🚚\n\nVous pouvez suivre votre livreur en temps réel ici :\n${trackingUrl}`;
    const encodedMessage = encodeURIComponent(message);
    // Ouvre WhatsApp Web ou l'application mobile
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  // Validation des données
  useEffect(() => {
    if (!data || !data.orderId) {
      toast.error('Données de commande manquantes');
      navigate('/dashboard/commandes');
    }
  }, [data, navigate]);

  // ═══════════════════════════════════════════════════════════
  // POLLING : SUIVI EN TEMPS RÉEL
  // ═══════════════════════════════════════════════════════════
  const fetchTrackingData = useCallback(async () => {
    try {
      const response = await apiClient.get(`/orders/${data.orderId}/tracking`);
      const responseData = response.data?.data || response.data;

      const lat = parseFloat(responseData?.latitude);
      const lng = parseFloat(responseData?.longitude);

      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        setLivreurPosition({ lat, lng });
        setLivreurHeading(parseFloat(responseData?.heading) || 0);

        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng });
        }
      }

      const phase = responseData?.phase || 'accepted';
      setCurrentPhase(phase);
      updateStepFromPhase(phase);

      if (responseData?.remainingMinutes !== undefined) {
        setRemainingMinutes(parseInt(responseData.remainingMinutes));
      }

      setIsPositionFresh(responseData?.isFresh !== false);

      if (phase === 'completed' || responseData?.status === 'completed') {
        onDeliveryCompleted();
      }
    } catch (error) {
      console.error('Erreur polling tracking:', error);
      if (error.response?.status === 401) {
        if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      }
    }
  }, [data?.orderId]);

  const updateStepFromPhase = (phase) => {
    let newIndex = 0;
    switch (phase) {
      case 'start': case 'accepted': newIndex = 0; break;
      case 'toPickup': newIndex = 1; break;
      case 'picked': newIndex = 2; break;
      case 'toDropoff': newIndex = 3; break;
      case 'completed': newIndex = 4; break;
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
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
      setIsCompleted(true);
      setTimeout(() => {
        setShowCompletionDialog(true);
      }, 1000);
    }
  };

  useEffect(() => {
    if (!data?.orderId) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setSteps((prev) => {
      const newSteps = [...prev];
      newSteps[0] = { ...newSteps[0], time: timeStr };
      return newSteps;
    });

    fetchTrackingData();

    pollingTimerRef.current = setInterval(() => {
      if (!isCompleted && !isCancelled) {
        fetchTrackingData();
      }
    }, POLLING_INTERVAL);

    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [data?.orderId, fetchTrackingData]);

  const handleCallLivreur = () => {
    if (data?.livreur?.phone) {
      window.location.href = `tel:${data.livreur.phone}`;
    } else {
      toast.success(`Appel en cours vers ${data?.livreur?.name}...`, { icon: '📞' });
    }
  };

  const handleMessageLivreur = () => {
    toast('Fonctionnalité de messagerie bientôt disponible.', { icon: '💬' });
  };

  const handleCancel = () => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    setIsCancelled(true);
    setShowCancelDialog(false);
    navigate('/dashboard/commandes', { state: { cancelled: true } });
  };

  const handleFinish = () => {
    setShowCompletionDialog(false);
    navigate('/dashboard/commandes', { state: { completed: true } });
  };

  const mapCenter = React.useMemo(() => {
    if (data?.pickupLat && data?.dropoffLat) {
      return {
        lat: (parseFloat(data.pickupLat) + parseFloat(data.dropoffLat)) / 2,
        lng: (parseFloat(data.pickupLng) + parseFloat(data.dropoffLng)) / 2,
      };
    }
    return { lat: 0.4162, lng: 9.4673 };
  }, [data]);

  if (!data) return null;

  return (
    <div className="ot-page">
      <header className="ot-header">
        <button
          onClick={isCompleted ? handleFinish : () => setShowCancelDialog(true)}
          className="ot-back-btn"
          aria-label="Retour"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="ot-header-text">
          <h2 className="ot-title">Suivi de livraison</h2>
          <p className="ot-subtitle">Commande #{data.orderId}</p>
        </div>
        <div className={`ot-status-badge ${isCompleted ? 'completed' : 'ongoing'}`}>
          {isCompleted ? (
            <><CheckCircle size={14} /><span>Livré</span></>
          ) : (
            <><span className="ot-status-dot" /><span>En cours</span></>
          )}
        </div>
      </header>

      <div className="ot-map-container">
        {mapsLoadError ? (
          <div className="ot-map-error">
            <AlertTriangle size={32} />
            <p>Impossible de charger la carte</p>
          </div>
        ) : !isMapsLoaded ? (
          <div className="ot-map-loading">
            <div className="ot-spinner" />
            <p>Chargement de la carte...</p>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={mapCenter}
            zoom={13}
            onLoad={(map) => { mapRef.current = map; }}
            options={{
              disableDefaultUI: false,
              zoomControl: false,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              clickableIcons: false,
            }}
          >
            <MarkerF
              position={{ lat: parseFloat(data.pickupLat), lng: parseFloat(data.pickupLng) }}
              title={`Départ: ${data.pickupAddress}`}
              icon={{ url: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png", scaledSize: new window.google.maps.Size(40, 40) }}
            />
            <MarkerF
              position={{ lat: parseFloat(data.dropoffLat), lng: parseFloat(data.dropoffLng) }}
              title={`Arrivée: ${data.dropoffAddress}`}
              icon={{ url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png", scaledSize: new window.google.maps.Size(40, 40) }}
            />
            <PolylineF
              path={[
                { lat: parseFloat(data.pickupLat), lng: parseFloat(data.pickupLng) },
                { lat: parseFloat(data.dropoffLat), lng: parseFloat(data.dropoffLng) },
              ]}
              options={{ strokeColor: '#f97316', strokeOpacity: 0.7, strokeWeight: 4, geodesic: true }}
            />
            {livreurPosition && (
              <MarkerF
                position={livreurPosition}
                title={`Livreur: ${data.livreur?.name || 'Livreur'}`}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                  scaledSize: new window.google.maps.Size(40, 40),
                  anchor: new window.google.maps.Point(16, 32),
                }}
              />
            )}
          </GoogleMap>
        )}
      </div>

      <main className="ot-content">
        {/* 🟢 NOUVEAU : Carte de partage du lien de suivi */}
        <div className="ot-share-card">
          <div className="ot-share-header">
            <Share2 size={18} className="ot-share-icon" />
            <h4 className="ot-card-title" style={{ margin: 0 }}>Partager le suivi client</h4>
          </div>
          <p className="ot-share-desc">Envoyez ce lien à votre client pour qu'il suive sa livraison en temps réel.</p>
          
          <div className="ot-share-url-box">
            <span className="ot-share-url-text">{trackingUrl}</span>
            <button onClick={handleCopyLink} className="ot-copy-btn" title="Copier le lien">
              <Copy size={16} />
            </button>
          </div>
          
          <button onClick={handleShareWhatsApp} className="ot-whatsapp-btn">
            <MessageCircle size={18} /> Partager sur WhatsApp
          </button>
        </div>

        {/* Card Livreur */}
        <div className="ot-livreur-card">
          <div className="ot-livreur-avatar-wrap">
            <img src={data.livreur?.photo || 'https://i.pravatar.cc/150?img=10'} alt={data.livreur?.name} className="ot-livreur-avatar" />
            <div className="ot-online-dot"><Check size={10} color="white" /></div>
          </div>
          <div className="ot-livreur-info">
            <h4 className="ot-livreur-name">{data.livreur?.name || 'Livreur'}</h4>
            <div className="ot-livreur-meta">
              <div className="ot-vehicle-badge">
                {data.livreur?.vehicule === 'Moto' ? <Truck size={12} /> : <Bike size={12} />}
                <span>{data.livreur?.vehicule || 'Moto'}</span>
              </div>
              <div className="ot-rating">
                <Star size={14} className="ot-star-icon" />
                <span>{data.livreur?.rating || '4.8'}</span>
              </div>
            </div>
          </div>
          <div className="ot-livreur-actions">
            <button onClick={handleCallLivreur} className="ot-action-btn ot-action-green" title="Appeler">
              <Phone size={18} />
            </button>
            <button onClick={handleMessageLivreur} className="ot-action-btn ot-action-orange" title="Message">
              <MessageCircle size={18} />
            </button>
          </div>
        </div>

        {!isCompleted && (
          <div className="ot-eta-card">
            <div className="ot-eta-item">
              <Clock size={20} className="ot-eta-icon" />
              <span className="ot-eta-value">{remainingMinutes} min</span>
              <span className="ot-eta-label">Temps estimé</span>
            </div>
            <div className="ot-eta-divider" />
            <div className="ot-eta-item">
              <Route size={20} className="ot-eta-icon" />
              <span className="ot-eta-value">{data.distance?.toFixed(1)} km</span>
              <span className="ot-eta-label">Distance</span>
            </div>
            <div className="ot-eta-divider" />
            <div className="ot-eta-item">
              <DollarSign size={20} className="ot-eta-icon" />
              <span className="ot-eta-value">{data.totalPrice?.toFixed(0)} F</span>
              <span className="ot-eta-label">Total</span>
            </div>
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
          <div className="ot-detail-row">
            <MapPin size={18} className="ot-detail-icon" />
            <div className="ot-detail-content">
              <span className="ot-detail-label">Départ</span>
              <span className="ot-detail-value">{data.pickupAddress}</span>
            </div>
          </div>
          <div className="ot-detail-row">
            <MapPin size={18} className="ot-detail-icon" />
            <div className="ot-detail-content">
              <span className="ot-detail-label">Arrivée</span>
              <span className="ot-detail-value">{data.dropoffAddress}</span>
            </div>
          </div>
        </div>
      </main>

    

      <AnimatePresence>
        {showCancelDialog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="ot-dialog-overlay" onClick={() => setShowCancelDialog(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="ot-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="ot-dialog-header">
                <div className="ot-dialog-icon-wrap warning"><AlertTriangle size={24} className="ot-icon-warning" /></div>
                <h3>Annuler la commande ?</h3>
              </div>
              <p className="ot-dialog-text">Êtes-vous sûr de vouloir annuler cette commande ? Le livreur a déjà été assigné.</p>
              <div className="ot-dialog-actions">
                <button onClick={() => setShowCancelDialog(false)} className="ot-btn ot-btn-secondary">Non</button>
                <button onClick={handleCancel} className="ot-btn ot-btn-danger">Oui, annuler</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCompletionDialog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="ot-dialog-overlay">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="ot-dialog">
              <div className="ot-completion-icon"><CheckCircle size={50} /></div>
              <h3 className="ot-completion-title">Livraison terminée !</h3>
              <p className="ot-dialog-text center">Votre colis a été livré avec succès.</p>
              <div className="ot-rating-stars">
                {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={24} className="ot-star-filled" fill="currentColor" />)}
              </div>
              <p className="ot-rating-text">Notez votre livreur</p>
              <button onClick={handleFinish} className="ot-btn ot-btn-primary full-width">Terminer</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderTrackingScreen;