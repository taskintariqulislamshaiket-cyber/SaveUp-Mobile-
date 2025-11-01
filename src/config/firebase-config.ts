import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCRJPBPmUU9lxcTv_xKhaOebPhcVJlHtgY",
  authDomain: "saveup-baa19.firebaseapp.com",
  projectId: "saveup-baa19",
  storageBucket: "saveup-baa19.firebasestorage.app",
  messagingSenderId: "1055270623347",
  appId: "1:1055270623347:web:b35903159cf2c8f8fe3206",
  measurementId: "G-RKJTXSY2FW"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
