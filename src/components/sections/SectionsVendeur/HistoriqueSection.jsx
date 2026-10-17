import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Download, FileText, Loader2, ChevronLeft, ChevronRight, Package, User, Bike, Calendar } from 'lucide-react';
import apiClient from '../../../services/apiClient';
import '../../css/HistoriqueSection.css';

const HistoriqueSection = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  const [periodFilter, setPeriodFilter] = useState('today');
  
  // 🆕 NOUVEAU : État pour stocker les comptes par période
  const [periodCounts, setPeriodCounts] = useState({
    today: 0,
    week: 0,
    month: 0,
    all: 0
  });

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(`/orders/history`, {
          params: { 
            page: currentPage, 
            period: periodFilter 
          }
        });
        
        setHistoryData(response.data.data || []);
        
        if (response.data.meta) {
          setLastPage(response.data.meta.last_page);
          setTotalItems(response.data.meta.total);
        }
        
        // 🆕 NOUVEAU : Mise à jour des comptes si le backend les renvoie
        if (response.data.counts) {
          setPeriodCounts(response.data.counts);
        }
      } catch (err) {
        console.error("Erreur lors du chargement de l'historique:", err);
        setError("Impossible de charger l'historique des commandes.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [currentPage, periodFilter]);

  const getDisplayReference = (cmd) => {
    if (cmd.reference) return cmd.reference;
    return `CMD-${String(cmd.id).padStart(3, '0')}`;
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const filteredData = historyData.filter((cmd) => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    const ref = getDisplayReference(cmd).toLowerCase();
    return (
      ref.includes(term) ||
      cmd.dropoff_name?.toLowerCase().includes(term) ||
      cmd.livreur_name?.toLowerCase().includes(term)
    );
  });

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePeriodChange = (period) => {
    setPeriodFilter(period);
    setCurrentPage(1);
    setSearchTerm('');
  };

  const getBadgeConfig = (statut) => {
    const s = statut?.toLowerCase();
    if (s === 'livree' || s === 'terminee' || s === 'payee') return { label: 'Livrée', className: 'badge-success' };
    if (s === 'annulee' || s === 'echouee') return { label: 'Annulée', className: 'badge-danger' };
    if (s === 'en_cours' || s === 'assignee') return { label: 'En cours', className: 'badge-warning' };
    return { label: statut || 'Inconnu', className: 'badge-gray' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', { 
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  const handleRowClick = (orderId) => {
    navigate(`/dashboard/commandes/${orderId}`);
  };

  if (isLoading && currentPage === 1) {
    return (
      <div className="od-hist-loader">
        <Loader2 className="animate-spin" size={32} />
        <span>Chargement de l'historique...</span>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }}
      className="od-hist-container"
    >
      <div className="od-hist-header">
        <div>
          <h2 className="od-hist-title">Historique des interventions</h2>
          <p className="od-hist-subtitle">
            {totalItems > 0 ? `${totalItems} livraison(s) trouvée(s) pour cette période.` : 'Aucune livraison pour le moment.'}
          </p>
        </div>
        <button className="od-hist-btn-export">
          <Download size={18} /> <span>Exporter</span>
        </button>
      </div>

      {/* 🆕 NOUVEAU : Barre de filtres avec les comptes */}
      <div className="od-hist-period-filters">
        <button 
          className={`od-period-btn ${periodFilter === 'today' ? 'active' : ''}`}
          onClick={() => handlePeriodChange('today')}
        >
          <Calendar size={16} /> Aujourd'hui <span className="od-count-badge">({periodCounts.today})</span>
        </button>
        <button 
          className={`od-period-btn ${periodFilter === 'week' ? 'active' : ''}`}
          onClick={() => handlePeriodChange('week')}
        >
          7 derniers jours <span className="od-count-badge">({periodCounts.week})</span>
        </button>
        <button 
          className={`od-period-btn ${periodFilter === 'month' ? 'active' : ''}`}
          onClick={() => handlePeriodChange('month')}
        >
          Ce mois <span className="od-count-badge">({periodCounts.month})</span>
        </button>
        <button 
          className={`od-period-btn ${periodFilter === 'all' ? 'active' : ''}`}
          onClick={() => handlePeriodChange('all')}
        >
          Tout <span className="od-count-badge">({periodCounts.all})</span>
        </button>
      </div>

      <div className="od-hist-filters-bar">
        <div className="od-hist-search-wrapper">
          <Search size={18} className="od-hist-search-icon" />
          <input 
            type="text" 
            placeholder="Rechercher par réf. ou client..." 
            value={searchTerm} 
            onChange={handleSearchChange} 
            className="od-hist-search-input" 
          />
        </div>
      </div>

      {error && <div className="od-hist-error">{error}</div>}

      <div className="od-hist-table-container">
        {filteredData.length === 0 && !isLoading ? (
          <div className="od-hist-empty-state">
            <div className="empty-icon-wrapper">
              <Package size={48} />
            </div>
            <h3>Aucune commande trouvée</h3>
            <p>{searchTerm ? 'Aucun résultat ne correspond à votre recherche.' : 'Aucune livraison pour cette période.'}</p>
          </div>
        ) : (
          <>
            <table className="od-hist-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Client</th>
                  <th>Statut</th>
                  <th>Montant</th>
                  <th>Date</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredData.map((cmd, index) => {
                    const badge = getBadgeConfig(cmd.status);
                    return (
                      <motion.tr 
                        key={cmd.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        onClick={() => handleRowClick(cmd.id)}
                        className="od-hist-row"
                      >
                        <td><span className="od-hist-ref">{getDisplayReference(cmd)}</span></td>
                        <td>
                          <div className="od-hist-user-cell">
                            <div className="od-hist-avatar">{getInitials(cmd.dropoff_name)}</div>
                            <span className="od-hist-user-name">{cmd.dropoff_name || 'Inconnu'}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`od-hist-badge ${badge.className}`}>{badge.label}</span>
                        </td>
                        <td className="od-hist-amount">
                          {cmd.total_amount > 0 ? `${parseFloat(cmd.total_amount).toLocaleString('fr-FR')} FCFA` : '-'}
                        </td>
                        <td className="text-muted">{formatDate(cmd.delivered_at || cmd.created_at)}</td>
                        <td className="text-center">
                          <button className="od-hist-action-btn" onClick={(e) => { e.stopPropagation(); handleRowClick(cmd.id); }} title="Voir les détails">
                            <ChevronRight size={18} />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>

            {lastPage > 1 && (
              <div className="od-hist-pagination">
                <div className="od-hist-pagination-info">
                  Page <strong>{currentPage}</strong> sur <strong>{lastPage}</strong>
                </div>
                <nav className="od-hist-pagination-nav">
                  <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="od-hist-pagination-btn">
                    <ChevronLeft size={18} /> Précédent
                  </button>
                  <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, lastPage))} disabled={currentPage === lastPage} className="od-hist-pagination-btn">
                    Suivant <ChevronRight size={18} />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default HistoriqueSection;