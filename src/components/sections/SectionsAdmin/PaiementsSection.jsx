// components/admin/sections/PaiementsSection.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  MoreHorizontal,
  User,
  Calendar,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Banknote,
  Shield,
  FileText,
  Send,
  RefreshCw,
  ChevronDown
} from 'lucide-react';

const PaiementsSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Données des demandes de retrait
  const withdrawalRequests = [
    {
      id: 1,
      utilisateur: 'Boutique Prestige',
      type: 'vendeur',
      montant: '850 000 FCFA',
      methode: 'Orange Money',
      compte: '+241 06 XX XX XX',
      date: '24/05/2025 10:30',
      statut: 'en_attente',
      reference: 'WDR-2025-001',
      historique: [
        { date: '24/05/2025 10:30', action: 'Demande créée', user: 'Boutique Prestige' },
        { date: '24/05/2025 10:35', action: 'En attente de validation', user: 'Système' }
      ]
    },
    {
      id: 2,
      utilisateur: 'Tech Store',
      type: 'vendeur',
      montant: '450 000 FCFA',
      methode: 'Wave',
      compte: '+241 07 XX XX XX',
      date: '24/05/2025 09:15',
      statut: 'approuve',
      reference: 'WDR-2025-002',
      historique: [
        { date: '24/05/2025 09:15', action: 'Demande créée', user: 'Tech Store' },
        { date: '24/05/2025 09:30', action: 'Approuvée par Admin Super', user: 'Admin Super' },
        { date: '24/05/2025 09:45', action: 'Paiement effectué', user: 'Système' }
      ]
    },
    {
      id: 3,
      utilisateur: 'Michel Nguema',
      type: 'livreur',
      montant: '125 000 FCFA',
      methode: 'Transfert bancaire',
      compte: 'BICEC - 12345678901',
      date: '23/05/2025 16:45',
      statut: 'rejete',
      reference: 'WDR-2025-003',
      historique: [
        { date: '23/05/2025 16:45', action: 'Demande créée', user: 'Michel Nguema' },
        { date: '23/05/2025 17:00', action: 'Rejetée par Admin Super', user: 'Admin Super' },
        { date: '23/05/2025 17:01', action: 'Motif: Informations bancaires invalides', user: 'Admin Super' }
      ]
    },
    {
      id: 4,
      utilisateur: 'Super Market Plus',
      type: 'vendeur',
      montant: '1 200 000 FCFA',
      methode: 'Orange Money',
      compte: '+241 08 XX XX XX',
      date: '23/05/2025 14:20',
      statut: 'en_attente',
      reference: 'WDR-2025-004',
      historique: [
        { date: '23/05/2025 14:20', action: 'Demande créée', user: 'Super Market Plus' },
        { date: '23/05/2025 14:25', action: 'En attente de validation', user: 'Système' }
      ]
    },
    {
      id: 5,
      utilisateur: 'Patrick Lendoye',
      type: 'livreur',
      montant: '98 000 FCFA',
      methode: 'Wave',
      compte: '+241 09 XX XX XX',
      date: '23/05/2025 11:00',
      statut: 'approuve',
      reference: 'WDR-2025-005',
      historique: [
        { date: '23/05/2025 11:00', action: 'Demande créée', user: 'Patrick Lendoye' },
        { date: '23/05/2025 11:15', action: 'Approuvée par Admin Super', user: 'Admin Super' },
        { date: '23/05/2025 11:30', action: 'Paiement effectué', user: 'Système' }
      ]
    },
    {
      id: 6,
      utilisateur: 'Brice Ondo',
      type: 'livreur',
      montant: '75 000 FCFA',
      methode: 'Orange Money',
      compte: '+241 06 XX XX XX',
      date: '22/05/2025 09:30',
      statut: 'en_attente',
      reference: 'WDR-2025-006',
      historique: [
        { date: '22/05/2025 09:30', action: 'Demande créée', user: 'Brice Ondo' },
        { date: '22/05/2025 09:35', action: 'En attente de validation', user: 'Système' }
      ]
    }
  ];

  // Statistiques
  const stats = {
    total: withdrawalRequests.length,
    en_attente: withdrawalRequests.filter(r => r.statut === 'en_attente').length,
    approuve: withdrawalRequests.filter(r => r.statut === 'approuve').length,
    rejete: withdrawalRequests.filter(r => r.statut === 'rejete').length,
    montantTotal: withdrawalRequests.reduce((sum, r) => sum + parseInt(r.montant.replace(/\s/g, '').replace('FCFA', '').replace(/\D/g, '')), 0)
  };

  const getStatusBadge = (statut) => {
    const badges = {
      en_attente: { color: 'badge-warning', icon: Clock, label: 'En attente' },
      approuve: { color: 'badge-success', icon: CheckCircle, label: 'Approuvé' },
      rejete: { color: 'badge-danger', icon: XCircle, label: 'Rejeté' }
    };
    return badges[statut] || badges.en_attente;
  };

  const getTypeBadge = (type) => {
    const types = {
      vendeur: { color: 'badge-info', label: 'Vendeur', icon: User },
      livreur: { color: 'badge-purple', label: 'Livreur', icon: Truck }
    };
    return types[type] || types.vendeur;
  };

  const filteredRequests = withdrawalRequests.filter(r => {
    const matchSearch = r.utilisateur.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       r.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.statut === filterStatus;
    const matchType = filterType === 'all' || r.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const handleApprove = (id) => {
    const request = withdrawalRequests.find(r => r.id === id);
    if (window.confirm(`Confirmez-vous l'approbation du retrait de ${request.utilisateur} (${request.montant}) ?`)) {
      alert(`✅ Retrait de ${request.utilisateur} approuvé !\nMontant: ${request.montant}\nRéférence: ${request.reference}`);
    }
  };

  const handleReject = (id) => {
    const request = withdrawalRequests.find(r => r.id === id);
    const raison = window.prompt('Motif du rejet :');
    if (raison !== null) {
      alert(`❌ Retrait de ${request.utilisateur} rejeté !\nMotif: ${raison || 'Non spécifié'}`);
    }
  };

  const handleViewDetails = (id) => {
    const request = withdrawalRequests.find(r => r.id === id);
    setSelectedTransaction(request);
    setShowModal(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="section-container1"
    >
      <div className="section-header1">
        <div>
          <h2>Gestion des Paiements</h2>
          <p className="section-subtitle1">Validez et gérez les demandes de retrait des utilisateurs</p>
        </div>
        <div className="section-actions1">
          <button className="btn-secondary">
            <Download size={18} />
            Exporter les transactions
          </button>
          <button className="btn-secondary">
            <RefreshCw size={18} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="quick-stats-grid">
        <div className="quick-stat-card">
          <span className="quick-stat-value">{stats.total}</span>
          <span className="quick-stat-label">Total demandes</span>
        </div>
        <div className="quick-stat-card warning">
          <span className="quick-stat-value">{stats.en_attente}</span>
          <span className="quick-stat-label">En attente</span>
        </div>
        <div className="quick-stat-card success">
          <span className="quick-stat-value">{stats.approuve}</span>
          <span className="quick-stat-label">Approuvées</span>
        </div>
        <div className="quick-stat-card danger">
          <span className="quick-stat-value">{stats.rejete}</span>
          <span className="quick-stat-label">Rejetées</span>
        </div>
        <div className="quick-stat-card purple" style={{ gridColumn: 'span 2' }}>
          <span className="quick-stat-value">{stats.montantTotal.toLocaleString()} FCFA</span>
          <span className="quick-stat-label">Montant total des demandes</span>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par utilisateur ou référence..."
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
            <option value="approuve">Approuvés</option>
            <option value="rejete">Rejetés</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tous les types</option>
            <option value="vendeur">Vendeurs</option>
            <option value="livreur">Livreurs</option>
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
              <th>Référence</th>
              <th>Utilisateur</th>
              <th>Type</th>
              <th>Montant</th>
              <th>Méthode</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((request) => {
              const StatusBadge = getStatusBadge(request.statut);
              const TypeBadge = getTypeBadge(request.type);
              return (
                <tr key={request.id}>
                  <td>
                    <div className="order-id-cell">{request.reference}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--orange-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--orange)',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {request.utilisateur.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '500' }}>{request.utilisateur}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${TypeBadge.color}`}>
                      <TypeBadge.icon size={12} />
                      {TypeBadge.label}
                    </span>
                  </td>
                  <td style={{ fontWeight: '700', color: 'var(--text)' }}>
                    {request.montant}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                      <CreditCard size={14} style={{ color: 'var(--text-muted)' }} />
                      {request.methode}
                    </div>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {request.date}
                  </td>
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
                        onClick={() => handleViewDetails(request.id)}
                      >
                        <Eye size={16} />
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
          Affichage de 1 à {filteredRequests.length} sur {withdrawalRequests.length} demandes
        </div>
        <div className="pagination">
          <button className="page-btn" disabled>Précédent</button>
          <button className="page-btn active">1</button>
          <button className="page-btn">2</button>
          <button className="page-btn">Suivant</button>
        </div>
      </div>

      {/* Modal Détails */}
      {showModal && selectedTransaction && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <FileText size={20} style={{ color: 'var(--orange)' }} />
                <h3>Détails de la transaction</h3>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="transaction-details">
                <div className="detail-row">
                  <span className="detail-label">Référence</span>
                  <span className="detail-value">{selectedTransaction.reference}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Utilisateur</span>
                  <span className="detail-value">{selectedTransaction.utilisateur}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Type</span>
                  <span className="detail-value">
                    <span className={`badge ${getTypeBadge(selectedTransaction.type).color}`}>
                      {getTypeBadge(selectedTransaction.type).label}
                    </span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Montant</span>
                  <span className="detail-value" style={{ fontWeight: '700', fontSize: '18px', color: 'var(--orange)' }}>
                    {selectedTransaction.montant}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Méthode de paiement</span>
                  <span className="detail-value">{selectedTransaction.methode}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Compte</span>
                  <span className="detail-value">{selectedTransaction.compte}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date de la demande</span>
                  <span className="detail-value">{selectedTransaction.date}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Statut</span>
                  <span className="detail-value">
                    <span className={`badge ${getStatusBadge(selectedTransaction.statut).color}`}>
                      {getStatusBadge(selectedTransaction.statut).label}
                    </span>
                  </span>
                </div>

                {/* Historique */}
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>
                    Historique
                  </h4>
                  <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: '16px' }}>
                    {selectedTransaction.historique.map((item, idx) => (
                      <div key={idx} style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%', 
                            background: idx === 0 ? 'var(--orange)' : 'var(--text-muted)',
                            marginLeft: '-20px'
                          }}></div>
                          <div>
                            <div style={{ fontWeight: '500', fontSize: '13px' }}>{item.action}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {item.date} - {item.user}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {selectedTransaction.statut === 'en_attente' && (
                <>
                  <button 
                    className="btn-success" 
                    onClick={() => {
                      handleApprove(selectedTransaction.id);
                      setShowModal(false);
                    }}
                  >
                    <CheckCircle size={16} />
                    Approuver
                  </button>
                  <button 
                    className="btn-danger" 
                    onClick={() => {
                      handleReject(selectedTransaction.id);
                      setShowModal(false);
                    }}
                  >
                    <XCircle size={16} />
                    Rejeter
                  </button>
                </>
              )}
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles du modal */}
      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
        }
        .modal-content {
          background: #fff;
          border-radius: 16px;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.3s ease;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }
        .modal-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .modal-title h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 20px;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px 8px;
        }
        .modal-close:hover {
          color: var(--text);
        }
        .modal-body {
          padding: 24px;
        }
        .transaction-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid var(--border);
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          color: var(--text-muted);
          font-size: 13px;
        }
        .detail-value {
          font-size: 14px;
          font-weight: 500;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid var(--border);
        }
        .btn-success {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: var(--green);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-success:hover {
          background: #1d8f4a;
          transform: translateY(-2px);
        }
        .btn-danger {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: var(--red);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-danger:hover {
          background: #b8321f;
          transform: translateY(-2px);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        /* Responsive */
        @media (max-width: 640px) {
          .modal-content {
            width: 95%;
            max-height: 95vh;
          }
          .modal-body {
            padding: 16px;
          }
          .modal-footer {
            flex-direction: column;
          }
          .modal-footer button {
            width: 100%;
            justify-content: center;
          }
          .detail-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default PaiementsSection;