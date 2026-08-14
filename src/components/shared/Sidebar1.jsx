import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from "../../assets/logo.jpg";
import {
  LayoutDashboard,
  PlusCircle,
  ShoppingCart,
  MapPinned,
  ShieldCheck,
  History,
  Receipt,
  Plug,
  PackageSearch,
  HandHelping,
  AlertTriangle,
  Store,
  Bike,
  Map,
  BarChart3,
  Wallet,
  Settings,
  AlertCircle
} from 'lucide-react';
import apiClient from '../../services/apiClient'; // Adaptez le chemin si nécessaire

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const userPermissions = JSON.parse(localStorage.getItem('permissions') || '[]');

  // 1. États pour les badges des nouveaux livreurs ET vendeurs
  const [newCouriersCount, setNewCouriersCount] = useState(0);
  const [newSellersCount, setNewSellersCount] = useState(0);

  // 2. POLLING : Interroger le serveur toutes les 30 secondes pour les deux compteurs
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Récupération du nombre de nouveaux livreurs
        const couriersRes = await apiClient.get('/admin/couriers/new-count');
        setNewCouriersCount(couriersRes.data.count);

        // Récupération du nombre de nouveaux vendeurs
        const sellersRes = await apiClient.get('/admin/sellers/new-count');
        setNewSellersCount(sellersRes.data.count);
      } catch (error) {
        // Silencieux en cas d'erreur pour ne pas spammer la console
        console.error("Erreur récupération compteurs notifications", error);
      }
    };

    // Appel immédiat au chargement du composant
    fetchCounts();

    // Mise en place de l'intervalle (30000 ms = 30 secondes)
    const intervalId = setInterval(fetchCounts, 30000);

    // Nettoyage de l'intervalle quand le composant est démonté
    return () => clearInterval(intervalId);
  }, []);

  // Fonction helper pour vérifier les permissions
  const hasPermission = (permission) => {
    if (!permission) return true; 
    return userPermissions.includes(permission);
  };

  // 3. Gestion centralisée du clic sur un lien
  const handleLinkClick = (path) => {
    // Réinitialiser le badge Livreurs si on clique dessus
    if (path === '/dashboard/livreurs') {
      setNewCouriersCount(0);
    }
    // Réinitialiser le badge Vendeurs si on clique dessus
    if (path === '/dashboard/vendeurs') {
      setNewSellersCount(0);
    }
    // Fermer le menu sur mobile après un clic
    if (onClose) onClose();
  };

  // 4. Définition complète des éléments du menu
  const menuItems = [
    {
      path: "/dashboard",
      icon: LayoutDashboard,
      label: "Tableau de bord",
      permission: null,
    },
    {
      section: "MES LIVRAISONS",
      items: [
        { path: "/dashboard/nouvelle-commande", icon: PlusCircle, label: "Nouvelle commande", permission: "create-seller-order" },
        { path: "/dashboard/commandes", icon: ShoppingCart, label: "Mes commandes", permission: "view-my-orders" },
        { path: "/dashboard/historique", icon: History, label: "Historique", permission: "view-my-orders" },
        { path: "/dashboard/factures", icon: Receipt, label: "Factures", permission: "view-my-invoices" },
      ],
    },
    {
      section: "MON COMPTE",
      items: [
        { path: "/dashboard/integrations", icon: Plug, label: "API & Intégrations", permission: "manage-seller-api" },
        { path: "/dashboard/parametres", icon: Settings, label: "Paramètres", permission: "manage-seller-profile" },
      ],
    },
    {
      section: "EXPLOITATION",
      items: [
        { path: "/dashboard/commandes", icon: PackageSearch, label: "Toutes les commandes", permission: "view-all-orders" },
        { path: "/dashboard/attributions", icon: HandHelping, label: "Attributions", permission: "manage-assignments" },
        { path: "/dashboard/litiges", icon: AlertTriangle, label: "Litiges", permission: "manage-disputes" },
      ],
    },
    {
      section: "UTILISATEURS",
      items: [
        { 
          path: "/dashboard/vendeurs", 
          icon: Store, 
          label: "Vendeurs", 
          permission: "view-sellers",
          isVendeurLink: true // <-- FLAG IMPORTANT pour le badge Vendeur
        },
        { 
          path: "/dashboard/livreurs", 
          icon: Bike, 
          label: "Livreurs", 
          permission: "view-couriers",
          isLivreurLink: true // <-- FLAG IMPORTANT pour le badge Livreur
        },
      ],
    },
    {
      section: "FINANCES",
      items: [
        { path: "/dashboard/finances", icon: Wallet, label: "Paiements", permission: "manage-finances" },
        { path: "/dashboard/statistiques", icon: BarChart3, label: "Statistiques", permission: "view-statistics" },
      ],
    },
    {
      section: "CONFIGURATION",
      items: [
        { path: "/dashboard/zones", icon: Map, label: "Zones & Tarifs", permission: "manage-zones-pricing" },
      ],
    },
    {
      section: "ADMINISTRATION",
      items: [
        { path: "/dashboard/system-settings", icon: Settings, label: "Paramètres système", permission: "manage-system-settings" },
        { path: "/dashboard/users-roles-permissions", icon: ShieldCheck, label: "Rôles & Permissions", permission: "manage-system-settings" },
      ],
    },
  ];

  // Fonction pour vérifier si le lien est actif
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
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, idx) => {
            // Cas 1 : C'est une section avec des sous-éléments
            if (item.section) {
              const filteredSubItems = item.items.filter(subItem => hasPermission(subItem.permission));

              // Ne pas afficher la section si aucun élément n'est autorisé
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
                      
                      {/* Badge pour les Livreurs */}
                      {subItem.isLivreurLink && newCouriersCount > 0 && (
                        <span className="sidebar-badge">
                          {newCouriersCount > 99 ? '99+' : newCouriersCount}
                        </span>
                      )}

                      {/* Badge pour les Vendeurs */}
                      {subItem.isVendeurLink && newSellersCount > 0 && (
                        <span className="sidebar-badge">
                          {newSellersCount > 99 ? '99+' : newSellersCount}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              );
            }

            // Cas 2 : C'est un lien simple (ex: Tableau de bord)
            if (!hasPermission(item.permission)) return null;

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

          {/* Bas de la sidebar */}
        
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;