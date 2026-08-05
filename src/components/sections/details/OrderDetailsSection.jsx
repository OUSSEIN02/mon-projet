import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Calendar, Package, FileText, 
  Image as ImageIcon, Download, CheckCircle, AlertTriangle, 
  Phone, Truck
} from 'lucide-react';
import { LoadScript, GoogleMap, MarkerF } from '@react-google-maps/api';
import apiClient from '../../../services/apiClient';
import Loader from '../../../utils/Loader'; // <-- Import du Loader personnalisé

const mapContainerStyle = {
  width: '100%',
  height: '350px',
  borderRadius: '8px',
};

// URL de base pour les images (à adapter selon votre .env, ex: import.meta.env.VITE_API_URL)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const OrderDetailsSection = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionNote, setActionNote] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false); // Pour éviter les doubles clics

  useEffect(() => {
    let isMounted = true; // Pour éviter les mises à jour d'état si le composant est démonté

    const fetchOrderDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(`/orders/${orderId}`);
        if (isMounted) {
          setOrder(response.data.data);
        }
      } catch (err) {
        console.error("Erreur lors du chargement du détail:", err);
        if (isMounted) {
          setError("Impossible de charger les détails de cette commande.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }

    return () => { isMounted = false; };
  }, [orderId]);

  const handleGoBack = useCallback(() => {
    navigate('/dashboard/commandes');
  }, [navigate]);

  // Optimisation : Mise à jour locale immédiate après l'action "Marquer comme payé"
  const handleMarkAsPaid = async () => {
    if (isProcessingAction || !order) return;
    
    setIsProcessingAction(true);
    try {
      const response = await apiClient.patch(`/orders/${order.id}/mark-as-paid`);
      
      // Mise à jour optimiste de l'interface sans rechargement complet
      setOrder(prev => ({ ...prev, is_paid: true, status: 'livree' })); // Adaptez selon votre logique backend
      
      // Vous pouvez remplacer l'alert par un toast/notification si vous en avez un
      alert(response.data.message || "Commande marquée comme payée.");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Une erreur est survenue lors du paiement.");
    } finally {
      setIsProcessingAction(false);
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
    return new Date(dateString).toLocaleDateString('fr-FR', { 
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
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

  // --- REMPLACEMENT PAR LE LOADER PERSONNALISÉ ---
  if (isLoading) {
    return <Loader text="Chargement des détails de la commande..." fullScreen={false} size="lg" />;
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
  const imageUrl = order.package_photo_url ? `${BASE_URL}${order.package_photo_url}` : null;
  const userRole = localStorage.getItem('role');
  const isAdmin = userRole === 'admin';

  return (
    <LoadScript 
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "VOTRE_CLE_API_ICI"}
      onLoad={() => console.log('Google Maps chargé')}
      onError={(e) => console.error('Erreur Google Maps:', e)}
      loadingElement={<div className="h-[350px] bg-gray-100 rounded-lg flex items-center justify-center"><Loader text="Chargement de la carte..." size="sm" /></div>}
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="od-page-container"
      >
        {/* Header */}
        <div className="od-header">
          <div>
            <button onClick={handleGoBack} className="od-back-link">
              <ArrowLeft size={16} className="inline mr-2" /> Retour aux commandes
            </button>
            <h2 className="od-title">Détails de la commande {order.reference || `#${order.id}`}</h2>
            <p className="od-subtitle">Informations détaillées sur la livraison, le client et les preuves.</p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="od-grid">
          <div className="od-main-col">
            
            {/* 1. Carte de la livraison */}
            {hasCoordinates ? (
              <div className="od-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div className="od-card-header" style={{ padding: '16px' }}>
                  <h3 className="flex items-center"><MapPin size={18} className="mr-2" /> Itinéraire de livraison</h3>
                </div>
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={12}
                  options={{
                    disableDefaultUI: false,
                    zoomControl: true,
                    streetViewControl: false,
                    mapTypeControl: false,
                  }}
                >
                  <MarkerF
                    position={{ lat: parseFloat(order.pickup_lat), lng: parseFloat(order.pickup_lng) }}
                    title={`Départ: ${order.pickup_name}`}
                    icon="http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                  />
                  <MarkerF
                    position={{ lat: parseFloat(order.dropoff_lat), lng: parseFloat(order.dropoff_lng) }}
                    title={`Arrivée: ${order.dropoff_name}`}
                    icon="http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                  />
                </GoogleMap>
                
                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                  <div className="flex items-start gap-3 text-sm mb-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                    <div><span className="font-medium">Départ :</span> {order.pickup_address}</div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
                    <div><span className="font-medium">Arrivée :</span> {order.dropoff_address}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="od-card">
                <div className="od-card-body text-center text-gray-500 py-8">
                  <MapPin size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Coordonnées GPS non disponibles pour cette commande.</p>
                </div>
              </div>
            )}

            {/* 2. Informations Générales */}
            <div className="od-card">
              <div className="od-card-header">
                <h3>Informations générales</h3>
                <span className={getStatusBadgeClass(order.status)}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
              <div className="od-card-body">
                <div className="od-client-profile">
                  <div className="od-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', color: '#2563eb', backgroundColor: '#eff6ff' }}>
                    {order.dropoff_name ? order.dropoff_name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div className="od-client-info">
                    <h4>{order.dropoff_name || 'Client inconnu'}</h4>
                    <p>{order.delivery_type === 'programme' ? 'Livraison programmée' : 'Livraison immédiate'}</p>
                  </div>
                  <div className="od-client-actions">
                    {order.livreur_phone && (
                      <a href={`tel:${order.livreur_phone}`} className="od-icon-btn" title="Appeler le livreur">
                        <Phone size={18} />
                      </a>
                    )}
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
                      {order.is_fragile && <span className="od-category-badge" style={{ backgroundColor: '#fef3c7', color: '#d97706', marginLeft: '8px', fontSize: '12px', padding: '2px 6px', borderRadius: '4px' }}>Fragile</span>}
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

            {/* 3. Fichiers / Preuves */}
            <div className="od-card">
              <div className="od-card-header">
                <h3>Preuve de colis</h3>
              </div>
              <div className="od-card-body">
                {imageUrl ? (
                  <div className="od-files-grid">
                    <div className="od-file-item">
                      <div className="od-file-header">
                        <div className="od-file-meta">
                          <p className="od-file-name">Photo du colis</p>
                          <p className="od-file-type">image/jpeg</p>
                        </div>
                        <span className="od-file-icon-wrapper"><ImageIcon size={20} className="od-icon-image" /></span>
                      </div>
                      <div className="od-file-preview od-img-preview">
                        {/* OPTIMISATION : loading="lazy" pour ne pas bloquer le rendu initial */}
                        <img src={imageUrl} alt="Preuve du colis" loading="lazy" />
                      </div>
                      <div className="od-file-download" style={{ marginTop: '12px' }}>
                        <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="od-download-link">
                          <Download size={16} className="inline mr-1" /> Voir en grand / Télécharger
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="od-empty-files">
                    <FileText size={48} className="od-empty-icon" />
                    <p>Aucune photo du colis fournie pour cette commande.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Colonne Latérale */}
          <div className="od-sidebar-col">
            <div className="od-card">
              <div className="od-card-header"><h3>Résumé de la mission</h3></div>
              <div className="od-card-body od-summary-body">
                <div className="od-summary-item">
                  <span className="od-summary-label">Vendeur</span>
                  <span className="od-summary-value">{order.vendeur_company || 'N/A'}</span>
                </div>
                <div className="od-summary-item">
                  <span className="od-summary-label">Livreur assigné</span>
                  <span className="od-summary-value" style={{ color: order.livreur_name === 'Non assigné' ? '#94a3b8' : '#0f172a' }}>
                    {order.livreur_name}
                  </span>
                </div>
                <div className="od-summary-item od-border-top">
                  <span className="od-summary-label od-rating-label">Montant total</span>
                  <span className="od-summary-value od-rating-value">
                    {order.total_amount > 0 ? `${order.total_amount} FCFA` : 'En calcul'}
                  </span>
                </div>
              </div>
            </div>

            <div className="od-card">
              <div className="od-card-header"><h3>Actions rapides</h3></div>
              <div className="od-card-body od-actions-body">
              {!isAdmin && order.status === 'en_cours' && (
                  <button onClick={() => setShowActionModal(true)} className="od-btn od-btn-primary od-w-full">
                    <CheckCircle size={16} className="inline mr-2" /> Marquer comme livré
                  </button>
                )}

                {/* S'affiche UNIQUEMENT si PAS admin ET statut différent de litige et livree */}
                {!isAdmin && order.status !== 'litige' && order.status !== 'livree' && (
                  <button className="od-btn od-btn-warning od-w-full">
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

        {/* Modale d'Action */}
        <AnimatePresence>
          {showActionModal && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="od-modal-overlay" onClick={() => setShowActionModal(false)}
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="od-modal-content" onClick={(e) => e.stopPropagation()}
              >
                <div className="od-modal-header"><h3>Finaliser la livraison</h3></div>
                <div className="od-modal-body">
                  <p className="od-modal-text">Confirmer la livraison pour la commande <strong>{order.reference}</strong> ?</p>
                  <div className="od-form-group">
                    <label className="od-form-label">Commentaire de livraison (Optionnel) :</label>
                    <textarea value={actionNote} onChange={(e) => setActionNote(e.target.value)} rows={3} className="od-form-textarea" placeholder="Ex: Colis remis en main propre..."></textarea>
                  </div>
                </div>
                <div className="od-modal-footer">
                  <button onClick={() => setShowActionModal(false)} className="od-btn od-btn-secondary">Annuler</button>
                  <button onClick={() => { alert('Fonctionnalité à connecter au backend'); setShowActionModal(false); }} className="od-btn od-btn-primary">
                    <CheckCircle size={16} className="inline mr-2" /> Confirmer
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </LoadScript>
  );
};

export default OrderDetailsSection;