import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Clock, MapPin, Receipt, CheckCircle, Package, UtensilsCrossed, AlertCircle } from 'lucide-react';
import { doc, onSnapshot, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import OrderSummary from '../components/OrderSummary';
import type { Order } from '../types/firebase';

const STEPS = [
  { 
    id: 'received',
    label: 'Commande reçue',
    icon: Receipt,
    description: 'Votre commande a été reçue par le restaurant'
  },
  { 
    id: 'confirmed',
    label: 'Confirmée',
    icon: CheckCircle,
    description: 'Le restaurant a confirmé votre commande'
  },
  { 
    id: 'preparing',
    label: 'En préparation',
    icon: UtensilsCrossed,
    description: 'Votre commande est en cours de préparation'
  },
  { 
    id: 'ready',
    label: 'Prête',
    icon: Package,
    description: 'Votre commande est prête !'
  }
];

export default function TrackOrder() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStepDescription, setCurrentStepDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      navigate('/menu');
      return;
    }

    // Try to get the order from all restaurants
    const getOrderRestaurant = async () => {
      try {
        setLoading(true);
        const restaurantsRef = collection(db, 'restaurants');
        const restaurantsSnapshot = await getDocs(restaurantsRef);
        
        for (const restaurantDoc of restaurantsSnapshot.docs) {
          const orderRef = doc(db, 'restaurants', restaurantDoc.id, 'orders', orderId);
          const orderDoc = await getDoc(orderRef);
          
          if (orderDoc.exists()) {
            setRestaurantId(restaurantDoc.id);
            break;
          }
        }
      } catch (err) {
        console.error('Error finding order:', err);
        setError('Erreur lors du chargement de la commande');
      } finally {
        setLoading(false);
      }
    };

    getOrderRestaurant();
  }, [orderId, navigate, user]);

  useEffect(() => {
    if (!orderId || !restaurantId || loading) return;

    // Subscribe to real-time updates from restaurant's orders
    const orderRef = doc(db, 'restaurants', restaurantId, 'orders', orderId);
    const unsubscribe = onSnapshot(
      orderRef,
      (doc) => {
        if (doc.exists()) {
          const orderData = {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date()
          } as Order;
          setOrder(orderData);
          updateOrderProgress(orderData.status);
        } else {
          setError('Commande introuvable');
        }
      },
      (err) => {
        console.error('Error listening to order:', err);
        setError('Erreur lors du suivi de la commande');
      }
    );

    return () => unsubscribe();
  }, [orderId, restaurantId, loading]);

  const updateOrderProgress = (status: string) => {
    setIsAnimating(true);
    let step = 1;
    let description = '';

    switch (status) {
      case 'confirmed':
        step = 2;
        description = 'Le restaurant prépare votre commande';
        break;
      case 'preparing':
        step = 3;
        description = 'Votre commande est en cours de préparation';
        break;
      case 'ready':
        step = 4;
        description = 'Votre commande est prête !';
        break;
      default:
        step = 1;
        description = 'Votre commande a été reçue par le restaurant';
    }
    
    setCurrentStep(step);
    setCurrentStepDescription(description);
  };

  useEffect(() => {
    const targetProgress = ((currentStep - 1) / 3) * 100;
    let animationFrame: number;

    const animate = () => {
      setProgress(prev => {
        const diff = targetProgress - prev;
        const increment = diff * 0.1;
        
        if (Math.abs(diff) < 0.1) {
          setIsAnimating(false);
          return targetProgress;
        }
        
        const nextProgress = prev + increment;
        animationFrame = requestAnimationFrame(animate);
        return nextProgress;
      });
    };

    if (isAnimating) {
      animationFrame = requestAnimationFrame(animate);
    }

    return () => cancelAnimationFrame(animationFrame);
  }, [currentStep, isAnimating]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
          <p className="text-gray-500">{error || 'Commande introuvable'}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="flex items-center p-4">
          <button 
            onClick={() => navigate('/history')}
            className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <h1 className="ml-4 text-xl font-semibold">Suivi de commande</h1>
        </div>
      </div>

      <div className="pt-20 px-4 pb-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-4">
            <Receipt className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">{order.orderNumber}</h2>
          <p className="text-gray-600 mb-4">Numéro de commande</p>
        </div>

        <div className="bg-white rounded-xl p-6 mb-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 text-emerald-500">
              <MapPin className="h-4 w-4" />
              <span>{order.type === 'dine_in' ? 'Sur place' : 'À emporter'}</span>
            </div>
            {order.scheduledTime && (
              <div className="flex items-center justify-center gap-2 mt-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>
                  {new Date(order.scheduledTime.date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })} à {order.scheduledTime.time}
                </span>
              </div>
            )}
          </div>

          <div className="relative mb-8">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="relative flex justify-between">
              {STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index + 1 === currentStep;
                const isCompleted = index + 1 < currentStep;

                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                        isCompleted ? 'bg-emerald-500 text-white scale-110 transform' :
                        isActive ? 'bg-emerald-100 text-emerald-500 scale-110 transform animate-pulse' :
                        'bg-gray-200 text-gray-400'
                      }`}
                    >
                      <StepIcon className={`h-4 w-4 ${
                        isActive ? 'animate-bounce transition-transform duration-500' : ''
                      }`} />
                    </div>
                    <span className={`mt-2 text-xs text-center transition-colors duration-500 ${
                      isActive ? 'text-emerald-500 font-medium' :
                      isCompleted ? 'text-gray-900' :
                      'text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current step description */}
          <div className="text-center mb-6">
            <p className={`text-lg font-medium ${
              currentStep === 4 ? 'text-emerald-500' : 'text-gray-700'
            }`}>
              {currentStepDescription}
            </p>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <Clock className="h-5 w-5 text-gray-400" />
            <span className="text-gray-600">
              Temps de préparation estimé: 15-20 minutes
            </span>
          </div>
        </div>

        <OrderSummary
          items={order.items}
          subtotal={order.subtotal}
          tax={order.tax}
          total={order.total}
        />
      </div>
    </div>
  );
}