import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';

import {
  DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Truck, CreditCard,
  CheckCircle, XCircle, Clock, Search, Filter, Download, Eye, MoreHorizontal,
  User, Calendar, AlertCircle, TrendingUp, TrendingDown, Banknote, Shield,
  FileText, Send, RefreshCw, ChevronDown, Store // 🟢 AJOUT DE Store
} from 'lucide-react';

const PaiementsSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWithdrawals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/admin/withdrawals', { withAuth: true });
      const data = response.data?.data || response.data;
      
      const mappedData = Array.isArray(data) ? data.map(item => {
        const rawAmount = parseFloat(item.amount) || 0;
        const formattedAmount = `${rawAmount.toLocaleString('fr-FR')} FCFA`;
        
        let methodeLabel = item.payment_method;
        if (item.payment_method === 'mtn') methodeLabel = 'MTN Mobile Money';
        else if (item.payment_method === 'moov') methodeLabel = 'Moov Money';
        else if (item.payment_method === 'airtel') methodeLabel = 'Airtel Money';
        else if (item.payment_method === 'bank') methodeLabel = 'Virement Bancaire';

        let statutLabel = 'en_attente';
        if (item.status === 'approved') statutLabel = 'approuve';
        else if (item.status === 'rejected') statutLabel = 'rejete';

        return {
          id: item.id,
          // 🟢 UTILISATION DES DONNÉES DYNAMIQUES DU BACKEND
          utilisateur: item.user_name || 'Utilisateur inconnu',
          type: item.user_type || 'inconnu', 
          montant: formattedAmount,
          methode: methodeLabel,
          compte: item.account_details,
          date: new Date(item.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          statut: statutLabel,
          reference: `WDR-${item.id.toString().padStart(4, '0')}`,
          historique: [
            { date: new Date(item.created_at).toLocaleString('fr-FR'), action: 'Demande créée', user: item.user_name },
            item.status !== 'pending' ? { 
              date: new Date(item.updated_at).toLocaleString('fr-FR'), 
              action: item.status === 'approved' ? 'Approuvée par Admin' : 'Rejetée par Admin', 
              user: 'Admin' 
            } : { date: new Date(item.created_at).toLocaleString('fr-FR'), action: 'En attente de validation', user: 'Système' }
          ].filter(Boolean)
        };
      }) : [];
      
      setWithdrawalRequests(mappedData);
    } catch (err) {
      console.error("Erreur chargement des retraits:", err);
      setError("Impossible de charger les demandes de retrait.");
      toast.error("Erreur de chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const stats = {
    total: withdrawalRequests.length,
    en_attente: withdrawalRequests.filter(r => r.statut === 'en_attente').length,
    approuve: withdrawalRequests.filter(r => r.statut === 'approuve').length,
    rejete: withdrawalRequests.filter(r => r.statut === 'rejete').length,
    montantTotal: withdrawalRequests.reduce((sum, r) => {
      const val = parseInt(r.montant.replace(/\s/g, '').replace('FCFA', '').replace(/\D/g, ''));
      return sum + (isNaN(val) ? 0 : val);
    }, 0)
  };

  const getStatusBadge = (statut) => {
    const badges = {
      en_attente: { color: 'ps-badge-warning', icon: Clock, label: 'En attente' },
      approuve: { color: 'ps-badge-success', icon: CheckCircle, label: 'Approuvé' },
      rejete: { color: 'ps-badge-danger', icon: XCircle, label: 'Rejeté' }
    };
    return badges[statut] || badges.en_attente;
  };

  // 🟢 AMÉLIORATION : Utilisation de l'icône Store pour les vendeurs
  const getTypeBadge = (type) => {
    const types = {
      vendeur: { color: 'ps-badge-info', label: 'Vendeur', icon: Store }, 
      livreur: { color: 'ps-badge-purple', label: 'Livreur', icon: Truck }
    };
    return types[type] || { color: 'ps-badge-warning', label: 'Inconnu', icon: User };
  };

  const filteredRequests = withdrawalRequests.filter(r => {
    const matchSearch = r.utilisateur.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       r.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.statut === filterStatus;
    const matchType = filterType === 'all' || r.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const handleApprove = async (id) => {
    const request = withdrawalRequests.find(r => r.id === id);
    if (!window.confirm(`Confirmez-vous l'approbation du retrait de ${request.utilisateur} (${request.montant}) ?`)) return;

    try {
      await apiClient.post(`/admin/withdrawals/${id}/approve`, {}, { withAuth: true });
      toast.success('Retrait approuvé avec succès !');
      fetchWithdrawals();
    } catch (err) {
      console.error("Erreur approbation:", err);
      toast.error(err.response?.data?.message || "Erreur lors de l'approbation");
    }
  };

  const handleReject = async (id) => {
    const request = withdrawalRequests.find(r => r.id === id);
    const raison = window.prompt('Motif du rejet :');
    if (raison === null) return;

    try {
      await apiClient.post(`/admin/withdrawals/${id}/reject`, { notes: raison || 'Non spécifié' }, { withAuth: true });
      toast.success('Retrait rejeté avec succès.');
      fetchWithdrawals();
    } catch (err) {
      console.error("Erreur rejet:", err);
      toast.error(err.response?.data?.message || "Erreur lors du rejet");
    }
  };

  const handleViewDetails = (id) => {
    const request = withdrawalRequests.find(r => r.id === id);
    setSelectedTransaction(request);
    setShowModal(true);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ps-container">
      <div className="ps-header">
        <div className="ps-header-title">
          <h2>Gestion des Paiements</h2>
          <p className="ps-subtitle">Validez et gérez les demandes de retrait des utilisateurs</p>
        </div>
        <div className="ps-actions">
          <button className="ps-btn ps-btn-secondary" onClick={fetchWithdrawals}>
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="ps-stats-grid">
        <div className="ps-stat-card">
          <span className="ps-stat-value">{stats.total}</span>
          <span className="ps-stat-label">Total demandes</span>
        </div>
        <div className="ps-stat-card ps-stat-warning">
          <span className="ps-stat-value">{stats.en_attente}</span>
          <span className="ps-stat-label">En attente</span>
        </div>
        <div className="ps-stat-card ps-stat-success">
          <span className="ps-stat-value">{stats.approuve}</span>
          <span className="ps-stat-label">Approuvées</span>
        </div>
        <div className="ps-stat-card ps-stat-danger">
          <span className="ps-stat-value">{stats.rejete}</span>
          <span className="ps-stat-label">Rejetées</span>
        </div>
        <div className="ps-stat-card ps-stat-purple ps-stat-wide">
          <span className="ps-stat-value">{stats.montantTotal.toLocaleString('fr-FR')} FCFA</span>
          <span className="ps-stat-label">Montant total des demandes</span>
        </div>
      </div>

      {error && (
        <div className="ps-error-box" style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={fetchWithdrawals} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#991b1b', fontWeight: 'bold', cursor: 'pointer' }}>Réessayer</button>
        </div>
      )}

      {/* Filtres */}
      <div className="ps-filters-bar">
        <div className="ps-search-wrapper">
          <Search size={18} className="ps-search-icon" />
          <input
            type="text"
            placeholder="Rechercher par utilisateur ou référence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ps-search-input"
          />
        </div>
        <div className="ps-filters-group">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="ps-filter-select">
            <option value="all">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="approuve">Approuvés</option>
            <option value="rejete">Rejetés</option>
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="ps-filter-select">
            <option value="all">Tous les types</option>
            <option value="vendeur">Vendeurs</option>
            <option value="livreur">Livreurs</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="ps-table-container">
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ps-text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ display: 'inline-block', marginBottom: '8px' }} />
            <p>Chargement des données...</p>
          </div>
        ) : (
          <table className="ps-table">
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
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--ps-text-muted)' }}>
                    Aucune demande de retrait trouvée.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => {
                  const StatusBadge = getStatusBadge(request.statut);
                  const TypeBadge = getTypeBadge(request.type);
                  return (
                    <tr key={request.id}>
                      <td><div className="ps-order-id">{request.reference}</div></td>
                      <td>
                        <div className="ps-user-cell">
                          <div className="ps-avatar">{request.utilisateur.charAt(0)}</div>
                          <div className="ps-user-name">{request.utilisateur}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`ps-badge ${TypeBadge.color}`}>
                          <TypeBadge.icon size={12} />
                          {TypeBadge.label}
                        </span>
                      </td>
                      <td className="ps-amount-cell">{request.montant}</td>
                      <td>
                        <div className="ps-method-cell">
                          <CreditCard size={14} />
                          {request.methode}
                        </div>
                      </td>
                      <td className="ps-date-cell">{request.date}</td>
                      <td>
                        <span className={`ps-badge ${StatusBadge.color}`}>
                          <StatusBadge.icon size={12} />
                          {StatusBadge.label}
                        </span>
                      </td>
                      <td>
                        <div className="ps-action-buttons">
                          <button className="ps-action-btn" title="Voir les détails" onClick={() => handleViewDetails(request.id)}>
                            <Eye size={16} />
                          </button>
                          {request.statut === 'en_attente' && (
                            <>
                              <button className="ps-action-btn" style={{ color: 'var(--ps-green)', borderColor: 'var(--ps-green)' }} title="Approuver" onClick={() => handleApprove(request.id)}>
                                <CheckCircle size={16} />
                              </button>
                              <button className="ps-action-btn" style={{ color: 'var(--ps-red)', borderColor: 'var(--ps-red)' }} title="Rejeter" onClick={() => handleReject(request.id)}>
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Détails (inchangé, fonctionne parfaitement avec les nouvelles données) */}
      {showModal && selectedTransaction && (
        <div className="ps-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ps-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="ps-modal-header">
              <div className="ps-modal-title">
                <FileText size={20} className="ps-icon-orange" />
                <h3>Détails de la transaction</h3>
              </div>
              <button className="ps-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="ps-modal-body">
              <div className="ps-transaction-details">
                <div className="ps-detail-row">
                  <span className="ps-detail-label">Référence</span>
                  <span className="ps-detail-value">{selectedTransaction.reference}</span>
                </div>
                <div className="ps-detail-row">
                  <span className="ps-detail-label">Utilisateur</span>
                  <span className="ps-detail-value">{selectedTransaction.utilisateur}</span>
                </div>
                <div className="ps-detail-row">
                  <span className="ps-detail-label">Type</span>
                  <span className="ps-detail-value">
                    <span className={`ps-badge ${getTypeBadge(selectedTransaction.type).color}`}>
                      {getTypeBadge(selectedTransaction.type).label}
                    </span>
                  </span>
                </div>
                <div className="ps-detail-row">
                  <span className="ps-detail-label">Montant</span>
                  <span className="ps-detail-value ps-amount-highlight">{selectedTransaction.montant}</span>
                </div>
                <div className="ps-detail-row">
                  <span className="ps-detail-label">Méthode de paiement</span>
                  <span className="ps-detail-value">{selectedTransaction.methode}</span>
                </div>
                <div className="ps-detail-row">
                  <span className="ps-detail-label">Compte</span>
                  <span className="ps-detail-value">{selectedTransaction.compte}</span>
                </div>
                <div className="ps-detail-row">
                  <span className="ps-detail-label">Date de la demande</span>
                  <span className="ps-detail-value">{selectedTransaction.date}</span>
                </div>
                <div className="ps-detail-row">
                  <span className="ps-detail-label">Statut</span>
                  <span className="ps-detail-value">
                    <span className={`ps-badge ${getStatusBadge(selectedTransaction.statut).color}`}>
                      {getStatusBadge(selectedTransaction.statut).label}
                    </span>
                  </span>
                </div>

                <div className="ps-history-section">
                  <h4 className="ps-history-title">Historique</h4>
                  <div className="ps-history-timeline">
                    {selectedTransaction.historique.map((item, idx) => (
                      <div key={idx} className="ps-history-item">
                        <div className="ps-history-dot" style={{ background: idx === 0 ? 'var(--ps-orange)' : 'var(--ps-text-muted)' }}></div>
                        <div className="ps-history-content">
                          <div className="ps-history-action">{item.action}</div>
                          <div className="ps-history-meta">{item.date} - {item.user}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="ps-modal-footer">
              {selectedTransaction.statut === 'en_attente' && (
                <>
                  <button className="ps-btn ps-btn-success" onClick={() => { handleApprove(selectedTransaction.id); setShowModal(false); }}>
                    <CheckCircle size={16} /> Approuver
                  </button>
                  <button className="ps-btn ps-btn-danger" onClick={() => { handleReject(selectedTransaction.id); setShowModal(false); }}>
                    <XCircle size={16} /> Rejeter
                  </button>
                </>
              )}
              <button className="ps-btn ps-btn-secondary" onClick={() => setShowModal(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Styles (inchangés) */}
      <style>{`
        .ps-container {
          --ps-primary: #2563eb; --ps-orange: #f97316; --ps-orange-light: #fff7ed;
          --ps-green: #10b981; --ps-green-hover: #059669; --ps-red: #ef4444;
          --ps-red-hover: #dc2626; --ps-purple: #8b5cf6; --ps-bg: #ffffff;
          --ps-bg-secondary: #f8fafc; --ps-border: #e2e8f0; --ps-text: #0f172a;
          --ps-text-muted: #64748b; --ps-radius: 12px;
          --ps-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
          color: var(--ps-text); background: var(--ps-bg); padding: 24px;
          border-radius: var(--ps-radius); box-shadow: var(--ps-shadow);
          width: 100%; box-sizing: border-box;
        }
        .ps-container * { box-sizing: border-box; }
        .ps-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
        .ps-header-title h2 { margin: 0 0 4px 0; font-size: 24px; font-weight: 700; color: var(--ps-text); }
        .ps-subtitle { margin: 0; font-size: 14px; color: var(--ps-text-muted); }
        .ps-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .ps-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; border: 1px solid transparent; white-space: nowrap; }
        .ps-btn-secondary { background: var(--ps-bg-secondary); color: var(--ps-text); border-color: var(--ps-border); }
        .ps-btn-secondary:hover { background: #f1f5f9; }
        .ps-btn-success { background: var(--ps-green); color: white; }
        .ps-btn-success:hover { background: var(--ps-green-hover); }
        .ps-btn-danger { background: var(--ps-red); color: white; }
        .ps-btn-danger:hover { background: var(--ps-red-hover); }
        .ps-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .ps-stat-card { background: var(--ps-bg-secondary); padding: 16px; border-radius: var(--ps-radius); border: 1px solid var(--ps-border); display: flex; flex-direction: column; gap: 4px; }
        .ps-stat-wide { grid-column: span 2; }
        .ps-stat-value { font-size: 24px; font-weight: 700; color: var(--ps-text); }
        .ps-stat-label { font-size: 13px; color: var(--ps-text-muted); font-weight: 500; }
        .ps-stat-warning .ps-stat-value { color: #d97706; }
        .ps-stat-success .ps-stat-value { color: var(--ps-green); }
        .ps-stat-danger .ps-stat-value { color: var(--ps-red); }
        .ps-stat-purple .ps-stat-value { color: var(--ps-purple); }
        .ps-filters-bar { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; padding: 16px; background: var(--ps-bg-secondary); border-radius: var(--ps-radius); border: 1px solid var(--ps-border); }
        .ps-search-wrapper { position: relative; width: 100%; }
        .ps-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--ps-text-muted); }
        .ps-search-input { width: 100%; padding: 10px 12px 10px 40px; border: 1px solid var(--ps-border); border-radius: 8px; font-size: 14px; outline: none; transition: border-color 0.2s; }
        .ps-search-input:focus { border-color: var(--ps-primary); }
        .ps-filters-group { display: flex; gap: 12px; flex-wrap: wrap; }
        .ps-filter-select { padding: 10px 14px; border: 1px solid var(--ps-border); border-radius: 8px; font-size: 14px; background: white; color: var(--ps-text); cursor: pointer; outline: none; min-width: 140px; }
        .ps-table-container { overflow-x: auto; border: 1px solid var(--ps-border); border-radius: var(--ps-radius); margin-bottom: 16px; }
        .ps-table { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 800px; }
        .ps-table th { background: var(--ps-bg-secondary); padding: 12px 16px; text-align: left; font-weight: 600; color: var(--ps-text-muted); border-bottom: 1px solid var(--ps-border); white-space: nowrap; }
        .ps-table td { padding: 16px; border-bottom: 1px solid var(--ps-border); vertical-align: middle; }
        .ps-table tbody tr:hover { background: #fafafa; }
        .ps-table tbody tr:last-child td { border-bottom: none; }
        .ps-order-id { font-weight: 600; color: var(--ps-primary); }
        .ps-user-cell { display: flex; align-items: center; gap: 12px; }
        .ps-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--ps-orange-light); display: flex; align-items: center; justify-content: center; color: var(--ps-orange); font-size: 12px; font-weight: 700; flex-shrink: 0; }
        .ps-user-name { font-weight: 600; color: var(--ps-text); }
        .ps-amount-cell { font-weight: 700; color: var(--ps-text); white-space: nowrap; }
        .ps-method-cell { display: flex; align-items: center; gap: 6px; color: var(--ps-text-muted); font-size: 13px; }
        .ps-date-cell { font-size: 13px; color: var(--ps-text-muted); white-space: nowrap; }
        .ps-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap; }
        .ps-badge-warning { background: #fef3c7; color: #92400e; }
        .ps-badge-success { background: #d1fae5; color: #065f46; }
        .ps-badge-danger { background: #fee2e2; color: #991b1b; }
        .ps-badge-info { background: #dbeafe; color: #1e40af; }
        .ps-badge-purple { background: #ede9fe; color: #5b21b6; }
        .ps-action-buttons { display: flex; gap: 8px; }
        .ps-action-btn { width: 32px; height: 32px; border-radius: 6px; border: 1px solid var(--ps-border); background: white; color: var(--ps-text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .ps-action-btn:hover { background: var(--ps-bg-secondary); }
        .ps-modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px; animation: ps-fade-in 0.2s ease; }
        .ps-modal-content { background: white; border-radius: 16px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); animation: ps-slide-up 0.3s ease; }
        .ps-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--ps-border); position: sticky; top: 0; background: white; z-index: 10; }
        .ps-modal-title { display: flex; align-items: center; gap: 12px; }
        .ps-modal-title h3 { margin: 0; font-size: 18px; font-weight: 700; }
        .ps-icon-orange { color: var(--ps-orange); }
        .ps-modal-close { background: none; border: none; font-size: 20px; color: var(--ps-text-muted); cursor: pointer; padding: 4px 8px; border-radius: 6px; transition: background 0.2s; }
        .ps-modal-close:hover { background: var(--ps-bg-secondary); color: var(--ps-text); }
        .ps-modal-body { padding: 24px; }
        .ps-transaction-details { display: flex; flex-direction: column; gap: 12px; }
        .ps-detail-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--ps-border); gap: 16px; }
        .ps-detail-row:last-child { border-bottom: none; }
        .ps-detail-label { color: var(--ps-text-muted); font-size: 13px; flex-shrink: 0; }
        .ps-detail-value { font-size: 14px; font-weight: 500; text-align: right; }
        .ps-amount-highlight { font-weight: 700; font-size: 18px; color: var(--ps-orange); }
        .ps-history-section { margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--ps-border); }
        .ps-history-title { margin: 0 0 16px 0; font-size: 14px; font-weight: 600; }
        .ps-history-timeline { border-left: 2px solid var(--ps-border); padding-left: 16px; margin-left: 4px; }
        .ps-history-item { position: relative; margin-bottom: 16px; }
        .ps-history-item:last-child { margin-bottom: 0; }
        .ps-history-dot { position: absolute; left: -21px; top: 6px; width: 8px; height: 8px; border-radius: 50%; border: 2px solid white; }
        .ps-history-action { font-weight: 500; font-size: 13px; margin-bottom: 2px; }
        .ps-history-meta { font-size: 11px; color: var(--ps-text-muted); }
        .ps-modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px; border-top: 1px solid var(--ps-border); background: var(--ps-bg-secondary); border-radius: 0 0 16px 16px; position: sticky; bottom: 0; }
        @keyframes ps-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ps-slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @media (max-width: 768px) {
          .ps-container { padding: 16px; }
          .ps-header { flex-direction: column; align-items: stretch; }
          .ps-actions { width: 100%; }
          .ps-actions .ps-btn { flex: 1; justify-content: center; }
          .ps-stat-wide { grid-column: span 1; }
          .ps-filters-group { flex-direction: column; }
          .ps-filter-select { width: 100%; }
          .ps-modal-footer { flex-direction: column-reverse; }
          .ps-modal-footer .ps-btn { width: 100%; justify-content: center; }
        }
      `}</style>
    </motion.div>
  );
};

export default PaiementsSection;