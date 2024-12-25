import { Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import type { MenuItem } from '../../types/firebase';
import ProductSelector from './ProductSelector';

interface ComboSectionFormProps {
  section: {
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
  };
  availableProducts: MenuItem[];
  onUpdate: (sectionId: string, updates: any) => void;
  onRemove: (sectionId: string) => void;
}

export default function ComboSectionForm({ 
  section, 
  availableProducts,
  onUpdate, 
  onRemove 
}: ComboSectionFormProps) {
  const [showProductSelector, setShowProductSelector] = useState(false);

  const handleAddProduct = (product: MenuItem) => {
    // Empêcher la propagation de l'événement
    const updatedItems = [
      ...section.items,
      { 
        id: product.id,
        name: product.name,
        price: 0,
        image: product.image,
        included: true
      }
    ];

    onUpdate(section.id, {
      ...section,
      items: updatedItems
    });
  };

  const handleRemoveItem = (itemId: string, e: React.MouseEvent) => {
    // Empêcher la propagation de l'événement
    e.preventDefault();
    e.stopPropagation();
    
    onUpdate(section.id, {
      ...section,
      items: section.items.filter(item => item.id !== itemId)
    });
  };

  const handleItemChange = (itemId: string, field: 'price' | 'included', value: number | boolean, e?: React.ChangeEvent) => {
    // Empêcher la propagation de l'événement si présent
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    onUpdate(section.id, {
      ...section,
      items: section.items.map(item => 
        item.id === itemId ? { ...item, [field]: value } : item
      )
    });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onUpdate(section.id, { ...section, name: e.target.value });
  };

  const handleRequiredChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onUpdate(section.id, { ...section, required: e.target.checked });
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <input
          type="text"
          value={section.name}
          onChange={handleNameChange}
          placeholder="Nom de la section"
          className="flex-1 px-3 py-2 border rounded-lg mr-4"
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove(section.id);
          }}
          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
        >
          <Minus className="h-5 w-5" />
        </button>
      </div>

      <label className="flex items-center mb-4">
        <input
          type="checkbox"
          checked={section.required}
          onChange={handleRequiredChange}
          className="rounded border-gray-300 text-emerald-500"
        />
        <span className="ml-2 text-sm">Section obligatoire</span>
      </label>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {section.items.map((item) => (
            <div key={item.id} className="border rounded-lg p-3">
              <div className="flex items-center gap-3 mb-3">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-medium">{item.name}</h4>
                  <label className="flex items-center mt-1">
                    <input
                      type="checkbox"
                      checked={item.included}
                      onChange={(e) => handleItemChange(item.id, 'included', e.target.checked, e)}
                      className="rounded border-gray-300 text-emerald-500"
                    />
                    <span className="ml-2 text-sm">Inclus</span>
                  </label>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleRemoveItem(item.id, e)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Minus className="h-5 w-5" />
                </button>
              </div>

              {!item.included && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Supplément :</span>
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0, e)}
                    className="w-24 px-3 py-1 border rounded-lg text-sm"
                    min="0"
                    step="0.01"
                    placeholder="0.00 €"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowProductSelector(true);
          }}
          className="w-full px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Ajouter un produit
        </button>
      </div>

      {showProductSelector && (
        <ProductSelector
          products={availableProducts}
          onSelect={(product) => {
            handleAddProduct(product);
            setShowProductSelector(false);
          }}
          onClose={() => setShowProductSelector(false)}
          title="Sélectionner un produit"
        />
      )}
    </div>
  );
}