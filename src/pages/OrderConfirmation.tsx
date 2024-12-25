import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Receipt } from 'lucide-react';
import { useOrderContext } from '../context/OrderContext';
import { useRestaurantContext } from '../context/RestaurantContext';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Order } from '../types/firebase';
import OrderSummary from '../components/OrderSummary';

export default function OrderConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { restaurant, themeColor } = useRestaurantContext();
  const { orders } = useOrderContext();
  const [searchParams] = useSearchParams();
  const isRegisterMode = searchParams.get('mode') === 'register';
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const orderId = location.state?.orderId;

  useEffect(() => {
    if (!orderId) {
      navigate(isRegisterMode ? `/restaurant?restaurantId=${restaurant?.id}&mode=register` : '/menu');
      return;
    }

    const order = orders.find(o => o.id === orderId);
    if (order) {
      setOrderDetails(order);

      // En mode caisse, rediriger vers la page restaurant
      if (isRegisterMode) {
        setRedirecting(true);
        const timer = setTimeout(() => {
          navigate(`/restaurant?restaurantId=${restaurant?.id}&mode=register`);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [orderId, orders, navigate, isRegisterMode, restaurant?.id]);

  const handleTrackOrder = () => {
    if (orderId) {
      navigate(`/track-order/${orderId}`, { state: { order: orderDetails } });
    }
  };

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="flex items-center p-4">
          <button 
            onClick={() => {
              if (isRegisterMode) {
                navigate(`/restaurant?restaurantId=${restaurant?.id}&mode=register`);
              } else {
                navigate('/menu');
              }
            }}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: themeColor }}
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <h1 className="ml-4 text-xl font-semibold">Confirmation de commande</h1>
        </div>
      </div>

      <div className="pt-20 px-4 pb-24">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" 
               style={{ backgroundColor: `${themeColor}20` }}>
            <Receipt className="h-8 w-8" style={{ color: themeColor }} />
          </div>
          <h2 className="text-4xl font-bold mb-2" style={{ color: themeColor }}>
            #{orderDetails.orderNumber}
          </h2>
          <p className="text-gray-600 mb-4">Numéro de commande</p>
        </div>

        <OrderSummary
          items={orderDetails.items}
          subtotal={orderDetails.subtotal}
          tax={orderDetails.tax}
          total={orderDetails.total}
          themeColor={themeColor}
        />

        {!isRegisterMode ? (
          <div className="space-y-3 mt-6">
            <button
              onClick={handleTrackOrder}
              className="w-full text-white rounded-xl py-3 font-medium"
              style={{ backgroundColor: themeColor }}
            >
              Suivre ma commande
            </button>
            <button
              onClick={() => navigate('/menu')}
              className="w-full bg-gray-100 text-gray-600 rounded-xl py-3 font-medium"
            >
              Retour au menu
            </button>
          </div>
        ) : (
          <div className="text-center mt-6">
            <p className="text-gray-500">
              {redirecting ? 'Redirection en cours...' : 'Redirection automatique dans quelques secondes...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}