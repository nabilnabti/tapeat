import { TrendingUp, TrendingDown } from 'lucide-react';

export default function TopProducts() {
  // Données simulées
  const products = [
    {
      id: '1',
      name: 'Classic Burger',
      sales: 124,
      revenue: 1550.60,
      trend: 12.5
    },
    {
      id: '2',
      name: 'Menu Cheese Lover',
      sales: 98,
      revenue: 1470.00,
      trend: -5.2
    },
    {
      id: '3',
      name: 'Salade César',
      sales: 86,
      revenue: 1032.00,
      trend: 8.7
    },
    {
      id: '4',
      name: 'Milkshake',
      sales: 75,
      revenue: 367.50,
      trend: 15.3
    }
  ];

  return (
    <div className="space-y-4">
      {products.map((product) => (
        <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium">{product.name}</p>
            <p className="text-sm text-gray-500">
              {product.sales} ventes • {product.revenue.toFixed(2)} €
            </p>
          </div>
          <div className={`flex items-center gap-1 ${
            product.trend > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {product.trend > 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {Math.abs(product.trend)}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}