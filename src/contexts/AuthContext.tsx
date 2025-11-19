import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { db } from '../config/firebase-config';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const useProxy = Platform.select({ web: false, default: true });

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  monthlyIncome?: number;
  remainingBalanceCurrentMonth?: number;
  salaryDay?: number;
  existingSavings?: number;
  moneyPersonality?: string;
  quizCompleted?: boolean;
  profileComplete?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

type FirebaseUser = firebase.User;

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '1055270623347-qgq8paq8aqbnhd1vcs4aev4gqqkjl96a.apps.googleusercontent.com',
    iosClientId: '1055270623347-v1d8u7hl92mlg5uunb4vkn37rv3c8rl1.apps.googleusercontent.com',
    androidClientId: '1055270623347-qgq8paq8aqbnhd1vcs4aev4gqqkjl96a.apps.googleusercontent.com',
    webClientId: '1055270623347-qgq8paq8aqbnhd1vcs4aev4gqqkjl96a.apps.googleusercontent.com',
  });

  const mapDocToProfile = (uid: string, data: any): UserProfile => ({
    userId: uid,
    email: data?.email || '',
    displayName: data?.displayName || '',
    photoURL: data?.photoURL,
    monthlyIncome: data?.monthlyIncome,
    remainingBalanceCurrentMonth: data?.remainingBalanceCurrentMonth,
    salaryDay: data?.salaryDay,
    existingSavings: data?.existingSavings,
    moneyPersonality: data?.moneyPersonality,
    quizCompleted: data?.quizCompleted || false,
    profileComplete: data?.profileComplete || false,
    createdAt: data?.createdAt,
    updatedAt: data?.updatedAt,
  });

  const loadUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const snap = await db.collection('users').doc(uid).get();
    if (!snap.exists) return null;
    return mapDocToProfile(uid, snap.data());
  };

  const createUserProfileIfMissing = async (u: FirebaseUser) => {
    try {
      console.log('🔧 Creating profile for user:', u.uid);
      const userRef = db.collection('users').doc(u.uid);
      const snap = await userRef.get();
      
      if (!snap.exists) {
        console.log('📝 Profile does not exist, creating...');
        await userRef.set({
          userId: u.uid,
          email: u.email,
          displayName: u.displayName || '',
          photoURL: u.photoURL || '',
          moneyPersonality: '',
          quizCompleted: false,
          monthlyIncome: 0,
          remainingBalanceCurrentMonth: 0,
          salaryDay: 1,
          existingSavings: 0,
          profileComplete: false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        console.log('✅ Profile created successfully');
      } else {
        console.log('✅ Profile already exists');
      }
    } catch (e) {
      console.error('❌ Error creating user profile:', e);
      throw e;
    }
  };

  const refreshUserProfile = async () => {
    if (!user) return;
    const p = await loadUserProfile(user.uid);
    setUserProfile(p);
  };

  useEffect(() => {
    const unsub = firebase.auth().onAuthStateChanged(async (currentUser) => {
      console.log('🔄 Auth state changed:', currentUser?.email);
      
      if (currentUser?.isAnonymous) {
        await firebase.auth().signOut();
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);

      let profileUnsub: undefined | (() => void);
      if (currentUser && currentUser.email) {
        try {
          await createUserProfileIfMissing(currentUser);
          
          const ref = db.collection('users').doc(currentUser.uid);
          profileUnsub = ref.onSnapshot(
            (snap) => {
              console.log('📊 Profile snapshot:', snap.data());
              setUserProfile(mapDocToProfile(currentUser.uid, snap.data()));
            },
            (err) => console.error('❌ onSnapshot error:', err)
          );
        } catch (error) {
          console.error('❌ Error setting up profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
      return () => { if (profileUnsub) profileUnsub(); };
    });
    return unsub;
  }, []);

  useEffect(() => {
    (async () => {
      if (!response || response.type !== 'success') return;
      const idToken =
        (response as any)?.authentication?.idToken ||
        (response as any)?.params?.id_token;
      if (!idToken) return;
      try {
        setLoading(true);
        const cred = firebase.auth.GoogleAuthProvider.credential(idToken);
        await firebase.auth().signInWithCredential(cred);
      } catch (e) {
        console.error('Google sign-in credential error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [response]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('🔐 Signing in:', email);
      await firebase.auth().signInWithEmailAndPassword(email, password);
      console.log('✅ Sign-in successful');
    } catch (error) {
      console.error('❌ Sign-in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('📝 Signing up:', email);
      const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
      console.log('✅ Sign-up successful, creating profile...');
      if (cred.user) await createUserProfileIfMissing(cred.user);
      console.log('✅ Profile creation complete');
    } catch (error) {
      console.error('❌ Sign-up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        const provider = new firebase.auth.GoogleAuthProvider();
        await firebase.auth().signInWithPopup(provider);
        return;
      }
      await (promptAsync as any)({ useProxy });
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebase.auth().signOut();
      setUser(null);
      setUserProfile(null);
      
      if (Platform.OS === 'web') {
        setTimeout(() => {
          try { (window as any).location.replace('/'); } 
          catch { (window as any).location.assign('/'); }
        }, 0);
      }
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
