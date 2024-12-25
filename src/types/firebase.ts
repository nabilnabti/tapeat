export interface Order {
  id: string;
  orderNumber: string;
  restaurantId: string;
  table?: string;
  type: 'delivery' | 'takeaway' | 'dine_in';
  status: 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'delivered' | 'completed' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  deliveryFee?: number;
  driverId?: string | null;
  delivery?: {
    address: string;
    additionalInfo?: string;
    phone?: string;
    name?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  paymentStatus: string;
  paymentMethod: string;
  scheduledTime: string | null;
}

export interface InventoryItem {
  id: string;
  name: string;
  image?: string;
  quantity: number;
  unit: string;
  optimalStock: number;
  category: string;
  price: number;
  restaurantId: string;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
  linkedItems?: Array<{
    menuItemId: string;
    menuItemName: string; 
    quantityPerItem: number;
  }>;
}

export interface RestaurantTheme {
  primaryColor: string;
}

export interface Promotion {
  id: string;
  type: 'double' | 'discount' | 'free' | 'second_item_discount';
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  conditions: {
    productId: string;
    productName: string;
    discountPercent: number;
    freeProductId?: string;
    freeProductName?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}