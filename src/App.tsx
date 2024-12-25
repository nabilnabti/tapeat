import { useState, useEffect, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import SplashScreen from './pages/SplashScreen';
import Menu from './pages/Menu';
import RestaurantDetails from './pages/RestaurantDetails';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import TrackOrder from './pages/TrackOrder';
import ProductCustomization from './pages/ProductCustomization';
import ScanPage from './pages/user/ScanPage';
import DiscoverPage from './pages/user/DiscoverPage';
import RestaurantListPage from './pages/user/RestaurantListPage';
import FavoritesPage from './pages/user/FavoritesPage';
import HistoryPage from './pages/user/HistoryPage';
import ProfilePage from './pages/user/ProfilePage';
import SignUpPage from './pages/auth/SignUpPage';
import SignIn from './pages/auth/SignIn';
import EditProfilePage from './pages/user/profile/EditProfilePage';
import ChangePasswordPage from './pages/user/profile/ChangePasswordPage';
import NotificationsPage from './pages/user/profile/NotificationsPage';
import InstallPWA from './components/InstallPWA';

// Admin imports
import AdminDashboard from './pages/admin/AdminDashboard';
import LiveOrders from './pages/admin/LiveOrders';
import OrderHistory from './pages/admin/OrderHistory';
import Accounting from './pages/admin/Accounting';
import MenuManagement from './pages/admin/MenuManagement';
import MenuItemForm from './pages/admin/MenuItemForm';
import PromotionsPage from './pages/admin/marketing/PromotionsPage';
import PromotionForm from './pages/admin/marketing/PromotionForm';
import ComboManagement from './pages/admin/ComboManagement';
import ComboForm from './pages/admin/ComboForm';
import CategoryManagement from './pages/admin/CategoryManagement';
import CategoryForm from './pages/admin/CategoryForm';
import StaffManagement from './pages/admin/StaffManagement';
import InventoryManagement from './pages/admin/InventoryManagement';
import Settings from './pages/admin/settings';
import RestaurantSettings from './pages/admin/settings/RestaurantSettings';
import OptionsSettings from './pages/admin/settings/OptionsSettings';
import QrCodeSettings from './pages/admin/settings/QrCodeSettings';
import BankingSettings from './pages/admin/settings/BankingSettings';
import ProfileSettings from './pages/admin/settings/ProfileSettings';
import ThemeSettings from './pages/admin/settings/ThemeSettings';
import Support from './pages/admin/Support';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ProtectedRoute from './components/admin/ProtectedRoute';
import DriverDashboard from './pages/driver/DriverDashboard';
import DeliveryTracking from './pages/driver/DeliveryTracking';
import { OrderProvider } from './context/OrderContext';
import { RestaurantProvider } from './context/RestaurantContext';
import { CartProvider } from './context/CartContext';
import UpdatePrompt from './components/UpdatePrompt';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Show splash screen for 1.5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Redirect from root to discover page
    if (location.pathname === '/') {
      navigate('/discover');
    }
  }, [location.pathname, navigate]);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <>
      <RestaurantProvider>
        <CartProvider>
          <OrderProvider>
            <Suspense fallback={<SplashScreen />}>
              <Routes>
              <Route path="/" element={<DiscoverPage />} />
              <Route path="/track-order/:orderId" element={<TrackOrder />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/restaurant" element={<RestaurantDetails />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-confirmation" element={<OrderConfirmation />} />
              <Route path="/customize/:productId" element={<ProductCustomization />} />
              <Route path="/splash" element={<SplashScreen />} />
              <Route path="/discover" element={<DiscoverPage />} />
              <Route path="/scan" element={<ScanPage />} />
              <Route path="/restaurants" element={<RestaurantListPage />} />
              <Route path="/favourites" element={<FavoritesPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/profile" element={<ProfilePage />} />
        
              {/* Routes profil */}
              <Route path="/profile/edit" element={<EditProfilePage />} />
              <Route path="/profile/password" element={<ChangePasswordPage />} />
              <Route path="/profile/notifications" element={<NotificationsPage />} />

              {/* Routes d'authentification */}
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUpPage />} />

              {/* Routes admin */}
              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin/register" element={<Register />} />
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute>
                    <OrderProvider>
                      <Routes>
                      <Route path="/" element={<AdminDashboard />} />
                      <Route path="/live-orders" element={<LiveOrders />} />
                      <Route path="/order-history" element={<OrderHistory />} />
                      <Route path="/accounting" element={<Accounting />} />
                      <Route path="/inventory" element={<InventoryManagement />} />
                      <Route path="/menu" element={<MenuManagement />} />
                      <Route path="/menu/new" element={<MenuItemForm />} />
                      <Route path="/menu/edit/:id" element={<MenuItemForm />} />
                      <Route path="/menu/combos" element={<ComboManagement />} />
                      <Route path="/menu/combo/new" element={<ComboForm />} />
                      <Route path="/menu/combo/edit/:id" element={<ComboForm />} />
                      <Route path="/marketing/promotions" element={<PromotionsPage />} />
                      <Route path="/marketing/promotions/new" element={<PromotionForm />} />
                      <Route path="/marketing/promotions/edit/:id" element={<PromotionForm />} />
                      <Route path="/categories" element={<CategoryManagement />} />
                      <Route path="/categories/new" element={<CategoryForm />} />
                      <Route path="/categories/edit/:id" element={<CategoryForm />} />
                      <Route path="/staff" element={<StaffManagement />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/settings/restaurant" element={<RestaurantSettings />} />
                      <Route path="/settings/options" element={<OptionsSettings />} />
                      <Route path="/settings/qrcodes" element={<QrCodeSettings />} />
                      <Route path="/settings/theme" element={<ThemeSettings />} />
                      <Route path="/settings/banking" element={<BankingSettings />} />
                      <Route path="/settings/profile" element={<ProfileSettings />} />
                      <Route path="/support" element={<Support />} />
                    </Routes>
                    </OrderProvider>
                  </ProtectedRoute>
                }
              />

              {/* Routes driver */}
              <Route path="/driver/*" element={
                <OrderProvider>
                  <Routes>
                    <Route path="/" element={<DriverDashboard />} />
                    <Route path="/delivery/:orderId" element={<DeliveryTracking />} />
                  </Routes>
                </OrderProvider>
              } />
              </Routes>
            </Suspense>
          </OrderProvider>
        </CartProvider>
      </RestaurantProvider>
      <UpdatePrompt />
      <InstallPWA />
    </>
  );
}