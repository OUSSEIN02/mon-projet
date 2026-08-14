import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Search, Edit, Trash2, CheckCircle, XCircle, Clock,
  Filter, Download, MoreHorizontal, UserPlus, Mail, Phone,
  MapPin, Building, Star, Shield, Eye, ChevronLeft, ChevronRight
} from 'lucide-react';

import apiClient from '../../../services/apiClient';
import Loader from '../../../utils/Loader';
import VendeurDetailsSection from '../details/VendeurDetailsSection';
import defaultAvatar from '../../../assets/default-avatar.jpg';

const VendeursSection = () => {
  const { vendeurId } = useParams();
  const navigate = useNavigate();
  
  // États des données
  const [vendeurs, setVendeurs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);

  // États des filtres et pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // --- 1. CHARGEMENT DES DONNÉES (Avec Debounce) ---
  const fetchVendeurs = useCallback(async () => {
    if (currentPage === 1 && !searchTerm && filterStatus === 'all') {
      setIsLoading(true);
    } else {
      setIsSearching(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage,
        per_page: itemsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus !== 'all' && { status: filterStatus })
      });

      const response = await apiClient.get(`/dashboard/vendeurs?${params.toString()}`);
      const responseData = response.data;
      const data = responseData.data || responseData;
      
      // Formatage des données
      const formattedData = (Array.isArray(data) ? data : []).map(v => ({
        id: v.id,
        nom: v.company_name || v.user?.name || 'Sans nom',
        email: v.email || v.user?.email || 'N/A',
        telephone: v.phone || v.user?.phone || 'N/A',
        siret: v.siret || 'Non renseigné',
        adresse: [v.address, v.city].filter(Boolean).join(', ') || 'Non renseignée',
        zone: v.city || 'N/A',
        statut: (v.status === 'actif' || v.status === 'valide') ? 'actif' : 
                (v.status === 'en_attente' ? 'en_attente' : 'suspendu'),
        commandes: v.orders_count || 0,
        note: v.note_moyenne || 0,
        dateInscription: v.created_at,
        photo: v.selfie_path || v.user?.avatar || defaultAvatar
      }));
      
      setVendeurs(formattedData);
      setTotalItems(responseData.total || (Array.isArray(data) ? data.length : 0));
      setTotalPages(responseData.last_page || 1);
      
    } catch (err) {
      console.error("Erreur chargement vendeurs:", err);
      setError("Impossible de charger la liste des vendeurs.");
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [currentPage, searchTerm, filterStatus]);

  // Debounce : Attend 500ms après la dernière modification des filtres
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVendeurs();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchVendeurs]);

  // --- 2. GESTIONNAIRES DE FILTRES ---
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (e) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1);
  };

  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // --- 3. LOGIQUE CONDITIONNELLE POUR LES DÉTAILS ---
  if (vendeurId) {
    if (isLoading) return <Loader text="Chargement du vendeur..." fullScreen={false} size="lg" />;
    
    const selectedVendeur = vendeurs.find(v => v.id === parseInt(vendeurId));
    if (!selectedVendeur) {
      return (
        <div className="vs-empty">
          <p className="vs-empty-text" style={{ color: '#dc2626' }}>Vendeur introuvable.</p>
          <button onClick={() => navigate('/dashboard/vendeurs')} className="vs-btn vs-btn-secondary">
            Retour à la liste
          </button>
        </div>
      );
    }

    return (
      <VendeurDetailsSection 
        vendeurData={selectedVendeur} 
        onGoBack={() => navigate('/dashboard/vendeurs')} 
      />
    );
  }

  // --- 4. CALCUL DES STATS DYNAMIQUES (Basé sur le total de la page actuelle ou total global si disponible) ---
  // Note: Pour des stats globales précises avec pagination, il vaut mieux les faire calculer par le backend.
  // Ici, on affiche les stats de la page courante pour l'exemple, ou on utilise les totaux si le backend les renvoie.
  const statusStats = useMemo(() => ({
    total: totalItems,
    actif: vendeurs.filter(v => v.statut === 'actif').length,
    en_attente: vendeurs.filter(v => v.statut === 'en_attente').length,
    suspendu: vendeurs.filter(v => v.statut === 'suspendu').length
  }), [vendeurs, totalItems]);

  // --- 5. HELPERS ---
  const getStatusBadge = (statut) => {
    const badges = {
      actif: { color: 'vs-badge-success', icon: CheckCircle, label: 'Actif' },
      en_attente: { color: 'vs-badge-warning', icon: Clock, label: 'En attente' },
      suspendu: { color: 'vs-badge-danger', icon: XCircle, label: 'Suspendu' },
    };
    return badges[statut] || badges.actif;
  };

  const handleViewVendeur = (id) => {
    navigate(`/dashboard/vendeurs/${id}`);
  };

  // --- 6. RENDU PRINCIPAL ---
  if (isLoading && currentPage === 1 && !searchTerm && filterStatus === 'all') {
    return <Loader text="Chargement des vendeurs..." fullScreen={false} size="lg" />;
  }

  if (error) {
    return (
      <div className="vs-empty">
        <p className="vs-empty-text" style={{ color: '#dc2626' }}>{error}</p>
        <button onClick={() => window.location.reload()} className="vs-btn vs-btn-primary">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="vs-container"
    >
      {/* Header */}
      <div className="vs-header">
        <div className="vs-header-left">
          <h2 className="vs-title">
            <Building className="vs-title-icon" size={28} />
            Gestion des Vendeurs
          </h2>
          <p className="vs-subtitle">Gérez tous les vendeurs de la plateforme</p>
        </div>
        <div className="vs-header-right">
          <Link to="/dashboard/create-seller" className="vs-btn vs-btn-primary">
            <UserPlus size={18} />
            Ajouter un vendeur
          </Link>
          <button className="vs-btn vs-btn-secondary">
            <Download size={18} />
            Exporter
          </button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="vs-quick-stats-grid">
        <div className="vs-quick-stat-card">
          <span className="vs-quick-stat-value">{statusStats.total}</span>
          <span className="vs-quick-stat-label">Total vendeurs</span>
        </div>
        <div className="vs-quick-stat-card success">
          <span className="vs-quick-stat-value">{statusStats.actif}</span>
          <span className="vs-quick-stat-label">Actifs</span>
        </div>
        <div className="vs-quick-stat-card warning">
          <span className="vs-quick-stat-value">{statusStats.en_attente}</span>
          <span className="vs-quick-stat-label">En attente</span>
        </div>
        <div className="vs-quick-stat-card danger">
          <span className="vs-quick-stat-value">{statusStats.suspendu}</span>
          <span className="vs-quick-stat-label">Suspendus</span>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="vs-card vs-filters">
        <div className="vs-filters-grid">
          <div className="vs-filter-group vs-filter-search">
            <label htmlFor="search" className="vs-filter-label">Rechercher</label>
            <div className="vs-input-wrapper">
              <Search className="vs-input-icon" size={18} />
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                className="vs-input"
                placeholder="Rechercher par nom, email ou téléphone..."
              />
            </div>
          </div>

          <div className="vs-filter-group">
            <label htmlFor="status-filter" className="vs-filter-label">Statut</label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={handleStatusChange}
              className="vs-select"
            >
              <option value="all">Tous les statuts</option>
              <option value="actif">Actifs</option>
              <option value="en_attente">En attente</option>
              <option value="suspendu">Suspendus</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des vendeurs */}
      <div className="vs-card vs-list-card">
        
        {/* ✅ SPINNER DE CHARGEMENT (Style identique à Users/Livreurs) */}
        {(isLoading || isSearching) && (
          <div className="vs-loading">
            <div className="vs-spinner"></div>
            <p className="vs-loading-text">
              {isLoading ? "Chargement des vendeurs..." : "Recherche en cours..."}
            </p>
          </div>
        )}

        {/* État vide */}
        {!isLoading && !isSearching && vendeurs.length === 0 && (
          <div className="vs-empty">
            <Search className="vs-empty-icon" size={48} />
            <h3 className="vs-empty-title">Aucun vendeur trouvé</h3>
            <p className="vs-empty-text">
              {searchTerm || filterStatus !== 'all' 
                ? "Aucun résultat ne correspond à vos critères." 
                : "Commencez par ajouter un nouveau vendeur."}
            </p>
          </div>
        )}

        {/* Tableau */}
        {!isLoading && !isSearching && vendeurs.length > 0 && (
          <div className="vs-desktop-table">
            <table className="vs-table">
              <thead>
                <tr>
                  <th>Vendeur</th>
                  <th>Contact</th>
                  <th>Commandes</th>
                  <th>Statut</th>
                  <th className="vs-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendeurs.map((vendeur) => {
                  const StatusBadge = getStatusBadge(vendeur.statut);
                  return (
                    <tr key={vendeur.id}>
                      <td>
                        <div className="vs-user-cell">
                          <div className="vs-avatar vs-avatar-sm">
                            <img 
                              src={vendeur.photo} 
                              alt={vendeur.nom} 
                              className="vs-avatar-img"
                              onError={(e) => { e.target.src = defaultAvatar; }} 
                            />
                          </div>
                          <div className="vs-user-info">
                            <div className="vs-user-name">{vendeur.nom}</div>
                            <div className="vs-user-siret">SIRET: {vendeur.siret}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="vs-contact-info">
                          <div className="vs-contact-row"><Mail size={14} /> {vendeur.email}</div>
                          <div className="vs-contact-row"><Phone size={14} /> {vendeur.telephone}</div>
                        </div>
                      </td>
                      <td className="vs-text-center vs-font-semibold">{vendeur.commandes}</td>
                      <td>
                        <span className={`vs-badge ${StatusBadge.color}`}>
                          <StatusBadge.icon size={12} />
                          {StatusBadge.label}
                        </span>
                      </td>
                      <td>
                        <div className="vs-actions-cell">
                          <button 
                            className="vs-icon-btn vs-icon-btn-view" 
                            title="Voir les détails"
                            onClick={() => handleViewVendeur(vendeur.id)}
                          >
                            <Eye size={18} />
                          </button>
                         
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !isSearching && totalPages > 1 && (
          <div className="vs-pagination">
            <div className="vs-pagination-info">
              <p className="vs-pagination-info-desktop">
                Affichage de <span className="vs-font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> à{' '}
                <span className="vs-font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> sur{' '}
                <span className="vs-font-medium">{totalItems}</span> résultats
              </p>
            </div>
            <div className="vs-pagination-buttons">
              <button 
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
                className="vs-btn vs-btn-pagination"
              >
                <ChevronLeft size={18} />
                <span>Précédent</span>
              </button>
              <button 
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="vs-btn vs-btn-pagination"
              >
                <span>Suivant</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CSS Unique et Préfixé (vs-) */}
      <style>{`
        .vs-container { max-width: 1280px; margin: 0 auto; padding: 24px; color: #111827; }
        .vs-container * { box-sizing: border-box; }
        .vs-header { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
        .vs-title { font-size: 28px; font-weight: 700; color: #111827; margin: 0; display: flex; align-items: center; gap: 12px; }
        .vs-title-icon { color: #F26A22; }
        .vs-subtitle { margin-top: 4px; font-size: 14px; color: #6b7280; }
        .vs-header-right { display: flex; gap: 12px; flex-wrap: wrap; }
        .vs-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; font-size: 14px; font-weight: 600; border-radius: 8px; border: 1px solid transparent; cursor: pointer; transition: all 0.2s; text-decoration: none; white-space: nowrap; }
        .vs-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .vs-btn-primary { background: #F26A22; color: white; box-shadow: 0 2px 4px rgba(242, 106, 34, 0.2); }
        .vs-btn-primary:hover:not(:disabled) { background: #d95a1a; transform: translateY(-1px); }
        .vs-btn-secondary { background: white; color: #111827; border-color: #d1d5db; }
        .vs-btn-secondary:hover:not(:disabled) { background: #f3f4f6; border-color: #9ca3af; }
        .vs-btn-pagination { background: white; color: #111827; border-color: #d1d5db; padding: 10px 16px; font-weight: 500; }
        .vs-btn-pagination:hover:not(:disabled) { background: #f9fafb; border-color: #F26A22; color: #F26A22; }
        .vs-card { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #f3f4f6; overflow: hidden; position: relative; }
        .vs-filters { margin-bottom: 24px; padding: 24px; }
        .vs-filters-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        .vs-filter-group { display: flex; flex-direction: column; }
        .vs-filter-label { display: block; font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 8px; }
        .vs-input-wrapper { position: relative; }
        .vs-input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; }
        .vs-input, .vs-select { width: 100%; padding: 10px 14px 10px 42px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white; color: #111827; transition: all 0.2s; }
        .vs-select { padding-left: 14px; cursor: pointer; }
        .vs-input:focus, .vs-select:focus { outline: none; border-color: #F26A22; box-shadow: 0 0 0 3px rgba(242, 106, 34, 0.1); }
        
        /* ✅ SPINNER DE CHARGEMENT (Identique à us-loading / ls-loading) */
        .vs-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 256px; }
        .vs-spinner { width: 48px; height: 48px; border: 3px solid #f3f4f6; border-top-color: #F26A22; border-radius: 50%; animation: vs-spin 0.8s linear infinite; }
        @keyframes vs-spin { to { transform: rotate(360deg); } }
        .vs-loading-text { margin-top: 16px; color: #6b7280; font-weight: 500; }
        
        .vs-empty { text-align: center; padding: 48px 20px; }
        .vs-empty-icon { color: #d1d5db; margin: 0 auto 16px; }
        .vs-empty-title { font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 8px 0; }
        .vs-empty-text { font-size: 14px; color: #6b7280; margin: 0; }
        
        .vs-quick-stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
        .vs-quick-stat-card { background: white; padding: 16px; border-radius: 8px; border: 1px solid #f3f4f6; display: flex; flex-direction: column; }
        .vs-quick-stat-card.success { border-left: 4px solid #22c55e; }
        .vs-quick-stat-card.warning { border-left: 4px solid #f59e0b; }
        .vs-quick-stat-card.danger { border-left: 4px solid #ef4444; }
        .vs-quick-stat-value { font-size: 24px; font-weight: 700; color: #111827; }
        .vs-quick-stat-label { font-size: 13px; color: #6b7280; margin-top: 4px; }
        
        .vs-desktop-table { overflow-x: auto; }
        .vs-table { width: 100%; border-collapse: collapse; min-width: 800px; }
        .vs-table thead { background: #fafafa; }
        .vs-table th { padding: 14px 24px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #f3f4f6; }
        .vs-th-actions { width: 1%; white-space: nowrap; text-align: right; }
        .vs-table td { padding: 16px 24px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
        .vs-table tbody tr { transition: background 0.2s; }
        .vs-table tbody tr:hover { background: #fafafa; }
        
        .vs-user-cell { display: flex; align-items: center; gap: 12px; }
        .vs-avatar-sm { width: 40px; height: 40px; border-radius: 50%; background: #fff0eb; flex-shrink: 0; overflow: hidden; border: 2px solid white; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .vs-avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .vs-user-name { font-size: 14px; font-weight: 600; color: #111827; }
        .vs-user-siret { font-size: 12px; color: #6b7280; margin-top: 2px; }
        .vs-contact-info { display: flex; flex-direction: column; gap: 4px; }
        .vs-contact-row { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #6b7280; }
        .vs-text-center { text-align: center; }
        .vs-font-semibold { font-weight: 600; }
        
        .vs-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; white-space: nowrap; }
        .vs-badge-success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        .vs-badge-warning { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
        .vs-badge-danger { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
        
        .vs-actions-cell { display: flex; justify-content: flex-end; gap: 8px; }
        .vs-icon-btn { cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; background: transparent; }
        .vs-icon-btn-view { color: #2563eb; }
        .vs-icon-btn-view:hover { background: #eff6ff; }
        .vs-icon-btn-edit { color: #374151; }
        .vs-icon-btn-edit:hover { background: #f3f4f6; }
        .vs-icon-btn-more { color: #6b7280; }
        .vs-icon-btn-more:hover { background: #f3f4f6; }
        
        .vs-pagination { padding: 20px 24px; border-top: 1px solid #f3f4f6; background: #fafafa; display: flex; flex-direction: column; gap: 16px; align-items: center; }
        .vs-pagination-info { font-size: 14px; color: #6b7280; margin: 0; }
        .vs-pagination-info .vs-font-medium { font-weight: 600; color: #111827; }
        .vs-pagination-buttons { display: flex; gap: 8px; }
        
        @media (min-width: 768px) {
          .vs-header { flex-direction: row; align-items: center; justify-content: space-between; }
          .vs-filters-grid { grid-template-columns: 2fr 1fr; gap: 24px; }
          .vs-quick-stats-grid { grid-template-columns: repeat(4, 1fr); }
          .vs-pagination { flex-direction: row; justify-content: space-between; }
        }
        @media (max-width: 767px) {
          .vs-container { padding: 16px; }
          .vs-title { font-size: 22px; }
          .vs-btn { width: 100%; }
          .vs-table th, .vs-table td { padding: 12px 16px; }
        }
      `}</style>
    </motion.div>
  );
};

export default VendeursSection;