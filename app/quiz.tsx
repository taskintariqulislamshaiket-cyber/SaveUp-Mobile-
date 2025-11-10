import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../src/components/Icon';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../src/config/firebase-config';
import { useAuth } from '../src/contexts/AuthContext';
import * as Haptics from 'expo-haptics';

const QUESTIONS = [
  {
    id: 1,
    question: "When you get your salary, what's your first move?",
    emoji: "💰",
    options: [
      { text: "Transfer to savings immediately", emoji: "🛡️", value: "guardian" },
      { text: "Invest in stocks/crypto", emoji: "📈", value: "strategist" },
      { text: "Pay bills first", emoji: "⚖️", value: "realist" },
      { text: "Treat myself a little", emoji: "🎉", value: "enjoyer" },
      { text: "Help family members", emoji: "❤️", value: "giver" },
      { text: "Make a detailed budget", emoji: "📊", value: "planner" },
      { text: "Keep it flexible", emoji: "🎭", value: "improviser" },
    ],
  },
  {
    id: 2,
    question: "How do you feel about debt?",
    emoji: "💳",
    options: [
      { text: "Avoid it at all costs", emoji: "🛡️", value: "guardian" },
      { text: "Strategic debt is okay", emoji: "🧠", value: "strategist" },
      { text: "Necessary evil", emoji: "⚖️", value: "realist" },
      { text: "Not ideal but happens", emoji: "🤷", value: "enjoyer" },
      { text: "Worth it for family", emoji: "❤️", value: "giver" },
      { text: "Plan to pay off ASAP", emoji: "📊", value: "planner" },
      { text: "Deal with it as it comes", emoji: "🎭", value: "improviser" },
    ],
  },
  {
    id: 3,
    question: "Your friend asks to borrow money. You:",
    emoji: "🤝",
    options: [
      { text: "Lend only what I can afford to lose", emoji: "🛡️", value: "guardian" },
      { text: "Ask for a written agreement", emoji: "📝", value: "strategist" },
      { text: "Lend if they really need it", emoji: "⚖️", value: "realist" },
      { text: "Lend freely", emoji: "🎉", value: "enjoyer" },
      { text: "Give without expecting back", emoji: "❤️", value: "giver" },
      { text: "Check my budget first", emoji: "📊", value: "planner" },
      { text: "Go with my gut feeling", emoji: "🎭", value: "improviser" },
    ],
  },
  {
    id: 4,
    question: "You found ৳10,000 extra this month. You:",
    emoji: "🎁",
    options: [
      { text: "Save it all", emoji: "🛡️", value: "guardian" },
      { text: "Invest half, save half", emoji: "🧠", value: "strategist" },
      { text: "Pay off pending bills", emoji: "⚖️", value: "realist" },
      { text: "Splurge on something fun", emoji: "🎉", value: "enjoyer" },
      { text: "Share with family", emoji: "❤️", value: "giver" },
      { text: "Add to emergency fund", emoji: "📊", value: "planner" },
      { text: "Keep it for spontaneous needs", emoji: "🎭", value: "improviser" },
    ],
  },
  {
    id: 5,
    question: "Your approach to budgeting:",
    emoji: "📋",
    options: [
      { text: "Strict, every taka tracked", emoji: "��️", value: "guardian" },
      { text: "Optimize for maximum returns", emoji: "🧠", value: "strategist" },
      { text: "Basics covered, rest flexible", emoji: "⚖️", value: "realist" },
      { text: "Loose budget, enjoy life", emoji: "🎉", value: "enjoyer" },
      { text: "Family needs come first", emoji: "❤️", value: "giver" },
      { text: "Detailed monthly plan", emoji: "📊", value: "planner" },
      { text: "No budget, wing it", emoji: "🎭", value: "improviser" },
    ],
  },
  {
    id: 6,
    question: "When shopping, you:",
    emoji: "🛍️",
    options: [
      { text: "Buy only what's needed", emoji: "🛡️", value: "guardian" },
      { text: "Research best deals", emoji: "🧠", value: "strategist" },
      { text: "Buy what's reasonable", emoji: "⚖️", value: "realist" },
      { text: "Buy what makes me happy", emoji: "🎉", value: "enjoyer" },
      { text: "Buy for others too", emoji: "❤️", value: "giver" },
      { text: "Stick to shopping list", emoji: "📊", value: "planner" },
      { text: "Impulse buy sometimes", emoji: "🎭", value: "improviser" },
    ],
  },
  {
    id: 7,
    question: "Your savings goal is:",
    emoji: "🎯",
    options: [
      { text: "1 year emergency fund", emoji: "🛡️", value: "guardian" },
      { text: "Investment portfolio growth", emoji: "🧠", value: "strategist" },
      { text: "6 months expenses", emoji: "⚖️", value: "realist" },
      { text: "Enough for next vacation", emoji: "🎉", value: "enjoyer" },
      { text: "Support family needs", emoji: "❤️", value: "giver" },
      { text: "Specific amount by date", emoji: "��", value: "planner" },
      { text: "Whatever I can save", emoji: "🎭", value: "improviser" },
    ],
  },
  {
    id: 8,
    question: "Financial stress makes you:",
    emoji: "😰",
    options: [
      { text: "Review and adjust plans", emoji: "🛡️", value: "guardian" },
      { text: "Analyze root causes", emoji: "🧠", value: "strategist" },
      { text: "Focus on solutions", emoji: "⚖️", value: "realist" },
      { text: "Try to stay positive", emoji: "🎉", value: "enjoyer" },
      { text: "Seek family support", emoji: "❤️", value: "giver" },
      { text: "Make a recovery plan", emoji: "📊", value: "planner" },
      { text: "Take it day by day", emoji: "🎭", value: "improviser" },
    ],
  },
  {
    id: 9,
    question: "Your ideal financial future:",
    emoji: "🌟",
    options: [
      { text: "Complete financial security", emoji: "🛡️", value: "guardian" },
      { text: "Multiple income streams", emoji: "🧠", value: "strategist" },
      { text: "Comfortable stable life", emoji: "⚖️", value: "realist" },
      { text: "Freedom to enjoy experiences", emoji: "🎉", value: "enjoyer" },
      { text: "Ability to help loved ones", emoji: "❤️", value: "giver" },
      { text: "All goals achieved on time", emoji: "📊", value: "planner" },
      { text: "Live in the moment", emoji: "🎭", value: "improviser" },
    ],
  },
  {
    id: 10,
    question: "You prefer to:",
    emoji: "💭",
    options: [
      { text: "Save first, spend later", emoji: "🛡️", value: "guardian" },
      { text: "Invest for compound growth", emoji: "🧠", value: "strategist" },
      { text: "Balance saving and spending", emoji: "⚖️", value: "realist" },
      { text: "Enjoy today, save tomorrow", emoji: "🎉", value: "enjoyer" },
      { text: "Ensure family is taken care of", emoji: "❤️", value: "giver" },
      { text: "Follow a structured plan", emoji: "📊", value: "planner" },
      { text: "Go with the flow", emoji: "🎭", value: "improviser" },
    ],
  },
  {
    id: 11,
    question: "Financial advice you'd give:",
    emoji: "💡",
    options: [
      { text: "Always have an emergency fund", emoji: "🛡️", value: "guardian" },
      { text: "Start investing early", emoji: "🧠", value: "strategist" },
      { text: "Don't stress, be practical", emoji: "⚖️", value: "realist" },
      { text: "Money is meant to be enjoyed", emoji: "🎉", value: "enjoyer" },
      { text: "Take care of family first", emoji: "❤️", value: "giver" },
      { text: "Plan everything in advance", emoji: "📊", value: "planner" },
      { text: "Be flexible and adapt", emoji: "🎭", value: "improviser" },
    ],
  },
  {
    id: 12,
    question: "Money makes you feel:",
    emoji: "😊",
    options: [
      { text: "Secure and protected", emoji: "🛡️", value: "guardian" },
      { text: "Powerful and strategic", emoji: "🧠", value: "strategist" },
      { text: "Grounded and realistic", emoji: "⚖️", value: "realist" },
      { text: "Free and happy", emoji: "🎉", value: "enjoyer" },
      { text: "Generous and caring", emoji: "❤️", value: "giver" },
      { text: "Organized and in control", emoji: "📊", value: "planner" },
      { text: "Fluid and adaptable", emoji: "🎭", value: "improviser" },
    ],
  },
];

