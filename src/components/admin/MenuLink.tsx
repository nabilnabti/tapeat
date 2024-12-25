import { useState } from 'react';
import { Link, Copy, Check } from 'lucide-react';
import { useRestaurantContext } from '../../context/RestaurantContext';

export default function MenuLink() {
  const { restaurant } = useRestaurantContext();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const fullUrl = `${window.location.origin}/restaurant?restaurantId=${restaurant?.id}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors lg:hover:scale-105 lg:transform lg:transition-all"
      title={copied ? 'Copié !' : 'Copier le lien du menu'}
    >
      <Link className="h-4 w-4" />
      <span className="text-sm font-medium whitespace-nowrap">Menu client</span>
      {copied && (
        <span className="flex items-center gap-1 text-xs bg-emerald-100 px-2 py-0.5 rounded">
          <Check className="h-3 w-3" />
          Copié !
        </span>
      )}
    </button>
  );
}