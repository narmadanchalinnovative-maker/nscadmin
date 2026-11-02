import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFunctions, Functions } from 'firebase/functions';

// Default configuration with fallback to google-services.json credentials
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCtQsR_PlIH1wpNq1l4tW6f7RPF27a08rc',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'narmadanchalsmartclassess.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'narmadanchalsmartclassess',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'narmadanchalsmartclassess.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '50585105381',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:50585105381:web:64561b2078eb6ab06ef50c',
};

// Safe initialization
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage | undefined;
let functions: Functions;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  try {
    storage = getStorage(app);
  } catch (storageErr) {
    console.warn('Firebase Storage initialization warning:', storageErr);
  }
  try {
    functions = getFunctions(app);
  } catch (functionsErr) {
    console.warn('Firebase Functions initialization warning:', functionsErr);
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Fallback safe objects to prevent top-level module crash
  app = (getApps().length > 0 ? getApp() : {}) as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
  functions = {} as Functions;
}

export { auth, db, app, storage, functions };
