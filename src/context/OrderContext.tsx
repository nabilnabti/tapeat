import { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { createOrder as createFirebaseOrder } from '../services/orderService';
import { sendOrderNotification } from '../services/notificationService';
import { useRestaurantContext } from './RestaurantContext';
import { useAuth } from './AuthContext';
import type { Order } from '../types/firebase';

interface OrderContextType {
  orders: Order[];
  loading: boolean;
  error: string | null;
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
  createOrder: (
    restaurantId: string,
    orderData: {
      items: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
        image?: string;
        menuOptions?: any;
      }>;
      type: 'dine_in' | 'takeaway' | 'delivery';
      subtotal: number;
      tax: number;
      total: number;
      paymentMethod: string;
      scheduledTime?: { date: string; time: string } | null;
      delivery?: {
        name: string;
        address: string;
        phone: string;
      };
    }
  ) => Promise<string>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { restaurant } = useRestaurantContext();
  const [lastUpdatedOrder, setLastUpdatedOrder] = useState<{id: string; status: string} | null>(null);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      if (!restaurant?.id) throw new Error('Restaurant ID is required');
      if (!orderId) throw new Error('Order ID is required');
      
      const orderRef = doc(db, 'restaurants', restaurant.id, 'orders', orderId);
      await updateDoc(orderRef, {
        status,
        updatedAt: serverTimestamp()
      });

      const order = orders.find(o => o.id === orderId);
      if (order?.userId) {
        await sendOrderNotification(order.userId, orderId, status);
      }
      return true;
    } catch (error) {
      console.error('Error updating order status:', error instanceof Error ? error.message : error);
      throw new Error('Failed to update order status');
    }
  };
  useEffect(() => {
    if (!restaurant?.id) return;

    const q = query(
      collection(db, 'restaurants', restaurant.id, 'orders'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        restaurantId: restaurant.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Order[];

      // Envoyer des notifications pour les changements de statut
      if (user?.uid) {
        ordersData.forEach(order => {
          const oldOrder = orders.find(o => o.id === order.id);
          // Vérifier si c'est une mise à jour différente de la dernière
          if (oldOrder && 
              oldOrder.status !== order.status && 
              (!lastUpdatedOrder || 
               lastUpdatedOrder.id !== order.id || 
               lastUpdatedOrder.status !== order.status)) {
            setLastUpdatedOrder({ id: order.id, status: order.status });
            sendOrderNotification(user.uid, order.id, order.status);
          }
        });
      }
      
      setOrders(ordersData);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching orders:', err);
      setError('Erreur lors du chargement des commandes');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [restaurant?.id, user?.uid, lastUpdatedOrder]);

  const createOrder = async (restaurantId: string, orderData: any) => {
    try {
      return await createFirebaseOrder(restaurantId, orderData);
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  return (
    <OrderContext.Provider value={{
      orders,
      loading,
      error,
      createOrder,
      updateOrderStatus
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrderContext() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrderContext must be used within OrderProvider');
  }
  return context;
}