import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../src/components/Icon';
import WalletIcon from '../src/components/WalletIcon';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../src/config/firebase-config';
import { useAuth } from '../src/contexts/AuthContext';
import * as Haptics from 'expo-haptics';

// 6 Feature Introduction Slides
const INTRO_SLIDES = [
  {
    id: 1,
    title: "Where Did All Your Money Go?",
    subtitle: "Salary asche... shesh hoye jay... but kothay gelo? 🤔",
    description: "Track every taka without the hassle.",
    emoji: "😰",
    gradient: ['#ff6b6b', '#ee5a6f'],
  },
  {
    id: 2,
    title: "Just Text. We'll Track. 💬",
    subtitle: "WhatsApp bot করে expense add করুন:",
    description: '"lunch 500" → Done ✅',
    emoji: "💬",
    gradient: ['#845ec2', '#b39cd0'],
  },
  {
    id: 3,
    title: "bKash/Nagad → Auto-Tracked ⚡",
    subtitle: "SMS থেকে automatically expense capture.",
    description: "Zero manual entry.",
    emoji: "⚡",
    gradient: ['#f59e0b', '#f97316'],
  },
  {
    id: 4,
    title: "We Warn You Before It's Too Late",
    subtitle: "⚠️ Your budget runs out in 8 days...",
    description: "but salary is 13 days away!",
    emoji: "⚠️",
    gradient: ['#ec4899', '#f43f5e'],
  },
  {
    id: 5,
    title: "Dream. Plan. Achieve. 💎💎",
    subtitle: "New phone? Vacation?",
    description: "Set goals and track progress.",
    emoji: "🏆",
    gradient: ['#00D4A1', '#4CAF50'],
  },
  {
    id: 6,
    title: "Save Smarter. Live Better. 💚",
    subtitle: "Join 10,000+ Bangladeshis",
    description: "Free forever. Start now.",
    emoji: "🚀",
    gradient: ['#8b5cf6', '#a78bfa'],
  },
];

// Personality Questions (after intro)
const QUESTIONS = [
  {
    id: 1,
    title: "Let's Understand Your Money Style",
    question: "When you get your salary, what's your first move?",
    options: [
      { text: "Transfer to savings immediately", value: "guardian" },
      { text: "Invest in stocks/crypto", value: "strategist" },
      { text: "Pay bills first", value: "realist" },
      { text: "Treat myself a little", value: "enjoyer" },
    ],
  },
  {
    id: 2,
    title: "Your Spending Habits",
    question: "When shopping, you:",
    options: [
      { text: "Buy only what's needed", value: "guardian" },
      { text: "Research best deals first", value: "strategist" },
      { text: "Buy what's reasonable", value: "realist" },
      { text: "Buy what makes me happy", value: "enjoyer" },
    ],
  },
  {
    id: 3,
    title: "Planning Approach",
    question: "Your approach to budgeting:",
    options: [
      { text: "Strict, every taka tracked", value: "guardian" },
      { text: "Optimize for maximum returns", value: "strategist" },
      { text: "Basics covered, rest flexible", value: "realist" },
      { text: "Loose budget, enjoy life", value: "enjoyer" },
    ],
  },
];

