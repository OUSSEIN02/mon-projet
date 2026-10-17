import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Menu,
  Truck,
  Users,
  MessageSquare
} from 'lucide-react';
import apiClient from '../../services/apiClient';

const BottomNav = ({ onOpenMenu }) => {
  const location = useLocation();

  // Détection du rôle
  const userRole = localStorage.getItem('role');
  const isAdmin = userRole === 'admin';

  // 🔹 États pour les badges
  const [newCouriersCount, setNewCouriersCount] = useState(0);
  const [newSellersCount, setNewSellersCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Badge pour les commandes (statique pour l'exemple)
  const commandesBadge = 3;

  // 🔹 POLLING pour récupérer les compteurs
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // 1. Compteurs spécifiques Admin
        if (isAdmin) {
          const couriersRes = await apiClient.get('/admin/couriers/new-count');
          setNewCouriersCount(couriersRes.data.count);

          const sellersRes = await apiClient.get('/admin/sellers/new-count');
          setNewSellersCount(sellersRes.data.count);
        }

        // 2. Compteur de messages pour TOUS les rôles
        try {
          const messagesRes = await apiClient.get('/dashboard/messages/unread-count');
          setUnreadMessagesCount(messagesRes.data.count || 0);
        } catch (err) {
          // Échec silencieux si l'endpoint n'est pas encore créé
        }

      } catch (error) {
        console.error("Erreur récupération compteurs notifications", error);
      }
    };

    fetchCounts();
    const intervalId = setInterval(fetchCounts, 30000);
    return () => clearInterval(intervalId);
  }, [isAdmin]);

  // Fonction pour vérifier si le lien est actif
  const isActive = (path) => {
    if (path === '/' || path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // 🔹 Fonction pour masquer les badges quand on clique sur le lien
  const handleLinkClick = (path) => {
    if (path === '/dashboard/livreurs') setNewCouriersCount(0);
    if (path === '/dashboard/vendeurs') setNewSellersCount(0);
    if (path === '/dashboard/messages') setUnreadMessagesCount(0);
  };

  // 🔹 Liens pour l'ADMIN
  const adminLinks = [
    {
      to: '/dashboard',
      icon: LayoutDashboard,
      label: 'Accueil',
      matchPath: '/dashboard',
    },
    {
      to: '/dashboard/livreurs',
      icon: Truck,
      label: 'Livreurs',
      matchPath: '/dashboard/livreurs',
      badge: newCouriersCount,
    },
    {
      to: '/dashboard/vendeurs',
      icon: Users,
      label: 'Vendeurs',
      matchPath: '/dashboard/vendeurs',
      badge: newSellersCount,
    },
    {
      to: '/dashboard/messages',
      icon: MessageSquare,
      label: 'Messages',
      matchPath: '/dashboard/messages',
      badge: unreadMessagesCount,
    },
  ];

  // 🔹 Liens pour un utilisateur standard (Vendeur / Livreur)
  // (Historique supprimé ici)
  const userLinks = [
    {
      to: '/dashboard',
      icon: LayoutDashboard,
      label: 'Accueil',
      matchPath: '/dashboard',
    },
    {
      to: '/dashboard/commandes',
      icon: ShoppingCart,
      label: 'Commandes',
      matchPath: '/dashboard/commandes',
      
    },
    {
      to: '/dashboard/messages',
      icon: MessageSquare,
      label: 'Messages',
      matchPath: '/dashboard/messages',
      badge: unreadMessagesCount,
    },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  // Style garanti pour le conteneur de l'icône (pour le positionnement absolu du badge)
  const iconWrapperStyle = {
    position: 'relative',
    display: 'inline-block',
  };

  // Style garanti pour le badge (ancré en haut à droite de l'icône)
  const badgeStyle = {
    position: 'absolute',
    top: '-4px',
    right: '-6px',
    backgroundColor: '#F26A22', // Votre couleur primaire
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: '700',
    borderRadius: '999px',
    minWidth: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
    border: '2px solid #ffffff', // Bordure blanche pour le détacher visuellement de l'icône
    lineHeight: '1',
  };

  return (
    <nav className="bottom-nav">
      {links.map((link) => {
        const Icon = link.icon;
        const active = isActive(link.matchPath);
        const hasBadge = link.badge && link.badge > 0;

        return (
          <Link
            key={link.to}
            to={link.to}
            className={`nav-item ${active ? 'active' : ''}`}
            onClick={() => handleLinkClick(link.to)}
          >
            {hasBadge ? (
              <div style={iconWrapperStyle}>
                <Icon size={22} />
                <span style={badgeStyle}>
                  {link.badge > 99 ? '99+' : link.badge}
                </span>
              </div>
            ) : (
              <Icon size={22} />
            )}
            <span>{link.label}</span>
          </Link>
        );
      })}

      {/* Le bouton "Autres" est commun aux deux rôles */}
      <button type="button" className="nav-item menu-btn" onClick={onOpenMenu}>
        <Menu size={22} />
        <span>Autres</span>
      </button>
    </nav>
  );
};

export default BottomNav;