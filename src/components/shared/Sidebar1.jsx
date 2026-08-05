import React from 'react';
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

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  // 1. Récupération des permissions enregistrées dans le localStorage
  const userPermissions = JSON.parse(localStorage.getItem('permissions') || '[]');

  // Fonction helper pour vérifier si l'utilisateur possède une permission spécifique
  const hasPermission = (permission) => {
    if (!permission) return true; // Si aucune permission n'est requise, l'onglet est public/accessible par défaut
    return userPermissions.includes(permission);
  };

  // 2. Définition des éléments du menu avec leurs slugs de permission
  const menuItems = [
    // =========================
    // ACCUEIL
    // =========================
    {
      path: "/dashboard",
      icon: LayoutDashboard,
      label: "Tableau de bord",
      permission: null,
    },
  
    // =========================
    // ESPACE VENDEUR
    // =========================
    {
      section: "MES LIVRAISONS",
      items: [
        {
          path: "/dashboard/nouvelle-commande",
          icon: PlusCircle,
          label: "Nouvelle commande",
          permission: "create-seller-order",
        },
        {
          path: "/dashboard/commandes",
          icon: ShoppingCart,
          label: "Mes commandes",
          permission: "view-my-orders",
        },
        {
          path: "/dashboard/historique",
          icon: History,
          label: "Historique",
          permission: "view-my-orders",
        },
        {
          path: "/dashboard/factures",
          icon: Receipt,
          label: "Factures",
          permission: "view-my-invoices",
        },
      ],
    },
  
    {
      section: "MON COMPTE",
      items: [
        {
          path: "/dashboard/integrations",
          icon: Plug,
          label: "API & Intégrations",
          permission: "manage-seller-api",
        },
        {
          path: "/dashboard/parametres",
          icon: Settings,
          label: "Paramètres",
          permission: "manage-seller-profile",
        },
      ],
    },
  
    // =========================
    // EXPLOITATION
    // =========================
    {
      section: "EXPLOITATION",
      items: [
        {
          path: "/dashboard/commandes",
          icon: PackageSearch,
          label: "Toutes les commandes",
          permission: "view-all-orders",
        },
        {
          path: "/dashboard/attributions",
          icon: HandHelping,
          label: "Attributions",
          permission: "manage-assignments",
        },
        {
          path: "/dashboard/litiges",
          icon: AlertTriangle,
          label: "Litiges",
          permission: "manage-disputes",
        },
      ],
    },
  
    // =========================
    // UTILISATEURS
    // =========================
    {
      section: "UTILISATEURS",
      items: [
        {
          path: "/dashboard/vendeurs",
          icon: Store,
          label: "Vendeurs",
          permission: "view-sellers",
        },
        {
          path: "/dashboard/livreurs",
          icon: Bike,
          label: "Livreurs",
          permission: "view-couriers",
        },
      ],
    },
  
    // =========================
    // FINANCES
    // =========================
    {
      section: "FINANCES",
      items: [
        {
          path: "/dashboard/finances",
          icon: Wallet,
          label: "Paiements",
          permission: "manage-finances",
        },
        {
          path: "/dashboard/statistiques",
          icon: BarChart3,
          label: "Statistiques",
          permission: "view-statistics",
        },
      ],
    },
  
    // =========================
    // CONFIGURATION
    // =========================
    {
      section: "CONFIGURATION",
      items: [
        {
          path: "/dashboard/zones",
          icon: Map,
          label: "Zones & Tarifs",
          permission: "manage-zones-pricing",
        },
      ],
    },
  
    // =========================
    // ADMINISTRATION
    // =========================
    {
      section: "ADMINISTRATION",
      items: [
        {
          path: "/dashboard/system-settings",
          icon: Settings,
          label: "Paramètres système",
          permission: "manage-system-settings",
        },
        {
          path: "/dashboard/users-roles-permissions",
          icon: ShieldCheck,
          label: "Rôles & Permissions",
          permission: "manage-system-settings",
        },
      ],
    },
  ];

  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (path !== '/dashboard' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleLinkClick = () => {
    if (onClose) onClose();
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
            // S'il s'agit d'une section entière
            if (item.section) {
              // Filtrer les sous-éléments accessibles par l'utilisateur
              const filteredSubItems = item.items.filter(subItem => hasPermission(subItem.permission));

              // Ne pas afficher la section si aucun élément n'est autorisé
              if (filteredSubItems.length === 0) return null;

              return (
                <div key={idx} className="sidebar-section">
                  {/* Titre de la section (facultatif si présent dans le CSS via data-section) */}
                  <div className="sidebar-section-title">{item.section}</div>
                  
                  {filteredSubItems.map((subItem, subIdx) => (
                    <Link
                      key={subIdx}
                      to={subItem.path}
                      className={`sidebar-link ${isActive(subItem.path) ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      <span className="sidebar-link-left">
                        <subItem.icon size={17} />
                        {subItem.label}
                      </span>
                    </Link>
                  ))}
                </div>
              );
            }

            // S'il s'agit d'un lien simple (ex: Tableau de bord principal)
            if (!hasPermission(item.permission)) return null;

            return (
              <Link
                key={idx}
                to={item.path}
                className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="sidebar-link-left">
                  <item.icon size={17} />
                  {item.label}
                </span>
              </Link>
            );
          })}

          <div className="sidebar-bottom">
            <Link 
              to="/dashboard/help" 
              className="sidebar-link"
              onClick={handleLinkClick}
            >
              <span className="sidebar-link-left">
                <AlertCircle size={17} />
                Aide & support
              </span>
            </Link>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;