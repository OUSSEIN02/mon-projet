import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, MapPin, Truck, User, AlertTriangle, 
  Search, RefreshCw, X, Filter, Phone, DollarSign
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom'; 

import apiClient from '../../../services/apiClient';
import Loader from '../../../utils/Loader';
import toast from 'react-hot-toast';

const POLLING_INTERVAL = 15000;

const AttributionsSection = () => {
  const location = useLocation();
  const [failedOrders, setFailedOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [stats, setStats] = useState({
    pending: 0,
    reviewed: 0,
    resolved: 0,
    dismissed: 0,
    total: 0,
    availableDrivers: 0
  });

  // ═══════════════════════════════════════════════════════════
  // HELPERS (définis AVANT fetchData pour être accessibles)
  // ═══════════════════════════════════════════════════════════
  const formatWaitTime = (minutes) => {
    const totalMinutes = Math.floor(Number(minutes) || 0);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const mins = totalMinutes % 60;

    if (days > 0) return `${days}j ${hours}h ${mins}min`;
    if (hours > 0) return `${hours}h ${mins}min`;
    return `${mins} min`;
  };

  const getWaitTimeClass = (minutes) => {
    if (minutes >= 15) return 'urgent-text';
    if (minutes >= 10) return 'warning-text';
    return 'normal-text';
  };

  // ═══════════════════════════════════════════════════════════
  // 1. CHARGEMENT DES DONNÉES
  // ═══════════════════════════════════════════════════════════
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const [failedOrdersRes, driversRes, statsRes] = await Promise.all([
        apiClient.get(`/failed-orders?status=${statusFilter}&per_page=50`),
        apiClient.get('/dashboard/livreurs/disponibles').catch(() => ({ data: { data: [] } })),
        apiClient.get('/failed-orders/stats').catch(() => ({ data: { data: {} } }))
      ]);

      // Formatage des commandes échouées
      const formattedOrders = (failedOrdersRes.data?.data?.data || []).map(fo => {
        const minutesWait = Math.floor(
          (Date.now() - new Date(fo.created_at).getTime()) / 60000
        );

        const distance = parseFloat(fo.distance) || 0;
        const totalPrice = parseFloat(fo.total_price) || 0;
        const maxRadius = parseFloat(fo.max_radius_reached) || 5.0;

        return {
          // ⭐ DONNÉES BRUTES (pour AssignerLivreurPage)
          id: fo.order_id,
          rawId: fo.order_id,
          reference: fo.order?.reference || `CMD-${fo.order_id}`,
          failed_order_id: fo.id,
          pickup_lat: parseFloat(fo.pickup_lat),
          pickup_lng: parseFloat(fo.pickup_lng),
          dropoff_lat: parseFloat(fo.dropoff_lat),
          dropoff_lng: parseFloat(fo.dropoff_lng),
          pickup_address: fo.pickup_address,
          dropoff_address: fo.dropoff_address,
          pickup_name: fo.pickup_name,
          dropoff_name: fo.dropoff_name,
          pickup_contact: fo.pickup_contact,
          dropoff_contact: fo.dropoff_contact,
          delivery_type: fo.delivery_type,
          instructions: fo.instructions,
          total_amount: totalPrice,
          total_price: totalPrice,
          distance: distance,
          weight: fo.weight,
          is_fragile: fo.is_fragile,
          created_at: fo.created_at,
          client_name: fo.user?.name,
          client_phone: fo.user?.phone,

          // ⭐ DONNÉES FORMATÉES (pour l'affichage)
          displayId: fo.order?.reference || `CMD-${fo.order_id}`,
          displayClient: fo.user?.name || fo.dropoff_name || 'Client inconnu',
          displayClientPhone: fo.user?.phone || fo.dropoff_contact || '',
          displayPickup: fo.pickup_address || 'Adresse départ inconnue',
          displayDropoff: fo.dropoff_address || 'Adresse arrivée inconnue',
          displayMontant: totalPrice > 0
            ? `${new Intl.NumberFormat('fr-FR').format(totalPrice)} FCFA`
            : 'N/A',
          displayTempsAttente: formatWaitTime(minutesWait),
          displayDistance: distance > 0 ? `${distance.toFixed(1)} km` : 'N/A',
          
          // Méta
          tempsAttente: minutesWait,
          maxRadius: maxRadius,
          attempts: parseInt(fo.total_attempts) || 0,
          adminStatus: fo.admin_status,
          pickupZone: fo.pickup_address?.split(',').pop()?.trim() || '',
        };
      });

      setFailedOrders(formattedOrders);

      // Stats
      const statsData = statsRes.data?.data || {};
      const driversData = driversRes.data?.data || [];
      
      setStats({
        pending: statsData.pending || 0,
        reviewed: statsData.reviewed || 0,
        resolved: statsData.resolved || 0,
        dismissed: statsData.dismissed || 0,
        total: statsData.total || 0,
        availableDrivers: Array.isArray(driversData) ? driversData.length : 0
      });

    } catch (err) {
      console.error("Erreur chargement attributions:", err);
      if (!silent) {
        setError("Impossible de charger les données d'attribution.");
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(() => fetchData(true), POLLING_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchData]);


  useEffect(() => {
    if (location.state?.refresh) {
      fetchData(); 

      window.history.replaceState({}, document.title);
    }
  }, [location.state, fetchData]);

  // ═══════════════════════════════════════════════════════════
  // 2. FILTRAGE (CORRIGÉ : utilise les propriétés display*)
  // ═══════════════════════════════════════════════════════════
  const filteredOrders = failedOrders.filter(order => {
    const search = searchTerm.toLowerCase();
    return (
      order.displayId.toLowerCase().includes(search) ||
      order.displayClient.toLowerCase().includes(search) ||
      order.displayPickup.toLowerCase().includes(search) ||
      order.displayDropoff.toLowerCase().includes(search)
    );
  });

  // ═══════════════════════════════════════════════════════════
  // 3. ACTION : MARQUER COMME IGNORÉE
  // ═══════════════════════════════════════════════════════════
  const handleMarkAsDismissed = async (order) => {
    if (!window.confirm(`Marquer la commande ${order.displayId} comme "Ignorée" ?`)) return;

    try {
      await apiClient.patch(`/failed-orders/${order.failed_order_id}/review`, {
        status: 'dismissed',
        notes: 'Ignorée manuellement par l\'admin'
      });

      toast.success(`Commande ${order.displayId} ignorée.`);
      setFailedOrders(prev => prev.filter(o => o.failed_order_id !== order.failed_order_id));
      setStats(prev => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        dismissed: prev.dismissed + 1
      }));
    } catch (err) {
      toast.error("Erreur lors de la mise à jour.");
    }
  };

  // ═══════════════════════════════════════════════════════════
  // 4. RENDU
  // ═══════════════════════════════════════════════════════════
  if (isLoading) {
    return <Loader text="Chargement des attributions..." fullScreen={false} size="lg" />;
  }

  if (error) {
    return (
      <div className="section-container1 text-center p-8">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => fetchData()} className="btn-primary">
          <RefreshCw size={16} className="inline mr-2" /> Réessayer
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
            Commandes n'ayant pas trouvé de livreur automatiquement. Attribution manuelle requise.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => fetchData()}
            className="btn-secondary"
            style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={16} />
            Actualiser
          </button>
          {stats.pending > 0 && (
            <div className="badge" style={{ 
              backgroundColor: '#fef2f2', 
              color: '#b91c1c', 
              padding: '8px 16px', 
              fontSize: '14px', 
              fontWeight: '600', 
              display: 'flex', 
              alignItems: 'center' 
            }}>
              <AlertTriangle size={16} style={{ marginRight: '8px' }} />
              {stats.pending} en attente
            </div>
          )}
        </div>
      </div>

      {/* Stats rapides */}
      <div className="quick-stats-grid">
        <div className="quick-stat-card warning">
          <span className="quick-stat-value">{stats.pending}</span>
          <span className="quick-stat-label">À attribuer</span>
        </div>
        <div className="quick-stat-card">
          <span className="quick-stat-value">{stats.availableDrivers}</span>
          <span className="quick-stat-label">Livreurs dispo.</span>
        </div>
        <div className="quick-stat-card danger">
          <span className="quick-stat-value">
            {failedOrders.filter(o => o.tempsAttente >= 15).length}
          </span>
          <span className="quick-stat-label">Urgentes (&gt; 15 min)</span>
        </div>
        <div className="quick-stat-card">
          <span className="quick-stat-value">{stats.total}</span>
          <span className="quick-stat-label">Total échouées</span>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-bar" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div className="search-wrapper" style={{ flex: 1, minWidth: '240px' }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par N°, client ou adresse..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: 'white',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="pending">À traiter ({stats.pending})</option>
            <option value="reviewed">En cours ({stats.reviewed})</option>
            <option value="resolved">Résolues ({stats.resolved})</option>
            <option value="dismissed">Ignorées ({stats.dismissed})</option>
            <option value="">Toutes ({stats.total})</option>
          </select>
        </div>
      </div>

      {/* Tableau des commandes échouées */}
      <div className="table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table className="admin-table" style={{ minWidth: '900px' }}>
          <thead>
            <tr>
              <th>N° Commande</th>
              <th>Client</th>
              <th>Trajet</th>
              <th>Distance / Montant</th>
              <th>Temps d'attente</th>
              <th>Raison</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <tr key={order.failed_order_id}>
                  <td className="order-id-cell font-semibold">{order.displayId}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '600' }}>{order.displayClient}</span>
                      {order.displayClientPhone && (
                        <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={10} /> {order.displayClientPhone}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        <MapPin size={12} color="#f97316" /> {order.displayPickup.split(',').slice(0, 2).join(',')}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} color="#ef4444" /> {order.displayDropoff.split(',').slice(0, 2).join(',')}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                        <Truck size={12} /> {order.displayDistance}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', color: '#0f172a' }}>
                        <DollarSign size={12} /> {order.displayMontant}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className={getWaitTimeClass(order.tempsAttente)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={16} />
                      {order.displayTempsAttente}
                      {order.tempsAttente >= 15 && (
                        <span style={{ 
                          fontSize: '10px', 
                          backgroundColor: '#fee2e2', 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          color: '#991b1b',
                          fontWeight: '700'
                        }}>
                          URGENT
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      fontSize: '11px', 
                      backgroundColor: '#fef3c7', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      color: '#92400e',
                      fontWeight: '600'
                    }}>
                      Rayon {order.maxRadius}km épuisé
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Link 
                        to={`/dashboard/assigner-livreur/${order.rawId}`}
                        state={{ 
                          orderData: order,
                          failedOrderId: order.failed_order_id,
                          fromAttributions: true 
                        }}
                        className="btn btn-primary" 
                        style={{ 
                          padding: '6px 12px', 
                          fontSize: '13px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          textDecoration: 'none',
                          color: 'white'
                        }}
                      >
                        <User size={14} />
                        Attribuer
                      </Link>
                      <button 
                        onClick={() => handleMarkAsDismissed(order)}
                        title="Ignorer cette commande"
                        style={{ 
                          padding: '6px 10px',
                          fontSize: '13px',
                          border: '1px solid #d1d5db',
                          background: 'white',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                    {searchTerm || statusFilter !== 'pending'
                      ? 'Aucune commande ne correspond à vos filtres' 
                      : 'Aucune commande en attente d\'attribution'}
                  </p>
                  <p style={{ fontSize: '14px' }}>
                    {searchTerm || statusFilter !== 'pending'
                      ? 'Essayez de modifier vos filtres.'
                      : 'Tout est sous contrôle ! 🎉'}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Styles locaux */}
      <style>{`
        .urgent-text { color: #dc2626; font-weight: 700; }
        .warning-text { color: #f97316; font-weight: 600; }
        .normal-text { color: #475569; }
      `}</style>
    </motion.div>
  );
};

export default AttributionsSection;