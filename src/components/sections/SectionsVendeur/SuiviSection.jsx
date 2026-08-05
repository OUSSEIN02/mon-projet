import React from 'react';
import { motion } from 'framer-motion';
import { MapPinned, Navigation, Phone, CheckCircle, Circle } from 'lucide-react';

const SuiviSection = () => {
  const activeDeliveries = [
    { id: '#CMD-1258', client: 'Jean Moussavou', livreur: 'Michel N.', phone: '+241 077 00 00 00', status: 'en_transit', progress: 65 },
    { id: '#CMD-1260', client: 'Sophie N.', livreur: 'En attente d\'attribution', phone: '', status: 'en_attente', progress: 20 },
  ];

  const getStatusText = (status) => {
    if (status === 'en_transit') return 'En cours de livraison';
    if (status === 'en_attente') return 'En attente de livreur';
    return 'Inconnu';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="section-container">
      <div className="section-header2">
        <div>
          <h2>Suivi en temps réel</h2>
          <p className="section-subtitle2">Localisez vos livraisons en cours.</p>
        </div>
      </div>

      <div className="tracking-layout">
        {/* Liste des livraisons actives */}
        <div className="tracking-list">
          {activeDeliveries.map((delivery, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="tracking-card">
              <div className="tracking-header">
                <span className="tracking-id">{delivery.id}</span>
                <span className={`tracking-status ${delivery.status}`}>{getStatusText(delivery.status)}</span>
              </div>
              <div className="tracking-info">
                <p><strong>Client :</strong> {delivery.client}</p>
                <p><strong>Livreur :</strong> {delivery.livreur}</p>
                {delivery.phone && <p><Phone size={14} className="inline-icon" /> {delivery.phone}</p>}
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${delivery.progress}%` }}></div>
              </div>
              <div className="tracking-steps">
                <div className="step completed"><CheckCircle size={14} /> Commande reçue</div>
                <div className={`step ${delivery.progress >= 50 ? 'completed' : ''}`}>{delivery.progress >= 50 ? <CheckCircle size={14} /> : <Circle size={14} />} En transit</div>
                <div className={`step ${delivery.progress === 100 ? 'completed' : ''}`}>{delivery.progress === 100 ? <CheckCircle size={14} /> : <Circle size={14} />} Livré</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Zone de carte (Placeholder) */}
        <div className="tracking-map">
          <div className="map-placeholder">
            <MapPinned size={48} className="text-muted" />
            <p>Carte interactive en temps réel</p>
            <span className="text-muted">(Intégration Google Maps / Mapbox à venir)</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SuiviSection;