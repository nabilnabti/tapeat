import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRestaurantContext } from './RestaurantContext';
import { getActivePromotions } from '../services/promotionService';
import type { Promotion } from '../types/firebase';

interface MenuOptions {
  drink?: string;
  side?: string;
  sauces?: string[];
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  originalPrice?: number;
  excludedIngredients?: string[];
  menuOptions?: MenuOptions;
  isCombo?: boolean;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  addItems: (items: CartItem[]) => void;
  removeItem: (id: string, menuOptions?: MenuOptions) => void;
  updateQuantity: (id: string, quantity: number, menuOptions?: MenuOptions) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  toggleCart: () => void;
  total: number;
  scheduledTime: { date: string; time: string } | null;
  setScheduledTime: (time: { date: string; time: string } | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const savedItems = localStorage.getItem('cart');
      return savedItems ? JSON.parse(savedItems) : [];
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<{ date: string; time: string } | null>(null);
  const { restaurant, menu } = useRestaurantContext();
  const [activePromotions, setActivePromotions] = useState<Promotion[]>([]);

  // Load active promotions
  useEffect(() => {
    if (!restaurant?.id) return;
    
    const loadPromotions = async () => {
      try {
        const promotions = await getActivePromotions(restaurant.id);
        setActivePromotions(promotions);
      } catch (err) {
        // Silently handle error - promotions are optional
        setActivePromotions([]);
      }
    };

    loadPromotions();
  }, [restaurant?.id]);

  // Initialize cart items from localStorage
  useEffect(() => {
    try {
      const savedItems = localStorage.getItem('cart');
      if (savedItems) {
        const parsedItems = JSON.parse(savedItems);
        if (Array.isArray(parsedItems)) {
          setItems(parsedItems);
        } else {
          console.error('Invalid cart data in localStorage');
          setItems([]);
        }
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      setItems([]);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [items]);

  const addItem = (newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems(currentItems => {
      const getItemKey = (item: any) => 
        `${item.id}-${JSON.stringify(item.menuOptions)}-${JSON.stringify(item.excludedIngredients)}`;
      
      const newItemKey = getItemKey(newItem);
      const existingItemIndex = currentItems.findIndex(item => getItemKey(item) === newItemKey);
      const initialQuantity = newItem.quantity || 1;
      let itemToAdd = { ...newItem, quantity: initialQuantity };

      // Chercher une promotion applicable
      const promotion = activePromotions.find(p => {
        return p.conditions.productId === newItem.id || p.conditions.freeProductId === newItem.id;
      });

      if (promotion) {
        switch (promotion.type) {
          case 'double':
            if (existingItemIndex >= 0) {
              const updatedItems = [...currentItems];
              const currentQuantity = updatedItems[existingItemIndex].quantity;
              updatedItems[existingItemIndex] = {
                ...updatedItems[existingItemIndex],
                quantity: currentQuantity + 1,
                promotionLabel: (currentQuantity + 1) % 2 === 0 ? '1 offert' : undefined
              };
              return updatedItems;
            }
            break;

          case 'discount':
            itemToAdd = {
              ...newItem,
              originalPrice: newItem.price,
              quantity: initialQuantity,
              price: Number((newItem.price * (1 - (promotion.conditions.discountPercent || 0) / 100)).toFixed(2)),
              promotionLabel: `-${promotion.conditions.discountPercent}%`
            };
            break;
             
          case 'free':
            // Si c'est le produit offert
            if (newItem.id === promotion.conditions.freeProductId) {
              // Vérifier si le produit principal est dans le panier
              const mainProductInCart = currentItems.some(item => 
                item.id === promotion.conditions.productId
              );
              
              if (mainProductInCart) {
                itemToAdd = {
                  ...newItem,
                  originalPrice: newItem.price,
                  quantity: initialQuantity,
                  price: 0,
                  promotionLabel: 'OFFERT'
                };
              }
            }
            break;
            
          case 'second_item_discount':
            // Trouver tous les articles identiques dans le panier
            const sameItems = currentItems.filter(item => item.id === newItem.id);
            const totalQuantity = sameItems.reduce((sum, item) => sum + item.quantity, 0) + initialQuantity;
            
            // Appliquer la réduction sur les articles pairs
            if (totalQuantity >= 2) {
              const discountPercent = promotion.conditions.discountPercent || 0;
              itemToAdd.originalPrice = newItem.price;
              itemToAdd.price = newItem.price * (1 - discountPercent / 100);
              itemToAdd.promotionLabel = `-${discountPercent}% sur le 2ème`;
            }
            break;
        }
      }

      if (existingItemIndex >= 0) {
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + itemToAdd.quantity,
          price: itemToAdd.price,
          originalPrice: itemToAdd.originalPrice,
          promotionLabel: itemToAdd.promotionLabel
        };
        return updatedItems;
      }

      return [...currentItems, itemToAdd];
    });
  };

  const addItems = (newItems: CartItem[]) => {
    setItems(currentItems => {
      if (!Array.isArray(currentItems)) {
        return newItems;
      }
      return [...currentItems, ...newItems];
    });
  };

  const removeItem = (id: string, menuOptions?: MenuOptions) => {
    setItems(currentItems => {
      // Trouver l'index exact de l'item à supprimer
      const itemIndex = currentItems.findIndex(item => {
        const sameId = item.id === id;
        const sameOptions = menuOptions ? 
          JSON.stringify(item.menuOptions) === JSON.stringify(menuOptions) :
          true;
        return sameId && sameOptions;
      });

      if (itemIndex === -1) return currentItems;

      // Créer une nouvelle copie du tableau sans l'item
      return [
        ...currentItems.slice(0, itemIndex),
        ...currentItems.slice(itemIndex + 1)
      ];
    });
  };

  const updateQuantity = (id: string, quantity: number, menuOptions?: MenuOptions) => {
    setItems(currentItems => {
      // Trouver l'index de l'item à mettre à jour
      const itemIndex = currentItems.findIndex(item => {
        const sameId = item.id === id;
        const sameOptions = menuOptions ? 
          JSON.stringify(item.menuOptions) === JSON.stringify(menuOptions) :
          true;
        return sameId && sameOptions;
      });

      if (itemIndex === -1) return currentItems;
      
      const item = currentItems[itemIndex];
      
      // Chercher une promotion applicable
      const promotion = activePromotions.find(p => {
        return p.conditions.productId === item.id || p.conditions.freeProductId === item.id;
      });

      // Si la quantité est 0 ou moins, supprimer l'item
      if (quantity <= 0) {
        return [
          ...currentItems.slice(0, itemIndex),
          ...currentItems.slice(itemIndex + 1)
        ];
      }

      // Mettre à jour la quantité avec gestion de la promotion
      let updatedItem = { ...item, quantity };
      
      if (promotion) {
        switch (promotion.type) {
          case 'double':
            updatedItem.promotionLabel = quantity % 2 === 0 ? '1 offert' : undefined;
            break;
            
          case 'free':
            if (item.id === promotion.conditions.freeProductId) {
              // Trouver le produit principal dans le panier
              const mainProduct = currentItems.find(cartItem => 
                cartItem.id === promotion.conditions.productId
              );
              
              // Vérifier si le produit principal est dans le panier
              const mainProductInCart = currentItems.some(cartItem => 
                cartItem.id === promotion.conditions.productId
              );
              
              if (mainProductInCart) {
                // Un seul produit offert par produit principal
                const freeQuantity = Math.min(1, mainProduct.quantity);
                const paidQuantity = Math.max(0, quantity - freeQuantity);
                
                updatedItem = {
                  ...item,
                  quantity,
                  originalPrice: item.price,
                  // Prix total = prix unitaire * quantité payante
                  price: paidQuantity === 0 ? 0 : item.originalPrice || item.price,
                  promotionLabel: freeQuantity > 0 ? `${freeQuantity} offert${freeQuantity > 1 ? 's' : ''}` : undefined
                };
              }
            }
            break;
        }
      }

      return [
        ...currentItems.slice(0, itemIndex),
        updatedItem,
        ...currentItems.slice(itemIndex + 1)
      ];
    });
  };

  const clearCart = () => {
    setItems([]);
    setScheduledTime(null);
  };

  const toggleCart = () => setIsCartOpen(prev => !prev);

  const total = items && Array.isArray(items) 
    ? items.reduce((sum, item) => {
        if (item.promotionLabel === '1 offert') {
          // Pour chaque paire d'articles, ne facturer qu'un seul
          return sum + (Math.ceil(item.quantity / 2) * item.price);
        }
        if (item.promotionLabel?.includes('sur le 2ème')) {
          const pairs = Math.floor(item.quantity / 2);
          const remainingItems = item.quantity % 2;
          const regularPrice = item.originalPrice || item.price;
          const discountedPrice = item.price;
          
          return sum + (pairs * (regularPrice + discountedPrice)) + (remainingItems * regularPrice);
        }
        return sum + (item.price * item.quantity);
      }, 0)
    : 0;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        addItems,
        removeItem,
        updateQuantity,
        clearCart,
        isCartOpen,
        toggleCart,
        total,
        scheduledTime,
        setScheduledTime
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}