export default function Quiz() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showQuestions, setShowQuestions] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentSlide, currentQuestion]);

  const handleNextSlide = () => {
    if (currentSlide < INTRO_SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    } else {
      setShowQuestions(true);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleOptionSelect = (value: string) => {
    setSelectedOption(value);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleNextQuestion = async () => {
    if (!selectedOption) return;

    const newAnswers = [...answers, selectedOption];
    setAnswers(newAnswers);

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    } else {
      await savePersonality(newAnswers);
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const savePersonality = async (finalAnswers: string[]) => {
    const counts: Record<string, number> = {};
    finalAnswers.forEach(answer => {
      counts[answer] = (counts[answer] || 0) + 1;
    });

    const personality = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];

    try {
      if (user) {
        await setDoc(doc(db, 'users', user.uid), {
          moneyPersonality: personality,
          quizCompleted: true,
        }, { merge: true });
      }
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving personality:', error);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  // Render Intro Slides
  if (!showQuestions) {
    const slide = INTRO_SLIDES[currentSlide];
    const isLastSlide = currentSlide === INTRO_SLIDES.length - 1;

    return (
      <LinearGradient colors={slide.gradient} style={styles.container}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.slideContent,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.emojiCircle}>
            <Text style={styles.slideEmoji}>{slide.emoji}</Text>
          </View>

          <Text style={styles.slideTitle}>{slide.title}</Text>
          <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
          <Text style={styles.slideDescription}>{slide.description}</Text>

          <View style={styles.pagination}>
            {INTRO_SLIDES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === currentSlide && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.nextButton} onPress={handleNextSlide} activeOpacity={0.8}>
            <Text style={styles.nextButtonText}>
              {isLastSlide ? 'Get Started →' : 'Next →'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    );
  }

  // Render Questions
  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;
  const question = QUESTIONS[currentQuestion];

  return (
    <LinearGradient colors={['#0f172a', '#1e1b4b', '#1e293b']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: '#00D4A1' }]}>Skip</Text>
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{currentQuestion + 1} of {QUESTIONS.length}</Text>
        </View>

        <Animated.View
          style={[
            styles.questionContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.iconContainer}>
            <WalletIcon size={80} />
          </View>

          <Text style={styles.title}>{question.title}</Text>
          <Text style={styles.questionText}>{question.question}</Text>

          <View style={styles.optionsContainer}>
            {question.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionCard,
                  selectedOption === option.value && styles.optionSelected,
                ]}
                onPress={() => handleOptionSelect(option.value)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.optionText,
                  selectedOption === option.value && styles.optionTextSelected,
                ]}>
                  {option.text}
                </Text>
                {selectedOption === option.value && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.questionNextButton, !selectedOption && styles.nextButtonDisabled]}
            onPress={handleNextQuestion}
            disabled={!selectedOption}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={selectedOption ? ['#00D4A1', '#4CAF50'] : ['#334155', '#475569']}
              style={styles.questionNextGradient}
            >
              <Text style={styles.questionNextText}>
                {currentQuestion < QUESTIONS.length - 1 ? 'Next' : 'Finish'}
              </Text>
              <Icon name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipButton: { position: 'absolute', top: 60, right: 20, zIndex: 10, padding: 12 },
  skipText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  // Intro Slides
  slideContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emojiCircle: { width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  slideEmoji: { fontSize: 80 },
  slideTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 16 },
  slideSubtitle: { fontSize: 18, color: 'rgba(255, 255, 255, 0.9)', textAlign: 'center', marginBottom: 12 },
  slideDescription: { fontSize: 16, color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center', marginBottom: 60 },
  pagination: { flexDirection: 'row', gap: 8, marginBottom: 40 },
  paginationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.3)' },
  paginationDotActive: { backgroundColor: '#fff', width: 24 },
  nextButton: { backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 40, paddingVertical: 16, borderRadius: 12 },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  
  // Questions
  content: { flexGrow: 1, padding: 20, paddingTop: 60 },
  progressContainer: { marginBottom: 32 },
  progressBar: { height: 6, backgroundColor: '#334155', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#00D4A1', borderRadius: 3 },
  progressText: { color: '#94a3b8', fontSize: 12, marginTop: 8, textAlign: 'center' },
  questionContainer: { flex: 1 },
  iconContainer: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 14, color: '#00D4A1', fontWeight: '600', marginBottom: 12, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
  questionText: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 32, textAlign: 'center', lineHeight: 32 },
  optionsContainer: { gap: 12, marginBottom: 32 },
  optionCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, borderWidth: 2, borderColor: '#334155', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionSelected: { borderColor: '#00D4A1', backgroundColor: '#00D4A1' + '20' },
  optionText: { fontSize: 16, color: '#e2e8f0', flex: 1, fontWeight: '500' },
  optionTextSelected: { color: '#fff', fontWeight: '600' },
  checkmark: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#00D4A1', justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  checkmarkText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  questionNextButton: { marginTop: 'auto', borderRadius: 16, overflow: 'hidden' },
  nextButtonDisabled: { opacity: 0.5 },
  questionNextGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, gap: 8 },
  questionNextText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
