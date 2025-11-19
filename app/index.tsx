import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../src/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const slides = [
  {
    id: 1,
    title: 'Where Did All Your Money Go?',
    subtitle: 'Salary asche... shesh hoye jay... but kothay gelo? 🤔',
    description: 'Track every taka without the hassle.',
    emoji: '😰',
    gradient: ['#ef4444', '#dc2626'],
  },
  {
    id: 2,
    title: 'Just Text. We\'ll Track. 🤖',
    subtitle: 'WhatsApp bot করে expense add করুন:',
    description: '"lunch 500" → Done ✅',
    emoji: '💬',
    gradient: ['#8b5cf6', '#7c3aed'],
  },
  {
    id: 3,
    title: 'bKash/Nagad → Auto-Tracked 🔥',
    subtitle: 'SMS থেকে automatically expense capture.',
    description: 'Zero manual entry.',
    emoji: '⚡',
    gradient: ['#f59e0b', '#d97706'],
  },
  {
    id: 4,
    title: 'We Warn You Before It\'s Too Late',
    subtitle: '🚨 Your budget runs out in 8 days...',
    description: 'but salary is 13 days away!',
    emoji: '⚠️',
    gradient: ['#ec4899', '#db2777'],
  },
  {
    id: 5,
    title: 'Dream. Plan. Achieve. 💎💎',
    subtitle: 'New phone? Vacation?',
    description: 'Set goals and track progress.',
    emoji: '🏆',
    gradient: ['#00D4A1', '#4CAF50'],
  },
  {
    id: 6,
    title: 'Save Smarter. Live Better. 💚',
    subtitle: 'Join 10,000+ Bangladeshis',
    description: 'Free forever. Start now.',
    emoji: '🚀',
    gradient: ['#8b5cf6', '#a78bfa'],
  },
];

export default function Index() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    if (!loading && !checkingOnboarding) {
      console.log('🔍 Navigation check:', { user: !!user, userProfile, hasSeenOnboarding });
      handleNavigation();
    }
  }, [user, userProfile, loading, checkingOnboarding]);

  const checkOnboardingStatus = async () => {
    try {
      const seen = await AsyncStorage.getItem('hasSeenOnboarding');
      setHasSeenOnboarding(seen === 'true');
      console.log('✅ Has seen onboarding:', seen === 'true');
    } catch (error) {
      console.error('Error checking onboarding:', error);
    } finally {
      setCheckingOnboarding(false);
    }
  };

  const handleNavigation = () => {
    // If user is logged in
    if (user) {
      console.log('👤 User logged in, checking profile...');
      console.log('Profile data:', userProfile);
      
      // Check profile completion
      if (!userProfile?.profileComplete) {
        console.log('→ Profile incomplete, going to profile-setup');
        router.replace('/profile-setup');
      }
      // Check personality quiz completion
      else if (!userProfile?.moneyPersonality && !userProfile?.quizCompleted) {
        console.log('→ No personality, going to quiz');
        router.replace('/quiz');
      }
      // Go to dashboard
      else {
        console.log('→ Everything complete, going to dashboard');
        router.replace('/(tabs)');
      }
    }
    // If no user and has seen onboarding, go to login
    else if (hasSeenOnboarding) {
      console.log('→ Has seen onboarding, going to login');
      router.replace('/login');
    }
    // Otherwise show onboarding (first-time user)
    else {
      console.log('→ Showing onboarding (first-time user)');
    }
  };

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      setHasSeenOnboarding(true);
      router.replace('/login');
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    setHasSeenOnboarding(true);
    router.replace('/login');
  };

  if (loading || checkingOnboarding) {
    return (
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.container}>
        <ActivityIndicator size="large" color="#00D4A1" />
        <Text style={styles.loadingText}>Loading...</Text>
      </LinearGradient>
    );
  }

  // If logged in or has seen onboarding, show loading while navigation happens
  if (user || hasSeenOnboarding) {
    return (
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.container}>
        <ActivityIndicator size="large" color="#00D4A1" />
        <Text style={styles.loadingText}>Redirecting...</Text>
      </LinearGradient>
    );
  }

  // Show onboarding for first-time users
  const currentSlide = slides[currentIndex];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <LinearGradient colors={currentSlide.gradient} style={styles.content}>
        <View style={styles.emojiCircle}>
          <Text style={styles.emoji}>{currentSlide.emoji}</Text>
        </View>

        <Text style={styles.title}>{currentSlide.title}</Text>
        <Text style={styles.subtitle}>{currentSlide.subtitle}</Text>
        <Text style={styles.description}>{currentSlide.description}</Text>

        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {currentIndex === slides.length - 1 ? 'Get Started →' : 'Next →'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipButton: { position: 'absolute', top: 60, right: 20, zIndex: 10, padding: 12 },
  skipText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emojiCircle: { width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  emoji: { fontSize: 80 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 16 },
  subtitle: { fontSize: 18, color: 'rgba(255, 255, 255, 0.9)', textAlign: 'center', marginBottom: 12 },
  description: { fontSize: 16, color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center', marginBottom: 60 },
  pagination: { flexDirection: 'row', gap: 8, marginBottom: 40 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.3)' },
  activeDot: { backgroundColor: '#fff', width: 24 },
  button: { backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 40, paddingVertical: 16, borderRadius: 12 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  loadingText: { color: '#94a3b8', marginTop: 16, fontSize: 14 },
});
