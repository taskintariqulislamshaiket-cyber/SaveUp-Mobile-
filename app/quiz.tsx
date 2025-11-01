import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../src/config/firebase-config';
import { useAuth } from '../src/contexts/AuthContext';

const QUESTIONS = [
  {
    id: 1,
    question: "When you get your salary, what's your first move?",
    options: [
      { text: "Transfer to savings immediately", value: "guardian" },
      { text: "Invest in stocks/crypto", value: "strategist" },
      { text: "Pay bills first", value: "realist" },
      { text: "Treat myself a little", value: "enjoyer" },
      { text: "Help family members", value: "giver" },
      { text: "Make a detailed budget", value: "planner" },
      { text: "Keep it flexible", value: "improviser" },
    ],
  },
  {
    id: 2,
    question: "How do you feel about debt?",
    options: [
      { text: "Avoid it at all costs", value: "guardian" },
      { text: "Strategic debt is okay", value: "strategist" },
      { text: "Necessary evil", value: "realist" },
      { text: "Not ideal but happens", value: "enjoyer" },
      { text: "Worth it for family", value: "giver" },
      { text: "Plan to pay off ASAP", value: "planner" },
      { text: "Deal with it as it comes", value: "improviser" },
    ],
  },
  {
    id: 3,
    question: "Your friend asks to borrow money. You:",
    options: [
      { text: "Lend only what I can afford to lose", value: "guardian" },
      { text: "Ask for a written agreement", value: "strategist" },
      { text: "Lend if they really need it", value: "realist" },
      { text: "Lend freely", value: "enjoyer" },
      { text: "Give without expecting back", value: "giver" },
      { text: "Check my budget first", value: "planner" },
      { text: "Go with my gut feeling", value: "improviser" },
    ],
  },
  {
    id: 4,
    question: "You found ৳10,000 extra this month. You:",
    options: [
      { text: "Save it all", value: "guardian" },
      { text: "Invest half, save half", value: "strategist" },
      { text: "Pay off pending bills", value: "realist" },
      { text: "Splurge on something fun", value: "enjoyer" },
      { text: "Share with family", value: "giver" },
      { text: "Add to emergency fund", value: "planner" },
      { text: "Keep it for spontaneous needs", value: "improviser" },
    ],
  },
  {
    id: 5,
    question: "Your approach to budgeting:",
    options: [
      { text: "Strict, every taka tracked", value: "guardian" },
      { text: "Optimize for maximum returns", value: "strategist" },
      { text: "Basics covered, rest flexible", value: "realist" },
      { text: "Loose budget, enjoy life", value: "enjoyer" },
      { text: "Family needs come first", value: "giver" },
      { text: "Detailed monthly plan", value: "planner" },
      { text: "No budget, wing it", value: "improviser" },
    ],
  },
  {
    id: 6,
    question: "When shopping, you:",
    options: [
      { text: "Buy only what's needed", value: "guardian" },
      { text: "Research best deals", value: "strategist" },
      { text: "Buy what's reasonable", value: "realist" },
      { text: "Buy what makes me happy", value: "enjoyer" },
      { text: "Buy for others too", value: "giver" },
      { text: "Stick to shopping list", value: "planner" },
      { text: "Impulse buy sometimes", value: "improviser" },
    ],
  },
  {
    id: 7,
    question: "Your savings goal is:",
    options: [
      { text: "1 year emergency fund", value: "guardian" },
      { text: "Investment portfolio growth", value: "strategist" },
      { text: "6 months expenses", value: "realist" },
      { text: "Enough for next vacation", value: "enjoyer" },
      { text: "Support family needs", value: "giver" },
      { text: "Specific amount by date", value: "planner" },
      { text: "Whatever I can save", value: "improviser" },
    ],
  },
  {
    id: 8,
    question: "Financial stress makes you:",
    options: [
      { text: "Review and adjust plans", value: "guardian" },
      { text: "Analyze root causes", value: "strategist" },
      { text: "Focus on solutions", value: "realist" },
      { text: "Try to stay positive", value: "enjoyer" },
      { text: "Seek family support", value: "giver" },
      { text: "Make a recovery plan", value: "planner" },
      { text: "Take it day by day", value: "improviser" },
    ],
  },
  {
    id: 9,
    question: "Your ideal financial future:",
    options: [
      { text: "Complete financial security", value: "guardian" },
      { text: "Multiple income streams", value: "strategist" },
      { text: "Comfortable stable life", value: "realist" },
      { text: "Freedom to enjoy experiences", value: "enjoyer" },
      { text: "Ability to help loved ones", value: "giver" },
      { text: "All goals achieved on time", value: "planner" },
      { text: "Live in the moment", value: "improviser" },
    ],
  },
  {
    id: 10,
    question: "You prefer to:",
    options: [
      { text: "Save first, spend later", value: "guardian" },
      { text: "Invest for compound growth", value: "strategist" },
      { text: "Balance saving and spending", value: "realist" },
      { text: "Enjoy today, save tomorrow", value: "enjoyer" },
      { text: "Ensure family is taken care of", value: "giver" },
      { text: "Follow a structured plan", value: "planner" },
      { text: "Go with the flow", value: "improviser" },
    ],
  },
  {
    id: 11,
    question: "Financial advice you'd give:",
    options: [
      { text: "Always have an emergency fund", value: "guardian" },
      { text: "Start investing early", value: "strategist" },
      { text: "Don't stress, be practical", value: "realist" },
      { text: "Money is meant to be enjoyed", value: "enjoyer" },
      { text: "Take care of family first", value: "giver" },
      { text: "Plan everything in advance", value: "planner" },
      { text: "Be flexible and adapt", value: "improviser" },
    ],
  },
  {
    id: 12,
    question: "Money makes you feel:",
    options: [
      { text: "Secure and protected", value: "guardian" },
      { text: "Powerful and strategic", value: "strategist" },
      { text: "Grounded and realistic", value: "realist" },
      { text: "Free and happy", value: "enjoyer" },
      { text: "Generous and caring", value: "giver" },
      { text: "Organized and in control", value: "planner" },
      { text: "Fluid and adaptable", value: "improviser" },
    ],
  },
];

