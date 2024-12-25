import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useRestaurantContext } from '../context/RestaurantContext';

interface MenuCustomizationProps {
  item: {
    id: string;
    name: string;
    price: number;
    image: string;
    description?: string;
    mainProductId?: string;
    sections?: Array<{
      id: string;
      name: string;
      required: boolean;
      items: Array<{
        id: string;
        name: string;
        price: number;
        image?: string;
        included: boolean;
      }>;
    }>;
  };
  onClose: () => void;
}

interface Ingredient {
  id: string;
  name: string;
  icon: string;
}

export default function MenuCustomization({ item, onClose }: MenuCustomizationProps) {
  const { addItem } = useCart();
  const { menu } = useRestaurantContext();
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({});
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);
  const [modalHeight, setModalHeight] = useState('85vh');

  // Récupérer le produit principal et ses ingrédients
  const mainProduct = menu?.find(p => p.id === item.mainProductId);
  const mainProductIngredients = mainProduct?.ingredients as Ingredient[] || [];

  // Ajuster la hauteur du modal en fonction de la taille de l'écran
  useEffect(() => {
    const adjustModalHeight = () => {
      if (window.innerHeight < 700) {
        setModalHeight('92vh');
      } else {
        setModalHeight('85vh');
      }
    };

    adjustModalHeight();
    window.addEventListener('resize', adjustModalHeight);
    return () => window.removeEventListener('resize', adjustModalHeight);
  }, []);

  // Scroll automatique lors du changement d'étape
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const toggleIngredient = (ingredientId: string) => {
    setExcludedIngredients(prev =>
      prev.includes(ingredientId)
        ? prev.filter(id => id !== ingredientId)
        : [...prev, ingredientId]
    );
  };

  const handleOptionSelect = (sectionId: string, itemId: string, included: boolean) => {
    setSelectedOptions(prev => {
      const currentSection = prev[sectionId] || {};
      const isCurrentlySelected = currentSection[itemId]?.selected;

      // Si l'option est déjà sélectionnée, la désélectionner
      if (isCurrentlySelected) {
        const { [itemId]: _, ...restItems } = currentSection;
        return {
          ...prev,
          [sectionId]: restItems
        };
      }

      // Sinon, la sélectionner
      return {
        ...prev,
        [sectionId]: {
          ...currentSection,
          [itemId]: {
            selected: true,
            included
          }
        }
      };
    });
  };

  const handleAddToCart = () => {
    // Calculer le prix total avec les suppléments
    let totalPrice = item.price;
    let selectedItems: Record<string, any> = {};

    // Parcourir les sections et ajouter les prix des options non incluses
    Object.entries(selectedOptions).forEach(([sectionId, items]) => {
      const section = item.sections?.find(s => s.id === sectionId);
      if (section) {
        Object.entries(items).forEach(([itemId, details]: [string, any]) => {
          const sectionItem = section.items.find(i => i.id === itemId);
          if (sectionItem && details.selected) {
            if (!sectionItem.included) {
              totalPrice += sectionItem.price;
            }
            selectedItems[section.name] = sectionItem.name;
          }
        });
      }
    });

    // Ajouter au panier avec les options sélectionnées et les ingrédients exclus
    addItem({
      ...item,
      price: totalPrice,
      menuOptions: selectedItems,
      excludedIngredients: excludedIngredients.length > 0
        ? mainProductIngredients
            .filter(ing => excludedIngredients.includes(ing.id))
            .map(ing => ing.name)
        : undefined,
      quantity: 1
    });

    onClose();
  };

  const steps = [
    { id: 'ingredients', name: 'Ingrédients', icon: '🥗' },
    ...(item.sections?.map(section => ({
      id: section.id,
      name: section.name,
      icon: '🍽️',
      required: section.required
    })) || [])
  ];

  const canAddToCart = () => {
    // Vérifier que toutes les sections requises ont une sélection
    return item.sections?.every(section => {
      if (!section.required) return true;
      const sectionSelections = selectedOptions[section.id] || {};
      return Object.values(sectionSelections).some((item: any) => item.selected);
    }) ?? true;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
      <div 
        ref={modalRef} 
        className="relative w-full sm:w-[600px] bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{ maxHeight: modalHeight }}
      >
        {/* Header fixe */}
        <div className="sticky top-0 bg-white z-10 border-b">
          <div className="p-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Composer votre menu</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation des étapes */}
          <div className="flex px-4 pb-4 overflow-x-auto hide-scrollbar">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(index)}
                className={`flex-shrink-0 flex-1 min-w-[80px] text-center py-2 ${
                  currentStep === index
                    ? 'border-b-2 border-emerald-500 text-emerald-500'
                    : 'border-b border-gray-200 text-gray-500'
                }`}
              >
                <span className="block text-xl mb-1">{step.icon}</span>
                <span className="text-sm whitespace-nowrap">{step.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Contenu scrollable */}
        <div 
          ref={contentRef}
          className="overflow-y-auto pb-safe"
          style={{ maxHeight: 'calc(100% - 140px)' }}
        >
          <div className="p-4 space-y-4">
            {/* Section ingrédients */}
            {currentStep === 0 && (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={mainProduct?.image || item.image}
                    alt={mainProduct?.name || item.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div>
                    <h3 className="font-medium">{mainProduct?.name || item.name}</h3>
                    <p className="text-emerald-500">{item.price.toFixed(2)} €</p>
                  </div>
                </div>

                {mainProductIngredients.length > 0 ? (
                  <>
                    <h4 className="font-medium mb-3">Personnaliser les ingrédients</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {mainProductIngredients.map((ingredient) => (
                        <button
                          key={`ingredient-${ingredient.id}`}
                          onClick={() => toggleIngredient(ingredient.id)}
                          className={`p-3 rounded-lg text-center transition-colors ${
                            excludedIngredients.includes(ingredient.id)
                              ? 'bg-red-50 text-red-500'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <span className="text-2xl block mb-1">{ingredient.icon}</span>
                          <span className="text-sm">{ingredient.name}</span>
                          {excludedIngredients.includes(ingredient.id) && (
                            <span className="text-xs text-red-500 block mt-1">Exclu</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    Aucun ingrédient personnalisable
                  </div>
                )}
              </>
            )}

            {/* Sections du combo */}
            {currentStep > 0 && item.sections && (
              <div className="space-y-4">
                <h4 className="font-medium mb-3">
                  {item.sections[currentStep - 1].name}
                  {item.sections[currentStep - 1].required && (
                    <span className="text-sm text-red-500 ml-1">*</span>
                  )}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {item.sections[currentStep - 1].items.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(
                        item.sections![currentStep - 1].id,
                        option.id,
                        option.included
                      )}
                      className={`p-4 rounded-lg border text-left ${
                        selectedOptions[item.sections![currentStep - 1].id]?.[option.id]?.selected
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200'
                      }`}
                    >
                      {option.image && (
                        <img
                          src={option.image}
                          alt={option.name}
                          className="w-full h-32 object-cover rounded-lg mb-2"
                        />
                      )}
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{option.name}</span>
                        {!option.included && (
                          <span className="text-emerald-500">+{option.price.toFixed(2)} €</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer fixe */}
        <div className="sticky bottom-0 bg-white border-t p-4 pb-safe">
          {currentStep === 0 ? (
            <button
              onClick={() => setCurrentStep(1)}
              className="w-full bg-emerald-500 text-white py-3 rounded-xl font-medium"
            >
              Suivant
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart()}
              className="w-full bg-emerald-500 text-white py-3 rounded-xl font-medium disabled:opacity-50"
            >
              Ajouter au panier
            </button>
          )}
        </div>
      </div>
    </div>
  );
}