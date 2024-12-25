import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Info, Plus, Power, ChevronLeft, Tag } from 'lucide-react';
import { useRestaurantContext } from '../context/RestaurantContext';
import { useCart } from '../context/CartContext';
import { getActivePromotions } from '../services/promotionService';
import type { Promotion } from '../types/firebase'; 
import Cart from '../components/Cart';
import MenuCustomization from '../components/MenuCustomization';
import ProductDetails from '../components/ProductDetails';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Menu() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const restaurantId = searchParams.get('restaurantId');
  const isRegisterMode = searchParams.get('mode') === 'register';
  
  const { restaurant, categories, menu: menuItems, loading, error, isOpen, themeColor } = useRestaurantContext();
  const [activeCategory, setActiveCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const { addItem, items, total, toggleCart } = useCart();
  const [activePromotions, setActivePromotions] = useState<Promotion[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!restaurantId) return;
    
    const loadPromotions = async () => {
      try {
        const promotions = await getActivePromotions(restaurantId);
        setActivePromotions(promotions);
      } catch (err) {
        console.error('Error loading promotions:', err);
      }
    };

    loadPromotions();
  }, [restaurantId]);

  // Listen for messages from parent window in register mode
  useEffect(() => {
    if (!isRegisterMode) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'INIT_MENU' && event.data.restaurantId) {
        navigate(`/menu?restaurantId=${event.data.restaurantId}&mode=register`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isRegisterMode]);

  // Redirect to restaurant details if no restaurantId
  useEffect(() => {
    // En mode caisse, bloquer la navigation vers d'autres pages
    if (isRegisterMode) {      
      // Bloquer la navigation et le retour arrière
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', () => {
        window.history.pushState(null, '', window.location.href);
      });

      // Nettoyer l'écouteur d'événements
      return () => {
        window.removeEventListener('popstate', () => {
          window.history.pushState(null, '', window.location.href);
        });
      };
    }
  }, [isRegisterMode]);

  useEffect(() => {
    if (!restaurantId) return;
    
    const loadPromotions = async () => {
      try {
        const promotions = await getActivePromotions(restaurantId);
        setActivePromotions(promotions);
      } catch (err) {
        console.error('Error loading promotions:', err);
      }
    };

    loadPromotions();
  }, [restaurantId]);

  useEffect(() => {
    try {
      if (!restaurantId) {
        navigate('/');
        return;
      }

      // Vérifier si le type de commande est défini
      const orderTypeData = localStorage.getItem('orderType');
      if (!orderTypeData) {
        navigate(`/restaurant?restaurantId=${restaurantId}${isRegisterMode ? '&mode=register' : ''}`);
        return;
      }
    } catch (err) {
      console.error('Error in Menu useEffect:', err);
      navigate('/');
    }
  }, [restaurantId, isRegisterMode, navigate]);

  // Rotation automatique des slides
  useEffect(() => {
    if (activePromotions.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide(current => (current + 1) % activePromotions.length);
    }, 5000); // Change toutes les 5 secondes

    return () => clearInterval(interval);
  }, [activePromotions.length]);

  if (!activeCategory && categories?.length > 0) {
    setActiveCategory(categories[0].id);
  }

  const handleItemClick = (item: any) => {
    // Ne rien faire si le produit n'est pas disponible ou si le restaurant est fermé
    if (item.status !== 'available' || !isOpen) return;

    setSelectedItem(item);
    if (item.isCombo) {
      setShowCustomization(true);
      setShowProductDetails(false);
    } else {
      addItem({ ...item, quantity: 1 });
    }
  };

  const handleInfoClick = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    setSelectedItem(item);
    setShowProductDetails(true);
    setShowCustomization(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const filteredItems = activeCategory && menuItems ? 
    menuItems.filter(item => item.categoryId === activeCategory) : 
    [];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Restaurant closed overlay */}
      {!isOpen && !loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full text-center animate-fade-in">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Power className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Restaurant fermé</h2>
            <p className="text-gray-600">
              Désolé, le restaurant est actuellement fermé. Veuillez revenir plus tard.
            </p>
          </div>
        </div>
      )}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-40">
        <div className="relative flex items-center px-4 py-2">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: themeColor }}
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <h1 className="ml-4 text-xl font-semibold">{restaurant?.name || 'Menu'}</h1>
        </div>

        <div className="px-4 py-1 border-b">
          <div className="flex gap-4 overflow-x-auto hide-scrollbar relative">
            {categories?.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex-shrink-0 flex flex-col items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                  activeCategory === category.id
                    ? 'text-white'
                    : 'bg-white text-gray-600'
                }`}
                style={activeCategory === category.id ? { backgroundColor: themeColor } : undefined}
              >
                {category.image ? (
                  <div className="w-7 h-7 rounded-full overflow-hidden">
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-base">
                    {category.icon}
                  </div>
                )}
                <span className="text-[11px] whitespace-nowrap font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="pt-48 pb-24 px-4">
        {/* Bandeau promotions */}
        {activePromotions.length > 0 && (
          <div className="fixed top-[140px] left-0 right-0 bg-emerald-500 text-white py-1.5 z-40 mb-2">
            <div className="relative overflow-hidden">
              <div className="flex transition-transform duration-500 ease-in-out"
                   style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                {activePromotions.map((promo, index) => (
                  <div key={promo.id} className="flex-shrink-0 w-full px-4 flex items-center justify-center gap-2">
                    <Tag className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {promo.name} - {promo.description}
                    </span>
                  </div>
                ))}
              </div>
              {/* Indicateurs de slide */}
              {activePromotions.length > 1 && (
                <div className="absolute -bottom-1 left-0 right-0 flex justify-center gap-1 pb-1">
                  {activePromotions.map((_, index) => (
                    <div
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        currentSlide === index ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {/* Add padding if there's a promotion */}
        {activePromotions.length > 0 && <div className="h-4" />}
        <div className="grid grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`bg-white rounded-xl overflow-hidden shadow-sm transition-all relative h-[160px] ${
                item.status !== 'available' || !isOpen ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer' 
              }`}
            >
              <div className="relative h-24">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                {(item.status !== 'available' || !isOpen) && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {!isOpen ? 'Restaurant fermé' : 'Non disponible'}
                    </span>
                  </div>
                )}
                <button 
                  className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
                  onClick={(e) => handleInfoClick(e, item)}
                >
                  <Info className="h-5 w-5" style={{ color: themeColor }} />
                </button>
              </div>
              <div className="p-3">
                <h3 className="font-medium mb-1">{item.name}</h3>
                <p className="font-medium" style={{ color: themeColor }}>{item.price.toFixed(2)} €</p>
                {/* Afficher le badge de promotion si applicable */}
                {activePromotions.map(promo => {
                  if (promo.conditions.productId === item.id) {
                    return (
                      <div 
                        key={promo.id}
                        className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs"
                      >
                        <Tag className="h-3 w-3" />
                        {promo.type === 'double' ? '1 acheté = 2 offerts' :
                         promo.type === 'discount' ? `-${promo.conditions.discountPercent}%` :
                         promo.type === 'free' ? `${promo.conditions.freeProductName} offert` :
                         promo.type === 'second_item_discount' ? `-${promo.conditions.discountPercent}% sur le 2ème` :
                         promo.type === 'second_item_discount' ? `-${promo.conditions.discountPercent}% sur le 2ème` :
                         ''}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
              {item.status === 'available' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleItemClick(item);
                  }}
                  className="absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg"
                  style={{ backgroundColor: themeColor }}
                >
                  <Plus className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
        </div>
        {activePromotions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-emerald-500 text-white py-2 px-4 flex items-center justify-center gap-2">
            <Tag className="h-4 w-4" />
            <span className="text-sm font-medium">
              {activePromotions[0].name} - {activePromotions[0].description}
            </span>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4">
          <button 
            onClick={toggleCart}
            className="w-full text-white py-4 rounded-xl flex items-center justify-between px-4"
            style={{ backgroundColor: themeColor }}
          >
            <div className="flex items-center gap-2">
              <span className="bg-white w-8 h-8 rounded-full flex items-center justify-center" style={{ color: themeColor }}>
                {items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
              <span>Voir le panier</span>
            </div>
            <span>{total.toFixed(2)} €</span>
          </button>
        </div>
      )}

      <Cart />
      
      {selectedItem && showCustomization && (
        <MenuCustomization
          item={selectedItem}
          onClose={() => {
            setSelectedItem(null);
            setShowCustomization(false);
          }}
          onShowIngredients={() => {
            setShowCustomization(false);
            setShowProductDetails(true);
          }}
        />
      )}

      {selectedItem && showProductDetails && (
        <ProductDetails
          product={selectedItem}
          onClose={() => {
            setShowProductDetails(false);
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
}