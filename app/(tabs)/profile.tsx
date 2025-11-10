import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Animated,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../src/config/firebase-config';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Icon from '../../src/components/Icon';

export default function ProfileScreen() {
  const { user, userProfile, signOut } = useAuth();
  const { theme, toggleTheme, colors } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    monthlyIncome: '',
    salaryDay: '1',
    existingSavings: '',
    existingFDR: '',
    monthlyEMI: '',
    emergencyFundTarget: '',
    otherInvestments: '',
  });
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (userProfile) {
      setFormData({
        monthlyIncome: userProfile.monthlyIncome?.toString() || '',
        salaryDay: userProfile.salaryDay?.toString() || '1',
        existingSavings: userProfile.existingSavings?.toString() || '',
        existingFDR: userProfile.existingFDR?.toString() || '',
        monthlyEMI: userProfile.monthlyEMI?.toString() || '',
        emergencyFundTarget: userProfile.emergencyFundTarget?.toString() || '',
        otherInvestments: userProfile.otherInvestments?.toString() || '',
      });
    }
    
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
  }, [userProfile]);

  const handleSave = async () => {
    if (!user) return;

    try {
      setLoading(true);
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }

      const cleanData = {
        monthlyIncome: parseFloat(formData.monthlyIncome) || 0,
        salaryDay: parseInt(formData.salaryDay) || 1,
        existingSavings: parseFloat(formData.existingSavings) || 0,
        existingFDR: parseFloat(formData.existingFDR) || 0,
        monthlyEMI: parseFloat(formData.monthlyEMI) || 0,
        emergencyFundTarget: parseFloat(formData.emergencyFundTarget) || 0,
        otherInvestments: parseFloat(formData.otherInvestments) || 0,
        updatedAt: new Date(),
      };

      await updateDoc(doc(db, 'users', user.uid), cleanData);

      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert('Success! 🎉', "Profile saved! You're crushing it!");
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to save. Try again?');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    // ✅ FIX: Use window.confirm for web, Alert.alert for mobile
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (confirmed) {
        try {
          await signOut();
          router.replace('/');
        } catch (error) {
          console.error('Sign out error:', error);
        }
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await signOut();
              router.replace('/');
            },
          },
        ]
      );
    }
  };

  const totalWealth = (parseFloat(formData.existingSavings) || 0) + 
                      (parseFloat(formData.existingFDR) || 0) + 
                      (parseFloat(formData.otherInvestments) || 0);

  const netMonthlyIncome = (parseFloat(formData.monthlyIncome) || 0) - 
                           (parseFloat(formData.monthlyEMI) || 0);

  const getDaysUntilSalary = () => {
    const today = new Date();
    const currentDay = today.getDate();
    const salaryDay = parseInt(formData.salaryDay);
    
    if (currentDay < salaryDay) {
      return salaryDay - currentDay;
    } else if (currentDay === salaryDay) {
      return 0;
    } else {
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, salaryDay);
      const diffTime = nextMonth.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
  };

  const daysUntilSalary = getDaysUntilSalary();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
        
        {/* Theme Toggle */}
        <View style={styles.themeToggle}>
          <Text style={[styles.themeLabel, { color: colors.textSecondary }]}>
            {theme === 'dark' ? '🌙' : '☀️'} {theme === 'dark' ? 'Dark' : 'Light'}
          </Text>
          <Switch
            value={theme === 'light'}
            onValueChange={toggleTheme}
            trackColor={{ false: '#334155', true: '#00D4A1' }}
            thumbColor={theme === 'light' ? '#4CAF50' : '#f4f3f4'}
          />
        </View>
      </Animated.View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <Animated.View style={[styles.userCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient colors={['#00D4A1', '#4CAF50']} style={styles.userGradient}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user?.email || 'U')[0].toUpperCase()}
              </Text>
            </View>
            <Text style={styles.userName}>{user?.displayName || user?.email?.split('@')[0] || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </LinearGradient>
        </Animated.View>

        {/* Financial Snapshot */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 Your Financial Snapshot</Text>
          <View style={styles.snapshotGrid}>
            <LinearGradient colors={['#00D4A1', '#4CAF50']} style={styles.snapshotCard}>
              <Text style={styles.snapshotEmoji}>💎</Text>
              <Text style={styles.snapshotLabel}>Total Wealth</Text>
              <Text style={styles.snapshotValue}>৳{totalWealth.toLocaleString('en-BD')}</Text>
              <Text style={styles.snapshotDesc}>Savings + FDR + Investments</Text>
            </LinearGradient>

            <View style={[styles.snapshotCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.snapshotEmoji}>{daysUntilSalary === 0 ? '🎉' : '⏰'}</Text>
              <Text style={[styles.snapshotLabel, { color: colors.textSecondary }]}>
                {daysUntilSalary === 0 ? 'Salary Day!' : `${daysUntilSalary} days to payday`}
              </Text>
              <Text style={[styles.snapshotValue, { color: colors.text }]}>৳{netMonthlyIncome.toLocaleString('en-BD')}</Text>
              <Text style={[styles.snapshotDesc, { color: colors.textSecondary }]}>Net monthly income</Text>
            </View>
          </View>
        </View>

        {/* Money Coming In */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>💵 Money Coming In</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Monthly Income / Salary (৳)</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Icon name="cash" size={20} color="#00D4A1" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g., 50000"
                placeholderTextColor={colors.textSecondary}
                value={formData.monthlyIncome}
                onChangeText={(text) => setFormData({ ...formData, monthlyIncome: text })}
                keyboardType="numeric"
              />
            </View>
            <Text style={[styles.inputHint, { color: colors.textSecondary }]}>Your take-home pay after taxes</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>When do you get paid?</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Icon name="calendar" size={20} color="#00D4A1" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="1-31"
                placeholderTextColor={colors.textSecondary}
                value={formData.salaryDay}
                onChangeText={(text) => setFormData({ ...formData, salaryDay: text })}
                keyboardType="numeric"
              />
            </View>
            <Text style={[styles.inputHint, { color: colors.textSecondary }]}>Day of the month (Helps track spending cycles)</Text>
          </View>
        </View>

        {/* What You've Got */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>💎 What You've Got</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Cash in Bank (৳)</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Icon name="wallet" size={20} color="#00D4A1" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g., 100000"
                placeholderTextColor={colors.textSecondary}
                value={formData.existingSavings}
                onChangeText={(text) => setFormData({ ...formData, existingSavings: text })}
                keyboardType="numeric"
              />
            </View>
            <Text style={[styles.inputHint, { color: colors.textSecondary }]}>Money you can use anytime (savings, bKash, etc.)</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Fixed Deposits / FDR (৳)</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Icon name="lock-closed" size={20} color="#00D4A1" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g., 50000"
                placeholderTextColor={colors.textSecondary}
                value={formData.existingFDR}
                onChangeText={(text) => setFormData({ ...formData, existingFDR: text })}
                keyboardType="numeric"
              />
            </View>
            <Text style={[styles.inputHint, { color: colors.textSecondary }]}>Money locked in banks earning interest</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Other Investments (৳)</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Icon name="trending-up" size={20} color="#00D4A1" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g., 30000"
                placeholderTextColor={colors.textSecondary}
                value={formData.otherInvestments}
                onChangeText={(text) => setFormData({ ...formData, otherInvestments: text })}
                keyboardType="numeric"
              />
            </View>
            <Text style={[styles.inputHint, { color: colors.textSecondary }]}>Stocks, mutual funds, DPS, bonds, crypto, etc.</Text>
          </View>
        </View>

        {/* Monthly Must-Pays */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>💳 Monthly Must-Pays</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Total EMI / Loan Payments (৳)</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Icon name="card" size={20} color="#00D4A1" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g., 15000"
                placeholderTextColor={colors.textSecondary}
                value={formData.monthlyEMI}
                onChangeText={(text) => setFormData({ ...formData, monthlyEMI: text })}
                keyboardType="numeric"
              />
            </View>
            <Text style={[styles.inputHint, { color: colors.textSecondary }]}>Home loan, car EMI, personal loan, credit cards—add them all</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Emergency Fund Goal (৳)</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Icon name="shield-checkmark" size={20} color="#00D4A1" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g., 300000"
                placeholderTextColor={colors.textSecondary}
                value={formData.emergencyFundTarget}
                onChangeText={(text) => setFormData({ ...formData, emergencyFundTarget: text })}
                keyboardType="numeric"
              />
            </View>
            <Text style={[styles.inputHint, { color: colors.textSecondary }]}>
              💡 Pro tip: Save 6 months of expenses = ৳{((parseFloat(formData.monthlyIncome) || 0) * 6).toLocaleString('en-BD')}
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity onPress={handleSave} disabled={loading} activeOpacity={0.8}>
          <LinearGradient colors={['#00D4A1', '#4CAF50']} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : '✅ Save & Update'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Sign Out */}
        <TouchableOpacity onPress={handleSignOut} style={[styles.signOutButton, { backgroundColor: colors.surface, borderColor: '#ef4444' }]}>
          <Icon name="log-out" size={24} color="#ef4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  header: { padding: 20, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold' },
  themeToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  themeLabel: { fontSize: 14, fontWeight: '600' },
  userCard: { marginHorizontal: 20, marginBottom: 20, borderRadius: 24, overflow: 'hidden' },
  userGradient: { padding: 32, alignItems: 'center' },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)' },
  avatarText: { fontSize: 48, fontWeight: 'bold', color: '#fff' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#fff', opacity: 0.9 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  snapshotGrid: { flexDirection: 'row', gap: 12 },
  snapshotCard: { flex: 1, padding: 20, borderRadius: 20, alignItems: 'center', borderWidth: 2 },
  snapshotEmoji: { fontSize: 36, marginBottom: 8 },
  snapshotLabel: { fontSize: 11, color: '#fff', marginBottom: 8, fontWeight: '600', textAlign: 'center' },
  snapshotValue: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  snapshotDesc: { fontSize: 10, color: '#fff', opacity: 0.8, textAlign: 'center' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 16, height: 56, borderWidth: 2 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16 },
  inputHint: { fontSize: 12, marginTop: 6, lineHeight: 16 },
  saveButton: { marginHorizontal: 20, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  saveButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  signOutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, height: 56, borderRadius: 16, gap: 12, borderWidth: 2 },
  signOutText: { fontSize: 16, fontWeight: '600', color: '#ef4444' },
});
