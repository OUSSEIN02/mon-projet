import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from "../../assets/logo.jpg";
import {
  LayoutDashboard, PlusCircle, ShoppingCart, MapPinned, ShieldCheck,
  History, Receipt, Plug, PackageSearch, HandHelping, AlertTriangle,
  Store, Bike, Map, BarChart3, Wallet, Settings, AlertCircle, Percent, MessageSquare
} from 'lucide-react';
import apiClient from '../../services/apiClient';

const Sidebar = ({ isOpen, onClose, litigesCount = 0 }) => {
  const location = useLocation();
  const userPermissions = JSON.parse(localStorage.getItem('permissions') || '[]');
  const userRole = localStorage.getItem('role');
  
  const isAdmin = userRole === 'admin';
  const isVendeurOrLivreur = userRole === 'vendeur' || userRole === 'livreur';

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. États pour les badges
  const [newCouriersCount, setNewCouriersCount] = useState(0);
  const [newSellersCount, setNewSellersCount] = useState(0);
  const [newUnassignedOrdersCount, setNewUnassignedOrdersCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  
  //  NOUVEAU : État pour les paiements en attente
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);

  // 2. POLLING
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const couriersRes = await apiClient.get('/admin/couriers/new-count');
        setNewCouriersCount(couriersRes.data.count);

        const sellersRes = await apiClient.get('/admin/sellers/new-count');
        setNewSellersCount(sellersRes.data.count);

        const unassignedRes = await apiClient.get('/failed-orders/recent');
        if (unassignedRes.data?.success) {
          setNewUnassignedOrdersCount(unassignedRes.data.count || 0);
        }

        try {
          const messagesRes = await apiClient.get('/dashboard/messages/unread-count');
          setUnreadMessagesCount(messagesRes.data.count || 0);
        } catch (err) { /* Ignore silencieusement */ }

        //  NOUVEAU : Récupération du nombre de paiements en attente
        try {
          const financesRes = await apiClient.get('/admin/withdrawals/pending-count');
          setPendingPaymentsCount(financesRes.data.count || 0);
        } catch (err) { /* Ignore silencieusement */ }

      } catch (error) {
        console.error("Erreur récupération compteurs notifications", error);
      }
    };

    fetchCounts();
    const intervalId = setInterval(fetchCounts, 30000); // Toutes les 30 secondes
    return () => clearInterval(intervalId);
  }, []);

  const hasPermission = (permission) => {
    if (!permission) return true;
    return userPermissions.includes(permission);
  };

  const isAdminHidden = (item) => {
    if (!isAdmin) return false;
    const hiddenLabels = ["Nouvelle commande", "Mes commandes", "Historique", "Factures", "API & Intégrations"];
    return hiddenLabels.includes(item.label);
  };

  const isRoleHidden = (item) => {
    if (!isVendeurOrLivreur) return false;
    const hiddenForThem = ["Paramètres", "Paramètres système"];
    return hiddenForThem.includes(item.label);
  };

  const isMobileHidden = (item) => {
    if (!isMobile) return false;
    if (!isAdmin) return false;
    return item.path === '/dashboard/livreurs' || item.path === '/dashboard/vendeurs';
  };

  const shouldRenderItem = (item) => {
    if (!hasPermission(item.permission)) return false;
    if (isAdminHidden(item)) return false;
    if (isMobileHidden(item)) return false;
    if (isRoleHidden(item)) return false;
    
    if (item.path === '/dashboard/mes-gains' && userRole !== 'seller') {
      return false;
    }
    
    return true;
  };

  const handleLinkClick = (path) => {
    if (path === '/dashboard/livreurs') setNewCouriersCount(0);
    if (path === '/dashboard/vendeurs') setNewSellersCount(0);
    if (path === '/dashboard/attributions') setNewUnassignedOrdersCount(0);
    if (path === '/dashboard/messages') setUnreadMessagesCount(0);
    
    // 🟢 NOUVEAU : Réinitialiser le badge quand on clique sur Paiements
    if (path === '/dashboard/finances') setPendingPaymentsCount(0);
    
    if (onClose) onClose();
  };

  const menuItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord", permission: null },
    {
      section: "MES LIVRAISONS",
      items: [
        { path: "/dashboard/nouvelle-commande", icon: PlusCircle, label: "Nouvelle commande", permission: "create-seller-order" },
        { path: "/dashboard/commandes", icon: ShoppingCart, label: "Mes commandes", permission: "view-my-orders" },
        { path: "/dashboard/historique", icon: History, label: "Historiques", permission: "view-my-orders" },
      ],
    },
    {
      section: "EXPLOITATION",
      items: [
        { path: "/dashboard/commandes", icon: PackageSearch, label: "Toutes les commandes", permission: "view-all-orders" },
        { path: "/dashboard/attributions", icon: HandHelping, label: "Attributions", permission: "manage-assignments", isAttributionsLink: true },
        { path: "/dashboard/litiges", icon: AlertTriangle, label: "Litiges", permission: "manage-disputes", isLitigeLink: true },
      ],
    },
    {
      section: "COMMUNICATION",
      items: [
        { path: "/dashboard/messages", icon: MessageSquare, label: "Messagerie", permission: null, isMessagesLink: true },
      ],
    },
    {
      section: "UTILISATEURS",
      items: [
        { path: "/dashboard/vendeurs", icon: Store, label: "Vendeurs", permission: "view-sellers", isVendeurLink: true },
        { path: "/dashboard/livreurs", icon: Bike, label: "Livreurs", permission: "view-couriers", isLivreurLink: true },
      ],
    },
    {
      section: "FINANCES",
      items: [
        { path: "/dashboard/mes-gains", icon: Wallet, label: "Mes gains", permission: null },
        // 🟢 NOUVEAU : Ajout de l'identifiant isFinancesLink
        { path: "/dashboard/finances", icon: Wallet, label: "Paiements", permission: "manage-finances", isFinancesLink: true },
        { path: "/dashboard/statistiques", icon: BarChart3, label: "Statistiques", permission: "view-statistics" },
      ],
    },
    {
      section: "CONFIGURATION",
      items: [
        { path: "/dashboard/zones", icon: Map, label: "Zones & Tarifs", permission: "manage-zones-pricing" },
        { path: "/dashboard/pourcentages", icon: Percent, label: "Pourcentages", permission: "manage-system-settings" },
      ],
    },
    {
      section: "ADMINISTRATION",
      items: [
        { path: "/dashboard/parametres", icon: Settings, label: "Paramètres système", permission: "manage-system-settings" },
        { path: "/dashboard/users-roles-permissions", icon: ShieldCheck, label: "Rôles & Permissions", permission: "manage-system-settings" },
      ],
    },
  ];

  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (path !== '/dashboard' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay active" onClick={onClose}></div>}
      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="logo-card">
            <img src={logo} alt="Gabon Livraison Express" />
          </div>
          <div className="brand-text">
            <strong>Gabon Livraison</strong>
            <span>Express</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, idx) => {
            if (item.section) {
              const filteredSubItems = item.items.filter(subItem => shouldRenderItem(subItem));
              if (filteredSubItems.length === 0) return null;

              return (
                <div key={idx} className="sidebar-section">
                  <div className="sidebar-section-title">{item.section}</div>

                  {filteredSubItems.map((subItem, subIdx) => (
                    <Link
                      key={subIdx}
                      to={subItem.path}
                      className={`sidebar-link ${isActive(subItem.path) ? 'active' : ''}`}
                      onClick={() => handleLinkClick(subItem.path)}
                    >
                      <span className="sidebar-link-left">
                        <subItem.icon size={17} />
                        {subItem.label}
                      </span>

                      {subItem.isLivreurLink && newCouriersCount > 0 && (
                        <span className="sidebar-badge">{newCouriersCount > 99 ? '99+' : newCouriersCount}</span>
                      )}
                      {subItem.isVendeurLink && newSellersCount > 0 && (
                        <span className="sidebar-badge">{newSellersCount > 99 ? '99+' : newSellersCount}</span>
                      )}
                      {subItem.isAttributionsLink && newUnassignedOrdersCount > 0 && (
                        <span className="sidebar-badge">{newUnassignedOrdersCount > 99 ? '99+' : newUnassignedOrdersCount}</span>
                      )}
                      {subItem.isLitigeLink && litigesCount > 0 && (
                        <span className="sidebar-badge">{litigesCount > 99 ? '99+' : litigesCount}</span>
                      )}
                      {subItem.isMessagesLink && unreadMessagesCount > 0 && (
                        <span className="sidebar-badge">{unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}</span>
                      )}
                      
                      
                      {subItem.isFinancesLink && pendingPaymentsCount > 0 && (
                        <span className="sidebar-badge">{pendingPaymentsCount > 99 ? '99+' : pendingPaymentsCount}</span>
                      )}
                    </Link>
                  ))}
                </div>
              );
            }

            if (!shouldRenderItem(item)) return null;

            return (
              <Link
                key={idx}
                to={item.path}
                className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => handleLinkClick(item.path)}
              >
                <span className="sidebar-link-left">
                  <item.icon size={17} />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;