import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { uploadImage } from './uploadService';
import type { MenuItem, ComboSection } from '../types/firebase';

export async function createMenuItem(
  restaurantId: string, 
  itemData: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>,
  imageFile?: File
): Promise<MenuItem> {
  try {
    if (!restaurantId) {
      throw new Error('Restaurant ID is required');
    }

    let imageUrl = itemData.image;

    if (imageFile) {
      const imagePath = `restaurants/${restaurantId}/menuItems`;
      imageUrl = await uploadImage(imageFile, imagePath);
    }

    const menuRef = collection(db, 'restaurants', restaurantId, 'menuItems');
    const docRef = await addDoc(menuRef, {
      ...itemData,
      restaurantId,
      order: 0, // Default order for new items
      image: imageUrl,
      status: 'available',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return {
      id: docRef.id,
      ...itemData,
      image: imageUrl,
      createdAt: new Date(),
      updatedAt: new Date()
    } as MenuItem;
  } catch (error) {
    console.error('Error creating menu item:', error);
    throw error;
  }
}

export async function createCombo(
  restaurantId: string,
  comboData: {
    name: string;
    description: string;
    price: number;
    mainProductId: string;
    mainProduct: any;
    sections: ComboSection[];
    categoryId: string;
    status?: 'available' | 'out_of_stock' | 'hidden';
    image?: string;
  },
  imageFile?: File
): Promise<MenuItem> {
  try {
    let imageUrl = comboData.image;

    if (imageFile) {
      const imagePath = `restaurants/${restaurantId}/menuItems`;
      console.log('Uploading combo image to:', imagePath);
      imageUrl = await uploadImage(imageFile, imagePath);
    }

    // Si aucune image n'est fournie, utiliser l'image du produit principal
    if (!imageUrl && comboData.mainProduct) {
      imageUrl = comboData.mainProduct.image;
    }

    const menuRef = collection(db, 'restaurants', restaurantId, 'menuItems');
    const docRef = await addDoc(menuRef, {
      name: comboData.name,
      description: comboData.description,
      price: comboData.price,
      mainProductId: comboData.mainProductId,
      sections: comboData.sections,
      categoryId: comboData.categoryId,
      image: imageUrl,
      isCombo: true,
      status: comboData.status || 'available',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return {
      id: docRef.id,
      name: comboData.name,
      description: comboData.description,
      price: comboData.price,
      mainProductId: comboData.mainProductId,
      sections: comboData.sections,
      categoryId: comboData.categoryId,
      image: imageUrl,
      isCombo: true,
      status: comboData.status || 'available',
      createdAt: new Date(),
      updatedAt: new Date()
    } as MenuItem;
  } catch (error) {
    console.error('Error creating combo:', error);
    throw error;
  }
}

export async function getMenuItems(restaurantId: string): Promise<MenuItem[]> {
  try {
    if (!restaurantId) {
      throw new Error('Restaurant ID is required');
    }

    const menuRef = collection(db, 'restaurants', restaurantId, 'menuItems');
    const q = query(
      menuRef,
      orderBy('order', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as MenuItem[];
  } catch (error) {
    console.error('Error fetching menu items:', error);
    throw error;
  }
}

export async function updateMenuItem(
  itemId: string, 
  restaurantId: string,
  updates: Partial<MenuItem>, 
  imageFile?: File
): Promise<void> {
  try {
    let imageUrl = updates.image;

    if (imageFile) {
      imageUrl = await uploadImage(imageFile, `restaurants/${restaurantId}/menu`);
    }

    const itemRef = doc(db, 'restaurants', restaurantId, 'menuItems', itemId);
    const updateData = {
      ...updates,
      ...(imageUrl && { image: imageUrl }),
      updatedAt: serverTimestamp()
    };

    await updateDoc(itemRef, updateData);
  } catch (error) {
    console.error('Error updating menu item:', error);
    throw error;
  }
}

export async function deleteMenuItem(itemId: string, restaurantId: string): Promise<void> {
  try {
    if (!restaurantId || !itemId) {
      throw new Error('Restaurant ID and item ID are required');
    }
    await deleteDoc(doc(db, 'restaurants', restaurantId, 'menuItems', itemId));
  } catch (error) {
    console.error('Error deleting menu item:', error);
    throw new Error('Failed to delete menu item');
  }
}