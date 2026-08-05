import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Shield,
  Bell,
  Mail,
  Globe,
  Users,
  Lock,
  Save,
  ChevronDown,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  Smartphone,
  CreditCard,
  Building,
  MapPin,
  Clock // Ajout de l'icône Clock manquante
} from 'lucide-react';

const ParametresSection = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isEditing, setIsEditing] = useState(false);

  const tabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'securite', label: 'Sécurité', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Intégrations', icon: Globe },
    { id: 'utilisateurs', label: 'Utilisateurs', icon: Users }
  ];

  return ( 
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="section-container"
    >
      <div className="section-header">
        <div>
          <h2>Paramètres</h2>
          <p className="section-subtitle">Configurez les paramètres de la plateforme</p>
        </div>
        <div className="section-actions">
          <button className="btn-primary" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? <CheckCircle size={18} /> : <Save size={18} />}
            {isEditing ? 'Enregistrer' : 'Modifier'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '24px' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={16} style={{ marginRight: '8px' }} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu des paramètres */}
      <div className="panel">
        {activeTab === 'general' && (
          <div>
            <h3 style={{ marginBottom: '20px' }}>Paramètres généraux</h3>
            <div className="settings-form">
              <div className="form-group">
                <label className="form-label">
                  <Building size={16} /> Nom de la plateforme
                </label>
                <input
                  type="text"
                  defaultValue="Gabon Livraison Express"
                  disabled={!isEditing}
                  className={`form-input ${!isEditing ? 'disabled' : ''}`}
                  style={{ maxWidth: '400px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Globe size={16} /> URL de la plateforme
                </label>
                <input
                  type="text"
                  defaultValue="https://gabon-livraison.com"
                  disabled={!isEditing}
                  className={`form-input ${!isEditing ? 'disabled' : ''}`}
                  style={{ maxWidth: '400px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Mail size={16} /> Email de contact
                </label>
                <input
                  type="email"
                  defaultValue="support@gabon-livraison.com"
                  disabled={!isEditing}
                  className={`form-input ${!isEditing ? 'disabled' : ''}`}
                  style={{ maxWidth: '400px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <MapPin size={16} /> Siège social
                </label>
                <input
                  type="text"
                  defaultValue="Libreville, Gabon"
                  disabled={!isEditing}
                  className={`form-input ${!isEditing ? 'disabled' : ''}`}
                  style={{ maxWidth: '400px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Smartphone size={16} /> Application mobile
                </label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    defaultValue="https://play.google.com/store/apps"
                    placeholder="Google Play"
                    disabled={!isEditing}
                    className={`form-input ${!isEditing ? 'disabled' : ''}`}
                    style={{ maxWidth: '300px' }}
                  />
                  <input
                    type="text"
                    defaultValue="https://apps.apple.com/app"
                    placeholder="App Store"
                    disabled={!isEditing}
                    className={`form-input ${!isEditing ? 'disabled' : ''}`}
                    style={{ maxWidth: '300px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'securite' && (
          <div>
            <h3 style={{ marginBottom: '20px' }}>Paramètres de sécurité</h3>
            <div className="settings-form">
              <div className="form-group">
                <label className="form-label">
                  <Lock size={16} /> Longueur minimale du mot de passe
                </label>
                <select
                  disabled={!isEditing}
                  className={`filter-select ${!isEditing ? 'disabled' : ''}`}
                  style={{ maxWidth: '200px' }}
                >
                  <option>6 caractères</option>
                  <option selected>8 caractères</option>
                  <option>10 caractères</option>
                  <option>12 caractères</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Shield size={16} /> Authentification à deux facteurs
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="radio" name="2fa" defaultChecked disabled={!isEditing} />
                    Activé
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="radio" name="2fa" disabled={!isEditing} />
                    Désactivé
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Clock size={16} /> Durée de session
                </label>
                <select
                  disabled={!isEditing}
                  className={`filter-select ${!isEditing ? 'disabled' : ''}`}
                  style={{ maxWidth: '200px' }}
                >
                  <option>1 heure</option>
                  <option selected>4 heures</option>
                  <option>8 heures</option>
                  <option>12 heures</option>
                  <option>24 heures</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <h3 style={{ marginBottom: '20px' }}>Notifications</h3>
            <div className="settings-form">
              <div className="notification-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: '600' }}>Nouvelles commandes</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Recevoir une notification pour chaque nouvelle commande</div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                  <input type="checkbox" defaultChecked disabled={!isEditing} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'var(--orange)',
                    borderRadius: '24px',
                    transition: '0.3s'
                  }}></span>
                </label>
              </div>

              <div className="notification-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: '600' }}>Alertes litiges</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Recevoir une alerte pour chaque nouveau litige</div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                  <input type="checkbox" defaultChecked disabled={!isEditing} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'var(--orange)',
                    borderRadius: '24px',
                    transition: '0.3s'
                  }}></span>
                </label>
              </div>

              <div className="notification-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                <div>
                  <div style={{ fontWeight: '600' }}>Rapports hebdomadaires</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Recevoir le rapport d'activité chaque semaine</div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                  <input type="checkbox" disabled={!isEditing} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: '#ccc',
                    borderRadius: '24px',
                    transition: '0.3s'
                  }}></span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div>
            <h3 style={{ marginBottom: '20px' }}>Intégrations</h3>
            <div className="settings-form">
              <div className="integration-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg)', borderRadius: '10px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CreditCard size={24} style={{ color: 'var(--blue)' }} />
                  <div>
                    <div style={{ fontWeight: '600' }}>Stripe</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Paiements en ligne</div>
                  </div>
                </div>
                <span className="badge badge-success">Connecté</span>
              </div>

              <div className="integration-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg)', borderRadius: '10px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Mail size={24} style={{ color: 'var(--orange)' }} />
                  <div>
                    <div style={{ fontWeight: '600' }}>SendGrid</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Emails transactionnels</div>
                  </div>
                </div>
                <span className="badge badge-success">Connecté</span>
              </div>

              <div className="integration-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Globe size={24} style={{ color: 'var(--purple)' }} />
                  <div>
                    <div style={{ fontWeight: '600' }}>Google Maps</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Géolocalisation et traçage</div>
                  </div>
                </div>
                <span className="badge badge-success">Connecté</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'utilisateurs' && (
          <div>
            <h3 style={{ marginBottom: '20px' }}>Gestion des utilisateurs</h3>
            <div className="settings-form">
              <div className="form-group">
                <label className="form-label">
                  <Users size={16} /> Administrateurs
                </label>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg)', borderRadius: '8px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600' }}>AS</div>
                      <div>
                        <div style={{ fontWeight: '600' }}>Admin Super</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>admin@gabon-livraison.com</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="action-btn" disabled={!isEditing}><Edit size={14} /></button>
                      <button className="action-btn danger" disabled={!isEditing}><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600' }}>JM</div>
                      <div>
                        <div style={{ fontWeight: '600' }}>Jean Moussavou</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>jean@gabon-livraison.com</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="action-btn" disabled={!isEditing}><Edit size={14} /></button>
                      <button className="action-btn danger" disabled={!isEditing}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
                {isEditing && (
                  <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                    <Plus size={14} /> Ajouter un administrateur
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ParametresSection;