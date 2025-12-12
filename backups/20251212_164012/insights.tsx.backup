import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
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

export default function InsightsScreen() {
  const { user, userProfile } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadData();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [user, userProfile]);

  const loadData = async () => {
    if (!user) return;

    try {
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

  const onRefresh = async () => {
    setRefreshing(true);
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await loadData();
  };

  const personalityEmoji = PERSONALITY_EMOJIS[userProfile?.personalityType || 'realist'] || '⚖️';
  const personalityName = userProfile?.personalityType ? 
    userProfile.personalityType.charAt(0).toUpperCase() + userProfile.personalityType.slice(1) : 
    'Realist';

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyExpenses = expenses.filter(exp => {
    const expDate = exp.date;
    return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
  });

  const totalSpent = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const monthlyIncome = userProfile?.monthlyIncome || 0;
  const spendingRate = monthlyIncome > 0 ? (totalSpent / monthlyIncome) * 100 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Insights</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Smart money advice for you 💡</Text>
        </View>
        <TouchableOpacity 
          style={[styles.personalityBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={async () => {
            if (Platform.OS !== 'web') {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            router.push('/quiz');
          }}
        >
          <Text style={styles.personalityEmoji}>{personalityEmoji}</Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00D4A1" />
        }
      >
        {/* Personality Card */}
        <Animated.View 
          style={[
            styles.personalityCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <LinearGradient colors={['#00D4A1', '#4CAF50']} style={styles.personalityGradient}>
            <Text style={styles.personalityCardEmoji}>{personalityEmoji}</Text>
            <Text style={styles.personalityCardTitle}>The {personalityName}</Text>
            <Text style={styles.personalityCardSubtitle}>
              {userProfile?.personalityType === 'guardian' && 'Safety first, always prepared'}
              {userProfile?.personalityType === 'strategist' && 'Planning for maximum returns'}
              {userProfile?.personalityType === 'realist' && 'Balanced and practical'}
              {userProfile?.personalityType === 'enjoyer' && 'Living life to the fullest'}
              {userProfile?.personalityType === 'giver' && 'Generous and caring'}
              {userProfile?.personalityType === 'planner' && 'Organized and goal-driven'}
              {userProfile?.personalityType === 'improviser' && 'Flexible and spontaneous'}
              {!userProfile?.personalityType && 'Discover your money personality'}
            </Text>
            {!userProfile?.personalityType && (
              <TouchableOpacity 
                style={styles.takeQuizButton}
                onPress={() => router.push('/quiz')}
              >
                <Text style={styles.takeQuizText}>Take the Quiz</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Spending Overview */}
        <Animated.View 
          style={[
            styles.overviewCard,
            { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 2 },
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 Spending Overview</Text>
          <View style={styles.overviewContent}>
            <View style={[styles.overviewItem, { backgroundColor: colors.background }]}>
              <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>This Month</Text>
              <Text style={[styles.overviewValue, { color: colors.text }]}>৳{totalSpent.toFixed(0)}</Text>
              <Text style={[styles.overviewHint, { color: colors.textSecondary }]}>{monthlyExpenses.length} transactions</Text>
            </View>
            <View style={[styles.overviewItem, { backgroundColor: colors.background }]}>
              <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Spending Rate</Text>
              <Text style={[
                styles.overviewValue,
                { color: spendingRate > 80 ? '#ef4444' : spendingRate > 60 ? '#f59e0b' : '#10b981' }
              ]}>
                {spendingRate.toFixed(0)}%
              </Text>
              <Text style={[styles.overviewHint, { color: colors.textSecondary }]}>of income</Text>
            </View>
          </View>
        </Animated.View>

        {/* Insights List */}
        {insights.length > 0 ? (
          insights.map((insight, index) => (
            <Animated.View
              key={insight.id}
              style={[
                styles.insightCard,
                {
                  opacity: fadeAnim,
                  transform: [{
                    translateX: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [100, 0],
                    }),
                  }],
                }
              ]}
            >
              <LinearGradient
                colors={
                  insight.type === 'critical'
                    ? ['#ef4444', '#dc2626']
                    : insight.type === 'warning'
                    ? ['#f59e0b', '#d97706']
                    : insight.type === 'success'
                    ? ['#10b981', '#059669']
                    : ['#00D4A1', '#4CAF50']
                }
                style={styles.insightGradient}
              >
                <View style={styles.insightHeader}>
                  <Text style={styles.insightEmoji}>{insight.emoji}</Text>
                  <View style={styles.insightBadge}>
                    <Text style={styles.insightBadgeText}>
                      {insight.type === 'critical' ? 'URGENT' : 
                       insight.type === 'warning' ? 'WARNING' : 
                       insight.type === 'success' ? 'GREAT JOB' : 'TIP'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightMessage}>{insight.message}</Text>
              </LinearGradient>
            </Animated.View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No insights yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Start tracking expenses to get personalized insights
            </Text>
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/expenses')}
              style={styles.addExpenseButton}
            >
              <LinearGradient colors={['#00D4A1', '#4CAF50']} style={styles.addExpenseGradient}>
                <Text style={styles.addExpenseText}>Track Your First Expense</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Money Tips */}
        <View style={styles.tipsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>💰 Money Tips for {personalityName}s</Text>
          
          {userProfile?.personalityType === 'guardian' && (
            <>
              <View style={[styles.tipCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 2 }]}>
                <Text style={styles.tipIcon}>🛡️</Text>
                <Text style={[styles.tipText, { color: colors.text }]}>Build an emergency fund covering 6 months of expenses</Text>
              </View>
              <View style={[styles.tipCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 2 }]}>
                <Text style={styles.tipIcon}>📊</Text>
                <Text style={[styles.tipText, { color: colors.text }]}>Consider low-risk investments like bonds or fixed deposits</Text>
              </View>
            </>
          )}

          {userProfile?.personalityType === 'strategist' && (
            <>
              <View style={[styles.tipCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 2 }]}>
                <Text style={styles.tipIcon}>🧠</Text>
                <Text style={[styles.tipText, { color: colors.text }]}>Diversify investments across different asset classes</Text>
              </View>
              <View style={[styles.tipCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 2 }]}>
                <Text style={styles.tipIcon}>📈</Text>
                <Text style={[styles.tipText, { color: colors.text }]}>Track your ROI and rebalance portfolio quarterly</Text>
              </View>
            </>
          )}

          {userProfile?.personalityType === 'realist' && (
            <>
              <View style={[styles.tipCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 2 }]}>
                <Text style={styles.tipIcon}>⚖️</Text>
                <Text style={[styles.tipText, { color: colors.text }]}>Follow the 50/30/20 rule: needs, wants, savings</Text>
              </View>
              <View style={[styles.tipCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 2 }]}>
                <Text style={styles.tipIcon}>💡</Text>
                <Text style={[styles.tipText, { color: colors.text }]}>Review your budget monthly and adjust as needed</Text>
              </View>
            </>
          )}

          {userProfile?.personalityType === 'enjoyer' && (
            <>
              <View style={[styles.tipCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 2 }]}>
                <Text style={styles.tipIcon}>🎉</Text>
                <Text style={[styles.tipText, { color: colors.text }]}>Set aside a "fun money" budget to enjoy guilt-free</Text>
              </View>
              <View style={[styles.tipCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 2 }]}>
                <Text style={styles.tipIcon}>🎯</Text>
                <Text style={[styles.tipText, { color: colors.text }]}>Automate savings so you can spend the rest freely</Text>
              </View>
            </>
          )}

          {(!userProfile?.personalityType || 
            !['guardian', 'strategist', 'realist', 'enjoyer'].includes(userProfile?.personalityType)) && (
            <>
              <View style={[styles.tipCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 2 }]}>
                <Text style={styles.tipIcon}>💡</Text>
                <Text style={[styles.tipText, { color: colors.text }]}>Track every expense to understand your spending patterns</Text>
              </View>
              <View style={[styles.tipCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 2 }]}>
                <Text style={styles.tipIcon}>🎯</Text>
                <Text style={[styles.tipText, { color: colors.text }]}>Set clear financial goals and review them monthly</Text>
              </View>
              <View style={[styles.tipCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 2 }]}>
                <Text style={styles.tipIcon}>��</Text>
                <Text style={[styles.tipText, { color: colors.text }]}>Save at least 20% of your income consistently</Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold' },
  subtitle: { fontSize: 14, marginTop: 4 },
  personalityBadge: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 3 },
  personalityEmoji: { fontSize: 32 },
  personalityCard: { marginHorizontal: 20, marginBottom: 20, borderRadius: 24, overflow: 'hidden' },
  personalityGradient: { padding: 32, alignItems: 'center' },
  personalityCardEmoji: { fontSize: 64, marginBottom: 16 },
  personalityCardTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  personalityCardSubtitle: { fontSize: 14, color: '#fff', opacity: 0.9, textAlign: 'center', marginBottom: 16 },
  takeQuizButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, marginTop: 8 },
  takeQuizText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  overviewCard: { marginHorizontal: 20, marginBottom: 20, borderRadius: 20, padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  overviewContent: { flexDirection: 'row', gap: 16 },
  overviewItem: { flex: 1, padding: 16, borderRadius: 12 },
  overviewLabel: { fontSize: 12, marginBottom: 8 },
  overviewValue: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  overviewHint: { fontSize: 11 },
  insightCard: { marginHorizontal: 20, marginBottom: 16, borderRadius: 20, overflow: 'hidden' },
  insightGradient: { padding: 24 },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  insightEmoji: { fontSize: 40 },
  insightBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  insightBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#fff' },
  insightTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  insightMessage: { fontSize: 15, color: '#fff', opacity: 0.95, lineHeight: 22 },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptySubtext: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  addExpenseButton: { borderRadius: 16, overflow: 'hidden' },
  addExpenseGradient: { paddingVertical: 16, paddingHorizontal: 32 },
  addExpenseText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  tipsSection: { padding: 20, paddingBottom: 40 },
  tipCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12 },
  tipIcon: { fontSize: 32, marginRight: 16 },
  tipText: { flex: 1, fontSize: 14, lineHeight: 20 },
});
