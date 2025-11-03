import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';

// Firebase (compat)
import { firebase, db } from '../config/firebase-config';

WebBrowser.maybeCompleteAuthSession();

export interface UserProfile {
  existingSavings?: number;
  existingFDR?: number;
  otherInvestments?: number;
  userId: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  personalityType?: string;
  monthlyIncome?: number;
  remainingBalanceCurrentMonth?: number;
  salaryDay?: number;
  existingSavings?: number;
  profileComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
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

// === Your confirmed IDs ===
const GOOGLE_WEB_CLIENT_ID = '1055270623347-2acrv9eu3sb63fne6ru5889marith6ru.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = '1055270623347-80t89vmojq1943cqf1tk02e5ftng9ed0.apps.googleusercontent.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const router = useRouter();

  // Expo Go needs proxy; dev build does not
  const isExpoGo = Constants.appOwnership === 'expo';
  const useProxy = isExpoGo;
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'saveup', useProxy });

  // Request that works on web, Expo Go, and iOS dev build via id_token
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    expoClientId: GOOGLE_WEB_CLIENT_ID,   // Expo Go fallback
    responseType: 'id_token',
    redirectUri,
    scopes: ['profile', 'email'],
    usePKCE: true,
  });

  const mapDocToProfile = (uid: string, data: any): UserProfile | null => {
    if (!data) return null;
    return {
      userId: uid,
      email: data.email || '',
      displayName: data.displayName || data.name || '',
      photoURL: data.photoURL || '',
      personalityType: data.personalityType || '',
      monthlyIncome: data.monthlyIncome || 0,
      remainingBalanceCurrentMonth: data.remainingBalanceCurrentMonth || 0,
      salaryDay: data.salaryDay || 1,
      existingSavings: data.existingSavings || 0,
      profileComplete: !!data.profileComplete,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    };
  };

  const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) return mapDocToProfile(userId, userDoc.data());
      return null;
    } catch (e) {
      console.error('Error loading user profile:', e);
      return null;
    }
  };

  const createUserProfileIfMissing = async (u: FirebaseUser) => {
    try {
      const userRef = db.collection('users').doc(u.uid);
      const snap = await userRef.get();
      if (!snap.exists) {
        await userRef.set({
          userId: u.uid,
          email: u.email,
          displayName: u.displayName || '',
          photoURL: u.photoURL || '',
          personalityType: '',
          monthlyIncome: 0,
          remainingBalanceCurrentMonth: 0,
          salaryDay: 1,
          existingSavings: 0,
          profileComplete: false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (e) {
      console.error('Error creating user profile:', e);
    }
  };

  const refreshUserProfile = async () => {
    if (!user) return;
    const p = await loadUserProfile(user.uid);
    setUserProfile(p);
  };

  useEffect(() => {
    const unsub = firebase.auth().onAuthStateChanged(async (currentUser) => {
      if (currentUser?.isAnonymous) {
        await firebase.auth().signOut();
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        setInitialLoad(false);
        return;
      }

      setUser(currentUser);

      let profileUnsub: undefined | (() => void);
      if (currentUser && currentUser.email) {
        await createUserProfileIfMissing(currentUser);
        const ref = db.collection('users').doc(currentUser.uid);
        profileUnsub = ref.onSnapshot(
          (snap) => setUserProfile(mapDocToProfile(currentUser.uid, snap.data())),
          (err) => console.error('onSnapshot error:', err)
        );
      } else {
        setUserProfile(null);
      }

      setLoading(false);
      setInitialLoad(false);

      return () => { if (profileUnsub) profileUnsub(); };
    });

    return unsub;
  }, []);

  const lastRouteRef = useRef<string | null>(null);
  const navigateSafely = (path: string) => {
    if (lastRouteRef.current === path) return;
    lastRouteRef.current = path;
    try { router.replace(path); }
    catch {
      if (Platform.OS === 'web') (window as any).location.assign(path);
    }
  };

  const pickNextRoute = (): string => {
    if (!user) return '/login';
    if (!userProfile?.personalityType) return '/quiz';
    if (!userProfile?.profileComplete) return '/profile-setup';
    return '/(tabs)';
  };

  useEffect(() => {
    if (initialLoad || loading) return;
    const next = pickNextRoute();
    navigateSafely(next);
  }, [user, userProfile, loading, initialLoad]);

  // Handle Google auth result (id_token for Firebase)
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

  const signInWithGoogle = async () => {
    try {
      setLoading(true);

      if (Platform.OS === 'web') {
        const provider = new firebase.auth.GoogleAuthProvider();
        await firebase.auth().signInWithPopup(provider);
        return;
      }

      await (promptAsync as any)({ useProxy });
    } catch (error: any) {
      console.error('Google sign-in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try { await firebase.auth().signInWithEmailAndPassword(email, password); }
    finally { setLoading(false); }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
      if (cred.user) await createUserProfileIfMissing(cred.user);
    } finally { setLoading(false); }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebase.auth().signOut();
      setUser(null);
      setUserProfile(null);
      lastRouteRef.current = null;
      navigateSafely('/login');
      if (Platform.OS === 'web') {
        setTimeout(() => {
          try { (window as any).location.replace('/login'); } catch { (window as any).location.assign('/login'); }
        }, 0);
      }
    } finally { setLoading(false); }
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
