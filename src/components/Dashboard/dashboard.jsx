import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.jpg";
import { Bell,  User, Settings, LogOut, ChevronDown } from 'lucide-react';
import avatar from '../../assets/default-avatar.jpg'; 
import { logout } from "../../utils/auth"; 
import apiClient from '../../services/apiClient'; 
import Sidebar from '../shared/Sidebar1';
import BottomNav from '../shared/BottomNav'; 
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
import UsersSection from '../sections/SectionsVendeur/UsersSection';
import OrderDetailsSection from '../sections/details/OrderDetailsSection';
import UserDetailSection from '../sections/details/UserDetailSection';
import './dashboard.css';
import VendeurDetailsSection from '../sections/details/VendeurDetailsSection';
import LivreurDetailsSection from '../sections/details/LivreurDetailsSection';
import AttributionsSection from '../sections/SectionsAdmin/AttributionsSection';
import CreateSellerSection from '../sections/SectionsAdmin/CreateSellerSection';
import CreateLivreurSection from '../sections/SectionsAdmin/CreateLivreurSection';
import AddZoneSection from '../sections/SectionsAdmin/AddZoneSection';
import LitigesSection from '../sections/SectionsAdmin/LitigesSection';
import StatistiquesSection from '../sections/SectionsAdmin/StatistiquesSection';
import RapportsSection from '../sections/SectionsAdmin/RapportsSection';
import ZonesTarifsSection from '../sections/SectionsAdmin/ZonesTarifsSection';
import PaiementsSection from '../sections/SectionsAdmin/PaiementsSection';
import VendeursSection from '../sections/SectionsAdmin/VendeursSection';
import LivreursSection from '../sections/SectionsAdmin/LivreursSection';
import UserCreateSection from '../sections/SectionsAdmin/UserCreateSection';
import RoleCreateSection from '../sections/SectionsAdmin/RoleCreateSection';
import AssignerLivreurPage from '../../components/sections/details/AssignerLivreurPage';

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigate = useNavigate();


  const logout = async () => {
    try {
      // 1. Invalider le token sur Laravel Sanctum
      await apiClient.post('/logout');
    } catch (error) {
      console.error('Erreur lors de la déconnexion backend:', error);
    } finally {
      // 2. Nettoyer le localStorage quoi qu'il arrive
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('seller');
      localStorage.removeItem('permissions');

      // 3. Rediriger vers la page de connexion
      navigate('/auth');
    }
  };


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
                <button onClick={() => navigate("/dashboard/profil")}>
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
            <Route path="create-seller" element={<CreateSellerSection />} />
            <Route path="vendeurs" element={<VendeursSection />} />
            <Route path="users-create" element={<UserCreateSection />} />
            <Route path="vendeurs/:vendeurId" element={<VendeurDetailsSection />} />
            <Route path="livreurs" element={<LivreursSection />} />
            <Route path="create-livreur" element={<CreateLivreurSection />} />
            <Route path="livreurs/:livreurId" element={<LivreurDetailsSection />} />
            <Route path="commandes" element={<CommandesSection />} />
            <Route path="historique" element={<HistoriqueSection />} />
            <Route path="factures" element={<FacturesSection />} />
            <Route path="integrations" element={<IntegrationsSection />} />
            <Route path="profil" element={<ProfilSection />} />
            <Route path="commandes" element={<CommandesSection />} />
            <Route path="commandes/:orderId" element={<OrderDetailsSection />} />
            <Route path="nouvelle-commande" element={<NouvelleCommandeSection />} />
            <Route path="suivi" element={<SuiviSection />} />
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
            <Route path="create-roles" element={<RoleCreateSection />} />
            <Route path="users-roles-permissions" element={<UsersSection />} />
            <Route path="users-roles-permissions/:userId" element={<UserDetailSection />} />
            <Route path="assigner-livreur/:orderId" element={<AssignerLivreurPage />} />
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

export default Dashboard;