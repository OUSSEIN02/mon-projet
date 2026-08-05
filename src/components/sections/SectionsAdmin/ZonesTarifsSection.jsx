// components/admin/sections/ZonesTarifsSection.jsx
import React, { useState } from 'react';
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
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

const ZonesTarifsSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);

  const zonesData = [
    {
      id: 1,
      nom: 'Libreville',
      code: 'LBV',
      tarifBase: '500',
      tarifKm: '150',
      delai: '30-45 min',
      livreursDisponibles: 12,
      statut: 'actif'
    },
    {
      id: 2,
      nom: 'Owendo',
      code: 'OWE',
      tarifBase: '600',
      tarifKm: '175',
      delai: '35-50 min',
      livreursDisponibles: 8,
      statut: 'actif'
    },
    {
      id: 3,
      nom: 'Akanda',
      code: 'AKA',
      tarifBase: '550',
      tarifKm: '160',
      delai: '30-45 min',
      livreursDisponibles: 6,
      statut: 'actif'
    },
    {
      id: 4,
      nom: 'Ntoum',
      code: 'NTO',
      tarifBase: '700',
      tarifKm: '200',
      delai: '45-60 min',
      livreursDisponibles: 4,
      statut: 'actif'
    },
    {
      id: 5,
      nom: 'Port-Gentil',
      code: 'POG',
      tarifBase: '800',
      tarifKm: '225',
      delai: '60-90 min',
      livreursDisponibles: 3,
      statut: 'inactif'
    }
  ];

  const filteredZones = zonesData.filter(z =>
    z.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    z.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <Link to="/admin/add-zone" className="btn-primary">
          <Plus size={18} />
          Ajouter une zone
        </Link>
      
        </div>
      </div>

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
          <select className="filter-select">
            <option value="all">Toutes les zones</option>
            <option value="actif">Actives</option>
            <option value="inactif">Inactives</option>
          </select>
          <button className="filter-btn">
            <Filter size={18} />
            Filtres
          </button>
        </div>
      </div>

      {/* Tableau des zones */}
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Zone</th>
              <th>Code</th>
              <th>Tarif de base</th>
              <th>Tarif / km</th>
              <th>Délai estimé</th>
              <th>Livreurs</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredZones.map((zone) => (
              <tr key={zone.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'var(--orange-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--orange)'
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
                    background: 'var(--bg)',
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
                    <input
                      type="text"
                      defaultValue={zone.tarifBase}
                      className="form-input"
                      style={{ width: '80px', padding: '4px 8px' }}
                    />
                  ) : (
                    <span>{zone.tarifBase} FCFA</span>
                  )}
                </td>
                <td>
                  {editingId === zone.id ? (
                    <input
                      type="text"
                      defaultValue={zone.tarifKm}
                      className="form-input"
                      style={{ width: '80px', padding: '4px 8px' }}
                    />
                  ) : (
                    <span>{zone.tarifKm} FCFA</span>
                  )}
                </td>
                <td>{zone.delai}</td>
                <td style={{ textAlign: 'center' }}>
                  <span style={{
                    background: 'var(--blue-light)',
                    color: 'var(--blue)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {zone.livreursDisponibles}
                  </span>
                </td>
                <td>
                  <span className={`badge ${zone.statut === 'actif' ? 'badge-success' : 'badge-danger'}`}>
                    {zone.statut === 'actif' ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    {editingId === zone.id ? (
                      <>
                        <button className="action-btn success" onClick={() => setEditingId(null)}>
                          <CheckCircle size={16} />
                        </button>
                        <button className="action-btn danger" onClick={() => setEditingId(null)}>
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="action-btn" onClick={() => setEditingId(zone.id)}>
                          <Edit size={16} />
                        </button>
                        <button className="action-btn danger">
                          <Trash2 size={16} />
                        </button>
                     
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Légende tarifaire */}
      <div className="panel" style={{ marginTop: '24px' }}>
        <div className="panel-head">
          <h3>Légende tarifaire</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Les tarifs sont indicatifs et peuvent être ajustés
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <DollarSign size={16} style={{ color: 'var(--orange)' }} />
              <span style={{ fontWeight: '600' }}>Tarif de base</span>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Montant minimum par livraison
            </span>
          </div>
          <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Globe size={16} style={{ color: 'var(--blue)' }} />
              <span style={{ fontWeight: '600' }}>Tarif / km</span>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Coût additionnel par kilomètre
            </span>
          </div>
          <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Clock size={16} style={{ color: 'var(--purple)' }} />
              <span style={{ fontWeight: '600' }}>Délai estimé</span>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Temps moyen de livraison
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ZonesTarifsSection;