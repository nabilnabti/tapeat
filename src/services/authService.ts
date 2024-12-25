import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}
import { getCoordsFromAddress } from './locationService';

interface RegisterRestaurantData {
  email: string;
  password: string;
  name: string;
  phone: string;
  address: string;
}

export async function registerRestaurant(data: RegisterRestaurantData) {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const user = userCredential.user;

    // Create restaurant document in Firestore
    const restaurantRef = doc(db, 'restaurants', user.uid);
    
    // Get coordinates for the address
    const location = await getCoordsFromAddress(data.address);
    
    await setDoc(restaurantRef, {
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      location,
      ownerId: user.uid,
      isOpen: true,
      paymentMethods: ['card', 'cash'],
      serviceOptions: ['dine_in', 'takeaway'],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return user;
  } catch (error: any) {
    console.error('Error registering restaurant:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Cette adresse email est déjà utilisée');
    }
    
    throw new Error('Une erreur est survenue lors de l\'inscription');
  }
}

export async function registerUser(data: RegisterData) {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const user = userCredential.user;

    // Update profile with display name
    await updateProfile(user, {
      displayName: `${data.firstName} ${data.lastName}`
    });

    // Create user document in Firestore
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      displayName: `${data.firstName} ${data.lastName}`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    });

    return user;
  } catch (error: any) {
    console.error('Error registering user:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Cette adresse email est déjà utilisée');
    }
    
    throw new Error('Une erreur est survenue lors de l\'inscription');
  }
}

export async function signIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error('Error signing in:', error);
    if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
      throw new Error('Email ou mot de passe incorrect');
    }
    throw new Error('Une erreur est survenue lors de la connexion');
  }
}

export async function signOut(isAdmin: boolean = false) {
  try {
    await firebaseSignOut(auth);
    // Force page reload after signout to clear all states
    if (isAdmin) {
      window.location.replace('/admin/login');
    } else {
      window.location.reload();
    }
  } catch (error) {
    console.error('Error signing out:', error);
    throw new Error('Une erreur est survenue lors de la déconnexion');
  }
}

export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw new Error('Une erreur est survenue lors de la connexion avec Google');
  }
}