import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase-config';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

interface UserProfile {
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

interface AuthContextType {
  user: User | null;
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
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const GOOGLE_WEB_CLIENT_ID = '1055270623347-2acrv9eu3sb63fne6ru5889marith6ru.apps.googleusercontent.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const router = useRouter();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
  });

  const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          userId,
          email: data.email || '',
          displayName: data.displayName || data.name || '',
          photoURL: data.photoURL || '',
          personalityType: data.personalityType || '',
          monthlyIncome: data.monthlyIncome || 0,
          remainingBalanceCurrentMonth: data.remainingBalanceCurrentMonth || 0,
          salaryDay: data.salaryDay || 1,
          existingSavings: data.existingSavings || 0,
          profileComplete: data.profileComplete || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      }
      return null;
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  };

  const createUserProfile = async (user: User) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          userId: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          profileComplete: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  };

  const refreshUserProfile = async () => {
    if (user) {
      const profile = await loadUserProfile(user.uid);
      setUserProfile(profile);
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('🔐 Auth state changed:', currentUser?.email);
      
      if (currentUser?.isAnonymous) {
        await firebaseSignOut(auth);
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        setInitialLoad(false);
        return;
      }

      setUser(currentUser);

      if (currentUser && currentUser.email) {
        await createUserProfile(currentUser);
        const profile = await loadUserProfile(currentUser.uid);
        console.log('👤 Profile loaded:', profile);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }

      setLoading(false);
      setInitialLoad(false);
    });

    return unsubscribe;
  }, []);

  // Handle navigation based on auth state
  useEffect(() => {
    if (initialLoad || loading) {
      console.log('⏳ Still loading...');
      return;
    }

    console.log('🧭 Navigation check:', {
      hasUser: !!user,
      hasPersonality: !!userProfile?.personalityType,
      isComplete: userProfile?.profileComplete,
    });

    const timeoutId = setTimeout(() => {
      try {
        if (!user) {
          console.log('→ Going to login');
          router.replace('/login');
        } else if (!userProfile?.personalityType) {
          console.log('→ Going to quiz');
          router.replace('/quiz');
        } else if (!userProfile?.profileComplete) {
          console.log('→ Going to profile-setup');
          router.replace('/profile-setup');
        } else {
          console.log('→ Going to dashboard');
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('Navigation error:', error);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [user, userProfile, loading, initialLoad, router]);

  // Google Sign-In
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential);
    }
  }, [response]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('🔑 Signing in...');
      await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Sign in successful');
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      setLoading(false);
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email. Please sign up first.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address format.');
      } else {
        throw new Error(error.message || 'Failed to sign in');
      }
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('📝 Creating account...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await createUserProfile(userCredential.user);
      console.log('✅ Account created successfully');
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      setLoading(false);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. Click "Sign In" below to log in.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address format.');
      } else {
        throw new Error(error.message || 'Failed to create account. Please try again.');
      }
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await promptAsync();
    } catch (error: any) {
      setLoading(false);
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Signing out...');
      
      // Sign out from Firebase
      await firebaseSignOut(auth);
      
      // Clear state
      setUser(null);
      setUserProfile(null);
      
      console.log('✅ Signed out successfully');
      
      // Force reload on web to clear all state
      if (Platform.OS === 'web') {
        window.location.href = '/login';
      } else {
        router.replace('/login');
      }
    } catch (error: any) {
      console.error('❌ Sign out error:', error);
      throw new Error(error.message || 'Failed to sign out');
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
