import WalletIcon from '../../src/components/WalletIcon';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../../src/components/Icon';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../src/config/firebase-config';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { calculateInsights } from '../../src/utils/insightsCalculator';
import WeeklyInsightsCard from '../../src/components/WeeklyInsightsCard';
import DailySpendingChart from '../../src/components/DailySpendingChart';
import CategoryPieChart from '../../src/components/CategoryPieChart';

const PERSONALITY_TYPES = {
  starter: {
    title: "The Starter",
    emoji: "🌱",
    description: "Every journey begins with a single step. Set up your income to unlock insights!",
    tip: "Complete your profile to see your money personality!",
    gradient: ['#10b981', '#34d399'],
  },
  saver: {
    title: "The Saver",
    emoji: "🐿️",
    description: "You're amazing at keeping money aside. Your future self will thank you!",
    tip: "You're a natural saver. Consider investing for even better returns!",
    gradient: ['#00D4A1', '#4CAF50'],
  },
  strategist: {
    title: "The Strategist",
    emoji: "🦊",
    description: "You're sharp. You know money is a tool, not just numbers.",
    tip: "Research wisely, invest smartly. Your brain is your best asset!",
    gradient: ['#f59e0b', '#f97316'],
  },
  balanced: {
    title: "The Balanced",
    emoji: "⚖️",
    description: "Perfect balance between enjoying today and securing tomorrow.",
    tip: "Balance is key. Keep up the great work!",
    gradient: ['#06b6d4', '#0891b2'],
  },
  enjoyer: {
    title: "The Enjoyer",
    emoji: "🦄",
    description: "Life is too short! Money means experiences, not just savings.",
    tip: "Balance is key. Enjoy today, but plan for tomorrow too!",
    gradient: ['#ec4899', '#f43f5e'],
  },
  riskTaker: {
    title: "The Risk-Taker",
    emoji: "🎲",
    description: "You're living on the edge! Time to slow down a bit.",
    tip: "Slow down! You've spent most of your budget this month.",
    gradient: ['#ef4444', '#dc2626'],
  },
};

