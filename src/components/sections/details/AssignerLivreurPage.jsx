import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Truck, User, CheckCircle, Package, 
  Star, TrendingUp, Clock, AlertTriangle, Loader2
} from 'lucide-react';

import apiClient from '../../../services/apiClient';
import Loader from '../../../utils/Loader';
import toast from 'react-hot-toast';

const AssignerLivreurPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // On récupère les données passées via le lien, sinon on les chargera via API
  const initialOrder = location.state?.orderData;
  
  const [order, setOrder] = useState(initialOrder || null);
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(!initialOrder);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedLivreurId, setSelectedLivreurId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Si on n'a pas les données de la commande, on les charge
        if (!order) {
          const ordersRes = await apiClient.get('/dashboard/orders/pending-attribution');
          const foundOrder = ordersRes.data.data.find(o => o.id === parseInt(orderId));
          if (foundOrder) {
            setOrder({
              id: foundOrder.reference || `CMD-${foundOrder.id}`,
              rawId: foundOrder.id,
              client: foundOrder.dropoff_name || 'Client inconnu',
              pickup: foundOrder.pickup_address || 'Adresse inconnue',
              dropoff: foundOrder.dropoff_address || 'Adresse inconnue',
              montant: foundOrder.total_amount ? `${new Intl.NumberFormat('fr-FR').format(foundOrder.total_amount)} FCFA` : 'N/A',
              tempsAttente: foundOrder.wait_time_minutes || 0,
              distance: foundOrder.distance_km ? `${foundOrder.distance_km} km` : 'N/A',
              pickupZone: foundOrder.pickup_city || foundOrder.pickup_address?.split(',').pop()?.trim() || ''
            });
          } else {
            toast.error("Commande introuvable.");
            navigate('/admin/attributions');
            return;
          }
        }

        // Chargement des livreurs
        const driversRes = await apiClient.get('/dashboard/livreurs/disponibles');
        const formattedDrivers = (driversRes.data.data || []).map(driver => ({
          id: driver.id,
          nom: driver.user?.name || 'Inconnu',
          zone: Array.isArray(driver.zones_livraison) ? driver.zones_livraison.join(', ') : (driver.city || 'Non définie'),
          vehicule: 'Moto',
          note: driver.note_moyenne || 0,
          taux: driver.taux_acceptation ? `${driver.taux_acceptation}%` : 'N/A',
        }));
        setDrivers(formattedDrivers);

        // Pré-sélectionner le meilleur livreur
        if (order) {
          const defaultLivreur = formattedDrivers.find(l => 
            l.zone.includes(order.pickupZone) || order.pickupZone.includes(l.zone.split(' ')[0])
          );
          setSelectedLivreurId(defaultLivreur ? defaultLivreur.id : formattedDrivers[0]?.id || null);
        }

      } catch (err) {
        console.error("Erreur chargement:", err);
        toast.error("Impossible de charger les données.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [orderId, order, navigate]);

  const handleConfirm = async () => {
    if (!selectedLivreurId || !order) return;
    setIsProcessing(true);
    try {
      await apiClient.post(`/dashboard/orders/${order.rawId}/assign`, {
        livreur_id: selectedLivreurId
      });
      toast.success("Commande attribuée avec succès !");
      navigate('/admin/attributions'); // Retour à la liste
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'attribution.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return <Loader text="Préparation de l'attribution..." fullScreen={false} size="lg" />;
  if (!order) return null;

  const getWaitTimeClass = (minutes) => {
    if (minutes >= 15) return 'text-red-600 font-bold';
    if (minutes >= 10) return 'text-orange-500 font-semibold';
    return 'text-gray-600';
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="section-container1" style={{ maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Header avec retour */}
      <div style={{ marginBottom: '24px' }}>
        <Link to="/dashboard/attributions" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px', textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Retour à la liste
        </Link>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Attribution de la commande {order.id}</h2>
        <p style={{ color: '#64748b', marginTop: '4px' }}>Sélectionnez le livreur le plus adapté pour cette course.</p>
      </div>

      {/* 1. Carte Résumé de la Commande */}
      <div className="vd-card" style={{ marginBottom: '32px', borderLeft: '4px solid #ea580c' }}>
        <div className="vd-card-header" style={{ backgroundColor: '#fff7ed' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: '#9a3412' }}>
            <Package size={18} /> Détails de la course
          </h3>
          {order.tempsAttente >= 15 && (
            <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={14} /> URGENT
            </span>
          )}
        </div>
        <div className="vd-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Client</div>
              <div style={{ fontWeight: '600', fontSize: '15px' }}>{order.client}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Montant</div>
              <div style={{ fontWeight: '700', fontSize: '18px', color: '#059669' }}>{order.montant}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Distance</div>
              <div style={{ fontWeight: '600', fontSize: '15px' }}>{order.distance}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Temps d'attente</div>
              <div className={getWaitTimeClass(order.tempsAttente)} style={{ fontWeight: '700', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} /> {order.tempsAttente} min
              </div>
            </div>
          </div>
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px dashed #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', marginTop: '6px' }}></div>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Départ</div>
                <div style={{ fontWeight: '500' }}>{order.pickup}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', marginTop: '6px' }}></div>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Arrivée</div>
                <div style={{ fontWeight: '500' }}>{order.dropoff}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sélection du Livreur */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <User size={18} /> Choisir un livreur disponible
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {drivers.map((livreur) => (
          <div 
            key={livreur.id}
            onClick={() => setSelectedLivreurId(livreur.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '16px',
              border: selectedLivreurId === livreur.id ? '2px solid #2563eb' : '1px solid #e2e8f0',
              borderRadius: '12px',
              cursor: 'pointer',
              backgroundColor: selectedLivreurId === livreur.id ? '#eff6ff' : '#ffffff',
              transition: 'all 0.2s',
              boxShadow: selectedLivreurId === livreur.id ? '0 4px 6px -1px rgba(37, 99, 235, 0.1)' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#475569', fontSize: '18px' }}>
                {livreur.nom.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>{livreur.nom}</div>
                <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <MapPin size={12} /> {livreur.zone}
                </div>
              </div>
              {selectedLivreurId === livreur.id && <CheckCircle size={20} color="#2563eb" />}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#475569' }}>
                <Truck size={14} /> {livreur.vehicule}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: '600', fontSize: '13px' }}>
                  <Star size={14} fill="#f59e0b" /> {livreur.note}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '12px', fontWeight: '600' }}>
                  <TrendingUp size={12} /> {livreur.taux}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
        <Link to="/dashboard/attributions" className="btn btn-secondary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Annuler
        </Link>
        <button 
          onClick={handleConfirm} 
          disabled={!selectedLivreurId || isProcessing}
          className="btn btn-primary"
          style={{ 
            padding: '10px 24px', 
            background: (!selectedLivreurId || isProcessing) ? '#93c5fd' : '#2563eb', 
            cursor: (!selectedLivreurId || isProcessing) ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
          {isProcessing ? 'Attribution en cours...' : 'Confirmer l\'attribution'}
        </button>
      </div>
    </motion.div>
  );
};

export default AssignerLivreurPage;