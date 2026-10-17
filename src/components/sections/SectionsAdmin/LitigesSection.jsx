import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Eye, Download, AlertCircle, CheckCircle, 
  Clock, Store, Truck, MessageCircle, ChevronLeft, ChevronRight,
  X, Calendar, DollarSign, User, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import apiClient from '../../../services/apiClient';
import Loader from '../../../utils/Loader';
import '../../css/LitigesSection.css'; // N'oublie pas d'importer le CSS

const LitigesSection = () => {
  const [litiges, setLitiges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 50,
    total: 0,
    from: 0,
    to: 0
  });

  const [selectedLitige, setSelectedLitige] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);

  const fetchLitiges = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        per_page: 50,
        search: debouncedSearch,
        status: filterStatus
      });

      const response = await apiClient.get(`/dashboard/litiges?${params.toString()}`);
      
      if (response.data.success) {
        const rawData = response.data.data || [];
        const formattedData = rawData.map(item => ({
          id: item.id,
          commande: item.order_reference || `CMD-${item.order_id}`,
          vendeur: item.seller_name || 'Vendeur inconnu',
          livreur: item.driver_name || 'Non assigné',
          statut: item.status || 'en_attente',
          type: item.type || 'Autre',
          description: item.description || 'Aucune description',
          date: item.date_formatted || 'Date inconnue',
          montant: item.montant_formatted || 'N/A',
          priorite: (item.priority || item.priorite || 'moyenne').toLowerCase() 
        }));

        setLitiges(formattedData);
        setMeta(response.data.meta);
      }
    } catch (err) {
      console.error("Erreur chargement litiges:", err);
      setError("Impossible de charger la liste des litiges.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, filterStatus]);

  useEffect(() => {
    fetchLitiges();
  }, [fetchLitiges]);

  const getStatusBadge = (statut) => {
    const badges = {
      en_attente: { color: 'litige-badge-warning', icon: Clock, label: 'En attente' },
      en_cours: { color: 'litige-badge-info', icon: AlertCircle, label: 'En cours' },
      resolu: { color: 'litige-badge-success', icon: CheckCircle, label: 'Résolu' }
    };
    return badges[statut] || badges.en_attente;
  };

  const getPrioriteBadge = (priorite) => {
    const badges = {
      haute: { color: 'litige-badge-danger', label: 'Haute' },
      moyenne: { color: 'litige-badge-orange', label: 'Moyenne' },
      basse: { color: 'litige-badge-info', label: 'Basse' }
    };
    return badges[priorite] || badges.basse;
  };

  const handleViewDetails = (litigeId) => {
    navigate(`/dashboard/litiges/${litigeId}`);
  };

  const handleCloseModal = () => {
    setSelectedLitige(null);
  };

  const handleResolveLitige = async () => {
    if (!selectedLitige) return;
    toast.success(`Le litige ${selectedLitige.commande} a été marqué comme résolu.`);
    setLitiges(prev => prev.map(l => 
      l.id === selectedLitige.id ? { ...l, statut: 'resolu' } : l
    ));
    setSelectedLitige(null);
  };

  const getPageNumbers = () => {
    const pages = [];
    const total = meta.last_page || 1;
    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(total, startPage + 4);
      startPage = Math.max(1, endPage - 4);
      for (let i = startPage; i <= endPage; i++) pages.push(i);
    }
    return pages;
  };

  if (isLoading && litiges.length === 0) {
    return <Loader text="Chargement des litiges..." fullScreen={false} size="lg" />;
  }

  if (error) {
    return (
      <div className="litige-section-container litige-text-center litige-p-8">
        <p className="litige-text-red-500 litige-mb-4">{error}</p>
        <button onClick={fetchLitiges} className="litige-btn litige-btn-primary">Réessayer</button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="litige-section-container">
      <div className="litige-section-header">
        <div>
          <h2 className="litige-title">Gestion des Litiges</h2>
          <p className="litige-section-subtitle">Suivez et traitez tous les litiges de la plateforme</p>
        </div>
        <div className="litige-section-actions">
          <button className="litige-btn litige-btn-secondary"><Download size={18} /> Exporter</button>
        </div>
      </div>

      <div className="litige-stats-grid">
        <div className="litige-stat-card">
          <span className="litige-stat-value">{meta.total}</span>
          <span className="litige-stat-label">Total litiges</span>
        </div>
        <div className="litige-stat-card litige-warning">
          <span className="litige-stat-value">{litiges.filter(l => l.statut === 'en_attente').length}</span>
          <span className="litige-stat-label">En attente</span>
        </div>
      </div>

      <div className="litige-filters-bar">
        <div className="litige-search-wrapper">
          <Search size={18} className="litige-search-icon" />
          <input
            type="text"
            placeholder="Rechercher par commande, vendeur ou type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="litige-search-input"
          />
        </div>
        <div className="litige-filters-group">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="litige-filter-select">
            <option value="all">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="en_cours">En cours</option>
            <option value="resolu">Résolus</option>
          </select>
          <button className="litige-btn litige-filter-btn"><Filter size={18} /> Plus de filtres</button>
        </div>
      </div>

      <div className="litige-table-container">
        {!isLoading && (
          <table className="litige-table">
            <thead>
              <tr>
                <th>Commande</th>
                <th>Parties impliquées</th>
                <th>Type & Message</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {litiges.length > 0 ? (
                litiges.map((litige) => {
                  const StatusBadge = getStatusBadge(litige.statut);
                  const PrioriteBadge = getPrioriteBadge(litige.priorite);
                  return (
                    <tr key={litige.id}>
                      <td>
                        <div className="litige-order-id-cell">{litige.commande}</div>
                        <div className="litige-text-muted" style={{ fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span className={`litige-badge ${PrioriteBadge.color}`}>{PrioriteBadge.label}</span>
                          {litige.montant}
                        </div>
                      </td>
                      <td>
                        <div className="litige-contact-info">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Store size={14} className="litige-text-gray-500" /> {litige.vendeur}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Truck size={14} className="litige-text-gray-500" /> {litige.livreur}</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px' }}>
                          <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>{litige.type}</div>
                          <div style={{ color: '#64748b', fontSize: '12px', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                            <MessageCircle size={12} className="litige-mt-0.5 litige-flex-shrink-0" />
                            <span className="litige-line-clamp-2">{litige.description}</span>
                          </div>
                        </div>
                      </td>
                      <td className="litige-text-gray-500" style={{ fontSize: '13px' }}>{litige.date}</td>
                      <td>
                        <span className={`litige-badge ${StatusBadge.color}`}>
                          <StatusBadge.icon size={12} /> {StatusBadge.label}
                        </span>
                      </td>
                      <td>
                        <div className="litige-action-buttons">
                        <button 
                          className="litige-action-btn" 
                          title="Voir les détails" 
                          onClick={() => handleViewDetails(litige.id)} 
                        >
                          <Eye size={16} className="litige-text-gray-600" />
                        </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="litige-empty-state">
                    <AlertCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p>Aucun litige ne correspond à vos critères.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {meta.total >= 50 && meta.last_page > 1 && (
        <div className="litige-table-footer">
          <div className="litige-table-info">
            Affichage de <strong>{meta.from || 0}</strong> à <strong>{meta.to || 0}</strong> sur <strong>{meta.total}</strong> litiges
          </div>
          
          <div className="litige-pagination">
            <button 
              className="litige-page-btn" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} /> Précédent
            </button>
            
            {getPageNumbers().map(pageNum => (
              <button
                key={pageNum}
                className={`litige-page-btn ${currentPage === pageNum ? 'litige-active' : ''}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            ))}

            <button 
              className="litige-page-btn" 
              disabled={currentPage === meta.last_page}
              onClick={() => setCurrentPage(p => Math.min(meta.last_page, p + 1))}
            >
              Suivant <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

    </motion.div>
  );
};

export default LitigesSection;