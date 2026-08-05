import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, MapPin, Truck, User, CheckCircle, AlertTriangle, 
  Search, Package, Star, TrendingUp, X, Loader2
} from 'lucide-react';

import apiClient from '../../../services/apiClient';
import Loader from '../../../utils/Loader';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const AttributionsSection = () => {
  // États pour les données dynamiques
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // États pour l'UI
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedLivreurId, setSelectedLivreurId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- 1. CHARGEMENT DES DONNÉES ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Appel parallèle pour plus de rapidité (adaptez les URLs selon votre backend)
        const [ordersRes, driversRes] = await Promise.all([
          apiClient.get('/dashboard/orders/pending-attribution'),
          apiClient.get('/dashboard/livreurs/disponibles')
        ]);

        const formatWaitTime = (minutes) => {
          const totalMinutes = Math.floor(Number(minutes) || 0);
        
          const days = Math.floor(totalMinutes / (60 * 24));
          const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
          const mins = totalMinutes % 60;
        
          if (days > 0) {
            return `${days}j ${hours}h ${mins}min`;
          }
        
          if (hours > 0) {
            return `${hours}h ${mins}min`;
          }
        
          return `${mins} min`;
        };
        // Formatage des commandes
        const formattedOrders = (ordersRes.data.data || []).map(order => ({
          id: order.reference || `CMD-${order.id}`,
          rawId: order.id,
          client: order.dropoff_name || order.client_name || 'Client inconnu',
          pickup: order.pickup_address? order.pickup_address.replace(/^[A-Z0-9+]+\s*,\s*/, '') : 'Adresse départ inconnue',
          dropoff: order.dropoff_address || 'Adresse arrivée inconnue',
          montant: order.total_amount ? `${new Intl.NumberFormat('fr-FR').format(order.total_amount)} FCFA` : 'N/A',
          tempsAttente: formatWaitTime(
            order.wait_time_minutes ??
            ((Date.now() - new Date(order.created_at).getTime()) / 60000)
          ),
          distance: order.distance_km ? `${order.distance_km} km` : 'N/A',
          pickupZone: order.pickup_city || order.pickup_address?.split(',').pop()?.trim() || ''
        }));

        // Formatage des livreurs
        const formattedDrivers = (driversRes.data.data || []).map(driver => ({
          id: driver.id,
          nom: driver.user?.name || driver.nom || 'Inconnu',
          zone: Array.isArray(driver.zones_livraison) ? driver.zones_livraison.join(', ') : (driver.city || 'Non définie'),
          vehicule: 'Moto', // Ou driver.vehicle_type si disponible
          note: driver.note_moyenne || 0,
          taux: driver.taux_acceptation ? `${driver.taux_acceptation}%` : 'N/A',
          enCours: driver.current_orders_count || 0
        }));

        setOrders(formattedOrders);
        setDrivers(formattedDrivers);
      } catch (err) {
        console.error("Erreur chargement attributions:", err);
        setError("Impossible de charger les données d'attribution.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- 2. CALCUL DES STATS DYNAMIQUES ---
  const stats = {
    waiting: orders.length,
    availableDrivers: drivers.length,
    urgent: orders.filter(c => c.tempsAttente >= 15).length
  };

  // --- 3. FILTRAGE ---
  const filteredCommandes = orders.filter(cmd => 
    cmd.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cmd.client.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- 4. HELPERS ---
  const getWaitTimeClass = (minutes) => {
    if (minutes >= 15) return 'text-red-600 font-bold';
    if (minutes >= 10) return 'text-orange-500 font-semibold';
    return 'text-gray-600';
  };

  const handleOpenModal = (order) => {
    setSelectedOrder(order);
    // Pré-sélectionner un livreur dans la même zone si possible
    const defaultLivreur = drivers.find(l => l.zone.includes(order.pickupZone) || order.pickupZone.includes(l.zone.split(' ')[0]));
    setSelectedLivreurId(defaultLivreur ? defaultLivreur.id : drivers[0]?.id || null);
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setSelectedLivreurId(null);
  };

  // --- 5. ACTION D'ATTRIBUTION ---
  const handleConfirmAssignment = async () => {
    if (!selectedLivreurId || !selectedOrder) return;
    
    setIsProcessing(true);
    try {
      // Adaptez l'URL et le payload selon votre backend Laravel
      await apiClient.post(`/dashboard/orders/${selectedOrder.rawId}/assign`, {
        livreur_id: selectedLivreurId
      });
      
      toast.success(`La commande ${selectedOrder.id} a été attribuée avec succès !`);
      
      // Mise à jour optimiste : retirer la commande de la liste locale
      setOrders(prev => prev.filter(o => o.rawId !== selectedOrder.rawId));
      closeModal();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erreur lors de l'attribution de la commande.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- 6. RENDU CONDITIONNEL ---
  if (isLoading) {
    return <Loader text="Chargement des attributions en cours..." fullScreen={false} size="lg" />;
  }

  if (error) {
    return (
      <div className="section-container1 text-center p-8">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="section-container1"
    >
      {/* Header */}
      <div className="section-header1">
        <div>
          <h2>🤝 Gestion des Attributions</h2>
          <p className="section-subtitle1">
            Assignation manuelle des commandes n'ayant pas trouvé de livreur automatiquement.
          </p>
        </div>
        {stats.urgent > 0 && (
          <div className="badge" style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '8px 16px', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
            <AlertTriangle size={16} style={{ marginRight: '8px' }} />
            {stats.urgent} commande(s) urgente(s)
          </div>
        )}
      </div>

      {/* Stats rapides */}
      <div className="quick-stats-grid">
        <div className="quick-stat-card warning">
          <span className="quick-stat-value">{stats.waiting}</span>
          <span className="quick-stat-label">En attente d'attribution</span>
        </div>
        <div className="quick-stat-card">
          <span className="quick-stat-value">{stats.availableDrivers}</span>
          <span className="quick-stat-label">Livreurs disponibles</span>
        </div>
        <div className="quick-stat-card danger">
          <span className="quick-stat-value">{stats.urgent}</span>
          <span className="quick-stat-label">Temps d'attente &gt; 15 min</span>
        </div>
      </div>

      {/* Filtre */}
      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par N° commande ou client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Tableau des commandes en attente (Responsive avec overflow-x-auto) */}
      <div className="table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table className="admin-table" style={{ minWidth: '800px' }}>
          <thead>
            <tr>
              <th>N° Commande</th>
              <th>Client</th>
              <th>Trajet</th>
              <th>Montant</th>
              <th>Temps d'attente</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCommandes.length > 0 ? (
              filteredCommandes.map((cmd) => (
                <tr key={cmd.rawId}>
                  <td className="order-id-cell font-semibold">{cmd.id}</td>
                  <td>{cmd.client}</td>
                  <td>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        <MapPin size={12} /> Départ: {cmd.pickup.split(',')[0]}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} /> Arrivée: {cmd.dropoff.split(',')[0]}
                      </div>
                    </div>
                  </td>
                  <td className="font-semibold">{cmd.montant}</td>
                  <td>
                    <div className={getWaitTimeClass(cmd.tempsAttente)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={16} />
                      {cmd.tempsAttente} min
                      {cmd.tempsAttente >= 15 && (
                        <span style={{ fontSize: '11px', backgroundColor: '#fee2e2', padding: '2px 6px', borderRadius: '4px', color: '#991b1b' }}>
                          URGENT
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <Link 
                      to={`/dashboard/assigner-livreur/${cmd.rawId}`}
                      state={{ orderData: cmd }} // On passe les données pour éviter un rechargement API inutile
                      className="btn btn-primary" 
                      style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: 'white' }}
                    >
                      <User size={14} />
                      Attribuer
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <CheckCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p>Aucune commande en attente d'attribution. Tout est sous contrôle !</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODALE D'ATTRIBUTION MANUELLE --- */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={closeModal}
            style={{ padding: '1rem', alignItems: 'flex-start', paddingTop: '10vh' }} // Meilleur affichage mobile
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="modal-content"
              style={{ maxWidth: '600px', width: '100%', margin: '0 auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header" style={{ background: 'linear-gradient(to right, #ea580c, #c2410c)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Attribution manuelle</h3>
                <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>
                  <X size={20} />
                </button>
              </div>
              
              <div className="modal-body" style={{ padding: '1.5rem' }}>
                {/* Résumé de la commande */}
                <div className="modal-info-box" style={{ marginBottom: '24px', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Package size={16} /> Commande {selectedOrder.id}
                  </h4>
                  <div className="modal-info-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                    <span className="info-row-label" style={{ color: '#64748b' }}>Client :</span>
                    <span className="info-row-value" style={{ fontWeight: '500', textAlign: 'right' }}>{selectedOrder.client}</span>
                  </div>
                  <div className="modal-info-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                    <span className="info-row-label" style={{ color: '#64748b' }}>Trajet :</span>
                    <span className="info-row-value" style={{ fontWeight: '500', textAlign: 'right' }}>{selectedOrder.distance} • {selectedOrder.montant}</span>
                  </div>
                  <div className="modal-info-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span className="info-row-label" style={{ color: '#64748b' }}>En attente depuis :</span>
                    <span className={`info-row-value ${getWaitTimeClass(selectedOrder.tempsAttente)}`} style={{ fontWeight: '600', textAlign: 'right' }}>
                      {selectedOrder.tempsAttente} minutes
                    </span>
                  </div>
                </div>

                {/* Sélection du livreur */}
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                  Choisir un livreur disponible :
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }}>
                  {drivers.length > 0 ? drivers.map((livreur) => (
                    <label 
                      key={livreur.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        border: selectedLivreurId === livreur.id ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor: selectedLivreurId === livreur.id ? '#eff6ff' : '#ffffff',
                        transition: 'all 0.2s'
                      }}
                    >
                      <input 
                        type="radio" 
                        name="livreur" 
                        value={livreur.id} 
                        checked={selectedLivreurId === livreur.id}
                        onChange={() => setSelectedLivreurId(livreur.id)}
                        style={{ marginRight: '12px', accentColor: '#2563eb', width: '18px', height: '18px' }}
                      />
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#475569', marginRight: '12px', flexShrink: 0 }}>
                        {livreur.nom.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}> {/* minWidth: 0 permet le text-overflow sur mobile */}
                        <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {livreur.nom}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Truck size={12} /> {livreur.vehicule}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {livreur.zone}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: '600', fontSize: '14px' }}>
                          <Star size={14} fill="#f59e0b" /> {livreur.note}
                        </div>
                        <div style={{ fontSize: '12px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                          <TrendingUp size={12} /> {livreur.taux}
                        </div>
                      </div>
                    </label>
                  )) : (
                    <p style={{ textAlign: 'center', color: '#64748b', padding: '1rem' }}>Aucun livreur disponible pour le moment.</p>
                  )}
                </div>
              </div>
              
              <div className="modal-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  onClick={closeModal} 
                  className="btn btn-secondary"
                  disabled={isProcessing}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button 
                  onClick={handleConfirmAssignment} 
                  className="btn btn-primary"
                  disabled={!selectedLivreurId || isProcessing}
                  style={{ 
                    padding: '8px 16px', borderRadius: '6px', border: 'none', 
                    background: (!selectedLivreurId || isProcessing) ? '#93c5fd' : '#2563eb', 
                    color: 'white', cursor: (!selectedLivreurId || isProcessing) ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  {isProcessing ? 'Traitement...' : 'Confirmer l\'attribution'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AttributionsSection;