const PERSONALITY_TYPES = {
  guardian: {
    title: "The Guardian 🛡️",
    description: "You're a natural protector. Security is your superpower, and you're building a fortress of financial stability.",
    tip: "Keep that emergency fund strong! Consider diversifying into low-risk investments.",
    gradient: ['#10b981', '#059669'],
  },
  strategist: {
    title: "The Strategist 🧠",
    description: "You play chess while others play checkers. Every move is calculated, every taka optimized.",
    tip: "Your analytical mind is your asset. Balance aggressive growth with some safety nets.",
    gradient: ['#3b82f6', '#2563eb'],
  },
  realist: {
    title: "The Realist ⚖️",
    description: "You're grounded, practical, and balanced. You live in reality, not fantasies.",
    tip: "Perfect balance! Maybe add some stretch goals to push your comfort zone.",
    gradient: ['#06b6d4', '#0891b2'],
  },
  enjoyer: {
    title: "The Enjoyer 🎉",
    description: "Life is short, and you know it. Money is a tool for creating memories, not just accumulating.",
    tip: "Keep enjoying life! Just make sure future-you has some backup too.",
    gradient: ['#ec4899', '#db2777'],
  },
  giver: {
    title: "The Giver ❤️",
    description: "Your heart is as big as your wallet. Helping others brings you true wealth.",
    tip: "Beautiful soul! Remember, you can't pour from an empty cup. Secure yourself first.",
    gradient: ['#f59e0b', '#d97706'],
  },
  planner: {
    title: "The Planner 📊",
    description: "Structure, systems, spreadsheets. You've got it all mapped out, and you're crushing your goals.",
    tip: "Your discipline is admirable! Leave a bit of room for spontaneity too.",
    gradient: ['#8b5cf6', '#7c3aed'],
  },
  improviser: {
    title: "The Improviser 🎭",
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

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [currentQuestion]: value };
    setAnswers(newAnswers);

    if (currentQuestion < QUESTIONS.length - 1) {
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

    setResult(personality);

    // Save to Firebase
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

  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  if (result) {
    const personality = PERSONALITY_TYPES[result as keyof typeof PERSONALITY_TYPES];
    return (
      <LinearGradient colors={personality.gradient as any} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.resultContainer}>
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>{personality.title}</Text>
              <Text style={styles.resultDescription}>{personality.description}</Text>
              
              <View style={styles.tipCard}>
                <Ionicons name="bulb" size={24} color="#ffffff" />
                <Text style={styles.tipText}>{personality.tip}</Text>
              </View>

              <TouchableOpacity
                onPress={() => router.replace('/(tabs)')}
                style={styles.continueButton}
              >
                <Text style={styles.continueText}>Continue to Dashboard</Text>
                <Ionicons name="arrow-forward" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const question = QUESTIONS[currentQuestion];

  return (
    <LinearGradient colors={['#0f172a', '#1e293b'] as any} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Money Personality Quiz</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {currentQuestion + 1} / {QUESTIONS.length}
            </Text>
          </View>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.question}>{question.question}</Text>

          <View style={styles.optionsContainer}>
            {question.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleAnswer(option.value)}
                style={styles.optionButton}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#1e293b', '#334155'] as any}
                  style={styles.optionGradient}
                >
                  <Text style={styles.optionText}>{option.text}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#8b5cf6" />
                </LinearGradient>
              </TouchableOpacity>
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
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  progressContainer: { gap: 8 },
  progressBar: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 4,
  },
  progressText: { fontSize: 14, color: '#94a3b8', textAlign: 'right' },
  content: { flex: 1, padding: 20 },
  question: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    lineHeight: 32,
  },
  optionsContainer: { gap: 12 },
  optionButton: { borderRadius: 16, overflow: 'hidden' },
  optionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  optionText: { fontSize: 16, color: '#e2e8f0', flex: 1, lineHeight: 22 },
  resultContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  resultCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  resultDescription: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 26,
  },
  tipCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 32,
  },
  tipText: { fontSize: 16, color: '#fff', flex: 1, lineHeight: 22 },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 8,
  },
  continueText: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
});
