import React from 'react';
import { motion } from 'framer-motion';
import '../components/css/Loader.css'; // Assurez-vous que le chemin est correct

const Loader = ({ 
  text = "Chargement en cours...", 
  fullScreen = false, 
  size = "md" // 'sm', 'md', ou 'lg'
}) => {
  
  // Configuration des tailles
  const sizeConfig = {
    sm: { ring: 32, stroke: 3, dot: 6 },
    md: { ring: 48, stroke: 4, dot: 8 },
    lg: { ring: 64, stroke: 5, dot: 10 }
  };

  const { ring, stroke, dot } = sizeConfig[size];

  return (
    <div className={`od-loader-wrapper ${fullScreen ? 'od-loader-fullscreen' : 'od-loader-inline'}`}>
      
      {/* Conteneur du spinner */}
      <div className={`od-loader-size-${size}`} style={{ position: 'relative', width: ring, height: ring }}>
        
        {/* Anneau extérieur en rotation */}
        <motion.svg
          width={ring}
          height={ring}
          viewBox={`0 0 ${ring} ${ring}`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        >
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={(ring / 2) - (stroke / 2)}
            fill="none"
            stroke="#e2e8f0" /* Gris très clair pour la piste */
            strokeWidth={stroke}
          />
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={(ring / 2) - (stroke / 2)}
            fill="none"
            stroke="url(#gradient)" /* Dégradé moderne pour l'anneau actif */
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${ring * 1.5} ${ring * 2}`} /* Crée l'effet de tronçon */
          />
          
          {/* Définition du dégradé (Orange -> Bleu pour matcher votre thème) */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" /> {/* Orange */}
              <stop offset="100%" stopColor="#2563eb" /> {/* Bleu */}
            </linearGradient>
          </defs>
        </motion.svg>

        {/* Point central pulsant */}
        <motion.div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: dot,
            height: dot,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f97316, #2563eb)',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.6, 1, 0.6] 
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
      </div>

      {/* Texte avec effet de fondu enchaîné (fade in/out) */}
      {text && (
        <motion.p 
          className="od-loader-text"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

export default Loader;