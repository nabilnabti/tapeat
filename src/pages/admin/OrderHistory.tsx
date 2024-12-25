import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, UtensilsCrossed, ShoppingBag, Bike, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useRestaurantContext } from '../../context/RestaurantContext';
import AdminLayout from '../../components/admin/AdminLayout';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { Order } from '../../types/firebase';
import LoadingSpinner from '../../components/LoadingSpinner';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  ready: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-800'
};

const orderTypeIcons = {
  dine_in: { icon: UtensilsCrossed, label: 'Sur place' },
  takeaway: { icon: ShoppingBag, label: 'À emporter' },
  delivery: { icon: Bike, label: 'Livraison' }
};

export default function OrderHistory() {
  const navigate = useNavigate();
  const { restaurant } = useRestaurantContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [selectedOrderType, setSelectedOrderType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurant?.id) {
      setLoading(false);
      return;
    }

    const historyRef = collection(db, 'restaurants', restaurant.id, 'history');
    const q = query(historyRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const ordersData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            items: data.items || [],
            total: Number(data.total) || 0,
            subtotal: Number(data.subtotal) || 0,
            tax: Number(data.tax) || 0,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            completedAt: data.completedAt?.toDate() || new Date()
          } as Order;
        });
        
        // Filter out any malformed orders
        const validOrders = ordersData.filter(order => 
          order && 
          typeof order.total === 'number' && 
          Array.isArray(order.items)
        );
        
        setOrders(validOrders);
      } catch (err) {
        console.error('Error processing orders:', err);
        setError('Erreur lors du traitement des commandes');
      }
      setLoading(false);
    }, (err) => {
      console.error('Error fetching order history:', err);
      setError('Erreur lors du chargement de l\'historique');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [restaurant?.id]);

  const filteredOrders = (orders || []).filter(order => {
    if (!order) return false;
    if (typeof order.total !== 'number') return false;
    
    // Search by ID
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by payment method
    const matchesPaymentMethod = !selectedPaymentMethod || order.paymentMethod === selectedPaymentMethod;

    // Filter by order type
    const matchesOrderType = !selectedOrderType || order.type === selectedOrderType;

    // Filter by status
    const matchesStatus = !selectedStatus || order.status === selectedStatus;

    // Filter by date
    let matchesDate = true;
    if (dateRange.start && dateRange.end) {
      const orderDate = new Date(order.createdAt);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      matchesDate = orderDate >= startDate && orderDate <= endDate;
    }

    return matchesSearch && matchesPaymentMethod && matchesOrderType && matchesStatus && matchesDate;
  });

  if (loading || !restaurant?.id) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-red-500">{error}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Historique des commandes</h1>
          <p className="mt-1 text-sm text-gray-500">
            {filteredOrders.length} commande{filteredOrders.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun historique pour le moment</p>
          </div>
        ) : (
          <>
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Rechercher une commande..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50"
                >
                  <Filter className="h-5 w-5" />
                  Filtres
                  {(selectedPaymentMethod || selectedOrderType || selectedStatus || dateRange.start) && (
                    <span className="ml-1 px-2 py-0.5 text-xs bg-emerald-500 text-white rounded-full">
                      {[
                        selectedPaymentMethod && 1,
                        selectedOrderType && 1,
                        selectedStatus && 1,
                        dateRange.start && 1
                      ].filter(Boolean).length}
                    </span>
                  )}
                </button>
              </div>

              {showFilters && (
                <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Période
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Moyen de paiement
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['card', 'cash', 'apple_pay'].map((method) => (
                        <button
                          key={method}
                          onClick={() => setSelectedPaymentMethod(
                            selectedPaymentMethod === method ? null : method
                          )}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                            selectedPaymentMethod === method
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {method === 'card' ? 'Carte' : 
                           method === 'cash' ? 'Espèces' : 'Apple Pay'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de commande
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'dine_in', name: 'Sur place' },
                        { id: 'takeaway', name: 'À emporter' },
                        { id: 'delivery', name: 'Livraison' }
                      ].map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setSelectedOrderType(
                            selectedOrderType === type.id ? null : type.id
                          )}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                            selectedOrderType === type.id
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {type.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Statut
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'completed', name: 'Terminée', icon: CheckCircle },
                        { id: 'cancelled', name: 'Annulée', icon: XCircle }
                      ].map((status) => {
                        const Icon = status.icon;
                        return (
                          <button
                            key={status.id}
                            onClick={() => setSelectedStatus(
                              selectedStatus === status.id ? null : status.id
                            )}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                              selectedStatus === status.id
                                ? STATUS_COLORS[status.id as keyof typeof STATUS_COLORS]
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <Icon className="h-4 w-4 mr-1" />
                            {status.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)} 
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-sm text-gray-500">
                          Commande #{order.orderNumber}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-medium">{Number(order.total).toFixed(2)} €</span>
                          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
                            {order.type === 'dine_in' && <UtensilsCrossed className="h-4 w-4 text-gray-600" />}
                            {order.type === 'takeaway' && <ShoppingBag className="h-4 w-4 text-gray-600" />}
                            {order.type === 'delivery' && <Bike className="h-4 w-4 text-gray-600" />}
                            <span className="text-xs text-gray-600">
                              {order.type === 'dine_in' ? 'Sur place' :
                               order.type === 'takeaway' ? 'À emporter' : 'Livraison'}
                            </span>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                            STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]
                          }`}>
                            {order.status === 'completed' ? 'Terminée' : 
                             order.status === 'cancelled' ? 'Annulée' : 
                             order.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-500">
                          <div className="flex items-center gap-1 text-gray-500">
                            <Clock className="h-4 w-4" />
                            {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </span>
                      </div>
                    </div>

                    {expandedOrder === order.id && (
                      <div className="space-y-2">
                        {order.items?.map((item, index) => (
                          <div key={index} className="flex items-center gap-4">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <span className="font-medium">{item.quantity}x {item.name}</span>
                                <span>{(Number(item.price) * Number(item.quantity)).toFixed(2)} €</span>
                              </div>
                              {item.menuOptions && (
                                <div className="text-sm text-gray-500 mt-1">
                                  {item.menuOptions.drink && (
                                    <span>Boisson : {item.menuOptions.drink}</span>
                                  )}
                                  {item.menuOptions.side && (
                                    <span>{item.menuOptions.drink ? ' • ' : ''}Accompagnement : {item.menuOptions.side}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        <div className="pt-2 border-t mt-2">
                          <div className="flex justify-between font-medium">
                            <span>Total</span>
                            <span>{Number(order.total).toFixed(2)} €</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {filteredOrders.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Aucune commande trouvée</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}