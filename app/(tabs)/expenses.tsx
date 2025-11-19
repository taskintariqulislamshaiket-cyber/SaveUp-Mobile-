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
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../../src/components/Icon';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../../src/config/firebase-config';
import * as Haptics from 'expo-haptics';
import { usePet } from '../../src/contexts/PetContext';
import { calculateXPEarned } from '../../src/utils/pet/gemCalculator';
import GemCounter from '../../src/components/pet/GemCounter';

const CATEGORIES = [
  { name: 'Food', icon: 'fast-food', color: '#f59e0b' },
  { name: 'Transport', icon: 'car', color: '#3b82f6' },
  { name: 'Shopping', icon: 'cart', color: '#ec4899' },
  { name: 'Entertainment', icon: 'game-controller', color: '#8b5cf6' },
  { name: 'Bills', icon: 'receipt', color: '#ef4444' },
  { name: 'Health', icon: 'fitness', color: '#10b981' },
  { name: 'Other', icon: 'ellipsis-horizontal', color: '#64748b' },
];

export default function ExpensesScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { earnGems, addXP } = usePet();
  
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Food');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadExpenses();

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
  }, [user]);

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
      Alert.alert('Missing Info', 'Please fill in amount and description');
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const expenseAmount = parseFloat(amount);

      await addDoc(collection(db, 'expenses'), {
        userId: user?.uid,
        amount: expenseAmount,
        description,
        category: selectedCategory,
        date: new Date(),
        createdAt: new Date(),
      });

      // Pet rewards (silent)
      try {
        await earnGems('TRACK_EXPENSE');
        await addXP(calculateXPEarned(expenseAmount));
      } catch (e) { /* silent */ }

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
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
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
          },
        },
      ]
    );
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

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading expenses...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
            <Text style={[styles.headerTitle, { color: colors.text }]}>Expenses 💸</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Track every taka</Text>
          </View>
          <GemCounter size="small" />
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Today</Text>
            <Text style={[styles.summaryAmount, { color: colors.text }]}>
              ৳{getTodayExpenses().toLocaleString()}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total</Text>
            <Text style={[styles.summaryAmount, { color: colors.text }]}>
              ৳{getTotalExpenses().toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Expense List */}
        <ScrollView style={styles.expensesList} showsVerticalScrollIndicator={false}>
          {expenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>No expenses yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Start tracking your spending!
              </Text>
            </View>
          ) : (
            expenses.map((expense) => {
              const category = CATEGORIES.find(c => c.name === expense.category) || CATEGORIES[6];
              return (
                <View key={expense.id} style={[styles.expenseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={[styles.expenseIcon, { backgroundColor: category.color + '20' }]}>
                    <Icon name={category.icon} size={24} color={category.color} />
                  </View>
                  <View style={styles.expenseInfo}>
                    <Text style={[styles.expenseDescription, { color: colors.text }]}>
                      {expense.description}
                    </Text>
                    <Text style={styles.expenseCategory} numberOfLines={1}>
                      {expense.category}
                    </Text>
                    <Text style={[styles.expenseDate, { color: colors.textSecondary }]}>
                      {new Date(expense.date).toLocaleDateString('en-BD')}
                    </Text>
                  </View>
                  <View style={styles.expenseRight}>
                    <Text style={[styles.expenseAmount, { color: colors.text }]}>
                      ৳{expense.amount.toLocaleString()}
                    </Text>
                    <TouchableOpacity onPress={() => handleDeleteExpense(expense.id)}>
                      <Icon name="trash" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
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
            <View style={styles.modalBackdrop} />
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Add Expense</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Icon name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Amount (৳)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Description</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder="e.g., Lunch at restaurant"
                  placeholderTextColor={colors.textSecondary}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.name}
                      style={[
                        styles.categoryChip,
                        selectedCategory === cat.name && { backgroundColor: cat.color },
                        { borderColor: cat.color }
                      ]}
                      onPress={() => setSelectedCategory(cat.name)}
                    >
                      <Icon name={cat.icon} size={20} color={selectedCategory === cat.name ? '#fff' : cat.color} />
                      <Text style={[styles.categoryLabel, { color: selectedCategory === cat.name ? '#fff' : cat.color }]}>
                        {cat.name}
                      </Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16 },
  content: { flex: 1, padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerTitle: { fontSize: 32, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 14, marginTop: 4 },
  summaryContainer: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  summaryCard: { flex: 1, borderRadius: 16, padding: 16, borderWidth: 1 },
  summaryLabel: { fontSize: 12, marginBottom: 8 },
  summaryAmount: { fontSize: 24, fontWeight: 'bold' },
  expensesList: { flex: 1, marginBottom: 80 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptySubtext: { fontSize: 14 },
  expenseCard: { flexDirection: 'row', borderRadius: 16, padding: 16, marginBottom: 12, alignItems: 'center', borderWidth: 1 },
  expenseIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  expenseInfo: { flex: 1 },
  expenseDescription: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  expenseCategory: { fontSize: 12, color: '#00D4A1', marginBottom: 2 },
  expenseDate: { fontSize: 11 },
  expenseRight: { alignItems: 'flex-end', gap: 8 },
  expenseAmount: { fontSize: 18, fontWeight: 'bold' },
  addButton: { position: 'absolute', bottom: 20, right: 20, borderRadius: 999, overflow: 'hidden', shadowColor: '#00D4A1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  addButtonGradient: { width: 64, height: 64, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.7)' },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: 'bold' },
  inputContainer: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 2 },
  categories: { flexDirection: 'row' },
  categoryChip: { borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16, marginRight: 8, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 2 },
  categoryLabel: { fontSize: 14, fontWeight: '600' },
  saveButton: { marginTop: 8, borderRadius: 12, overflow: 'hidden' },
  saveButtonGradient: { padding: 16, alignItems: 'center' },
  saveButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
});
