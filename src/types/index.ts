export interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  logo: string;
  coverImage: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image: string;
  icon: string;
  order: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  status: 'available' | 'out_of_stock' | 'hidden';
}