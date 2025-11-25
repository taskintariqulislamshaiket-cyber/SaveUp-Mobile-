import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { usePet } from '../../src/contexts/PetContext';
import Icon from '../../src/components/Icon';
import { db } from '../../src/config/firebase-config';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface Expense {
  id: string;
  amount: number;
  category: string;
  description?: string;
  date: string;
  createdAt: any;
}

export default function HomeScreen() {
  const { user, userProfile } = useAuth();
  const { colors } = useTheme();
  const { petState, awardGems } = usePet();
  const router = useRouter();
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [todayTotal, setTodayTotal] = useState(0);
  const [weekTotal, setWeekTotal] = useState(0);

  useEffect(() => {
    if (user) {
      loadExpenses();
    }
  }, [user]);

  const loadExpenses = async () => {
    if (!user) return;
    
    try {
      const snapshot = await db
        .collection('expenses')
        .where('userId', '==', user.uid)
        .orderBy('date', 'desc')
        .limit(5)
        .get();
      
      const expenseData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Expense));
      
      setExpenses(expenseData);
      calculateTotals(expenseData);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const calculateTotals = (expenseData: Expense[]) => {
    const today = new Date().toISOString().split('T')[0];
    const todayExpenses = expenseData.filter(e => e.date === today);
    const todaySum = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekExpenses = expenseData.filter(e => new Date(e.date) >= weekAgo);
    const weekSum = weekExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    setTodayTotal(todaySum);
    setWeekTotal(weekSum);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  };

  const navigateToPet = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/(tabs)/pet');
  };

  const getPetEmoji = () => {
    if (!petState?.selectedPetType) return '🥚';
    
    const petEmojis: Record<string, string> = {
      cat: '🐱',
      dog: '🐶',
      fox: '🦊',
      bear: '🐻',
      owl: '🦉',
      rabbit: '🐰',
      panda: '🐼',
      raccoon: '🦝',
      dragon: '🐉',
      unicorn: '🦄',
    };
    
    return petEmojis[petState.selectedPetType] || '🥚';
  };

  const getMoodEmoji = () => {
    if (!petState) return '😊';
    
    const { happiness } = petState;
    if (happiness >= 80) return '😊';
    if (happiness >= 60) return '🙂';
    if (happiness >= 40) return '��';
    if (happiness >= 20) return '😟';
    return '😢';
  };

  return (
    <LinearGradient colors={[colors.background, colors.surface]} style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Pet */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>
              Hello, {userProfile?.displayName?.split(' ')[0] || 'Friend'}! 👋
            </Text>
            <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>

          {/* Mini Pet Display */}
          <TouchableOpacity onPress={navigateToPet} style={[styles.petMini, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.petAvatarContainer}>
              <Text style={styles.petEmoji}>{getPetEmoji()}</Text>
              <Text style={styles.petMood}>{getMoodEmoji()}</Text>
            </View>
            <View style={[styles.gemBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.gemBadgeText}>💎 {petState?.gems || 0}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <LinearGradient
          colors={['#00D4A1', '#00A87E']}
          style={styles.balanceCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.balanceLabel}>Money Left This Month</Text>
          <Text style={styles.balanceAmount}>
            ৳{(userProfile?.remainingBalanceCurrentMonth || 0).toLocaleString()}
          </Text>
          <Text style={styles.balanceHint}>
            Next salary: {userProfile?.salaryDay || 30}th of every month
          </Text>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
            <Icon name="today" size={24} color="#ef4444" />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Today</Text>
            <Text style={[styles.statAmount, { color: colors.text }]}>৳{todayTotal.toLocaleString()}</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
            <Icon name="calendar" size={24} color="#f59e0b" />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>This Week</Text>
            <Text style={[styles.statAmount, { color: colors.text }]}>৳{weekTotal.toLocaleString()}</Text>
          </View>
        </View>

        {/* Recent Expenses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Expenses</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/expenses')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>

          {expenses.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.cardBackground }]}>
              <Text style={styles.emptyEmoji}>💸</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>No expenses yet</Text>
              <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                Add your first expense to start tracking!
              </Text>
            </View>
          ) : (
            expenses.map(expense => (
              <View key={expense.id} style={[styles.expenseItem, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.expenseLeft}>
                  <Text style={[styles.expenseCategory, { color: colors.text }]}>{expense.category}</Text>
                  {expense.description && (
                    <Text style={[styles.expenseDesc, { color: colors.textSecondary }]}>{expense.description}</Text>
                  )}
                  <Text style={[styles.expenseDate, { color: colors.textSecondary }]}>
                    {new Date(expense.date).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.expenseAmount}>৳{expense.amount.toLocaleString()}</Text>
              </View>
            ))
          )}
        </View>

        {/* Pet Status Card */}
        {petState && (
          <TouchableOpacity onPress={navigateToPet} style={[styles.petCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.petCardHeader}>
              <Text style={styles.petCardEmoji}>{getPetEmoji()}</Text>
              <View style={styles.petCardInfo}>
                <Text style={[styles.petCardName, { color: colors.text }]}>
                  {petState.selectedPetType ? `Your ${petState.selectedPetType}` : 'Choose Your Pet'}
                </Text>
                <Text style={[styles.petCardLevel, { color: colors.textSecondary }]}>Level {petState.level}</Text>
              </View>
              <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
            
            <View style={styles.petStats}>
              <View style={styles.petStat}>
                <Text style={[styles.petStatLabel, { color: colors.textSecondary }]}>Happiness</Text>
                <View style={[styles.petStatBar, { backgroundColor: colors.border }]}>
                  <View style={[styles.petStatFill, { width: `${petState.happiness}%`, backgroundColor: '#f59e0b' }]} />
                </View>
              </View>
              <View style={styles.petStat}>
                <Text style={[styles.petStatLabel, { color: colors.textSecondary }]}>Energy</Text>
                <View style={[styles.petStatBar, { backgroundColor: colors.border }]}>
                  <View style={[styles.petStatFill, { width: `${petState.energy}%`, backgroundColor: '#00D4A1' }]} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  greeting: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  subGreeting: { fontSize: 14 },
  petMini: { borderRadius: 16, padding: 12, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  petAvatarContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  petEmoji: { fontSize: 32 },
  petMood: { fontSize: 16, position: 'absolute', bottom: -4, right: -4 },
  gemBadge: { marginTop: 6, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  gemBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  balanceCard: { margin: 20, marginTop: 10, padding: 24, borderRadius: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8 },
  balanceLabel: { color: '#fff', fontSize: 14, opacity: 0.9, marginBottom: 8 },
  balanceAmount: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginBottom: 8 },
  balanceHint: { color: '#fff', fontSize: 12, opacity: 0.8 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12 },
  statCard: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  statLabel: { fontSize: 12, marginTop: 8, marginBottom: 4 },
  statAmount: { fontSize: 18, fontWeight: 'bold' },
  section: { padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  seeAll: { fontSize: 14, fontWeight: '600' },
  expenseItem: { padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2 },
  expenseLeft: { flex: 1 },
  expenseCategory: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  expenseDesc: { fontSize: 13, marginBottom: 4 },
  expenseDate: { fontSize: 12 },
  expenseAmount: { fontSize: 18, fontWeight: 'bold', color: '#ef4444' },
  emptyState: { padding: 40, borderRadius: 16, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  emptyHint: { fontSize: 13, textAlign: 'center' },
  petCard: { margin: 20, padding: 20, borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  petCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  petCardEmoji: { fontSize: 48, marginRight: 16 },
  petCardInfo: { flex: 1 },
  petCardName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  petCardLevel: { fontSize: 14 },
  petStats: { gap: 12 },
  petStat: { gap: 6 },
  petStatLabel: { fontSize: 12 },
  petStatBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  petStatFill: { height: '100%', borderRadius: 4 },
});
