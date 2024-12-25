import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Trash2, Calendar } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useRestaurantContext } from '../context/RestaurantContext';

export default function Cart() {
  const cartRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { themeColor } = useRestaurantContext();
  const { items, total, isCartOpen, toggleCart, updateQuantity, removeItem, scheduledTime } = useCart();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        toggleCart();
      }
    }

    if (isCartOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCartOpen, toggleCart]);

  const handleCheckout = () => {
    toggleCart();
    const isRegisterMode = new URLSearchParams(window.location.search).get('mode') === 'register';
    navigate(isRegisterMode ? `/checkout?mode=register` : '/checkout');
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div ref={cartRef} className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-lg">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Votre panier</h2>
                {scheduledTime && (
                  <div className="flex items-center gap-2 text-emerald-600 mt-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      {new Date(scheduledTime.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })} à {scheduledTime.time}
                    </span>
                  </div>
                )}
              </div>
              <button onClick={toggleCart} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                Votre panier est vide
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div 
                    key={`${item.id}-${index}-${JSON.stringify(item.menuOptions)}`}
                    className="flex items-center gap-4 bg-white rounded-lg p-3 shadow-sm"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      {item.originalPrice ? (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 line-through text-sm">
                            {item.originalPrice.toFixed(2)} €
                          </span>
                          <span style={{ color: themeColor }}>
                            {item.price.toFixed(2)} €
                          </span>
                        </div>
                      ) : (
                        <p style={{ color: themeColor }}>{item.price.toFixed(2)} €</p>
                      )}
                      {item.promotionLabel && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                          {item.promotionLabel}
                        </span>
                      )}
                      {item.excludedIngredients?.length > 0 && (
                        <p className="text-sm text-red-500">
                          Sans : {item.excludedIngredients.join(', ')}
                        </p>
                      )}
                      {item.menuOptions && (
                        <>
                          {item.menuOptions.drink && (
                            <p className="text-sm text-gray-500">
                              Boisson : {item.menuOptions.drink}
                            </p>
                          )}
                          {item.menuOptions.side && (
                            <p className="text-sm text-gray-500">
                              Accompagnement : {item.menuOptions.side}
                            </p>
                          )}
                          {item.menuOptions.sauces?.length > 0 && (
                            <p className="text-sm text-gray-500">
                              Sauces : {item.menuOptions.sauces.join(', ')}
                            </p>
                          )}
                        </>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 rounded-full"
                          style={{ backgroundColor: themeColor, color: 'white' }}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 rounded-full"
                          style={{ backgroundColor: themeColor, color: 'white' }}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <Trash2 className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="p-4 border-t">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium">Total</span>
                <span className="font-semibold" style={{ color: themeColor }}>{total.toFixed(2)} €</span>
              </div>
              <button 
                onClick={handleCheckout}
                className="w-full text-white py-2.5 sm:py-3 rounded-xl font-medium"
                style={{ backgroundColor: themeColor }}
              >
                Passer la commande
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}