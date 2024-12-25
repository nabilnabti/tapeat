import { useState } from 'react';
import { useLocation, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  DollarSign,
  Package,
  Target,
  Percent,
  Award,
  Tags, 
  Users, 
  Settings,
  ChevronRight,
  Utensils,
  Bell,
  History,
  X,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { useRestaurantContext } from '../../context/RestaurantContext';
import { useOrderContext } from '../../context/OrderContext';
import { signOut } from '../../services/authService';

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/admin', 
    icon: LayoutDashboard 
  },
  {
    name: 'Commandes en direct',
    href: '/admin/live-orders',
    icon: Bell
  },
  {
    name: 'Historique',
    href: '/admin/order-history',
    icon: History
  },
  {
    name: 'Comptabilité',
    href: '/admin/accounting',
    icon: DollarSign
  },
  {
    name: 'Inventaire',
    href: '/admin/inventory',
    icon: Package
  },
  { 
    name: 'Menu', 
    href: '/admin/menu',
    icon: UtensilsCrossed,
    subItems: [
      { name: 'Produits', href: '/admin/menu', icon: Utensils },
      { name: 'Menus & Combos', href: '/admin/menu/combos', icon: Package }
    ]
  },
  {
    name: 'Marketing',
    href: '/admin/marketing',
    icon: Target,
    subItems: [
      { name: 'Promotions', href: '/admin/marketing/promotions', icon: Percent },
      { name: 'Programme fidélité', href: '/admin/marketing/loyalty', icon: Award }
    ]
  },
  { 
    name: 'Catégories', 
    href: '/admin/categories', 
    icon: Tags 
  },
  { 
    name: 'Personnel', 
    href: '/admin/staff', 
    icon: Users 
  },
  { 
    name: 'Paramètres', 
    href: '/admin/settings', 
    icon: Settings 
  },
  {
    name: 'Support',
    href: '/admin/support',
    icon: HelpCircle
  }
];

interface AdminSidebarProps {
  onClose?: () => void;
}

export default function AdminSidebar({ onClose }: AdminSidebarProps) {
  const location = useLocation();
  const { restaurant } = useRestaurantContext();
  const { orders } = useOrderContext();
  const navigate = useNavigate();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  // Calculate total active orders
  const totalActiveOrders = orders.filter(o => 
    ['pending', 'preparing', 'ready'].includes(o.status)
  ).length;

  const isActive = (href: string) => 
    location.pathname === href || location.pathname.startsWith(`${href}/`);

  const isSubMenuOpen = (item: any) =>
    openMenus.includes(item.name) || 
    item.subItems?.some((subItem: any) => isActive(subItem.href));

  const toggleMenu = (menuName: string) => {
    setOpenMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="h-16 flex items-center justify-between px-4 border-b">
        <img
          src={restaurant?.logo || "https://tapeat.fr/wp-content/uploads/2024/06/TapEart-2-2048x632.png"}
          alt={restaurant?.name || "TapEat"}
          className="h-10"
        />
        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => (
          <div key={item.name}>
            {item.subItems ? (
              <>
                <button
                  onClick={() => toggleMenu(item.name)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold transition-colors ${
                    isSubMenuOpen(item)
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="h-6 w-6" />
                  <span className="flex-1">{item.name}</span>
                  {item.href === '/admin/live-orders' && totalActiveOrders > 0 && (
                    <span className="flex items-center justify-center min-w-[24px] h-6 px-2 text-sm font-bold rounded-full bg-red-500 text-white">
                      {totalActiveOrders}
                    </span>
                  )}
                  <ChevronRight 
                    className={`h-4 w-4 transition-transform ${
                      isSubMenuOpen(item) ? 'rotate-90' : ''
                    }`}
                  />
                </button>
                <div className={`ml-10 mt-2 space-y-2 ${isSubMenuOpen(item) ? 'block' : 'hidden'}`}>
                  {item.subItems.map((subItem) => (
                    <NavLink
                      key={subItem.href}
                      to={subItem.href}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`
                      }
                    >
                      <subItem.icon className="h-5 w-5" />
                      {subItem.name}
                    </NavLink>
                  ))}
                </div>
              </>
            ) : (
              <NavLink
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <div className="flex items-center gap-3 flex-1">
                  <item.icon className="h-6 w-6" />
                  <span className="text-base font-semibold">{item.name}</span>
                </div>
                {item.href === '/admin/live-orders' && totalActiveOrders > 0 && (
                  <span className="flex items-center justify-center min-w-[24px] h-6 px-2 text-sm font-bold rounded-full bg-red-500 text-white ml-auto">
                    {totalActiveOrders}
                  </span>
                )}
              </NavLink>
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-gray-900 truncate">
              {restaurant?.name || "Urban Burger"}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {restaurant?.email || "contact@urbanburger.com"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Déconnexion"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}