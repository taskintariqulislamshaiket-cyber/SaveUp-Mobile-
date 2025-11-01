import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    loadExpenses();
    loadSound();
    
    // Keyboard listeners for mobile
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
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

  const playDrainSound = async () => {
    try {
      if (sound) {
        await sound.replayAsync();
      }
    } catch (error) {
      console.log('Error playing sound:', error);
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
      Alert.alert('Error', 'Please fill in all fields');
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      
      // Play drain sound
      await playDrainSound();

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
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const handleDeleteExpense = async (id: string) => {
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
  };

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find(c => c.name === category);
    return cat || CATEGORIES[CATEGORIES.length - 1];
  };

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
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
            <Ionicons name="add" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Total Card with Gradient */}
      <View style={styles.totalCard}>
        <LinearGradient colors={['#8b5cf6', '#ec4899']} style={styles.totalGradient}>
          <Ionicons name="wallet" size={32} color="#fff" style={styles.totalIcon} />
          <Text style={styles.totalLabel}>Total Spent</Text>
          <Text style={styles.totalAmount}>৳{totalSpent.toFixed(0)}</Text>
          <Text style={styles.totalSubtext}>{expenses.length} transactions</Text>
        </LinearGradient>
      </View>

      <ScrollView style={styles.list}>
        {expenses.map((expense) => {
          const category = getCategoryIcon(expense.category);
          return (
            <View key={expense.id} style={styles.expenseCard}>
              <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                <Ionicons name={category.icon as any} size={24} color={category.color} />
              </View>
              <View style={styles.expenseDetails}>
                <Text style={styles.expenseDescription}>{expense.description}</Text>
                <Text style={styles.expenseCategory}>{expense.category}</Text>
                <Text style={styles.expenseDate}>
                  {expense.date?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
              <View style={styles.expenseRight}>
                <Text style={styles.expenseAmount}>৳{expense.amount.toFixed(0)}</Text>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert('Delete Expense', 'Are you sure?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => handleDeleteExpense(expense.id) },
                    ]);
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {expenses.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#64748b" />
            <Text style={styles.emptyText}>No expenses yet</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first expense</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Expense Modal with Keyboard Fix */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setModalVisible(false)}
          />
          <View style={[styles.modalContent, { marginBottom: keyboardHeight }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Expense</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#fff" />
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
                  returnKeyType="next"
                />
              </View>

              <Text style={styles.inputLabel}>Description</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="create" size={20} color="#8b5cf6" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Lunch"
                  placeholderTextColor="#64748b"
                  value={description}
                  onChangeText={setDescription}
                  returnKeyType="done"
                />
              </View>

              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoriesGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.name}
                    onPress={async () => {
                      if (Platform.OS !== 'web') {
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setSelectedCategory(cat.name);
                    }}
                    style={[
                      styles.categoryButton,
                      selectedCategory === cat.name && styles.categoryButtonSelected,
                    ]}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={24}
                      color={selectedCategory === cat.name ? '#fff' : cat.color}
                    />
                    <Text
                      style={[
                        styles.categoryButtonText,
                        selectedCategory === cat.name && styles.categoryButtonTextSelected,
                      ]}
                    >
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  addButton: { borderRadius: 20, overflow: 'hidden' },
  addGradient: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
  },
  totalGradient: {
    padding: 32,
    alignItems: 'center',
  },
  totalIcon: { marginBottom: 12 },
  totalLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  totalSubtext: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  list: { flex: 1, paddingHorizontal: 20 },
  expenseCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseDetails: { flex: 1 },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
  },
  expenseDate: { fontSize: 11, color: '#64748b' },
  expenseRight: { alignItems: 'flex-end', gap: 8 },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
    marginTop: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#334155',
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  categoryButton: {
    width: '30%',
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
  },
  categoryButtonSelected: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    fontWeight: '600',
  },
  categoryButtonTextSelected: { color: '#fff' },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    gap: 8,
    marginTop: 24,
    marginBottom: 16,
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
