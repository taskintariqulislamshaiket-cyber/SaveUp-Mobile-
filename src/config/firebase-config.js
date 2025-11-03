import { Platform } from 'react-native';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// --- Your Firebase config (unchanged keys; storageBucket corrected to standard appspot) ---
const firebaseConfig = {
  apiKey: "AIzaSyCRJPBPmUU9lxcTv_xKhaOebPhcVJlHtgY",
  authDomain: "saveup-baa19.firebaseapp.com",
  projectId: "saveup-baa19",
  storageBucket: "saveup-baa19.appspot.com",
  messagingSenderId: "1055270623347",
  appId: "1:1055270623347:web:b35903159cf2c8f8fe3206",
  measurementId: "G-RKJTXSY2FW"
};

// Initialize once
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// IMPORTANT: Set persistence per-platform so native doesn't try browser localStorage
try {
  if (Platform && Platform.OS === 'web') {
    // Browser: keep session in LocalStorage
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  } else {
    // Native: disable browser persistence to prevent "setItem of undefined"
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);
  }
} catch (e) {
  // Silently continue; auth will still function with default in-memory
  console.log('[firebase-config] persistence set error (safe to ignore on native):', e?.message);
}

const auth = firebase.auth();
const db = firebase.firestore();
const app = firebase.app();

export { app, auth, db, firebase };
