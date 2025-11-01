import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function Index() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    console.log('Index navigation check:', { 
      user: !!user, 
      hasPersonality: !!userProfile?.personalityType,
      isComplete: userProfile?.profileComplete 
    });

    // Add a small delay to ensure auth state is fully loaded
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
  }, [user, userProfile, loading, router]);

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
