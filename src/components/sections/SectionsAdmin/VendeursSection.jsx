import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Search, Plus, Edit, Trash2, CheckCircle, XCircle, Clock,
  Filter, Download, MoreHorizontal, UserPlus, Mail, Phone,
  MapPin, Building, Star, Shield, Eye
} from 'lucide-react';

import apiClient from '../../../services/apiClient';
import Loader from '../../../utils/Loader';
import VendeurDetailsSection from '../details/VendeurDetailsSection';
import defaultAvatar from '../../../assets/default-avatar.jpg';

const VendeursSection = () => {
  const { vendeurId } = useParams();
  const navigate = useNavigate();
  
  // États pour les données dynamiques
  const [vendeurs, setVendeurs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // --- 1. CHARGEMENT DES DONNÉES ---
  useEffect(() => {
    const fetchVendeurs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get('/dashboard/vendeurs');
        const rawData = response.data.data || [];
        
        // Formatage des données pour qu'elles correspondent à ton design existant
        const formattedData = rawData.map(v => ({
          id: v.id,
          nom: v.company_name || v.user?.name || 'Sans nom',
          email: v.email || v.user?.email || 'N/A',
          telephone: v.phone || v.user?.phone || 'N/A',
          siret: v.siret || 'Non renseigné',
          adresse: [v.address, v.city].filter(Boolean).join(', ') || 'Non renseignée',
          zone: v.city || 'N/A',
          // Mapping du statut backend vers le statut de ton design
          statut: (v.status === 'actif' || v.status === 'valide') ? 'actif' : 
                  (v.status === 'en_attente' ? 'en_attente' : 'suspendu'),
          commandes: v.orders_count || 0,
          note: v.note_moyenne || 0,
          dateInscription: v.created_at,
          photo: v.selfie_path || defaultAvatar
        }));
        
        setVendeurs(formattedData);
      } catch (err) {
        console.error("Erreur chargement vendeurs:", err);
        setError("Impossible de charger la liste des vendeurs.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendeurs();
  }, []);

  // --- 2. LOGIQUE CONDITIONNELLE POUR LES DÉTAILS ---
  if (vendeurId) {
    if (isLoading) return <Loader text="Chargement du vendeur..." fullScreen={false} size="lg" />;
    
    const selectedVendeur = vendeurs.find(v => v.id === parseInt(vendeurId));
    if (!selectedVendeur) {
      return (
        <div className="section-container1 text-center p-8">
          <p className="text-red-500 mb-4">Vendeur introuvable.</p>
          <button onClick={() => navigate('/dashboard/vendeurs')} className="btn-secondary">
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

  // --- 3. CALCUL DES STATS DYNAMIQUES ---
  const statusStats = {
    total: vendeurs.length,
    actif: vendeurs.filter(v => v.statut === 'actif').length,
    en_attente: vendeurs.filter(v => v.statut === 'en_attente').length,
    suspendu: vendeurs.filter(v => v.statut === 'suspendu').length
  };

  // --- 4. FILTRAGE DYNAMIQUE ---
  const filteredVendeurs = vendeurs.filter(v => {
    const matchSearch = v.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       v.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       v.telephone.includes(searchTerm);
    const matchStatus = filterStatus === 'all' || v.statut === filterStatus;
    return matchSearch && matchStatus;
  });

  // --- 5. HELPERS ---
  const getStatusBadge = (statut) => {
    const badges = {
      actif: { color: 'badge-success', icon: CheckCircle, label: 'Actif' },
      en_attente: { color: 'badge-warning', icon: Clock, label: 'En attente' },
      suspendu: { color: 'badge-danger', icon: XCircle, label: 'Suspendu' },
    };
    return badges[statut] || badges.actif;
  };

  const handleViewVendeur = (id) => {
    navigate(`/dashboard/vendeurs/${id}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // --- 6. RENDU PRINCIPAL ---
  if (isLoading) {
    return <Loader text="Chargement des vendeurs..." fullScreen={false} size="lg" />;
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
          <h2>Gestion des Vendeurs</h2>
          <p className="section-subtitle1">Gérez tous les vendeurs de la plateforme</p>
        </div>
        <div className="section-actions1">
          <Link to="/dashboard/create-seller" className="btn-primary">
            <UserPlus size={18} />
            Ajouter un vendeur
          </Link>
          <button className="btn-secondary">
            <Download size={18} />
            Exporter
          </button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="quick-stats-grid">
        <div className="quick-stat-card">
          <span className="quick-stat-value">{statusStats.total}</span>
          <span className="quick-stat-label">Total vendeurs</span>
        </div>
        <div className="quick-stat-card success">
          <span className="quick-stat-value">{statusStats.actif}</span>
          <span className="quick-stat-label">Actifs</span>
        </div>
        <div className="quick-stat-card warning">
          <span className="quick-stat-value">{statusStats.en_attente}</span>
          <span className="quick-stat-label">En attente</span>
        </div>
        <div className="quick-stat-card danger">
          <span className="quick-stat-value">{statusStats.suspendu}</span>
          <span className="quick-stat-label">Suspendus</span>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher un vendeur..."
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
            <option value="actif">Actifs</option>
            <option value="en_attente">En attente</option>
            <option value="suspendu">Suspendus</option>
          </select>
          <button className="filter-btn">
            <Filter size={18} />
            Plus de filtres
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Vendeur</th>
              <th>Contact</th>
              <th>Commandes</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVendeurs.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center p-8 text-gray-500">
                  Aucun vendeur ne correspond à vos critères.
                </td>
              </tr>
            ) : (
              filteredVendeurs.map((vendeur) => {
                const StatusBadge = getStatusBadge(vendeur.statut);
                return (
                  <tr key={vendeur.id}>
                    <td>
                      <div className="vendeur-info">
                        <div className="vendeur-avatar">
                          <img src={vendeur.photo} alt="photo" onError={(e) => { e.target.src = defaultAvatar; }} />
                        </div>
                        <div>
                          <div className="vendeur-name">{vendeur.nom}</div>
                          <div className="vendeur-siret">SIRET: {vendeur.siret}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div><Mail size={14} /> {vendeur.email}</div>
                        <div><Phone size={14} /> {vendeur.telephone}</div>
                      </div>
                    </td>
                    <td className="text-center font-semibold">{vendeur.commandes}</td>
                    <td>
                      <span className={`badge ${StatusBadge.color}`}>
                        <StatusBadge.icon size={12} />
                        {StatusBadge.label}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn" 
                          title="Voir les détails"
                          onClick={() => handleViewVendeur(vendeur.id)}
                        >
                          <Eye size={16} />
                        </button>
                        <button className="action-btn" title="Modifier">
                          <Edit size={16} />
                        </button>
                        <button className="action-btn" title="Plus">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="table-footer">
        <div className="table-info">
          Affichage de {filteredVendeurs.length} sur {vendeurs.length} vendeurs
        </div>
        <div className="pagination">
          <button className="page-btn" disabled>Précédent</button>
          <button className="page-btn active">1</button>
          <button className="page-btn">2</button>
          <button className="page-btn">3</button>
          <button className="page-btn">Suivant</button>
        </div>
      </div>
    </motion.div>
  );
};

export default VendeursSection;