import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import QRCode from 'qrcode';

export interface QRCodeData {
  id?: string;
  restaurantId: string;
  label: string;
  tableNumber?: string;
  url: string;
  qrCodeImage: string;
  createdAt: Date;
}

export async function generateQRCode(restaurantId: string, data: { 
  label: string; 
  tableNumber?: string; 
}): Promise<string> {
  try {
    // Generate the URL for the QR code
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/restaurant?restaurantId=${restaurantId}${
      data.tableNumber?.trim() ? `&table=${data.tableNumber.trim()}` : ''
    }`;

    // Generate QR code image
    const qrCodeImage = await QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      }
    });

    // Save to Firestore
    const qrCodeRef = collection(db, 'restaurants', restaurantId, 'qrCodes');
    const docRef = await addDoc(qrCodeRef, {
      restaurantId: restaurantId,
      label: data.label.trim(),
      tableNumber: data.tableNumber?.trim() || null,
      url: url,
      qrCodeImage,
      createdAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

export async function getRestaurantQRCodes(restaurantId: string): Promise<QRCodeData[]> {
  try {
    const q = query(
      collection(db, 'restaurants', restaurantId, 'qrCodes')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as QRCodeData[];
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    throw error;
  }
}

export async function deleteQRCode(restaurantId: string, qrCodeId: string): Promise<void> {
  try {
    if (!restaurantId || !qrCodeId) {
      throw new Error('Restaurant ID and QR code ID are required');
    }
    await deleteDoc(doc(db, 'restaurants', restaurantId, 'qrCodes', qrCodeId));
  } catch (error) {
    console.error('Error deleting QR code:', error);
    throw error;
  }
}

export async function downloadQRCode(qrCodeImage: string, fileName: string): Promise<void> {
  try {
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = qrCodeImage;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading QR code:', error);
    throw error;
  }
}