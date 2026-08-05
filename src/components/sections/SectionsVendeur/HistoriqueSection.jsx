import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Download, FileText, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
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

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(`/orders/history?page=${currentPage}`);
        setHistoryData(response.data.data || []);
        if (response.data.meta) {
          setLastPage(response.data.meta.last_page);
          setTotalItems(response.data.meta.total);
        }
      } catch (err) {
        console.error("Erreur lors du chargement de l'historique:", err);
        setError("Impossible de charger l'historique des commandes.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [currentPage]);

  const filteredData = historyData.filter((cmd) => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    return (
      cmd.reference?.toLowerCase().includes(term) ||
      cmd.dropoff_name?.toLowerCase().includes(term) ||
      cmd.livreur_name?.toLowerCase().includes(term)
    );
  });

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Réinitialise la page lors d'une recherche
  };

  const getBadgeClass = (statut) => {
    const classes = { livree: 'od-hist-badge-success', terminee: 'od-hist-badge-success', annulee: 'od-hist-badge-danger' };
    return classes[statut] || 'od-hist-badge-gray';
  };

  const getStatusLabel = (status) => {
    const labels = { livree: 'Livrée', terminee: 'Terminée', annulee: 'Annulée' };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleRowClick = (orderId) => {
    navigate(`/vendeurs/commandes/${orderId}`);
  };

  if (isLoading && currentPage === 1) {
    return (
      <div className="od-hist-loader">
        <Loader2 className="animate-spin text-orange-500" size={32} />
        <span>Chargement de l'historique...</span>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="od-hist-container"
    >
      {/* En-tête */}
      <div className="od-hist-header">
        <div>
          <h2 className="od-hist-title">Historique des commandes</h2>
          <p className="od-hist-subtitle">
            {totalItems > 0 ? `${totalItems} commande(s) au total.` : 'Consultez vos commandes terminées ou annulées.'}
          </p>
        </div>
        <button className="od-hist-btn-export">
          <Download size={18} /> Exporter CSV
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="od-hist-filters-bar">
        <div className="od-hist-search-wrapper">
          <Search size={18} className="od-hist-search-icon" />
          <input 
            type="text" 
            placeholder="Rechercher par ID, client ou livreur..." 
            value={searchTerm} 
            onChange={handleSearchChange} 
            className="od-hist-search-input" 
          />
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="od-hist-error">
          {error}
        </div>
      )}

      {/* Tableau et Pagination */}
      <div className="od-hist-table-container">
        {filteredData.length === 0 && !isLoading ? (
          <div className="od-hist-empty-state">
            <FileText size={48} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <p>{searchTerm ? 'Aucune commande ne correspond à votre recherche sur cette page.' : 'Aucune commande trouvée dans l\'historique.'}</p>
          </div>
        ) : (
          <>
            <table className="od-hist-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Client</th>
                  <th>Livreur</th>
                  <th>Statut</th>
                  <th>Montant</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((cmd) => (
                  <tr 
                    key={cmd.id} 
                    onClick={() => handleRowClick(cmd.id)}
                  >
                    <td className="od-hist-order-id">{cmd.reference || `#${cmd.id}`}</td>
                    <td>{cmd.dropoff_name || 'Inconnu'}</td>
                    <td>{cmd.livreur_name || 'Non assigné'}</td>
                    <td>
                      <span className={`od-hist-badge ${getBadgeClass(cmd.status)}`}>
                        {getStatusLabel(cmd.status)}
                      </span>
                    </td>
                    <td>
                      {cmd.total_amount > 0 
                        ? `${parseFloat(cmd.total_amount).toLocaleString('fr-FR')} FCFA` 
                        : '-'}
                    </td>
                    <td>{formatDate(cmd.delivered_at || cmd.created_at)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="od-hist-action-btn" 
                        onClick={(e) => { e.stopPropagation(); handleRowClick(cmd.id); }} 
                        title="Voir les détails"
                      >
                        <FileText size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Barre de Pagination */}
            {lastPage > 1 && (
              <div className="od-hist-pagination">
                <div className="od-hist-pagination-info">
                  Affichage de <strong>{filteredData.length > 0 ? 1 : 0}</strong> à <strong>{filteredData.length}</strong> sur <strong>{totalItems}</strong> résultats
                </div>
                
                <nav className="od-hist-pagination-nav" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="od-hist-pagination-btn"
                    title="Page précédente"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  
                  <span className="od-hist-pagination-current">
                    Page {currentPage} / {lastPage}
                  </span>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, lastPage))}
                    disabled={currentPage === lastPage}
                    className="od-hist-pagination-btn"
                    title="Page suivante"
                  >
                    <ChevronRight size={18} />
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