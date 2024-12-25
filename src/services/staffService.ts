import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface StaffMember {
  id?: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'server' | 'kitchen';
  status: 'active' | 'inactive';
  restaurantId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export async function addStaffMember(staffData: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const docRef = await addDoc(collection(db, 'restaurants', staffData.restaurantId, 'staff'), {
      ...staffData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding staff member:', error);
    throw error;
  }
}

export async function updateStaffMember(staffId: string, staffData: Partial<StaffMember>) {
  try {
    const staffRef = doc(db, 'restaurants', restaurantId, 'staff', staffId);
    await updateDoc(staffRef, {
      ...staffData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating staff member:', error);
    throw error;
  }
}

export async function deleteStaffMember(staffId: string) {
  try {
    await deleteDoc(doc(db, 'restaurants', restaurantId, 'staff', staffId));
  } catch (error) {
    console.error('Error deleting staff member:', error);
    throw error;
  }
}

export async function getStaffMemberById(staffId: string) {
  try {
    const staffRef = doc(db, 'restaurants', restaurantId, 'staff', staffId);
    const docSnap = await getDoc(staffRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate()
      } as StaffMember;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching staff member:', error);
    throw error;
  }
}