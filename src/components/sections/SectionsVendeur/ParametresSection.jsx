import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Moon, Globe, Shield } from 'lucide-react';

const ParametresSection = () => {
  const [settings, setSettings] = useState({
    emailNotif: true,
    smsNotif: false,
    darkMode: false,
    twoFactor: false
  });

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="section-container">
      <div className="section-header2">
        <div>
          <h2>Paramètres</h2>
          <p className="section-subtitle2">Personnalisez votre expérience et votre sécurité.</p>
        </div>
      </div>

      <div className="settings-list">
        <div className="setting-item">
          <div className="setting-info">
            <Bell size={20} className="text-primary" />
            <div>
              <h4>Notifications par email</h4>
              <p className="text-muted">Recevoir un email à chaque changement de statut de commande.</p>
            </div>
          </div>
          <label className="switch">
            <input type="checkbox" checked={settings.emailNotif} onChange={() => toggleSetting('emailNotif')} />
            <span className="slider round"></span>
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <Globe size={20} className="text-primary" />
            <div>
              <h4>Langue de l'interface</h4>
              <p className="text-muted">Choisissez la langue d'affichage du tableau de bord.</p>
            </div>
          </div>
          <select className="filter-select">
            <option>Français</option>
            <option>English</option>
          </select>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <Shield size={20} className="text-primary" />
            <div>
              <h4>Authentification à deux facteurs (2FA)</h4>
              <p className="text-muted">Sécurisez votre compte avec un code SMS à chaque connexion.</p>
            </div>
          </div>
          <label className="switch">
            <input type="checkbox" checked={settings.twoFactor} onChange={() => toggleSetting('twoFactor')} />
            <span className="slider round"></span>
          </label>
        </div>
      </div>
    </motion.div>
  );
};

export default ParametresSection;