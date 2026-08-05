import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom'; // <-- Ajout de useParams
import { Search, Filter, Eye, Edit, MoreHorizontal, ArrowLeft } from 'lucide-react';
import OrderDetailsSection from '../details/OrderDetailsSection'; // <-- Import du détail

const CommandesSection = () => {
  const { orderId } = useParams(); // Récupère l'ID de l'URL
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  const commandesData = [
    { id: 'CMD-1258', client: 'Jean Moussavou', vendeur: 'Super Market Plus', livreur: 'Michel N.', statut: 'encours', montant: '15 000 FCFA', date: '24/05/2025' },
    { id: 'CMD-1257', client: 'Emma Ondo', vendeur: 'Boutique Prestige', livreur: 'Junior P.', statut: 'attente', montant: '8 500 FCFA', date: '24/05/2025' },
    { id: 'CMD-1256', client: 'Patrick Nguema', vendeur: 'Tech Store', livreur: 'Alex B.', statut: 'terminee', montant: '12 000 FCFA', date: '24/05/2025' },
  ];

  const getBadgeClass = (statut) => {
    const classes = {
      attente: 'badge-warning',
      encours: 'badge-info',
      terminee: 'badge-success',
      annulee: 'badge-danger',
      litige: 'badge-purple'
    };
    return classes[statut] || 'badge-warning';
  };

  // Fonction pour naviguer vers les détails
  const handleViewOrder = (orderId) => {
    navigate(`/admin/retenu/${orderId}`);
  };

  // Fonction pour retourner à la liste
  const handleGoBack = () => {
    navigate('/admin/commandes');
  };

  // SI un orderId est présent dans l'URL, afficher le détail
  if (orderId) {
    // Trouver la commande correspondante dans les données
    const selectedOrder = commandesData.find(cmd => cmd.id === orderId) || commandesData[0];
    
    return (
      <OrderDetailsSection 
        orderData={selectedOrder} 
        onGoBack={handleGoBack} 
      />
    );
  }

  // SINON, afficher la liste des commandes (votre code actuel)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="section-container1"
    >
      <div className="section-header1">
        <div>
          <h2>Gestion des Commandes</h2>
          <p className="section-subtitle1">Suivez et gérez toutes les commandes</p>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher une commande..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filters-group">
          <select className="filter-select">
            <option value="all">Tous les statuts</option>
            <option value="attente">En attente</option>
            <option value="encours">En cours</option>
            <option value="terminee">Terminées</option>
          </select>
          <button className="filter-btn">
            <Filter size={18} />
            Filtres
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Client</th>
              <th>Vendeur</th>
              <th>Livreur</th>
              <th>Statut</th>
              <th>Montant</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {commandesData.map((cmd) => (
              <tr key={cmd.id}>
                <td className="order-id-cell">{cmd.id}</td>
                <td>{cmd.client}</td>
                <td>{cmd.vendeur}</td>
                <td>{cmd.livreur}</td>
                <td><span className={`badge ${getBadgeClass(cmd.statut)}`}>{cmd.statut}</span></td>
                <td>{cmd.montant}</td>
                <td>{cmd.date}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="action-btn" 
                      onClick={() => handleViewOrder(cmd.id)}
                      title="Voir les détails"
                    >
                      <Eye size={16} />
                    </button>
                    <button className="action-btn"><Edit size={16} /></button>
                    <button className="action-btn more"><MoreHorizontal size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default CommandesSection;