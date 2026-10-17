import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Mail, Phone, MapPin, Truck, Star, 
  CheckCircle, XCircle, Clock, Shield, Award, TrendingUp, Timer, User,
  Download, ExternalLink, AlertTriangle, Camera, FileText, ShieldCheck,
  MessageSquare // <-- AJOUT : Icône pour la messagerie
} from 'lucide-react';

import apiClient from '../../../services/apiClient';
import Loader from '../../../utils/Loader';
import toast from 'react-hot-toast';
import defaultAvatar from '../../../assets/default-avatar.jpg';

const LivreurDetailsSection = () => {
  const { livreurId } = useParams(); 
  const navigate = useNavigate();

  const [livreur, setLivreur] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Types d'action : 'approve', 'reject', 'assign', 'suspend', 'reactivate', null
  const [actionType, setActionType] = useState(null); 
  const [actionReason, setActionReason] = useState('');
  const [commandeId, setCommandeId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchLivreurDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('access_token');
        const response = await apiClient.get(`/dashboard/livreurs/${livreurId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (isMounted) setLivreur(response.data.data);
      } catch (err) {
        console.error("Erreur chargement livreur:", err);
        if (isMounted) setError("Impossible de charger les détails de ce livreur.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (livreurId) fetchLivreurDetails();
    else {
      setError("ID du livreur manquant.");
      setIsLoading(false);
    }

    return () => { isMounted = false; };
  }, [livreurId]);

  const handleGoBack = useCallback(() => navigate('/dashboard/livreurs'), [navigate]);

  // --- NOUVEAU : Fonction pour démarrer une conversation ---
  const handleStartChat = async () => {
    try {
      // On récupère l'ID de l'utilisateur lié au livreur
      const recipientId = livreur.user_id || livreur.user?.id;
      
      if (!recipientId) {
        toast.error("ID utilisateur du livreur introuvable.");
        return;
      }
      
      setIsProcessing(true);
      const response = await apiClient.post('/dashboard/messages/start', {
        recipient_id: recipientId
      });
      
      toast.success("Conversation ouverte avec succès !");
      
      // Redirection vers la page de messagerie avec l'ID de conversation en paramètre
      navigate(`/dashboard/messages?conversation=${response.data.conversation_id}`);
      
    } catch (error) {
      console.error("Erreur lors du démarrage de la conversation:", error);
      toast.error(error.response?.data?.message || "Impossible de démarrer la conversation.");
    } finally {
      setIsProcessing(false);
    }
  };

  const closeModal = () => {
    setActionType(null);
    setActionReason('');
    setCommandeId('');
  };

  const handleAction = async () => {
    if (!livreur || !actionType) return;
    setIsProcessing(true);
    
    try {
      let endpoint = '';
      let successMessage = '';
      let payload = {};

      if (actionType === 'approve') {
        endpoint = `/dashboard/livreurs/${livreur.id}/validate`;
        successMessage = "Livreur validé avec succès !";
      } else if (actionType === 'reject') {
        if (!actionReason.trim()) {
          toast.error("Veuillez préciser la raison du rejet.");
          setIsProcessing(false);
          return;
        }
        endpoint = `/dashboard/livreurs/${livreur.id}/reject`;
        payload = { reason: actionReason };
        successMessage = "Candidature rejetée.";
      } else if (actionType === 'assign') {
        if (!commandeId.trim()) {
          toast.error("Veuillez saisir un ID de commande valide.");
          setIsProcessing(false);
          return;
        }
        endpoint = `/dashboard/livreurs/${livreur.id}/assign-commande`;
        payload = { commande_id: commandeId };
        successMessage = "Commande attribuée avec succès !";
      } else if (actionType === 'suspend') {
        if (!actionReason.trim()) {
          toast.error("Le motif de suspension est obligatoire.");
          setIsProcessing(false);
          return;
        }
        endpoint = `/dashboard/livreurs/${livreur.id}/suspend`;
        payload = { reason: actionReason };
        successMessage = "Compte du livreur suspendu avec succès.";
      } else if (actionType === 'reactivate') {
        endpoint = `/dashboard/livreurs/${livreur.id}/validate`;
        payload = { reason: actionReason || "Réactivation administrative" };
        successMessage = "Compte du livreur réactivé avec succès.";
      }

      const res = await apiClient.post(endpoint, payload);
      toast.success(res.data.message || successMessage);
      
      // Mise à jour optimiste du statut
      if (actionType === 'approve') setLivreur(prev => ({ ...prev, status: 'valide' }));
      if (actionType === 'reject') setLivreur(prev => ({ ...prev, status: 'rejete' }));
      if (actionType === 'suspend') setLivreur(prev => ({ ...prev, status: 'suspendu' }));
      if (actionType === 'reactivate') setLivreur(prev => ({ ...prev, status: 'valide' }));
      
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusClass = (status) => {
    const map = {
      en_attente: 'ld-status-badge ld-warning',
      valide: 'ld-status-badge ld-success',
      actif: 'ld-status-badge ld-success',
      suspendu: 'ld-status-badge ld-danger',
      rejete: 'ld-status-badge ld-danger',
    };
    return map[status] || 'ld-status-badge ld-default';
  };

  const getStatusLabel = (status) => {
    const map = { en_attente: 'En attente', valide: 'Validé', actif: 'Disponible', suspendu: 'Suspendu', rejete: 'Rejeté' };
    return map[status] || status;
  };

  const getStatusIcon = (status) => {
    if (status === 'valide' || status === 'actif') return <CheckCircle size={14} />;
    if (status === 'en_attente') return <Clock size={14} />;
    return <XCircle size={14} />;
  };

  const formatZones = (zones) => {
    if (!zones) return "Aucune zone";
    try {
      const parsed = typeof zones === "string" ? JSON.parse(zones) : zones;
      return Array.isArray(parsed) ? parsed.join(", ") : "Aucune zone";
    } catch (e) {
      return "Aucune zone";
    }
  };
  
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getModalConfig = () => {
    switch (actionType) {
      case 'approve':
        return {
          title: 'Valider le livreur',
          color: '#059669',
          icon: <ShieldCheck size={20} />,
          message: `Félicitations ! Vous êtes sur le point de valider le dossier de <strong>${livreur?.user?.name}</strong>. Il pourra alors recevoir des commandes.`,
          btnText: 'Confirmer la validation',
          placeholder: 'Note de validation interne (Optionnel)...',
          isRequired: false
        };
      case 'reject':
        return {
          title: 'Rejeter la candidature',
          color: '#dc2626',
          icon: <AlertTriangle size={20} />,
          message: `Êtes-vous sûr de vouloir rejeter la candidature de <strong>${livreur?.user?.name}</strong> ? Cette action est irréversible.`,
          btnText: 'Confirmer le rejet',
          placeholder: 'Motif du rejet (Obligatoire)...',
          isRequired: true
        };
      case 'suspend':
        return {
          title: 'Suspendre le livreur',
          color: '#dc2626',
          icon: <AlertTriangle size={20} />,
          message: `Êtes-vous sûr de vouloir suspendre le compte de <strong>${livreur?.user?.name}</strong> ? Il ne pourra plus recevoir de nouvelles commandes jusqu'à réactivation.`,
          btnText: 'Confirmer la suspension',
          placeholder: 'Motif de la suspension (Obligatoire)...',
          isRequired: true
        };
      case 'reactivate':
        return {
          title: 'Réactiver le livreur',
          color: '#16a34a',
          icon: <ShieldCheck size={20} />,
          message: `Vous êtes sur le point de réactiver le compte de <strong>${livreur?.user?.name}</strong>. Il retrouvera un accès normal à la plateforme.`,
          btnText: 'Confirmer la réactivation',
          placeholder: 'Raison de la réactivation (Optionnel)...',
          isRequired: false
        };
      case 'assign':
        return {
          title: 'Attribuer une commande',
          color: '#2563eb',
          icon: <Shield size={20} />,
          message: `Saisissez l'identifiant de la commande à assigner immédiatement à <strong>${livreur?.user?.name}</strong>.`,
          btnText: 'Attribuer la commande',
          placeholder: 'Ex: CMD-1258',
          isRequired: true,
          isAssign: true
        };
      default:
        return {};
    }
  };

  if (isLoading) return <Loader text="Chargement du dossier livreur..." fullScreen={false} size="lg" />;
  
  if (error || !livreur) {
    return (
      <div className="ld-page-container text-center p-8">
        <p className="text-red-500 mb-4">{error || "Livreur introuvable."}</p>
        <button onClick={handleGoBack} className="ld-btn ld-btn-secondary">
          <ArrowLeft size={16} className="inline mr-2" /> Retour à la liste
        </button>
      </div>
    );
  }

  const nomComplet = livreur.user?.name || 'Inconnu';
  const email = livreur.user?.email || 'N/A';
  const telephone = livreur.user?.phone || 'N/A';
  const isPending = livreur.status === 'en_attente';
  const modalConfig = getModalConfig();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ld-page-container">
      
      {/* Header */}
      <div className="ld-header">
        <div>
          <button onClick={handleGoBack} className="ld-back-link">
            <ArrowLeft size={16} className="inline mr-2" /> Retour aux livreurs
          </button>
          <h2 className="ld-title">Détails du livreur : {nomComplet}</h2>
          <p className="ld-subtitle">Analyse complète du dossier, documents et performance.</p>
        </div>
      </div>

      {isPending && (
        <div className="ld-alert ld-alert-warning">
          <AlertTriangle size={24} />
          <div>
            <strong>Dossier en attente de validation</strong>
            <p>Veuillez vérifier les documents d'identité et du véhicule ci-dessous avant d'approuver ou de rejeter la candidature.</p>
          </div>
        </div>
      )}

      <div className="ld-grid">
        {/* === COLONNE PRINCIPALE (Gauche) === */}
        <main className="ld-main-col">
          
          {/* 1. Informations Générales */}
          <div className="ld-card">
            <div className="ld-card-header">
              <h3>Informations personnelles</h3>
              <span className={getStatusClass(livreur.status)}>
                {getStatusIcon(livreur.status)} {getStatusLabel(livreur.status)}
              </span>
            </div>
            <div className="ld-card-body">
              <div className="ld-profile-header">
                <div className="ld-large-avatar">
                  <img 
                    src={livreur.photo_identite_path || defaultAvatar} 
                    alt={`Photo de ${nomComplet}`} 
                    onError={(e) => { e.target.src = defaultAvatar; }} 
                  />
                  <div className="ld-avatar-badge" title="Photo de profil / Selfie">
                    <Camera size={20} />
                  </div>
                </div>
                <div className="ld-profile-info">
                  <h3 className="ld-seller-name">{nomComplet}</h3>
                  <p className="ld-seller-siret">
                    <User size={14} /> ID Livreur : #{livreur.id}
                  </p>
                  <div className="ld-profile-actions">
                    <a href={`mailto:${email}`} className="ld-action-btn" title="Envoyer un email">
                      <Mail size={16} /> Email
                    </a>
                    <a href={`tel:${telephone}`} className="ld-action-btn" title="Appeler">
                      <Phone size={16} /> Appeler
                    </a>
                  </div>
                </div>
              </div>

              <dl className="ld-info-grid">
                <div className="ld-info-item">
                  <dt className="ld-label"><Mail size={14} className="inline mr-2" /> Email</dt>
                  <dd className="ld-value">{email}</dd>
                </div>
                <div className="ld-info-item">
                  <dt className="ld-label"><Phone size={14} className="inline mr-2" /> Téléphone / WhatsApp</dt>
                  <dd className="ld-value">{telephone}</dd>
                </div>
                <div className="ld-info-item">
                  <dt className="ld-label"><Clock size={14} className="inline mr-2" /> Inscrit le</dt>
                  <dd className="ld-value">{formatDate(livreur.created_at)}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* 2. Documents d'identité et Véhicule (GRAND FORMAT) */}
          <div className="ld-card">
            <div className="ld-card-header">
              <h3>Documents d'identité & Véhicule</h3>
            </div>
            <div className="ld-card-body">
              <div className="ld-kyc-grid">
                <div className="ld-kyc-item">
                  <span className="ld-kyc-label"><Camera size={14} className="inline mr-2" /> Photo d'identité (Selfie)</span>
                  <div className="ld-kyc-image-box" onClick={() => livreur.photo_identite_path && window.open(livreur.photo_identite_path, '_blank')} title="Cliquez pour agrandir">
                    {livreur.photo_identite_path ? <img src={livreur.photo_identite_path} alt="Selfie" className="ld-kyc-img" /> : <div className="ld-kyc-placeholder">Non fourni</div>}
                  </div>
                </div>
                <div className="ld-kyc-item">
                  <span className="ld-kyc-label"><FileText size={14} className="inline mr-2" /> Pièce d'identité</span>
                  <div className="ld-kyc-image-box" onClick={() => livreur.photo_piece_identite_url && window.open(livreur.photo_piece_identite_url, '_blank')} title="Cliquez pour agrandir">
                    {livreur.photo_piece_identite_url ? <img src={livreur.photo_piece_identite_url} alt="Pièce d'identité" className="ld-kyc-img" /> : <div className="ld-kyc-placeholder">Non fourni</div>}
                  </div>
                </div>
                <div className="ld-kyc-item">
                  <span className="ld-kyc-label"><Truck size={14} className="inline mr-2" /> Photo du véhicule</span>
                  <div className="ld-kyc-image-box" onClick={() => livreur.photo_moto_path && window.open(livreur.photo_moto_path, '_blank')} title="Cliquez pour agrandir">
                    {livreur.photo_moto_path ? <img src={livreur.photo_moto_path} alt="Véhicule" className="ld-kyc-img" /> : <div className="ld-kyc-placeholder">Non fourni</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Véhicule & Performance */}
          <div className="ld-card">
            <div className="ld-card-header">
              <h3>Véhicule & Performance</h3>
            </div>
            <div className="ld-card-body">
              <dl className="ld-info-grid ld-info-grid-3">
                <div className="ld-info-item">
                  <dt className="ld-label"><Truck size={14} className="inline mr-2" /> Numéro de plaque</dt>
                  <dd className="ld-value ld-plate">{livreur.numero_plaque || 'N/A'}</dd>
                </div>
                <div className="ld-info-item">
                  <dt className="ld-label"><Award size={14} className="inline mr-2" /> État du véhicule</dt>
                  <dd className="ld-value">
                    <span className={`ld-pill ld-pill-${livreur.etat_moto}`}>
                      {livreur.etat_moto ? livreur.etat_moto.charAt(0).toUpperCase() + livreur.etat_moto.slice(1) : 'N/A'}
                    </span>
                  </dd>
                </div>
                <div className="ld-info-item">
                  <dt className="ld-label"><TrendingUp size={14} className="inline mr-2" /> Expérience</dt>
                  <dd className="ld-value">
                    {livreur.experience === 'oui' ? (
                      <span className="ld-text-success"><CheckCircle size={14} className="inline mr-1" /> Oui</span>
                    ) : (
                      <span className="ld-text-danger"><XCircle size={14} className="inline mr-1" /> Non</span>
                    )}
                  </dd>
                </div>
              </dl>

              <div className="ld-stats-row" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>
                <div className="ld-stat-box">
                  <span className="ld-stat-number">{livreur.livraisons_count ?? 0}</span>
                  <span className="ld-stat-label">Livraisons</span>
                </div>
                <div className="ld-stat-box">
                  <span className="ld-stat-number">
                      {livreur.note_moyenne ?? 'N/A'}
                  </span>
                  <span className="ld-stat-label">
                      Note / 5
                  </span>
              </div>
                            
              </div>
            </div>
          </div>
        </main>

        {/* === COLONNE LATÉRALE (Droite) === */}
        <aside className="ld-sidebar-col">
          <div className="ld-card">
            <div className="ld-card-header"><h3>Résumé du compte</h3></div>
            <div className="ld-card-body ld-summary-body">
              <div className="ld-summary-row">
                <span className="ld-summary-label">Statut actuel</span>
                <span className={`${getStatusClass(livreur.status)} ld-summary-badge`}>
                  {getStatusLabel(livreur.status)}
                </span>
              </div>
              <div className="ld-summary-row ld-border-top">
                <span className="ld-summary-label">Zones de livraison</span>
                <span className="ld-summary-value">{formatZones(livreur.zones_livraison)}</span>
              </div>
              <div className="ld-summary-row ld-border-top">
                <span className="ld-summary-label">Véhicule</span>
                <span className="ld-summary-value">{livreur.numero_plaque || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="ld-card">
            <div className="ld-card-header"><h3>Actions rapides</h3></div>
            <div className="ld-card-body ld-actions-body">
              
              {/* Actions si en attente */}
              {isPending && (
                <>
                  <button onClick={() => setActionType('approve')} className="ld-btn ld-w-full" style={{ backgroundColor: '#059669', color: 'white', marginBottom: '12px' }}>
                    <ShieldCheck size={16} className="inline mr-2" /> Valider le dossier
                  </button>
                  <button onClick={() => setActionType('reject')} className="ld-btn ld-w-full" style={{ backgroundColor: '#dc2626', color: 'white', marginBottom: '12px' }}>
                    <XCircle size={16} className="inline mr-2" /> Rejeter la candidature
                  </button>
                </>
              )}

              {/* Actions si validé/actif ou suspendu (mais pas rejeté) */}
              {!isPending && livreur.status !== 'rejete' && (
                <>
                  <button 
                    onClick={() => setActionType(livreur.status === 'suspendu' ? 'reactivate' : 'suspend')} 
                    className="ld-btn ld-w-full"
                    style={{ 
                      backgroundColor: livreur.status === 'suspendu' ? '#16a34a' : '#dc2626', 
                      color: 'white', 
                      marginBottom: '12px' 
                    }}
                  >
                    <Shield size={16} className="inline mr-2" /> 
                    {livreur.status === 'suspendu' ? 'Réactiver le compte' : 'Suspendre le compte'}
                  </button>

                  <button onClick={() => setActionType('assign')} className="ld-btn ld-w-full" style={{ backgroundColor: '#2563eb', color: 'white', marginBottom: '12px' }}>
                    <Shield size={16} className="inline mr-2" /> Attribuer une commande
                  </button>

                  {/* <-- NOUVEAU : Bouton pour contacter le livreur --> */}
                  <button 
                    onClick={handleStartChat} 
                    className="ld-btn ld-w-full" 
                    disabled={isProcessing}
                    style={{ backgroundColor: '#f0672b', color: 'white', marginBottom: '12px' }}
                  >
                    {isProcessing ? (
                      <><span className="ld-spinner" style={{ borderColor: 'white', borderTopColor: 'transparent' }} /> Ouverture...</>
                    ) : (
                      <><MessageSquare size={16} className="inline mr-2" /> Contacter ce livreur</>
                    )}
                  </button>
                </>
              )}
              
              <a href={`mailto:${email}`} className="ld-btn ld-btn-secondary ld-w-full" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <Mail size={16} className="inline mr-2" /> Envoyer un email
              </a>
              
              <button onClick={handleGoBack} className="ld-btn ld-btn-secondary ld-w-full">
                <ArrowLeft size={16} className="inline mr-2" /> Retour à la liste
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* --- MODALE D'ACTION DYNAMIQUE (Unifiée) --- */}
      <AnimatePresence>
        {actionType && livreur && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="ld-modal-overlay" onClick={closeModal}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="ld-modal-content" onClick={(e) => e.stopPropagation()}
            >
              <div className="ld-modal-header" style={{ background: `linear-gradient(135deg, ${modalConfig.color}, ${modalConfig.color}dd)` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {modalConfig.icon}
                  <h3>{modalConfig.title}</h3>
                </div>
              </div>
              
              <div className="ld-modal-body">
                <p className="ld-modal-text" dangerouslySetInnerHTML={{ __html: modalConfig.message }} />
                
                <div className="ld-modal-info-box">
                  <div className="ld-modal-info-row">
                    <span className="ld-row-label">Plaque véhicule :</span>
                    <span className="ld-row-value">{livreur.numero_plaque || 'N/A'}</span>
                  </div>
                  <div className="ld-modal-info-row">
                    <span className="ld-row-label">Zones :</span>
                    <span className="ld-row-value ld-highlight">{formatZones(livreur.zones_livraison)}</span>
                  </div>
                </div>

                <div className="ld-form-group">
                  <label className="ld-form-label">
                    {modalConfig.isAssign ? 'ID de la commande ' : (actionType === 'approve' || actionType === 'reactivate' ? 'Note / Raison ' : 'Motif de l\'action ')}
                    {modalConfig.isRequired && <span className="ld-required">*</span>}
                  </label>
                  {modalConfig.isAssign ? (
                    <input 
                      type="text" 
                      className="ld-form-input-text" 
                      placeholder={modalConfig.placeholder}
                      value={commandeId}
                      onChange={(e) => setCommandeId(e.target.value)}
                    />
                  ) : (
                    <textarea 
                      rows={3} 
                      className="ld-form-textarea" 
                      placeholder={modalConfig.placeholder}
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                    ></textarea>
                  )}
                </div>
              </div>

              <div className="ld-modal-footer">
                <button onClick={closeModal} className="ld-btn ld-btn-secondary" disabled={isProcessing}>
                  Annuler
                </button>
                <button 
                  onClick={handleAction} 
                  className="ld-btn"
                  disabled={isProcessing}
                  style={{ backgroundColor: modalConfig.color, color: 'white' }}
                >
                  {isProcessing ? (
                    <><span className="ld-spinner" /> Traitement...</>
                  ) : (
                    <><CheckCircle size={16} className="inline mr-2" /> {modalConfig.btnText}</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CSS UNIQUE ET PRÉFIXÉ (.ld-) --- */}
      <style>{`
        .ld-page-container { max-width: 1200px; margin: 0 auto; padding: 24px; }
        .ld-header { margin-bottom: 24px; }
        .ld-back-link { display: inline-flex; align-items: center; gap: 8px; color: #64748b; font-size: 14px; font-weight: 500; background: none; border: none; cursor: pointer; margin-bottom: 8px; transition: color 0.2s; }
        .ld-back-link:hover { color: #0f172a; }
        .ld-title { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; }
        .ld-subtitle { color: #64748b; font-size: 14px; margin: 0; }
        .ld-alert { display: flex; gap: 16px; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
        .ld-alert-warning { background: #fff7ed; border: 1px solid #ffedd5; color: #9a3412; }
        .ld-alert-warning strong { display: block; margin-bottom: 4px; }
        .ld-alert-warning p { margin: 0; font-size: 14px; opacity: 0.9; }
        .ld-grid { display: grid; grid-template-columns: 1fr 320px; gap: 24px; }
        .ld-main-col { display: flex; flex-direction: column; gap: 24px; }
        .ld-sidebar-col { display: flex; flex-direction: column; gap: 24px; }
        .ld-card { background: white; border-radius: 12px; border: 1px solid #f1f5f9; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .ld-card-header { padding: 20px 24px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
        .ld-card-header h3 { font-size: 16px; font-weight: 600; color: #0f172a; margin: 0; }
        .ld-card-body { padding: 24px; }
        .ld-status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
        .ld-success { background: #dcfce7; color: #166534; }
        .ld-warning { background: #fef3c7; color: #92400e; }
        .ld-danger { background: #fee2e2; color: #991b1b; }
        .ld-default { background: #f1f5f9; color: #475569; }
        .ld-profile-header { display: flex; align-items: flex-start; gap: 24px; padding-bottom: 24px; border-bottom: 1px solid #f1f5f9; margin-bottom: 24px; }
        .ld-large-avatar { position: relative; flex-shrink: 0; }
        .ld-large-avatar img { width: 140px; height: 140px; border-radius: 12px; object-fit: cover; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.1); background-color: #f8fafc; }
        .ld-avatar-badge { position: absolute; bottom: -8px; right: -8px; background: #f0672b; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
        .ld-profile-info { flex: 1; padding-top: 8px; }
        .ld-seller-name { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; }
        .ld-seller-siret { font-size: 15px; color: #64748b; margin: 0 0 20px 0; display: flex; align-items: center; gap: 6px; }
        .ld-profile-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .ld-action-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; color: #334155; text-decoration: none; font-size: 14px; font-weight: 500; transition: all 0.2s; }
        .ld-action-btn:hover { background: #f0672b; color: white; border-color: #f0672b; }
        .ld-info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .ld-info-grid-3 { grid-template-columns: repeat(3, 1fr); }
        .ld-info-item { display: flex; flex-direction: column; gap: 4px; }
        .ld-label { font-size: 13px; font-weight: 500; color: #64748b; display: flex; align-items: center; }
        .ld-value { font-size: 15px; font-weight: 600; color: #0f172a; margin: 0; }
        .ld-plate { font-family: monospace; background: #f1f5f9; padding: 4px 8px; border-radius: 4px; display: inline-block; }
        .ld-text-success { color: #16a34a; display: flex; align-items: center; }
        .ld-text-danger { color: #dc2626; display: flex; align-items: center; }
        .ld-pill { padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; background: #f1f5f9; color: #475569; }
        .ld-pill-bon { background: #dcfce7; color: #166534; }
        .ld-pill-moyen { background: #fef3c7; color: #92400e; }
        .ld-pill-mauvais { background: #fee2e2; color: #991b1b; }
        .ld-kyc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px; }
        .ld-kyc-item { display: flex; flex-direction: column; gap: 8px; }
        .ld-kyc-label { font-size: 14px; font-weight: 600; color: #334155; display: flex; align-items: center; }
        .ld-kyc-image-box { width: 100%; aspect-ratio: 16/10; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; background: #f8fafc; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; position: relative; }
        .ld-kyc-image-box:hover { border-color: #f0672b; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .ld-kyc-image-box:hover::after { content: '🔍 Agrandir'; position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.7); color: white; font-size: 11px; padding: 4px 8px; border-radius: 4px; }
        .ld-kyc-img { width: 100%; height: 100%; object-fit: contain; background: #ffffff; }
        .ld-kyc-placeholder { color: #94a3b8; font-size: 14px; font-style: italic; }
        .ld-stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .ld-stat-box { text-align: center; padding: 16px; background: #f8fafc; border-radius: 8px; }
        .ld-stat-number { display: block; font-size: 24px; font-weight: 700; color: #0f172a; }
        .ld-stat-label { font-size: 12px; color: #64748b; font-weight: 500; }
        .ld-summary-body { padding: 0; }
        .ld-summary-row { padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
        .ld-summary-row.ld-border-top { border-top: 1px solid #f1f5f9; }
        .ld-summary-label { color: #64748b; font-weight: 500; }
        .ld-summary-value { color: #0f172a; font-weight: 600; text-align: right; }
        .ld-summary-badge { padding: 4px 10px; font-size: 12px; }
        .ld-actions-body { display: flex; flex-direction: column; gap: 0; }
        .ld-btn { width: 100%; padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; border: none; background: #f1f5f9; color: #0f172a; }
        .ld-btn:hover { background: #e2e8f0; }
        .ld-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .ld-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .ld-modal-content { background: white; border-radius: 12px; width: 100%; max-width: 500px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); overflow: hidden; }
        .ld-modal-header { padding: 20px 24px; color: white; }
        .ld-modal-header h3 { margin: 0; font-size: 18px; font-weight: 600; }
        .ld-modal-body { padding: 24px; }
        .ld-modal-text { font-size: 15px; color: #334155; margin: 0 0 20px 0; line-height: 1.5; }
        .ld-modal-info-box { background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
        .ld-modal-info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
        .ld-modal-info-row:last-child { margin-bottom: 0; }
        .ld-row-label { color: #64748b; }
        .ld-row-value { color: #0f172a; font-weight: 600; }
        .ld-row-value.ld-highlight { color: #f0672b; }
        .ld-form-group { margin-bottom: 0; }
        .ld-form-label { display: block; font-size: 14px; font-weight: 500; color: #0f172a; margin-bottom: 6px; }
        .ld-required { color: #dc2626; }
        .ld-form-textarea, .ld-form-input-text { width: 100%; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; font-family: inherit; transition: border-color 0.2s; }
        .ld-form-textarea:focus, .ld-form-input-text:focus { outline: none; border-color: #f0672b; box-shadow: 0 0 0 3px rgba(240, 103, 43, 0.1); }
        .ld-modal-footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 12px; }
        .ld-modal-footer .ld-btn { width: auto; padding: 10px 20px; }
        .ld-spinner { width: 16px; height: 16px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: ld-spin 0.8s linear infinite; }
        @keyframes ld-spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) { .ld-grid { grid-template-columns: 1fr; } .ld-info-grid, .ld-info-grid-3, .ld-stats-row { grid-template-columns: 1fr; } }
        @media (max-width: 640px) { .ld-profile-header { flex-direction: column; align-items: center; text-align: center; } .ld-seller-siret { justify-content: center; } .ld-profile-actions { justify-content: center; } }
      `}</style>
    </motion.div>
  );
};

export default LivreurDetailsSection;