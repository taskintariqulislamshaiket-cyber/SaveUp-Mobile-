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
    title: "Salary Day Decisions",
    question: "When you get your salary, what's your first move?",
    options: [
      { text: "Transfer to savings immediately", value: "guardian" },
      { text: "Invest in stocks/crypto", value: "strategist" },
      { text: "Pay bills first", value: "realist" },
      { text: "Treat myself a little", value: "enjoyer" },
      { text: "Help family members", value: "giver" },
      { text: "Make a detailed budget", value: "planner" },
    ],
  },
  {
    id: 2,
    title: "Debt Philosophy",
    question: "How do you feel about debt?",
    options: [
      { text: "Avoid it at all costs", value: "guardian" },
      { text: "Strategic debt is okay", value: "strategist" },
      { text: "Necessary evil", value: "realist" },
      { text: "Not ideal but happens", value: "enjoyer" },
      { text: "Worth it for family", value: "giver" },
      { text: "Plan to pay off ASAP", value: "planner" },
    ],
  },
  {
    id: 3,
    title: "Friend Borrows Money",
    question: "Your friend asks to borrow money. You:",
    options: [
      { text: "Lend only what I can afford to lose", value: "guardian" },
      { text: "Ask for a written agreement", value: "strategist" },
      { text: "Lend if they really need it", value: "realist" },
      { text: "Lend freely", value: "enjoyer" },
      { text: "Give without expecting back", value: "giver" },
      { text: "Check my budget first", value: "planner" },
    ],
  },
  {
    id: 4,
    title: "Unexpected Windfall",
    question: "You found ৳10,000 extra this month. You:",
    options: [
      { text: "Save it all", value: "guardian" },
      { text: "Invest half, save half", value: "strategist" },
      { text: "Pay off pending bills", value: "realist" },
      { text: "Splurge on something fun", value: "enjoyer" },
      { text: "Share with family", value: "giver" },
      { text: "Add to emergency fund", value: "planner" },
    ],
  },
  {
    id: 5,
    title: "Budgeting Style",
    question: "Your approach to budgeting:",
    options: [
      { text: "Strict, every taka tracked", value: "guardian" },
      { text: "Optimize for maximum returns", value: "strategist" },
      { text: "Basics covered, rest flexible", value: "realist" },
      { text: "Loose budget, enjoy life", value: "enjoyer" },
      { text: "Family needs come first", value: "giver" },
      { text: "Detailed monthly plan", value: "planner" },
    ],
  },
  {
    id: 6,
    title: "Shopping Behavior",
    question: "When shopping, you:",
    options: [
      { text: "Buy only what's needed", value: "guardian" },
      { text: "Research best deals", value: "strategist" },
      { text: "Buy what's reasonable", value: "realist" },
      { text: "Buy what makes me happy", value: "enjoyer" },
      { text: "Buy for others too", value: "giver" },
      { text: "Stick to shopping list", value: "planner" },
    ],
  },
  {
    id: 7,
    title: "Financial Goals",
    question: "Your biggest financial goal is:",
    options: [
      { text: "Build emergency fund", value: "guardian" },
      { text: "Grow wealth through investments", value: "strategist" },
      { text: "Financial stability", value: "realist" },
      { text: "Live comfortably now", value: "enjoyer" },
      { text: "Support loved ones", value: "giver" },
      { text: "Achieve specific milestones", value: "planner" },
    ],
  },
  {
    id: 8,
    title: "Risk Tolerance",
    question: "When it comes to financial risks:",
    options: [
      { text: "Play it very safe", value: "guardian" },
      { text: "Calculate risks carefully", value: "strategist" },
      { text: "Take moderate risks", value: "realist" },
      { text: "YOLO - take chances", value: "enjoyer" },
      { text: "Risk for family security", value: "giver" },
      { text: "Risk within planned limits", value: "planner" },
    ],
  },
  {
    id: 9,
    title: "Money Stress",
    question: "When money gets tight:",
    options: [
      { text: "Rely on savings", value: "guardian" },
      { text: "Find extra income sources", value: "strategist" },
      { text: "Cut unnecessary expenses", value: "realist" },
      { text: "Stay optimistic", value: "enjoyer" },
      { text: "Family helps each other", value: "giver" },
      { text: "Follow backup plan", value: "planner" },
    ],
  },
  {
    id: 10,
    title: "Future Vision",
    question: "In 5 years, you want to:",
    options: [
      { text: "Have solid savings & security", value: "guardian" },
      { text: "Build wealth & assets", value: "strategist" },
      { text: "Be debt-free & comfortable", value: "realist" },
      { text: "Enjoy life experiences", value: "enjoyer" },
      { text: "Support family's dreams", value: "giver" },
      { text: "Achieve planned goals", value: "planner" },
    ],
  },
];

