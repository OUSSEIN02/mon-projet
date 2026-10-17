
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, DollarSign, Store, Truck, 
  FileText, AlertCircle, CheckCircle, Phone, MapPin, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';
import Loader from '../../../utils/Loader';
import '../../css/LitigesSection.css'; // On réutilise le même CSS

const LitigeDetailsSection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [litige, setLitige] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await apiClient.get(`/dashboard/litiges/${id}`);
        if (response.data.success) {
          setLitige(response.data.data);
        }
      } catch (err) {
        toast.error("Impossible de charger les détails du litige.");
        navigate('/dashboard/litiges');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [id, navigate]);

  const handleResolve = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir marquer ce litige comme résolu ?")) return;
    
    setIsResolving(true);
    try {
      await apiClient.patch(`/dashboard/litiges/${id}/resolve`);
      toast.success("Litige marqué comme résolu avec succès !");
      navigate('/dashboard/litiges');
    } catch (err) {
      toast.error("Erreur lors de la résolution du litige.");
    } finally {
      setIsResolving(false);
    }
  };

  if (isLoading) return <Loader text="Chargement des détails..." fullScreen={false} size="lg" />;
  if (!litige) return null;

  const getPrioriteBadge = (priorite) => {
    const badges = {
      haute: 'litige-badge-danger',
      moyenne: 'litige-badge-orange',
      basse: 'litige-badge-info'
    };
    return badges[priorite] || 'litige-badge-info';
  };

  const getStatusBadge = (statut) => {
    const badges = {
      en_attente: 'litige-badge-warning',
      en_cours: 'litige-badge-info',
      resolu: 'litige-badge-success'
    };
    return badges[statut] || 'litige-badge-warning';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="litige-section-container"
    >
      {/* Header avec bouton retour */}
      <div className="litige-section-header">
        <div>
          <button 
            onClick={() => navigate('/dashboard/litiges')} 
            className="litige-btn litige-btn-secondary litige-mb-4"
          >
            <ArrowLeft size={16} /> Retour à la liste
          </button>
          <h2 className="litige-title">Détails du litige</h2>
          <p className="litige-section-subtitle">Commande {litige.order_reference}</p>
        </div>
        <div>
          {litige.status !== 'resolu' && (
            <button 
              onClick={handleResolve} 
              disabled={isResolving}
              className="litige-btn litige-btn-success"
            >
              {isResolving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
              {isResolving ? 'Traitement...' : 'Marquer comme résolu'}
            </button>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="litige-table-container" style={{ padding: '2rem' }}>
        <div className="litige-modal-grid">
          
          {/* Colonne Gauche : Infos Commande & Montant */}
          <div className="litige-modal-col">
            <div className="litige-modal-item">
              <label className="litige-modal-label"><DollarSign size={14} /> Montant de la commande</label>
              <p className="litige-modal-value" style={{ fontSize: '1.25rem', color: '#2563eb' }}>{litige.montant_formatted}</p>
            </div>
            <div className="litige-modal-item">
              <label className="litige-modal-label"><Calendar size={14} /> Date du signalement</label>
              <p className="litige-modal-value">{litige.date_formatted}</p>
            </div>
            <div className="litige-modal-item">
              <label className="litige-modal-label"><AlertCircle size={14} /> Priorité & Statut</label>
              <div className="litige-mt-1" style={{ display: 'flex', gap: '0.5rem' }}>
                <span className={`litige-badge ${getPrioriteBadge(litige.priority)}`}>{litige.priority.toUpperCase()}</span>
                <span className={`litige-badge ${getStatusBadge(litige.status)}`}>{litige.status.replace('_', ' ').toUpperCase()}</span>
              </div>
            </div>
            <div className="litige-modal-item">
              <label className="litige-modal-label"><MapPin size={14} /> Trajet</label>
              <p className="litige-modal-value" style={{ fontSize: '0.875rem' }}>
                <strong>Départ :</strong> {litige.pickup_address}<br/>
                <strong>Arrivée :</strong> {litige.dropoff_address}
              </p>
            </div>
          </div>

          {/* Colonne Droite : Parties Impliquées */}
          <div className="litige-modal-col">
            <div className="litige-modal-item">
              <label className="litige-modal-label"><Store size={14} /> Vendeur</label>
              <p className="litige-modal-value">{litige.seller_name}</p>
              <p className="litige-text-muted" style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={12} /> {litige.seller_phone}
              </p>
            </div>
            <div className="litige-modal-item">
              <label className="litige-modal-label"><Truck size={14} /> Livreur</label>
              <p className="litige-modal-value">{litige.driver_name}</p>
              <p className="litige-text-muted" style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={12} /> {litige.driver_phone}
              </p>
            </div>
          </div>
        </div>

        {/* Section Description (Pleine largeur) */}
        <div className="litige-modal-description-box" style={{ marginTop: '2rem' }}>
          <label className="litige-modal-label litige-mb-2">
            <FileText size={14} /> Description du problème : <span style={{ color: '#2563eb' }}>{litige.type}</span>
          </label>
          <p className="litige-modal-description-text" style={{ fontSize: '1rem', lineHeight: '1.7' }}>
            {litige.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default LitigeDetailsSection;