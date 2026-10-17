// src/hooks/useFailedOrdersPolling.jsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../services/apiClient';

const POLLING_INTERVAL = 15000;

export const useFailedOrdersPolling = (enabled = true) => {
  const navigate = useNavigate();
  const [failedOrdersCount, setFailedOrdersCount] = useState(0);
  const pollingRef = useRef(null);
  const seenIdsRef = useRef(new Set());
  const isInitializedRef = useRef(false);

  console.log('🎣 Hook useFailedOrdersPolling - enabled:', enabled);

  const checkFailedOrders = useCallback(async () => {
    console.log('🔍 Polling checkFailedOrders...');
    
    try {
      const response = await apiClient.get('/failed-orders/recent');
      console.log(' Réponse API:', response.data);
      
      if (!response.data?.success) {
        console.warn(' API success=false');
        return;
      }

      const failedOrders = response.data.data || [];
      const count = failedOrders.length;
      
      console.log(` ${count} commandes trouvées, IDs:`, failedOrders.map(o => o.id));
      
      setFailedOrdersCount(count);

      // Premier chargement : mémoriser sans notifier
      if (!isInitializedRef.current) {
        console.log(' Initialisation - mémorisation des IDs existants');
        failedOrders.forEach(order => seenIdsRef.current.add(order.id));
        isInitializedRef.current = true;
        return;
      }

      // Détecter les nouvelles
      const newOrders = failedOrders.filter(
        order => !seenIdsRef.current.has(order.id)
      );

      

      if (newOrders.length > 0) {
        newOrders.forEach((order, index) => {
          setTimeout(() => {
            showFailedOrderToast(order);
          }, index * 800);
        });

        newOrders.forEach(order => seenIdsRef.current.add(order.id));
      }
    } catch (error) {
      console.error(' Erreur polling:', error);
    }
  }, [navigate]);

  const showFailedOrderToast = (order) => {
    const reference = order.order?.reference || `#${order.order_id}`;
    const clientName = order.user?.name || 'Client';
    const orderId = order.order_id;

    //  VERSION SIMPLIFIÉE pour tester
    toast(
      () => (
        <div 
          onClick={() => {
            toast.dismiss();
            navigate(`/dashboard/commandes/${orderId}`);
          }}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ fontWeight: '700', marginBottom: '4px' }}>
             Course non attribuée
          </div>
          <div style={{ fontSize: '13px' }}>
            <strong>{reference}</strong> • {clientName}
          </div>
          <div style={{ fontSize: '11px', color: '#f97316', marginTop: '4px' }}>
            Cliquez pour attribuer →
          </div>
        </div>
      ),
      {
        duration: 6000,
        position: 'top-right',
        style: {
          background: '#fef3c7',
          color: '#92400e',
          border: '1px solid #f59e0b',
          borderRadius: '12px',
          padding: '14px 18px',
        },
      }
    );
  };

  useEffect(() => {
    if (!enabled) {
      return;
    }

    checkFailedOrders();
    pollingRef.current = setInterval(checkFailedOrders, POLLING_INTERVAL);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [enabled, checkFailedOrders]);

  return { failedOrdersCount };
};