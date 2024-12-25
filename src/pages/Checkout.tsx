import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useRestaurantContext } from '../context/RestaurantContext';
import { useOrderContext } from '../context/OrderContext';
import { useCart, type CartItem } from '../context/CartContext';
import OrderSummary from '../components/OrderSummary';
import UpsellModal from '../components/UpsellModal';
import { getSuggestionGroups } from '../utils/suggestionEngine';

export default function Checkout() {
  const navigate = useNavigate();
  const { restaurant, menu = [], themeColor } = useRestaurantContext();
  const { items, total, clearCart, scheduledTime } = useCart();
  const { createOrder } = useOrderContext();
  const [selectedMethod, setSelectedMethod] = useState<string>('card');
  const [showUpsell, setShowUpsell] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const subtotal = total;
  const tax = subtotal * 0.2;
  const finalTotal = subtotal + tax;

  // Filter available payment methods
  const availablePaymentMethods = {
    card: { icon: '💳', label: 'Carte' },
    cash: { icon: '💵', label: 'Espèces' },
    apple_pay: { icon: 'apple-pay', label: 'Apple Pay' }
  };

  const allowedMethods = restaurant?.paymentMethods || [];

  const handlePayment = async () => {
    try {
      setError(null);
      const isRegisterMode = new URLSearchParams(window.location.search).get('mode') === 'register';
      
      // Validation des données
      if (!items?.length) {
        setError('Votre panier est vide');
        return;
      }
      if (!restaurant?.id) {
        throw new Error('Restaurant introuvable');
      }

      // En mode caisse, toujours sur place
      let orderType = isRegisterMode 
        ? { type: 'dine_in', table: 'caisse' }
        : JSON.parse(localStorage.getItem('orderType') || '{"type":"takeaway"}');

      if (!['dine_in', 'takeaway', 'delivery'].includes(orderType.type)) {
        throw new Error('Type de commande invalide');
      }

      // Préparer les données de livraison si nécessaire
      let deliveryInfo = null;
      if (orderType.type === 'delivery') {
        const deliveryData = localStorage.getItem('deliveryInfo');
        if (!deliveryData) {
          throw new Error('Informations de livraison manquantes');
        }
        try {
          deliveryInfo = JSON.parse(deliveryData);
        } catch (e) {
          throw new Error('Informations de livraison invalides');
        }
      }

      // Préparer les données nettoyées
      const orderData = {
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          menuOptions: item.menuOptions
        })),
        type: orderType.type,
        subtotal: subtotal,
        tax: tax,
        total: finalTotal,
        paymentMethod: selectedMethod,
        paymentStatus: selectedMethod === 'cash' ? 'pending' : 'paid',
        scheduledTime,
        ...(deliveryInfo && { delivery: deliveryInfo })
      };

      const orderId = await createOrder(restaurant.id, orderData);
      if (!orderId) {
        throw new Error('Erreur lors de la création de la commande');
      }

      clearCart();
      localStorage.removeItem('deliveryInfo');
      
      navigate(`/order-confirmation${isRegisterMode ? '?mode=register' : ''}`, {
        state: { orderId },
        replace: true
      });
    } catch (error) {
      console.error('Error creating order:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Une erreur est survenue lors de la création de la commande'
      );
    }
  };

  const handleUpsellComplete = () => {
    setShowUpsell(false);
  };

  // Obtenir les suggestions basées sur le panier actuel
  const suggestions = getSuggestionGroups(items, menu);

  return (
    <div className="min-h-screen bg-gray-50 pb-safe">
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white" 
            style={{ backgroundColor: themeColor }}
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <h1 className="text-xl font-semibold text-center">Paiement</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-20">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-6">
          {Object.entries(availablePaymentMethods).map(([method, details]) => {
            const isAllowed = allowedMethods.includes(method);
            const paymentMethod = availablePaymentMethods[method as keyof typeof availablePaymentMethods];
            if (!paymentMethod) return null;
            
            return (
              <button
                key={method}
                onClick={() => setSelectedMethod(method)}
                disabled={!isAllowed}
                className={`p-3 sm:p-4 rounded-xl flex flex-col items-center gap-1 sm:gap-2 border-2 transition-colors ${
                  selectedMethod === method
                    ? 'bg-opacity-10'
                    : isAllowed 
                      ? 'bg-white border-gray-200 hover:border-2'
                      : 'bg-gray-50 border border-gray-200 opacity-50 cursor-not-allowed'
                }`}
                style={selectedMethod === method ? {
                  backgroundColor: `${themeColor}20`,
                  borderColor: themeColor
                } : undefined}
              >
                {method === 'apple_pay' ? (
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Apple_Pay_logo.svg/1920px-Apple_Pay_logo.svg.png"
                    alt="Apple Pay"
                    className="h-6 sm:h-8 object-contain"
                  />
                ) : (
                  <span className="text-xl sm:text-2xl">{details.icon}</span>
                )}
                <span className="text-xs sm:text-sm font-medium">{details.label}</span>
                {!isAllowed && (
                  <span className="text-[10px] sm:text-xs text-gray-500">Non disponible</span>
                )}
              </button>
            );
          })}
        </div>

        <OrderSummary
          items={items}
          subtotal={subtotal}
          tax={tax}
          total={finalTotal}
          themeColor={themeColor}
        />

        <button
          onClick={handlePayment}
          className="w-full text-white py-2.5 sm:py-3 rounded-xl font-medium"
          style={{ backgroundColor: themeColor }}
        >
          Payer {finalTotal.toFixed(2)} €
        </button>
      </div>

      {/* Modal de suggestions */}
      {showUpsell && items.length > 0 && suggestions.length > 0 && (
        <UpsellModal
          suggestions={suggestions}
          onClose={handleUpsellComplete}
          onComplete={handleUpsellComplete}
        />
      )}
    </div>
  );
}