const PERSONALITY_TYPES = {
  guardian: {
    title: "The Guardian 🛡️",
    description: "Security-first saver who builds financial fortresses",
    traits: ["Risk-averse", "Long-term thinker", "Emergency-prepared"],
  },
  strategist: {
    title: "The Strategist 🧠",
    description: "Calculated investor who maximizes every taka",
    traits: ["Data-driven", "Investment-focused", "Growth-oriented"],
  },
  realist: {
    title: "The Realist ⚖️",
    description: "Balanced spender who keeps life practical",
    traits: ["Moderate approach", "Bills-first mindset", "Grounded decisions"],
  },
  enjoyer: {
    title: "The Enjoyer 🎉",
    description: "Present-focused spender who values experiences",
    traits: ["YOLO mindset", "Experience-driven", "Spontaneous spending"],
  },
  giver: {
    title: "The Giver ❤️",
    description: "Family-first spender who prioritizes loved ones",
    traits: ["Generous heart", "Family-focused", "Community-oriented"],
  },
  planner: {
    title: "The Planner 📊",
    description: "Goal-oriented budgeter who maps the future",
    traits: ["Detailed budgets", "Milestone-driven", "Organized finances"],
  },
};

export default function Quiz() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [personalityType, setPersonalityType] = useState<string>('');

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
      await calculatePersonality(newAnswers);
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const calculatePersonality = async (finalAnswers: string[]) => {
    const counts: Record<string, number> = {};
    finalAnswers.forEach(answer => {
      counts[answer] = (counts[answer] || 0) + 1;
    });

    const personality = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    setPersonalityType(personality);
    setShowResult(true);

    try {
      if (user) {
        await setDoc(doc(db, 'users', user.uid), {
          moneyPersonality: personality,
          quizCompleted: true,
          personalityAnswers: finalAnswers,
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error saving personality:', error);
    }
  };

  const handleFinish = () => {
    router.replace('/(tabs)');
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  if (showResult) {
    const result = PERSONALITY_TYPES[personalityType as keyof typeof PERSONALITY_TYPES];
    return (
      <LinearGradient colors={['#0f172a', '#1e1b4b', '#1e293b']} style={styles.container}>
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>You are...</Text>
          <Text style={styles.personalityTitle}>{result.title}</Text>
          <Text style={styles.personalityDescription}>{result.description}</Text>
          
          <View style={styles.traitsContainer}>
            {result.traits.map((trait, index) => (
              <View key={index} style={styles.traitChip}>
                <Text style={styles.traitText}>{trait}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
            <LinearGradient colors={['#00D4A1', '#4CAF50']} style={styles.finishGradient}>
              <Text style={styles.finishText}>Start Tracking →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;
  const question = QUESTIONS[currentQuestion];

  return (
    <LinearGradient colors={['#0f172a', '#1e1b4b', '#1e293b']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
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
            style={[styles.nextButton, !selectedOption && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!selectedOption}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={selectedOption ? ['#00D4A1', '#4CAF50'] : ['#334155', '#475569']}
              style={styles.nextGradient}
            >
              <Text style={styles.nextText}>
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
  skipButton: { alignSelf: 'flex-end', padding: 12, marginBottom: 20 },
  skipText: { color: '#00D4A1', fontSize: 16, fontWeight: '600' },
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
  optionSelected: { borderColor: '#00D4A1', backgroundColor: '#00D4A120' },
  optionText: { fontSize: 16, color: '#e2e8f0', flex: 1, fontWeight: '500' },
  optionTextSelected: { color: '#fff', fontWeight: '600' },
  checkmark: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#00D4A1', justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  checkmarkText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  nextButton: { marginTop: 'auto', borderRadius: 16, overflow: 'hidden' },
  nextButtonDisabled: { opacity: 0.5 },
  nextGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, gap: 8 },
  nextText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  resultTitle: { fontSize: 18, color: '#94a3b8', marginBottom: 16 },
  personalityTitle: { fontSize: 36, fontWeight: 'bold', color: '#00D4A1', marginBottom: 16, textAlign: 'center' },
  personalityDescription: { fontSize: 18, color: '#e2e8f0', textAlign: 'center', marginBottom: 32 },
  traitsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 48, justifyContent: 'center' },
  traitChip: { backgroundColor: '#1e293b', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: '#00D4A1' },
  traitText: { color: '#00D4A1', fontSize: 14, fontWeight: '600' },
  finishButton: { borderRadius: 16, overflow: 'hidden', width: '100%' },
  finishGradient: { padding: 18, alignItems: 'center' },
  finishText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
