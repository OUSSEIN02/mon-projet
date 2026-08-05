import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '../../../services/apiClient';  
import OrderDetailsSection from '../details/OrderDetailsSection';
import Loader from '../../../utils/Loader'; 
import '../../css/CommandesSection.css';

const CommandesSection = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  // États pour les données et le chargement
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // États pour le filtrage et la pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Nombre de commandes par page

  // Fonction pour récupérer la liste des commandes
  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/orders');
      
      const formattedOrders = response.data.data.map(order => ({
        id: `CMD-${String(order.id).padStart(4, '0')}`,
        rawId: order.id,
        client: order.dropoff_name || 'Client inconnu',
        vendeur: order.pickup_address
          ? order.pickup_address.replace(/^[A-Z0-9+]+\s*,\s*/, '')
          : 'Lieu inconnu',
        livreur: order.livreur?.nom || 'Non assigné',
        statut: order.status,
        montant: order.total_amount > 0
          ? `${new Intl.NumberFormat('fr-FR').format(order.total_amount)} FCFA`
          : 'En calcul',
        date: new Date(order.created_at).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      }));
      
      setOrders(formattedOrders);
    } catch (err) {
      console.error("Erreur lors du chargement des commandes:", err);
      setError("Impossible de charger les commandes. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour récupérer les détails d'une commande spécifique
  const fetchOrderDetails = async (id) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      const response = await apiClient.get(`/orders/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSelectedOrder(response.data.data);
    } catch (err) {
      console.error("Erreur lors du chargement du détail:", err);
      setError("Commande introuvable.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails(orderId);
    } else {
      fetchOrders();
    }
  }, [orderId]);

  // Réinitialiser la page à 1 lorsque les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const getBadgeClass = (statut) => {
    const classes = {
      en_attente: 'badge-warning',
      assignee: 'badge-info',
      en_cours: 'badge-info',
      livree: 'badge-success',
      annulee: 'badge-danger',
      litige: 'badge-purple'
    };
    return classes[statut] || 'badge-warning';
  };

  const getStatusLabel = (statut) => {
    const labels = {
      en_attente: 'En attente',
      assignee: 'Assignée',
      en_cours: 'En cours',
      livree: 'Livrée',
      annulee: 'Annulée',
      litige: 'Litige'
    };
    return labels[statut] || statut;
  };

  const handleViewOrder = (rawId) => {
    navigate(`/dashboard/commandes/${rawId}`);
  };

  const handleGoBack = () => {
    navigate('/vendeurs/commandes');
  };

  // --- LOGIQUE DE FILTRAGE ---
  const filteredOrders = orders.filter(cmd => {
    const matchesSearch = 
      cmd.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmd.client.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || cmd.statut === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const userRole = localStorage.getItem('role');
  const isAdmin = userRole === 'admin';
  
  // --- LOGIQUE DE PAGINATION ---
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- AFFICHAGE DES DÉTAILS ---
  if (orderId) {
    if (isLoading) {
      return <Loader text="Chargement des détails de la commande..." fullScreen={true} size="lg" />;
    }
    if (error) return <div className="text-red-500 p-4">{error}</div>;
    
    return (
      <OrderDetailsSection orderData={selectedOrder} onGoBack={handleGoBack} />
    );
  }

  // --- AFFICHAGE DE LA LISTE ---
   // --- AFFICHAGE DE LA LISTE ---
   return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="cmd-section-container"
    >




    <div className="cmd-section-header">
      <div>
        <h2>{isAdmin ? 'Toutes les Commandes' : 'Mes Commandes'}</h2>
        <p className="cmd-section-subtitle">
          {isAdmin 
            ? 'Supervisez et gérez l’ensemble des livraisons de la plateforme.' 
            : 'Suivez et gérez toutes vos demandes de livraison.'
          }
        </p>
      </div>
    </div>

      {/* Barre de recherche et filtres */}
      <div className="cmd-filters-bar">
        <div className="cmd-search-wrapper">
          <Search size={18} className="cmd-search-icon" />
          <input
            type="text"
            placeholder="Rechercher par N° commande ou client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="cmd-search-input"
          />
        </div>
        
        <div className="cmd-filters-group">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="cmd-filter-select"
          >
            <option value="all">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="assignee">Assignée</option>
            <option value="en_cours">En cours</option>
            <option value="livree">Livrée</option>
            <option value="annulee">Annulée</option>
            <option value="litige">Litige</option>
          </select>
          
          <button 
            onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
            className="cmd-filter-btn"
          >
            <Filter size={18} />
            Réinitialiser
          </button>
        </div>
      </div>

      {isLoading ? (
        <Loader text="Chargement des commandes..." fullScreen={false} size="lg" />
      ) : error ? (
        <div className="text-center p-8 text-red-500 bg-red-50 rounded-lg border border-red-200">
          {error}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center p-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
          <Search size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Aucune commande ne correspond à vos critères.</p>
          <p className="text-sm mt-1">Essayez de modifier vos filtres ou votre recherche.</p>
        </div>
      ) : (
        <>
          <div className="cmd-table-container">
            <table className="cmd-admin-table">
              <thead>
                <tr>
                  <th>N° Commande</th>
                  <th>Client</th>
                  <th>Lieu de récupération</th>
                  <th>Livreur</th>
                  <th>Statut</th>
                  <th>Montant</th>
                  <th>Date</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((cmd) => (
                  <tr key={cmd.rawId}>
                    <td className="cmd-order-id-cell">{cmd.id}</td>
                    <td>{cmd.client}</td>
                    <td className="text-gray-600">{cmd.vendeur}</td>
                    <td>
                      <span className={cmd.livreur === 'Non assigné' ? 'text-gray-400 italic' : 'text-gray-800'}>
                        {cmd.livreur}
                      </span>
                    </td>
                    <td>
                      <span className={`cmd-badge ${getBadgeClass(cmd.statut)}`}>
                        {getStatusLabel(cmd.statut)}
                      </span>
                    </td>
                    <td className="font-semibold">{cmd.montant}</td>
                    <td className="text-gray-600 text-sm">{cmd.date}</td>
                    <td className="text-center">
                      <button 
                        className="cmd-action-btn" 
                        onClick={() => handleViewOrder(cmd.rawId)} 
                        title="Voir les détails"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Contrôles de Pagination */}
          {totalPages > 1 && (
            <div className="cmd-pagination">
              <p className="cmd-pagination-info">
                Affichage de <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> à{' '}
                <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span> sur{' '}
                <span className="font-semibold">{filteredOrders.length}</span> commandes
              </p>
              
              <div className="cmd-pagination-controls">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="cmd-page-btn"
                  title="Page précédente"
                >
                  <ChevronLeft size={20} />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`cmd-page-btn ${currentPage === page ? 'active' : ''}`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="cmd-page-btn"
                  title="Page suivante"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default CommandesSection;