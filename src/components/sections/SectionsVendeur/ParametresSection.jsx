import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, Shield, Globe, Mail, Smartphone, 
  AlertTriangle, Layout, Save, CheckCircle2 
} from 'lucide-react';
import toast from 'react-hot-toast';

const ParametresSection = () => {
  const [isSaving, setIsSaving] = useState(false);
  
  // États réalistes pour une app de livraison
  const [settings, setSettings] = useState({
    // Notifications
    notifNouvelleCommande: true,
    notifLitige: true,
    notifSMSLivreur: false,
    
    // Affichage
    langue: 'fr',
    modeCompact: false, // Très utile pour les dashboards avec beaucoup de données
    
    // Sécurité
    twoFactor: false
  });

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulation d'appel API
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Vos préférences ont été enregistrées avec succès.', {
        icon: <CheckCircle2 size={18} color="#10b981" />
      });
    }, 800);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="param-container"
    >
      <div className="param-header">
        <div>
          <h2 className="param-title">Paramètres</h2>
          <p className="param-subtitle">Personnalisez vos notifications, votre affichage et la sécurité de votre compte.</p>
        </div>
        <button 
          className="param-btn-save" 
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Enregistrement...' : (
            <>
              <Save size={16} />
              Enregistrer les modifications
            </>
          )}
        </button>
      </div>

      <div className="param-grid">
        {/* --- SECTION 1 : NOTIFICATIONS --- */}
        <div className="param-card">
          <div className="param-card-header">
            <Bell size={20} className="param-icon" />
            <h3>Notifications</h3>
          </div>
          <div className="param-card-body">
            <p className="param-section-desc">Choisissez les alertes que vous souhaitez recevoir pour ne rien manquer.</p>
            
            <div className="param-setting-row">
              <div className="param-setting-info">
                <Mail size={18} className="param-setting-icon" />
                <div>
                  <span className="param-setting-label">Nouvelles commandes</span>
                  <span className="param-setting-desc">Recevoir un email lors de chaque nouvelle commande.</span>
                </div>
              </div>
              <ToggleSwitch 
                checked={settings.notifNouvelleCommande} 
                onChange={() => toggleSetting('notifNouvelleCommande')} 
              />
            </div>

            <div className="param-divider"></div>

            <div className="param-setting-row">
              <div className="param-setting-info">
                <AlertTriangle size={18} className="param-setting-icon param-icon-warning" />
                <div>
                  <span className="param-setting-label">Alertes de litiges</span>
                  <span className="param-setting-desc">Notification immédiate en cas de litige ou de course échouée.</span>
                </div>
              </div>
              <ToggleSwitch 
                checked={settings.notifLitige} 
                onChange={() => toggleSetting('notifLitige')} 
              />
            </div>

            <div className="param-divider"></div>

            <div className="param-setting-row">
              <div className="param-setting-info">
                <Smartphone size={18} className="param-setting-icon" />
                <div>
                  <span className="param-setting-label">Notifications SMS (Livreurs)</span>
                  <span className="param-setting-desc">Envoyer un SMS au livreur lors de l'attribution d'une course.</span>
                </div>
              </div>
              <ToggleSwitch 
                checked={settings.notifSMSLivreur} 
                onChange={() => toggleSetting('notifSMSLivreur')} 
              />
            </div>
          </div>
        </div>

        {/* --- SECTION 2 : AFFICHAGE & INTERFACE --- */}
        <div className="param-card">
          <div className="param-card-header">
            <Layout size={20} className="param-icon" />
            <h3>Affichage & Interface</h3>
          </div>
          <div className="param-card-body">
            <p className="param-section-desc">Adaptez l'interface à votre façon de travailler.</p>
            
            <div className="param-setting-row">
              <div className="param-setting-info">
                <Globe size={18} className="param-setting-icon" />
                <div>
                  <span className="param-setting-label">Langue de l'interface</span>
                  <span className="param-setting-desc">Langue d'affichage du tableau de bord.</span>
                </div>
              </div>
              <select 
                className="param-select"
                value={settings.langue}
                onChange={(e) => setSettings(prev => ({ ...prev, langue: e.target.value }))}
              >
                <option value="fr">🇬🇦 Français</option>
                <option value="en">🇬🇧 English</option>
              </select>
            </div>

            <div className="param-divider"></div>

            <div className="param-setting-row">
              <div className="param-setting-info">
                <Layout size={18} className="param-setting-icon" />
                <div>
                  <span className="param-setting-label">Mode compact des tableaux</span>
                  <span className="param-setting-desc">Réduit l'espacement des lignes pour afficher plus de données à l'écran.</span>
                </div>
              </div>
              <ToggleSwitch 
                checked={settings.modeCompact} 
                onChange={() => toggleSetting('modeCompact')} 
              />
            </div>
          </div>
        </div>

        {/* --- SECTION 3 : SÉCURITÉ --- */}
        <div className="param-card">
          <div className="param-card-header">
            <Shield size={20} className="param-icon" />
            <h3>Sécurité du compte</h3>
          </div>
          <div className="param-card-body">
            <p className="param-section-desc">Protégez l'accès à votre espace d'administration.</p>
            
            <div className="param-setting-row">
              <div className="param-setting-info">
                <Shield size={18} className="param-setting-icon param-icon-success" />
                <div>
                  <span className="param-setting-label">Authentification à deux facteurs (2FA)</span>
                  <span className="param-setting-desc">Exiger un code de validation en plus du mot de passe à la connexion.</span>
                </div>
              </div>
              <ToggleSwitch 
                checked={settings.twoFactor} 
                onChange={() => toggleSetting('twoFactor')} 
              />
            </div>

            <div className="param-divider"></div>

            <div className="param-setting-row param-action-row">
              <div className="param-setting-info">
                <div>
                  <span className="param-setting-label">Changer le mot de passe</span>
                  <span className="param-setting-desc">Mettez à jour votre mot de passe pour maintenir la sécurité de votre compte.</span>
                </div>
              </div>
              <button className="param-btn-secondary">
                Modifier
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Unique et Préfixé (param-) */}
      <style>{`
        .param-container {
          --param-primary: #2563eb;
          --param-primary-hover: #1d4ed8;
          --param-bg: #ffffff;
          --param-bg-secondary: #f8fafc;
          --param-border: #e2e8f0;
          --param-text: #0f172a;
          --param-text-muted: #64748b;
          --param-success: #10b981;
          --param-warning: #f59e0b;
          --param-radius: 12px;
          
          max-width: 1000px;
          margin: 0 auto;
          padding: 24px;
          color: var(--param-text);
        
        }
        .param-container * { box-sizing: border-box; }

        /* Header */
        .param-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .param-title { margin: 0 0 4px 0; font-size: 24px; font-weight: 700; }
        .param-subtitle { margin: 0; font-size: 14px; color: var(--param-text-muted); }

        .param-btn-save {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: var(--param-primary);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .param-btn-save:hover:not(:disabled) { background: var(--param-primary-hover); }
        .param-btn-save:disabled { opacity: 0.7; cursor: not-allowed; }

        /* Grid & Cards */
        .param-grid {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .param-card {
          background: var(--param-bg);
          border: 1px solid var(--param-border);
          border-radius: var(--param-radius);
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .param-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 24px;
          background: var(--param-bg-secondary);
          border-bottom: 1px solid var(--param-border);
        }
        .param-card-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
        .param-icon { color: var(--param-primary); }
        .param-card-body { padding: 24px; }
        .param-section-desc { margin: 0 0 20px 0; font-size: 13px; color: var(--param-text-muted); }

        /* Settings Rows */
        .param-setting-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
        }
        .param-setting-info {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          flex: 1;
        }
        .param-setting-icon { 
          margin-top: 2px; 
          color: var(--param-text-muted); 
          flex-shrink: 0;
        }
        .param-icon-warning { color: var(--param-warning); }
        .param-icon-success { color: var(--param-success); }
        
        .param-setting-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: var(--param-text);
          margin-bottom: 2px;
        }
        .param-setting-desc {
          display: block;
          font-size: 13px;
          color: var(--param-text-muted);
          line-height: 1.4;
        }

        .param-divider {
          height: 1px;
          background: var(--param-border);
          margin: 16px 0;
        }

        /* Custom Toggle Switch */
        .param-toggle {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
          flex-shrink: 0;
        }
        .param-toggle input { opacity: 0; width: 0; height: 0; }
        .param-toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: #cbd5e1;
          transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 24px;
        }
        .param-toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .param-toggle input:checked + .param-toggle-slider { background-color: var(--param-primary); }
        .param-toggle input:checked + .param-toggle-slider:before { transform: translateX(20px); }
        .param-toggle input:focus + .param-toggle-slider { box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2); }

        /* Select & Buttons */
        .param-select {
          padding: 8px 12px;
          border: 1px solid var(--param-border);
          border-radius: 8px;
          font-size: 14px;
          color: var(--param-text);
          background: white;
          cursor: pointer;
          outline: none;
          min-width: 140px;
        }
        .param-select:focus { border-color: var(--param-primary); }

        .param-btn-secondary {
          padding: 8px 16px;
          background: white;
          border: 1px solid var(--param-border);
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          color: var(--param-text);
          cursor: pointer;
          transition: all 0.2s;
        }
        .param-btn-secondary:hover { background: var(--param-bg-secondary); border-color: #cbd5e1; }

        /* Responsive */
        @media (max-width: 640px) {
          .param-container { padding: 16px; }
          .param-header { flex-direction: column; align-items: stretch; }
          .param-btn-save { width: 100%; justify-content: center; }
          .param-setting-row { flex-direction: column; align-items: flex-start; gap: 12px; }
          .param-setting-info { width: 100%; }
          .param-select, .param-btn-secondary { width: 100%; }
        }
      `}</style>
    </motion.div>
  );
};

// Composant Toggle réutilisable et élégant
const ToggleSwitch = ({ checked, onChange }) => (
  <label className="param-toggle">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span className="param-toggle-slider"></span>
  </label>
);

export default ParametresSection;