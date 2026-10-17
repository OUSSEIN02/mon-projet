// components/dashboard/sections/ZonesTarifsSection.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Globe, MapPin, DollarSign, Edit, Plus, Trash2, CheckCircle, X, Search, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast'; // <-- Import du toaster
import apiClient from '../../../services/apiClient';
import Loader from '../../../utils/Loader';
import ConfirmationModal from '../../../components/ui/ConfirmationModal'; // <-- Ajuste le chemin si nécessaire

const ZonesTarifsSection = () => {
  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ tarif_km: '' });
  const [deletingId, setDeletingId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  
  // État pour la modale de confirmation
  const [zoneToDelete, setZoneToDelete] = useState(null);

  const fetchZones = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus !== 'all' && { status: filterStatus })
      });
      const response = await apiClient.get(`/dashboard/zones?${params.toString()}`);
      const data = response.data.data || response.data;
      const formattedData = (Array.isArray(data) ? data : []).map(z => ({
        id: z.id, nom: z.nom, code: z.code, tarif_km: parseFloat(z.tarif_km) || 0, statut: z.statut || 'actif', created_at: z.created_at
      }));
      setZones(formattedData);
    } catch (err) {
      console.error("Erreur chargement zones:", err);
      setError("Impossible de charger la liste des zones.");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, filterStatus]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchZones(); }, 500);
    return () => clearTimeout(timer);
  }, [fetchZones]);

  const handleStartEdit = (zone) => {
    setEditingId(zone.id);
    setEditValues({ tarif_km: zone.tarif_km.toString() });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues({ tarif_km: '' });
  };

  const handleSaveEdit = async (zoneId) => {
    if (!editValues.tarif_km || Number(editValues.tarifKm) < 0) {
      toast.error('Le tarif au km doit être supérieur ou égal à 0.');
      return;
    }
    setSavingId(zoneId);
    try {
      await apiClient.put(`/dashboard/zones/${zoneId}`, { tarif_km: Number(editValues.tarif_km) });
      setZones(prev => prev.map(z => z.id === zoneId ? { ...z, tarif_km: Number(editValues.tarif_km) } : z));
      handleCancelEdit();
      toast.success('Tarif mis à jour avec succès.');
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
      toast.error(err.response?.data?.message || "Erreur lors de la sauvegarde.");
    } finally {
      setSavingId(null);
    }
  };

  // ✅ Déclenche l'ouverture de la modale au lieu de window.confirm
  const requestDelete = (zone) => {
    setZoneToDelete(zone);
  };

  // ✅ Exécute la suppression après confirmation dans la modale
  const confirmDelete = async () => {
    if (!zoneToDelete) return;
    setDeletingId(zoneToDelete.id);
    try {
      await apiClient.delete(`/dashboard/zones/${zoneToDelete.id}`);
      setZones(prev => prev.filter(z => z.id !== zoneToDelete.id));
      toast.success(`La zone "${zoneToDelete.nom}" a été supprimée.`);
    } catch (err) {
      console.error("Erreur suppression:", err);
      toast.error(err.response?.data?.message || "Erreur lors de la suppression.");
    } finally {
      setDeletingId(null);
      setZoneToDelete(null);
    }
  };

  const handleToggleStatut = async (zone) => {
    const nouveauStatut = zone.statut === 'actif' ? 'inactif' : 'actif';
    try {
      await apiClient.put(`/dashboard/zones/${zone.id}`, { statut: nouveauStatut });
      setZones(prev => prev.map(z => z.id === zone.id ? { ...z, statut: nouveauStatut } : z));
      toast.success(`Statut changé en : ${nouveauStatut}`);
    } catch (err) {
      console.error("Erreur changement statut:", err);
      toast.error("Erreur lors du changement de statut.");
    }
  };

  if (isLoading && zones.length === 0) {
    return <Loader text="Chargement des zones..." fullScreen={false} size="lg" />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="zt-container">
      <div className="zt-header">
        <div className="zt-header-title">
          <h2>Zones de couverture & Tarifs</h2>
          <p className="zt-subtitle">Configurez les zones et les grilles tarifaires</p>
        </div>
        <div className="zt-actions">
          <Link to="/dashboard/add-zone" className="zt-btn zt-btn-primary">
            <Plus size={18} /><span>Ajouter une zone</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="zt-error-box">
          <AlertCircle size={18} className="zt-error-icon" />
          <span className="zt-error-text">{error}</span>
          <button className="zt-error-retry" onClick={fetchZones}>Réessayer</button>
        </div>
      )}

      <div className="zt-filters-bar">
        <div className="zt-search-wrapper">
          <Search size={18} className="zt-search-icon" />
          <input type="text" placeholder="Rechercher une zone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="zt-search-input" />
        </div>
        <div className="zt-filters-group">
          <select className="zt-filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Toutes les zones</option>
            <option value="actif">Actives</option>
            <option value="inactif">Inactives</option>
          </select>
        </div>
      </div>

      <div className="zt-table-container">
        {zones.length === 0 && !isLoading ? (
          <div className="zt-empty-state">
            <MapPin size={48} className="zt-empty-icon" />
            <h3 className="zt-empty-title">Aucune zone trouvée</h3>
            <p className="zt-empty-text">{searchTerm || filterStatus !== 'all' ? "Aucun résultat ne correspond à vos critères." : "Commencez par ajouter une nouvelle zone."}</p>
          </div>
        ) : (
          <table className="zt-table">
            <thead>
              <tr>
                <th>Zone</th><th>Code</th><th>Tarif / km</th><th>Statut</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone) => (
                <tr key={zone.id}>
                  <td>
                    <div className="zt-zone-cell">
                      <div className="zt-zone-icon"><MapPin size={16} /></div>
                      <div className="zt-zone-name">{zone.nom}</div>
                    </div>
                  </td>
                  <td><span className="zt-code-badge">{zone.code}</span></td>
                  <td>
                    {editingId === zone.id ? (
                      <div className="zt-edit-wrapper">
                        <input type="number" value={editValues.tarif_km} onChange={(e) => setEditValues({ tarif_km: e.target.value })} className="zt-edit-input" min="0" step="0.01" autoFocus />
                        <span className="zt-edit-currency">FCFA</span>
                      </div>
                    ) : (
                      <span className="zt-amount-text">{zone.tarif_km.toLocaleString('fr-FR')} FCFA</span>
                    )}
                  </td>
                  <td>
                    <button onClick={() => handleToggleStatut(zone)} className={`zt-badge ${zone.statut === 'actif' ? 'zt-badge-success' : 'zt-badge-danger'}`} title="Cliquez pour changer le statut">
                      {zone.statut === 'actif' ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td>
                    <div className="zt-action-buttons">
                      {editingId === zone.id ? (
                        <>
                          <button className="zt-action-btn zt-action-success" onClick={() => handleSaveEdit(zone.id)} disabled={savingId === zone.id} title="Enregistrer">
                            {savingId === zone.id ? <span className="zt-spinner"></span> : <CheckCircle size={16} />}
                          </button>
                          <button className="zt-action-btn zt-action-danger" onClick={handleCancelEdit} disabled={savingId === zone.id} title="Annuler">
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="zt-action-btn" onClick={() => handleStartEdit(zone)} title="Modifier le tarif">
                            <Edit size={16} />
                          </button>
                          {/* ✅ Déclenche la modale au lieu de window.confirm */}
                          <button className="zt-action-btn zt-action-danger" onClick={() => requestDelete(zone)} disabled={deletingId === zone.id} title="Supprimer">
                            {deletingId === zone.id ? <span className="zt-spinner zt-spinner-danger"></span> : <Trash2 size={16} />}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="zt-panel">
        <div className="zt-panel-head">
          <h3>Légende tarifaire</h3>
          <span className="zt-panel-subtitle">Les tarifs sont indicatifs et peuvent être ajustés</span>
        </div>
        <div className="zt-legend-grid">
          <div className="zt-legend-item">
            <div className="zt-legend-header"><Globe size={16} className="zt-icon-blue" /><span className="zt-legend-title">Tarif / km</span></div>
            <span className="zt-legend-desc">Coût appliqué par kilomètre parcouru</span>
          </div>
          <div className="zt-legend-item">
            <div className="zt-legend-header"><DollarSign size={16} className="zt-icon-orange" /><span className="zt-legend-title">FCFA</span></div>
            <span className="zt-legend-desc">Devise utilisée pour toutes les transactions</span>
          </div>
          <div className="zt-legend-item">
            <div className="zt-legend-header"><MapPin size={16} className="zt-icon-purple" /><span className="zt-legend-title">Zones actives</span></div>
            <span className="zt-legend-desc">{zones.filter(z => z.statut === 'actif').length} zone(s) actuellement active(s)</span>
          </div>
        </div>
      </div>

      {/* ✅ Modale de confirmation intégrée */}
      <ConfirmationModal 
        isOpen={!!zoneToDelete}
        onClose={() => setZoneToDelete(null)}
        onConfirm={confirmDelete}
        title="Supprimer la zone"
        message={`Êtes-vous sûr de vouloir supprimer la zone "${zoneToDelete?.nom}" ? Cette action est irréversible et affectera les calculs de livraison.`}
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        isDanger={true}
      />

      <style>{`
        .zt-container { --zt-primary: #f97316; --zt-primary-hover: #f97316; --zt-orange: #f97316; --zt-orange-light: #fff7ed; --zt-green: #10b981; --zt-green-hover: #059669; --zt-red: #ef4444; --zt-red-hover: #dc2626; --zt-blue: #3b82f6; --zt-purple: #8b5cf6; --zt-bg: #ffffff; --zt-bg-secondary: #f8fafc; --zt-border: #e2e8f0; --zt-text: #0f172a; --zt-text-muted: #64748b; --zt-radius: 12px; --zt-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);  color: var(--zt-text); background: var(--zt-bg); padding: 24px; border-radius: var(--zt-radius); box-shadow: var(--zt-shadow); width: 100%; box-sizing: border-box; }
        .zt-container * { box-sizing: border-box; }
        .zt-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
        .zt-header-title h2 { margin: 0 0 4px 0; font-size: 24px; font-weight: 700; color: var(--zt-text); }
        .zt-subtitle { margin: 0; font-size: 14px; color: var(--zt-text-muted); }
        .zt-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .zt-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; border: 1px solid transparent; text-decoration: none; white-space: nowrap; }
        .zt-btn-primary { background: var(--zt-primary); color: white; }
        .zt-btn-primary:hover { background: var(--zt-primary-hover); }
        .zt-error-box { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin-bottom: 20px; color: #991b1b; font-size: 14px; }
        .zt-error-icon { flex-shrink: 0; } .zt-error-text { flex: 1; }
        .zt-error-retry { margin-left: auto; background: none; border: none; color: #991b1b; font-weight: 600; cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: background 0.2s; }
        .zt-error-retry:hover { background: #fee2e2; }
        .zt-filters-bar { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; padding: 16px; background: var(--zt-bg-secondary); border-radius: var(--zt-radius); border: 1px solid var(--zt-border); }
        .zt-search-wrapper { position: relative; width: 100%; }
        .zt-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--zt-text-muted); }
        .zt-search-input { width: 100%; padding: 10px 12px 10px 40px; border: 1px solid var(--zt-border); border-radius: 8px; font-size: 14px; outline: none; transition: border-color 0.2s; background: white; }
        .zt-search-input:focus { border-color: var(--zt-primary); }
        .zt-filters-group { display: flex; gap: 12px; flex-wrap: wrap; }
        .zt-filter-select { padding: 10px 14px; border: 1px solid var(--zt-border); border-radius: 8px; font-size: 14px; background: white; color: var(--zt-text); cursor: pointer; outline: none; min-width: 160px; }
        .zt-table-container { overflow-x: auto; border: 1px solid var(--zt-border); border-radius: var(--zt-radius); margin-bottom: 24px; background: white; }
        .zt-table { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 700px; }
        .zt-table th { background: var(--zt-bg-secondary); padding: 12px 16px; text-align: left; font-weight: 600; color: var(--zt-text-muted); border-bottom: 1px solid var(--zt-border); white-space: nowrap; }
        .zt-table td { padding: 16px; border-bottom: 1px solid var(--zt-border); vertical-align: middle; }
        .zt-table tbody tr:hover { background: #fafafa; }
        .zt-table tbody tr:last-child td { border-bottom: none; }
        .zt-zone-cell { display: flex; align-items: center; gap: 12px; }
        .zt-zone-icon { width: 32px; height: 32px; border-radius: 8px; background: var(--zt-orange-light); display: flex; align-items: center; justify-content: center; color: var(--zt-orange); flex-shrink: 0; }
        .zt-zone-name { font-weight: 600; color: var(--zt-text); }
        .zt-code-badge { background: var(--zt-bg-secondary); padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; color: var(--zt-text-muted); border: 1px solid var(--zt-border); }
        .zt-edit-wrapper { display: flex; align-items: center; gap: 6px; }
        .zt-edit-input { width: 100px; padding: 6px 10px; border: 1px solid var(--zt-primary); border-radius: 6px; font-size: 14px; font-weight: 600; outline: none; }
        .zt-edit-currency { font-size: 12px; color: var(--zt-text-muted); }
        .zt-amount-text { font-weight: 600; color: var(--zt-text); }
        .zt-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap; }
        .zt-badge-success { background: #d1fae5; color: #065f46; }
        .zt-badge-danger { background: #fee2e2; color: #991b1b; }
        .zt-action-buttons { display: flex; gap: 8px; }
        .zt-action-btn { width: 32px; height: 32px; border-radius: 6px; border: 1px solid var(--zt-border); background: white; color: var(--zt-text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .zt-action-btn:hover:not(:disabled) { background: var(--zt-bg-secondary); color: var(--zt-primary); border-color: var(--zt-primary); }
        .zt-action-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .zt-action-success:hover:not(:disabled) { color: var(--zt-green); border-color: var(--zt-green); background: #f0fdf4; }
        .zt-action-danger:hover:not(:disabled) { color: var(--zt-red); border-color: var(--zt-red); background: #fef2f2; }
        .zt-spinner { width: 14px; height: 14px; border: 2px solid var(--zt-green); border-top-color: transparent; border-radius: 50%; animation: zt-spin 0.8s linear infinite; }
        .zt-spinner-danger { border-color: var(--zt-red); border-top-color: transparent; }
        @keyframes zt-spin { to { transform: rotate(360deg); } }
        .zt-empty-state { text-align: center; padding: 48px 20px; color: var(--zt-text-muted); }
        .zt-empty-icon { color: #d1d5db; margin: 0 auto 16px; display: block; }
        .zt-empty-title { font-size: 16px; font-weight: 600; color: var(--zt-text); margin: 0 0 8px 0; }
        .zt-empty-text { font-size: 14px; margin: 0; }
        .zt-panel { margin-top: 24px; padding: 20px; background: var(--zt-bg-secondary); border-radius: var(--zt-radius); border: 1px solid var(--zt-border); }
        .zt-panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
        .zt-panel-head h3 { margin: 0; font-size: 16px; font-weight: 600; }
        .zt-panel-subtitle { font-size: 12px; color: var(--zt-text-muted); }
        .zt-legend-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
        .zt-legend-item { padding: 16px; background: white; border-radius: 8px; border: 1px solid var(--zt-border); }
        .zt-legend-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .zt-icon-blue { color: var(--zt-blue); } .zt-icon-orange { color: var(--zt-orange); } .zt-icon-purple { color: var(--zt-purple); }
        .zt-legend-title { font-weight: 600; font-size: 14px; }
        .zt-legend-desc { font-size: 13px; color: var(--zt-text-muted); line-height: 1.4; }
        @media (max-width: 768px) { .zt-header { flex-direction: column; align-items: stretch; } .zt-actions { width: 100%; } .zt-actions .zt-btn { flex: 1; justify-content: center; } .zt-filters-group { flex-direction: column; } .zt-filter-select { width: 100%; } .zt-panel-head { flex-direction: column; align-items: flex-start; } }
        @media (max-width: 640px) { .zt-error-box { flex-direction: column; align-items: flex-start; gap: 8px; } .zt-error-retry { margin-left: 0; width: 100%; text-align: center; padding: 8px; background: #fee2e2; border-radius: 6px; } .zt-table th, .zt-table td { padding: 12px; } .zt-edit-input { width: 80px; } }
      `}</style>
    </motion.div>
  );
};

export default ZonesTarifsSection;