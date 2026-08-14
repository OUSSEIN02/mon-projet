// components/dashboard/sections/ZonesTarifsSection.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Globe,
  MapPin,
  DollarSign,
  Edit,
  Plus,
  Trash2,
  Save,
  X,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

import apiClient from '../../../services/apiClient';
import Loader from '../../../utils/Loader';

const ZonesTarifsSection = () => {
  // États des données
  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // États UI
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ tarif_km: '' });
  const [deletingId, setDeletingId] = useState(null);
  const [savingId, setSavingId] = useState(null);

  // --- CHARGEMENT DES ZONES ---
  const fetchZones = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus !== 'all' && { status: filterStatus })
      });

      const response = await apiClient.get(`/dashboard/zones?${params.toString()}`);
      const responseData = response.data;
      const data = responseData.data || responseData;

      const formattedData = (Array.isArray(data) ? data : []).map(z => ({
        id: z.id,
        nom: z.nom,
        code: z.code,
        tarif_km: parseFloat(z.tarif_km) || 0,
        statut: z.statut || 'actif',
        created_at: z.created_at
      }));

      setZones(formattedData);
    } catch (err) {
      console.error("Erreur chargement zones:", err);
      setError("Impossible de charger la liste des zones.");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, filterStatus]);

  // Debounce recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchZones();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchZones]);

  // --- ÉDITION D'UNE ZONE ---
  const handleStartEdit = (zone) => {
    setEditingId(zone.id);
    setEditValues({ tarif_km: zone.tarif_km.toString() });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues({ tarif_km: '' });
  };

  const handleSaveEdit = async (zoneId) => {
    if (!editValues.tarif_km || Number(editValues.tarif_km) < 0) {
      alert('Le tarif au km doit être supérieur ou égal à 0.');
      return;
    }

    setSavingId(zoneId);
    try {
      await apiClient.put(`/dashboard/zones/${zoneId}`, {
        tarif_km: Number(editValues.tarif_km)
      });

      setZones(prev => prev.map(z =>
        z.id === zoneId ? { ...z, tarif_km: Number(editValues.tarif_km) } : z
      ));
      handleCancelEdit();
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
      alert(err.response?.data?.message || "Erreur lors de la sauvegarde.");
    } finally {
      setSavingId(null);
    }
  };

  // --- SUPPRESSION D'UNE ZONE ---
  const handleDelete = async (zone) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la zone "${zone.nom}" ?`)) {
      return;
    }

    setDeletingId(zone.id);
    try {
      await apiClient.delete(`/dashboard/zones/${zone.id}`);
      setZones(prev => prev.filter(z => z.id !== zone.id));
    } catch (err) {
      console.error("Erreur suppression:", err);
      alert(err.response?.data?.message || "Erreur lors de la suppression.");
    } finally {
      setDeletingId(null);
    }
  };

  // --- CHANGEMENT DE STATUT RAPIDE ---
  const handleToggleStatut = async (zone) => {
    const nouveauStatut = zone.statut === 'actif' ? 'inactif' : 'actif';
    try {
      await apiClient.put(`/dashboard/zones/${zone.id}`, {
        statut: nouveauStatut
      });
      setZones(prev => prev.map(z =>
        z.id === zone.id ? { ...z, statut: nouveauStatut } : z
      ));
    } catch (err) {
      console.error("Erreur changement statut:", err);
      alert("Erreur lors du changement de statut.");
    }
  };

  // --- RENDU ---
  if (isLoading && zones.length === 0) {
    return <Loader text="Chargement des zones..." fullScreen={false} size="lg" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="section-container"
    >
      <div className="section-header">
        <div>
          <h2>Zones de couverture & Tarifs</h2>
          <p className="section-subtitle">Configurez les zones et les grilles tarifaires</p>
        </div>
        <div className="section-actions">
          <Link to="/dashboard/add-zone" className="btn-primary">
            <Plus size={18} />
            Ajouter une zone
          </Link>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          marginBottom: '20px',
          color: '#991b1b',
          fontSize: '14px'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            onClick={fetchZones}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#991b1b', fontWeight: '600', cursor: 'pointer' }}
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Filtres */}
      <div className="filters-bar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher une zone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filters-group">
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Toutes les zones</option>
            <option value="actif">Actives</option>
            <option value="inactif">Inactives</option>
          </select>
        </div>
      </div>

      {/* Tableau des zones */}
      <div className="table-container">
        {zones.length === 0 && !isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#6b7280' }}>
            <MapPin size={48} style={{ color: '#d1d5db', margin: '0 auto 16px', display: 'block' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>
              Aucune zone trouvée
            </h3>
            <p style={{ fontSize: '14px', margin: 0 }}>
              {searchTerm || filterStatus !== 'all'
                ? "Aucun résultat ne correspond à vos critères."
                : "Commencez par ajouter une nouvelle zone."}
            </p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Zone</th>
                <th>Code</th>
                <th>Tarif / km</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone) => (
                <tr key={zone.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'var(--orange-light, #fff0eb)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--orange, #F26A22)'
                      }}>
                        <MapPin size={16} />
                      </div>
                      <div>
                        <div style={{ fontWeight: '600' }}>{zone.nom}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      background: 'var(--bg, #f3f4f6)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {zone.code}
                    </span>
                  </td>
                  <td>
                    {editingId === zone.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          value={editValues.tarif_km}
                          onChange={(e) => setEditValues({ tarif_km: e.target.value })}
                          className="form-input"
                          style={{ width: '90px', padding: '4px 8px' }}
                          min="0"
                          step="0.01"
                          autoFocus
                        />
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>FCFA</span>
                      </div>
                    ) : (
                      <span style={{ fontWeight: '600' }}>
                        {zone.tarif_km.toLocaleString('fr-FR')} FCFA
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleStatut(zone)}
                      className={`badge ${zone.statut === 'actif' ? 'badge-success' : 'badge-danger'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                      title="Cliquez pour changer le statut"
                    >
                      {zone.statut === 'actif' ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {editingId === zone.id ? (
                        <>
                          <button
                            className="action-btn success"
                            onClick={() => handleSaveEdit(zone.id)}
                            disabled={savingId === zone.id}
                            title="Enregistrer"
                          >
                            {savingId === zone.id ? (
                              <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid #16a34a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                            ) : (
                              <CheckCircle size={16} />
                            )}
                          </button>
                          <button
                            className="action-btn danger"
                            onClick={handleCancelEdit}
                            disabled={savingId === zone.id}
                            title="Annuler"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="action-btn"
                            onClick={() => handleStartEdit(zone)}
                            title="Modifier le tarif"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="action-btn danger"
                            onClick={() => handleDelete(zone)}
                            disabled={deletingId === zone.id}
                            title="Supprimer"
                          >
                            {deletingId === zone.id ? (
                              <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid #dc2626', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                            ) : (
                              <Trash2 size={16} />
                            )}
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

      {/* Légende tarifaire */}
      <div className="panel" style={{ marginTop: '24px' }}>
        <div className="panel-head">
          <h3>Légende tarifaire</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted, #6b7280)' }}>
            Les tarifs sont indicatifs et peuvent être ajustés
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'var(--bg, #f9fafb)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Globe size={16} style={{ color: 'var(--blue, #2563eb)' }} />
              <span style={{ fontWeight: '600' }}>Tarif / km</span>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted, #6b7280)' }}>
              Coût appliqué par kilomètre parcouru
            </span>
          </div>
          <div style={{ padding: '12px', background: 'var(--bg, #f9fafb)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <DollarSign size={16} style={{ color: 'var(--orange, #F26A22)' }} />
              <span style={{ fontWeight: '600' }}>FCFA</span>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted, #6b7280)' }}>
              Devise utilisée pour toutes les transactions
            </span>
          </div>
          <div style={{ padding: '12px', background: 'var(--bg, #f9fafb)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <MapPin size={16} style={{ color: 'var(--purple, #9333ea)' }} />
              <span style={{ fontWeight: '600' }}>Zones actives</span>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted, #6b7280)' }}>
              {zones.filter(z => z.statut === 'actif').length} zone(s) actuellement active(s)
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ZonesTarifsSection;