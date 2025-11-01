import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../src/config/firebase-config';
import { useAuth } from '../src/contexts/AuthContext';

export default function ProfileSetup() {
  const { user, refreshUserProfile } = useAuth();
  const router = useRouter();
  
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [remainingBalance, setRemainingBalance] = useState('');
  const [salaryDay, setSalaryDay] = useState('');
  const [existingSavings, setExistingSavings] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!monthlyIncome || !remainingBalance || !salaryDay) {
      setError('Please fill in all required fields');
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          monthlyIncome: parseFloat(monthlyIncome),
          remainingBalanceCurrentMonth: parseFloat(remainingBalance),
          salaryDay: parseInt(salaryDay),
          existingSavings: existingSavings ? parseFloat(existingSavings) : 0,
          profileComplete: true,
          updatedAt: new Date(),
        });

        await refreshUserProfile();

        if (Platform.OS !== 'web') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0f172a' as any, '#1e293b' as any]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#8b5cf6' as any, '#ec4899' as any]}
                style={styles.iconGradient}
              >
                <Ionicons name="person" size={40} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>Help us personalize your experience</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Monthly Income (৳) *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="cash" size={20} color="#8b5cf6" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 50000"
                  placeholderTextColor="#64748b"
                  value={monthlyIncome}
                  onChangeText={setMonthlyIncome}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Balance (৳) *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="wallet" size={20} color="#8b5cf6" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 20000"
                  placeholderTextColor="#64748b"
                  value={remainingBalance}
                  onChangeText={setRemainingBalance}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Salary Day (1-31) *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="calendar" size={20} color="#8b5cf6" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 1"
                  placeholderTextColor="#64748b"
                  value={salaryDay}
                  onChangeText={setSalaryDay}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Existing Savings (৳)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="trending-up" size={20} color="#8b5cf6" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 100000 (optional)"
                  placeholderTextColor="#64748b"
                  value={existingSavings}
                  onChangeText={setExistingSavings}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#8b5cf6' as any, '#ec4899' as any]}
                style={styles.submitButton}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitText}>Complete Setup</Text>
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef44441a',
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: '#ef4444',
    marginLeft: 8,
    fontSize: 14,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    gap: 8,
    marginTop: 20,
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
