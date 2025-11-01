import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../src/config/firebase-config';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { calculateInsights, ExpenseItem } from '../../src/screens/InsightsHelper';

const PERSONALITY_EMOJIS: Record<string, string> = {
  guardian: '🛡️',
  strategist: '🧠',
  realist: '⚖️',
  enjoyer: '🎉',
  giver: '❤️',
  planner: '📊',
  improviser: '🎭',
};

export default function Dashboard() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Load expenses
      const expensesQuery = query(
        collection(db, 'expenses'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      );
      const expensesSnapshot = await getDocs(expensesQuery);
      const expensesData: ExpenseItem[] = expensesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          amount: data.amount || 0,
          category: data.category || 'Other',
          description: data.description || '',
          date: data.date?.toDate() || new Date(),
          userId: data.userId || '',
        };
      });
      setExpenses(expensesData);

      // Load goals
      const goalsQuery = query(
        collection(db, 'goals'),
        where('userId', '==', user.uid)
      );
      const goalsSnapshot = await getDocs(goalsQuery);
      const goalsData = goalsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        deadline: doc.data().deadline?.toDate(),
      }));
      setGoals(goalsData);

      // Calculate insights
      if (userProfile) {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyExpenses = expensesData.filter(exp => {
          const expDate = exp.date;
          return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
        });

        const totalSpent = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const salaryDay = userProfile.salaryDay || 1;
        const today = new Date().getDate();
        
        let daysIntoMonth = today >= salaryDay ? today - salaryDay : today + (30 - salaryDay);
        let daysUntilPayday = today < salaryDay ? salaryDay - today : 30 - (today - salaryDay);

        const insightsData = {
          totalSpent,
          monthlyIncome: userProfile.monthlyIncome || 0,
          remainingBalance: userProfile.remainingBalanceCurrentMonth || 0,
          daysIntoMonth,
          daysUntilPayday,
          salaryDay,
          expenses: monthlyExpenses,
          personalityType: userProfile.personalityType || 'balanced',
        };

        const calculatedInsights = calculateInsights(insightsData);
        setInsights(calculatedInsights);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, userProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await loadData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  // Calculate stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyExpenses = expenses.filter(exp => {
    const expDate = exp.date;
    return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
  });

  const totalSpent = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const monthlyIncome = userProfile?.monthlyIncome || 0;
  const remainingBalance = monthlyIncome - totalSpent;
  const moneyHealth = monthlyIncome > 0 ? Math.max(0, ((monthlyIncome - totalSpent) / monthlyIncome) * 100) : 100;

  const getHealthColor = (health: number): [string, string] => {
    if (health >= 70) return ['#10b981', '#059669'];
    if (health >= 40) return ['#f59e0b', '#d97706'];
    return ['#ef4444', '#dc2626'];
  };

  const personalityEmoji = PERSONALITY_EMOJIS[userProfile?.personalityType || 'realist'] || '⚖️';

  return (
    <LinearGradient colors={['#0f172a' as any, '#1e293b' as any]} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{userProfile?.displayName || user?.email?.split('@')[0] || 'User'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.personalityBadge}
            onPress={() => router.push('/quiz')}
          >
            <Text style={styles.personalityEmoji}>{personalityEmoji}</Text>
          </TouchableOpacity>
        </View>

        {/* Smart Insights Section - Integrated */}
        {insights.length > 0 && (
          <View style={styles.insightsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💡 Smart Insights</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/insights')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {/* Top 2 insights */}
            {insights.slice(0, 2).map((insight, index) => (
              <TouchableOpacity
                key={insight.id}
                activeOpacity={0.9}
                onPress={() => router.push('/(tabs)/insights')}
                style={styles.insightCard}
              >
                <LinearGradient
                  colors={(
                    insight.type === 'critical'
                      ? ['#ef4444', '#dc2626']
                      : insight.type === 'warning'
                      ? ['#f59e0b', '#d97706']
                      : ['#8b5cf6', '#7c3aed']
                  ) as any}
                  style={styles.insightGradient}
                >
                  <View style={styles.insightHeader}>
                    <Text style={styles.insightEmoji}>{insight.emoji}</Text>
                    <View style={styles.insightTextContainer}>
                      <Text style={styles.insightTitle}>{insight.title}</Text>
                      <Text style={styles.insightMessage} numberOfLines={2}>{insight.message}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Stats Cards - 2x2 Grid */}
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            {/* Monthly Budget */}
            <View style={styles.statCard}>
              <LinearGradient colors={['#8b5cf6', '#7c3aed'] as any} style={styles.statGradient}>
                <Ionicons name="cash-outline" size={28} color="#fff" />
                <Text style={styles.statLabel}>Budget</Text>
                <Text style={styles.statValue}>৳{monthlyIncome.toFixed(0)}</Text>
                <Text style={styles.statHint}>This month</Text>
              </LinearGradient>
            </View>

            {/* Spent So Far */}
            <View style={styles.statCard}>
              <LinearGradient colors={['#f59e0b', '#d97706'] as any} style={styles.statGradient}>
                <Ionicons name="flame" size={28} color="#fff" />
                <Text style={styles.statLabel}>Spent</Text>
                <Text style={styles.statValue}>৳{totalSpent.toFixed(0)}</Text>
                <Text style={styles.statHint}>{monthlyExpenses.length} transactions</Text>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.statsRow}>
            {/* Left to Spend */}
            <View style={styles.statCard}>
              <LinearGradient colors={['#10b981', '#059669'] as any} style={styles.statGradient}>
                <Ionicons name="wallet-outline" size={28} color="#fff" />
                <Text style={styles.statLabel}>Remaining</Text>
                <Text style={styles.statValue}>৳{remainingBalance.toFixed(0)}</Text>
                <Text style={styles.statHint}>Keep going!</Text>
              </LinearGradient>
            </View>

            {/* Money Health */}
            <View style={styles.statCard}>
              <LinearGradient colors={['#ec4899', '#db2777'] as any} style={styles.statGradient}>
                <Ionicons name="heart" size={28} color="#fff" />
                <Text style={styles.statLabel}>Health</Text>
                <Text style={styles.statValue}>{moneyHealth.toFixed(0)}%</Text>
                <Text style={styles.statHint}>
                  {moneyHealth >= 70 ? 'Excellent!' : moneyHealth >= 40 ? 'Good' : 'Needs Work'}
                </Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Goals Preview */}
        {goals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🎯 Your Goals</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/goals')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            {goals.slice(0, 3).map((goal) => {
              const progress = (goal.saved / goal.targetAmount) * 100;
              return (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    <Text style={styles.goalProgress}>{Math.round(progress)}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]}
                    />
                  </View>
                  <Text style={styles.goalAmount}>
                    ৳{goal.saved.toLocaleString('en-BD')} / ৳{goal.targetAmount.toLocaleString('en-BD')}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Recent Expenses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💸 Recent Expenses</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/expenses')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {monthlyExpenses.slice(0, 5).map((expense) => (
            <View key={expense.id} style={styles.expenseItem}>
              <View style={styles.expenseIcon}>
                <Ionicons
                  name={expense.category === 'Food' ? 'fast-food' : 'cart'}
                  size={20}
                  color="#8b5cf6"
                />
              </View>
              <View style={styles.expenseDetails}>
                <Text style={styles.expenseName}>{expense.description}</Text>
                <Text style={styles.expenseCategory}>{expense.category}</Text>
              </View>
              <Text style={styles.expenseAmount}>-৳{expense.amount.toFixed(0)}</Text>
            </View>
          ))}

          {monthlyExpenses.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#64748b" />
              <Text style={styles.emptyText}>No expenses yet this month</Text>
              <TouchableOpacity 
                onPress={() => router.push('/(tabs)/expenses')}
                style={styles.addExpenseButton}
              >
                <Text style={styles.addExpenseText}>Add Your First Expense</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  scrollView: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  greeting: { fontSize: 16, color: '#94a3b8' },
  userName: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  personalityBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
  },
  personalityEmoji: { fontSize: 28 },
  insightsSection: { paddingHorizontal: 20, marginBottom: 24 },
  insightCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
  },
  insightGradient: { padding: 20 },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  insightEmoji: { fontSize: 32, marginRight: 12 },
  insightTextContainer: { flex: 1 },
  insightTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  insightMessage: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    lineHeight: 20,
  },
  statsSection: { paddingHorizontal: 20, marginBottom: 24 },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 20,
    minHeight: 140,
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 8,
    marginBottom: 4,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statHint: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  section: { padding: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  seeAll: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  goalCard: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  goalProgress: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 4,
  },
  goalAmount: {
    fontSize: 12,
    color: '#94a3b8',
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseDetails: { flex: 1 },
  expenseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  expenseCategory: { fontSize: 12, color: '#94a3b8' },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 12,
    marginBottom: 16,
  },
  addExpenseButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  addExpenseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
