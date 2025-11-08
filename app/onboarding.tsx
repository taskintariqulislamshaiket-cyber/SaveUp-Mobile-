import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

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
    description: 'Zero manual entry. Magic happens.',
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
    title: 'Dream. Plan. Achieve. 🎯',
    subtitle: 'New phone? Vacation? Emergency fund?',
    description: 'Set goals and track progress.',
    emoji: '🏆',
    gradient: ['#10b981', '#059669'],
  },
  {
    id: 6,
    title: 'Save Smarter. Live Better. 💚',
    subtitle: 'Join 10,000+ Bangladeshis taking control',
    description: 'Free forever. Start in 30 seconds.',
    emoji: '🚀',
    gradient: ['#8b5cf6', '#ec4899'],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.replace('/login');
    }
  };

  const handleSkip = () => {
    router.replace('/login');
  };

  const currentSlide = slides[currentIndex];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <LinearGradient
        colors={currentSlide.gradient}
        style={styles.content}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.slideContent}>
          <View style={styles.iconCircle}>
            <Text style={styles.emoji}>{currentSlide.emoji}</Text>
          </View>

          <Text style={styles.title}>{currentSlide.title}</Text>
          <Text style={styles.subtitle}>{currentSlide.subtitle}</Text>
          <Text style={styles.description}>{currentSlide.description}</Text>
        </View>
      </LinearGradient>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <LinearGradient
            colors={currentSlide.gradient}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>
              {currentIndex === slides.length - 1 ? 'Get Started →' : 'Next →'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  skipButton: { position: 'absolute', top: 50, right: 20, zIndex: 10, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  skipText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  slideContent: { alignItems: 'center' },
  iconCircle: { width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 60 },
  emoji: { fontSize: 80 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 16 },
  subtitle: { fontSize: 18, color: 'rgba(255, 255, 255, 0.9)', textAlign: 'center', marginBottom: 12 },
  description: { fontSize: 16, color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center', maxWidth: 320 },
  footer: { position: 'absolute', bottom: 50, left: 0, right: 0, paddingHorizontal: 30, alignItems: 'center' },
  pagination: { flexDirection: 'row', marginBottom: 30, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.3)' },
  dotActive: { width: 24, backgroundColor: '#fff' },
  button: { width: '100%' },
  buttonGradient: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
