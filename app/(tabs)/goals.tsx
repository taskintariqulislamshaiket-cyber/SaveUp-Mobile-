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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../src/config/firebase-config';
import * as Haptics from 'expo-haptics';

const GOAL_ICONS = [
  { name: 'Vacation', icon: 'airplane', color: '#3b82f6' },
  { name: 'Emergency Fund', icon: 'shield-checkmark', color: '#10b981' },
  { name: 'New Gadget', icon: 'phone-portrait', color: '#8b5cf6' },
  { name: 'Home', icon: 'home', color: '#f59e0b' },
  { name: 'Education', icon: 'school', color: '#ec4899' },
  { name: 'Car', icon: 'car-sport', color: '#ef4444' },
  { name: 'Other', icon: 'flag', color: '#64748b' },
];

export default function GoalsScreen() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [savedAmount, setSavedAmount] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Vacation');

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    if (!user) return;

    try {
      const goalsQuery = query(
        collection(db, 'goals'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(goalsQuery);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      }));
      setGoals(data);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async () => {
    if (!goalName || !targetAmount) {
      Alert.alert('Error', 'Please fill in all required fields');
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }

      await addDoc(collection(db, 'goals'), {
        userId: user?.uid,
        name: goalName,
        targetAmount: parseFloat(targetAmount),
        savedAmount: savedAmount ? parseFloat(savedAmount) : 0,
        icon: selectedIcon,
        createdAt: new Date(),
      });

      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setModalVisible(false);
      setGoalName('');
      setTargetAmount('');
      setSavedAmount('');
      setSelectedIcon('Vacation');
      loadGoals();
    } catch (error) {
      console.error('Error adding goal:', error);
      Alert.alert('Error', 'Failed to add goal');
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      await deleteDoc(doc(db, 'goals', id));
      
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      loadGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const handleAddToGoal = async (goalId: string, currentAmount: number, targetAmount: number) => {
    Alert.prompt(
      'Add to Goal',
      'How much would you like to add?',
      async (text) => {
        const amount = parseFloat(text);
        if (isNaN(amount) || amount <= 0) return;

        try {
          if (Platform.OS !== 'web') {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }

          const newAmount = currentAmount + amount;
          await updateDoc(doc(db, 'goals', goalId), {
            savedAmount: newAmount,
          });

          if (newAmount >= targetAmount) {
            if (Platform.OS !== 'web') {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            Alert.alert('🎉 Goal Achieved!', 'Congratulations! You reached your goal!');
          }

          loadGoals();
        } catch (error) {
          console.error('Error updating goal:', error);
        }
      },
      'plain-text',
      '',
      'numeric'
    );
  };

  const getGoalIcon = (iconName: string) => {
    const icon = GOAL_ICONS.find(i => i.name === iconName);
    return icon || GOAL_ICONS[GOAL_ICONS.length - 1];
  };

  const calculateProgress = (saved: number, target: number) => {
    return Math.min((saved / target) * 100, 100);
  };

  return (
    <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Goals</Text>
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

      <ScrollView style={styles.list}>
        {goals.map((goal) => {
          const iconData = getGoalIcon(goal.icon);
          const progress = calculateProgress(goal.savedAmount, goal.targetAmount);
          const isComplete = progress >= 100;

          return (
            <View key={goal.id} style={styles.goalCard}>
              <LinearGradient
                colors={isComplete ? ['#10b981', '#059669'] : ['#1e293b', '#334155']}
                style={styles.goalGradient}
              >
                <View style={styles.goalHeader}>
                  <View style={[styles.goalIcon, { backgroundColor: iconData.color + '20' }]}>
                    <Ionicons name={iconData.icon as any} size={32} color={iconData.color} />
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert('Delete Goal', 'Are you sure?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteGoal(goal.id) },
                      ]);
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.goalName}>{goal.name}</Text>
                
                <View style={styles.amountContainer}>
                  <Text style={styles.savedAmount}>৳{goal.savedAmount.toFixed(0)}</Text>
                  <Text style={styles.targetAmount}> / ৳{goal.targetAmount.toFixed(0)}</Text>
                </View>

                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${progress}%` }]} />
                </View>

                <View style={styles.goalFooter}>
                  <Text style={styles.progressText}>{progress.toFixed(0)}% Complete</Text>
                  {!isComplete && (
                    <TouchableOpacity
                      onPress={() => handleAddToGoal(goal.id, goal.savedAmount, goal.targetAmount)}
                      style={styles.addMoneyButton}
                    >
                      <Text style={styles.addMoneyText}>Add Money</Text>
                      <Ionicons name="add-circle" size={20} color="#8b5cf6" />
                    </TouchableOpacity>
                  )}
                  {isComplete && (
                    <View style={styles.completeBadge}>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.completeText}>Achieved!</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </View>
          );
        })}

        {goals.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={64} color="#64748b" />
            <Text style={styles.emptyText}>No goals yet</Text>
            <Text style={styles.emptySubtext}>Tap + to set your first goal</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Goal Modal */}
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Goal</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Goal Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="flag" size={20} color="#8b5cf6" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Dream Vacation"
                  placeholderTextColor="#64748b"
                  value={goalName}
                  onChangeText={setGoalName}
                />
              </View>

              <Text style={styles.inputLabel}>Target Amount (৳)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="cash" size={20} color="#8b5cf6" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 50000"
                  placeholderTextColor="#64748b"
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  keyboardType="numeric"
                />
              </View>

              <Text style={styles.inputLabel}>Already Saved (৳)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="wallet" size={20} color="#8b5cf6" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 5000 (optional)"
                  placeholderTextColor="#64748b"
                  value={savedAmount}
                  onChangeText={setSavedAmount}
                  keyboardType="numeric"
                />
              </View>

              <Text style={styles.inputLabel}>Icon</Text>
              <View style={styles.iconsGrid}>
                {GOAL_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon.name}
                    onPress={async () => {
                      if (Platform.OS !== 'web') {
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setSelectedIcon(icon.name);
                    }}
                    style={[
                      styles.iconButton,
                      selectedIcon === icon.name && { backgroundColor: icon.color },
                    ]}
                  >
                    <Ionicons
                      name={icon.icon as any}
                      size={28}
                      color={selectedIcon === icon.name ? '#fff' : icon.color}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity onPress={handleAddGoal} activeOpacity={0.8}>
                <LinearGradient colors={['#8b5cf6', '#ec4899']} style={styles.submitButton}>
                  <Text style={styles.submitText}>Create Goal</Text>
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
  addButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  addGradient: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  goalCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  goalGradient: {
    padding: 20,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  savedAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  targetAmount: {
    fontSize: 18,
    color: '#94a3b8',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: '#e2e8f0',
    fontWeight: '600',
  },
  addMoneyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  addMoneyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a78bfa',
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
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
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  iconButton: {
    width: 60,
    height: 60,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
  },
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
