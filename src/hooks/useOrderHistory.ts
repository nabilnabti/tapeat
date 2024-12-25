import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useRestaurantContext } from '../context/RestaurantContext';
import type { Order } from '../types/firebase';

export function useOrderHistory() {
  const { restaurant } = useRestaurantContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurant?.id) return;

    const ordersRef = collection(db, 'restaurants', restaurant.id, 'history');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching order history:', err);
      setError('Erreur lors du chargement de l\'historique');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [restaurant?.id]);

  return {
    orders,
    loading,
    error
  };
}