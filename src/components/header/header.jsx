// components/Header.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.jpg';
import './header.css';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Détection du scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Détection de la taille d'écran
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fermeture du menu lors du changement de page
  useEffect(() => {
    closeMenu();
  }, [location]);

  // Navigation links
 // Navigation links
const navLinks = [
  { name: 'À propos', href: '/#apropos' },
  { name: 'Comment ça marche ?', href: '/#comment' },
  { name: 'Devenir Vendeur', href: '/inscription-vendeur' },
  { name: 'Devenir Livreur', href: '/inscription-livreur' },
];

  return (
    <header className={`yd-header ${isScrolled ? 'yd-header-scrolled' : ''}`}>
      <div className="yd-container yd-nav-wrap">
        {/* Logo */}
        <Link to="/" className="yd-logo" onClick={closeMenu}>
          <img src={logo} alt="Youdégo" />
        </Link>

        {/* Navigation principale */}
        <nav className={`yd-main-nav ${isMenuOpen ? 'yd-main-nav-open' : ''}`}>
          {navLinks.map((link) => (
            <Link
            key={link.name}
            to={link.href}
            className={
              location.pathname === link.href.split('#')[0] && 
              !link.href.includes('#') ? 'yd-nav-active' : ''
            }
            onClick={closeMenu}
          >
            {link.name}
          </Link>
          ))}

          {/* Boutons Mobile - UNIQUEMENT sur mobile */}
          {isMobile && (
            <div className="yd-mobile-actions">
              <Link
                to="/auth"
                className="yd-btn yd-btn-login"
                onClick={closeMenu}
              >
                Connexion
              </Link>
              <Link
                to="#"
                className="yd-btn yd-btn-orange yd-mobile-download-btn"
                onClick={closeMenu}
              >
                Télécharger
              </Link>
            </div>
          )}
        </nav>

        {/* CTA Desktop - UNIQUEMENT sur desktop */}
        {!isMobile && (
          <div className="yd-header-cta">
            <Link to="/auth" className="yd-btn yd-btn-login">
              Connexion
            </Link>
            <Link to="#" className="yd-btn yd-btn-orange">
              Télécharger
            </Link>
          </div>
        )}

        {/* Menu Burger */}
        <button 
          className="yd-burger" 
          onClick={toggleMenu} 
          aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          <i className={`fa-solid ${isMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
        </button>
      </div>
    </header>
  );
}

export default Header;