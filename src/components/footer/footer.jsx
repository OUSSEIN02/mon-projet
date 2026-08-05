// components/Footer.jsx
import React from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

// Configuration par défaut - vous pouvez la personnaliser selon vos besoins
const defaultConfig = {
  logoText: 'Gabon Livraison Express',
  description: 'La solution logistique qui connecte le Gabon, une livraison à la fois. Nous rapprochons les clients et les livreurs pour une expérience simple et fiable.',
  quickLinks: [
    { name: 'À Propos', href: '#apropos' },
    { name: 'Comment ça marche ?', href: '#comment' },
    { name: 'Avis Clients', href: '#avis' },
    { name: 'FAQs', href: '#faq' },
  ],
  policies: [
    { name: 'Politique de confidentialité', href: '/politique-confidentialite' },
    { name: "Conditions d'utilisation", href: '/conditions-utilisation' },
    { name: 'Suppression des données', href: '/suppression-donnees' },
    { name: 'Contrat livreur', href: '/contrat-livreur' },
  ],
  contacts: {
    address: 'Libreville, Gabon',
    phone: '+241 077 00 00 00',
    email: 'contact@gabonlivraison.ga',
  },
  copyright: 'Copyright © Gabon Livraison Express 2026 | Tout droit réservé',
  storeLinks: {
    googlePlay: '#',
    appStore: '#',
  },
  // Pour les liens internes (React Router)
  isInternalLinks: false,
};

function Footer({ 
  config = defaultConfig,
  onLinkClick = null,
  className = '',
}) {
  const handleLinkClick = (e, href) => {
    if (onLinkClick) {
      onLinkClick(href);
    }
  };

  // Rendu d'un lien (interne ou externe)
  const renderLink = (name, href, onClick = null) => {
    const linkProps = {
      className: 'footer-link',
      onClick: (e) => {
        if (onClick) onClick(e, href);
        if (onLinkClick) onLinkClick(href);
      },
    };

    // Si c'est un lien interne (commence par #) ou si isInternalLinks est true
    if (href.startsWith('#') || config.isInternalLinks) {
      return (
        <a href={href} {...linkProps}>
          {name}
        </a>
      );
    }

    // Sinon, lien React Router
    return (
      <Link to={href} {...linkProps}>
        {name}
      </Link>
    );
  };

  return (
    <footer id="contact" className={`main-footer ${className}`}>
      <div className="footer-container">
        <div className="footer-grid">
          
          {/* Colonne 1 : Logo & Description */}
          <div className="footer-col footer-brand">
            <h2 className="footer-logo-text">{config.logoText}</h2>
            <p className="footer-description">{config.description}</p>
          </div>

          {/* Colonne 2 : Liens Rapides */}
          <div className="footer-col">
            <h4 className="footer-title">Liens Rapides</h4>
            <ul className="footer-links">
              {config.quickLinks.map((link) => (
                <li key={link.name}>
                  {renderLink(link.name, link.href)}
                </li>
              ))}
            </ul>
          </div>

          {/* Colonne 3 : Politiques */}
          <div className="footer-col">
            <h4 className="footer-title">Politiques</h4>
            <ul className="footer-links">
              {config.policies.map((link) => (
                <li key={link.name}>
                  {renderLink(link.name, link.href)}
                </li>
              ))}
            </ul>
          </div>

          {/* Colonne 4 : Contacts */}
          <div className="footer-col">
            <h4 className="footer-title">Contacts</h4>
            <ul className="footer-contact-list">
              <li>
                <MapPin size={18} />
                <span>{config.contacts.address}</span>
              </li>
              <li>
                <Phone size={18} />
                <span>{config.contacts.phone}</span>
              </li>
              <li>
                <Mail size={18} />
                <span>{config.contacts.email}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Badges Stores */}
        <div className="footer-stores">
          <a 
            href={config.storeLinks.googlePlay} 
            className="store-badge" 
            aria-label="Télécharger sur Google Play"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
            </svg>
            <div className="store-text">
              <span className="store-small">TÉLÉCHARGER SUR</span>
              <span className="store-big">Google Play</span>
            </div>
          </a>

          <a 
            href={config.storeLinks.appStore} 
            className="store-badge" 
            aria-label="Télécharger sur App Store"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <div className="store-text">
              <span className="store-small">TÉLÉCHARGER SUR</span>
              <span className="store-big">App Store</span>
            </div>
          </a>
        </div>

        {/* Ligne de séparation & Copyright */}
        <div className="footer-bottom-bar">
          <p className="footer-copyright">{config.copyright}</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;