export default function Dashboard() {
  const { user, userProfile } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, [user]);

  const logoSpin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const loadData = async () => {
    if (!user) return;

    try {
      const expensesQuery = query(
        collection(db, 'expenses'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      );
      const expensesSnapshot = await getDocs(expensesQuery);
      const expensesData = expensesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
      }));
      setExpenses(expensesData);

      const goalsQuery = query(
        collection(db, 'goals'),
        where('userId', '==', user.uid)
      );
      const goalsSnapshot = await getDocs(goalsQuery);
      const goalsData = goalsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGoals(goalsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await loadData();
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#00D4A1" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your financial universe...</Text>
      </View>
    );
  }

  const monthlyIncome = userProfile?.monthlyIncome || 0;
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' });
  
  const thisMonthExpenses = expenses
    .filter(exp => {
      const expDate = new Date(exp.date);
      const now = new Date();
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, exp) => sum + (exp.amount || 0), 0);

  const moneyLeft = monthlyIncome - thisMonthExpenses;
  const spentPercentage = monthlyIncome > 0 ? (thisMonthExpenses / monthlyIncome) * 100 : 0;
  const moneyHealth = Math.max(0, Math.round((moneyLeft / monthlyIncome) * 100));

  const insights = calculateInsights(expenses);

  const getDaysUntilSalary = () => {
    const today = new Date();
    const currentDay = today.getDate();
    const salaryDay = userProfile?.salaryDay || 1;
    
    if (currentDay < salaryDay) {
      return salaryDay - currentDay;
    } else if (currentDay === salaryDay) {
      return 0;
    } else {
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, salaryDay);
      const diffTime = nextMonth.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
  };

  const daysUntilSalary = getDaysUntilSalary();

  const getPersonality = () => {
    if (monthlyIncome === 0) return PERSONALITY_TYPES.starter;
    if (spentPercentage < 30) return PERSONALITY_TYPES.saver;
    if (spentPercentage < 50) return PERSONALITY_TYPES.strategist;
    if (spentPercentage < 70) return PERSONALITY_TYPES.balanced;
    if (spentPercentage < 90) return PERSONALITY_TYPES.enjoyer;
    return PERSONALITY_TYPES.riskTaker;
  };

  const personality = getPersonality();
  const recentExpenses = expenses.slice(0, 5);
  const topGoals = goals.slice(0, 3);

  const totalWealth = (userProfile?.existingSavings || 0) + 
                      (userProfile?.existingFDR || 0) + 
                      (userProfile?.otherInvestments || 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00D4A1" />
        }
      >
        {/* SaveUp Logo Header */}
        <Animated.View style={[styles.logoHeader, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.logoContainer}>
            <Animated.View style={{ transform: [{ rotate: logoSpin }] }}>
              <LinearGradient colors={['#00D4A1', '#4CAF50']} style={styles.logoCircle}>
                <Text style={styles.logoEmoji}>💰</Text>
              </LinearGradient>
            </Animated.View>
            <View>
              <Text style={[styles.logoText, { color: colors.text }]}>SaveUp</Text>
              <Text style={[styles.logoSubtext, { color: colors.textSecondary }]}>Bangladesh's smartest money tracker</Text>
            </View>
          </View>
        </Animated.View>

        {/* Personality Hero */}
        <Animated.View style={[styles.personalityHero, { opacity: fadeAnim }]}>
          <LinearGradient colors={personality.gradient} style={styles.personalityGradient}>
            <Text style={styles.personalityEmoji}>{personality.emoji}</Text>
            <Text style={styles.personalityTitle}>{personality.title}</Text>
            <Text style={styles.personalityDesc}>{personality.description}</Text>
            <View style={styles.personalityTip}>
              <Icon name="bulb" size={20} color="#fff" />
              <Text style={styles.personalityTipText}>{personality.tip}</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Big Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statRow}>
            <LinearGradient colors={['#00D4A1', '#4CAF50']} style={styles.statCard}>
              <Text style={styles.statEmoji}>💰</Text>
              <Text style={styles.statLabel}>{currentMonth.toUpperCase()}{'\n'}BUDGET</Text>
              <Text style={styles.statValue}>৳{(monthlyIncome ?? 0).toLocaleString('en-BD')}</Text>
              <Text style={styles.statHint}>Keep it rolling!</Text>
            </LinearGradient>

            <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.statCard}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={styles.statLabel}>SPENT SO FAR</Text>
              <Text style={styles.statValue}>৳{(thisMonthExpenses ?? 0).toLocaleString('en-BD')}</Text>
              <Text style={styles.statHint}>
                {spentPercentage < 50 ? "You're crushing it! 💪" : "Doing great!"}
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.statRow}>
            <LinearGradient colors={['#10b981', '#059669']} style={styles.statCard}>
              <Text style={styles.statEmoji}>😎</Text>
              <Text style={styles.statLabel}>LEFT TO SPEND</Text>
              <Text style={[styles.statValue, { color: moneyLeft < 0 ? '#fee2e2' : '#fff' }]}>
                ৳{(moneyLeft ?? 0).toLocaleString('en-BD')}
              </Text>
              <Text style={styles.statHint}>
                {moneyLeft < 0 ? "Overspent this month" : "Keep going!"}
              </Text>
            </LinearGradient>

            <LinearGradient colors={['#ec4899', '#db2777']} style={styles.statCard}>
              <Text style={styles.statEmoji}>✨</Text>
              <Text style={styles.statLabel}>MONEY HEALTH</Text>
              <Text style={styles.statValue}>{(moneyHealth ?? 0)}%</Text>
              <Text style={styles.statHint}>
                {moneyHealth >= 70 ? "You're a pro!" : "Keep it up!"}
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* Payday Banner */}
        <LinearGradient colors={['#00D4A1', '#4CAF50']} style={styles.paydayBanner}>
          <Text style={styles.paydayTitle}>
            {daysUntilSalary === 0 ? '🎉 Salary Day!' : `${daysUntilSalary} days until payday`}
          </Text>
          <Text style={styles.paydaySubtitle}>Save smart, live fully ✨</Text>
        </LinearGradient>

        {/* Smart Insights Section */}
        <WeeklyInsightsCard insights={insights} />
        <DailySpendingChart data={insights.dailyData} />
        <CategoryPieChart data={insights.byCategory} />

        {/* Safety Net */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🛡️ Your Safety Net</Text>
          <View style={styles.safetyGrid}>
            <View style={[styles.safetyCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 2 }]}>
              <Text style={[styles.safetyLabel, { color: colors.textSecondary }]}>Cash Ready</Text>
              <Text style={[styles.safetyValue, { color: colors.text }]}>৳{(userProfile?.existingSavings ?? 0).toLocaleString('en-BD')}</Text>
              <Text style={[styles.safetyDesc, { color: colors.textSecondary }]}>bKash, bank, pocket</Text>
            </View>
            <View style={[styles.safetyCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 2 }]}>
              <Text style={[styles.safetyLabel, { color: colors.textSecondary }]}>Locked (FDR)</Text>
              <Text style={[styles.safetyValue, { color: colors.text }]}>৳{(userProfile?.existingFDR ?? 0).toLocaleString('en-BD')}</Text>
              <Text style={[styles.safetyDesc, { color: colors.textSecondary }]}>Growing with interest</Text>
            </View>
          </View>
          <LinearGradient colors={['#00D4A1', '#4CAF50']} style={styles.totalWealthCard}>
            <Text style={styles.totalWealthLabel}>Total Wealth</Text>
            <Text style={styles.totalWealthValue}>৳{(totalWealth ?? 0).toLocaleString('en-BD')}</Text>
            <Text style={styles.totalWealthDesc}>Building your future! 🚀</Text>
          </LinearGradient>
        </View>

        {/* Goals Preview */}
        {topGoals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>🎯 Your Dreams</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/goals')}>
                <Text style={styles.seeAll}>See All →</Text>
              </TouchableOpacity>
            </View>
            {topGoals.map(goal => {
              const progress = (goal.saved / goal.targetAmount) * 100;
              return (
                <View key={goal.id} style={[styles.goalCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 2 }]}>
                  <View style={styles.goalHeader}>
                    <Text style={[styles.goalName, { color: colors.text }]}>{goal.name}</Text>
                    <Text style={styles.goalProgress}>{Math.round(progress)}%</Text>
                  </View>
                  <View style={[styles.goalProgressBar, { backgroundColor: colors.border }]}>
                    <LinearGradient
                      colors={['#00D4A1', '#4CAF50']}
                      style={[styles.goalProgressFill, { width: `${Math.min(progress, 100)}%` }]}
                    />
                  </View>
                  <View style={styles.goalFooter}>
                    <Text style={[styles.goalAmount, { color: colors.textSecondary }]}>৳{(goal.saved ?? 0).toLocaleString('en-BD')}</Text>
                    <Text style={[styles.goalTarget, { color: colors.textSecondary }]}>of ৳{(goal.targetAmount ?? 0).toLocaleString('en-BD')}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Recent Expenses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>💸 Where'd Your Money Go?</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/expenses')}>
              <Text style={styles.seeAll}>See All →</Text>
            </TouchableOpacity>
          </View>

          {recentExpenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🤷</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No expenses yet!</Text>
              <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>Start tracking to see your spending patterns</Text>
            </View>
          ) : (
            recentExpenses.map(expense => (
              <View key={expense.id} style={[styles.expenseItem, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 2 }]}>
                <View style={styles.expenseLeft}>
                  <Text style={[styles.expenseCategory, { color: colors.text }]}>{expense.category}</Text>
                  <Text style={[styles.expenseDate, { color: colors.textSecondary }]}>
                    {new Date(expense.date).toLocaleDateString('en-GB', { 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </Text>
                </View>
                <Text style={styles.expenseAmount}>-৳{(expense.amount ?? 0).toLocaleString('en-BD')}</Text>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 14 },
  scrollView: { flex: 1 },
  logoHeader: { padding: 20, paddingTop: 60 },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoCircle: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  logoEmoji: { fontSize: 28 },
  logoText: { fontSize: 24, fontWeight: 'bold' },
  logoSubtext: { fontSize: 11 },
  personalityHero: { marginHorizontal: 20, marginBottom: 20, borderRadius: 24, overflow: 'hidden' },
  personalityGradient: { padding: 32, alignItems: 'center' },
  personalityEmoji: { fontSize: 64, marginBottom: 12 },
  personalityTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  personalityDesc: { fontSize: 14, color: '#fff', textAlign: 'center', marginBottom: 16, opacity: 0.95 },
  personalityTip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 12, gap: 8 },
  personalityTipText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  statsGrid: { paddingHorizontal: 20, marginBottom: 20 },
  statRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, padding: 20, borderRadius: 20, minHeight: 140 },
  statEmoji: { fontSize: 32, marginBottom: 8 },
  statLabel: { fontSize: 11, color: '#fff', fontWeight: '700', marginBottom: 8, opacity: 0.9 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  statHint: { fontSize: 11, color: '#fff', opacity: 0.85 },
  paydayBanner: { marginHorizontal: 20, marginBottom: 20, padding: 24, borderRadius: 20, alignItems: 'center' },
  paydayTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  paydaySubtitle: { fontSize: 14, color: '#fff', opacity: 0.9 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold' },
  seeAll: { fontSize: 14, color: '#00D4A1', fontWeight: '600' },
  safetyGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  safetyCard: { flex: 1, padding: 16, borderRadius: 16 },
  safetyLabel: { fontSize: 12, marginBottom: 8 },
  safetyValue: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  safetyDesc: { fontSize: 11 },
  totalWealthCard: { padding: 20, borderRadius: 16, alignItems: 'center' },
  totalWealthLabel: { fontSize: 13, color: '#fff', fontWeight: '600', marginBottom: 8, opacity: 0.9 },
  totalWealthValue: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  totalWealthDesc: { fontSize: 12, color: '#fff', opacity: 0.85 },
  goalCard: { padding: 16, borderRadius: 16, marginBottom: 12 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  goalName: { fontSize: 16, fontWeight: '600' },
  goalProgress: { fontSize: 16, fontWeight: 'bold', color: '#00D4A1' },
  goalProgressBar: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  goalProgressFill: { height: '100%', borderRadius: 4 },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  goalAmount: { fontSize: 13, fontWeight: '600' },
  goalTarget: { fontSize: 13 },
  expenseItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 8 },
  expenseLeft: { flex: 1 },
  expenseCategory: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  expenseDate: { fontSize: 12 },
  expenseAmount: { fontSize: 16, fontWeight: 'bold', color: '#ef4444' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 64, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  emptyHint: { fontSize: 13, textAlign: 'center' },
});
