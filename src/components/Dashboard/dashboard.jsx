import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import logo from "../../assets/logo.jpg";
import { Bell, User, Settings, LogOut, X, AlertTriangle, CheckCircle, XCircle, Info, Package } from 'lucide-react';
import avatar from '../../assets/default-avatar.jpg'; 
import apiClient from '../../services/apiClient'; 
import PourcentagesSection from '../sections/SectionsAdmin/PourcentagesSection';

// Hooks
import { useFailedOrdersPolling } from '../../hooks/useFailedOrdersPolling';
import { useLitigesCount } from '../../hooks/useLitigesCount';

// Composants partagés
import Sidebar from '../shared/Sidebar1';
import BottomNav from '../shared/BottomNav'; 

// Sections Vendeur
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
import SellerEarningsSection from '../sections/SectionsVendeur/SellerEarningsSection';

// Sections Admin
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
import MessagesSection from '../sections/SectionsAdmin/MessagesSection';

// Pages de détails
import OrderDetailsSection from '../sections/details/OrderDetailsSection';
import OrderDetailSection from '../sections/details/OrderDetailSection';
import UserDetailSection from '../sections/details/UserDetailSection';
import VendeurDetailsSection from '../sections/details/VendeurDetailsSection';
import LivreurDetailsSection from '../sections/details/LivreurDetailsSection';
import LivreurDetails from '../sections/details/LivreurDetails';
import VendeurDetails from '../sections/details/VendeurDetails';
import AssignerLivreurPage from '../../components/sections/details/AssignerLivreurPage';
import OrderSearchingScreen from '../sections/details/OrderSearchingScreen';
import OrderTrackingScreen from '../sections/details/OrderTrackingScreen';
import LitigeDetailSection from '../sections/details/LitigeDetailsSection';

