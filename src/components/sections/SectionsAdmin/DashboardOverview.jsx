import React from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Store,
  Banknote,
  Timer,
  Calendar,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';

const DashboardOverview = () => {
  // 1. Indicateurs Principaux (Top Row)
  const primaryKPIs = [
    { 
      icon: ShoppingCart, 
      label: "Commandes aujourd'hui", 
      value: '142', 
      delta: '+12%', 
      deltaUp: true, 
      color: 'blue' 
    },
    { 
      icon: Banknote, 
      label: 'Revenus du jour', 
      value: '458 000 F', 
      delta: '+8%', 
      deltaUp: true, 
      color: 'green' 
    },
    { 
      icon: Clock, 
      label: 'En cours de livraison', 
      value: '38', 
      delta: '+5%', 
      deltaUp: true, 
      color: 'orange' 
    },
    { 
      icon: Timer, 
      label: 'Temps moyen livraison', 
      value: '28 min', 
      delta: '-4 min', 
      deltaUp: true, 
      color: 'purple', 
      deltaNote: '(Amélioration)' // deltaUp=true car moins de temps c'est bien
    }
  ];

  // 2. Indicateurs Secondaires (Bottom Row)
  const secondaryKPIs = [
    { 
      icon: CheckCircle, 
      label: 'Commandes terminées', 
      value: '98', 
      delta: '+15%', 
      deltaUp: true, 
      color: 'green' 
    },
    { 
      icon: XCircle, 
      label: 'Commandes annulées', 
      value: '6', 
      delta: '-2%', 
      deltaUp: true, 
      color: 'red', 
      deltaNote: '(Amélioration)' 
    },
    { 
      icon: Users, 
      label: 'Livreurs connectés', 
      value: '24 / 30', 
      delta: '80%', 
      deltaUp: true, 
      color: 'blue' 
    },
    { 
      icon: Store, 
      label: 'Vendeurs actifs', 
      value: '112', 
      delta: '+3', 
      deltaUp: true, 
      color: 'indigo' 
    }
  ];

  const getColorClass = (color) => `stat-icon-${color}`;

  // Données pour le graphique en barres (7 derniers jours)
  const barChartData = [
    { day: 'Lun', value: 65 }, 
    { day: 'Mar', value: 45 }, 
    { day: 'Mer', value: 80 },
    { day: 'Jeu', value: 55 }, 
    { day: 'Ven', value: 90 }, 
    { day: 'Sam', value: 100 }, 
    { day: 'Dim', value: 70 }
  ];

  // Fonction pour obtenir la classe de couleur pour les icônes mini
  const getTextColorClass = (color) => {
    const colorMap = {
      blue: 'text-blue-500',
      green: 'text-green-500',
      orange: 'text-orange-500',
      purple: 'text-purple-500',
      red: 'text-red-500',
      indigo: 'text-indigo-500'
    };
    return colorMap[color] || 'text-gray-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="section-container1"
    >
      {/* En-tête */}
      <div className="section-header1">
        <div>
          <h2> Tableau de bord</h2>
          <p className="section-subtitle1">Aperçu global de l'activité de la plateforme en temps réel.</p>
        </div>
        <div className="date-picker">
          <Calendar size={16} />
          <span>Aujourd'hui</span>
          <ChevronDown size={12} />
        </div>
      </div>

      {/* 1. Grille des KPI Principaux */}
      <div className="stats-grid-primary">
        {primaryKPIs.map((stat, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="stat-card"
          >
            <div className="stat-top">
              <div className={`stat-icon ${getColorClass(stat.color)}`}>
                <stat.icon size={20} />
              </div>
              <span className="stat-label">{stat.label}</span>
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-delta">
              <span className={`stat-chip ${stat.deltaUp ? 'chip-up' : 'chip-down'}`}>
                {stat.deltaUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />} 
                {stat.delta}
              </span>
              <span className="delta-text">{stat.deltaNote || 'vs hier'}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 2. Grille des KPI Secondaires */}
      <div className="stats-grid-secondary">
        {secondaryKPIs.map((stat, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (index + 4) * 0.05 }}
            className="stat-card-mini"
          >
            <div className="mini-icon-wrapper">
              <stat.icon size={18} className={getTextColorClass(stat.color)} />
            </div>
            <div className="mini-content">
              <span className="mini-label">{stat.label}</span>
              <span className="mini-value">{stat.value}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 3. Section des Graphiques */}
      <div className="charts-row">
        {/* Graphique en Barres */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="chart-panel"
        >
          <div className="panel-head">
            <h3><Activity size={18} /> Évolution des commandes (7 jours)</h3>
          </div>
          <div className="bar-chart-container">
            {barChartData.map((item, idx) => (
              <div key={idx} className="bar-item">
                <div className="bar-wrapper">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${item.value}%` }}
                    transition={{ duration: 0.8, delay: 0.5 + (idx * 0.1) }}
                    className="bar-fill"
                  />
                </div>
                <span className="bar-label">{item.day}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Graphique Circulaire (Donut) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="chart-panel"
        >
          <div className="panel-head">
            <h3>Répartition du statut des commandes</h3>
          </div>
          <div className="donut-chart-container">
            {/* Conic-gradient crée un vrai camembert sans librairie externe */}
            <div 
              className="donut-chart"
              style={{
                background: `conic-gradient(
                  #2563eb 0% 65%, 
                  #f59e0b 65% 85%, 
                  #ef4444 85% 92%, 
                  #10b981 92% 100%
                )`
              }}
            >
              <div className="donut-hole">
                <span className="donut-total">2 458</span>
                <span className="donut-label">Total</span>
              </div>
            </div>
            <div className="donut-legend">
              <div className="legend-item"><span className="dot blue"></span> Terminées (65%)</div>
              <div className="legend-item"><span className="dot orange"></span> En cours (20%)</div>
              <div className="legend-item"><span className="dot red"></span> Annulées (7%)</div>
              <div className="legend-item"><span className="dot green"></span> En attente (8%)</div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardOverview;