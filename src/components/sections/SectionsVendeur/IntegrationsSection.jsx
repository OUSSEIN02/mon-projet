import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plug, Key, Copy, Check, Globe } from 'lucide-react';

const IntegrationsSection = () => {
  const [copied, setCopied] = useState(false);
  const apiKey = "sk_live_51Mz9x2K...8aB3cD";

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="section-container">
      <div className="section-header2">
        <div>
          <h2>API & Intégrations</h2>
          <p className="section-subtitle2">Connectez votre boutique à notre système de livraison.</p>
        </div>
      </div>

      <div className="integrations-grid">
        <div className="integration-card">
          <div className="card-header">
            <Key size={24} className="text-primary" />
            <h3>Clé API</h3>
          </div>
          <p className="text-muted mb-4">Utilisez cette clé pour authentifier vos requêtes vers notre API.</p>
          <div className="api-key-box">
            <code>{apiKey}</code>
            <button className="btn-icon" onClick={handleCopy} title="Copier">
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        <div className="integration-card">
          <div className="card-header">
            <Globe size={24} className="text-primary" />
            <h3>Webhooks</h3>
          </div>
          <p className="text-muted mb-4">Recevez des notifications en temps réel sur les changements de statut.</p>
          <div className="form-group">
            <label>URL de rappel (Webhook)</label>
            <input type="url" placeholder="https://votre-site.com/api/webhook" className="w-full" />
          </div>
          <button className="btn-primary mt-2">Sauvegarder le Webhook</button>
        </div>
      </div>
    </motion.div>
  );
};

export default IntegrationsSection;