import './dashboard.css';

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const userRole = localStorage.getItem('role');
  const isAdmin = userRole === 'admin';
  
  const { failedOrdersCount } = useFailedOrdersPolling(isAdmin);
  const litigesCount = useLitigesCount(isAdmin); 

  // 🔄 ÉTAT DES NOTIFICATIONS (Comme sur mobile)
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
  const [notifError, setNotifError] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 🔄 CHARGEMENT DES NOTIFICATIONS DEPUIS L'API
  const fetchNotifications = async () => {
    setIsLoadingNotifs(true);
    setNotifError(null);
    try {
      const response = await apiClient.get('/notifications');
      const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      
      const formattedNotifs = data.map(item => {
        const dataPayload = item.data || {};
        let type = (dataPayload.type || 'info').toLowerCase();
        
        // Adaptation des types comme sur Flutter
        const className = item.type || '';
        if (type === 'info') {
          if (className.includes('LitigeReported')) type = 'litige_reported';
          else if (className.includes('OrderDelivered')) type = 'order_delivered';
        }

        return {
          id: item.id.toString(),
          title: dataPayload.title || 'Nouvelle notification',
          message: dataPayload.message || '',
          type: type,
          isRead: item.read_at !== null,
          createdAt: item.created_at,
          orderId: dataPayload.order_id ? parseInt(dataPayload.order_id) : null,
          litigeId: dataPayload.litige_id ? parseInt(dataPayload.litige_id) : null,
          actionUrl: dataPayload.action_url,
        };
      });
      
      setNotifications(formattedNotifs);
    } catch (err) {
      console.error("Erreur chargement notifications:", err);
      setNotifError('Impossible de charger les notifications.');
    } finally {
      setIsLoadingNotifs(false);
    }
  };

  useEffect(() => {
    if (isNotifOpen) fetchNotifications();
  }, [isNotifOpen]);

  const getUserInfo = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return {
          name: user.name || 'Utilisateur',
          email: user.email || 'Non défini',
          avatar: user.avatar || avatar
        };
      }
    } catch (error) {
      console.error("Erreur lecture user:", error);
    }
    return { name: 'Utilisateur', email: 'Non défini', avatar: avatar };
  };

  const currentUser = getUserInfo();
  
  const handleLogout = async () => {
    try {
      await apiClient.post('/logout');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('seller');
      localStorage.removeItem('permissions');
      navigate('/auth');
    }
  };

  // 🔄 MARQUER COMME LU
  const markAsRead = async (id) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) { console.error('Erreur mark as read:', e); }
  };

  // 🔄 TOUT MARQUER COMME LU
  const markAllAsRead = async () => {
    try {
      await apiClient.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      // Toast de confirmation pourrait être ajouté ici
    } catch (e) { console.error('Erreur mark all as read:', e); }
  };

  // 🔄 LOGIQUE DE GROUPEMENT PAR DATE (Identique Flutter)
  const getDateCategory = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const notifDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((today - notifDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return "Cette semaine";
    if (diffDays < 30) return "Ce mois-ci";
    return "Plus ancien";
  };

  const getGroupedNotifications = () => {
    const sorted = [...notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const groups = {};
    const order = [];

    sorted.forEach(item => {
      const category = getDateCategory(item.createdAt);
      if (!groups[category]) {
        groups[category] = [];
        order.push(category);
      }
      groups[category].push(item);
    });

    return order.map(title => ({ title, items: groups[title] }));
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const getNotifIcon = (type) => {
    if (type === 'success' || type === 'order_delivered') return CheckCircle;
    if (type === 'warning' || type === 'litige_reported') return AlertTriangle;
    if (type === 'error') return XCircle;
    return Info;
  };

  const handleNotifClick = async (notif) => {
    if (!notif.isRead) await markAsRead(notif.id);
    
    if (notif.type === 'litige_reported' && notif.litigeId) {
      navigate(`/dashboard/litiges/${notif.litigeId}`);
      setIsNotifOpen(false);
    } else if (notif.orderId) {
      navigate(`/dashboard/commande/${notif.orderId}`);
      setIsNotifOpen(false);
    } else if (notif.actionUrl) {
      navigate(notif.actionUrl);
      setIsNotifOpen(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  return (
    <div className="admin-dashboard">
      <Toaster position="top-right" toastOptions={{ duration: 6000, style: { borderRadius: '12px', padding: '14px 20px' } }} />

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} litigesCount={litigesCount} />
      
      <div className="admin-main">
        <header className="admin-topbar2">
          <div className="topbar-left2">
            <img src={logo} alt="Logo" className="topbar-logo2" />
          </div>

          <div className="topbar-right2">
            <button
              className="notif-trigger-btn"
              onClick={() => setIsNotifOpen(true)}
              title="Voir les notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </button>

            <div className="avatar-wrapper2" ref={menuRef}>
              <img src={currentUser.avatar} alt="Avatar" className="topbar-avatar2" onClick={() => setShowMenu(!showMenu)} />
              {showMenu && (
                <div className="avatar-dropdown-menu">
                  <div className="avatar-dropdown-header">
                    <p className="avatar-name">{currentUser.name}</p>
                    <p className="avatar-email">{currentUser.email}</p>
                  </div>
                  <div className="avatar-dropdown-divider"></div>
                  <button className="avatar-dropdown-item" onClick={() => { navigate("/dashboard/profil"); setShowMenu(false); }}>
                    <User size={16} /> <span>Mon profil</span>
                  </button>
                  <button className="avatar-dropdown-item" onClick={() => { navigate("/dashboard/parametres"); setShowMenu(false); }}>
                    <Settings size={16} /> <span>Paramètres</span>
                  </button>
                  <div className="avatar-dropdown-divider"></div>
                  <button className="avatar-dropdown-item avatar-dropdown-logout" onClick={handleLogout}>
                    <LogOut size={16} /> <span>Déconnexion</span>
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
            <Route path="vendeur/:vendeurId" element={<VendeurDetails />} />
            <Route path="livreurs" element={<LivreursSection />} />
            <Route path="create-livreur" element={<CreateLivreurSection />} />
            <Route path="livreurs/:livreurId" element={<LivreurDetailsSection />} />
            <Route path="livreur/:livreurId" element={<LivreurDetails />} />
            <Route path="commandes" element={<CommandesSection />} />
            <Route path="historique" element={<HistoriqueSection />} />
            <Route path="factures" element={<FacturesSection />} />
            <Route path="integrations" element={<IntegrationsSection />} />
            <Route path="profil" element={<ProfilSection />} />
            <Route path="commandes/:orderId" element={<OrderDetailsSection />} />
            <Route path="commande/:orderId" element={<OrderDetailSection />} />
            <Route path="nouvelle-commande" element={<NouvelleCommandeSection />} />
            <Route path="suivi" element={<SuiviSection />} />
            <Route path="attributions" element={<AttributionsSection />} />
            <Route path="retenu/:orderId" element={<OrderDetailsSection />} />
            <Route path="litiges" element={<LitigesSection />} />
            <Route path="statistiques" element={<StatistiquesSection />} />
            <Route path="rapports" element={<RapportsSection />} />
            <Route path="zones" element={<ZonesTarifsSection />} />
            <Route path="messages" element={<MessagesSection />} />
            <Route path="add-zone" element={<AddZoneSection />} />
            <Route path="parametres" element={<ParametresSection />} />
            <Route path="help" element={<AideSupportSection />} />
            <Route path="finances" element={<PaiementsSection />} />
            <Route path="create-roles" element={<RoleCreateSection />} />
            <Route path="users-roles-permissions" element={<UsersSection />} />
            <Route path="users-roles-permissions/:userId" element={<UserDetailSection />} />
            <Route path="assigner-livreur/:orderId" element={<AssignerLivreurPage />} />
            <Route path="/order-searching" element={<OrderSearchingScreen />} />
            <Route path="/order-tracking" element={<OrderTrackingScreen />} />
            <Route path="/litiges/:id" element={<LitigeDetailSection />} />
            <Route path="pourcentages" element={<PourcentagesSection />} />
            <Route path="mes-gains" element={<SellerEarningsSection />} />
          </Routes>
        </div>

        <footer className="admin-footer">
          <span>© 2025 Gabon Livraison Express. Tous droits réservés.</span>
          <span>Besoin d'aide ? <a href="#">Contactez le support</a></span>
        </footer>
      </div>

      <BottomNav onOpenMenu={() => setIsSidebarOpen(true)} />

      {/* ✅ PANEL DE NOTIFICATIONS (STYLE MOBILE FLUTTER) */}
      {isNotifOpen && (
        <div className="notif-overlay" onClick={() => setIsNotifOpen(false)}>
          <div className="notif-panel" onClick={(e) => e.stopPropagation()}>
            <div className="notif-panel-header">
              <h3>Notifications</h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {unreadCount > 0 && (
                  <button className="notif-mark-all-btn" onClick={markAllAsRead}>
                    Tout lire
                  </button>
                )}
                <button className="notif-close-btn" onClick={() => setIsNotifOpen(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="notif-panel-body">
              {isLoadingNotifs ? (
                <div className="notif-loading-state">
                  <div className="notif-spinner"></div>
                  <p>Chargement des notifications...</p>
                </div>
              ) : notifError ? (
                <div className="notif-error-state">
                  <AlertTriangle size={32} />
                  <p>{notifError}</p>
                  <button className="notif-retry-btn" onClick={fetchNotifications}>Réessayer</button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="notif-empty-state">
                  <div className="notif-empty-icon-wrapper">
                    <Bell size={40} />
                  </div>
                  <h4>Aucune notification</h4>
                  <p>Vous êtes parfaitement à jour !</p>
                </div>
              ) : (
                getGroupedNotifications().map((group, groupIndex) => (
                  <div key={groupIndex} className="notif-group">
                    <div className="notif-group-title">{group.title}</div>
                    {group.items.map((notif) => {
                      const Icon = getNotifIcon(notif.type);
                      const isLitige = notif.type === 'litige_reported';
                      
                      return (
                        <div 
                          key={notif.id} 
                          className={`notif-card ${!notif.isRead ? 'unread' : 'read'} ${isLitige ? 'litige' : ''}`}
                          onClick={() => handleNotifClick(notif)}
                        >
                          <div className={`notif-card-icon ${notif.type}`}>
                            <Icon size={22} />
                          </div>
                          <div className="notif-card-content">
                            <div className="notif-card-header">
                              <span className="notif-card-title">{notif.title}</span>
                              {!notif.isRead && <div className={`notif-unread-dot ${isLitige ? 'litige' : ''}`} />}
                            </div>
                            <p className="notif-card-message">{notif.message}</p>
                            <div className="notif-card-time">
                              <span>{getTimeAgo(notif.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ✅ CSS ÉLÉGANT (Reproduction fidèle du style Flutter) */}
      <style>{`
        .notif-trigger-btn {
          position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;
          background: ${unreadCount > 0 ? '#fff7ed' : '#f8fafc'};
          border: 1px solid ${unreadCount > 0 ? '#fdba74' : '#e2e8f0'};
          border-radius: 50%; color: ${unreadCount > 0 ? '#c2410c' : '#64748b'};
          cursor: pointer; transition: all 0.2s ease; margin-right: 12px;
        }
        .notif-trigger-btn:hover { background: ${unreadCount > 0 ? '#ffedd5' : '#f1f5f9'}; transform: translateY(-1px); }
        .notif-badge {
          position: absolute; top: -2px; right: -2px; min-width: 18px; height: 18px; padding: 0 5px;
          background: #ef4444; color: white; border-radius: 9px; font-size: 10px; font-weight: 700;
          display: flex; align-items: center; justify-content: center; border: 2px solid white;
          box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3); animation: badgePulse 2s ease-in-out infinite;
        }
        @keyframes badgePulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        
        .avatar-wrapper2 { position: relative; }
        .topbar-avatar2 {
          width: 42px; height: 42px; border-radius: 50%; object-fit: cover; cursor: pointer;
          border: 2px solid #e2e8f0; transition: border-color 0.2s, transform 0.2s;
        }
        .topbar-avatar2:hover { border-color: #FF6B35; transform: scale(1.05); }
        .avatar-dropdown-menu {
          position: absolute; top: calc(100% + 8px); right: 0; width: 240px; background: white;
          border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          border: 1px solid #f1f5f9; z-index: 1000; animation: dropdownFadeIn 0.2s ease-out; overflow: hidden;
        }
        @keyframes dropdownFadeIn { from { opacity: 0; transform: translateY(-10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .avatar-dropdown-header { padding: 16px; background: #f8fafc; }
        .avatar-name { margin: 0; font-size: 14px; font-weight: 600; color: #0f172a; }
        .avatar-email { margin: 4px 0 0 0; font-size: 12px; color: #64748b; }
        .avatar-dropdown-divider { height: 1px; background: #f1f5f9; }
        .avatar-dropdown-item {
          width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 16px;
          background: none; border: none; color: #334155; font-size: 14px; font-weight: 500;
          cursor: pointer; transition: background 0.15s; text-align: left;
        }
        .avatar-dropdown-item:hover { background: #f8fafc; color: #0f172a; }
        .avatar-dropdown-logout { color: #ef4444; }
        .avatar-dropdown-logout:hover { background: #fef2f2; color: #dc2626; }

        /* --- PANEL DE NOTIFICATIONS (STYLE FLUTTER) --- */
        .notif-overlay {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.3);
          backdrop-filter: blur(4px); z-index: 9998; animation: overlayFadeIn 0.2s ease-out;
        }
        @keyframes overlayFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .notif-panel {
          position: fixed; top: 0; right: 0; width: 420px; max-width: 100vw; height: 100vh;
          background: #F5F6FA; /* Couleur de fond mobile */
          box-shadow: -10px 0 25px -5px rgba(0, 0, 0, 0.1);
          z-index: 9999; display: flex; flex-direction: column;
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        
        .notif-panel-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px; background: white; border-bottom: 1px solid #f1f5f9;
        }
        .notif-panel-header h3 { margin: 0; font-size: 18px; font-weight: 800; color: #1A1A1E; }
        .notif-mark-all-btn {
          background: none; border: none; color: #FF6B35; font-size: 14px; font-weight: 600;
          cursor: pointer; padding: 4px 8px; border-radius: 6px; transition: background 0.2s;
        }
        .notif-mark-all-btn:hover { background: #fff7ed; }
        .notif-close-btn {
          width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
          background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
          color: #64748b; cursor: pointer; transition: all 0.2s;
        }
        .notif-close-btn:hover { background: #f1f5f9; color: #0f172a; }

        .notif-panel-body { flex: 1; overflow-y: auto; padding: 8px 16px 16px; }
        
        .notif-loading-state, .notif-error-state, .notif-empty-state {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          height: 100%; text-align: center; color: #8B8B93; padding: 40px 20px;
        }
        .notif-spinner {
          width: 32px; height: 32px; border: 3px solid #f3f3f3; border-top: 3px solid #FF6B35;
          border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .notif-empty-icon-wrapper {
          width: 90px; height: 90px; background: rgba(255, 107, 53, 0.08); border-radius: 50%;
          display: flex; align-items: center; justify-content: center; color: #FF6B35; margin-bottom: 20px;
        }
        .notif-empty-state h4 { margin: 0 0 6px 0; font-size: 17px; font-weight: 700; color: #1A1A1E; }
        .notif-empty-state p { margin: 0; font-size: 14px; }
        .notif-retry-btn {
          margin-top: 24px; padding: 12px 24px; background: #FF6B35; color: white; border: none;
          border-radius: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px;
        }

        .notif-group { margin-bottom: 16px; }
        .notif-group-title {
          font-size: 13px; font-weight: 700; color: #A0A0A0; letter-spacing: 0.5px;
          padding: 16px 4px 8px; text-transform: uppercase;
        }

        /* --- CARTE DE NOTIFICATION (Reproduction Flutter _NotificationCard) --- */
        .notif-card {
          display: flex; gap: 14px; padding: 16px; border-radius: 16px;
          margin-bottom: 12px; cursor: pointer; transition: all 0.2s ease;
        }
        /* État NON LU */
        .notif-card.unread {
          background: #FFFFFF;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
          border: 1.5px solid rgba(255, 107, 53, 0.4);
        }
        .notif-card.unread.litige {
          border-color: rgba(239, 68, 68, 0.4); /* Rouge pour litige */
        }
        /* État LU */
        .notif-card.read {
          background: #F9F9FB;
          border: 1px solid transparent;
        }
        .notif-card:hover { transform: translateY(-1px); }

        .notif-card-icon {
          width: 42px; height: 42px; border-radius: 50%; display: flex;
          align-items: center; justify-content: center; flex-shrink: 0;
        }
        .notif-card-icon.success, .notif-card-icon.order_delivered { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
        .notif-card-icon.warning, .notif-card-icon.litige_reported { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .notif-card-icon.error { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
        .notif-card-icon.info, .notif-card-icon.default { background: rgba(255, 107, 53, 0.1); color: #FF6B35; }

        .notif-card-content { flex: 1; display: flex; flex-direction: column; }
        .notif-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
        .notif-card-title {
          font-size: 15px; color: #1A1A1E; line-height: 1.3;
          font-weight: 600; /* Sera 700 si non lu via CSS spécifique si besoin, mais géré par le design global */
        }
        .notif-card.unread .notif-card-title { font-weight: 700; }
        
        .notif-unread-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #FF6B35;
          box-shadow: 0 2px 4px rgba(255, 107, 53, 0.4); margin-top: 6px; flex-shrink: 0;
        }
        .notif-unread-dot.litige { background: #ef4444; box-shadow: 0 2px 4px rgba(239, 68, 68, 0.4); }

        .notif-card-message {
          margin: 0 0 10px 0; font-size: 13.5px; color: #8B8B93; line-height: 1.4;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .notif-card-time { font-size: 11.5px; color: #A0A0A0; font-weight: 500; display: flex; align-items: center; gap: 4px; }

        @media (max-width: 640px) {
          .notif-panel { width: 100vw; }
          .avatar-dropdown-menu { width: 200px; right: -10px; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;