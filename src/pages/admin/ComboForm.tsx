import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Plus, Loader2, Image, Upload, X } from 'lucide-react';
import { useRestaurantContext } from '../../context/RestaurantContext';
import { createCombo, updateMenuItem } from '../../services/menuService';
import { uploadImage } from '../../services/uploadService';
import AdminLayout from '../../components/admin/AdminLayout';
import ComboSectionForm from '../../components/admin/ComboSectionForm';
import ProductSelector from '../../components/admin/ProductSelector';

export default function ComboForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { restaurant, menu = [], categories = [] } = useRestaurantContext();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    categoryId: '',
    mainProductId: '',
    mainProduct: null as any,
    sections: [] as Array<{
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
    }>
  });

  useEffect(() => {
    if (id) {
      const combo = menu.find(item => item.id === id);
      if (combo) {
        const mainProduct = menu.find(item => item.id === combo.mainProductId);
        setFormData({
          name: combo.name,
          description: combo.description || '',
          price: combo.price,
          categoryId: combo.categoryId,
          mainProductId: combo.mainProductId || '',
          mainProduct: mainProduct || null,
          sections: combo.sections || []
        });
        if (combo.image !== mainProduct?.image) {
          setImagePreview(combo.image || '');
        }
      }
    }
  }, [id, menu]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('L\'image ne doit pas dépasser 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleMainProductSelect = (product: any) => {
    setFormData(prev => ({
      ...prev,
      mainProductId: product.id,
      mainProduct: product
    }));
    // Si aucune image personnalisée n'a été uploadée, utiliser l'image du produit principal
    if (!imageFile && !imagePreview) {
      setImagePreview(product.image);
    }
    // Fermer automatiquement le sélecteur après la sélection
    setShowProductSelector(false);
  };

  const handleAddSection = () => {
    setFormData(prev => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: `section-${Date.now()}`,
          name: '',
          required: true,
          items: []
        }
      ]
    }));
  };

  const handleUpdateSection = (sectionId: string, updates: any) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? updates : section
      )
    }));
  };

  const handleRemoveSection = (sectionId: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant?.id || !formData.mainProduct) return;

    try {
      setSaving(true);
      setError(null);

      const comboData = {
        ...formData,
        image: imagePreview,
        isCombo: true,
        status: 'available' as const
      };

      if (id) {
        await updateMenuItem(id, restaurant.id, comboData, imageFile || undefined);
      } else {
        await createCombo(restaurant.id, comboData, imageFile || undefined);
      }

      navigate('/admin/menu/combos');
    } catch (err) {
      console.error('Error saving combo:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const availableProducts = menu.filter(item => !item.isCombo);

  return (
    <AdminLayout>
      <div className="bg-white shadow">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/menu/combos')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-semibold">
              {id ? 'Modifier le combo' : 'Nouveau combo'}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg border p-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Image du combo</label>
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        setImageFile(null);
                        // Réutiliser l'image du produit principal si disponible
                        if (formData.mainProduct) {
                          setImagePreview(formData.mainProduct.image);
                        }
                      }}
                      className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-gray-300 border-dashed rounded-lg p-8">
                    <label className="cursor-pointer text-center block">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                      <span className="mt-2 block text-sm text-gray-600">
                        Ajouter une image personnalisée
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        Si aucune image n'est sélectionnée, l'image du produit principal sera utilisée
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Prix (€)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Catégorie</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Sélectionner</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Produit principal</label>
                {formData.mainProduct ? (
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <img
                      src={formData.mainProduct.image}
                      alt={formData.mainProduct.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div>
                      <h3 className="font-medium">{formData.mainProduct.name}</h3>
                      <p className="text-sm text-gray-500">{formData.mainProduct.description}</p>
                      <button
                        type="button"
                        onClick={() => setShowProductSelector(true)}
                        className="mt-2 text-emerald-500 text-sm hover:underline"
                      >
                        Changer de produit
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowProductSelector(true)}
                    className="w-full px-4 py-8 border-2 border-dashed rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400"
                  >
                    <Image className="h-8 w-8 mx-auto mb-2" />
                    <span>Sélectionner un produit principal</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Sections du combo</h2>
              <button
                type="button"
                onClick={handleAddSection}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Ajouter une section
              </button>
            </div>

            {formData.sections.map(section => (
              <ComboSectionForm
                key={section.id}
                section={section}
                availableProducts={availableProducts}
                onUpdate={handleUpdateSection}
                onRemove={handleRemoveSection}
              />
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/menu/combos')}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !formData.mainProduct}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>

      {showProductSelector && (
        <ProductSelector
          products={availableProducts}
          onSelect={handleMainProductSelect}
          onClose={() => setShowProductSelector(false)}
          title="Sélectionner le produit principal"
        />
      )}
    </AdminLayout>
  );
}