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
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../../src/config/firebase-config';
import * as Haptics from 'expo-haptics';
import { usePet } from '../../src/contexts/PetContext';
import { calculateXPEarned } from '../../src/utils/pet/gemCalculator';
import GemCounter from '../../src/components/pet/GemCounter';
import GemRewardToast from '../../src/components/pet/GemRewardToast';

const CATEGORIES = [
  { name: 'Groceries', icon: 'basket-outline', color: '#10b981' },
  { name: 'Restaurant', icon: 'restaurant-outline', color: '#f59e0b' },
  { name: 'Transport', icon: 'car-outline', color: '#3b82f6' },
  { name: 'Fuel', icon: 'speedometer-outline', color: '#0891b2' },
  { name: 'Shopping', icon: 'cart-outline', color: '#ec4899' },
  { name: 'Entertainment', icon: 'game-controller-outline', color: '#8b5cf6' },
  { name: 'Utilities', icon: 'flash-outline', color: '#f97316' },
  { name: 'Mobile/Internet', icon: 'phone-portrait-outline', color: '#06b6d4' },
  { name: 'Rent', icon: 'home-outline', color: '#ef4444' },
  { name: 'Education', icon: 'school-outline', color: '#6366f1' },
  { name: 'Medical', icon: 'medical-outline', color: '#14b8a6' },
  { name: 'Family', icon: 'people-outline', color: '#f43f5e' },
  { name: 'Clothing', icon: 'shirt-outline', color: '#a855f7' },
  { name: 'Personal Care', icon: 'cut-outline', color: '#84cc16' },
  { name: 'Gifts', icon: 'gift-outline', color: '#fb923c' },
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
  const [showGemReward, setShowGemReward] = useState(false);
  const [gemsEarned, setGemsEarned] = useState(0);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  
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
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadExpenses = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'expenses'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);
      const expensesData = snapshot.docs.map(doc => ({
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
      if (Platform.OS === 'web') {
        alert('Please fill in amount and description');
      } else {
        Alert.alert('Missing Info', 'Please fill in amount and description');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const expenseAmount = parseFloat(amount);

      if (editingExpense) {
        // UPDATE existing expense
        console.log("Updating expense:", editingExpense.id);
        await updateDoc(doc(db, 'expenses', editingExpense.id), {
          amount: expenseAmount,
          description,
          category: selectedCategory,
          updatedAt: new Date(),
        });
      } else {
        // CREATE new expense
        console.log("Creating new expense");
        await addDoc(collection(db, 'expenses'), {
          userId: user?.uid,
          amount: expenseAmount,
          description,
          category: selectedCategory,
          date: new Date(),
          createdAt: new Date(),
        });

        // Pet rewards ONLY for new expenses (not edits)
        try {
          const gemReward = await earnGems('TRACK_EXPENSE');
          await addXP(calculateXPEarned(expenseAmount));
          
          // Show gem reward toast
          setGemsEarned(gemReward || 5);
          setShowGemReward(true);
        } catch (e) {
          console.error('Pet reward error:', e);
        }
      }

      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Clear form and close modal
      setModalVisible(false);
      setAmount('');
      setDescription('');
      setSelectedCategory('Groceries');
      setEditingExpense(null);
      loadExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
      if (Platform.OS === 'web') {
        alert('Failed to save expense');
      } else {
        Alert.alert('Error', 'Failed to save expense');
      }
    }
  };

  const handleDeleteExpense = async (id: string) => {
    console.log("Delete clicked for ID:", id);
    
    // Web uses window.confirm, mobile uses Alert
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete this expense?');
      if (!confirmed) return;
      
      try {
        await deleteDoc(doc(db, 'expenses', id));
        console.log("Expense deleted successfully:", id);
        loadExpenses();
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Failed to delete expense. Please try again.');
      }
    } else {
      // Mobile
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
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                console.log("Expense deleted successfully:", id);
                loadExpenses();
              } catch (error) {
                console.error('Error deleting expense:', error);
                Alert.alert('Error', 'Failed to delete expense');
              }
            },
          },
        ]
      );
    }
  };

  const handleEditExpense = (expense: any) => {
    console.log("Editing expense:", expense);
    setEditingExpense(expense);
    setAmount(expense.amount.toString());
    setDescription(expense.description);
    setSelectedCategory(expense.category);
    setModalVisible(true);
  };
  const getTotalExpenses = () => {
    return expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  };

  const getThisMonthTotal = () => {
    const now = new Date();
    const thisMonth = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === now.getMonth() && 
             expDate.getFullYear() === now.getFullYear();
    });
    return thisMonth.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Gem Reward Toast */}
      <GemRewardToast
        visible={showGemReward}
        amount={gemsEarned}
        message="Great job tracking!"
        onHide={() => setShowGemReward(false)}
      />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Expenses</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Track every taka
          </Text>
        </View>
        <GemCounter size="small" />
      </Animated.View>

      {/* Stats Cards */}
      <Animated.View style={[styles.statsContainer, { opacity: fadeAnim }]}>
        <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.statCard}>
          <Text style={styles.statLabel}>This Month</Text>
          <Text style={styles.statValue}>৳{getThisMonthTotal().toLocaleString('en-BD')}</Text>
        </LinearGradient>
        <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.statCard}>
          <Text style={styles.statLabel}>All Time</Text>
          <Text style={styles.statValue}>৳{getTotalExpenses().toLocaleString('en-BD')}</Text>
        </LinearGradient>
      </Animated.View>

      {/* Expense List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {expenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💸</Text>
            <Text style={[styles.emptyText, { color: colors.text }]}>No expenses yet</Text>
            <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
              Start tracking your spending!
            </Text>
          </View>
        ) : (
          expenses.map(expense => (
            <TouchableOpacity key={expense.id} onPress={() => handleEditExpense(expense)} style={[styles.expenseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.expenseLeft}>
                <View style={[styles.categoryIcon, { backgroundColor: CATEGORIES.find(c => c.name === expense.category)?.color || '#64748b' }]}>
                  <Icon
                    name={CATEGORIES.find(c => c.name === expense.category)?.icon || 'ellipsis-horizontal'}
                    size={20}
                    color="#fff"
                  />
                </View>
                <View style={styles.expenseInfo}>
                  <Text style={[styles.expenseCategory, { color: colors.text }]}>{expense.category}</Text>
                  <Text style={[styles.expenseDescription, { color: colors.textSecondary }]}>
                    {expense.description}
                  </Text>
                  <Text style={[styles.expenseDate, { color: colors.textSecondary }]}>
                    {new Date(expense.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
              <View style={styles.expenseRight}>
                <Text style={styles.expenseAmount}>৳{expense.amount.toLocaleString('en-BD')}</Text>
                <TouchableOpacity
                  onPress={() => handleDeleteExpense(expense.id)}
                  style={styles.deleteButton}
                >
                  <Icon name="trash" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setEditingExpense(null);
          setAmount("");
          setDescription("");
          setSelectedCategory("Groceries");
          setModalVisible(true);
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }}
      >
        <LinearGradient colors={['#00D4A1', '#4CAF50']} style={styles.fabGradient}>
          <Icon name="add" size={32} color="#fff" />
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
          style={[styles.modalContainer, { backgroundColor: colors.background === "#ffffff" || colors.background === "#f8f9fa" ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.8)" }]}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{editingExpense ? "Edit Expense" : "Add Expense"}</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); setEditingExpense(null); setAmount(""); setDescription(""); setSelectedCategory("Groceries"); }}>
                <Icon name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '70vh' }}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="Amount (৳)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="Description"
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
            />

            <Text style={[styles.categoryLabel, { color: colors.text }]}>Category</Text>
            <View style={styles.categoriesGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.name}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: selectedCategory === cat.name ? cat.color : colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => {
                    setSelectedCategory(cat.name);
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                >
                  <Icon
                    name={cat.icon}
                    size={20}
                    color={selectedCategory === cat.name ? '#fff' : colors.text}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: selectedCategory === cat.name ? '#fff' : colors.text },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddExpense}
            >
              <LinearGradient colors={['#00D4A1', '#4CAF50']} style={styles.addButtonGradient}>
                <Text style={styles.addButtonText}>{editingExpense ? "Update Expense" : "Add Expense"}</Text>
              </LinearGradient>
            </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 60 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  headerSubtitle: { fontSize: 14 },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  statCard: { flex: 1, padding: 20, borderRadius: 16, alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#fff', opacity: 0.9, marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  expenseCard: { flexDirection: 'row', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 2 },
  expenseLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  categoryIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  expenseInfo: { flex: 1 },
  expenseCategory: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  expenseDescription: { fontSize: 13, marginBottom: 4 },
  expenseDate: { fontSize: 11 },
  expenseRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  expenseAmount: { fontSize: 18, fontWeight: 'bold', color: '#ef4444', marginBottom: 8 },
  deleteButton: { padding: 8 },
  fab: { position: 'absolute', bottom: 30, right: 30, borderRadius: 30, shadowColor: '#00D4A1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  fabGradient: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  modalContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', zIndex: 9999 },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, zIndex: 999 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: 'bold' },
  input: { borderWidth: 2, borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16 },
  categoryLabel: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 2 },
  categoryChipText: { fontSize: 14, fontWeight: '600' },
  addButton: { borderRadius: 16, overflow: 'hidden' },
  addButtonGradient: { padding: 18, alignItems: 'center' },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyHint: { fontSize: 14 },
});
