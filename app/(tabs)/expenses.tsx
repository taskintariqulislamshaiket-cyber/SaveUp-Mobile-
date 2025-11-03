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
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../../src/config/firebase-config';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

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
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    loadExpenses();
    loadSound();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
    
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    
    return () => {
      if (sound) sound.unloadAsync();
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const loadSound = async () => {
    try {
      const { sound: drainSound } = await Audio.Sound.createAsync(
        { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' }
      );
      setSound(drainSound);
    } catch (error) {
      console.log('Error loading sound:', error);
    }
  };

  const loadExpenses = async () => {
    if (!user) return;

    try {
      const expensesQuery = query(
        collection(db, 'expenses'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(expensesQuery);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
      }));
      setExpenses(data);
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

      await addDoc(collection(db, 'expenses'), {
        userId: user?.uid,
        amount: parseFloat(amount),
        description,
        category: selectedCategory,
        date: new Date(),
        createdAt: new Date(),
      });

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
      'Delete Expense? 🗑️',
      'This cannot be undone',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              if (Platform.OS !== 'web') {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              await deleteDoc(doc(db, 'expenses', id));
              if (Platform.OS !== 'web') {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              loadExpenses();
            } catch (error) {
              console.error('Error deleting expense:', error);
            }
          }
        },
      ]
    );
  };

  const getCategoryIcon = (category: string) => {
    return CATEGORIES.find(c => c.name === category) || CATEGORIES[6];
  };

  const totalSpent = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  return (
    <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.container}>
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <View>
          <Text style={styles.title}>Expenses</Text>
          <Text style={styles.subtitle}>Track Your Spending 💸</Text>
        </View>
        <TouchableOpacity
          onPress={async () => {
            if (Platform.OS !== 'web') {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            setModalVisible(true);
          }}
          style={styles.addButton}
        >
          <LinearGradient colors={['#8b5cf6', '#ec4899']} style={styles.addGradient}>
            <Ionicons name="add" size={28} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.totalCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient colors={['#8b5cf6', '#ec4899']} style={styles.totalGradient}>
          <Ionicons name="wallet" size={36} color="#fff" style={styles.totalIcon} />
          <Text style={styles.totalLabel}>Total Spent</Text>
          <Text style={styles.totalAmount}>৳{totalSpent.toFixed(0)}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{expenses.length} transactions</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {expenses.map((expense, index) => {
          const category = getCategoryIcon(expense.category);
          return (
            <Animated.View 
              key={expense.id} 
              style={[
                styles.expenseCard, 
                { 
                  opacity: fadeAnim,
                  transform: [{
                    translateX: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  }],
                }
              ]}
            >
              <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                <Ionicons name={category.icon as any} size={26} color={category.color} />
              </View>
              <View style={styles.expenseDetails}>
                <Text style={styles.expenseDescription}>{expense.description}</Text>
                <View style={styles.expenseMeta}>
                  <Text style={styles.expenseCategory}>{expense.category}</Text>
                  <Text style={styles.dot}>•</Text>
                  <Text style={styles.expenseDate}>
                    {expense.date?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
              </View>
              <View style={styles.expenseRight}>
                <Text style={styles.expenseAmount}>৳{(expense.amount || 0).toFixed(0)}</Text>
                <TouchableOpacity
                  onPress={() => handleDeleteExpense(expense.id)}
                  style={styles.deleteBtn}
                >
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </Animated.View>
          );
        })}

        {expenses.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👑</Text>
            <Text style={styles.emptyText}>No expenses yet!</Text>
            <Text style={styles.emptySubtext}>Start tracking to see where your money goes</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={[styles.modalContent, { marginBottom: keyboardHeight }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Expense 💸</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={32} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Amount (৳)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="cash" size={20} color="#8b5cf6" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 500"
                  placeholderTextColor="#64748b"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />
              </View>

              <Text style={styles.inputLabel}>Description</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="create" size={20} color="#8b5cf6" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Lunch at restaurant"
                  placeholderTextColor="#64748b"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoriesGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.name}
                    onPress={async () => {
                      if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCategory(cat.name);
                    }}
                    style={[
                      styles.categoryButton,
                      selectedCategory === cat.name && { backgroundColor: cat.color, borderColor: cat.color },
                    ]}
                  >
                    <Ionicons name={cat.icon as any} size={24} color={selectedCategory === cat.name ? '#fff' : cat.color} />
                    <Text style={[styles.categoryButtonText, selectedCategory === cat.name && { color: '#fff' }]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity onPress={handleAddExpense} activeOpacity={0.8}>
                <LinearGradient colors={['#8b5cf6', '#ec4899']} style={styles.submitButton}>
                  <Text style={styles.submitText}>Add Expense</Text>
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  addButton: { borderRadius: 25, overflow: 'hidden' },
  addGradient: { width: 56, height: 56, justifyContent: 'center', alignItems: 'center' },
  totalCard: { marginHorizontal: 20, marginBottom: 20, borderRadius: 24, overflow: 'hidden' },
  totalGradient: { padding: 32, alignItems: 'center' },
  totalIcon: { marginBottom: 12 },
  totalLabel: { fontSize: 14, color: '#fff', opacity: 0.9, marginBottom: 8, fontWeight: '600' },
  totalAmount: { fontSize: 48, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  badge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  badgeText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  list: { flex: 1, paddingHorizontal: 20 },
  expenseCard: { flexDirection: 'row', backgroundColor: '#1e293b', padding: 16, borderRadius: 16, marginBottom: 12, alignItems: 'center' },
  categoryIcon: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  expenseDetails: { flex: 1 },
  expenseDescription: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 6 },
  expenseMeta: { flexDirection: 'row', alignItems: 'center' },
  expenseCategory: { fontSize: 12, color: '#94a3b8' },
  dot: { fontSize: 12, color: '#64748b', marginHorizontal: 6 },
  expenseDate: { fontSize: 12, color: '#64748b' },
  expenseRight: { alignItems: 'flex-end' },
  expenseAmount: { fontSize: 18, fontWeight: 'bold', color: '#ef4444', marginBottom: 8 },
  deleteBtn: { backgroundColor: '#2d1a1a', padding: 8, borderRadius: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#94a3b8' },
  emptySubtext: { fontSize: 14, color: '#64748b', marginTop: 8 },
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#e2e8f0', marginBottom: 8, marginTop: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 2, borderColor: '#334155' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#fff', fontSize: 16 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  categoryButton: { width: '30%', backgroundColor: '#0f172a', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: '#334155' },
  categoryButtonText: { fontSize: 12, color: '#94a3b8', marginTop: 8, fontWeight: '600' },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 16, gap: 8, marginTop: 24, marginBottom: 16 },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
