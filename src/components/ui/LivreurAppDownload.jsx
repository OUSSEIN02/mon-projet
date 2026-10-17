import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, LogOut } from 'lucide-react';
import '../css/LivreurAppDownload.css';
import livreurApp from '../../assets/livreur-app.png';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: 'spring', stiffness: 100, damping: 15 } 
  },
};

export default function LivreurAppDownload() {
  return (
    <div className="lad-page">
      {/* Lueur d'ambiance globale (éloignée de l'image pour ne pas nuire à la fusion) */}
      <div className="lad-bg-glow" />


      <main className="lad-main">
        <div className="lad-grid">
          
          {/* Illustration (Animation d'entrée unique, pas de boucle) */}
          <motion.div
            className="lad-illust-wrapper"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="lad-illust">
              <img
                src={livreurApp}
                alt="Application mobile Gabon Livraison Express"
              />
            </div>
          </motion.div>

          {/* Contenu */}
          <motion.section
            className="lad-content"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="lad-icon-badge" variants={itemVariants}>
              <Smartphone size={28} strokeWidth={2} />
            </motion.div>

            <motion.h1 variants={itemVariants}>
              Espace <span className="lad-text-gradient">Livreur</span>
            </motion.h1>

            <motion.h2 variants={itemVariants}>
              Disponible uniquement sur mobile
            </motion.h2>

            <motion.p className="lad-description" variants={itemVariants}>
              Pour recevoir vos courses, gérer vos livraisons et suivre votre activité en temps réel, utilisez notre application mobile dédiée.
            </motion.p>

            {/* Téléchargement */}
            <motion.div className="lad-download-area" variants={itemVariants}>
              <p className="lad-download-title">Téléchargez l'application</p>

              <div className="lad-store-buttons">
                {/* Google Play */}
                <a
                  href="https://play.google.com/store"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lad-store-btn"
                >
                  <svg className="lad-store-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                  <div className="lad-store-text">
                    <span>DISPONIBLE SUR</span>
                    <strong>Google Play</strong>
                  </div>
                </a>

                {/* App Store */}
                <a
                  href="https://www.apple.com/app-store/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lad-store-btn"
                >
                  <svg className="lad-store-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                  </svg>
                  <div className="lad-store-text">
                    <span>Télécharger dans</span>
                    <strong>l'App Store</strong>
                  </div>
                </a>
              </div>

              <p className="lad-availability">
                <span className="lad-dot"></span> Gratuit sur Android et iOS
              </p>
            </motion.div>
          </motion.section>
        </div>
      </main>
    </div>
  );
}