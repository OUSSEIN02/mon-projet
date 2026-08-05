





import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.jpg";
import { Bell,  User, Settings, LogOut, ChevronDown } from 'lucide-react';
import avatar from '../../assets/default-avatar.jpg'; // <-- Assurez-vous que le chemin est correct
import { logout } from "../../utils/auth"; 
import Sidebar from '../shared/Sidebar1'; // Assurez-vous que le chemin est bon
import BottomNav from '../shared/BottomNav'; // <-- Nouveau composant importé
import CommandesSection from '../sections/SectionsVendeur/CommandesSection';
import NouvelleCommandeSection from '../sections/SectionsVendeur/NouvelleCommandeSection';
import SuiviSection from '../sections/SectionsVendeur/SuiviSection';
import HistoriqueSection from '../sections/SectionsVendeur/HistoriqueSection';
import FacturesSection from '../sections/SectionsVendeur/FacturesSection';
import IntegrationsSection from '../sections/SectionsVendeur/IntegrationsSection';
import ProfilSection from '../sections/SectionsVendeur/ProfilSection';
import ParametresSection from '../sections/SectionsVendeur/ParametresSection';
import AideSupportSection from '../sections/SectionsVendeur/AideSupportSection';
import DashboardOverview from '../sections/SectionsVendeur/DashboardOverview';
import OrderDetailsSection from '../sections/details/OrderDetailsSection';
import './DashboardVendeur.css';

const DashboardVendeur = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      // Sur grand écran, on peut choisir de garder la sidebar fermée ou ouverte. 
      // Ici, on la ferme pour laisser la place au contenu, la bottom nav restant accessible.
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigate = useNavigate();
  return (
    <div className="admin-dashboard">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="admin-main">
        {/* Topbar (Burger supprimé ici) */}
        <header className="admin-topbar2">
          <div className="topbar-left2">
            <img src={logo} alt="Logo" className="topbar-logo2" />
          </div>

          <div className="topbar-right2">
            <div className="avatar-wrapper2">
              <img
                src={avatar}
                alt="Avatar"
                className="topbar-avatar2"
                onClick={() => setShowMenu(!showMenu)}
              />

              {showMenu && (
                <div className="avatar-menu2">
                <button onClick={() => navigate("/vendeurs/profil")}>
                  <User size={16} />
                  Mon profil
                </button>


                  <button>
                    <Settings size={16} />
                    Paramètres
                  </button>

               

                


                <button 
                  className="logout"
                  onClick={logout}
                >
                  <LogOut size={16} />
                  Déconnexion
                </button>
                                </div>
              )}
            </div>
          </div>
        </header>

        <div className="admin-content">
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="historique" element={<HistoriqueSection />} />
            <Route path="factures" element={<FacturesSection />} />
            <Route path="integrations" element={<IntegrationsSection />} />
            <Route path="profil" element={<ProfilSection />} />
            <Route path="commandes" element={<CommandesSection />} />
            <Route path="detailsCommande/:orderId" element={<OrderDetailsSection />} />
            <Route path="nouvelle-commande" element={<NouvelleCommandeSection />} />
            <Route path="suivi" element={<SuiviSection />} />
            <Route path="parametres" element={<ParametresSection />} />
            <Route path="help" element={<AideSupportSection />} />
          </Routes>
        </div>

        <footer className="admin-footer">
          <span>© 2025 Gabon Livraison Express. Tous droits réservés.</span>
          <span>Besoin d'aide ? <a href="#">Contactez le support</a></span>
        </footer>
      </div>

      {/* <-- Bottom Navigation Bar ajoutée ici, en dehors de admin-main pour être fixed --> */}
      <BottomNav onOpenMenu={() => setIsSidebarOpen(true)} />
    </div>
  );
};

export default DashboardVendeur;