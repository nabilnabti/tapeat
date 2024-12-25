import { 
  collection, 
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  runTransaction,
  query,
  collectionGroup,
  where,
  getDocs,
  doc
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { sendOrderNotification } from './notificationService';

async function generateOrderNumber(restaurantId: string, paymentMethod: string): Promise<string> {
  try {
    if (!restaurantId?.trim()) throw new Error('Restaurant ID is required');
    if (!paymentMethod?.trim()) throw new Error('Payment method is required');

    const counterRef = doc(db, 'restaurants', restaurantId, 'settings', 'orderCounters');

    // Use transaction to ensure atomic counter increment
    const newCounter = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      let counter = 1;
      if (counterDoc.exists()) {
        counter = (counterDoc.data()[paymentMethod] || 0) + 1;
        if (counter > 999) counter = 1; // Reset to 1 after 999
      }
      
      transaction.set(counterRef, {
        [paymentMethod]: counter,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      return counter;
    });

    // Format order number
    const prefix = paymentMethod === 'card' ? 'CB' :
                  paymentMethod === 'cash' ? 'ESP' :
                  paymentMethod === 'apple_pay' ? 'AP' : 'CMD';
    
    return `${prefix}${newCounter.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating order number:', error);
    throw new Error('Failed to generate order number');
  }
}

export async function createOrder(restaurantId: string, orderData: {
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
}) {
  try {
    // Validate required fields
    if (!restaurantId?.trim()) {
      throw new Error('Restaurant ID is required');
    }
    
    if (!Array.isArray(orderData?.items) || orderData.items.length === 0) {
      throw new Error('La commande doit contenir au moins un article');
    }

    if (!orderData.paymentMethod?.trim()) {
      throw new Error('Le moyen de paiement est requis');
    }

    // Get restaurant info first
    const restaurantDoc = await getDoc(doc(db, 'restaurants', restaurantId));
    if (!restaurantDoc.exists()) {
      throw new Error('Restaurant introuvable');
    }

    const restaurantInfo = {
      name: restaurantDoc.data()?.name || 'Restaurant',
      logo: restaurantDoc.data()?.logo || restaurantDoc.data()?.coverImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
      id: restaurantId
    };

    // Clean and validate item data
    const cleanedItems = orderData.items.map(item => ({
      id: item.id,
      name: item.name?.trim() || 'Article',
      price: Number(item.price) || 0,
      quantity: Math.max(1, Number(item.quantity) || 1),
      image: item.image || null,
      menuOptions: item.menuOptions || null
    }));

    // Get table number if present
    const orderTypeData = localStorage.getItem('orderType');
    let orderType = { type: 'takeaway' };
    let tableNumber = null;
    
    try {
      if (orderTypeData) {
        orderType = JSON.parse(orderTypeData);
        if (orderType.table) {
          tableNumber = String(orderType.table);
        }
      }
    } catch (e) {
      console.error('Error parsing order type:', e);
    }

    // Generate order number
    const orderNumber = await generateOrderNumber(restaurantId, orderData.paymentMethod);

    // Validate delivery data if needed
    if (orderData.type === 'delivery' && !orderData.delivery?.address) {
      throw new Error('L\'adresse de livraison est requise');
    }

    // Prepare order data
    const orderToCreate = {
      restaurantId,
      restaurantInfo,
      items: cleanedItems,
      type: orderType.type,
      subtotal: Math.max(0, Number(orderData.subtotal) || 0),
      tax: Math.max(0, Number(orderData.tax) || 0),
      total: Math.max(0, Number(orderData.total) || 0),
      paymentMethod: orderData.paymentMethod,
      status: 'pending',
      paymentStatus: orderData.paymentMethod === 'cash' ? 'pending' : 'paid',
      orderNumber,
      ...(tableNumber && { table: tableNumber }),
      ...(orderData.scheduledTime && { 
        scheduledTime: orderData.scheduledTime 
      }),
      ...(orderData.delivery && {
        delivery: {
          name: String(orderData.delivery.name).trim(),
          address: String(orderData.delivery.address).trim(),
          phone: String(orderData.delivery.phone).trim()
        }
      }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Create order in restaurant's orders collection
    const ordersRef = collection(db, 'restaurants', restaurantId, 'orders');
    const orderRef = await addDoc(ordersRef, orderToCreate);
    const orderId = orderRef.id;

    // If user is authenticated, save to their orders collection
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userOrderRef = doc(db, 'users', currentUser.uid, 'orders', orderId);
      await setDoc(userOrderRef, {
        ...orderToCreate,
        id: orderId
      });
    }

    return orderId;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Une erreur est survenue lors de la création de la commande');
  }
}

export async function updateOrderStatus(orderId: string, status: string): Promise<void> {
  try {
    if (!orderId) throw new Error('Order ID is required');
    
    // Find the restaurant that has this order
    const restaurantsRef = collection(db, 'restaurants');
    const restaurantsSnapshot = await getDocs(restaurantsRef);
    
    let orderRef;
    let orderData;
    
    for (const restaurantDoc of restaurantsSnapshot.docs) {
      const tempOrderRef = doc(db, 'restaurants', restaurantDoc.id, 'orders', orderId);
      const orderDoc = await getDoc(tempOrderRef);
      
      if (orderDoc.exists()) {
        orderRef = tempOrderRef;
        orderData = orderDoc.data();
        break;
      }
    }
    
    if (!orderRef || !orderData) {
      throw new Error('Order not found in any restaurant');
    }

    // Update order status
    await updateDoc(orderRef, {
      status,
      updatedAt: serverTimestamp()
    });

    // Send notification to user
    const currentUser = auth.currentUser;
    if (currentUser) {
      await sendOrderNotification(currentUser.uid, orderId, status);
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}