const PERSONALITY_TYPES = {
  guardian: {
    title: "The Guardian",
    emoji: "🛡️",
    description: "You're a natural protector. Security is your superpower, and you're building a fortress of financial stability.",
    tip: "Keep that emergency fund strong! Consider diversifying into low-risk investments.",
    gradient: ['#10b981', '#059669'],
  },
  strategist: {
    title: "The Strategist",
    emoji: "🧠",
    description: "You play chess while others play checkers. Every move is calculated, every taka optimized.",
    tip: "Your analytical mind is your asset. Balance aggressive growth with some safety nets.",
    gradient: ['#3b82f6', '#2563eb'],
  },
  realist: {
    title: "The Realist",
    emoji: "⚖️",
    description: "You're grounded, practical, and balanced. You live in reality, not fantasies.",
    tip: "Perfect balance! Maybe add some stretch goals to push your comfort zone.",
    gradient: ['#06b6d4', '#0891b2'],
  },
  enjoyer: {
    title: "The Enjoyer",
    emoji: "🎉",
    description: "Life is short, and you know it. Money is a tool for creating memories, not just accumulating.",
    tip: "Keep enjoying life! Just make sure future-you has some backup too.",
    gradient: ['#ec4899', '#db2777'],
  },
  giver: {
    title: "The Giver",
    emoji: "❤️",
    description: "Your heart is as big as your wallet. Helping others brings you true wealth.",
    tip: "Beautiful soul! Remember, you can't pour from an empty cup. Secure yourself first.",
    gradient: ['#f59e0b', '#d97706'],
  },
  planner: {
    title: "The Planner",
    emoji: "📊",
    description: "Structure, systems, spreadsheets. You've got it all mapped out, and you're crushing your goals.",
    tip: "Your discipline is admirable! Leave a bit of room for spontaneity too.",
    gradient: ['#8b5cf6', '#7c3aed'],
  },
  improviser: {
    title: "The Improviser",
    emoji: "🎭",
    description: "You flow like water. No rigid plans, just adapting to whatever life throws at you.",
    tip: "Flexibility is strength! A small safety net would give you even more freedom.",
    gradient: ['#64748b', '#475569'],
  },
};

