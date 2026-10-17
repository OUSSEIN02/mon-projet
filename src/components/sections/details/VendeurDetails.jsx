import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Mail, Phone, MapPin, Building, Calendar, 
  Star, CheckCircle, XCircle, Clock, Shield, Package, Loader2, 
  Camera, AlertTriangle, ShieldCheck, FileText
} from 'lucide-react';

import apiClient from '../../../services/apiClient';
import Loader from '../../../utils/Loader';
import toast from 'react-hot-toast';
import './VendeurDetailsSection.css';
import defaultAvatar from '../../../assets/default-avatar.jpg';

const VendeurDetails = () => {
  const { vendeurId } = useParams(); 
  const navigate = useNavigate();

  const [vendeur, setVendeur] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [actionType, setActionType] = useState(null); 
  const [actionReason, setActionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchVendeurDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('access_token');
        const response = await apiClient.get(`/dashboard/vendeurs/${vendeurId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (isMounted) {
          const raw = response.data.data;
          setVendeur({
            id: raw.id,
            nom: raw.company_name || raw.user?.name || 'Inconnu',
            email: raw.email || raw.user?.email || 'N/A',
            telephone: raw.phone || raw.user?.phone || 'N/A',
            siret: raw.siret || 'Non renseigné',
            adresse: [raw.address, raw.city, raw.country].filter(Boolean).join(', ') || 'Non renseignée',
            zone: raw.city || 'N/A',
            statut: (raw.status === 'actif' || raw.status === 'valide') ? 'actif' : 
                    (raw.status === 'en_attente' ? 'en_attente' : 'suspendu'),
            commandes: raw.orders_count || 0,
            note: raw.note_moyenne || 0,
            dateInscription: raw.created_at,
            // Mapping des photos depuis le backend
            photo: raw.selfie_path || defaultAvatar,
            idFront: raw.id_front_path || null,
            idBack: raw.id_back_path || null
          });
        }
      } catch (err) {
        console.error("Erreur chargement vendeur:", err);
        if (isMounted) setError("Impossible de charger les détails de ce vendeur.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (vendeurId) {
      fetchVendeurDetails();
    } else {
      setError("ID du vendeur manquant dans l'URL.");
      setIsLoading(false);
    }

    return () => { isMounted = false; };
  }, [vendeurId]);

  const handleGoBack = () => {
    navigate(`/dashboard/commandes`);
  };

  const handleAction = async () => {
    if (!vendeur || !actionType) return;
    setIsProcessing(true);
    
    try {
      let endpoint = '';
      let successMessage = '';

      if (actionType === 'suspend') {
        if (!actionReason.trim()) {
          toast.error("Le motif de suspension est obligatoire.");
          setIsProcessing(false);
          return;
        }
        endpoint = `/dashboard/vendeurs/${vendeur.id}/suspend`;
        successMessage = "Compte suspendu avec succès.";
      } else if (actionType === 'reactivate') {
        endpoint = `/dashboard/vendeurs/${vendeur.id}/validate`;
        successMessage = "Compte réactivé avec succès.";
      } else if (actionType === 'approve') {
        endpoint = `/dashboard/vendeurs/${vendeur.id}/validate`;
        successMessage = "Dossier approuvé et compte activé avec succès !";
      }

      const response = await apiClient.post(endpoint, {
        reason: actionReason.trim() || undefined,
        note: actionType === 'approve' ? actionReason.trim() : undefined
      });

      toast.success(response.data.message || successMessage);
      
      setVendeur(prev => ({
        ...prev,
        statut: (actionType === 'suspend') ? 'suspendu' : 'actif'
      }));
      
      closeModal();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setIsProcessing(false);
    }
  };

  const closeModal = () => {
    setActionType(null);
    setActionReason('');
  };

  const getStatusBadgeClass = (statut) => {
    const classes = {
      actif: 'vd-status-badge vd-success',
      en_attente: 'vd-status-badge vd-warning',
      suspendu: 'vd-status-badge vd-danger'
    };
    return classes[statut] || 'vd-status-badge vd-default';
  };

  const getStatusLabel = (statut) => {
    const labels = { actif: 'Actif', en_attente: 'En attente', suspendu: 'Suspendu' };
    return labels[statut] || statut;
  };

  const getStatusIcon = (statut) => {
    if (statut === 'actif') return <CheckCircle size={14} />;
    if (statut === 'en_attente') return <Clock size={14} />;
    return <XCircle size={14} />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  const getModalConfig = () => {
    switch (actionType) {
      case 'suspend':
        return {
          title: 'Suspendre le vendeur',
          color: '#dc2626',
          icon: <AlertTriangle size={20} />,
          message: `Êtes-vous sûr de vouloir suspendre le compte de <strong>${vendeur?.nom}</strong> ? Cette action limitera son accès à la plateforme.`,
          btnText: 'Confirmer la suspension',
          placeholder: 'Motif de la suspension (Obligatoire)...',
          isRequired: true
        };
      case 'reactivate':
        return {
          title: 'Réactiver le vendeur',
          color: '#16a34a',
          icon: <ShieldCheck size={20} />,
          message: `Vous êtes sur le point de réactiver le compte de <strong>${vendeur?.nom}</strong>. Il retrouvera un accès normal à la plateforme.`,
          btnText: 'Confirmer la réactivation',
          placeholder: 'Raison de la réactivation (Optionnel)...',
          isRequired: false
        };
      case 'approve':
        return {
          title: 'Approuver le dossier',
          color: '#059669',
          icon: <CheckCircle size={20} />,
          message: `Félicitations ! Vous êtes sur le point de valider les documents KYC et d'activer le compte de <strong>${vendeur?.nom}</strong>.`,
          btnText: 'Approuver et activer le compte',
          placeholder: 'Note de validation interne (Optionnel)...',
          isRequired: false
        };
      default:
        return {};
    }
  };

  if (isLoading) {
    return <Loader text="Chargement des détails du vendeur..." fullScreen={false} size="lg" />;
  }

  if (error || !vendeur) {
    return (
      <div className="vd-page-container text-center p-8">
        <p className="text-red-500 mb-4">{error || "Vendeur introuvable."}</p>
        <button onClick={handleGoBack} className="vd-btn vd-btn-secondary">
          <ArrowLeft size={16} className="inline mr-2" /> Retour à la liste
        </button>
      </div>
    );
  }

  const modalConfig = getModalConfig();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="vd-page-container"
    >
      <div className="vd-header">
        <div>
          <button onClick={handleGoBack} className="vd-back-link">
            <ArrowLeft size={16} className="inline mr-2" /> Retour 
          </button>
          <h2 className="vd-title">Détails du vendeur : {vendeur.nom}</h2>
          <p className="vd-subtitle">Informations complètes, coordonnées et performance du vendeur.</p>
        </div>
      </div>

      <div className="vd-grid">
        <div className="vd-main-col">
          
          {/* 1. Informations Générales */}
          <div className="vd-card">
            <div className="vd-card-header">
              <h3>Informations générales</h3>
              <span className={getStatusBadgeClass(vendeur.statut)}>
                {getStatusIcon(vendeur.statut)} {getStatusLabel(vendeur.statut)}
              </span>
            </div>
            <div className="vd-card-body">
              <div className="vd-profile-header">
                <div className="vd-large-avatar">
                  <img 
                    src={vendeur.photo} 
                    alt={`Photo de ${vendeur.nom}`} 
                    onError={(e) => { e.target.src = defaultAvatar; }} 
                  />
                  <div className="vd-avatar-badge" title="Photo d'identité / Selfie">
                    <Camera size={20} />
                  </div>
                </div>
                <div className="vd-profile-info">
                  <h3 className="vd-seller-name">{vendeur.nom}</h3>
                  <p className="vd-seller-siret">
                    <Building size={14} /> SIRET : {vendeur.siret}
                  </p>
                  <div className="vd-profile-actions">
                    <a href={`mailto:${vendeur.email}`} className="vd-action-btn" title="Envoyer un email">
                      <Mail size={16} /> Email
                    </a>
                    <a href={`tel:${vendeur.telephone}`} className="vd-action-btn" title="Appeler">
                      <Phone size={16} /> Appeler
                    </a>
                  </div>
                </div>
              </div>

              <dl className="vd-info-grid">
                <div className="vd-info-item vd-full-width">
                  <dt className="vd-label"><MapPin size={14} className="inline mr-2" /> Adresse du siège</dt>
                  <dd className="vd-value">{vendeur.adresse}</dd>
                </div>
                <div className="vd-info-item">
                  <dt className="vd-label"><Building size={14} className="inline mr-2" /> Zone d'activité</dt>
                  <dd className="vd-value">{vendeur.zone}</dd>
                </div>
                <div className="vd-info-item">
                  <dt className="vd-label"><Calendar size={14} className="inline mr-2" /> Date d'inscription</dt>
                  <dd className="vd-value">{formatDate(vendeur.dateInscription)}</dd>
                </div>
                <div className="vd-info-item">
                  <dt className="vd-label"><Mail size={14} className="inline mr-2" /> Email professionnel</dt>
                  <dd className="vd-value">{vendeur.email}</dd>
                </div>
                <div className="vd-info-item">
                  <dt className="vd-label"><Phone size={14} className="inline mr-2" /> Téléphone</dt>
                  <dd className="vd-value">{vendeur.telephone}</dd>
                </div>
              </dl>
            </div>
          </div>

        

          {/* 3. Activité et Performance */}
          <div className="vd-card">
            <div className="vd-card-header">
              <h3>Activité et Performance</h3>
            </div>
            <div className="vd-card-body">
              <div className="vd-info-grid">
                <div className="vd-info-item">
                  <dt className="vd-label"><Package size={14} className="inline mr-2" /> Total des commandes</dt>
                  <dd className="vd-value vd-large-value">{vendeur.commandes}</dd>
                </div>
                <div className="vd-info-item">
                  <dt className="vd-label"><Star size={14} className="inline mr-2" /> Note moyenne clients</dt>
                  <dd className="vd-value vd-large-value">
                    {vendeur.note > 0 ? `${vendeur.note} / 5` : 'Pas encore de note'}
                  </dd>
                </div>
              </div>
              
              <div className="vd-placeholder-box">
                <Package size={32} className="vd-placeholder-icon" />
                <p>Historique détaillé des commandes du vendeur</p>
                <span className="vd-placeholder-sub">Fonctionnalité à venir</span>
              </div>
            </div>
          </div>
        </div>

        {/* === COLONNE LATÉRALE (Droite) === */}
        <div className="vd-sidebar-col">
          <div className="vd-card">
            <div className="vd-card-header"><h3>Résumé du compte</h3></div>
            <div className="vd-card-body vd-summary-body">
              <div className="vd-summary-item">
                <span className="vd-summary-label">Statut actuel</span>
                <span className={`${getStatusBadgeClass(vendeur.statut)} vd-summary-badge`}>
                  {getStatusLabel(vendeur.statut)}
                </span>
              </div>
              <div className="vd-summary-item vd-border-top">
                <span className="vd-summary-label">Zone principale</span>
                <span className="vd-summary-value">{vendeur.zone}</span>
              </div>
           
            </div>
          </div>

       
        </div>
      </div>

      {/* --- MODALE D'ACTION DYNAMIQUE --- */}
      <AnimatePresence>
        {actionType && vendeur && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="vd-modal-overlay" onClick={closeModal}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="vd-modal-content" onClick={(e) => e.stopPropagation()}
            >
              <div className="vd-modal-header" style={{ background: `linear-gradient(135deg, ${modalConfig.color}, ${modalConfig.color}dd)` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {modalConfig.icon}
                  <h3>{modalConfig.title}</h3>
                </div>
              </div>
              
              <div className="vd-modal-body">
                <p className="vd-modal-text" dangerouslySetInnerHTML={{ __html: modalConfig.message }} />
                
                <div className="vd-modal-info-box">
                  <div className="vd-modal-info-row">
                    <span className="vd-row-label">SIRET :</span>
                    <span className="vd-row-value">{vendeur.siret}</span>
                  </div>
                  <div className="vd-modal-info-row">
                    <span className="vd-row-label">Statut actuel :</span>
                    <span className="vd-row-value vd-highlight">{getStatusLabel(vendeur.statut)}</span>
                  </div>
                </div>

                <div className="vd-form-group">
                  <label className="vd-form-label">
                    {actionType === 'approve' ? 'Note de validation ' : 'Motif de l\'action '}
                    {modalConfig.isRequired && <span className="vd-required">*</span>}
                  </label>
                  <textarea 
                    rows={3} 
                    className="vd-form-textarea" 
                    placeholder={modalConfig.placeholder}
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                  ></textarea>
                </div>
              </div>

              <div className="vd-modal-footer">
                <button onClick={closeModal} className="vd-btn vd-btn-secondary" disabled={isProcessing}>
                  Annuler
                </button>
                <button 
                  onClick={handleAction} 
                  className="vd-btn"
                  disabled={isProcessing}
                  style={{ backgroundColor: modalConfig.color, color: 'white' }}
                >
                  {isProcessing ? (
                    <><Loader2 size={16} className="animate-spin inline mr-2" /> Traitement...</>
                  ) : (
                    <><CheckCircle size={16} className="inline mr-2" /> {modalConfig.btnText}</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .vd-profile-header {
          display: flex;
          align-items: flex-start;
          gap: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 24px;
        }
        .vd-large-avatar {
          position: relative;
          flex-shrink: 0;
        }
        .vd-large-avatar img {
          width: 140px;
          height: 140px;
          border-radius: 12px;
          object-fit: cover;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          background-color: #f8fafc;
        }
        .vd-avatar-badge {
          position: absolute;
          bottom: -8px;
          right: -8px;
          background: #f0672b;
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .vd-profile-info {
          flex: 1;
          padding-top: 8px;
        }
        .vd-seller-name {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 8px 0;
        }
        .vd-seller-siret {
          font-size: 15px;
          color: #64748b;
          margin: 0 0 20px 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .vd-profile-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .vd-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          color: #334155;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .vd-action-btn:hover {
          background: #f0672b;
          color: white;
          border-color: #f0672b;
        }
        
        /* --- NOUVEAU : Styles pour la grille KYC --- */
        .vd-kyc-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 24px;
        }
        .vd-kyc-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .vd-kyc-label {
          font-size: 14px;
          font-weight: 600;
          color: #334155;
          display: flex;
          align-items: center;
        }
        .vd-kyc-image-box {
          width: 100%;
          aspect-ratio: 16/10;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }
        .vd-kyc-image-box:hover {
          border-color: #f0672b;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .vd-kyc-image-box:hover::after {
          content: '🔍 Agrandir';
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: rgba(0,0,0,0.7);
          color: white;
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .vd-kyc-img {
          width: 100%;
          height: 100%;
          object-fit: contain; /* Affiche l'intégralité du document sans le couper */
          background: #ffffff;
        }
        .vd-kyc-placeholder {
          color: #94a3b8;
          font-size: 14px;
          font-style: italic;
        }
        .vd-required {
          color: #dc2626;
        }

        @media (max-width: 640px) {
          .vd-profile-header {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .vd-seller-siret {
            justify-content: center;
          }
          .vd-profile-actions {
            justify-content: center;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default VendeurDetails;