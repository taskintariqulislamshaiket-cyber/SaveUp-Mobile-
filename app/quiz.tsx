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

const QUESTIONS = [
  {
    id: 1,
    title: "Let's Understand Your Money Style",
    question: "When you get your salary, what's your first move?",
    emoji: "💰",
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
    emoji: "🛍️",
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
    emoji: "📋",
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
  }, [currentQuestion]);

  const handleOptionSelect = (value: string) => {
    setSelectedOption(value);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleNext = async () => {
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

  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;
  const question = QUESTIONS[currentQuestion];

  return (
    <LinearGradient colors={['#0f172a', '#1e1b4b', '#1e293b']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Skip Button */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{currentQuestion + 1} of {QUESTIONS.length}</Text>
        </View>

        {/* Animated Question */}
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
          <Text style={styles.question}>{question.question}</Text>

          {/* Options */}
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

          {/* Next Button */}
          <TouchableOpacity
            style={[styles.nextButton, !selectedOption && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!selectedOption}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={selectedOption ? ['#00D4A1', '#4CAF50'] : ['#334155', '#475569']}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>
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
  content: { flexGrow: 1, padding: 20, paddingTop: 60 },
  skipButton: { alignSelf: 'flex-end', padding: 12 },
  skipText: { color: '#00D4A1', fontSize: 16, fontWeight: '600' },
  progressContainer: { marginBottom: 32 },
  progressBar: { height: 6, backgroundColor: '#334155', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#00D4A1', borderRadius: 3 },
  progressText: { color: '#94a3b8', fontSize: 12, marginTop: 8, textAlign: 'center' },
  questionContainer: { flex: 1 },
  iconContainer: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 14, color: '#00D4A1', fontWeight: '600', marginBottom: 12, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
  question: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 32, textAlign: 'center', lineHeight: 32 },
  optionsContainer: { gap: 12, marginBottom: 32 },
  optionCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, borderWidth: 2, borderColor: '#334155', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionSelected: { borderColor: '#00D4A1', backgroundColor: '#00D4A1' + '20' },
  optionText: { fontSize: 16, color: '#e2e8f0', flex: 1, fontWeight: '500' },
  optionTextSelected: { color: '#fff', fontWeight: '600' },
  checkmark: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#00D4A1', justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  checkmarkText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  nextButton: { marginTop: 'auto', borderRadius: 16, overflow: 'hidden' },
  nextButtonDisabled: { opacity: 0.5 },
  nextButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, gap: 8 },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
