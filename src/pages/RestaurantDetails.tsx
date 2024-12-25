import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, Phone, MapPin, Star, UtensilsCrossed, ShoppingBag, Truck, Bike, ChevronLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useRestaurantContext } from '../context/RestaurantContext';
import { getRestaurant } from '../services/restaurantService';
import ScheduleModal from '../components/ScheduleModal';
import DeliveryForm from '../components/DeliveryForm';

export default function RestaurantDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const restaurantId = searchParams.get('restaurantId');
  const isRegisterMode = searchParams.get('mode') === 'register';
  const { themeColor } = useRestaurantContext();
  const tableNumber = searchParams.get('table');
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setScheduledTime, scheduledTime } = useCart();
  const [orderTiming, setOrderTiming] = useState<'now' | 'later' | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [selectedOrderType, setSelectedOrderType] = useState<string | null>(null);

  // Rediriger automatiquement vers le menu en mode caisse
  useEffect(() => {
    if (isRegisterMode && restaurantId) {
      // Bloquer la navigation et le retour arrière
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', () => {
        window.history.pushState(null, '', window.location.href);
      });

      return () => {
        window.removeEventListener('popstate', () => {
          window.history.pushState(null, '', window.location.href);
        });
      };
      return;
    }
  }, [isRegisterMode, restaurantId]);
  const handleEatInOrTakeOut = (option: string) => {
    if (!restaurantId || !restaurant) {
      return;
    }
    setSelectedOrderType(option);

    const orderData = {
      type: option,
      ...(option === 'dine_in' && tableNumber ? { table: tableNumber } : {})
    };

    try {
      localStorage.setItem('orderType', JSON.stringify(orderData));
      navigate(`/menu?restaurantId=${restaurantId}${isRegisterMode ? '&mode=register' : ''}`);
    } catch (err) {
      console.error('Error storing order type:', err);
      setError('Une erreur est survenue');
    }
  };

  useEffect(() => {
    // En mode caisse, définir automatiquement le type de commande sur place
    if (isRegisterMode) {
      // Bloquer la navigation et le retour arrière
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', () => {
        window.history.pushState(null, '', window.location.href);
      });
    }
  }, [isRegisterMode]);


  useEffect(() => {
    async function loadRestaurant() {
      if (!restaurantId) {
        setError('Restaurant ID is required');
        return;
      }

      try {
        setLoading(true);
        const data = await getRestaurant(restaurantId);
        setRestaurant(data);
      } catch (err) {
        console.error('Error loading restaurant:', err);
        setError('Failed to load restaurant');
      } finally {
        setLoading(false);
      }
    }

    loadRestaurant();
  }, [restaurantId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Restaurant not found'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const handleTimingSelect = (timing: 'now' | 'later') => {
    setOrderTiming(timing);
    if (timing === 'later') {
      setShowScheduleModal(true);
    }
  };

  const handleScheduleConfirm = (date: string, time: string) => {
    setScheduledTime({ date, time });
    setShowScheduleModal(false);
  };

  const handleDelivery = () => {
    setShowDeliveryForm(true);
  };

  const handleDeliverySubmit = async (data: any) => {
    localStorage.setItem('deliveryInfo', JSON.stringify(data));
    localStorage.setItem('orderType', 'delivery');
    navigate(`/menu?restaurantId=${restaurantId}`);
  };

  const formatScheduledTime = () => {
    if (!scheduledTime) return 'Choisir une date et heure';

    const formattedDate = new Date(scheduledTime.date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });

    return `${formattedDate} à ${scheduledTime.time}`;
  };

  return (
    <div className="min-h-screen bg-white">
      <button
        onClick={() => {
          if (isRegisterMode) {
            navigate(`/restaurant?restaurantId=${restaurantId}&mode=register`);
          } else {
            navigate(-1);
          }
        }}
        className="fixed top-4 left-4 z-50 w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <div className="relative h-48">
        <img
          src={restaurant?.coverImage || "https://images.unsplash.com/photo-1542574271-7f3b92e6c821?auto=format&fit=crop&w=1200&q=80"}
          alt="Restaurant background"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="px-4 -mt-20 relative">
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <img
                  src={restaurant?.logo || "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=200&h=200"}
                  alt="Restaurant logo"
                  className="w-16 h-16 rounded-full border-4 border-white shadow-md"
                />
                <div>
                  <h1 className="text-xl font-bold">{restaurant?.name || "Urban Burger"}</h1>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-medium">4.5</span>
                    <span className="text-gray-500">(500+ avis)</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{restaurant?.address || "85 Rue Ferrari, 13005 Marseille"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>11:00 - 23:00</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${restaurant?.phone}`}>{restaurant?.phone || "04 91 47 85 62"}</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4">
            {orderTiming 
              ? "Comment souhaitez-vous être servi ?"
              : "Comment souhaitez-vous commander ?"}
          </h2>

          {isRegisterMode ? (
            // En mode caisse, afficher directement les options de service
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <button
                  onClick={() => handleEatInOrTakeOut('dine_in')}
                  className="w-full bg-white rounded-xl p-4 shadow-md flex flex-col items-center gap-2 border-2 border-transparent hover:border-2 transition-colors"
                  style={{ borderColor: selectedOrderType === 'dine_in' ? themeColor : 'transparent' }}
                >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${themeColor}20`, color: themeColor }}>
                    <UtensilsCrossed className="h-8 w-8" />
                  </div>
                  <span className="font-medium">Sur place</span>
                </button>
              </div>

              <div className="relative">
                <button
                  onClick={() => handleEatInOrTakeOut('takeaway')}
                  className="w-full bg-white rounded-xl p-4 shadow-md flex flex-col items-center gap-2 border-2 border-transparent hover:border-2 transition-colors"
                  style={{ borderColor: selectedOrderType === 'takeaway' ? themeColor : 'transparent' }}
                >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${themeColor}20`, color: themeColor }}>
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                  <span className="font-medium">À emporter</span>
                </button>
              </div>
            </div>
          ) : !orderTiming ? (
            // Options de timing et livraison
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleTimingSelect('now')}
                className="bg-white rounded-xl p-4 shadow-md flex flex-col items-center gap-2 border-2 border-transparent hover:border-2 transition-colors"
                style={{ borderColor: orderTiming === 'now' ? themeColor : 'transparent' }}
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center" 
                  style={{ backgroundColor: `${themeColor}20`, color: themeColor }}>
                  <Clock className="h-8 w-8" />
                </div>
                <span className="font-medium">Maintenant</span>
              </button>
              <button
                onClick={() => handleTimingSelect('later')}
                className="bg-white rounded-xl p-4 shadow-md flex flex-col items-center gap-2 border-2 border-transparent hover:border-2 transition-colors"
                style={{ borderColor: orderTiming === 'later' ? themeColor : 'transparent' }}
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${themeColor}20`, color: themeColor }}>
                  <Clock className="h-8 w-8" />
                </div>
                <span className="font-medium">Plus tard</span>
              </button>
              <div className={`relative ${
                !restaurant?.serviceOptions?.includes('delivery')
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}>
                <button
                  onClick={handleDelivery}
                  disabled={!restaurant?.serviceOptions?.includes('delivery')}
                  className={`w-full bg-white rounded-xl p-4 shadow-md flex flex-col items-center gap-2 border-2 ${
                    restaurant?.serviceOptions?.includes('delivery')
                      ? 'hover:border-2 border-transparent'
                      : 'border-2 border-gray-200'
                  }`}
                  style={restaurant?.serviceOptions?.includes('delivery') ? {
                    borderColor: orderTiming === 'delivery' ? themeColor : 'transparent'
                  } : undefined}
                >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${themeColor}20`, color: themeColor }}>
                    <Bike className="h-8 w-8" />
                  </div>
                  <span className="font-medium">Livraison</span>
                </button>
                {!restaurant?.serviceOptions?.includes('delivery') && (
                  <span className="absolute bottom-2 left-0 right-0 text-center text-sm text-gray-500">
                    Non disponible
                  </span>
                )}
              </div>
            </div>
          ) : (
            // Options de service
            <>
              {scheduledTime && (
                <div className="mb-4 text-center">
                  <span className="text-sm text-gray-500">Commander pour :</span>
                  <div className="font-medium text-emerald-500">
                    {orderTiming === 'now' ? 'Maintenant' : formatScheduledTime()}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sur place */}
                <div
                  className={`relative ${
                    !restaurant?.serviceOptions?.includes('dine_in')
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  <button
                    onClick={() => handleEatInOrTakeOut('dine_in')}
                    disabled={!restaurant?.serviceOptions?.includes('dine_in')}
                    className={`w-full bg-white rounded-xl p-4 shadow-md flex flex-col items-center gap-2 border-2 ${
                      restaurant?.serviceOptions?.includes('dine_in')
                        ? 'hover:border-2 border-transparent'
                        : 'border-2 border-gray-200'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${themeColor}20`, color: themeColor }}>
                      <UtensilsCrossed className="h-8 w-8" />
                    </div>
                    <span className="font-medium">Sur place</span>
                  </button>
                  {!restaurant?.serviceOptions?.includes('dine_in') && (
                    <span className="absolute bottom-2 left-0 right-0 text-center text-sm text-gray-500">
                      Non disponible
                    </span>
                  )}
                </div>

                {/* À emporter */}
                <div
                  className={`relative ${
                    !restaurant?.serviceOptions?.includes('takeaway')
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  <button
                    onClick={() => handleEatInOrTakeOut('takeaway')}
                    disabled={!restaurant?.serviceOptions?.includes('takeaway')}
                    className={`w-full bg-white rounded-xl p-4 shadow-md flex flex-col items-center gap-2 border-2 ${
                      restaurant?.serviceOptions?.includes('takeaway')
                        ? 'hover:border-2 border-transparent'
                        : 'border-2 border-gray-200'
                    }`}
                    style={restaurant?.serviceOptions?.includes('takeaway') ? {
                      borderColor: selectedOrderType === 'takeaway' ? themeColor : 'transparent'
                    } : undefined}
                  >
                    <div className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${themeColor}20`, color: themeColor }}>
                      <ShoppingBag className="h-8 w-8" />
                    </div>
                    <span className="font-medium">À emporter</span>
                  </button>
                  {!restaurant?.serviceOptions?.includes('takeaway') && (
                    <span className="absolute bottom-2 left-0 right-0 text-center text-sm text-gray-500">
                      Non disponible
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onConfirm={handleScheduleConfirm}
      />

      {showDeliveryForm && (
        <DeliveryForm
          onClose={() => setShowDeliveryForm(false)}
          onSubmit={handleDeliverySubmit}
        />
      )}
    </div>
  );
}