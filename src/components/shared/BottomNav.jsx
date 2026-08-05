import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Clock, Menu } from 'lucide-react';

const BottomNav = ({ onOpenMenu }) => {
  const location = useLocation();

  // Fonction pour vérifier si le lien est actif
  const isActive = (path) => {
    if (path === '/vendeurs' && location.pathname === '/vendeurs') return true;
    if (path !== '/vendeurs' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const commandesBadge = 3;
  const historiqueBadge = 12;
  return (
    <nav className="bottom-nav">
      <Link to="/dashboard" className={`nav-item ${isActive('/vendeurs') ? 'active' : ''}`}>
        <LayoutDashboard size={22} />
        <span>Accueil</span>
      </Link>

      <Link
        to="/dashboard/commandes"
        className={`nav-item ${isActive('/vendeurs/commandes') ? 'active' : ''}`}
        >
        <div className="nav-icon">
            <ShoppingCart size={22} />
            {commandesBadge > 0 && (
            <span className="nav-badge">{commandesBadge}</span>
            )}
        </div>
        <span>Commandes</span>
        </Link>

        <Link
        to="/dashboard/historique"
        className={`nav-item ${isActive('/vendeurs/historique') ? 'active' : ''}`}
        >
        <div className="nav-icon">
            <Clock size={22} />
            {historiqueBadge > 0 && (
            <span className="nav-badge">{historiqueBadge}</span>
            )}
        </div>
        <span>Historique</span>
        </Link>
      
      <button type="button" className="nav-item menu-btn" onClick={onOpenMenu}>
        <Menu size={22} />
        <span>Autres</span>
      </button>
    </nav>
  );
};

export default BottomNav;