export default function QuizScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentQuestion]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentQuestion + 1) / QUESTIONS.length,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [currentQuestion]);

  const handleAnswer = async (value: string) => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newAnswers = { ...answers, [currentQuestion]: value };
    setAnswers(newAnswers);

    if (currentQuestion < QUESTIONS.length - 1) {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      scaleAnim.setValue(0.95);
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResult(newAnswers);
    }
  };

  const calculateResult = async (finalAnswers: Record<number, string>) => {
    const counts: Record<string, number> = {};
    Object.values(finalAnswers).forEach((answer) => {
      counts[answer] = (counts[answer] || 0) + 1;
    });

    const personality = Object.keys(counts).reduce((a, b) =>
      counts[a] > counts[b] ? a : b
    );

    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setResult(personality);

    if (user) {
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          { personalityType: personality },
          { merge: true }
        );
      } catch (error) {
        console.error('Error saving personality:', error);
      }
    }
  };

  const progress = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (result) {
    const personality = PERSONALITY_TYPES[result as keyof typeof PERSONALITY_TYPES];
    return (
      <LinearGradient colors={personality.gradient} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.resultContainer}>
            <Animated.View style={[styles.resultCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
              <Text style={styles.resultEmoji}>{personality.emoji}</Text>
              <Text style={styles.resultTitle}>{personality.title}</Text>
              <Text style={styles.resultDescription}>{personality.description}</Text>
              
              <View style={styles.tipCard}>
                <Icon name="bulb" size={28} color="#ffffff" />
                <Text style={styles.tipText}>{personality.tip}</Text>
              </View>

              <TouchableOpacity
                onPress={async () => {
                  if (Platform.OS !== 'web') {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  router.replace('/(tabs)');
                }}
                style={styles.continueButton}
                activeOpacity={0.8}
              >
                <LinearGradient colors={['#fff', '#f3f4f6']} style={styles.continueGradient}>
                  <Text style={styles.continueText}>Start Tracking! 🚀</Text>
                  <Icon name="arrow-forward-circle" size={28} color="#0f172a" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const question = QUESTIONS[currentQuestion];

  return (
    <LinearGradient colors={['#0f172a', '#1e1b4b', '#1e293b']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.titleRow}>
            <Text style={styles.questionEmoji}>{question.emoji}</Text>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Money Personality Quiz</Text>
              <Text style={styles.progressText}>
                Question {currentQuestion + 1} of {QUESTIONS.length}
              </Text>
            </View>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressFill, { width: progress }]} />
            </View>
          </View>
        </Animated.View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.Text 
            style={[
              styles.question,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            {question.question}
          </Animated.Text>

          <View style={styles.optionsContainer}>
            {question.options.map((option, index) => (
              <Animated.View
                key={index}
                style={[
                  {
                    opacity: fadeAnim,
                    transform: [
                      { translateX: slideAnim },
                      { scale: scaleAnim },
                    ],
                  }
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleAnswer(option.value)}
                  style={styles.optionButton}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#1e293b', '#334155']}
                    style={styles.optionGradient}
                  >
                    <Text style={styles.optionEmoji}>{option.emoji}</Text>
                    <Text style={styles.optionText}>{option.text}</Text>
                    <Icon name="chevron-forward-circle" size={24} color="#00D4A1" />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { padding: 20, paddingTop: 60 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  questionEmoji: { fontSize: 48 },
  titleContainer: { flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  progressText: { fontSize: 13, color: '#94a3b8' },
  progressContainer: { marginBottom: 8 },
  progressBar: {
    height: 10,
    backgroundColor: '#334155',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00D4A1',
    borderRadius: 10,
  },
  content: { flex: 1, padding: 20 },
  question: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 32,
    lineHeight: 36,
  },
  optionsContainer: { gap: 14, paddingBottom: 40 },
  optionButton: { borderRadius: 18, overflow: 'hidden' },
  optionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 14,
  },
  optionEmoji: { fontSize: 28 },
  optionText: { fontSize: 16, color: '#e2e8f0', flex: 1, lineHeight: 22, fontWeight: '500' },
  resultContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  resultCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 28,
    padding: 40,
    alignItems: 'center',
  },
  resultEmoji: { fontSize: 80, marginBottom: 20 },
  resultTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  resultDescription: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 28,
    opacity: 0.95,
  },
  tipCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 18,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 36,
  },
  tipText: { fontSize: 16, color: '#fff', flex: 1, lineHeight: 24, fontWeight: '500' },
  continueButton: { width: '100%', borderRadius: 18, overflow: 'hidden' },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 36,
    gap: 12,
  },
  continueText: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
});
