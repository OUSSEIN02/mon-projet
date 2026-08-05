import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, ChevronDown, Download, Filter, Users, ShoppingCart, 
  Truck, DollarSign, Star, Clock, Activity, PieChart, Award, 
  Zap, Target, MapPin, ChevronRight
} from 'lucide-react';

import apiClient from '../../../services/apiClient';
import Loader from '../../../utils/Loader';

// 1. CRÉATION D'UN DICTIONNAIRE D'ICÔNES
// Cela permet de convertir la chaîne de caractères venant du backend 
// en vrai composant React (PascalCase)
const iconMap = {
  ShoppingCart: ShoppingCart,
  Users: Users,
  Truck: Truck,
  DollarSign: DollarSign,
  Star: Star,
  Clock: Clock,
  Target: Target,
  Award: Award,
  Zap: Zap,
  MapPin: MapPin,
  Activity: Activity,
  PieChart: PieChart
};

const StatistiquesSection = () => {
  const [period, setPeriod] = useState('semaine');
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get('/dashboard/statistiques', {
          params: { period: period }
        });
        setStatsData(response.data.data);
      } catch (err) {
        console.error("Erreur chargement statistiques:", err);
        setError("Impossible de charger les statistiques.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [period]);

  // Données de secours
  const chartData = statsData?.chart_data || { labels: [], commandes: [], revenus: [] };
  const pieData = statsData?.pie_data || [];
  const performanceStats = statsData?.performance_stats || [];
  const topVendeurs = statsData?.top_vendeurs || [];
  const topLivreurs = statsData?.top_livreurs || [];
  const extraStats = statsData?.extra_stats || [];

  // 2. CORRECTION DU NAN : Valeur par défaut à 1 si le tableau est vide
  const maxValue = chartData.commandes && chartData.commandes.length > 0 
    ? Math.max(...chartData.commandes) 
    : 1;

  const getPeriodLabel = () => {
    const labels = { semaine: 'Cette semaine', mois: 'Ce mois', annee: 'Cette année' };
    return labels[period] || 'Cette semaine';
  };

  if (isLoading) return <Loader text="Chargement des statistiques..." fullScreen={false} size="lg" />;
  if (error) {
    return (
      <div className="section-container text-center p-8">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">Réessayer</button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="section-container">
      {/* Header avec filtres (inchangé) */}
      <div className="section-header1">
        <div>
          <h2>Statistiques</h2>
          <p className="section-subtitle1">Analyse détaillée des performances de la plateforme</p>
        </div>
        <div className="section-actions1">
          <div className="period-selector" style={{ position: 'relative', marginRight: '12px' }}>
            <button 
              className="date-picker"
              onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            >
              <Calendar size={16} />
              {getPeriodLabel()}
              <ChevronDown size={12} style={{ transform: isPeriodDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            <AnimatePresence>
              {isPeriodDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="dropdown-menu"
                  style={{ position: 'absolute', top: '100%', right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', minWidth: '180px', zIndex: 10, marginTop: '4px' }}
                >
                  {['semaine', 'mois', 'annee'].map((p) => (
                    <button key={p} onClick={() => { setPeriod(p); setIsPeriodDropdownOpen(false); }}
                      style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: period === p ? '#f1f5f9' : 'white', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: period === p ? '#2563eb' : '#0f172a', fontWeight: period === p ? '600' : '400' }}>
                      {p === 'semaine' ? 'Cette semaine' : p === 'mois' ? 'Ce mois' : 'Cette année'}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button className="btn-secondary"><Download size={18} /> Exporter</button>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {performanceStats.map((stat, index) => {
          // 3. RÉCUPÉRATION SÉCURISÉE DU COMPOSANT ICÔNE
          const IconComponent = iconMap[stat.icon] || ShoppingCart;
          
          return (
            <motion.div key={index} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}
              className="stat-card" style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
              <div className="stat-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div className={`stat-icon ${stat.up ? 'stat-icon-green' : 'stat-icon-red'}`} style={{ padding: '8px', borderRadius: '8px', background: stat.up ? '#dcfce7' : '#fee2e2', color: stat.up ? '#16a34a' : '#dc2626' }}>
                  {/* Utilisation du composant résolu */}
                  <IconComponent size={17} />
                </div>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{stat.label}</span>
              </div>
              <div className="stat-value" style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>{stat.value}</div>
              <div className="stat-delta" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span className={`stat-chip ${stat.up ? 'chip-up-green' : 'chip-up-red'}`} style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', background: stat.up ? '#dcfce7' : '#fee2e2', color: stat.up ? '#16a34a' : '#dc2626' }}>
                  {stat.up ? '↑' : '↓'} {stat.change}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>{stat.detail}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Graphiques principaux */}
      <div className="panels-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Graphique en barres */}
        <div className="panel" style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
          <div className="panel-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>Évolution des commandes</h3>
            <div className="select-fake" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b' }}>
              <Activity size={14} />
              {period === 'semaine' ? 'Hebdomadaire' : period === 'mois' ? 'Mensuel' : 'Annuel'}
            </div>
          </div>
          <div className="chart-placeholder" style={{ minHeight: '250px' }}>
            {chartData.labels.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '200px', paddingTop: '20px' }}>
                {chartData.commandes.map((value, index) => {
                  const height = (value / maxValue) * 180; // Plus de NaN grâce au fallback de maxValue
                  const isHighest = value === maxValue;
                  return (
                    <motion.div key={index} initial={{ height: 0 }} animate={{ height: height + 20 }} transition={{ duration: 0.8, delay: index * 0.05 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 + 0.3 }} style={{ fontSize: '11px', fontWeight: '600', color: isHighest ? '#2563eb' : '#64748b' }}>
                        {value}
                      </motion.div>
                      <div style={{ width: '100%', height: height, background: isHighest ? 'linear-gradient(180deg, #2563eb, #3b82f6)' : 'linear-gradient(180deg, #f59e0b, #f97316)', borderRadius: '6px 6px 0 0', opacity: isHighest ? 1 : 0.7, minHeight: '20px' }} />
                      <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>{chartData.labels[index]}</span>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#94a3b8' }}>Aucune donnée disponible pour cette période.</div>
            )}
          </div>
        </div>

        {/* Graphique circulaire */}
        <div className="panel" style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
          <div className="panel-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>Répartition des commandes</h3>
            <PieChart size={18} style={{ color: '#64748b' }} />
          </div>
          <div className="donut-placeholder" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '250px' }}>
            {pieData.length > 0 ? (
              <>
                <div style={{ position: 'relative', width: '180px', height: '180px', marginBottom: '20px' }}>
                  {pieData.map((item, index) => {
                    const circumference = 2 * Math.PI * 80;
                    const strokeDasharray = (item.value / 100) * circumference;
                    const offset = pieData.slice(0, index).reduce((acc, curr) => acc + (curr.value / 100) * circumference, 0);
                    return (
                      <svg key={index} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                        <circle cx="90" cy="90" r="80" fill="none" stroke={item.color} strokeWidth="30" strokeDasharray={`${strokeDasharray} ${circumference - strokeDasharray}`} strokeDashoffset={-offset} style={{ transition: 'stroke-dashoffset 1s ease' }} />
                      </svg>
                    );
                  })}
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>{performanceStats.find(s => s.label === 'Commandes totales')?.value?.replace(/\s/g, '') || '0'}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Commandes</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {pieData.map((item) => (
                    <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
                      <span style={{ width: '12px', height: '12px', background: item.color, borderRadius: '50%' }}></span>
                      {item.label} {item.value}%
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>Aucune donnée disponible.</div>
            )}
          </div>
        </div>
      </div>

      {/* Indicateurs de performance supplémentaires */}
      {extraStats.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {extraStats.map((item, index) => {
            // 3. RÉCUPÉRATION SÉCURISÉE DU COMPOSANT ICÔNE (bis)
            const ExtraIconComponent = iconMap[item.icon] || Target;
            
            return (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>{item.label}</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{item.value}</div>
                  <div style={{ fontSize: '12px', color: item.up ? '#16a34a' : '#dc2626' }}>{item.up ? '↑' : '↓'} {item.change}</div>
                </div>
                <div style={{ padding: '10px', borderRadius: '10px', background: '#f1f5f9', color: '#2563eb' }}>
                  {/* Utilisation du composant résolu */}
                  <ExtraIconComponent size={20} />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Classements (Top Vendeurs & Top Livreurs) - Inchangé car pas d'icônes dynamiques ici */}
      <div className="panels-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Top Vendeurs */}
        <div className="panel" style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
          <div className="panel-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>🏆 Top Vendeurs</h3>
          </div>
          <div className="perf-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topVendeurs.length > 0 ? topVendeurs.map((vendeur, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="perf-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', background: idx === 0 ? '#fef3c7' : 'transparent', border: idx === 0 ? '1px solid #f59e0b' : '1px solid transparent' }}>
                <div className="perf-label" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: '700', color: idx < 3 ? '#f59e0b' : '#94a3b8', fontSize: '14px', width: '24px' }}>#{idx + 1}</span>
                  <div>
                    <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>{vendeur.nom}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
                      <span><Star size={12} style={{ color: '#f59e0b', display: 'inline' }} /> {vendeur.note}</span>
                      <span>{vendeur.evolution}</span>
                    </div>
                  </div>
                </div>
                <div className="perf-right" style={{ textAlign: 'right' }}>
                  <div className="perf-value" style={{ fontWeight: '600', color: '#0f172a' }}>{vendeur.commandes}</div>
                  <div className="perf-delta" style={{ fontSize: '11px', color: '#94a3b8' }}>{vendeur.revenu}</div>
                </div>
              </motion.div>
            )) : <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>Aucune donnée disponible.</p>}
          </div>
        </div>

        {/* Top Livreurs */}
        <div className="panel" style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
          <div className="panel-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>🚚 Top Livreurs</h3>
          </div>
          <div className="perf-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topLivreurs.length > 0 ? topLivreurs.map((livreur, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="perf-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', background: idx === 0 ? '#fef3c7' : 'transparent', border: idx === 0 ? '1px solid #f59e0b' : '1px solid transparent' }}>
                <div className="perf-label" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: '700', color: idx < 3 ? '#f59e0b' : '#94a3b8', fontSize: '14px', width: '24px' }}>#{idx + 1}</span>
                  <div>
                    <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>{livreur.nom}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
                      <span><Star size={12} style={{ color: '#f59e0b', display: 'inline' }} /> {livreur.note}</span>
                      <span>{livreur.temps}</span>
                      <span style={{ color: '#16a34a' }}>{livreur.taux}</span>
                    </div>
                  </div>
                </div>
                <div className="perf-right" style={{ textAlign: 'right' }}>
                  <div className="perf-value" style={{ fontWeight: '600', color: '#0f172a' }}>{livreur.livraisons}</div>
                  <div className="perf-delta" style={{ fontSize: '11px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                    <TrendingUp size={12} /> livraisons
                  </div>
                </div>
              </motion.div>
            )) : <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>Aucune donnée disponible.</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StatistiquesSection;