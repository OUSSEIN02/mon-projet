import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Search, Edit, CheckCircle, XCircle, Clock,
  Filter, Download, MoreHorizontal, UserPlus, Mail, Phone, Eye,
  MapPin, Truck, HelpCircle, ChevronLeft, ChevronRight
} from 'lucide-react';

import apiClient from '../../../services/apiClient';
import Loader from '../../../utils/Loader';
import LivreurDetailsSection from '../details/LivreurDetailsSection';
import defaultAvatar from '../../../assets/default-avatar.jpg';

const LivreursSection = () => {
  const { livreurId } = useParams();
  const navigate = useNavigate();

  // États des données
  const [livreurs, setLivreurs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);

  // États des filtres et pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterZone, setFilterZone] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // --- 1. CHARGEMENT DES DONNÉES (Avec Debounce) ---
  const fetchLivreurs = useCallback(async () => {
    if (currentPage === 1 && !searchTerm && filterStatus === 'all' && filterZone === 'all') {
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
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterZone !== 'all' && { zone: filterZone })
      });

      const response = await apiClient.get(`/dashboard/livreurs?${params.toString()}`);
      const responseData = response.data;
      const data = responseData.data || responseData;
      
      setLivreurs(Array.isArray(data) ? data : []);
      setTotalItems(responseData.total || (Array.isArray(data) ? data.length : 0));
      setTotalPages(responseData.last_page || 1);
      
    } catch (err) {
      console.error("Erreur chargement livreurs:", err);
      setError("Impossible de charger la liste des livreurs.");
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [currentPage, searchTerm, filterStatus, filterZone]);

  // Debounce : Attend 500ms après la dernière modification des filtres
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLivreurs();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchLivreurs]);

  // --- 2. TRANSFORMATION DES DONNÉES POUR L'UI ---
  const formattedLivreurs = useMemo(() => {
    return livreurs.map(l => {
      let validationStatut = 'En attente';
      if (l.status === 'actif' || l.status === 'valide') validationStatut = 'validé';
      else if (l.status === 'suspendu') validationStatut = 'suspendu';

      let zonesArray = [];
      if (typeof l.zones_livraison === 'string') {
        try { zonesArray = JSON.parse(l.zones_livraison); } 
        catch { zonesArray = [l.zones_livraison]; }
      } else if (Array.isArray(l.zones_livraison)) {
        zonesArray = l.zones_livraison;
      }

      return {
        id: l.id,
        nom: l.user?.name || 'Inconnu',
        email: l.user?.email || 'N/A',
        telephone: l.user?.phone || 'N/A',
        zones: zonesArray,
        validationStatut: validationStatut,
        disponibilite: l.disponibilite || 'indisponible',
        livraisons: l.livraisons_count || 0,
        vehicule: 'Moto', 
        photo: l.user?.avatar || l.photo_identite_path || defaultAvatar
      };
    });
  }, [livreurs]);

  // --- 3. GESTIONNAIRES DE FILTRES ---
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (e) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1);
  };

  const handleZoneChange = (e) => {
    setFilterZone(e.target.value);
    setCurrentPage(1);
  };

  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // --- 4. GESTION DE L'AFFICHAGE DÉTAILLÉ ---
  if (livreurId) {
    if (isLoading) return <Loader text="Chargement du profil du livreur..." fullScreen={false} size="lg" />;
    
    const selectedLivreur = formattedLivreurs.find(l => l.id === parseInt(livreurId));
    if (!selectedLivreur) {
      return (
        <div className="ls-empty">
          <p className="ls-empty-text" style={{ color: '#dc2626' }}>Livreur introuvable.</p>
          <button onClick={() => navigate('/dashboard/livreurs')} className="ls-btn ls-btn-secondary">
            Retour à la liste
          </button>
        </div>
      );
    }

    return (
      <LivreurDetailsSection 
        livreurData={selectedLivreur} 
        onGoBack={() => navigate('/dashboard/livreurs')} 
      />
    );
  }

  // --- 5. HELPERS D'AFFICHAGE ---
  const getValidationBadge = (statut) => {
    const badges = {
      "En attente": { color: 'ls-badge-warning', icon: Clock, label: 'En attente' },
      "validé": { color: 'ls-badge-success', icon: CheckCircle, label: 'Validé' },
      "suspendu": { color: 'ls-badge-danger', icon: XCircle, label: 'Suspendu' },
    };
    return badges[statut] || { color: 'ls-badge-secondary', icon: HelpCircle, label: statut || 'Inconnu' };
  };

  const handleViewLivreur = (id) => {
    navigate(`/dashboard/livreurs/${id}`);
  };

  // --- 6. RENDU PRINCIPAL ---
  if (isLoading && currentPage === 1 && !searchTerm && filterStatus === 'all' && filterZone === 'all') {
    return <Loader text="Chargement des livreurs..." fullScreen={false} size="lg" />;
  }

  if (error) {
    return (
      <div className="ls-empty">
        <p className="ls-empty-text" style={{ color: '#dc2626' }}>{error}</p>
        <button onClick={() => window.location.reload()} className="ls-btn ls-btn-primary">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="ls-container"
    >
      {/* Header */}
      <div className="ls-header">
        <div className="ls-header-left">
          <h2 className="ls-title">
            <Truck className="ls-title-icon" size={28} />
            Gestion des Livreurs
          </h2>
          <p className="ls-subtitle">Gérez tous les livreurs de la plateforme</p>
        </div>
        <div className="ls-header-right">
          <Link to="/dashboard/create-livreur" className="ls-btn ls-btn-primary">
            <UserPlus size={18} />
            Ajouter un livreur
          </Link>
          <button className="ls-btn ls-btn-secondary">
            <Download size={18} />
            Exporter
          </button>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="ls-card ls-filters">
        <div className="ls-filters-grid">
          <div className="ls-filter-group ls-filter-search">
            <label htmlFor="search" className="ls-filter-label">Rechercher</label>
            <div className="ls-input-wrapper">
              <Search className="ls-input-icon" size={18} />
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                className="ls-input"
                placeholder="Rechercher par nom, email ou téléphone..."
              />
            </div>
          </div>

          <div className="ls-filter-group">
            <label htmlFor="status-filter" className="ls-filter-label">Statut</label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={handleStatusChange}
              className="ls-select"
            >
              <option value="all">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="valide">Validé</option>
              <option value="suspendu">Suspendu</option>
            </select>
          </div>

          <div className="ls-filter-group">
          <label htmlFor="zone-filter" className="ls-filter-label">Zone</label>
          <select
            id="zone-filter"
            value={filterZone}
            onChange={handleZoneChange}
            className="ls-select"
          >
            <option value="all">Toutes les zones</option>
            <option value="Moyen-Ogooué (Lambaréné)">Moyen-Ogooué (Lambaréné)</option>
            <option value="Ngounié (Mouila)">Ngounié (Mouila)</option>
            <option value="Nyanga (Tchibanga)">Nyanga (Tchibanga)</option>
            <option value="Ogooué-Ivindo (Makokou)">Ogooué-Ivindo (Makokou)</option>
            
          </select>
        </div>
        </div>
      </div>

      {/* Liste des livreurs */}
      <div className="ls-card ls-list-card">
        
        {/* ✅ NOUVEAU SPINNER (Style identique à UsersSection, avec préfixe ls-) */}
        {(isLoading || isSearching) && (
          <div className="ls-loading">
            <div className="ls-spinner"></div>
            <p className="ls-loading-text">
              {isLoading ? "Chargement des livreurs..." : "Recherche en cours..."}
            </p>
          </div>
        )}

        {/* État vide (affiché seulement si pas de chargement) */}
        {!isLoading && !isSearching && formattedLivreurs.length === 0 && (
          <div className="ls-empty">
            <Search className="ls-empty-icon" size={48} />
            <h3 className="ls-empty-title">Aucun livreur trouvé</h3>
            <p className="ls-empty-text">
              {searchTerm || filterStatus !== 'all' || filterZone !== 'all' 
                ? "Aucun résultat ne correspond à vos filtres." 
                : "Commencez par ajouter un nouveau livreur."}
            </p>
          </div>
        )}

        {/* Tableau (affiché seulement si pas de chargement et données présentes) */}
        {!isLoading && !isSearching && formattedLivreurs.length > 0 && (
          <div className="ls-desktop-table">
            <table className="ls-table">
              <thead>
                <tr>
                  <th>Livreur</th>
                  <th>Contact</th>
                  <th>Zone</th>
                  <th>Véhicule</th>
                  <th>Livraisons</th>
                  <th>Statut</th>
                  <th className="ls-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {formattedLivreurs.map((livreur) => {
                  const StatusBadge = getValidationBadge(livreur.validationStatut);
                  return (
                    <tr key={livreur.id}>
                      <td>
                        <div className="ls-user-cell">
                          <div className="ls-avatar ls-avatar-sm">
                            <img 
                              src={livreur.photo} 
                              alt={livreur.nom} 
                              className="ls-avatar-img"
                              onError={(e) => { e.target.src = defaultAvatar; }} 
                            />
                          </div>
                          <div className="ls-user-info">
                            <div className="ls-user-name">{livreur.nom}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="ls-contact-info">
                          <div className="ls-contact-row"><Mail size={14} /> {livreur.email}</div>
                          <div className="ls-contact-row"><Phone size={14} /> {livreur.telephone}</div>
                        </div>
                      </td>
                      <td>
                        <div className="ls-zone-badge">
                          <MapPin size={14} />
                          {livreur.zones.length > 2
                            ? `${livreur.zones.slice(0, 2).join(", ")}...`
                            : (livreur.zones.length > 0 ? livreur.zones.join(", ") : 'Non définie')}
                        </div>
                      </td>
                      <td>
                        <div className="ls-vehicle-badge">
                          <Truck size={14} />
                          {livreur.vehicule}
                        </div>
                      </td>
                      <td className="ls-text-center ls-font-semibold">{livreur.livraisons}</td>
                      <td>
                        <span className={`ls-badge ${StatusBadge.color}`}>
                          <StatusBadge.icon size={12} />
                          {StatusBadge.label}
                        </span>
                      </td>
                      <td>
                        <div className="ls-actions-cell">
                          <button className="ls-icon-btn ls-icon-btn-view" title="Voir les détails" onClick={() => handleViewLivreur(livreur.id)}>
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
          <div className="ls-pagination">
            <div className="ls-pagination-info">
              <p className="ls-pagination-info-desktop">
                Affichage de <span className="ls-font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> à{' '}
                <span className="ls-font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> sur{' '}
                <span className="ls-font-medium">{totalItems}</span> résultats
              </p>
            </div>
            <div className="ls-pagination-buttons">
              <button 
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
                className="ls-btn ls-btn-pagination"
              >
                <ChevronLeft size={18} />
                <span>Précédent</span>
              </button>
              <button 
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ls-btn ls-btn-pagination"
              >
                <span>Suivant</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CSS Unique et Préfixé (ls-) */}
      <style>{`
        .ls-container { max-width: 1280px; margin: 0 auto; padding: 24px; color: #111827; }
        .ls-container * { box-sizing: border-box; }
        .ls-header { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
        .ls-title { font-size: 22px; font-weight: 700; color: #111827; margin: 0; display: flex; align-items: center; gap: 12px; }
        .ls-title-icon { color: #F26A22; }
        .ls-subtitle { margin-top: 4px; font-size: 14px; color: #6b7280; }
        .ls-header-right { display: flex; gap: 12px; flex-wrap: wrap; }
        .ls-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; font-size: 14px; font-weight: 600; border-radius: 8px; border: 1px solid transparent; cursor: pointer; transition: all 0.2s; text-decoration: none; white-space: nowrap; }
        .ls-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ls-btn-primary { background: #F26A22; color: white; box-shadow: 0 2px 4px rgba(242, 106, 34, 0.2); }
        .ls-btn-primary:hover:not(:disabled) { background: #d95a1a; transform: translateY(-1px); }
        .ls-btn-secondary { background: white; color: #111827; border-color: #d1d5db; }
        .ls-btn-secondary:hover:not(:disabled) { background: #f3f4f6; border-color: #9ca3af; }
        .ls-btn-pagination { background: white; color: #111827; border-color: #d1d5db; padding: 10px 16px; font-weight: 500; }
        .ls-btn-pagination:hover:not(:disabled) { background: #f9fafb; border-color: #F26A22; color: #F26A22; }
        .ls-card { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #f3f4f6; overflow: hidden; position: relative; }
        .ls-filters { margin-bottom: 24px; padding: 24px; }
        .ls-filters-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        .ls-filter-group { display: flex; flex-direction: column; }
        .ls-filter-label { display: block; font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 8px; }
        .ls-input-wrapper { position: relative; }
        .ls-input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; }
        .ls-input, .ls-select { width: 100%; padding: 10px 14px 10px 42px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white; color: #111827; transition: all 0.2s; }
        .ls-select { padding-left: 14px; cursor: pointer; }
        .ls-input:focus, .ls-select:focus { outline: none; border-color: #F26A22; box-shadow: 0 0 0 3px rgba(242, 106, 34, 0.1); }
        
        /* ✅ NOUVEAU CSS DU SPINNER (Identique à us-loading, préfixé ls-) */
        .ls-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 256px; }
        .ls-spinner { width: 48px; height: 48px; border: 3px solid #f3f4f6; border-top-color: #F26A22; border-radius: 50%; animation: ls-spin 0.8s linear infinite; }
        @keyframes ls-spin { to { transform: rotate(360deg); } }
        .ls-loading-text { margin-top: 16px; color: #6b7280; font-weight: 500; }
        
        .ls-empty { text-align: center; padding: 48px 20px; }
        .ls-empty-icon { color: #d1d5db; margin: 0 auto 16px; }
        .ls-empty-title { font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 8px 0; }
        .ls-empty-text { font-size: 14px; color: #6b7280; margin: 0; }
        .ls-desktop-table { overflow-x: auto; }
        .ls-table { width: 100%; border-collapse: collapse; min-width: 800px; }
        .ls-table thead { background: #fafafa; }
        .ls-table th { padding: 14px 24px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #f3f4f6; }
        .ls-th-actions { width: 1%; white-space: nowrap; text-align: right; }
        .ls-table td { padding: 16px 24px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
        .ls-table tbody tr { transition: background 0.2s; }
        .ls-table tbody tr:hover { background: #fafafa; }
        .ls-user-cell { display: flex; align-items: center; gap: 12px; }
        .ls-avatar-sm { width: 40px; height: 40px; border-radius: 50%; background: #fff0eb; flex-shrink: 0; overflow: hidden; border: 2px solid white; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .ls-avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .ls-user-name { font-size: 14px; font-weight: 600; color: #111827; }
        .ls-contact-info { display: flex; flex-direction: column; gap: 4px; }
        .ls-contact-row { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #6b7280; }
        .ls-zone-badge, .ls-vehicle-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; background: #f3f4f6; color: #374151; }
        .ls-text-center { text-align: center; }
        .ls-font-semibold { font-weight: 600; }
        .ls-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; white-space: nowrap; }
        .ls-badge-warning { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
        .ls-badge-success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        .ls-badge-danger { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
        .ls-badge-secondary { background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }
        .ls-actions-cell { display: flex; justify-content: flex-end; gap: 8px; }
        .ls-icon-btn {  cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; background: transparent; }
        .ls-icon-btn-view { color: #2563eb; }
        .ls-icon-btn-view:hover { background: #eff6ff; }
        .ls-icon-btn-edit { color: #374151; }
        .ls-icon-btn-edit:hover { background: #f3f4f6; }
        .ls-icon-btn-more { color: #6b7280; }
        .ls-icon-btn-more:hover { background: #f3f4f6; }
        .ls-pagination { padding: 20px 24px; border-top: 1px solid #f3f4f6; background: #fafafa; display: flex; flex-direction: column; gap: 16px; align-items: center; }
        .ls-pagination-info { font-size: 14px; color: #6b7280; margin: 0; }
        .ls-pagination-info .ls-font-medium { font-weight: 600; color: #111827; }
        .ls-pagination-buttons { display: flex; gap: 8px; }
        @media (min-width: 768px) {
          .ls-header { flex-direction: row; align-items: center; justify-content: space-between; }
          .ls-filters-grid { grid-template-columns: 2fr 1fr 1fr; gap: 24px; }
          .ls-pagination { flex-direction: row; justify-content: space-between; }
        }
        @media (max-width: 767px) {
          .ls-container { padding: 16px; }
          .ls-title { font-size: 22px; }
          .ls-btn { width: 100%; }
          .ls-table th, .ls-table td { padding: 12px 16px; }
        }
      `}</style>
    </motion.div>
  );
};

export default LivreursSection;