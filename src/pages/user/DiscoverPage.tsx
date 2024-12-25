import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Map as MapIcon, List, ChevronRight, AlertCircle } from 'lucide-react';
import { getCurrentLocation } from '../../services/locationService';
import type { Location } from '../../services/locationService';
import BottomNavigation from '../../components/layout/BottomNavigation';
import LocationSelector from '../../components/user/LocationSelector';
import RestaurantCard from '../../components/user/RestaurantCard';
import RestaurantMap from '../../components/user/RestaurantMap';
import { getNearbyRestaurants } from '../../services/restaurantService';
import LoadingSpinner from '../../components/LoadingSpinner';

const SECTIONS = [
  { id: 'recommended', title: 'Recommandé pour vous' },
  { id: 'nearby', title: 'À proximité' }
];

export default function DiscoverPage() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [currentAddress, setCurrentAddress] = useState('à moins de 2 km');
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleLocationChange = async (location: { lat: number; lng: number; address: string }) => {
    setUserLocation({ lat: location.lat, lng: location.lng, address: location.address });
    setCurrentAddress(location.address);
    await loadRestaurants(location.lat, location.lng);
  };

  useEffect(() => {
    const initializeLocation = async () => {
      try {
        setLoading(true);
        setLocationError(null);
        const location = await getCurrentLocation();
        setUserLocation(location);
        setCurrentAddress(location.address);
        await loadRestaurants(location.lat, location.lng);
      } catch (err) {
        console.error('Location error:', err);
        setLocationError('Impossible d\'obtenir votre position exacte. Affichage des restaurants à proximité de Marseille.');
      } finally {
        setLoading(false);
      }
    };
    
    initializeLocation();
  }, []);

  const loadRestaurants = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const data = await getNearbyRestaurants(lat, lng);
      setRestaurants(data);
    } catch (err) {
      console.error('Error loading restaurants:', err);
      setError('Erreur lors du chargement des restaurants');
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="px-4 pt-4 pb-2">
          {locationError && (
            <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>{locationError}</p>
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-500" />
              <LocationSelector 
                currentLocation={currentAddress}
                onLocationChange={handleLocationChange}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher un restaurant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-2xl text-gray-600 focus:outline-none"
                />
                <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
              className="p-3 bg-gray-50 rounded-2xl"
            >
              {viewMode === 'list' ? <MapIcon className="h-5 w-5" /> : <List className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className={`pt-36 ${viewMode === 'list' ? 'pb-24 overflow-y-auto' : 'flex-1'}`}>
        {viewMode === 'list' ? (
          <div className="px-4 space-y-10">
            {SECTIONS.map((section) => {
              const sectionRestaurants = section.id === 'nearby'
                ? [...filteredRestaurants].sort((a, b) => a.distance - b.distance)
                : filteredRestaurants;

              return (
                <section key={section.id} className="space-y-4">
                  <div className="flex items-center justify-between mb-4 pr-4">
                    <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
                    <button 
                      onClick={() => navigate(`/restaurants?type=${section.id}`)}
                      className="text-emerald-500 text-sm font-medium flex items-center gap-1 whitespace-nowrap"
                    >
                      Voir plus
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex overflow-x-auto hide-scrollbar gap-4 -mx-4 px-4 pb-2">
                    {sectionRestaurants.map((restaurant) => (
                      <div key={restaurant.id} className="flex-none w-[260px]">
                        <RestaurantCard 
                          restaurant={restaurant}
                          variant="default"
                        />
                      </div>
                    ))}
                    {sectionRestaurants.length === 0 && (
                      <div className="w-full text-center py-8 text-gray-500">
                        Aucun restaurant disponible pour le moment
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="absolute inset-0 top-32 bottom-24">
            <RestaurantMap
              restaurants={filteredRestaurants}
              userLocation={userLocation}
              onRestaurantClick={(restaurant) => navigate(`/restaurant?restaurantId=${restaurant.id}`)}
            />
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNavigation />
      </div>
    </div>
  );
}