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

const DashboardOverview = () => {
  // États pour les données dynamiques
  const [stats, setStats] = useState({ total: 0, en_attente: 0, en_cours: 0, livree: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction de récupération des données (réutilisable pour le bouton "Actualiser")
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

  // Chargement initial
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Helpers de formatage
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

  // Mapping des statuts backend vers l'affichage frontend
  const getStatusInfo = (status) => {
    const map = {
      'en_attente': { label: 'En attente', class: 'status-orange' },
      'assignee': { label: 'Assignée', class: 'status-blue' },
      'en_cours': { label: 'En cours', class: 'status-blue' },
      'livree': { label: 'Terminée', class: 'status-green' },
      'annulee': { label: 'Annulée', class: 'status-red' },
      'litige': { label: 'Litige', class: 'status-purple' }
    };
    return map[status] || { label: status, class: 'status-gray' };
  };

  // Configuration des cartes de statistiques (dynamique)
  const statsData = [
    { 
      icon: ShoppingCart, 
      label: 'Commandes totales', 
      value: formatNumber(stats.total), 
      color: 'blue'
    },
    { 
      icon: Clock, 
      label: 'En attente', 
      value: formatNumber(stats.en_attente), 
      color: 'orange'
    },
    { 
      icon: Truck, 
      label: 'En cours', 
      value: formatNumber(stats.en_cours), 
      color: 'purple'
    },
    { 
      icon: CheckCircle, 
      label: 'Terminées', 
      value: formatNumber(stats.livree), 
      color: 'green'
    }
  ];

  // --- CORRECTION DU LOADER ICI ---
  // On affiche le loader dès que isLoading est true, peu importe si des données sont déjà présentes
  if (isLoading) {
    return <Loader text="Chargement du tableau de bord..." fullScreen={false} size="lg" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="section-container2"
    >
      {/* En-tête de section */}
      <div className="section-header2">
        <div>
          <h2>Vue d'ensemble</h2>
          <p className="section-subtitle2">Aperçu global de votre activité</p>
        </div>
        <button 
          onClick={fetchDashboardData} 
          disabled={isLoading}
          className="date-picker flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          <span>Actualiser</span>
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Grille des 4 statistiques */}
      <div className="stats-grid">
        {statsData.map((stat, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="stat-card"
          >
            <div className="stat-top">
              <div className={`stat-icon stat-icon-${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className="stat-label">{stat.label}</span>
            </div>
            <div className="stat-value">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Tableau des 5 dernières commandes */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="recent-orders-panel"
      >
        <div className="panel-header">
          <div className="panel-title">
            <Package size={18} />
            <h3>5 dernières commandes</h3>
          </div>
          <Link to="/dashboard/commandes" className="view-all-link">
            Voir tout <ArrowRight size={14} />
          </Link>
        </div>

        <div className="table-container">
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package size={32} className="mx-auto mb-2 opacity-50" />
              <p>Aucune commande pour le moment.</p>
            </div>
          ) : (
            <table className="data-table">
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
                      <td className="font-semibold text-blue-600">
                        {order.reference ? order.reference : `#${order.id}`}
                      </td>
                      <td>{order.dropoff_name || 'Client inconnu'}</td>
                      <td className="text-muted">{formatDate(order.created_at)}</td>
                      <td className="font-semibold">{formatCurrency(order.total_amount)}</td>
                      <td>
                        <span className={`status-badge ${statusInfo.class}`}>
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