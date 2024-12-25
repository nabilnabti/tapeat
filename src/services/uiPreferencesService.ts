import { doc, updateDoc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

interface ButtonPosition {
  x: number;
  y: number;
}

export async function saveButtonPosition(restaurantId: string, position: ButtonPosition): Promise<void> {
  try {
    if (!restaurantId) {
      throw new Error('Restaurant ID is required');
    }

    // Validate position values
    if (typeof position.x !== 'number' || typeof position.y !== 'number') {
      throw new Error('Invalid position values');
    }

    // Ensure position is within viewport bounds
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;

    const validPosition = {
      x: Math.max(0, Math.min(position.x, maxWidth - 56)),
      y: Math.max(0, Math.min(position.y, maxHeight - 56))
    };

    const preferencesRef = doc(db, 'restaurants', restaurantId, 'settings', 'uiPreferences');
    const docSnap = await getDoc(preferencesRef);
    
    if (docSnap.exists()) {
      await updateDoc(preferencesRef, {
        keypadButtonPosition: validPosition,
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(preferencesRef, {
        keypadButtonPosition: validPosition,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error saving button position:', error);
    throw error;
  }
}

export async function getButtonPosition(restaurantId: string): Promise<ButtonPosition | null> {
  try {
    const preferencesRef = doc(db, 'restaurants', restaurantId, 'settings', 'uiPreferences');
    const docSnap = await getDoc(preferencesRef);
    
    if (docSnap.exists() && docSnap.data().keypadButtonPosition) {
      return docSnap.data().keypadButtonPosition as ButtonPosition;
    }
    return null;
  } catch (error) {
    console.error('Error getting button position:', error);
    return null;
  }
}