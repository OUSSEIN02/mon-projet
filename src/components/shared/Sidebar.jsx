// components/admin/shared/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from "../../assets/logo.jpg";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Truck,
  Shield,
  AlertCircle,
  BarChart3,
  PackageSearch,
  HandHelping,
  AlertTriangle,
  Store,
  Bike,
  Map,
  Wallet,
  Bell,
  UserCog,
  FileText,
  Globe,
  DollarSign,
  CreditCard,
  Settings,
  LogOut,
  ChevronDown
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const menuItems = [
    {
      path: "/admin",
      icon: LayoutDashboard,
      label: "Tableau de bord",
    },
  
    {
      section: "EXPLOITATION",
      items: [
        {
          path: "/admin/commandes",
          icon: PackageSearch,
          label: "Commandes",
        },
        {
          path: "/admin/attributions",
          icon: HandHelping,
          label: "Attributions",
        },
        {
          path: "/admin/litiges",
          icon: AlertTriangle,
          label: "Litiges",
        },
      ],
    },
  
    {
      section: "UTILISATEURS",
      items: [
        {
          path: "/admin/vendeurs",
          icon: Store,
          label: "Vendeurs",
        },
        {
          path: "/admin/livreurs",
          icon: Bike,
          label: "Livreurs",
        },
      ],
    },
  
    {
      section: "CONFIGURATION",
      items: [
        {
          path: "/admin/zones",
          icon: Map,
          label: "Zones & Tarifs",
        },
        {
          path: "/admin/statistiques",
          icon: BarChart3,
          label: "Statistiques",
        },
        {
          path: "/admin/finances",
          icon: Wallet,
          label: "Paiements",
        },
      ],
    },
  
    {
      section: "SYSTÈME",
      items: [
      
      
        {
          path: "/admin/parametres",
          icon: Settings,
          label: "Paramètres",
        },
       
      ],
    },
  ];

  const isActive = (path) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path !== '/admin' && location.pathname.startsWith(path)) return true;
    return false;
  };

    // Fonction helper pour gérer le clic sur un lien
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
            if (item.section) {
              return (
                <div key={idx} className="sidebar-section">
                  {item.items.map((subItem, subIdx) => (
                    <Link
                      key={subIdx}
                      to={subItem.path}
                      className={`sidebar-link ${isActive(subItem.path) ? 'active' : ''}`}
                      onClick={handleLinkClick} // <-- Ferme la sidebar au clic
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
            return (
              <Link
                key={idx}
                to={item.path}
                className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={handleLinkClick} // <-- Ferme la sidebar au clic
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
              to="/admin/help" 
              className="sidebar-link"
              onClick={handleLinkClick} // <-- Ferme aussi la sidebar pour l'aide
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



