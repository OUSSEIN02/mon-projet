import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Clock, ShoppingCart, RefreshCw, AlertCircle, ArrowDownCircle, X } from 'lucide-react';
import apiClient from '../../../services/apiClient';
import toast from 'react-hot-toast';

const SellerEarningsSection = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États pour la modale de retrait
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('mtn');
  const [accountDetails, setAccountDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchEarnings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/seller/earnings', { withAuth: true });
      setData(response.data?.data || null);
    } catch (err) {
      console.error("Erreur chargement gains vendeur:", err);
      setError("Impossible de charger vos données financières.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const formatMoney = (amount) => new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';

  const getStatusBadgeClass = (color) => {
    const colors = { success: 'ps-badge-success', warning: 'ps-badge-warning', danger: 'ps-badge-danger', info: 'ps-badge-info' };
    return colors[color] || 'ps-badge-warning';
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const amount = parseInt(withdrawAmount);

    if (amount < 1000) {
      setErrorMessage('Le montant minimum de retrait est de 1 000 FCFA');
      return;
    }
    if (amount > data.available_balance) {
      setErrorMessage(`Le montant demandé dépasse votre solde disponible (${formatMoney(data.available_balance)})`);
      return;
    }
    if (!accountDetails.trim()) {
      setErrorMessage('Veuillez renseigner votre numéro de compte ou de téléphone');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/seller/withdrawals', {
        amount: amount,
        payment_method: withdrawMethod,
        account_details: accountDetails.trim()
      }, { withAuth: true });

      if (response.data.success) {
        toast.success('✅ Demande de retrait envoyée ! En attente de validation.');
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setAccountDetails('');
        fetchEarnings(); // Rafraîchir pour mettre à jour le solde
      } else {
        const errorMsg = response.data.errors?.amount?.[0] || response.data.message || 'Une erreur est survenue';
        setErrorMessage(errorMsg);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Problème de connexion. Vérifiez votre internet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="ps-container" style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--ps-orange)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="ps-container">
        <div style={{ padding: '24px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={fetchEarnings} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#991b1b', fontWeight: 'bold', cursor: 'pointer' }}>Réessayer</button>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ps-container">
      <div className="ps-header">
        <div className="ps-header-title">
          <h2>Mes Gains</h2>
          <p className="ps-subtitle">Suivez votre chiffre d'affaires, vos ventes et effectuez vos retraits</p>
        </div>
        <div className="ps-actions">
          <button className="ps-btn ps-btn-secondary" onClick={fetchEarnings}>
            <RefreshCw size={18} />
            <span>Actualiser</span>
          </button>
          <button 
            className="ps-btn ps-btn-success" 
            onClick={() => setShowWithdrawModal(true)}
            disabled={data.available_balance < 1000}
            style={{ opacity: data.available_balance < 1000 ? 0.6 : 1, cursor: data.available_balance < 1000 ? 'not-allowed' : 'pointer' }}
          >
            <ArrowDownCircle size={18} />
            <span>Retirer mes gains</span>
          </button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="ps-stats-grid">
        <div className="ps-stat-card ps-stat-success">
          <span className="ps-stat-value">{formatMoney(data.available_balance)}</span>
          <span className="ps-stat-label">Solde disponible à retirer</span>
        </div>
        <div className="ps-stat-card ps-stat-purple">
          <span className="ps-stat-value">{formatMoney(data.total_sales)}</span>
          <span className="ps-stat-label">Chiffre d'affaires total (Payé)</span>
        </div>
        <div className="ps-stat-card ps-stat-warning">
          <span className="ps-stat-value">{formatMoney(data.pending_amount)}</span>
          <span className="ps-stat-label">En attente de validation</span>
        </div>
        <div className="ps-stat-card">
          <span className="ps-stat-value">{data.total_orders}</span>
          <span className="ps-stat-label">Total des commandes</span>
        </div>
      </div>

      {/* Tableau des transactions */}
      <div className="ps-table-container">
        <table className="ps-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Date</th>
              <th>Détail</th>
              <th>Type</th>
              <th>Montant</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {data.transactions.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--ps-text-muted)' }}>
                  Aucune transaction trouvée pour le moment.
                </td>
              </tr>
            ) : (
              data.transactions.map((tx, idx) => (
                <tr key={idx}>
                  <td><div className="ps-order-id">{tx.id}</div></td>
                  <td className="ps-date-cell">{tx.date}</td>
                  <td>
                    <div className="ps-user-cell">
                      <div className="ps-avatar">{tx.customer.charAt(0).toUpperCase()}</div>
                      <div className="ps-user-name">{tx.customer}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`ps-badge ${tx.type === 'Retrait' ? 'ps-badge-danger' : 'ps-badge-info'}`}>
                      {tx.type === 'Retrait' ? <ArrowDownCircle size={12} /> : <ShoppingCart size={12} />}
                      {tx.type}
                    </span>
                  </td>
                  <td className="ps-amount-cell" style={{ color: tx.type === 'Retrait' ? 'var(--ps-red)' : 'var(--ps-text)' }}>
                    {tx.type === 'Retrait' ? '-' : '+'}{formatMoney(tx.amount)}
                  </td>
                  <td>
                    <span className={`ps-badge ${getStatusBadgeClass(tx.status_color)}`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODALE DE RETRAIT */}
      {showWithdrawModal && (
        <div className="ps-modal-overlay" onClick={() => setShowWithdrawModal(false)}>
          <div className="ps-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="ps-modal-header">
              <div className="ps-modal-title">
                <Wallet size={20} className="ps-icon-orange" />
                <h3>Demande de retrait</h3>
              </div>
              <button className="ps-modal-close" onClick={() => setShowWithdrawModal(false)}>✕</button>
            </div>
            <div className="ps-modal-body">
              {errorMessage && (
                <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} /> {errorMessage}
                </div>
              )}
              
              <p style={{ marginBottom: '16px', color: 'var(--ps-text-muted)' }}>
                Solde disponible : <strong style={{ color: 'var(--ps-text)' }}>{formatMoney(data.available_balance)}</strong>
              </p>

              <form onSubmit={handleWithdrawSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Montant à retirer (FCFA)</label>
                  <input 
                    type="number" 
                    value={withdrawAmount} 
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Ex: 10000"
                    className="ps-search-input"
                    style={{ width: '100%' }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Moyen de réception</label>
                  <select 
                    value={withdrawMethod} 
                    onChange={(e) => setWithdrawMethod(e.target.value)}
                    className="ps-filter-select"
                    style={{ width: '100%' }}
                  >
                    <option value="mtn">📱 MTN Mobile Money</option>
                    <option value="moov">📱 Moov Money</option>
                    <option value="airtel">📱 Airtel Money</option>
                    <option value="bank">🏦 Virement Bancaire</option>
                  </select>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                    {withdrawMethod === 'bank' ? 'Numéro de compte bancaire' : 'Numéro de téléphone'}
                  </label>
                  <input 
                    type="text" 
                    value={accountDetails} 
                    onChange={(e) => setAccountDetails(e.target.value)}
                    placeholder={withdrawMethod === 'bank' ? 'Ex: 12345678901' : 'Ex: 077000000'}
                    className="ps-search-input"
                    style={{ width: '100%' }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" className="ps-btn ps-btn-secondary" onClick={() => setShowWithdrawModal(false)} style={{ flex: 1 }}>
                    Annuler
                  </button>
                  <button type="submit" className="ps-btn ps-btn-success" disabled={isSubmitting} style={{ flex: 1, justifyContent: 'center' }}>
                    {isSubmitting ? 'Traitement...' : 'Confirmer la demande'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Styles (identiques à votre section Paiements) */}
      <style>{`
        .ps-container {
          --ps-primary: #2563eb; --ps-orange: #f97316; --ps-green: #10b981; --ps-red: #ef4444;
          --ps-purple: #8b5cf6; --ps-bg: #ffffff; --ps-bg-secondary: #f8fafc; --ps-border: #e2e8f0;
          --ps-text: #0f172a; --ps-text-muted: #64748b; --ps-radius: 12px;
          --ps-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
          color: var(--ps-text); background: var(--ps-bg); padding: 24px; border-radius: var(--ps-radius);
          box-shadow: var(--ps-shadow); width: 100%; box-sizing: border-box;
        }
        .ps-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .ps-header-title h2 { margin: 0 0 4px 0; font-size: 24px; font-weight: 700; }
        .ps-subtitle { margin: 0; font-size: 14px; color: var(--ps-text-muted); }
        .ps-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid transparent; }
        .ps-btn-secondary { background: var(--ps-bg-secondary); color: var(--ps-text); border-color: var(--ps-border); }
        .ps-btn-success { background: var(--ps-green); color: white; }
        .ps-btn-success:hover { background: #059669; }
        .ps-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .ps-stat-card { background: var(--ps-bg-secondary); padding: 16px; border-radius: var(--ps-radius); border: 1px solid var(--ps-border); display: flex; flex-direction: column; gap: 4px; }
        .ps-stat-value { font-size: 24px; font-weight: 700; color: var(--ps-text); }
        .ps-stat-label { font-size: 13px; color: var(--ps-text-muted); font-weight: 500; }
        .ps-stat-success .ps-stat-value { color: var(--ps-green); }
        .ps-stat-warning .ps-stat-value { color: #d97706; }
        .ps-stat-purple .ps-stat-value { color: var(--ps-purple); }
        .ps-table-container { overflow-x: auto; border: 1px solid var(--ps-border); border-radius: var(--ps-radius); }
        .ps-table { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 800px; }
        .ps-table th { background: var(--ps-bg-secondary); padding: 12px 16px; text-align: left; font-weight: 600; color: var(--ps-text-muted); border-bottom: 1px solid var(--ps-border); }
        .ps-table td { padding: 16px; border-bottom: 1px solid var(--ps-border); vertical-align: middle; }
        .ps-table tbody tr:hover { background: #fafafa; }
        .ps-order-id {  font-weight: 600; color: var(--ps-primary); }
        .ps-user-cell { display: flex; align-items: center; gap: 12px; }
        .ps-avatar { width: 32px; height: 32px; border-radius: 50%; background: #fff7ed; display: flex; align-items: center; justify-content: center; color: var(--ps-orange); font-size: 12px; font-weight: 700; flex-shrink: 0; }
        .ps-user-name { font-weight: 600; color: var(--ps-text); }
        .ps-amount-cell { font-weight: 700; white-space: nowrap; }
        .ps-date-cell { font-size: 13px; color: var(--ps-text-muted); white-space: nowrap; }
        .ps-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap; }
        .ps-badge-success { background: #d1fae5; color: #065f46; }
        .ps-badge-warning { background: #fef3c7; color: #92400e; }
        .ps-badge-danger { background: #fee2e2; color: #991b1b; }
        .ps-badge-info { background: #dbeafe; color: #1e40af; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        /* Modal Styles */
        .ps-modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px; }
        .ps-modal-content { background: white; border-radius: 16px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); }
        .ps-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--ps-border); }
        .ps-modal-title { display: flex; align-items: center; gap: 12px; }
        .ps-modal-title h3 { margin: 0; font-size: 18px; font-weight: 700; }
        .ps-icon-orange { color: var(--ps-orange); }
        .ps-modal-close { background: none; border: none; font-size: 20px; color: var(--ps-text-muted); cursor: pointer; padding: 4px 8px; border-radius: 6px; }
        .ps-modal-close:hover { background: var(--ps-bg-secondary); }
        .ps-modal-body { padding: 24px; }
        .ps-search-input, .ps-filter-select { padding: 10px 12px; border: 1px solid var(--ps-border); border-radius: 8px; font-size: 14px; outline: none; background: white; }
        .ps-search-input:focus, .ps-filter-select:focus { border-color: var(--ps-primary); }
      `}</style>
    </motion.div>
  );
};

export default SellerEarningsSection;