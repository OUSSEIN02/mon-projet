import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle, Package, MapPin, Store, Truck, X } from 'lucide-react';
import apiClient from '../../../services/apiClient';
import toast from 'react-hot-toast';

const OrderDetailSection = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // État pour la modale de signalement
  const [showReportModal, setShowReportModal] = useState(false);
  const [issueType, setIssueType] = useState('colis_endommage');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/orders/${orderId}`);
      setOrderData(response.data?.data || response.data);
    } catch (err) {
      setError('Impossible de charger les détails de la commande.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error('Veuillez fournir une description du problème.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/litiges', {
        order_id: orderData.id,
        type: issueType,
        description: description.trim(),
        priorite: 'moyenne',
      });
      
      setShowReportModal(false);
      setOrderData(prev => ({ ...prev, status: 'litige' }));
      toast.success('Signalement envoyé. Notre équipe l\'examine.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Une erreur est survenue.';
      if (msg.toLowerCase().includes('déjà') || msg.toLowerCase().includes('existe')) {
        toast.error('Un signalement a déjà été enregistré pour cette commande.');
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusConfig = (status) => {
    const s = status?.toLowerCase();
    if (s === 'livree' || s === 'completed' || s === 'payee') {
      return { label: 'Livré avec succès', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.08)', icon: CheckCircle };
    }
    if (s === 'litige') {
      return { label: 'En litige', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)', icon: AlertTriangle };
    }
    return { label: `Statut : ${status}`, color: '#f97316', bg: 'rgba(249, 115, 22, 0.08)', icon: Package };
  };

  if (isLoading) return <div className="od-details-loader"><div className="spinner" /><p>Chargement...</p></div>;
  if (error) return <div className="od-details-error">{error} <button onClick={fetchOrderDetails}>Réessayer</button></div>;
  if (!orderData) return <div className="od-details-error">Aucune donnée trouvée.</div>;

  const statusConfig = getStatusConfig(orderData.status);
  const isLitige = orderData.status?.toLowerCase() === 'litige';

  return (
    <div className="od-details-container">
      {/* En-tête */}
      <div className="od-details-header">
        <button className="od-back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <h2 className="od-details-title">{orderData.reference || `Commande #${orderData.id}`}</h2>
        <button className="od-refresh-btn" onClick={fetchOrderDetails} disabled={isLoading}><RefreshCw size={18} /></button>
      </div>

      <div className="od-details-content">
        {/* Carte de Statut */}
        <div className="od-status-card" style={{ backgroundColor: statusConfig.bg, borderColor: `${statusConfig.color}33` }}>
          <div className="od-status-icon" style={{ backgroundColor: statusConfig.color }}>
            <statusConfig.icon size={22} color="white" />
          </div>
          <div className="od-status-info">
            <span className="od-status-label" style={{ color: statusConfig.color }}>{statusConfig.label}</span>
            {orderData.delivered_at && <span className="od-status-date">Le {new Date(orderData.delivered_at).toLocaleDateString('fr-FR')}</span>}
          </div>
          <div className="od-status-amount">
            <span className="od-amount-label">Montant</span>
            <span className="od-amount-value">{parseFloat(orderData.total_amount || 0).toLocaleString('fr-FR')} FCFA</span>
          </div>
        </div>

        {/* Photos */}
        <h3 className="od-section-title">Photos de la commande</h3>
        <div className="od-photo-card">
          <div className="od-photo-header">
            <div className="od-photo-icon-bg"><Package size={18} /></div>
            <div><div className="od-photo-title">Votre envoi initial</div><div className="od-photo-subtitle">Photo prise lors de la création</div></div>
          </div>
          <div className="od-photo-container">
            {orderData.package_photo_url ? (
              <img src={orderData.package_photo_url} alt="Colis" className="od-photo-img" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
            ) : null}
            <div className="od-photo-placeholder" style={{ display: orderData.package_photo_url ? 'none' : 'flex' }}>
              <span>Aucune photo</span>
            </div>
          </div>
        </div>

        {orderData.delivery_proof_photo_url && (
          <div className="od-photo-card od-proof-card">
            <div className="od-photo-header">
              <div className="od-photo-icon-bg" style={{ color: '#16a34a', backgroundColor: 'rgba(22, 163, 74, 0.1)' }}><CheckCircle size={18} /></div>
              <div><div className="od-photo-title">Preuve de livraison</div><div className="od-photo-subtitle">Photo prise par le livreur</div></div>
              <div className="od-proof-badge"><CheckCircle size={12} /> Validé</div>
            </div>
            <div className="od-photo-container">
              <img src={orderData.delivery_proof_photo_url} alt="Preuve" className="od-photo-img" />
            </div>
          </div>
        )}

        {/* Détails de la mission */}
        <h3 className="od-section-title">Détails de la mission</h3>
        <div className="od-info-card">
          <div className="od-info-row">
            <div className="od-info-icon-bg" style={{ color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)' }}><Store size={18} /></div>
            <div className="od-info-content">
              <span className="od-info-label">Expéditeur</span>
              <span className="od-info-name">{orderData.pickup_name || 'N/A'}</span>
              <span className="od-info-address">{orderData.pickup_address || 'N/A'}</span>
            </div>
          </div>
          <div className="od-divider" />
          <div className="od-info-row">
            <div className="od-info-icon-bg" style={{ color: '#16a34a', backgroundColor: 'rgba(22, 163, 74, 0.1)' }}><MapPin size={18} /></div>
            <div className="od-info-content">
              <span className="od-info-label">Destinataire</span>
              <span className="od-info-name">{orderData.dropoff_name || 'N/A'}</span>
              <span className="od-info-address">{orderData.dropoff_address || 'N/A'}</span>
            </div>
          </div>
          <div className="od-divider" />
          <div className="od-simple-row"><span>Poids</span><span>{orderData.weight ? `${orderData.weight} kg` : 'Non spécifié'}</span></div>
          <div className="od-simple-row"><span>Instructions</span><span>{orderData.instructions || 'Aucune'}</span></div>
          <div className="od-simple-row"><span>Livreur</span><span>{orderData.livreur_name || 'Non assigné'}</span></div>
        </div>
      </div>

      {/* Barre d'action fixe en bas */}
      <div className="od-bottom-bar">
        {isLitige ? (
          <button className="od-btn-disabled" disabled>
            <CheckCircle size={18} /> Problème déjà signalé et en cours d'examen
          </button>
        ) : (
          <button className="od-btn-report" onClick={() => setShowReportModal(true)}>
            <AlertTriangle size={18} /> Signaler un problème
          </button>
        )}
      </div>

      {/* Modale de signalement */}
      {showReportModal && (
        <div className="od-modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="od-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="od-modal-handle" />
            <div className="od-modal-header">
              <AlertTriangle size={24} color="#ef4444" />
              <h3>Signaler un problème</h3>
              <p>Commande {orderData.reference || `#${orderData.id}`}</p>
            </div>
            
            <form onSubmit={handleReportSubmit}>
              <div className="od-form-group">
                <label>Type de problème</label>
                <select value={issueType} onChange={(e) => setIssueType(e.target.value)} className="od-select">
                  <option value="colis_endommage">Colis endommagé ou ouvert</option>
                  <option value="colis_perdu">Colis non livré / perdu</option>
                  <option value="livreur_injoignable">Livreur injoignable</option>
                  <option value="autre">Autre problème</option>
                </select>
              </div>
              
              <div className="od-form-group">
                <label>Description détaillée</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Expliquez la situation..." 
                  rows={4} 
                  className="od-textarea"
                  required
                />
              </div>

              <button type="submit" className="od-btn-submit" disabled={isSubmitting || !description.trim()}>
                {isSubmitting ? 'Envoi en cours...' : 'Envoyer le signalement'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailSection;