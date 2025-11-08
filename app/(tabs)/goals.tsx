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
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../src/config/firebase-config';
import * as Haptics from 'expo-haptics';

export default function GoalsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    loadGoals();
    
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
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const loadGoals = async () => {
    if (!user) return;

    try {
      const goalsQuery = query(
        collection(db, 'goals'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(goalsQuery);
      const data = snapshot.docs.map(doc => {
        const goalData = doc.data();
        return {
          id: doc.id,
          name: goalData.name || 'Unnamed Goal',
          targetAmount: goalData.targetAmount || 0,
          saved: goalData.saved || 0,
          deadline: goalData.deadline?.toDate(),
        };
      });
      setGoals(data);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async () => {
    if (!goalName || !targetAmount || !deadline) {
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

      await addDoc(collection(db, 'goals'), {
        userId: user?.uid,
        name: goalName,
        targetAmount: parseFloat(targetAmount),
        saved: 0,
        deadline: new Date(deadline),
        createdAt: new Date(),
      });

      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setModalVisible(false);
      setGoalName('');
      setTargetAmount('');
      setDeadline('');
      loadGoals();
    } catch (error) {
      console.error('Error adding goal:', error);
      Alert.alert('Error', 'Failed to add goal');
    }
  };

  const handleDeleteGoal = (id: string, name: string) => {
    Alert.alert(
      'Delete Goal? 🗑️',
      `Are you sure you want to delete "${name}"? This cannot be undone.`,
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: async () => {
            if (Platform.OS !== 'web') {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }
        },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
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
              Alert.alert('Error', 'Failed to delete goal');
            }
          }
        },
      ]
    );
  };

  const totalTarget = goals.reduce((sum, goal) => sum + (goal.targetAmount || 0), 0);
  const totalSaved = goals.reduce((sum, goal) => sum + (goal.saved || 0), 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Goals</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Dream big, save smart 🎯</Text>
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
          <LinearGradient colors={['#00D4A1', '#4CAF50']} style={styles.addGradient}>
            <Icon name="add" size={28} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Summary Cards */}
      <Animated.View style={[styles.summarySection, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <LinearGradient colors={['#00D4A1', '#4CAF50']} style={styles.summaryGradient}>
              <Icon name="trophy" size={28} color="#fff" />
              <Text style={styles.summaryLabel}>Target</Text>
              <Text style={styles.summaryValue}>৳{totalTarget.toFixed(0)}</Text>
            </LinearGradient>
          </View>

          <View style={styles.summaryCard}>
            <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.summaryGradient}>
              <Icon name="wallet" size={28} color="#fff" />
              <Text style={styles.summaryLabel}>Saved</Text>
              <Text style={styles.summaryValue}>৳{totalSaved.toFixed(0)}</Text>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.progressCard}>
          <LinearGradient colors={['#10b981', '#059669']} style={styles.progressGradient}>
            <View style={styles.progressHeader}>
              <Icon name="trending-up" size={32} color="#fff" />
              <Text style={styles.progressPercentage}>{overallProgress.toFixed(0)}%</Text>
            </View>
            <Text style={styles.progressLabel}>Overall Progress</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { width: `${Math.min(overallProgress, 100)}%` }]} />
            </View>
          </LinearGradient>
        </View>
      </Animated.View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {goals.map((goal, index) => {
          const saved = goal.saved || 0;
          const target = goal.targetAmount || 1;
          const progress = (saved / target) * 100;
          const daysLeft = goal.deadline 
            ? Math.ceil((goal.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : 0;
          
          return (
            <Animated.View 
              key={goal.id} 
              style={[
                styles.goalCard,
                { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 2 },
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
              <View style={styles.goalHeader}>
                <View style={styles.goalTitleRow}>
                  <Text style={[styles.goalName, { color: colors.text }]}>{goal.name}</Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteGoal(goal.id, goal.name)}
                    style={styles.deleteButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Icon name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                <View style={styles.goalMetaRow}>
                  <View style={styles.goalMeta}>
                    <Icon name="calendar-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.goalMetaText, { color: colors.textSecondary }]}>
                      {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Today!' : 'Overdue'}
                    </Text>
                  </View>
                  <Text style={styles.goalProgress}>{Math.round(progress)}%</Text>
                </View>
              </View>

              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <LinearGradient
                  colors={['#00D4A1', '#4CAF50']}
                  style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]}
                />
              </View>

              <View style={styles.goalFooter}>
                <Text style={[styles.goalAmount, { color: colors.textSecondary }]}>
                  ৳{saved.toLocaleString('en-BD')} / ৳{target.toLocaleString('en-BD')}
                </Text>
              </View>
            </Animated.View>
          );
        })}

        {goals.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <LinearGradient colors={['#00D4A1', '#4CAF50']} style={styles.emptyIconGradient}>
                <Icon name="trophy" size={64} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No goals yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Set your first goal and start saving!</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={[styles.modalContent, { backgroundColor: colors.surface, marginBottom: keyboardHeight }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Goal 🎯</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close-circle" size={32} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Goal Name</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Icon name="flag" size={20} color="#00D4A1" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g., New Laptop"
                  placeholderTextColor={colors.textSecondary}
                  value={goalName}
                  onChangeText={setGoalName}
                />
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Target Amount (৳)</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Icon name="cash" size={20} color="#00D4A1" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g., 50000"
                  placeholderTextColor={colors.textSecondary}
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  keyboardType="numeric"
                />
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Target Date</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Icon name="calendar" size={20} color="#00D4A1" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                  value={deadline}
                  onChangeText={setDeadline}
                />
              </View>

              <TouchableOpacity onPress={handleAddGoal} activeOpacity={0.8}>
                <LinearGradient colors={['#00D4A1', '#4CAF50']} style={styles.submitButton}>
                  <Text style={styles.submitText}>Create Goal</Text>
                  <Icon name="checkmark-circle" size={24} color="#fff" />
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold' },
  subtitle: { fontSize: 14, marginTop: 4 },
  addButton: { borderRadius: 25, overflow: 'hidden' },
  addGradient: { width: 56, height: 56, justifyContent: 'center', alignItems: 'center' },
  summarySection: { paddingHorizontal: 20, marginBottom: 20 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  summaryCard: { flex: 1, borderRadius: 20, overflow: 'hidden' },
  summaryGradient: { padding: 20, alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: '#fff', opacity: 0.9, marginTop: 8, marginBottom: 4, fontWeight: '600' },
  summaryValue: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  progressCard: { borderRadius: 20, overflow: 'hidden' },
  progressGradient: { padding: 24 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressPercentage: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  progressLabel: { fontSize: 14, color: '#fff', opacity: 0.9, marginBottom: 12, fontWeight: '600' },
  progressBarContainer: { height: 12, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#fff', borderRadius: 6 },
  list: { flex: 1, paddingHorizontal: 20 },
  goalCard: { padding: 20, borderRadius: 20, marginBottom: 16 },
  goalHeader: { marginBottom: 16 },
  goalTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  goalName: { fontSize: 20, fontWeight: 'bold', flex: 1 },
  deleteButton: { backgroundColor: '#2d1a1a', padding: 10, borderRadius: 10 },
  goalMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  goalMetaText: { fontSize: 12 },
  goalProgress: { fontSize: 18, fontWeight: 'bold', color: '#00D4A1' },
  progressBar: { height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: '100%', borderRadius: 5 },
  goalFooter: {},
  goalAmount: { fontSize: 14, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIconContainer: { marginBottom: 24, borderRadius: 40, overflow: 'hidden' },
  emptyIconGradient: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySubtext: { fontSize: 14, marginTop: 8 },
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: 'bold' },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 2 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16 },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 16, gap: 8, marginTop: 24, marginBottom: 16 },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
