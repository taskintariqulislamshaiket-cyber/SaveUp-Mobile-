import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function Index() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  // Wait for mount
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady || loading) return;

    console.log('🔍 Navigation check:', { 
      user: !!user, 
      hasPersonality: !!userProfile?.personalityType,
      isComplete: userProfile?.profileComplete 
    });

    const navigate = () => {
      // ALWAYS show onboarding for new/incognito users (no storage check)
      if (!user) {
        console.log('✅ No user → Showing onboarding');
        router.replace('/onboarding');
      } else if (!userProfile?.personalityType) {
        console.log('✅ No personality → Showing quiz');
        router.replace('/quiz');
      } else if (!userProfile?.profileComplete) {
        console.log('✅ Incomplete profile → Showing profile-setup');
        router.replace('/profile-setup');
      } else {
        console.log('✅ Complete → Showing dashboard');
        router.replace('/(tabs)');
      }
    };

    const timer = setTimeout(navigate, 200);
    return () => clearTimeout(timer);
  }, [user, userProfile, loading, isReady, router]);

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
