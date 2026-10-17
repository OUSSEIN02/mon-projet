import React, { useState, useEffect, useRef } from 'react';
import { Link } from "react-router-dom";
import Testimonials from "./shared/Testimonials";
import FAQSection from "./shared/FAQSection";
import Footer from "./footer/footer";
import logo from "../assets/logo-leger.png";
import step1 from "../assets/step1.png";
import step2 from "../assets/step2.jfif";
import step3 from "../assets/step3.png";
import logo_watermark from "../assets/logo_watermark_white.png";
import cta from "../assets/cta-delivery-removebg-preview.png";
import Header from './header/header';

import {
  Package,
  MapPinned,
  ShieldCheck,
  MapPin, Phone, Mail, MessageCircle
} from "lucide-react";

import '../App.css';
import img from '../assets/livreur.png';
import avatar1 from '../assets/avatar-1.jpg';
import avatar2 from '../assets/avatar-2.jpg';
import avatar3 from '../assets/avatar-3.jpg';

function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Scroll detection for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for reveal animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="App">
     <Header/>

      <main>
        {/* HERO */}
        <section className="hero" id="accueil">
          <div className="container hero-inner">
            <div className="hero-copy">
              <h1 className="hero-title">
              LA LIVRAISON RAPIDE 
                <span className="accent">ET FIABLE AU COEUR DU GABON</span>
              </h1>
              <p className="hero-sub">
                La plateforme qui connecte vendeurs, livreurs et clients pour des livraisons fiables, rapides et traçables partout au Gabon.
              </p>
              <div className="hero-cta">
                <a
                  href="https://play.google.com/store"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="store-btn playstore"
                >
                  <i className="fa-brands fa-google-play"></i>
                  <div>
                    <span>Télécharger sur</span>
                    <strong>Google Play</strong>
                  </div>
                </a>

                <a
                  href="https://www.apple.com/app-store/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="store-btn appstore"
                >
                  <i className="fa-brands fa-apple"></i>
                  <div>
                    <span>Télécharger sur</span>
                    <strong>App Store</strong>
                  </div>
                </a>
              </div>
              <div className="trust">
                <div className="avatar-stack">
                  <img src={avatar1} alt="Utilisateur 1" />
                  <img src={avatar2} alt="Utilisateur 2" />
                  <img src={avatar3} alt="Utilisateur 3" />
                </div>

                <p>
                  Rejoignez des centaines d'utilisateurs qui nous font déjà confiance !
                </p>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-circle"></div>
              <div className="speed-lines left">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="speed-lines right">
                <span></span>
                <span></span>
                <span></span>
              </div>
              {/* Vous pouvez ajouter une image ici */}
               <img src={img} alt="Illustration" className="hero-img" /> 
            </div>
          </div>
        </section>

        {/* FEATURE STRIP */}
        <div className="container">
        <div className="feature-strip reveal">
          <div className="feat">
            <i className="fa-solid fa-handshake"></i>
            <h4>Mise en relation intelligente</h4>
            <p>Connectez vendeurs en ligne à une centaine de livreurs en quelques clics.</p>
          </div>
          <div className="feat">
            <i className="fa-solid fa-location-crosshairs"></i>
            <h4>Géolocalisation temps réel</h4>
            <p>Suivez chaque livraison en direct, du vendeur jusqu'au client final.</p>
          </div>
          <div className="feat">
            <i className="fa-solid fa-robot"></i>
            <h4>Matching automatique</h4>
            <p>Attribution intelligente des livraisons selon la disponibilité et la proximité du livreur.</p>
          </div>
          <div className="feat">
            <i className="fa-solid fa-credit-card"></i>
            <h4>Paiements sécurisés</h4>
            <p>Transactions fiables pour vendeurs, livreurs et clients finaux.</p>
          </div>
          <div className="feat">
            <i className="fa-solid fa-star"></i>
            <h4>Confiance & notation</h4>
            <p>Système de notation et vérification des utilisateurs pour un service fiable.</p>
          </div>
          <div className="feat">
            <i className="fa-solid fa-chart-line"></i>
            <h4>Pilotage complet</h4>
            <p>Tableaux de bord, historique et statistiques pour gérer votre activité.</p>
          </div>
        </div>
      </div>

        {/* ABOUT SECTION */}
        <section className="about-section" id="apropos">
          <div className="container">
            <div className="section-header reveal">
              
              <h2>
                Bien plus qu'une simple livraison,
                <span> une plateforme de confiance.</span>
              </h2>
              <p>
                Gabon Livraison Express met en relation vendeurs, livreurs et clients
                afin d'offrir des livraisons rapides, sécurisées et suivies en temps réel
                partout au Gabon.
              </p>
            </div>

            <div className="about-grid">
              <div className="about-card reveal" style={{ transitionDelay: '0.1s' }}>
                <div className="card-icon">
                  <Package size={30} />
                </div>
                <h3>Livraison rapide</h3>
                <p>
                  Colis, repas, courses ou documents sont récupérés et livrés
                  rapidement par des livreurs professionnels.
                </p>
              </div>

              <div className="about-card reveal" style={{ transitionDelay: '0.2s' }}>
                <div className="card-icon">
                  <MapPinned size={30} />
                </div>
                <h3>Suivi en temps réel</h3>
                <p>
                  Suivez votre livraison sur la carte du départ jusqu'à la remise
                  au destinataire.
                </p>
              </div>

              <div className="about-card reveal" style={{ transitionDelay: '0.3s' }}>
                <div className="card-icon">
                  <ShieldCheck size={30} />
                </div>
                <h3>Sécurité garantie</h3>
                <p>
                  Paiements sécurisés, livreurs vérifiés et assistance disponible
                  pour garantir une expérience fiable.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="how-it-works" id="comment">
          <div className="container">
            <div className="section-heading reveal">
              <h2>Comment ça marche ?</h2>
            </div>

            <div className="steps-container">
              <div className="step-card reveal" style={{ transitionDelay: '0.1s' }}>
                <div className="step-header">
                  <div className="step-num">1</div>
                  <h3>Inscription</h3>
                </div>
                <p>Vendeur ou livreur, créez votre compte en quelques clics.</p>
                <div className="step-image">
                  <img src={step1} alt="Inscription" />
                </div>
              </div>

              <div className="step-arrow">
                <i className="fa-solid fa-arrow-right"></i>
              </div>

              <div className="step-card reveal" style={{ transitionDelay: '0.2s' }}>
                <div className="step-header">
                  <div className="step-num">2</div>
                  <h3>Création de la commande</h3>
                </div>
                <p>Le vendeur crée la commande, puis la plateforme propose les livreurs disponibles à proximité.</p>
                <div className="step-image">
                  <img src={step2} alt="Création de la livraison" />
                </div>
              </div>

              <div className="step-arrow">
                <i className="fa-solid fa-arrow-right"></i>
              </div>

              <div className="step-card reveal" style={{ transitionDelay: '0.3s' }}>
                <div className="step-header">
                  <div className="step-num">3</div>
                  <h3>Matching intelligent</h3>
                </div>
                <p>Notre algorithme attribue automatiquement la livraison au livreur le plus proche et disponible.</p>
                <div className="step-image">
                  <img src={step3} alt="Attribution" />
                </div>
              </div>

              <div className="step-arrow">
                <i className="fa-solid fa-arrow-right"></i>
              </div>

              <div className="step-card reveal" style={{ transitionDelay: '0.4s' }}>
                <div className="step-header">
                  <div className="step-num">4</div>
                  <h3>Livraison & suivi</h3>
                </div>
                <p>Le livreur accepte et fait la livraison avec un suivi en temps réel avec tous les acteurs.</p>
                <div className="step-image">
                  <img src={step1} alt="Suivi" />
                </div>
              </div>
            </div>
          </div>
        </section>


        <Testimonials />

        

        {/* POUR QUI */}
        <section className="for-whom" id="fonctionnalites">
          <div className="container">
            <div className="section-heading reveal">
              <h2>POUR QUI ?</h2>
            </div>

            <div className="whom-grid">
              <div className="whom-card reveal" style={{ transitionDelay: '0.1s' }}>
                <div className="whom-icon">
                  <i className="fa-solid fa-store"></i>
                </div>
                <div className="whom-content">
                  <h3>Pour les vendeurs</h3>
                  <p>Gérez vos commandes, trouvez des livreurs fiables et développez votre activité en toute simplicité.</p>
                  <a className="link" href="#">En savoir plus <i className="fa-solid fa-arrow-right"></i></a>
                </div>
              </div>

              <div className="whom-card reveal" style={{ transitionDelay: '0.2s' }}>
                <div className="whom-icon">
                  <i className="fa-solid fa-motorcycle"></i>
                </div>
                <div className="whom-content">
                  <h3>Pour les livreurs</h3>
                  <p>Recevez des courses, gérez vos livraisons et augmentez vos revenus avec plus de flexibilité.</p>
                  <a className="link" href="#">En savoir plus <i className="fa-solid fa-arrow-right"></i></a>
                </div>
              </div>

              <div className="whom-card reveal" style={{ transitionDelay: '0.3s' }}>
                <div className="whom-icon">
                  <i className="fa-solid fa-user"></i>
                </div>
                <div className="whom-content">
                  <h3>Pour les clients</h3>
                  <p>Passez commande facilement, suivez votre livraison et profitez d'un service rapide et sécurisé.</p>
                  <a className="link" href="#">En savoir plus <i className="fa-solid fa-arrow-right"></i></a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <div className="container cta-banner-wrap">
          <div className="cta-banner reveal-scale">
            <div className="bg-mark-container">
              <img src={logo_watermark} alt="Filigrane" className="bg-mark" />
            </div>

            <div className="cta-inner">
              <div className="cta-illustration">
                <img src={cta} alt="Application de livraison" className="cta-image" />
              </div>

              <div className="cta-text">
                <h2>Gagnez du temps, livrez l'essentiel.</h2>
                <p className="subtitle">Rejoignez la plateforme de livraison n°1 au Gabon.</p>

                <div className="store-badges">
                  <a href="#" className="store-badge">
                    <svg className="badge-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3,5.27V18.73L16.55,12L3,5.27M17.87,11.33L20.25,12.5C20.73,12.74 20.73,13.26 20.25,13.5L17.87,14.67L15.42,12.5L17.87,11.33M3,3.41C3.25,3.41 3.5,3.5 3.75,3.62L16.55,10L14,12.5L3,3.41M3,20.59L14,11.5L16.55,14L3.75,20.38C3.5,20.5 3.25,20.59 3,20.59Z" />
                    </svg>
                    <div className="lines">
                      <span className="sub">Disponible sur</span>
                      <span className="main">Google Play</span>
                    </div>
                  </a>

                  <a href="#" className="store-badge">
                    <svg className="badge-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.1,16.67C20.08,16.74 19.67,18.11 18.71,19.5M15.97,4.17C16.63,3.37 17.07,2.28 16.95,1C16,1.04 14.9,1.6 14.24,2.38C13.68,3.04 13.19,4.14 13.34,5.39C14.39,5.47 15.4,4.88 15.97,4.17Z" />
                    </svg>
                    <div className="lines">
                      <span className="sub">Télécharger dans</span>
                      <span className="main">l'App Store</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <FAQSection />

      <Footer />
    </div>
  );
}

export default HomePage;