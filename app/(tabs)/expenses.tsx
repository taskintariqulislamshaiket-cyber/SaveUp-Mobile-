import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../../src/components/Icon';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../../src/config/firebase-config';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { usePet } from '../../src/contexts/PetContext';
import { calculateXPEarned } from '../../src/utils/pet/gemCalculator';
import GemCounter from '../../src/components/pet/GemCounter';

const CATEGORIES = [
  { id: 'Food', label: 'Food', emoji: '🍔', color: '#ef4444' },
  { id: 'Transport', label: 'Transport', emoji: '🚗', color: '#f59e0b' },
  { id: 'Shopping', label: 'Shopping', emoji: '🛍️', color: '#ec4899' },
  { id: 'Bills', label: 'Bills', emoji: '💡', color: '#8b5cf6' },
  { id: 'Entertainment', label: 'Fun', emoji: '🎮', color: '#06b6d4' },
  { id: 'Health', label: 'Health', emoji: '💊', color: '#10b981' },
  { id: 'Other', label: 'Other', emoji: '📦', color: '#64748b' },
];

export default function ExpensesTab() {
  const { user, userProfile } = useAuth();
  const { colors } = useTheme();
  const { earnGems, addXP, updateMoodFromSpending } = usePet();
  const router = useRouter();

  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadExpenses();
    loadSound();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [user]);

  const loadSound = async () => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('../../assets/coin.mp3')
      );
      setSound(newSound);
    } catch (error) {
      console.log('Sound loading failed (non-critical):', error);
    }
  };

  const loadExpenses = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'expenses'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const expensesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.() || new Date(),
      }));

      setExpenses(expensesData);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!amount || !description) {
      Alert.alert('Oops! 😅', 'Please fill in all fields');
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      
      if (sound) await sound.replayAsync();

      const expenseAmount = parseFloat(amount);

      await addDoc(collection(db, 'expenses'), {
        userId: user?.uid,
        amount: expenseAmount,
        description,
        category: selectedCategory,
        date: new Date(),
        createdAt: new Date(),
      });

      // 🎮 PET REWARDS: Earn gems and XP for tracking expense
      try {
        await earnGems('TRACK_EXPENSE');
        const xpEarned = calculateXPEarned(expenseAmount);
        await addXP(xpEarned);

        // Show gem earned notification
        Alert.alert(
          '💎 +5 Gems Earned!',
          `You also earned ${xpEarned} XP for tracking this expense!`,
          [{ text: 'Nice!' }]
        );
      } catch (petError) {
        console.log('Pet reward error (non-critical):', petError);
      }

      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setModalVisible(false);
      setAmount('');
      setDescription('');
      setSelectedCategory('Food');
      loadExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Failed to add expense');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'expenses', id));
      loadExpenses();
      
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      Alert.alert('Error', 'Failed to delete expense');
    }
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getTodayExpenses = () => {
    const today = new Date().toDateString();
    return expenses
      .filter(e => new Date(e.date).toDateString() === today)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const getCategoryColor = (category: string) => {
    return CATEGORIES.find(c => c.id === category)?.color || '#64748b';
  };

  const getCategoryEmoji = (category: string) => {
    return CATEGORIES.find(c => c.id === category)?.emoji || '📦';
  };

  if (loading) {
    return (
      <LinearGradient colors={[colors.background, colors.cardBackground]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading expenses...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.background, colors.cardBackground]} style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Expenses 💸</Text>
            <Text style={styles.headerSubtitle}>Track every taka</Text>
          </View>
          <GemCounter size="small" />
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Today</Text>
            <Text style={styles.summaryAmount}>৳{getTodayExpenses().toLocaleString()}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryAmount}>৳{getTotalExpenses().toLocaleString()}</Text>
          </View>
        </View>

        {/* Expense List */}
        <ScrollView style={styles.expensesList} showsVerticalScrollIndicator={false}>
          {expenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySubtext}>Start tracking your spending!</Text>
            </View>
          ) : (
            expenses.map((expense) => (
              <View key={expense.id} style={styles.expenseCard}>
                <View style={styles.expenseIcon}>
                  <Text style={styles.expenseEmoji}>{getCategoryEmoji(expense.category)}</Text>
                </View>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseDescription}>{expense.description}</Text>
                  <Text style={styles.expenseCategory}>{expense.category}</Text>
                  <Text style={styles.expenseDate}>
                    {new Date(expense.date).toLocaleDateString('en-BD')}
                  </Text>
                </View>
                <View style={styles.expenseRight}>
                  <Text style={styles.expenseAmount}>৳{expense.amount.toLocaleString()}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        'Delete Expense',
                        'Are you sure?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: () => handleDeleteExpense(expense.id) },
                        ]
                      );
                    }}
                  >
                    <Icon name="trash" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Add Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <LinearGradient colors={['#00D4A1', '#4CAF50']} style={styles.addButtonGradient}>
            <Icon name="add" size={28} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Add Expense Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => {
                Keyboard.dismiss();
                setModalVisible(false);
              }}
            />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Expense</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Icon name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Amount (৳)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor="#64748b"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Lunch at restaurant"
                  placeholderTextColor="#64748b"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryChip,
                        selectedCategory === cat.id && { backgroundColor: cat.color },
                      ]}
                      onPress={() => setSelectedCategory(cat.id)}
                    >
                      <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                      <Text style={styles.categoryLabel}>{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleAddExpense} activeOpacity={0.8}>
                <LinearGradient colors={['#00D4A1', '#4CAF50']} style={styles.saveButtonGradient}>
                  <Text style={styles.saveButtonText}>Add Expense</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94a3b8', fontSize: 16 },
  content: { flex: 1, padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  summaryContainer: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  summaryCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 16, padding: 16 },
  summaryLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 8 },
  summaryAmount: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  expensesList: { flex: 1, marginBottom: 80 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#94a3b8' },
  expenseCard: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12, alignItems: 'center' },
  expenseIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  expenseEmoji: { fontSize: 24 },
  expenseInfo: { flex: 1 },
  expenseDescription: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  expenseCategory: { fontSize: 12, color: '#00D4A1', marginBottom: 2 },
  expenseDate: { fontSize: 11, color: '#64748b' },
  expenseRight: { alignItems: 'flex-end', gap: 8 },
  expenseAmount: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  addButton: { position: 'absolute', bottom: 20, right: 20, borderRadius: 999, overflow: 'hidden', shadowColor: '#00D4A1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  addButtonGradient: { width: 64, height: 64, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)' },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  inputContainer: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 8 },
  input: { backgroundColor: '#0f172a', borderRadius: 12, padding: 16, fontSize: 16, color: '#fff', borderWidth: 2, borderColor: '#334155' },
  categories: { flexDirection: 'row', gap: 8 },
  categoryChip: { backgroundColor: '#334155', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16, marginRight: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoryEmoji: { fontSize: 20 },
  categoryLabel: { fontSize: 14, color: '#fff', fontWeight: '600' },
  saveButton: { marginTop: 8, borderRadius: 12, overflow: 'hidden' },
  saveButtonGradient: { padding: 16, alignItems: 'center' },
  saveButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
});
