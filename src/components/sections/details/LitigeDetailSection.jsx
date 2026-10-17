import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock, MapPin, Flag, Phone, MessageCircle, User } from 'lucide-react';
import apiClient from '../../../services/apiClient';
import toast from 'react-hot-toast';

const LitigeDetailSection = () => {
  const { id } = useParams(); // litigeId
  const navigate = useNavigate();

  const [litigeData, setLitigeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLitigeDetails();
  }, [id]);

  const fetchLitigeDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/litiges/${id}`);
      setLitigeData(response.data?.data || response.data);
    } catch (err) {
      setError('Impossible de charger les détails du litige.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const s = status?.toLowerCase();
    if (s === 'resolu') return { label: 'Litige résolu', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.08)', icon: CheckCircle };
    if (s === 'rejete') return { label: 'Litige rejeté', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)', icon: XCircle };
    if (s === 'en_cours') return { label: 'En cours d\'examen', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)', icon: Clock };
    return { label: 'En attente de traitement', color: '#f97316', bg: 'rgba(249, 115, 22, 0.08)', icon: AlertTriangle };
  };

  const getPriorityColor = (priority) => {
    const p = priority?.toLowerCase();
    if (p === 'haute') return '#ef4444';
    if (p === 'moyenne') return '#f97316';
    return '#6b7280';
  };

  const formatType = (type) => {
    if (!type) return 'Non spécifié';
    const types = {
      'colis_endommage': 'Colis endommagé ou ouvert',
      'colis_perdu': 'Colis non livré ou perdu',
      'livreur_injoignable': 'Livreur injoignable',
      'adresse_introuvable': 'Adresse de livraison introuvable',
      'comportement': 'Comportement inapproprié'
    };
    return types[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleCall = (phone) => {
    if (phone && phone !== 'N/A') {
      window.location.href = `tel:${phone}`;
    } else {
      toast.error('Numéro de téléphone indisponible');
    }
  };

  const handleChat = (userId, name) => {
    // Placeholder pour l'intégration du chat. 
    // Vous pouvez ici naviguer vers votre composant de chat : navigate(`/dashboard/messages?user=${userId}`)
    toast.success(`Ouverture de la discussion avec ${name}...`);
  };

  if (isLoading) return <div className="od-details-loader"><div className="spinner" /><p>Chargement...</p></div>;
  if (error) return <div className="od-details-error">{error} <button onClick={fetchLitigeDetails}>Réessayer</button></div>;
  if (!litigeData) return <div className="od-details-error">Aucune donnée trouvée.</div>;

  const statusConfig = getStatusConfig(litigeData.status);
  const priorityColor = getPriorityColor(litigeData.priority);

  return (
    <div className="od-details-container">
      <div className="od-details-header">
        <button className="od-back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <h2 className="od-details-title">Détails du litige</h2>
        <button className="od-refresh-btn" onClick={fetchLitigeDetails} disabled={isLoading}><RefreshCw size={18} /></button>
      </div>

      <div className="od-details-content">
        {/* Carte Statut & Priorité */}
        <div className="od-status-card" style={{ backgroundColor: statusConfig.bg, borderColor: `${statusConfig.color}33` }}>
          <div className="od-status-icon" style={{ backgroundColor: statusConfig.color }}>
            <statusConfig.icon size={22} color="white" />
          </div>
          <div className="od-status-info">
            <span className="od-status-label" style={{ color: statusConfig.color }}>{statusConfig.label}</span>
            <span className="od-status-date">{litigeData.date_formatted || 'Date inconnue'}</span>
          </div>
          <div className="od-priority-badge" style={{ backgroundColor: `${priorityColor}1a`, color: priorityColor, borderColor: `${priorityColor}4d` }}>
            {(litigeData.priority || 'MOYENNE').toUpperCase()}
          </div>
        </div>

        {/* Problème signalé */}
        <h3 className="od-section-title">Problème signalé</h3>
        <div className="od-info-card">
          <div className="od-info-row">
            <div className="od-info-icon-bg" style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}><AlertTriangle size={18} /></div>
            <div className="od-info-content">
              <span className="od-info-label">Type de problème</span>
              <span className="od-info-name">{formatType(litigeData.type)}</span>
            </div>
          </div>
          <div className="od-divider" />
          <div>
            <span className="od-info-label">Description détaillée</span>
            <p className="od-description-text">{litigeData.description || 'Aucune description fournie.'}</p>
          </div>
        </div>

        {/* Commande concernée */}
        <h3 className="od-section-title">Commande concernée</h3>
        <div className="od-info-card">
          <div className="od-order-header">
            <span className="od-order-ref">{litigeData.order_reference || 'Commande'}</span>
            <span className="od-order-amount">{litigeData.montant_formatted || '0 FCFA'}</span>
          </div>
          <div className="od-simple-row">
            <MapPin size={16} color="#6b7280" />
            <span>Départ</span>
            <span className="od-simple-value">{litigeData.pickup_address || 'N/A'}</span>
          </div>
          <div className="od-simple-row">
            <Flag size={16} color="#6b7280" />
            <span>Arrivée</span>
            <span className="od-simple-value">{litigeData.dropoff_address || 'N/A'}</span>
          </div>
        </div>

        {/* Parties impliquées */}
        <h3 className="od-section-title">Parties impliquées</h3>
        <div className="od-info-card">
          {/* Vendeur (avec actions) */}
          <div className="od-party-row">
            <div className="od-party-avatar" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              {litigeData.seller_avatar ? <img src={litigeData.seller_avatar} alt="Seller" /> : (litigeData.seller_name?.[0] || 'V')}
            </div>
            <div className="od-party-info">
              <span className="od-party-role">Vendeur</span>
              <span className="od-party-name">{litigeData.seller_name || 'N/A'}</span>
              {litigeData.seller_phone && litigeData.seller_phone !== 'N/A' && <span className="od-party-phone">{litigeData.seller_phone}</span>}
            </div>
            <div className="od-party-actions">
              <button className="od-action-btn" style={{ color: '#16a34a', backgroundColor: 'rgba(22, 163, 74, 0.1)' }} onClick={() => handleCall(litigeData.seller_phone)}>
                <Phone size={18} />
              </button>
              <button className="od-action-btn" style={{ color: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.1)' }} onClick={() => handleChat(litigeData.seller_user_id, litigeData.seller_name)}>
                <MessageCircle size={18} />
              </button>
            </div>
          </div>

          <div className="od-divider" />

          {/* Livreur (sans actions, comme sur mobile) */}
          <div className="od-party-row">
            <div className="od-party-avatar" style={{ backgroundColor: 'rgba(22, 163, 74, 0.1)', color: '#16a34a' }}>
              {litigeData.driver_avatar ? <img src={litigeData.driver_avatar} alt="Driver" /> : (litigeData.driver_name?.[0] || 'L')}
            </div>
            <div className="od-party-info">
              <span className="od-party-role">Livreur</span>
              <span className="od-party-name">{litigeData.driver_name || 'Non assigné'}</span>
              {litigeData.driver_phone && litigeData.driver_phone !== 'N/A' && <span className="od-party-phone">{litigeData.driver_phone}</span>}
            </div>
            <div className="od-party-actions-placeholder" /> {/* Espace pour aligner avec le vendeur */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LitigeDetailSection;