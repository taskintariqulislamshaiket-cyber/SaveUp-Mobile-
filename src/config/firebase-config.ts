import { Platform } from 'react-native';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';       // ⬅️ REQUIRED so firebase.auth() exists
import 'firebase/compat/firestore';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCRJPBPmUU9lxcTv_xKhaOebPhcVJlHtgY",
  authDomain: "saveup-baa19.firebaseapp.com",
  projectId: "saveup-baa19",
  storageBucket: "saveup-baa19.firebasestorage.app",
  messagingSenderId: "185527062347",
  appId: "1:185527062347:web:b35903159cf2c8f8fe3206"
};

// Initialize once
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

/**
 * Ensure React Native persistence on iOS/Android BEFORE any auth call.
 * Safe to try/catch because initializeAuth throws if called twice.
 */
if (Platform.OS !== 'web') {
  try {
    initializeAuth(firebase.app(), {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {}
}

export { firebase };
export const db = firebase.firestore();
