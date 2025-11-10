import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../src/components/Icon';
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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 15000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const logoSpin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleSubmit = async () => {
    if (!monthlyIncome || !remainingBalance || !salaryDay) {
      setError('Please fill in all required fields');
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    const salaryDayNum = parseInt(salaryDay);
    if (salaryDayNum < 1 || salaryDayNum > 31) {
      setError('Salary day must be between 1-31');
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setLoading(true);
    setError('');

    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          monthlyIncome: parseFloat(monthlyIncome),
          remainingBalanceCurrentMonth: parseFloat(remainingBalance),
          salaryDay: salaryDayNum,
          existingSavings: existingSavings ? parseFloat(existingSavings) : 0,
          profileComplete: true,
          updatedAt: new Date(),
        });

        await refreshUserProfile();

        if (Platform.OS !== 'web') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        router.replace('/quiz');
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
    <LinearGradient colors={['#0f172a', '#1e1b4b', '#1e293b']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
              }
            ]}
          >
            <Animated.View style={[styles.iconContainer, { transform: [{ rotate: logoSpin }] }]}>
              <LinearGradient
                colors={['#00D4A1', '#4CAF50']}
                style={styles.iconGradient}
              >
                <Text style={styles.walletEmoji}>💰</Text>
              </LinearGradient>
            </Animated.View>
            <Text style={styles.title}>Let's Set You Up! 🚀</Text>
            <Text style={styles.subtitle}>This helps us personalize your experience</Text>
          </Animated.View>

          <Animated.View 
            style={[
              styles.form,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.label}>💰 Monthly Income (৳) *</Text>
              <Text style={styles.helper}>Your salary after taxes</Text>
              <View style={styles.inputContainer}>
                <Icon name="cash" size={22} color="#00D4A1" style={styles.inputIcon} />
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
              <Text style={styles.label}>💳 Money Left This Month (৳) *</Text>
              <Text style={styles.helper}>How much do you have right now?</Text>
              <View style={styles.inputContainer}>
                <Icon name="wallet" size={22} color="#00D4A1" style={styles.inputIcon} />
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
              <Text style={styles.label}>📅 Salary Day (1-31) *</Text>
              <Text style={styles.helper}>What day does your salary usually come? (e.g., 1st, 5th, last working day = 30 or 31)</Text>
              <View style={styles.inputContainer}>
                <Icon name="calendar" size={22} color="#00D4A1" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 1 or 30"
                  placeholderTextColor="#64748b"
                  value={salaryDay}
                  onChangeText={setSalaryDay}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>📈 Savings in Bank/bKash (৳)</Text>
              <Text style={styles.helper}>Optional: Your existing savings</Text>
              <View style={styles.inputContainer}>
                <Icon name="trending-up" size={22} color="#00D4A1" style={styles.inputIcon} />
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
              <Animated.View style={[styles.errorContainer, { opacity: fadeAnim }]}>
                <Icon name="alert-circle" size={18} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : null}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
              style={styles.submitButtonContainer}
            >
              <LinearGradient
                colors={['#00D4A1', '#4CAF50']}
                style={styles.submitButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.submitText}>Next: Money Quiz</Text>
                    <Icon name="arrow-forward-circle" size={26} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.privacyNote}>
              🔒 Your data is encrypted and stays private
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: 48 },
  iconContainer: { marginBottom: 24 },
  iconGradient: {
    width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#00D4A1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.6,
    shadowRadius: 20, elevation: 15,
  },
  walletEmoji: { fontSize: 50 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#94a3b8', textAlign: 'center' },
  form: { gap: 28, maxWidth: 500, width: '100%', alignSelf: 'center' },
  inputGroup: { gap: 8 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#e2e8f0', marginLeft: 4 },
  helper: { fontSize: 13, color: '#64748b', marginLeft: 4, marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 16,
    paddingHorizontal: 18, height: 60, borderWidth: 2, borderColor: '#334155',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15,
    shadowRadius: 6, elevation: 4,
  },
  inputIcon: { marginRight: 14 },
  input: { flex: 1, color: '#fff', fontSize: 17 },
  errorContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ef444415',
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#ef444450',
  },
  errorText: { color: '#ef4444', marginLeft: 10, fontSize: 14, flex: 1 },
  submitButtonContainer: { marginTop: 20 },
  submitButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 64, borderRadius: 18, gap: 12,
    shadowColor: '#00D4A1', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4,
    shadowRadius: 12, elevation: 8,
  },
  submitText: { color: '#fff', fontSize: 19, fontWeight: 'bold' },
  privacyNote: {
    textAlign: 'center', color: '#64748b', fontSize: 13, marginTop: 24,
    fontStyle: 'italic',
  },
});
