import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useRestaurantContext } from '../context/RestaurantContext';

interface ProductDetailsProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    description?: string;
    ingredients?: Array<{
      id: string;
      name: string;
      icon: string;
    }>;
    status?: string;
  };
  onClose: () => void;
}

export default function ProductDetails({ product, onClose }: ProductDetailsProps) {
  const { addItem } = useCart();
  const { menu, themeColor } = useRestaurantContext();
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);
  const [productIngredients, setProductIngredients] = useState<Array<{id: string; name: string; icon: string}>>([]);

  useEffect(() => {
    const fullProduct = menu?.find(item => item.id === product.id);
    if (fullProduct?.ingredients) {
      setProductIngredients(fullProduct.ingredients);
    }
  }, [product.id, menu]);

  const handleAddToCart = () => {
    // Ne rien faire si le produit n'est pas disponible
    if (product.status !== 'available') return;

    const excludedNames = excludedIngredients.length > 0 && productIngredients.length > 0
      ? productIngredients
          .filter(ing => excludedIngredients.includes(ing.id))
          .map(ing => ing.name)
      : undefined;

    addItem({
      ...product,
      excludedIngredients: excludedNames,
      quantity: 1
    });
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={handleBackdropClick}>
      <div className="fixed inset-x-0 bottom-0 max-h-[90vh] flex flex-col">
        <div className="bg-white w-full rounded-t-2xl overflow-hidden flex flex-col max-h-full">
          <div className="relative h-48 sm:h-72 flex-shrink-0">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.status !== 'available' && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <span className="text-white font-medium">Non disponible</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <h2 className="text-xl font-medium mb-2">{product.name}</h2>
            <p className="text-lg mb-4" style={{ color: themeColor }}>{product.price.toFixed(2)} €</p>
            
            <p className="text-gray-600 mb-6">
              {product.description || "Un délicieux plat préparé avec des ingrédients frais"}
            </p>

            {productIngredients.length > 0 ? (
              <>
                <h3 className="font-medium mb-3">Ingrédients</h3>
                <div className="grid grid-cols-3 gap-3">
                  {productIngredients.map((ingredient) => (
                    <button
                      key={`${product.id}-ingredient-${ingredient.id}`}
                      onClick={() => {
                        setExcludedIngredients(prev => 
                          prev.includes(ingredient.id)
                            ? prev.filter(id => id !== ingredient.id)
                            : [...prev, ingredient.id]
                        );
                      }}
                      className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                        excludedIngredients.includes(ingredient.id)
                          ? 'bg-red-50 text-red-500'
                          : 'bg-gray-50'
                      }`}
                      style={!excludedIngredients.includes(ingredient.id) ? {
                        ':hover': {
                          backgroundColor: `${themeColor}10`
                        }
                      } : undefined}
                    >
                      <span className="text-2xl mb-1">{ingredient.icon}</span>
                      <span className="text-xs text-center leading-tight">
                        {ingredient.name}
                      </span>
                      {excludedIngredients.includes(ingredient.id) && (
                        <span className="text-xs text-red-500 mt-1">Exclu</span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-500">Aucune information sur les ingrédients</p>
            )}

            <div className="mt-6">
          <div className="p-4 border-t bg-white">
            <button
              onClick={handleAddToCart}
              disabled={product.status !== 'available'}
              className="w-full text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: themeColor }}
            >
              {product.status === 'available' ? 'Ajouter au panier' : 'Non disponible'}
            </button>
          </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}