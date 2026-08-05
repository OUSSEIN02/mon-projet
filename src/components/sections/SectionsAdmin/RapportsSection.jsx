// components/admin/sections/RapportsSection.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  Filter,
  Calendar,
  ChevronDown,
  Eye,
  MoreHorizontal,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Users,
  ShoppingCart,
  Truck,
  DollarSign
} from 'lucide-react';

const RapportsSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const rapportsData = [
    {
      id: 1,
      nom: 'Rapport d\'activité - Mai 2025',
      type: 'activite',
      date: '24/05/2025',
      statut: 'disponible',
      taille: '2.4 MB',
      auteur: 'Admin Super'
    },
    {
      id: 2,
      nom: 'Statistiques commandes - Semaine 21',
      type: 'statistiques',
      date: '23/05/2025',
      statut: 'disponible',
      taille: '1.8 MB',
      auteur: 'Admin Super'
    },
    {
      id: 3,
      nom: 'Rapport financier - Mai 2025',
      type: 'financier',
      date: '22/05/2025',
      statut: 'en_attente',
      taille: '3.2 MB',
      auteur: 'Admin Super'
    },
    {
      id: 4,
      nom: 'Performance livreurs - Mai 2025',
      type: 'performance',
      date: '21/05/2025',
      statut: 'disponible',
      taille: '1.5 MB',
      auteur: 'Admin Super'
    },
    {
      id: 5,
      nom: 'Rapport litiges - Mai 2025',
      type: 'litiges',
      date: '20/05/2025',
      statut: 'disponible',
      taille: '1.2 MB',
      auteur: 'Admin Super'
    }
  ];

  const getTypeIcon = (type) => {
    const icons = {
      activite: <BarChart3 size={16} style={{ color: 'var(--blue)' }} />,
      statistiques: <ShoppingCart size={16} style={{ color: 'var(--orange)' }} />,
      financier: <DollarSign size={16} style={{ color: 'var(--green)' }} />,
      performance: <Users size={16} style={{ color: 'var(--purple)' }} />,
      litiges: <AlertCircle size={16} style={{ color: 'var(--red)' }} />
    };
    return icons[type] || <FileText size={16} />;
  };

  const getTypeLabel = (type) => {
    const labels = {
      activite: 'Activité',
      statistiques: 'Statistiques',
      financier: 'Financier',
      performance: 'Performance',
      litiges: 'Litiges'
    };
    return labels[type] || type;
  };

  const getStatusBadge = (statut) => {
    const badges = {
      disponible: { color: 'badge-success', icon: CheckCircle, label: 'Disponible' },
      en_attente: { color: 'badge-warning', icon: Clock, label: 'En attente' }
    };
    return badges[statut] || badges.disponible;
  };

  const filteredRapports = rapportsData.filter(r => {
    const matchSearch = r.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || r.type === filterType;
    return matchSearch && matchType;
  });

  const stats = {
    total: rapportsData.length,
    disponibles: rapportsData.filter(r => r.statut === 'disponible').length,
    en_attente: rapportsData.filter(r => r.statut === 'en_attente').length
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="section-container"
    >
      <div className="section-header">
        <div>
          <h2>Rapports</h2>
          <p className="section-subtitle">Gérez et téléchargez les rapports de la plateforme</p>
        </div>
        <div className="section-actions">
          <button className="btn-primary">
            <FileText size={18} />
            Générer un rapport
          </button>
          <button className="btn-secondary">
            <Download size={18} />
            Exporter tout
          </button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="quick-stats-grid">
        <div className="quick-stat-card">
          <span className="quick-stat-value">{stats.total}</span>
          <span className="quick-stat-label">Total rapports</span>
        </div>
        <div className="quick-stat-card success">
          <span className="quick-stat-value">{stats.disponibles}</span>
          <span className="quick-stat-label">Disponibles</span>
        </div>
        <div className="quick-stat-card warning">
          <span className="quick-stat-value">{stats.en_attente}</span>
          <span className="quick-stat-label">En attente</span>
        </div>
        <div className="quick-stat-card purple">
          <span className="quick-stat-value">3</span>
          <span className="quick-stat-label">Nouveaux ce mois</span>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-bar">
        <div className="search-wrapper">
          <FileText size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher un rapport..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filters-group">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tous les types</option>
            <option value="activite">Activité</option>
            <option value="statistiques">Statistiques</option>
            <option value="financier">Financier</option>
            <option value="performance">Performance</option>
            <option value="litiges">Litiges</option>
          </select>
          <div className="date-picker" style={{ padding: '8px 14px' }}>
            <Calendar size={16} />
            Mai 2025
            <ChevronDown size={12} />
          </div>
          <button className="filter-btn">
            <Filter size={18} />
            Filtres
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Type</th>
              <th>Date</th>
              <th>Taille</th>
              <th>Auteur</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRapports.map((rapport) => {
              const StatusBadge = getStatusBadge(rapport.statut);
              return (
                <tr key={rapport.id}>
                  <td>
                    <div className="rapport-info">
                      <div className="rapport-icon">
                        <FileText size={18} style={{ color: 'var(--orange)' }} />
                      </div>
                      <div>
                        <div className="rapport-name" style={{ fontWeight: '600' }}>
                          {rapport.nom}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {getTypeIcon(rapport.type)}
                      {getTypeLabel(rapport.type)}
                    </div>
                  </td>
                  <td>{rapport.date}</td>
                  <td>{rapport.taille}</td>
                  <td>{rapport.auteur}</td>
                  <td>
                    <span className={`badge ${StatusBadge.color}`}>
                      <StatusBadge.icon size={12} />
                      {StatusBadge.label}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn" title="Voir">
                        <Eye size={16} />
                      </button>
                      <button className="action-btn" title="Télécharger">
                        <Download size={16} />
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
      </div>

      {/* Pagination */}
      <div className="table-footer">
        <div className="table-info">
          Affichage de 1 à {filteredRapports.length} sur {rapportsData.length} rapports
        </div>
        <div className="pagination">
          <button className="page-btn" disabled>Précédent</button>
          <button className="page-btn active">1</button>
          <button className="page-btn">2</button>
          <button className="page-btn">Suivant</button>
        </div>
      </div>
    </motion.div>
  );
};

export default RapportsSection;