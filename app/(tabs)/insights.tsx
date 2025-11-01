import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../src/config/firebase-config';
import { calculateInsights, Insight, ExpenseItem } from '../../src/screens/InsightsHelper';
import * as Haptics from 'expo-haptics';

export default function InsightsScreen() {
  const { user, userProfile } = useAuth();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInsights = async () => {
    if (!user || !userProfile) return;

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

      // Filter current month expenses
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
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, [user, userProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await loadInsights();
  };

  const getInsightColor = (type: string): [string, string] => {
    switch (type) {
      case 'critical':
        return ['#ef4444', '#dc2626'];
      case 'warning':
        return ['#f59e0b', '#d97706'];
      case 'success':
        return ['#10b981', '#059669'];
      default:
        return ['#8b5cf6', '#7c3aed'];
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'success':
        return 'checkmark-circle';
      default:
        return 'information-circle';
    }
  };

  return (
    <LinearGradient colors={['#0f172a' as any, '#1e293b' as any]} style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Insights</Text>
          <Text style={styles.subtitle}>Your personal finance coach 🧠</Text>
        </View>
        <TouchableOpacity
          onPress={onRefresh}
          style={styles.refreshButton}
        >
          <Ionicons name="refresh" size={24} color="#8b5cf6" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />
        }
      >
        {insights.length > 0 ? (
          <View style={styles.insightsList}>
            {insights.map((insight, index) => (
              <View key={insight.id} style={styles.insightCard}>
                <LinearGradient
                  colors={getInsightColor(insight.type) as any}
                  style={styles.insightGradient}
                >
                  <View style={styles.insightHeader}>
                    <View style={styles.insightIconContainer}>
                      <Text style={styles.insightEmoji}>{insight.emoji}</Text>
                    </View>
                    <View style={styles.insightBadge}>
                      <Ionicons 
                        name={getInsightIcon(insight.type) as any} 
                        size={16} 
                        color="#fff" 
                      />
                    </View>
                  </View>

                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightMessage}>{insight.message}</Text>

                  <View style={styles.insightFooter}>
                    <View style={styles.priorityContainer}>
                      <Ionicons name="flash" size={14} color="#fff" />
                      <Text style={styles.priorityText}>
                        {insight.type === 'critical' ? 'High Priority' : 
                         insight.type === 'warning' ? 'Medium Priority' : 
                         insight.type === 'success' ? 'Keep It Up!' : 'FYI'}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <LinearGradient
                colors={['#8b5cf6' as any, '#ec4899' as any]}
                style={styles.emptyIconGradient}
              >
                <Ionicons name="bulb" size={48} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.emptyTitle}>Looking Good! 🎉</Text>
            <Text style={styles.emptyText}>
              No urgent insights right now. Keep tracking your expenses and we'll provide smart feedback!
            </Text>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#8b5cf6" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>How Insights Work</Text>
              <Text style={styles.infoText}>
                We analyze your spending patterns, compare them to your income and goals, 
                and provide personalized advice tailored to your financial personality.
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="trending-up" size={24} color="#10b981" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Real-Time Updates</Text>
              <Text style={styles.infoText}>
                Every time you add an expense, we recalculate your insights to keep you on track!
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  refreshButton: {
    width: 44,
    height: 44,
    backgroundColor: '#1e293b',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  insightsList: {
    padding: 20,
    gap: 16,
  },
  insightCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  insightGradient: {
    padding: 20,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightEmoji: {
    fontSize: 32,
  },
  insightBadge: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  insightMessage: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.95,
    lineHeight: 24,
    marginBottom: 16,
  },
  insightFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 12,
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    opacity: 0.9,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    marginBottom: 24,
    borderRadius: 40,
    overflow: 'hidden',
  },
  emptyIconGradient: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
  },
  infoSection: {
    padding: 20,
    gap: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
});
