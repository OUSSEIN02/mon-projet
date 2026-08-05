import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Search, Plus, Edit, Trash2, CheckCircle, XCircle, Clock,
  Filter, Download, MoreHorizontal, UserPlus, Mail, Phone,
  MapPin, Truck, Star, Shield, Eye, Award, TrendingUp
} from 'lucide-react';

import apiClient from '../../../services/apiClient'; // Adaptez le chemin si nécessaire
import Loader from '../../../utils/Loader';
import LivreurDetailsSection from '../details/LivreurDetailsSection';
import defaultAvatar from '../../../assets/default-avatar.jpg'; // Assurez-vous que ce chemin est correct

const LivreursSection = () => {
  const { livreurId } = useParams();
  const navigate = useNavigate();

  // États pour les données dynamiques
  const [livreurs, setLivreurs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterZone, setFilterZone] = useState('all');

  // --- 1. CHARGEMENT DES DONNÉES ---
  useEffect(() => {
    const fetchLivreurs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Adaptez l'URL selon votre route Laravel (ex: '/admin/livreurs' ou '/livreurs')
        const response = await apiClient.get('/dashboard/livreurs');
        setLivreurs(response.data.data || []);
      } catch (err) {
        console.error("Erreur chargement livreurs:", err);
        setError("Impossible de charger la liste des livreurs.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLivreurs();
  }, []);

  // --- 2. TRANSFORMATION DES DONNÉES POUR L'UI ---
  const formattedLivreurs = useMemo(() => {
    return livreurs.map(l => {
      // Mapping du statut backend vers le statut UI
      // Adaptez cette logique selon les vrais statuts de votre BDD (ex: 'valide', 'en_attente', 'suspendu')
      let uiStatut = 'indisponible';
      if (l.status === 'valide' || l.status === 'actif') uiStatut = 'disponible';
      else if (l.status === 'en_cours' || l.status === 'occupe') uiStatut = 'occupe';
      else if (l.status === 'en_attente' || l.status === 'suspendu' || l.status === 'rejete') uiStatut = 'indisponible';

      return {
        id: l.id,
        nom: l.user?.name || 'Inconnu',
        email: l.user?.email || 'N/A',
        telephone: l.user?.phone || 'N/A',
        // Gestion du tableau JSON des zones
        zone: Array.isArray(l.zones_livraison) ? l.zones_livraison.join(', ') : (l.zones_livraison || 'Non définie'),
        statut: uiStatut,
        livraisons: l.livraisons_count || 0, // Supposons que le backend fournit ce compteur
        note: l.note_moyenne || 0,
        tauxAcceptation: l.taux_acceptation ? `${l.taux_acceptation}%` : '0%',
        vehicule: 'Moto', // Ou déduire de l.type_vehicule si vous en avez un
        photo: l.user?.avatar || l.photo_identite_path || defaultAvatar
      };
    });
  }, [livreurs]);

  // --- 3. CALCUL DYNAMIQUE DES STATISTIQUES ---
  const stats = useMemo(() => ({
    total: formattedLivreurs.length,
    disponible: formattedLivreurs.filter(l => l.statut === 'disponible').length,
    occupe: formattedLivreurs.filter(l => l.statut === 'occupe').length,
    indisponible: formattedLivreurs.filter(l => l.statut === 'indisponible').length,
  }), [formattedLivreurs]);

  // --- 4. EXTRACTION DYNAMIQUE DES ZONES ---
  const uniqueZones = useMemo(() => {
    const zonesSet = new Set();
    livreurs.forEach(l => {
      if (Array.isArray(l.zones_livraison)) {
        l.zones_livraison.forEach(z => zonesSet.add(z));
      } else if (l.zones_livraison) {
        zonesSet.add(l.zones_livraison);
      }
    });
    return ['all', ...Array.from(zonesSet)];
  }, [livreurs]);

  // --- 5. FILTRAGE ---
  const filteredLivreurs = formattedLivreurs.filter(l => {
    const matchSearch = l.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       l.telephone.includes(searchTerm);
    const matchStatus = filterStatus === 'all' || l.statut === filterStatus;
    const matchZone = filterZone === 'all' || (Array.isArray(l.zones_livraison) 
      ? l.zones_livraison.includes(filterZone) 
      : l.zone === filterZone);
    
    return matchSearch && matchStatus && matchZone;
  });

  // --- 6. GESTION DE L'AFFICHAGE DÉTAILLÉ ---
  if (livreurId) {
    if (isLoading) return <Loader text="Chargement du profil du livreur..." fullScreen={true} size="lg" />;
    
    const selectedLivreur = formattedLivreurs.find(l => l.id === parseInt(livreurId));
    if (!selectedLivreur) {
      return (
        <div className="text-center p-8">
          <p className="text-red-500 mb-4">Livreur introuvable.</p>
          <button onClick={() => navigate('/dashboard/livreurs')} className="btn-secondary">
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

  // --- 7. HELPERS D'AFFICHAGE ---
  const getStatusBadge = (statut) => {
    const badges = {
      disponible: { color: 'badge-success', icon: CheckCircle, label: 'Disponible' },
      occupe: { color: 'badge-warning', icon: Clock, label: 'En livraison' },
      indisponible: { color: 'badge-danger', icon: XCircle, label: 'Indisponible' },
    };
    return badges[statut] || badges.indisponible;
  };

  const handleViewLivreur = (id) => {
    navigate(`/dashboard/livreurs/${id}`);
  };

 

  // --- 8. RENDU PRINCIPAL ---
  if (isLoading) {
    return <Loader text="Chargement des livreurs..." fullScreen={false} size="lg" />;
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
          <h2>Gestion des Livreurs</h2>
          <p className="section-subtitle1">Gérez tous les livreurs de la plateforme</p>
        </div>
        <div className="section-actions">
          <Link to="/dashboard/create-livreur" className="btn-primary">
            <UserPlus size={18} className="mr-2" />
            Ajouter un livreur
          </Link>
          <button className="btn-secondary">
            <Download size={18} className="mr-2" />
            Exporter
          </button>
        </div>
      </div>

      {/* Stats rapides dynamiques */}
      <div className="quick-stats-grid">
        <div className="quick-stat-card">
          <span className="quick-stat-value">{stats.total}</span>
          <span className="quick-stat-label">Total livreurs</span>
        </div>
        <div className="quick-stat-card success">
          <span className="quick-stat-value">{stats.disponible}</span>
          <span className="quick-stat-label">Disponibles</span>
        </div>
        <div className="quick-stat-card warning">
          <span className="quick-stat-value">{stats.occupe}</span>
          <span className="quick-stat-label">En livraison</span>
        </div>
        <div className="quick-stat-card danger">
          <span className="quick-stat-value">{stats.indisponible}</span>
          <span className="quick-stat-label">Indisponibles</span>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou téléphone..."
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
            <option value="disponible">Disponibles</option>
            <option value="occupe">En livraison</option>
            <option value="indisponible">Indisponibles</option>
          </select>
          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
            className="filter-select"
          >
            <option value="all">Toutes les zones</option>
            {uniqueZones.filter(z => z !== 'all').map(z => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
          <button className="filter-btn">
            <Filter size={18} className="mr-2" />
            Plus de filtres
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="table-container">
        {filteredLivreurs.length === 0 ? (
          <div className="text-center p-12 text-gray-500">
            <Search size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">Aucun livreur ne correspond à vos critères.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Livreur</th>
                <th>Contact</th>
                <th>Zone</th>
                <th>Véhicule</th>
                <th>Livraisons</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLivreurs.map((livreur) => {
                const StatusBadge = getStatusBadge(livreur.statut);
                return (
                  <tr key={livreur.id}>
                    <td>
                      <div className="livreur-info">
                        <div className="livreur-avatar">
                          <img src={livreur.photo} alt={livreur.nom} onError={(e) => { e.target.src = defaultAvatar; }} />
                        </div>
                        <div>
                          <div className="livreur-name">{livreur.nom}</div>
                          
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div className="flex items-center gap-2"><Mail size={14} /> {livreur.email}</div>
                        <div className="flex items-center gap-2"><Phone size={14} /> {livreur.telephone}</div>
                      </div>
                    </td>
                    <td>
                    <div className="zone-badge">
                      <MapPin size={14} className="mr-1" />
                      {(() => {
                        const zones = Array.isArray(livreur.zone)
                          ? livreur.zone
                          : JSON.parse(livreur.zone);

                        return zones.length > 1
                          ? `${zones.slice(0, 2).join(", ")}...`
                          : zones.join(", ");
                      })()}
                    </div>
                    </td>
                    <td>
                      <div className="vehicle-badge">
                        <Truck size={14} className="mr-1" />
                        {livreur.vehicule}
                      </div>
                    </td>
                    <td className="text-center font-semibold">{livreur.livraisons}</td>
                    <td>
                      <span className={`badge ${StatusBadge.color}`}>
                        <StatusBadge.icon size={12} className="mr-1" />
                        {StatusBadge.label}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn" title="Voir les détails" onClick={() => handleViewLivreur(livreur.id)}>
                          <Eye size={16} />
                        </button>
                        <button className="action-btn" title="Modifier">
                          <Edit size={16} />
                        </button>
                        <button className="action-btn success" title="Attribuer une course">
                          <Truck size={16} />
                        </button>
                        <button className="action-btn more">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination (Statique pour l'instant, à dynamiser si vous utilisez la pagination Laravel) */}
      <div className="table-footer">
        <div className="table-info">
          Affichage de {filteredLivreurs.length} sur {stats.total} livreurs
        </div>
        {/* Vous pouvez ajouter une vraie pagination ici si votre backend utilise ->paginate() */}
      </div>
    </motion.div>
  );
};

export default LivreursSection;