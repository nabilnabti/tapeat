import { doc, setDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function requestNotificationPermission(userId: string) {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Register service worker if not already registered
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
      }
      
      // Save token to user's document
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        notificationsEnabled: true,
        updatedAt: serverTimestamp()
      });

      return true;
    }
    return false;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

export async function sendOrderNotification(userId: string, orderId: string, status: string) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return;
    
    const userData = userDoc.data();
    if (!userData.notificationsEnabled) return;

    const notificationData = {
      title: 'Mise à jour de votre commande',
      body: getNotificationMessage(status),
      icon: 'https://tapeat.fr/wp-content/uploads/2024/06/TapEart-2-2048x632.png',
      click_action: `/track-order/${orderId}`,
      orderId
    };

    // Save notification in Firestore
    const notificationRef = doc(collection(db, 'users', userId, 'notifications'));
    await setDoc(notificationRef, {
      ...notificationData,
      read: false,
      createdAt: serverTimestamp()
    });

    // Send push notification if supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(notificationData.title, {
        body: notificationData.body,
        icon: notificationData.icon,
        data: {
          url: notificationData.click_action
        }
      });
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

function getNotificationMessage(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'Votre commande a été confirmée !';
    case 'preparing':
      return 'Votre commande est en cours de préparation';
    case 'ready':
      return 'Votre commande est prête !';
    case 'delivering':
      return 'Votre commande est en cours de livraison';
    case 'delivered':
      return 'Votre commande a été livrée';
    default:
      return 'Le statut de votre commande a été mis à jour';
  }
}