import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Receipt, Download, Eye, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '../../../services/apiClient';
import '../../css/FacturesSection.css'; // <-- Import du CSS dédié

const FacturesSection = () => {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États de pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const token = localStorage.getItem('access_token');


  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Appel à l'endpoint des factures (ou /orders?status=payee si pas de table dédiée)
        const response = await apiClient.get(`/invoices?page=${currentPage}`,{
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setInvoices(response.data.data || []);
        if (response.data.meta) {
          setLastPage(response.data.meta.last_page);
          setTotalItems(response.data.meta.total);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des factures:", err);
        setError("Impossible de charger l'historique des factures.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [currentPage]);

  const getBadgeClass = (statut) => {
    return statut === 'payee' ? 'od-fact-badge-success' : 'od-fact-badge-warning';
  };

  const getStatusLabel = (statut) => {
    return statut === 'payee' ? 'Payée' : 'En attente';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // --- FONCTION POUR VOIR LA FACTURE (Ouvrir dans un nouvel onglet) ---
  const handleView = async (invoice) => {
    try {
      // On récupère le fichier en tant que "blob" via l'apiClient authentifié
      const response = await apiClient.get(`/invoices/${invoice.id}/download`, {
        responseType: 'blob', // Indispensable pour recevoir un fichier binaire
      });

      // Créer une URL temporaire à partir du blob
      const fileURL = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      
      // Ouvrir cette URL dans un nouvel onglet
      window.open(fileURL, '_blank');
      
      // Nettoyer l'URL temporaire après un court délai pour libérer la mémoire
      setTimeout(() => window.URL.revokeObjectURL(fileURL), 10000);
      
    } catch (error) {
      console.error("Erreur lors de l'ouverture de la facture :", error);
      alert("Impossible d'ouvrir la facture. Vérifiez qu'elle a bien été générée.");
    }
  };

  // --- FONCTION POUR TÉLÉCHARGER LA FACTURE ---
  const handleDownload = async (invoice) => {
    try {
      const response = await apiClient.get(`/invoices/${invoice.id}/download`, {
        responseType: 'blob',
      });

      // Créer une URL temporaire
      const fileURL = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      
      // Créer un lien <a> invisible pour forcer le téléchargement
      const link = document.createElement('a');
      link.href = fileURL;
      // Nommer le fichier avec le numéro de facture (ex: FAC-2026-0001.pdf)
      link.setAttribute('download', `${invoice.invoice_number || 'facture'}.pdf`);
      
      document.body.appendChild(link);
      link.click(); // Déclencher le clic
      
      // Nettoyage
      document.body.removeChild(link);
      window.URL.revokeObjectURL(fileURL);
      
    } catch (error) {
      console.error("Erreur lors du téléchargement :", error);
      alert("Impossible de télécharger la facture.");
    }
  };

  if (isLoading && currentPage === 1) {
    return (
      <div className="od-fact-loader">
        <Loader2 className="animate-spin text-orange-500" size={32} />
        <span>Chargement des factures...</span>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="od-fact-container"
    >
      {/* En-tête */}
      <div className="od-fact-header">
        <div>
          <h2 className="od-fact-title">Mes Factures</h2>
          <p className="od-fact-subtitle">
            {totalItems > 0 ? `${totalItems} facture(s) générée(s).` : 'Historique de facturation et paiements.'}
          </p>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="od-fact-error">
          {error}
        </div>
      )}

      {/* Tableau et Pagination */}
      <div className="od-fact-table-container">
        {invoices.length === 0 && !isLoading ? (
          <div className="od-fact-empty-state">
            <Receipt size={48} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <p>Aucune facture disponible pour le moment.</p>
          </div>
        ) : (
          <>
            <table className="od-fact-table">
              <thead>
                <tr>
                  <th>N° Facture</th>
                  <th>Période / Commande</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Date d'émission</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <span className="od-fact-invoice-id">
                        <Receipt size={16} /> 
                        {inv.invoice_number || inv.id}
                      </span>
                    </td>
                    <td>
                      {/* Affiche la référence de la commande liée si disponible, sinon une période */}
                      {inv.order_reference || `Commande #${inv.order_id}`}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {parseFloat(inv.amount).toLocaleString('fr-FR')} FCFA
                    </td>
                    <td>
                      <span className={`od-fact-badge ${getBadgeClass(inv.status)}`}>
                        {getStatusLabel(inv.status)}
                      </span>
                    </td>
                    <td>{formatDate(inv.issued_at || inv.created_at)}</td>
                    {/* Remplacez vos anciens boutons par ceux-ci dans le <tbody> */}
                    <td>
                      <div className="od-fact-action-buttons">
                        <button 
                          className="od-fact-action-btn view" 
                          onClick={() => handleView(inv)} // <-- On passe 'inv' (l'objet), pas 'inv.id'
                          title="Voir la facture"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="od-fact-action-btn download" 
                          onClick={() => handleDownload(inv)} // <-- On passe 'inv' (l'objet)
                          title="Télécharger en PDF"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Barre de Pagination */}
            {lastPage > 1 && (
              <div className="od-fact-pagination">
                <div className="od-fact-pagination-info">
                  Affichage de <strong>{invoices.length > 0 ? 1 : 0}</strong> à <strong>{invoices.length}</strong> sur <strong>{totalItems}</strong> résultats
                </div>
                
                <nav className="od-fact-pagination-nav" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="od-fact-pagination-btn"
                    title="Page précédente"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  
                  <span className="od-fact-pagination-current">
                    Page {currentPage} / {lastPage}
                  </span>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, lastPage))}
                    disabled={currentPage === lastPage}
                    className="od-fact-pagination-btn"
                    title="Page suivante"
                  >
                    <ChevronRight size={18} />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default FacturesSection;