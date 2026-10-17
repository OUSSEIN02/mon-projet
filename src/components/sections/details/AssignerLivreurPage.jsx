import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Search, Star, Truck, Phone, User,
  CheckCircle, AlertCircle, RefreshCw, Loader2, Radar,
  X, Package, Clock, DollarSign, Navigation
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';
import Loader from '../../../utils/Loader';
import '../../css/AssignerLivreurPage.css';

// ═══════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════
const POLLING_INTERVAL = 5000;
const RADIUS_TIMEOUT = 20000;
const RADII = [2.0, 3.0, 5.0];
const SEARCH_DEBOUNCE = 300;

const AssignerLivreurPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const orderFromState = location.state?.orderData;
  const failedOrderIdFromState = location.state?.failedOrderId;

  // ═══════════════════════════════════════════════════════════
  // ÉTATS : COMMANDE
  // ═══════════════════════════════════════════════════════════
  const [order, setOrder] = useState(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);

  // ═══════════════════════════════════════════════════════════
  // ÉTATS : RECHERCHE AUTOMATIQUE (RADAR)
  // ═══════════════════════════════════════════════════════════
  const [currentRadius, setCurrentRadius] = useState(RADII[0]);
  const [searchStep, setSearchStep] = useState(0);
  const [isAutoSearching, setIsAutoSearching] = useState(false); // ❌ Ne démarre plus à true
  const [autoLivreurFound, setAutoLivreurFound] = useState(null);
  const [autoSearchFailed, setAutoSearchFailed] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // ÉTATS : RECHERCHE MANUELLE (DROPDOWN SUGGESTIONS)
  // ═══════════════════════════════════════════════════════════
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // ═══════════════════════════════════════════════════════════
  // ÉTATS : ATTRIBUTION
  // ═══════════════════════════════════════════════════════════
  const [selectedLivreur, setSelectedLivreur] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // REFS
  // ═══════════════════════════════════════════════════════════
  const pollingTimerRef = useRef(null);
  const radiusTimerRef = useRef(null);
  const isCheckingRef = useRef(false);
  const livreurAcceptedRef = useRef(false);
  const searchStepRef = useRef(0);
  const currentRadiusRef = useRef(RADII[0]);
  const searchDebounceRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { searchStepRef.current = searchStep; }, [searchStep]);
  useEffect(() => { currentRadiusRef.current = currentRadius; }, [currentRadius]);

  // ═══════════════════════════════════════════════════════════
  // 1️⃣ CHARGEMENT DE LA COMMANDE
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const hasRequiredData = orderFromState && 
                            orderFromState.pickup_lat && 
                            orderFromState.pickup_lng &&
                            orderFromState.id;

    if (hasRequiredData) {
      const enrichedOrder = {
        ...orderFromState,
        failed_order_id: orderFromState.failed_order_id || failedOrderIdFromState
      };
      setOrder(enrichedOrder);
      setIsLoadingOrder(false);
      // ✅ SUPPRIMÉ : setIsAutoSearching(true);
      return;
    }

    const fetchOrder = async () => {
      setIsLoadingOrder(true);
      try {
        const response = await apiClient.get(`/orders/${orderId}`);
        const orderData = response.data?.data || response.data;
        
        if (failedOrderIdFromState) {
          orderData.failed_order_id = failedOrderIdFromState;
        }
        
        setOrder(orderData);
        // ✅ SUPPRIMÉ : setIsAutoSearching(true);
      } catch (err) {
        console.error('Erreur chargement commande:', err);
        toast.error('Impossible de charger la commande');
        navigate('/dashboard/attributions');
      } finally {
        setIsLoadingOrder(false);
      }
    };

    if (orderId) fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // ═══════════════════════════════════════════════════════════
  // 2️⃣ RECHERCHE AUTOMATIQUE (RADAR)
  // ═══════════════════════════════════════════════════════════
  const checkForLivreur = useCallback(async () => {
    if (isCheckingRef.current || livreurAcceptedRef.current || !order) return;
    isCheckingRef.current = true;

    try {
      const response = await apiClient.get(
        `/livreur/nearby?order_id=${order.id}` +
        `&lat=${order.pickup_lat}&lng=${order.pickup_lng}` +
        `&radius=${currentRadiusRef.current}`
      );

      const data = response.data;

      if (data?.success === true) {
        if (data.assigned === true && Array.isArray(data.data) && data.data.length > 0) {
          onAutoLivreurFound(data.data[0]);
        }
      }
    } catch (error) {
      console.error('Erreur recherche auto:', error);
    } finally {
      isCheckingRef.current = false;
    }
  }, [order]);

  const onAutoLivreurFound = (livreur) => {
    if (livreurAcceptedRef.current) return;
    livreurAcceptedRef.current = true;
    stopAllTimers();

    setAutoLivreurFound(livreur);
    setIsAutoSearching(false);

    toast.success(`Livreur trouvé : ${livreur.name || livreur.user?.name || 'Livreur'}`, {
      icon: '🎯',
      duration: 4000,
    });
  };

  const startRadiusSearch = useCallback(() => {
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
  }, [checkForLivreur]);

  const moveToNextRadius = () => {
    if (livreurAcceptedRef.current) return;
    stopAllTimers();

    const currentStep = searchStepRef.current;

    if (currentStep === 0) {
      setSearchStep(1);
      setCurrentRadius(RADII[1]);
      startRadiusSearch();
    } else if (currentStep === 1) {
      setSearchStep(2);
      setCurrentRadius(RADII[2]);
      startRadiusSearch();
    } else {
      setIsAutoSearching(false);
      setAutoSearchFailed(true);
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

  const restartAutoSearch = () => {
    setSearchStep(0);
    setCurrentRadius(RADII[0]);
    searchStepRef.current = 0;
    currentRadiusRef.current = RADII[0];
    setIsAutoSearching(true);
    setAutoLivreurFound(null);
    setAutoSearchFailed(false);
    livreurAcceptedRef.current = false;
    isCheckingRef.current = false;
    startRadiusSearch();
  };

  useEffect(() => {
    if (order?.id && isAutoSearching) {
      startRadiusSearch();
    }
    return () => stopAllTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id, isAutoSearching]);

  // ═══════════════════════════════════════════════════════════
  // 3️⃣ RECHERCHE MANUELLE (SUGGESTIONS DROPDOWN)
  // ═══════════════════════════════════════════════════════════
  const fetchSuggestions = useCallback(async (term) => {
    if (!term || term.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const params = new URLSearchParams();
      params.append('search', term);
      params.append('available', '1');
      if (order?.pickup_lat) params.append('lat', order.pickup_lat);
      if (order?.pickup_lng) params.append('lng', order.pickup_lng);
      params.append('per_page', '10');

      const response = await apiClient.get(`/admin/livreurs?${params.toString()}`);
      const drivers = response.data?.data || response.data || [];

      const formatted = (Array.isArray(drivers) ? drivers : []).map(d => ({
        id: d.id,
        nom: d.user?.name || d.nom || d.name || 'Inconnu',
        phone: d.user?.phone || d.phone || '',
        email: d.user?.email || d.email || '',
        photo: d.photo || null, // Corrigé pour utiliser d.photo directement depuis le backend
        zone: Array.isArray(d.zones_livraison)
          ? d.zones_livraison.join(', ')
          : (d.city || d.zone || 'Non définie'),
        vehicule: d.vehicle_type || d.vehicule || 'Moto',
        note: parseFloat(d.note_moyenne || d.rating) || 0,
        taux: d.taux_acceptation ? `${d.taux_acceptation}%` : 'N/A',
        enCours: d.current_orders_count || 0,
        // ✅ CORRECTION CRITIQUE : !== était inversé, maintenant === true
        disponible: d.is_available === false && (d.status === 'valide' || d.status === 'active'),
        distance: d.distance_km ? parseFloat(d.distance_km).toFixed(1) : null,
      }));

      setSuggestions(formatted);
      setShowDropdown(formatted.length > 0);
      setActiveIndex(-1);
    } catch (err) {
      console.error('Erreur recherche suggestions:', err);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [order?.pickup_lat, order?.pickup_lng]);

  // Debounce sur l'input
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (searchTerm.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    searchDebounceRef.current = setTimeout(() => {
      fetchSuggestions(searchTerm);
    }, SEARCH_DEBOUNCE);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchTerm, fetchSuggestions]);

  // Fermer le dropdown si clic extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navigation clavier dans le dropdown
  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSuggestionSelect(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  };

  // Sélection d'une suggestion
  const handleSuggestionSelect = (livreur) => {
    setSelectedLivreur({ ...livreur, source: 'manual' });
    setShowConfirmModal(true);
    setShowDropdown(false);
    setSearchTerm('');
    setActiveIndex(-1);
  };

  // Clear la recherche
  const handleClearSearch = () => {
    setSearchTerm('');
    setSuggestions([]);
    setShowDropdown(false);
    setActiveIndex(-1);
    if (inputRef.current) inputRef.current.focus();
  };

  // ═══════════════════════════════════════════════════════════
  // 4️⃣ ATTRIBUTION
  // ═══════════════════════════════════════════════════════════
  const handleConfirmAssignment = async () => {
    if (!selectedLivreur || !order) return;

    setIsAssigning(true);
    try {
      await apiClient.post(`/dashboard/orders/${order.id}/assign`, {
        livreur_id: selectedLivreur.id,
        rayon_km: currentRadius // ✅ Ajouté pour correspondre à la mise à jour backend
      });

      const failedOrderId = order.failed_order_id || failedOrderIdFromState;
      
      if (failedOrderId) {
        await apiClient.patch(`/failed-orders/${failedOrderId}/review`, {
          status: 'resolved',
          notes: `Attribué manuellement au livreur #${selectedLivreur.id} (${selectedLivreur.nom})`
        }).catch((err) => {
          console.warn('⚠️ Impossible de marquer le failed_order comme résolu:', err);
        });
      }

    // Vers la ligne ~330, dans handleConfirmAssignment
    toast.success(`Commande attribuée à ${selectedLivreur.nom} !`, {
      icon: '✅',
      duration: 4000,
    });

    setTimeout(() => {
      // Ajout de { state: { refresh: true } } pour prévenir la page précédente
      navigate('/dashboard/attributions', { state: { refresh: true } });
    }, 1000);
    } catch (err) {
      console.error('Erreur attribution:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de l\'attribution');
    } finally {
      setIsAssigning(false);
      setShowConfirmModal(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════
  const formatWaitTime = (dateString) => {
    if (!dateString) return 'N/A';
    const minutes = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}min`;
    return `${mins} min`;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // ═══════════════════════════════════════════════════════════
  // RENDU
  // ═══════════════════════════════════════════════════════════
  if (isLoadingOrder || !order) {
    return <Loader text="Chargement de la commande..." fullScreen={false} size="lg" />;
  }

  const displayDistance = order.distance 
    ? `${parseFloat(order.distance).toFixed(1)} km` 
    : 'N/A';
  const displayMontant = (order.total_amount || order.total_price)
    ? `${new Intl.NumberFormat('fr-FR').format(order.total_amount || order.total_price)} FCFA`
    : 'N/A';

  return (
    <div className="al-page">
      {/* HEADER */}
      <header className="al-header">
        <button
          onClick={() => navigate('/dashboard/attributions')}
          className="al-back-btn"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="al-header-text">
          <h2 className="al-title">Attribuer un livreur</h2>
          <p className="al-subtitle">
            Commande {order.reference || order.displayId || `#${order.id}`}
          </p>
        </div>
      </header>

      {/* RÉSUMÉ DE LA COMMANDE */}
      <div className="al-order-summary">
        <div className="al-order-summary-header">
          <Package size={18} />
          <span>Détails de la commande</span>
        </div>
        <div className="al-order-summary-grid">
          <div className="al-summary-item">
            <User size={14} />
            <div>
              <span className="al-summary-label">Client</span>
              <span className="al-summary-value">
                {order.dropoff_name || order.client_name || order.displayClient || 'Inconnu'}
              </span>
            </div>
          </div>
          <div className="al-summary-item">
            <MapPin size={14} />
            <div>
              <span className="al-summary-label">Départ</span>
              <span className="al-summary-value">
                {(order.pickup_address || order.displayPickup || '')?.split(',').slice(0, 2).join(',')}
              </span>
            </div>
          </div>
          <div className="al-summary-item">
            <MapPin size={14} />
            <div>
              <span className="al-summary-label">Arrivée</span>
              <span className="al-summary-value">
                {(order.dropoff_address || order.dropoffDisplay || '')?.split(',').slice(0, 2).join(',')}
              </span>
            </div>
          </div>
          <div className="al-summary-item">
            <Truck size={14} />
            <div>
              <span className="al-summary-label">Distance</span>
              <span className="al-summary-value">
                {order.displayDistance || displayDistance}
              </span>
            </div>
          </div>
          <div className="al-summary-item">
            <DollarSign size={14} />
            <div>
              <span className="al-summary-label">Montant</span>
              <span className="al-summary-value">
                {order.displayMontant || displayMontant}
              </span>
            </div>
          </div>
          <div className="al-summary-item">
            <Clock size={14} />
            <div>
              <span className="al-summary-label">En attente</span>
              <span className="al-summary-value al-summary-warning">
                {order.displayTempsAttente || formatWaitTime(order.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1 : RECHERCHE AUTOMATIQUE (RADAR) */}
      <section className="al-section">
        <div className="al-section-header">
          <div className="al-section-title-wrap">
            <div className="al-section-icon al-section-icon-auto">
              <Radar size={20} />
            </div>
            <div>
              <h3 className="al-section-title">Recherche automatique</h3>
              <p className="al-section-subtitle">
                Recherche progressive dans un rayon de 2km → 3km → 5km
              </p>
            </div>
          </div>
          {autoSearchFailed && (
            <button onClick={restartAutoSearch} className="al-retry-btn">
              <RefreshCw size={14} />
              Relancer
            </button>
          )}
        </div>

        <div className="al-auto-content">
          <div className="al-radar-wrapper">
            <div className="al-radar-container">
              {RADII.map((radius, index) => {
                const isActive = index <= searchStep;
                const size = ((index + 1) / 3) * 100;
                return (
                  <div
                    key={radius}
                    className={`al-radar-circle ${isActive ? 'active' : ''}`}
                    style={{ width: `${size}%`, height: `${size}%` }}
                  >
                    {isActive && index === searchStep && isAutoSearching && (
                      <div className="al-radius-label">{radius} km</div>
                    )}
                  </div>
                );
              })}

              {isAutoSearching && <div className="al-radar-sweep" />}

              <div className="al-radar-center">
                <MapPin size={14} color="white" />
              </div>

              <AnimatePresence>
                {autoLivreurFound && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="al-radar-found-badge"
                  >
                    {autoLivreurFound.photo ? (
                      <img src={autoLivreurFound.photo} alt="" />
                    ) : (
                      <span>{getInitials(autoLivreurFound.name || autoLivreurFound.user?.name)}</span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="al-auto-status">
            {/* ✅ NOUVEAU : État initial (en pause) avec bouton de lancement */}
            {!isAutoSearching && !autoLivreurFound && !autoSearchFailed && (
              <div className="al-status-card idle">
                <Radar size={40} className="al-radar-idle-icon" style={{ color: '#64748b', marginBottom: '12px' }} />
                <div>
                  <strong>Recherche automatique en pause</strong>
                  <span>Cliquez sur le bouton ci-dessous pour lancer le radar</span>
                </div>
                <button onClick={restartAutoSearch} className="al-start-search-btn" style={{
                  marginTop: '16px',
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px'
                }}>
                  <Radar size={16} />
                  Lancer la recherche automatique
                </button>
              </div>
            )}

            {isAutoSearching ? (
              <div className="al-status-card searching">
                <div className="al-spinner" />
                <div>
                  <strong>Recherche en cours...</strong>
                  <span>Rayon actuel : {currentRadius.toFixed(0)} km</span>
                </div>
              </div>
            ) : autoLivreurFound ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="al-livreur-found-card"
              >
                <div className="al-livreur-found-avatar">
                  {autoLivreurFound.photo ? (
                    <img src={autoLivreurFound.photo} alt="" />
                  ) : (
                    <span>{getInitials(autoLivreurFound.name || autoLivreurFound.user?.name)}</span>
                  )}
                </div>
                <div className="al-livreur-found-info">
                  <div className="al-livreur-found-name">
                    {autoLivreurFound.name || autoLivreurFound.user?.name || 'Livreur'}
                  </div>
                  <div className="al-livreur-found-meta">
                    <span className="al-meta-item">
                      <Star size={12} fill="#f59e0b" color="#f59e0b" />
                      {parseFloat(autoLivreurFound.rating || autoLivreurFound.note_moyenne || 0).toFixed(1)}
                    </span>
                    <span className="al-meta-item">
                      <Truck size={12} />
                      {autoLivreurFound.vehicule || 'Moto'}
                    </span>
                    {autoLivreurFound.distance && (
                      <span className="al-meta-item al-meta-success">
                        <Navigation size={12} />
                        {parseFloat(autoLivreurFound.distance).toFixed(1)} km
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleSuggestionSelect({
                    id: autoLivreurFound.id,
                    nom: autoLivreurFound.name || autoLivreurFound.user?.name,
                    photo: autoLivreurFound.photo,
                    zone: autoLivreurFound.zone,
                    vehicule: autoLivreurFound.vehicule,
                    note: autoLivreurFound.rating || autoLivreurFound.note_moyenne,
                  })}
                  className="al-assign-btn"
                >
                  <CheckCircle size={16} />
                  Attribuer
                </button>
              </motion.div>
            ) : autoSearchFailed ? (
              <div className="al-status-card failed">
                <AlertCircle size={20} />
                <div>
                  <strong>Aucun livreur trouvé automatiquement</strong>
                  <span>Utilisez la recherche manuelle ci-dessous</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* SECTION 2 : RECHERCHE MANUELLE (DROPDOWN SUGGESTIONS) */}
      <section className="al-section">
        <div className="al-section-header">
          <div className="al-section-title-wrap">
            <div className="al-section-icon al-section-icon-manual">
              <Search size={20} />
            </div>
            <div>
              <h3 className="al-section-title">Recherche manuelle</h3>
              <p className="al-section-subtitle">
                Tapez un nom, téléphone ou email pour trouver un livreur
              </p>
            </div>
          </div>
        </div>

        {/* Container de recherche avec dropdown */}
        <div className="al-search-container" style={{ position: 'relative', maxWidth: '700px', margin: '0 auto' }}>
          <div className="al-search-input-main">
            <Search size={20} className="al-search-main-icon" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Rechercher un livreur par nom, téléphone ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowDropdown(true);
              }}
              onKeyDown={handleKeyDown}
              className="al-search-main-input"
              autoComplete="off"
            />
            {isLoadingSuggestions && (
              <Loader2 size={18} className="al-search-spinner animate-spin" />
            )}
            {searchTerm && !isLoadingSuggestions && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="al-search-clear-main"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="al-suggestions-dropdown"
              >
                {suggestions.length === 0 ? (
                  <div className="al-suggestions-empty">
                    <User size={32} />
                    <p>Aucun livreur trouvé pour "{searchTerm}"</p>
                  </div>
                ) : (
                  <>
                    <div className="al-suggestions-header">
                      <span>{suggestions.length} livreur{suggestions.length > 1 ? 's' : ''} trouvé{suggestions.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="al-suggestions-list">
                      {suggestions.map((livreur, index) => (
                        <div
                          key={livreur.id}
                          className={`al-suggestion-item ${index === activeIndex ? 'active' : ''} ${!livreur.disponible ? 'disabled' : ''}`}
                          onClick={() => livreur.disponible && handleSuggestionSelect(livreur)}
                          onMouseEnter={() => setActiveIndex(index)}
                        >
                          <div className="al-suggestion-avatar">
                            {livreur.photo ? (
                              <img src={livreur.photo} alt={livreur.nom} />
                            ) : (
                              <span>{getInitials(livreur.nom)}</span>
                            )}
                            {livreur.disponible && (
                              <span className="al-suggestion-online-dot"></span>
                            )}
                          </div>

                          <div className="al-suggestion-info">
                            <div className="al-suggestion-name">
                              {livreur.nom}
                              {!livreur.disponible && (
                                <span className="al-suggestion-busy-badge">Occupé</span>
                              )}
                            </div>
                            <div className="al-suggestion-details">
                              {livreur.phone && (
                                <span className="al-suggestion-detail">
                                  <Phone size={11} />
                                  {livreur.phone}
                                </span>
                              )}
                              {livreur.email && (
                                <span className="al-suggestion-detail">
                                  📧 {livreur.email}
                                </span>
                              )}
                              <span className="al-suggestion-detail">
                                <MapPin size={11} />
                                {livreur.zone}
                              </span>
                            </div>
                          </div>

                          <div className="al-suggestion-stats">
                            <div className="al-suggestion-rating">
                              <Star size={12} fill="#f59e0b" color="#f59e0b" />
                              <span>{livreur.note.toFixed(1)}</span>
                            </div>
                            <div className="al-suggestion-meta">
                              <Truck size={11} />
                              <span>{livreur.vehicule}</span>
                            </div>
                            {livreur.distance && (
                              <div className="al-suggestion-distance">
                                <Navigation size={11} />
                                <span>{livreur.distance} km</span>
                              </div>
                            )}
                          </div>

                          {livreur.disponible && (
                            <div className="al-suggestion-action">
                              <CheckCircle size={18} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="al-suggestions-footer">
                      <span>
                        <kbd>↑</kbd> <kbd>↓</kbd> Naviguer • <kbd>↵</kbd> Sélectionner • <kbd>Esc</kbd> Fermer
                      </span>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {searchTerm.length > 0 && searchTerm.length < 2 && !showDropdown && (
            <div className="al-search-hint">
              Continuez à taper (minimum 2 caractères)...
            </div>
          )}
        </div>

        <div className="al-search-tip" style={{ textAlign: 'center', marginTop: '20px', color: '#64748b', fontSize: '13px' }}>
          💡 Astuce : Vous pouvez rechercher par nom complet, numéro de téléphone ou adresse email
        </div>
      </section>

      {/* MODALE DE CONFIRMATION */}
      <AnimatePresence>
        {showConfirmModal && selectedLivreur && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="al-modal-overlay"
            onClick={() => !isAssigning && setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="al-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="al-modal-header">
                <div className="al-modal-icon">
                  <User size={24} />
                </div>
                <h3>Confirmer l'attribution</h3>
              </div>

              <div className="al-modal-body">
                <p className="al-modal-text">
                  Attribuer la commande <strong>{order.reference || order.displayId || `#${order.id}`}</strong> à :
                </p>

                <div className="al-modal-livreur">
                  <div className="al-modal-livreur-avatar">
                    {selectedLivreur.photo ? (
                      <img src={selectedLivreur.photo} alt="" />
                    ) : (
                      <span>{getInitials(selectedLivreur.nom)}</span>
                    )}
                  </div>
                  <div>
                    <div className="al-modal-livreur-name">{selectedLivreur.nom}</div>
                    <div className="al-modal-livreur-meta">
                      <Star size={12} fill="#f59e0b" color="#f59e0b" />
                      {parseFloat(selectedLivreur.note || 0).toFixed(1)}
                      <span>•</span>
                      {selectedLivreur.vehicule}
                    </div>
                  </div>
                  <span className="al-modal-source">
                    {selectedLivreur.source === 'auto' ? '🎯 Trouvé auto' : '🔍 Recherche manuelle'}
                  </span>
                </div>

                <div className="al-modal-info">
                  <div className="al-modal-info-row">
                    <MapPin size={14} />
                    <span>Départ : {(order.pickup_address || order.displayPickup || '')?.split(',').slice(0, 2).join(',')}</span>
                  </div>
                  <div className="al-modal-info-row">
                    <MapPin size={14} />
                    <span>Arrivée : {(order.dropoff_address || order.dropoffDisplay || '')?.split(',').slice(0, 2).join(',')}</span>
                  </div>
                  <div className="al-modal-info-row">
                    <DollarSign size={14} />
                    <span>Montant : {displayMontant}</span>
                  </div>
                </div>
              </div>

              <div className="al-modal-footer">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isAssigning}
                  className="al-btn-secondary"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmAssignment}
                  disabled={isAssigning}
                  className="al-btn-primary"
                >
                  {isAssigning ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Attribution...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Confirmer
                    </>
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

export default AssignerLivreurPage;