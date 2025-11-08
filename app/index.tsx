import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETED_KEY = '@saveup_onboarding_completed';

export default function Index() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      // Check URL parameter for force-onboarding (works in incognito)
      const forceOnboarding = searchParams.get('onboarding');
      
      if (forceOnboarding === 'true') {
        console.log('→ Force showing onboarding via URL parameter');
        router.replace('/onboarding');
        return;
      }

      const hasCompletedOnboarding = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
      
      if (!hasCompletedOnboarding) {
        console.log('→ First time user, showing onboarding');
        router.replace('/onboarding');
        return;
      }
      
      console.log('→ Onboarding already completed, proceeding to auth check');
      setOnboardingComplete(true);
      setCheckingOnboarding(false);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setOnboardingComplete(true);
      setCheckingOnboarding(false);
    }
  };

  useEffect(() => {
    // Wait for BOTH onboarding check AND auth to complete
    if (loading || checkingOnboarding || !onboardingComplete) return;

    console.log('Index navigation check:', { 
      user: !!user, 
      hasPersonality: !!userProfile?.personalityType,
      isComplete: userProfile?.profileComplete 
    });

    const timer = setTimeout(() => {
      if (!user) {
        console.log('→ Redirecting to login');
        router.replace('/login');
      } else if (!userProfile?.personalityType) {
        console.log('→ Redirecting to quiz');
        router.replace('/quiz');
      } else if (!userProfile?.profileComplete) {
        console.log('→ Redirecting to profile-setup');
        router.replace('/profile-setup');
      } else {
        console.log('→ Redirecting to dashboard');
        router.replace('/(tabs)');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user, userProfile, loading, checkingOnboarding, onboardingComplete, router]);

  return (
    <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.container}>
      <ActivityIndicator size="large" color="#8b5cf6" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
