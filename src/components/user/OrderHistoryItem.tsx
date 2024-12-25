import { Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useCart } from '../../context/CartContext';

interface RestaurantInfo {
  name: string;
  logo: string;
  id: string;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderHistoryItemProps {
  order: {
    id: string;
    orderNumber: string;
    type: 'dine_in' | 'takeaway' | 'delivery';
    status: string;
    restaurantInfo: RestaurantInfo;
    items: OrderItem[];
    total: number;
    createdAt: Date;
  };
}

export default function OrderHistoryItem({ order }: OrderHistoryItemProps) {
  const navigate = useNavigate();
  const { addItems, clearCart } = useCart();
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (!order.id || !order.restaurantInfo?.id) return;

    // Subscribe to real-time updates for this order
    const orderRef = doc(db, 'restaurants', order.restaurantInfo.id, 'orders', order.id);
    const unsubscribe = onSnapshot(orderRef, (doc) => {
      if (doc.exists()) {
        setCurrentStatus(doc.data().status);
      }
    });

    return () => unsubscribe();
  }, [order.id, order.restaurantInfo?.id]);

  const handleClick = () => {
    navigate(`/track-order/${order.id}`, { state: { order } });
  };

  const handleReorder = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!order.restaurantInfo?.id) {
      console.error('Restaurant ID is missing from order');
      return;
    }

    // Clear existing cart
    clearCart();

    // Save order type to localStorage
    const orderTypeData = {
      type: order.type,
      ...(order.type === 'dine_in' && order.table ? { table: order.table } : {})
    };
    localStorage.setItem('orderType', JSON.stringify(orderTypeData));

    // Save delivery info if it exists
    if (order.type === 'delivery' && order.delivery) {
      localStorage.setItem('deliveryInfo', JSON.stringify(order.delivery));
    }
    
    // Add all items from the order
    addItems(order.items);
    
    // Navigate to menu page with the correct restaurant ID
    navigate(`/menu?restaurantId=${order.restaurantInfo.id}`);
  };
  return (
    <div 
      onClick={handleClick}
      className="bg-white rounded-xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-all relative"
    >
      <div className="flex items-start gap-4 p-4">
        {/* Logo du restaurant */}
        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
          {order.restaurantInfo ? (
          <img
            src={order.restaurantInfo?.logo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=200&h=200'}
            alt={order.restaurantInfo?.name || 'Restaurant'}
            className="w-full h-full object-cover"
          />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400">Logo</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* En-tête avec numéro de commande */}
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-bold text-emerald-600">#{order.orderNumber}</span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${
                  currentStatus === 'completed' ? 'bg-emerald-100 text-emerald-800' : 
                  currentStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {currentStatus === 'completed' ? 'Terminée' :
                   currentStatus === 'cancelled' ? 'Annulée' :
                   currentStatus === 'pending' ? 'En attente' :
                   currentStatus === 'preparing' ? 'En préparation' :
                   currentStatus === 'ready' ? 'Prête' :
                   currentStatus}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900">
                {order.restaurantInfo?.name || 'Restaurant'}
              </h3>
            </div>
          </div>

          {/* Liste des articles */}
          <p className="text-sm text-gray-600 mb-2 line-clamp-1">
            {order.items?.map(item => `${item.quantity}x ${item.name}`).join(', ') || 'Commande'}
          </p>

          {/* Prix et date */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-900 font-semibold">
              {Number(order.total || 0).toFixed(2)} €
            </span>
            <span className="text-gray-500">
              {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })} • {itemCount} article{itemCount > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex border-t">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Implement rating functionality
          }}
          className="flex-1 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Noter
        </button>
        <div className="w-px bg-gray-100" />
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleReorder(e);
          }}
          className="flex-1 py-3 text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
        >
          Commander à nouveau
        </button>
      </div>
    </div>
  );
}