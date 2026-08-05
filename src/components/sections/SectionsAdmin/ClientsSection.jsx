// components/admin/sections/ClientsSection.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Edit,
  Trash2,
  CheckCircle,
  Filter,
  Download,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Star,
  Eye,
  ShoppingCart,
  User,
  Calendar,
  Award
} from 'lucide-react';

const ClientsSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const clientsData = [
    {
      id: 1,
      nom: 'Jean Moussavou',
      email: 'jean.moussavou@email.com',
      telephone: '+241 06 XX XX XX',
      adresse: '123 Rue du Commerce, Libreville',
      zone: 'Libreville',
      statut: 'actif',
      commandes: 45,
      totalDepenses: '675 000 FCFA',
      note: 4.8,
      dateInscription: '10/01/2025',
      dernierAchat: '24/05/2025'
    },
    {
      id: 2,
      nom: 'Emma Ondo',
      email: 'emma.ondo@email.com',
      telephone: '+241 07 XX XX XX',
      adresse: '45 Avenue Mbolo, Owendo',
      zone: 'Owendo',
      statut: 'actif',
      commandes: 32,
      totalDepenses: '480 000 FCFA',
      note: 4.5,
      dateInscription: '22/02/2025',
      dernierAchat: '23/05/2025'
    },
    {
      id: 3,
      nom: 'Sarah Meye',
      email: 'sarah.meye@email.com',
      telephone: '+241 05 XX XX XX',
      adresse: '789 Boulevard de l\'Indépendance, Libreville',
      zone: 'Libreville',
      statut: 'inactif',
      commandes: 8,
      totalDepenses: '120 000 FCFA',
      note: 3.5,
      dateInscription: '15/03/2025',
      dernierAchat: '10/04/2025'
    },
    {
      id: 4,
      nom: 'Patrick Nguema',
      email: 'patrick.nguema@email.com',
      telephone: '+241 08 XX XX XX',
      adresse: '12 Rue des Artisans, Akanda',
      zone: 'Akanda',
      statut: 'actif',
      commandes: 67,
      totalDepenses: '1 005 000 FCFA',
      note: 4.9,
      dateInscription: '05/12/2024',
      dernierAchat: '24/05/2025'
    },
    {
      id: 5,
      nom: 'Brice Owono',
      email: 'brice.owono@email.com',
      telephone: '+241 09 XX XX XX',
      adresse: '34 Avenue du Général, Port-Gentil',
      zone: 'Port-Gentil',
      statut: 'actif',
      commandes: 23,
      totalDepenses: '345 000 FCFA',
      note: 4.2,
      dateInscription: '02/04/2025',
      dernierAchat: '22/05/2025'
    }
  ];

  const filteredClients = clientsData.filter(c => {
    const matchSearch = c.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || c.statut === filterType;
    return matchSearch && matchType;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="section-container"
    >
      <div className="section-header">
        <div>
          <h2>Gestion des Clients</h2>
          <p className="section-subtitle">Gérez tous les clients de la plateforme</p>
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
          <span className="quick-stat-value">{clientsData.length}</span>
          <span className="quick-stat-label">Total clients</span>
        </div>
        <div className="quick-stat-card success">
          <span className="quick-stat-value">
            {clientsData.filter(c => c.statut === 'actif').length}
          </span>
          <span className="quick-stat-label">Actifs</span>
        </div>
        <div className="quick-stat-card warning">
          <span className="quick-stat-value">
            {clientsData.reduce((sum, c) => sum + c.commandes, 0)}
          </span>
          <span className="quick-stat-label">Commandes totales</span>
        </div>
        <div className="quick-stat-card purple">
          <span className="quick-stat-value">4.6</span>
          <span className="quick-stat-label">Note moyenne</span>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher un client..."
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
            <option value="all">Tous les clients</option>
            <option value="actif">Actifs</option>
            <option value="inactif">Inactifs</option>
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
              <th>Client</th>
              <th>Contact</th>
              <th>Zone</th>
              <th>Commandes</th>
              <th>Dépenses</th>
              <th>Note</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => (
              <tr key={client.id}>
                <td>
                  <div className="client-info">
                    <div className="client-avatar">
                      {client.nom.charAt(0)}
                    </div>
                    <div>
                      <div className="client-name">{client.nom}</div>
                      <div className="client-since">
                        <Calendar size={12} />
                        Depuis {client.dateInscription}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="contact-info">
                    <div><Mail size={14} /> {client.email}</div>
                    <div><Phone size={14} /> {client.telephone}</div>
                  </div>
                </td>
                <td>
                  <div className="zone-badge">
                    <MapPin size={14} />
                    {client.zone}
                  </div>
                </td>
                <td className="text-center">
                  <div className="order-count">
                    <ShoppingCart size={14} />
                    {client.commandes}
                  </div>
                </td>
                <td className="text-center">{client.totalDepenses}</td>
                <td>
                  <div className="rating-badge">
                    <Star size={14} className="star-filled" />
                    {client.note}
                  </div>
                </td>
                <td>
                  <span className={`badge ${client.statut === 'actif' ? 'badge-success' : 'badge-danger'}`}>
                    {client.statut === 'actif' ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="action-btn" title="Voir">
                      <Eye size={16} />
                    </button>
                    <button className="action-btn" title="Modifier">
                      <Edit size={16} />
                    </button>
                    <button className="action-btn more">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="table-footer">
        <div className="table-info">
          Affichage de 1 à {filteredClients.length} sur {clientsData.length} clients
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

export default ClientsSection;