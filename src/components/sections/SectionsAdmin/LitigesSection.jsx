import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Filter, Eye, Download, AlertCircle, CheckCircle, 
  Clock, Store, Truck, MessageCircle
} from 'lucide-react';

import apiClient from '../../../services/apiClient';
import Loader from '../../../utils/Loader';

const LitigesSection = () => {
  const [litiges, setLitiges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // --- 1. CHARGEMENT DES DONNÉES ---
  useEffect(() => {
    const fetchLitiges = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get('/dashboard/litiges');
        const rawData = response.data.data || [];

        // Formatage des données pour correspondre à votre UI
        const formattedData = rawData.map(item => ({
          id: item.id,
          commande: item.order_reference || `CMD-${item.order_id}`,
          vendeur: item.seller_name || 'Vendeur inconnu',
          livreur: item.driver_name || 'Non assigné',
          statut: item.status, // en_attente, en_cours, resolu
          type: item.type,
          description: item.description,
          date: item.date_formatted,
          montant: item.montant_formatted,
          priorite: item.priority // haute, moyenne, basse
        }));

        setLitiges(formattedData);
      } catch (err) {
        console.error("Erreur chargement litiges:", err);
        setError("Impossible de charger la liste des litiges.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLitiges();
  }, []);

  // --- 2. HELPERS D'AFFICHAGE ---
  const getStatusBadge = (statut) => {
    const badges = {
      en_attente: { color: 'badge-warning', icon: Clock, label: 'En attente' },
      en_cours: { color: 'badge-info', icon: AlertCircle, label: 'En cours' },
      resolu: { color: 'badge-success', icon: CheckCircle, label: 'Résolu' }
    };
    return badges[statut] || badges.en_attente;
  };

  const getPrioriteBadge = (priorite) => {
    const badges = {
      haute: { color: 'badge-danger', label: 'Haute' },
      moyenne: { color: 'badge-warning', label: 'Moyenne' },
      basse: { color: 'badge-info', label: 'Basse' }
    };
    return badges[priorite] || badges.basse;
  };

  // --- 3. FILTRAGE (Correction: l.vendeur au lieu de l.client) ---
  const filteredLitiges = litiges.filter(l => {
    const matchSearch = l.commande.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       l.vendeur.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       l.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || l.statut === filterStatus;
    return matchSearch && matchStatus;
  });

  // --- 4. CALCUL DES STATS ---
  const stats = {
    total: litiges.length,
    en_attente: litiges.filter(l => l.statut === 'en_attente').length,
    en_cours: litiges.filter(l => l.statut === 'en_cours').length,
    resolu: litiges.filter(l => l.statut === 'resolu').length
  };

  // --- 5. RENDU CONDITIONNEL ---
  if (isLoading) {
    return <Loader text="Chargement des litiges..." fullScreen={false} size="lg" />;
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
      <div className="section-header1">
        <div>
          <h2>Gestion des Litiges</h2>
          <p className="section-subtitle1">Suivez et traitez tous les litiges de la plateforme</p>
        </div>
        <div className="section-actions">
          <button className="btn-secondary">
            <Download size={18} />
            Exporter
          </button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="quick-stats-grid">
        <div className="quick-stat-card">
          <span className="quick-stat-value">{stats.total}</span>
          <span className="quick-stat-label">Total litiges</span>
        </div>
        <div className="quick-stat-card warning">
          <span className="quick-stat-value">{stats.en_attente}</span>
          <span className="quick-stat-label">En attente</span>
        </div>
        <div className="quick-stat-card info">
          <span className="quick-stat-value">{stats.en_cours}</span>
          <span className="quick-stat-label">En cours</span>
        </div>
        <div className="quick-stat-card success">
          <span className="quick-stat-value">{stats.resolu}</span>
          <span className="quick-stat-label">Résolus</span>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par commande, vendeur ou type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filters-group">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="en_cours">En cours</option>
            <option value="resolu">Résolus</option>
          </select>
          <button className="filter-btn">
            <Filter size={18} />
            Plus de filtres
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="table-container" style={{ overflowX: 'auto' }}>
        <table className="admin-table" style={{ minWidth: '800px' }}>
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
            {filteredLitiges.length > 0 ? (
              filteredLitiges.map((litige) => {
                const StatusBadge = getStatusBadge(litige.statut);
                const PrioriteBadge = getPrioriteBadge(litige.priorite);
                return (
                  <tr key={litige.id}>
                    <td>
                      <div className="order-id-cell font-semibold" style={{ color: '#2563eb' }}>{litige.commande}</div>
                      <div className="text-muted" style={{ fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className={`badge ${PrioriteBadge.color}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                          {PrioriteBadge.label}
                        </span>
                        {litige.montant}
                      </div>
                    </td>
                    <td>
                      <div className="contact-info" style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Store size={14} className="text-gray-500" /> {litige.vendeur}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Truck size={14} className="text-gray-500" /> {litige.livreur}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px' }}>
                        <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>{litige.type}</div>
                        <div style={{ color: '#64748b', fontSize: '12px', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                          <MessageCircle size={12} className="mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{litige.description}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '13px', color: '#64748b' }}>{litige.date}</td>
                    <td>
                      <span className={`badge ${StatusBadge.color}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <StatusBadge.icon size={12} />
                        {StatusBadge.label}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
                        <button className="action-btn" title="Voir les détails" style={{ padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <AlertCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p>Aucun litige ne correspond à vos critères.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="table-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '0 0.5rem' }}>
        <div className="table-info" style={{ fontSize: '14px', color: '#64748b' }}>
          Affichage de {filteredLitiges.length} sur {litiges.length} litiges
        </div>
        <div className="pagination" style={{ display: 'flex', gap: '4px' }}>
          <button className="page-btn" disabled style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: 'white', cursor: 'not-allowed' }}>Précédent</button>
          <button className="page-btn active" style={{ padding: '6px 12px', border: '1px solid #2563eb', borderRadius: '6px', background: '#2563eb', color: 'white' }}>1</button>
          <button className="page-btn" style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>Suivant</button>
        </div>
      </div>
    </motion.div>
  );
};

export default LitigesSection;