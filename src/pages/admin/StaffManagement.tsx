import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, MapPin, Phone, ChevronRight } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import StaffForm from '../../components/admin/StaffForm';
import DriverForm from '../../components/admin/DriverForm';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useRestaurantContext } from '../../context/RestaurantContext';
import { useDrivers } from '../../hooks/useDrivers';

const STATUS_COLORS = {
  available: 'bg-green-100 text-green-800',
  busy: 'bg-yellow-100 text-yellow-800',
  offline: 'bg-gray-100 text-gray-800'
};

const TABS = [
  { id: 'staff', name: 'Personnel' },
  { id: 'drivers', name: 'Livreurs' }
];

export default function StaffManagement() {
  const { restaurant } = useRestaurantContext();
  const { drivers, loading: driversLoading, error: driversError, addDriver, updateDriver, deleteDriver } = useDrivers();
  const [activeTab, setActiveTab] = useState('staff');
  const [showForm, setShowForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurant?.id) return;

    const staffRef = collection(db, 'restaurants', restaurant.id, 'staff');
    const unsubscribe = onSnapshot(staffRef, (snapshot) => {
      const staffData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStaff(staffData);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching staff:', err);
      setError('Erreur lors du chargement du personnel');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [restaurant?.id]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
      return;
    }
    try {
      if (activeTab === 'staff') {
        if (!restaurant?.id) return;
        await deleteDoc(doc(db, 'restaurants', restaurant.id, 'staff', id));
      } else {
        await deleteDriver(id);
      }
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (activeTab === 'staff') {
        if (!restaurant?.id) {
          throw new Error('Restaurant ID is required');
        }

        if (selectedStaff) {
          const staffRef = doc(db, 'restaurants', restaurant.id, 'staff', selectedStaff.id);
          await updateDoc(staffRef, {
            ...data,
            updatedAt: serverTimestamp()
          });
        } else {
          await addDoc(collection(db, 'restaurants', restaurant.id, 'staff'), {
            ...data,
            restaurantId: restaurant.id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      } else {
        if (selectedDriver) {
          await updateDriver(selectedDriver.id, data);
        } else {
          await addDriver(data);
        }
      }
      setShowForm(false);
      setSelectedStaff(null);
      setSelectedDriver(null);
    } catch (err) {
      console.error('Error saving:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  if (loading || driversLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  const filteredItems = activeTab === 'staff' 
    ? staff.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : drivers.filter(driver =>
        driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driver.email.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <AdminLayout>
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion du Personnel</h1>
              <div className="mt-1 flex items-center gap-4">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`text-sm font-medium ${
                      activeTab === tab.id
                        ? 'text-emerald-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => {
                if (activeTab === 'staff') {
                  setSelectedStaff(null);
                } else {
                  setSelectedDriver(null);
                }
                setShowForm(true);
              }}
              className="bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-600"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">
                {activeTab === 'staff' ? 'Ajouter un membre' : 'Ajouter un livreur'}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder={`Rechercher ${activeTab === 'staff' ? 'un membre' : 'un livreur'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Version mobile */}
        <div className="sm:hidden space-y-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-emerald-600 font-medium">
                      {item.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.email}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
              {activeTab === 'drivers' && (
                <div className="mt-3 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{item.zone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{item.phone}</span>
                  </div>
                </div>
              )}
              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={() => {
                    if (activeTab === 'staff') {
                      setSelectedStaff(item);
                    } else {
                      setSelectedDriver(item);
                    }
                    setShowForm(true);
                  }}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Version desktop */}
        <div className="hidden sm:block">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {activeTab === 'staff' ? (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Membre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rôle
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Livreur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Véhicule
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Zone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                    </>
                  )}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <span className="text-emerald-600 font-medium">
                              {item.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {item.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    {activeTab === 'staff' ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status === 'active' ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.vehicleType}</div>
                          <div className="text-sm text-gray-500">{item.vehicleNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{item.zone}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_COLORS[item.status as keyof typeof STATUS_COLORS]
                          }`}>
                            {item.status === 'available' ? 'Disponible' :
                             item.status === 'busy' ? 'En livraison' : 'Hors ligne'}
                          </span>
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          if (activeTab === 'staff') {
                            setSelectedStaff(item);
                          } else {
                            setSelectedDriver(item);
                          }
                          setShowForm(true);
                        }}
                        className="text-emerald-600 hover:text-emerald-900 mr-4"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Aucun résultat trouvé</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        activeTab === 'staff' ? (
          <StaffForm
            staff={selectedStaff}
            onClose={() => {
              setShowForm(false);
              setSelectedStaff(null);
            }}
            onSubmit={handleSubmit}
          />
        ) : (
          <DriverForm
            driver={selectedDriver}
            onClose={() => {
              setShowForm(false);
              setSelectedDriver(null);
            }}
            onSubmit={handleSubmit}
          />
        )
      )}
    </AdminLayout>
  );
}