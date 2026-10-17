import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, MapPin, Calendar, Package, FileText,
  Image as ImageIcon, Download, CheckCircle, AlertTriangle,
  Phone, Truck, Radio, Clock, Navigation, Crosshair
} from 'lucide-react';
import { GoogleMap, MarkerF, PolylineF } from '@react-google-maps/api';
import apiClient from '../../../services/apiClient';
import { getRoute, formatDistance, formatDuration } from '../../../services/directionsService';
import Loader from '../../../utils/Loader';
import { useGoogleMaps } from '../../../hooks/useGoogleMaps';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '8px',
};

const TRACKING_POLLING_INTERVAL = 3000;
const ROUTE_THROTTLE_MS = 10000;

const OrderDetailsSection = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { isLoaded: isMapsLoaded, loadError: mapsLoadError } = useGoogleMaps();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showActionModal, setShowActionModal] = useState(false);
  const [actionNote, setActionNote] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const [livreurPosition, setLivreurPosition] = useState(null);
  const [livreurHeading, setLivreurHeading] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('start');
  const [remainingMinutes, setRemainingMinutes] = useState(null);
  const [isPositionFresh, setIsPositionFresh] = useState(true);
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [autoFollow, setAutoFollow] = useState(true);

  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueType, setIssueType] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [issuePriority, setIssuePriority] = useState('moyenne');
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);

  const [routePoints, setRoutePoints] = useState([]);
  const [routeDistance, setRouteDistance] = useState(0);
  const [routeDuration, setRouteDuration] = useState(0);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  const mapRef = useRef(null);
  const userInteractedRef = useRef(false);
  const pollingIntervalRef = useRef(null);
  const lastRouteCalcRef = useRef(0);

 

  useEffect(() => {
    let isMounted = true;

    const fetchOrderDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(`/orders/${orderId}`);
        if (isMounted) {
          setOrder(response.data.data);
        }
      } catch (err) {
        console.error("Erreur lors du chargement:", err);
        if (isMounted) setError("Impossible de charger les détails.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (orderId) fetchOrderDetails();
    return () => { isMounted = false; };
  }, [orderId]);

  const fetchTrackingData = useCallback(async () => {
    if (!order?.id) return;

    try {
      const response = await apiClient.get(`/orders/${order.id}/tracking`);
      const data = response.data?.data || response.data || {};

      const lat = parseFloat(data.latitude || data.lat);
      const lng = parseFloat(data.longitude || data.lng || data.lon);

      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        const newPosition = { lat, lng };
        setLivreurPosition(newPosition);
        setLivreurHeading(parseFloat(data.heading || data.bearing) || 0);
        setLastUpdateTime(new Date());

        if (autoFollow && mapRef.current && !userInteractedRef.current) {
          mapRef.current.panTo(newPosition);
        }
      }

      if (data.phase) {
        setCurrentPhase(data.phase);
      }

      if (data.remainingMinutes !== undefined && data.remainingMinutes !== null) {
        setRemainingMinutes(parseInt(data.remainingMinutes));
      }

      setIsPositionFresh(data.isFresh !== false);

      if (data.phase === 'completed' || data.status === 'completed' || data.status === 'livree') {
        setOrder(prev => ({ ...prev, status: 'livree' }));
        setIsTrackingActive(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }

    } catch (err) {
      console.error('Erreur polling tracking:', err);

      if (err.response?.status === 401 || err.response?.status === 404) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsTrackingActive(false);
      }
    }
  }, [order?.id, autoFollow]);

  useEffect(() => {
    if (!order?.id) return;

    setIsTrackingActive(true);
    fetchTrackingData();

    pollingIntervalRef.current = setInterval(() => {
      fetchTrackingData();
    }, TRACKING_POLLING_INTERVAL);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setIsTrackingActive(false);
    };
  }, [order?.id, fetchTrackingData]);

  useEffect(() => {
    if (!order || !isMapsLoaded) return;

    const calculateRoute = async () => {
      const now = Date.now();
      if (now - lastRouteCalcRef.current < ROUTE_THROTTLE_MS) {
        return;
      }
      lastRouteCalcRef.current = now;

      let origin, destination;

      if (
        (currentPhase === 'toPickup' || currentPhase === 'accepted') &&
        livreurPosition &&
        order.pickup_lat && order.pickup_lng
      ) {
        origin = livreurPosition;
        destination = {
          lat: parseFloat(order.pickup_lat),
          lng: parseFloat(order.pickup_lng),
        };
      } else if (
        (currentPhase === 'toDropoff' || currentPhase === 'picked') &&
        livreurPosition &&
        order.dropoff_lat && order.dropoff_lng
      ) {
        origin = livreurPosition;
        destination = {
          lat: parseFloat(order.dropoff_lat),
          lng: parseFloat(order.dropoff_lng),
        };
      } else if (order.pickup_lat && order.pickup_lng && order.dropoff_lat && order.dropoff_lng) {
        origin = {
          lat: parseFloat(order.pickup_lat),
          lng: parseFloat(order.pickup_lng),
        };
        destination = {
          lat: parseFloat(order.dropoff_lat),
          lng: parseFloat(order.dropoff_lng),
        };
      } else {
        return;
      }

      setIsLoadingRoute(true);
      try {
        const route = await getRoute(origin, destination);

        if (route && route.polylinePoints?.length > 0) {
          setRoutePoints(route.polylinePoints);
          setRouteDistance(route.totalDistanceM);
          setRouteDuration(route.totalDurationS);
        } else {
          setRoutePoints([]);
        }
      } catch (err) {
        console.error('Erreur calcul itinéraire:', err);
      } finally {
        setIsLoadingRoute(false);
      }
    };

    calculateRoute();
  }, [order, currentPhase, livreurPosition, isMapsLoaded]);

  useEffect(() => {
    if (!mapRef.current || !isMapsLoaded || !order) return;

    const bounds = new window.google.maps.LatLngBounds();
    let hasPoints = false;

    if (routePoints.length > 0) {
      routePoints.forEach(point => {
        bounds.extend(point);
        hasPoints = true;
      });
    } else {
      if (order.pickup_lat && order.pickup_lng) {
        bounds.extend({ lat: parseFloat(order.pickup_lat), lng: parseFloat(order.pickup_lng) });
        hasPoints = true;
      }
      if (order.dropoff_lat && order.dropoff_lng) {
        bounds.extend({ lat: parseFloat(order.dropoff_lat), lng: parseFloat(order.dropoff_lng) });
        hasPoints = true;
      }
    }

    if (livreurPosition) {
      bounds.extend(livreurPosition);
      hasPoints = true;
    }

    if (hasPoints) {
      try {
        mapRef.current.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
      } catch (err) {
        console.warn('fitBounds error:', err);
      }
    }
  }, [order, isMapsLoaded, routePoints]);

  const handleUserInteraction = useCallback(() => {
    userInteractedRef.current = true;
    setAutoFollow(false);
  }, []);

  const handleRecenter = useCallback(() => {
    if (mapRef.current && livreurPosition) {
      mapRef.current.panTo(livreurPosition);
      mapRef.current.setZoom(15);
      userInteractedRef.current = false;
      setAutoFollow(true);
    }
  }, [livreurPosition]);

  const handleGoBack = useCallback(() => {
    navigate('/dashboard/commandes');
  }, [navigate]);

  // ✅ FONCTION MANQUANTE AJOUTÉE ICI
  const handleMarkAsPaid = async () => {
    if (isProcessingAction || !order) return;
    setIsProcessingAction(true);
    try {
      const response = await apiClient.patch(`/orders/${order.id}/mark-as-paid`);
      setOrder(prev => ({ ...prev, is_paid: true, status: 'livree' }));
      toast.success(response.data.message || "Commande marquée comme payée.");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Erreur lors du paiement.");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleReportIssue = async (e) => {
    e.preventDefault();
    if (!issueType || !issueDescription.trim()) {
      toast.error("Veuillez remplir le type et la description du problème.");
      return;
    }

    setIsSubmittingIssue(true);
    try {
      await apiClient.post(`/litiges`, {
        order_id: order.id,
        type: issueType,
        description: issueDescription,
        priorite: issuePriority,
      });

      toast.success("Problème signalé avec succès !");
      setOrder(prev => ({ ...prev, status: 'litige' }));
      setShowIssueModal(false);
      setIssueType('');
      setIssueDescription('');
      setIssuePriority('moyenne');
      
    } catch (error) {
      console.error("Erreur signalement:", error);
      toast.error(error.response?.data?.message || "Erreur lors du signalement du problème.");
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      en_attente: 'od-status-badge od-warning',
      assignee: 'od-status-badge od-info',
      en_cours: 'od-status-badge od-info',
      livree: 'od-status-badge od-success',
      annulee: 'od-status-badge od-danger',
      litige: 'od-status-badge od-purple'
    };
    return classes[status] || 'od-status-badge od-default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      en_attente: 'En attente', assignee: 'Assignée', en_cours: 'En cours',
      livree: 'Livrée', annulee: 'Annulée', litige: 'Litige'
    };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non spécifié';
  
    const [datePart, timePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('/');
  
    const [hours, minutes] = timePart
      ? timePart.split(':')
      : ['00', '00'];
  
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes)
    );
  
    if (isNaN(date.getTime())) {
      return 'Non spécifié';
    }
  
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) + ' à ' + date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  const getPhaseLabel = (phase) => {
    const labels = {
      start: 'Commande acceptée', accepted: 'Commande acceptée',
      toPickup: 'En route vers le départ', picked: 'Colis récupéré',
      toDropoff: 'En route vers la destination', completed: 'Livré'
    };
    return labels[phase] || phase;
  };

  const mapCenter = useMemo(() => {
    if (order?.pickup_lat && order?.dropoff_lat) {
      return {
        lat: (parseFloat(order.pickup_lat) + parseFloat(order.dropoff_lat)) / 2,
        lng: (parseFloat(order.pickup_lng) + parseFloat(order.dropoff_lng)) / 2,
      };
    }
    return { lat: 0.4162, lng: 9.4673 };
  }, [order]);

  if (isLoading) {
    return <Loader text="Chargement des détails..." fullScreen={false} size="lg" />;
  }

  if (error || !order) {
    return (
      <div className="text-center p-8 od-page-container">
        <p className="text-red-500 mb-4">{error || "Commande introuvable."}</p>
        <button onClick={handleGoBack} className="od-btn od-btn-secondary">
          <ArrowLeft size={16} className="inline mr-2" /> Retour à la liste
        </button>
      </div>
    );
  }

  const hasCoordinates = order.pickup_lat && order.pickup_lng && order.dropoff_lat && order.dropoff_lng;
  const imageUrl = order.package_photo_url || null;
  const userRole = localStorage.getItem('role');
  const isAdmin = userRole === 'admin';
  const routeColor = (currentPhase === 'toPickup' || currentPhase === 'accepted') ? '#f97316' : '#22c55e';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="od-page-container"
    >
      <div className="od-header">
        <div>
          <button onClick={handleGoBack} className="od-back-link">
            <ArrowLeft size={16} className="inline mr-2" /> Retour aux commandes
          </button>
          <h2 className="od-title">Détails de la commande {order.reference || `#${order.id}`}</h2>
          <p className="od-subtitle">Informations détaillées sur la livraison.</p>
        </div>
      </div>

      {isTrackingActive && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="od-card"
          style={{
            background: '#f0672b',
            color: 'white',
            marginBottom: '20px',
            border: 'none'
          }}
        >
          <div className="od-card-body" style={{ padding: '16px 20px' }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className="w-3 h-3 bg-green-400 rounded-full"
                    style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                  />
                  <div
                    className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full"
                    style={{ animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 font-bold text-base">
                    <Radio size={16} />
                    Suivi en direct
                  </div>
                  <div className="text-sm opacity-90">
                    {getPhaseLabel(currentPhase)}
                    {lastUpdateTime && (
                      <span className="ml-2 text-xs opacity-75">
                        • il y a {Math.floor((Date.now() - lastUpdateTime.getTime()) / 1000)}s
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {remainingMinutes !== null && (
                  <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
                    <Clock size={16} />
                    <span className="font-bold">{remainingMinutes} min</span>
                  </div>
                )}
                {!isPositionFresh && (
                  <div className="flex items-center gap-2 bg-yellow-500/30 text-yellow-100 px-3 py-2 rounded-lg">
                    <AlertTriangle size={14} />
                    <span className="text-xs font-medium">Position ancienne</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <style>{`
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
            @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
          `}</style>
        </motion.div>
      )}

      <div className="od-grid">
        <div className="od-main-col">
          {hasCoordinates ? (
            <div className="od-card" style={{ padding: '0', overflow: 'hidden', position: 'relative' }}>
              <div className="od-card-header" style={{ padding: '16px' }}>
                <h3 className="flex items-center">
                  <MapPin size={18} className="mr-2" />
                  Itinéraire de livraison
                </h3>
                <div className="flex items-center gap-2">
                  {isLoadingRoute && (
                    <span className="od-status-badge od-info flex items-center gap-1">
                      <span className="animate-spin">⟳</span> Calcul...
                    </span>
                  )}
                  {isTrackingActive && (
                    <span className="od-status-badge od-info flex items-center gap-1">
                      <Radio size={12} /> Live
                    </span>
                  )}
                </div>
              </div>

              {mapsLoadError ? (
                <div className="h-[400px] bg-gray-100 flex items-center justify-center text-red-500 text-sm p-4">
                  Impossible de charger Google Maps.
                </div>
              ) : !isMapsLoaded ? (
                <div className="h-[400px] bg-gray-100 flex items-center justify-center">
                  <Loader text="Chargement de la carte..." size="sm" />
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={12}
                    onLoad={(map) => { mapRef.current = map; }}
                    onDragStart={handleUserInteraction}
                    onZoomChanged={handleUserInteraction}
                    options={{
                      zoomControl: true,
                      streetViewControl: false,
                      mapTypeControl: false,
                      fullscreenControl: false,
                    }}
                  >
                    <MarkerF
                      position={{
                        lat: parseFloat(order.pickup_lat),
                        lng: parseFloat(order.pickup_lng)
                      }}
                      title={`Départ: ${order.pickup_name}`}
                      icon={{
                        url: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png",
                        scaledSize: new window.google.maps.Size(40, 40),
                      }}
                    />

                    <MarkerF
                      position={{
                        lat: parseFloat(order.dropoff_lat),
                        lng: parseFloat(order.dropoff_lng)
                      }}
                      title={`Arrivée: ${order.dropoff_name}`}
                      icon={{
                        url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                        scaledSize: new window.google.maps.Size(40, 40),
                      }}
                    />

                    {routePoints.length > 0 && (
                      <PolylineF
                        path={routePoints}
                        options={{
                          strokeColor: routeColor,
                          strokeOpacity: 0.85,
                          strokeWeight: 5,
                          geodesic: true,
                        }}
                      />
                    )}

                    {routePoints.length === 0 && (
                      <PolylineF
                        path={[
                          { lat: parseFloat(order.pickup_lat), lng: parseFloat(order.pickup_lng) },
                          { lat: parseFloat(order.dropoff_lat), lng: parseFloat(order.dropoff_lng) }
                        ]}
                        options={{
                          strokeColor: '#9ca3af',
                          strokeOpacity: 0.5,
                          strokeWeight: 2,
                          geodesic: true,
                          icons: [{
                            icon: {
                              path: 'M 0,-1 0,1',
                              strokeOpacity: 1,
                              strokeColor: '#9ca3af',
                              scale: 3
                            },
                            offset: '0',
                            repeat: '20px'
                          }]
                        }}
                      />
                    )}

                    {livreurPosition && (
                      <>
                        {window.google?.maps?.SymbolPath && (
                          <MarkerF
                            position={livreurPosition}
                            icon={{
                              path: window.google.maps.SymbolPath.CIRCLE,
                              scale: 20,
                              fillColor: '#3b82f6',
                              fillOpacity: 0.2,
                              strokeColor: '#3b82f6',
                              strokeOpacity: 0.5,
                              strokeWeight: 2,
                            }}
                            zIndex={1}
                          />
                        )}
                        <MarkerF
                          position={livreurPosition}
                          title={`Livreur: ${order.livreur_name || 'Livreur'}`}
                          icon={{
                            url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                            scaledSize: new window.google.maps.Size(40, 40),
                            anchor: new window.google.maps.Point(20, 40),
                          }}
                          zIndex={2}
                        />
                      </>
                    )}
                  </GoogleMap>

                  {livreurPosition && !autoFollow && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={handleRecenter}
                      style={{
                        position: 'absolute',
                        bottom: '20px',
                        right: '20px',
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        backgroundColor: '#f0672b',
                        color: 'white',
                        border: '3px solid white',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                      }}
                      title="Recentrer sur le livreur"
                    >
                      <Crosshair size={20} />
                    </motion.button>
                  )}

                  {isTrackingActive && livreurPosition && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '20px',
                        left: '20px',
                        backgroundColor: 'rgba(37, 99, 235, 0.95)',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        zIndex: 10,
                      }}
                    >
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#4ade80',
                          animation: 'pulse 1.5s ease-in-out infinite',
                        }}
                      />
                      LIVE
                    </div>
                  )}
                </div>
              )}

              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                {routePoints.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      marginBottom: '12px',
                      padding: '10px 14px',
                      backgroundColor: (currentPhase === 'toPickup' || currentPhase === 'accepted') ? '#fff7ed' : '#f0fdf4',
                      borderRadius: '10px',
                      border: `1px solid ${(currentPhase === 'toPickup' || currentPhase === 'accepted') ? '#fed7aa' : '#bbf7d0'}`,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                      <Navigation size={14} style={{ color: routeColor }} />
                      <span style={{ color: (currentPhase === 'toPickup' || currentPhase === 'accepted') ? '#ea580c' : '#16a34a' }}>
                        {formatDistance(routeDistance)}
                      </span>
                    </div>
                    <div style={{ width: '1px', height: '16px', backgroundColor: '#d1d5db' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                      <Clock size={14} style={{ color: '#6b7280' }} />
                      <span style={{ color: '#374151' }}>
                        {formatDuration(routeDuration)}
                      </span>
                    </div>
                    <div style={{ width: '1px', height: '16px', backgroundColor: '#d1d5db' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280' }}>
                      <Radio size={12} />
                      <span>{getPhaseLabel(currentPhase)}</span>
                    </div>
                    {isLoadingRoute && (
                      <div className="animate-spin" style={{ color: '#f97316', marginLeft: 'auto' }}>
                        ⟳
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-start gap-3 text-sm mb-2">
                  <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: '#f97316' }}></div>
                  <div><span className="font-medium">Départ :</span> {order.pickup_address}</div>
                </div>
                <div className="flex items-start gap-3 text-sm mb-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
                  <div><span className="font-medium">Arrivée :</span> {order.dropoff_address}</div>
                </div>
                {livreurPosition && (
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                    <div>
                      <span className="font-medium">Livreur :</span> {order.livreur_name || 'En route'}
                      {livreurHeading > 0 && (
                        <span className="text-xs text-gray-500 ml-2">
                          <Navigation size={10} className="inline" /> Cap {Math.round(livreurHeading)}°
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="od-card">
              <div className="od-card-body text-center text-gray-500 py-8">
                <MapPin size={48} className="mx-auto mb-2 opacity-50" />
                <p>Coordonnées GPS non disponibles.</p>
              </div>
            </div>
          )}

          <div className="od-card">
            <div className="od-card-header">
              <h3>Informations générales</h3>
              <span className={getStatusBadgeClass(order.status)}>
                {getStatusLabel(order.status)}
              </span>
            </div>
            <div className="od-card-body">
              <div className="od-client-section">
                <h3 className="od-section-title">Informations du client</h3>

                <div className="od-client-profile">
                  <div
                    className="od-avatar"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#f0672b',
                      backgroundColor: '#eff6ff'
                    }}
                  >
                    {order.dropoff_name
                      ? order.dropoff_name.charAt(0).toUpperCase()
                      : 'C'}
                  </div>

                  <div className="od-client-info">
                    <h4>{order.dropoff_name || 'Client inconnu'}</h4>
                    <p>
                      {order.delivery_type === 'programme'
                        ? 'Livraison programmée'
                        : 'Livraison immédiate'}
                    </p>
                  </div>

                  <div className="od-client-actions">
                    {order.livreur_phone && (
                      <a
                        href={`tel:${order.livreur_phone}`}
                        className="od-icon-btn"
                        title="Appeler"
                      >
                        <Phone size={18} />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <dl className="od-info-grid">
                <div className="od-info-item">
                  <dt className="od-label"><Truck size={14} className="inline mr-1" /> Type</dt>
                  <dd className="od-value">{order.delivery_type === 'immediat' ? 'Immédiat' : 'Programmé'}</dd>
                </div>
                <div className="od-info-item">
                  <dt className="od-label"><Package size={14} className="inline mr-1" /> Poids / Valeur</dt>
                  <dd className="od-value">
                    {order.weight || 'Non spécifié'}
                    {order.declared_value > 0 && ` • ${order.declared_value} FCFA`}
                    {order.is_fragile && (
                      <span className="od-category-badge" style={{
                        backgroundColor: '#fef3c7', color: '#d97706',
                        marginLeft: '8px', fontSize: '12px', padding: '2px 6px', borderRadius: '4px'
                      }}>
                        Fragile
                      </span>
                    )}
                  </dd>
                </div>
                <div className="od-info-item">
                  <dt className="od-label"><Calendar size={14} className="inline mr-1" /> Date</dt>
                  <dd className="od-value">{formatDate(order.created_at)}</dd>
                </div>
                <div className="od-info-item od-full-width">
                  <dt className="od-label"><MapPin size={14} className="inline mr-1" /> Adresses</dt>
                  <dd className="od-value od-addresses">
                    <div><span className="od-addr-type">Départ:</span> {order.pickup_address || 'Non spécifiée'}</div>
                    <div><span className="od-addr-type">Arrivée:</span> {order.dropoff_address || 'Non spécifiée'}</div>
                  </dd>
                </div>
                {order.instructions && (
                  <div className="od-info-item od-full-width">
                    <dt className="od-label"><FileText size={14} className="inline mr-1" /> Instructions</dt>
                    <dd className="od-value" style={{ fontStyle: 'italic', color: '#475569' }}>{order.instructions}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          <div className="od-card">
            <div className="od-card-header"><h3>Preuve de colis</h3></div>
            <div className="od-card-body">
              {imageUrl ? (
                <div className="od-files-grid">
                  <div className="od-file-item">
                    <div className="od-file-header">
                      <div className="od-file-meta">
                        <p className="od-file-name">Photo du colis</p>
                        <p className="od-file-type">image/jpeg</p>
                      </div>
                      <span className="od-file-icon-wrapper">
                        <ImageIcon size={20} className="od-icon-image" />
                      </span>
                    </div>
                    <div className="od-file-preview od-img-preview">
                      <img src={imageUrl} alt="Preuve du colis" loading="lazy" />
                    </div>
                    <div className="od-file-download" style={{ marginTop: '12px' }}>
                      <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="od-download-link">
                        <Download size={16} className="inline mr-1" /> Voir en grand
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="od-empty-files">
                  <FileText size={48} className="od-empty-icon" />
                  <p>Aucune photo du colis fournie.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="od-sidebar-col">
          <div className="od-card">
            <div className="od-card-header"><h3>Résumé de la mission</h3></div>
            <div className="od-card-body od-summary-body">
              <div className="od-summary-item">
                <span className="od-summary-label">Vendeur</span>
                {order.vendeur_company ? (
                  <Link to={`/dashboard/vendeur/${order.vendeur_id}`} className="od-summary-value cmd-vendeur-link">
                    {order.vendeur_company}
                  </Link>
                ) : (
                  <span className="od-summary-value" style={{ color: '#94a3b8' }}>N/A</span>
                )}
              </div>
              <div className="od-summary-item">
                <span className="od-summary-label">Livreur assigné</span>
                {order.livreur_name === 'Non assigné' ? (
                  <span className="od-summary-value" style={{ color: '#94a3b8' }}>Non assigné</span>
                ) : (
                  <Link to={`/dashboard/livreur/${order.livreur_id}`} className="od-summary-value cmd-livreur-link">
                    {order.livreur_name}
                  </Link>
                )}
              </div>
              {remainingMinutes !== null && isTrackingActive && (
                <div className="od-summary-item" style={{
                  background: '#eff6ff', padding: '12px',
                  borderRadius: '8px', margin: '8px -4px'
                }}>
                  <span className="od-summary-label flex items-center gap-1">
                    <Clock size={12} /> Temps restant
                  </span>
                  <span className="od-summary-value" style={{
                    color: '#f0672b', fontSize: '20px', fontWeight: 'bold'
                  }}>
                    {remainingMinutes} min
                  </span>
                </div>
              )}
              <div className="od-summary-item od-border-top">
                <span className="od-summary-label od-rating-label">Montant total</span>
                <span className="od-summary-value od-rating-value">
                  {order.total_amount > 0 ? `${order.total_amount} FCFA` : 'En calcul'}
                </span>
              </div>
            </div>
          </div>

          <div className="od-card">
            <div className="od-card-header">
              <h3 className="flex items-center" style={{ gap: '8px' }}>
                <Clock size={18} />
                Chronologie
              </h3>
            </div>
            <div className="od-card-body">
              <div className="od-timeline">
                
                {/* 1. Création de la commande */}
                <div className="od-timeline-item">
                  <div className="od-timeline-icon od-timeline-icon--blue">
                    <Calendar size={16} />
                  </div>
                  <div className="od-timeline-content">
                    <span className="od-timeline-label">Création</span>
                    <span className="od-timeline-value">
                      {order.created_at ? formatDate(order.created_at) : 'Non disponible'}
                    </span>
                  </div>
                </div>

                {/* 2. Assignation / Acceptation */}
                <div className="od-timeline-item">
                  <div className={`od-timeline-icon ${order.assigned_at ? 'od-timeline-icon--orange' : 'od-timeline-icon--gray'}`}>
                    <Truck size={16} />
                  </div>
                  <div className="od-timeline-content">
                    <span className="od-timeline-label">Assignation</span>
                    <span className="od-timeline-value">
                      {order.assigned_at ? formatDate(order.assigned_at) : 'En attente'}
                    </span>
                    {order.livreur_name && order.livreur_name !== 'Non assigné' && (
                      <span className="od-timeline-subvalue">
                        Par : {order.livreur_name}
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Livraison */}
                <div className="od-timeline-item">
                  <div className={`od-timeline-icon ${order.delivered_at ? 'od-timeline-icon--green' : 'od-timeline-icon--gray'}`}>
                    <CheckCircle size={16} />
                  </div>
                  <div className="od-timeline-content">
                    <span className="od-timeline-label">Livraison</span>
                    <span className="od-timeline-value">
                      {order.delivered_at ? formatDate(order.delivered_at) : 'En attente'}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>
          {/* 👆 FIN DE LA NOUVELLE CARTE 👆 */}

         
          <div className="od-card">
            <div className="od-card-header"><h3>Actions rapides</h3></div>
            <div className="od-card-body od-actions-body">
              {!isAdmin && order.status === 'en_cours' && (
                <button onClick={() => setShowActionModal(true)} className="od-btn od-btn-primary od-w-full">
                  <CheckCircle size={16} className="inline mr-2" /> Marquer comme livré
                </button>
              )}

              {!isAdmin && order.status !== 'litige' && order.status !== 'livree' && order.status !== 'annulee' && (
                <button 
                  onClick={() => setShowIssueModal(true)} 
                  className="od-btn od-btn-warning od-w-full"
                >
                  <AlertTriangle size={16} className="inline mr-2" /> Signaler un problème
                </button>
              )}

              {!isAdmin && (
                <button
                  onClick={handleMarkAsPaid}
                  disabled={isProcessingAction}
                  className="od-btn od-btn-warning od-w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isProcessingAction ? (
                    <span className="animate-spin mr-2">⟳</span>
                  ) : (
                    <CheckCircle size={18} className="inline mr-2" />
                  )}
                  {isProcessingAction ? 'Traitement...' : 'Marquer comme payé'}
                </button>
              )}

              <button onClick={handleGoBack} className="od-btn od-btn-secondary od-w-full">
                <ArrowLeft size={16} className="inline mr-2" /> Retour à la liste
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showActionModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="od-modal-overlay" onClick={() => setShowActionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="od-modal-content" onClick={(e) => e.stopPropagation()}
            >
              <div className="od-modal-header"><h3>Finaliser la livraison</h3></div>
              <div className="od-modal-body">
                <p className="od-modal-text">
                  Confirmer la livraison pour la commande <strong>{order.reference}</strong> ?
                </p>
                <div className="od-form-group">
                  <label className="od-form-label">Commentaire (Optionnel) :</label>
                  <textarea
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    rows={3}
                    className="od-form-textarea"
                    placeholder="Ex: Colis remis en main propre..."
                  ></textarea>
                </div>
              </div>
              <div className="od-modal-footer">
                <button onClick={() => setShowActionModal(false)} className="od-btn od-btn-secondary">
                  Annuler
                </button>
                <button
                  onClick={() => { alert('À connecter au backend'); setShowActionModal(false); }}
                  className="od-btn od-btn-primary"
                >
                  <CheckCircle size={16} className="inline mr-2" /> Confirmer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showIssueModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="od-modal-overlay" onClick={() => !isSubmittingIssue && setShowIssueModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="od-modal-content" onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '500px' }}
            >
              <div className="od-modal-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#d97706' }}>
                  <AlertTriangle size={24} />
                  <h3 style={{ margin: 0 }}>Signaler un problème</h3>
                </div>
              </div>
              
              <form onSubmit={handleReportIssue}>
                <div className="od-modal-body">
                  <p className="od-modal-text" style={{ marginBottom: '20px', color: '#475569' }}>
                    Décrivez le problème rencontré avec la commande <strong>{order.reference}</strong>. Cela alertera l'administration.
                  </p>

                  <div className="od-form-group" style={{ marginBottom: '16px' }}>
                    <label className="od-form-label">Type de problème *</label>
                    <select
                      value={issueType}
                      onChange={(e) => setIssueType(e.target.value)}
                      className="od-form-select"
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="">-- Sélectionnez un type --</option>
                      <option value="colis_endommage">Colis endommagé ou perdu</option>
                      <option value="livreur_injoignable">Livreur injoignable / Ne se présente pas</option>
                      <option value="adresse_introuvable">Adresse de livraison introuvable</option>
                      <option value="comportement">Comportement inapproprié</option>
                      <option value="autre">Autre problème</option>
                    </select>
                  </div>

                  <div className="od-form-group" style={{ marginBottom: '16px' }}>
                    <label className="od-form-label">Niveau de priorité</label>
                    <select
                      value={issuePriority}
                      onChange={(e) => setIssuePriority(e.target.value)}
                      className="od-form-select"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="basse">Basse</option>
                      <option value="moyenne">Moyenne</option>
                      <option value="haute">Haute (Urgent)</option>
                    </select>
                  </div>

                  <div className="od-form-group">
                    <label className="od-form-label">Description détaillée *</label>
                    <textarea
                      value={issueDescription}
                      onChange={(e) => setIssueDescription(e.target.value)}
                      rows={4}
                      className="od-form-textarea"
                      placeholder="Expliquez la situation avec le plus de détails possible..."
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                    ></textarea>
                  </div>
                </div>

                <div className="od-modal-footer" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button 
                    type="button"
                    onClick={() => setShowIssueModal(false)} 
                    className="od-btn od-btn-secondary"
                    disabled={isSubmittingIssue}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingIssue || !issueType || !issueDescription.trim()}
                    className="od-btn od-btn-warning"
                    style={{ opacity: (isSubmittingIssue || !issueType || !issueDescription.trim()) ? 0.6 : 1, cursor: (isSubmittingIssue || !issueType || !issueDescription.trim()) ? 'not-allowed' : 'pointer' }}
                  >
                    {isSubmittingIssue ? (
                      <>
                        <span className="animate-spin mr-2">⟳</span> Envoi en cours...
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={16} className="inline mr-2" /> Envoyer le signalement
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OrderDetailsSection;