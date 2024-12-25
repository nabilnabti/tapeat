import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Clock } from 'lucide-react';
import { useOrderContext } from '../../context/OrderContext';
import AdminLayout from '../../components/admin/AdminLayout';
import SalesChart from '../../components/admin/charts/SalesChart';
import OrdersChart from '../../components/admin/charts/OrdersChart';
import TopProducts from '../../components/admin/TopProducts';

export default function AdminDashboard() {
  const { orders } = useOrderContext();
  const [stats, setStats] = useState({
    totalSales: 0,
    ordersCount: 0,
    averageOrder: 0,
    pendingOrders: 0,
    totalOrders: 0
  });

  useEffect(() => {
    if (!orders?.length) {
      setStats({
        totalSales: 0,
        ordersCount: 0,
        averageOrder: 0,
        pendingOrders: 0,
        totalOrders: 0
      });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });

    const totalSales = todayOrders.reduce((sum, order) => {
      const total = Number(order.total) || 0;
      return sum + total;
    }, 0);

    const averageOrder = todayOrders.length > 0 ? totalSales / todayOrders.length : 0;

    const pendingOrders = orders.filter(order => 
      ['pending', 'preparing'].includes(order.status)
    ).length;

    setStats({
      totalSales,
      ordersCount: todayOrders.length,
      averageOrder,
      pendingOrders,
      totalOrders: orders.length
    });
  }, [orders]); // Recalculer quand les commandes changent

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Statistiques */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Ventes du jour */}
            <div className="bg-white overflow-hidden shadow-sm rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Ventes du jour
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900"> 
                          {Number(stats.totalSales).toFixed(2)} €
                        </div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                          <TrendingUp className="self-center flex-shrink-0 h-4 w-4" />
                          <span className="sr-only">Augmentation</span>
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Commandes du jour */}
            <div className="bg-white overflow-hidden shadow-sm rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ShoppingBag className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Commandes du jour
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stats.ordersCount}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Panier moyen */}
            <div className="bg-white overflow-hidden shadow-sm rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Panier moyen
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {Number(stats.averageOrder).toFixed(2)} €
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Commandes en cours */}
            <div className="bg-white overflow-hidden shadow-sm rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Commandes en cours
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stats.pendingOrders}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Graphiques */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-6">Chiffre d'affaires</h3>
              <SalesChart period="week" />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-6">Commandes</h3>
              <OrdersChart period="week" />
            </div>
          </div>

          {/* Produits les plus vendus */}
          <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium mb-6">Produits les plus vendus</h3>
            <TopProducts />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}