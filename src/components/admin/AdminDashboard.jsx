import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Bell, User, Settings, LogOut } from 'lucide-react'; // <-- Ajout des icônes manquantes
import Sidebar from '../shared/Sidebar';
import logo from "../../assets/logo.jpg";
import VendeursSection from '../sections/SectionsAdmin/VendeursSection';
import LivreursSection from '../sections/SectionsAdmin/LivreursSection';
import ClientsSection from '../sections/SectionsAdmin/ClientsSection';
import CommandesSection from '../sections/SectionsAdmin/CommandesSection';
import LitigesSection from '../sections/SectionsAdmin/LitigesSection';  
import StatistiquesSection from '../sections/SectionsAdmin/StatistiquesSection';
import RapportsSection from '../sections/SectionsAdmin/RapportsSection';
import ZonesTarifsSection from '../sections/SectionsAdmin/ZonesTarifsSection';
import ParametresSection from '../sections/SectionsAdmin/ParametresSection';
import AideSupportSection from '../sections/SectionsAdmin/AideSupportSection';
import PaiementsSection from '../sections/SectionsAdmin/PaiementsSection';
import BottomNav from '../shared/BottomAdminNav';
import avatar from '../../assets/default-avatar.jpg'; // 
import OrderDetailsSection from '../sections/details/OrderDetailsSection';
import DashboardOverview from '../sections/SectionsAdmin/DashboardOverview';
import './AdminDashboard.css';
import VendeurDetailsSection from '../sections/details/VendeurDetailsSection';
import LivreurDetailsSection from '../sections/details/LivreurDetailsSection';
import AttributionsSection from '../sections/SectionsAdmin/AttributionsSection';
import CreateSellerSection from '../sections/SectionsAdmin/CreateSellerSection';
import CreateLivreurSection from '../sections/SectionsAdmin/CreateLivreurSection';
import AddZoneSection from '../sections/SectionsAdmin/AddZoneSection';
const AdminDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 860) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const logout = () => {
    console.log('Déconnexion');
    // Ajoutez votre logique de déconnexion ici
  };

  return (
    <div className="admin-dashboard">
      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
      
      <div className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar1">
          <div className="topbar-left1">
            <img src={logo} alt="Logo" className="topbar-logo1" />
          </div>

          <div className="topbar-right1">
            <div className="avatar-wrapper1">
              <img
                src={avatar}
                alt="Avatar"
                className="topbar-avatar1"
                onClick={() => setShowMenu(!showMenu)}
              />

              {showMenu && (
                <div className="avatar-menu1">
                  <button>
                    <User size={16} />
                    Mon profil
                  </button>
                  <button>
                    <Settings size={16} />
                    Paramètres
                  </button>
               
                  <button className="logout" onClick={logout}>
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
            <Route path="create-seller" element={<CreateSellerSection />} />
            <Route path="vendeurs" element={<VendeursSection />} />
            <Route path="detailVendeurs/:orderId" element={<VendeurDetailsSection />} />
            <Route path="livreurs" element={<LivreursSection />} />
            <Route path="create-livreur" element={<CreateLivreurSection />} />
            <Route path="detailLivreurs/:orderId" element={<LivreurDetailsSection />} />
            <Route path="clients" element={<ClientsSection />} />
            <Route path="commandes" element={<CommandesSection />} />
            {/* <-- Route pour les détails d'une commande --> */}
            <Route path="attributions" element={<AttributionsSection />}></Route>
            <Route path="retenu/:orderId" element={<OrderDetailsSection />} />
            <Route path="litiges" element={<LitigesSection />} />
            <Route path="statistiques" element={<StatistiquesSection />} />
            <Route path="rapports" element={<RapportsSection />} />
            <Route path="zones" element={<ZonesTarifsSection />} />
            <Route path="add-zone" element={<AddZoneSection />} />
            <Route path="parametres" element={<ParametresSection />} />
            <Route path="help" element={<AideSupportSection />} />
            <Route path="finances" element={<PaiementsSection />} />
          </Routes>
        </div>

        <footer className="admin-footer">
          <span>© 2025 Gabon Livraison Express. Tous droits réservés.</span>
          <span>Besoin d'aide ? <a href="#">Contactez le support</a></span>
        </footer>
      </div>
      
      <BottomNav onOpenMenu={() => setIsSidebarOpen(true)} />
    </div>
  );
};

export default AdminDashboard;