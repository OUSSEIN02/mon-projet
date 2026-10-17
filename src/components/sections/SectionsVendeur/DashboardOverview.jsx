import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Clock,
  Truck,
  CheckCircle,
  RefreshCw,
  ArrowRight,
  Package
} from 'lucide-react';
import apiClient from '../../../services/apiClient';
import Loader from '../../../utils/Loader';
import '../../css/DashboardOverview.css'; 

const DashboardOverview = () => {
  const [stats, setStats] = useState({ total: 0, en_attente: 0, en_cours: 0, livree: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/dashboard/overview');
      setStats(response.data.data.stats);
      setRecentOrders(response.data.data.recent_orders);
    } catch (err) {
      console.error("Erreur chargement dashboard:", err);
      setError("Impossible de charger les données du tableau de bord.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const formatNumber = (num) => new Intl.NumberFormat('fr-FR').format(num);
  const formatCurrency = (amount) => {
    if (!amount) return '0 FCFA';
    return `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`;
  };
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusInfo = (status) => {
    const map = {
      'en_attente': { label: 'En attente', class: 'dov-status--orange' },
      'assignee':   { label: 'Assignée',   class: 'dov-status--blue'   },
      'en_cours':   { label: 'En cours',   class: 'dov-status--blue'   },
      'livree':     { label: 'Terminée',   class: 'dov-status--green'  },
      'annulee':    { label: 'Annulée',    class: 'dov-status--red'    },
      'litige':     { label: 'Litige',     class: 'dov-status--purple' }
    };
    return map[status] || { label: status, class: 'dov-status--gray' };
  };

  const statsData = [
    { icon: ShoppingCart, label: 'Commandes totales', value: formatNumber(stats.total),    color: 'blue'   },
    { icon: Clock,        label: 'En attente',        value: formatNumber(stats.en_attente), color: 'orange' },
    { icon: Truck,        label: 'En cours',          value: formatNumber(stats.en_cours),   color: 'purple' },
    { icon: CheckCircle,  label: 'Terminées',         value: formatNumber(stats.livree),     color: 'green'  }
  ];

  if (isLoading) {
    return <Loader text="Chargement du tableau de bord..." fullScreen={false} size="lg" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="dov-container"
    >
      {/* Header */}
      <div className="dov-header">
        <div className="dov-header__info">
          <h2 className="dov-header__title">Vue d'ensemble</h2>
          <p className="dov-header__subtitle">Aperçu global de votre activité</p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={isLoading}
          className="dov-refresh-btn"
        >
          <span>Actualiser</span>
          <RefreshCw size={16} className={isLoading ? 'dov-spin' : ''} />
        </button>
      </div>

      {/* Erreur */}
      {error && (
        <div className="dov-error">{error}</div>
      )}

      {/* Grille stats */}
      <div className="dov-stats-grid">
        {statsData.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="dov-stat-card"
          >
            <div className="dov-stat-card__top">
              <div className={`dov-stat-card__icon dov-stat-card__icon--${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className="dov-stat-card__label">{stat.label}</span>
            </div>
            <div className="dov-stat-card__value">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Panel dernières commandes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="dov-orders-panel"
      >
        <div className="dov-orders-panel__header">
          <div className="dov-orders-panel__title">
            <Package size={18} />
            <h3>5 dernières commandes</h3>
          </div>
          <Link to="/dashboard/commandes" className="dov-view-all">
            Voir tout <ArrowRight size={14} />
          </Link>
        </div>

        <div className="dov-table-wrapper">
          {recentOrders.length === 0 ? (
            <div className="dov-empty">
              <Package size={32} className="dov-empty__icon" />
              <p>Aucune commande pour le moment.</p>
            </div>
          ) : (
            <table className="dov-table">
              <thead>
                <tr>
                  <th>N° Commande</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Montant</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => {
                  const statusInfo = getStatusInfo(order.status);
                  return (
                    <tr key={order.id}>
                   <td data-label="N° Commande" className="dov-table__cell--ref">
                    {`CMD-${String(order.id).padStart(4, '0')}`}
                  </td>
                      <td data-label="Client">
                        {order.dropoff_name || 'Client inconnu'}
                      </td>
                      <td data-label="Date" className="dov-table__cell--muted">
                        {formatDate(order.created_at)}
                      </td>
                      <td data-label="Montant" className="dov-table__cell--amount">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td data-label="Statut">
                        <span className={`dov-status-badge ${statusInfo.class}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DashboardOverview;