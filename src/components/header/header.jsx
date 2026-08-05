// components/Header.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.jpg';

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
  const navLinks = [
    { name: 'À propos', href: '/' },
    { name: 'Comment ça marche ?', href: '/' },
    { name: 'Devenir Vendeur', href: '/inscription-vendeur' },
    { name: 'Devenir Livreur', href: '/inscription-livreur' },
  ];

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container nav-wrap">
        {/* Logo */}
        <Link to="/" className="logo" onClick={closeMenu}>
          <img src={logo} alt="Youdégo" />
        </Link>

        {/* Navigation principale */}
        <nav className={`main-nav ${isMenuOpen ? 'open' : ''}`}>
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className={location.pathname === link.href ? 'active' : ''}
              onClick={closeMenu}
            >
              {link.name}
            </Link>
          ))}

          {/* Bouton Télécharger - UNIQUEMENT sur mobile */}
          {isMobile && (
            <Link
              to="#"
              className="btn btn-orange mobile-download-btn"
              onClick={closeMenu}
            >
              Télécharger
            </Link>
          )}
        </nav>

        {/* CTA Desktop - UNIQUEMENT sur desktop */}
        {!isMobile && (
          <div className="header-cta">
            <Link to="#" className="btn btn-orange">
              Télécharger
            </Link>
          </div>
        )}

        {/* Menu Burger */}
        <button 
          className="burger" 
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