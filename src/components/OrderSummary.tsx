import { OrderItem } from '../types/firebase';

interface OrderSummaryProps extends React.HTMLAttributes<HTMLDivElement> {
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  themeColor?: string;
}

export default function OrderSummary({ items, subtotal, tax, total, themeColor, ...props }: OrderSummaryProps) {
  return (
    <div className="bg-white rounded-xl overflow-hidden" {...props}>
      <div className="p-4 border-b">
        <h3 className="font-medium">Détails de la commande</h3>
      </div>
      <div className="divide-y">
        {items.map((item, index) => (
          <div key={index} className="p-4 flex gap-4">
            <img
              src={item.image}
              alt={item.name}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-sm text-gray-500">Quantité : {item.quantity}</p>
                  {item.excludedIngredients && item.excludedIngredients.length > 0 && (
                    <p className="text-sm text-red-500">
                      Sans : {item.excludedIngredients.join(', ')}
                    </p>
                  )}
                  {item.menuOptions && (
                    <div className="text-sm text-gray-500">
                      {item.menuOptions.drink && (
                        <p>Boisson : {item.menuOptions.drink}</p>
                      )}
                      {item.menuOptions.side && (
                        <p>Accompagnement : {item.menuOptions.side}</p>
                      )}
                      {item.menuOptions.sauces && item.menuOptions.sauces.length > 0 && (
                        <p>Sauces : {item.menuOptions.sauces.join(', ')}</p>
                      )}
                    </div>
                  )}
                </div>
                <span className="font-medium">{(item.price * item.quantity).toFixed(2)} €</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 bg-gray-50">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-gray-600">
            <span>Sous-total</span>
            <span>{subtotal.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between items-center text-gray-600">
            <span>TVA (20%)</span>
            <span>{tax.toFixed(2)} €</span>
          </div>
          <div className="pt-2 border-t flex justify-between items-center">
            <span className="font-medium">Total</span>
            <span className="font-semibold" style={{ color: themeColor }}>{total.toFixed(2)} €</span>
          </div>
        </div>
      </div>
    </div>
  );
}