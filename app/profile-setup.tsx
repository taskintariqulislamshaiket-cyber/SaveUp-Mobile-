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
import { usePet } from '../src/contexts/PetContext';
import PetSelector from '../src/components/pet/PetSelector';
import { PetType } from '../src/types/pet';

export default function ProfileSetup() {
  const { user, refreshUserProfile } = useAuth();
  const { selectPet, earnGems } = usePet();
  const router = useRouter();
  
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [remainingBalance, setRemainingBalance] = useState('');
  const [salaryDay, setSalaryDay] = useState('');
  const [existingSavings, setExistingSavings] = useState('');
  const [selectedPet, setSelectedPet] = useState<PetType | null>(null);
  const [showPetModal, setShowPetModal] = useState(false);
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

    if (!selectedPet) {
      setError('Please choose your pet companion! 🐾');
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

        // Set up pet
        await selectPet(selectedPet);
        await earnGems('COMPLETE_PROFILE', 50);

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

  const getPetInfo = (pet: PetType) => {
    const pets = {
      meow: { name: 'Meow', type: 'Anxious Saver', emoji: '🐱' },
      doge: { name: 'Doge', type: 'Loyal Budgeter', emoji: '🐶' },
      finny: { name: 'Finny', type: 'Smart Spender', emoji: '🦊' },
      chill: { name: 'Chill', type: 'Long-term Planner', emoji: '🐻' },
    };
    return pets[pet as keyof typeof pets] || pets.meow;
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
              <Text style={styles.label}>📅 Salary Day *</Text>
              <Text style={styles.helper}>Which day of the month? (1-31)</Text>
              <View style={styles.inputContainer}>
                <Icon name="calendar" size={22} color="#00D4A1" style={styles.inputIcon} />
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
              <Text style={styles.label}>💎 Existing Savings (৳)</Text>
              <Text style={styles.helper}>Bank balance, FDR, investments (optional)</Text>
              <View style={styles.inputContainer}>
                <Icon name="trending-up" size={22} color="#00D4A1" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 100000"
                  placeholderTextColor="#64748b"
                  value={existingSavings}
                  onChangeText={setExistingSavings}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Pet Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>🐾 Choose Your Pet Companion *</Text>
              <Text style={styles.helper}>Pick one that matches your financial personality</Text>
              
              {selectedPet ? (
                <TouchableOpacity
                  style={styles.selectedPetCard}
                  onPress={() => setShowPetModal(true)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#00D4A1', '#4CAF50']}
                    style={styles.selectedPetGradient}
                  >
                    <Text style={styles.selectedPetEmoji}>{getPetInfo(selectedPet).emoji}</Text>
                    <View style={styles.selectedPetInfo}>
                      <Text style={styles.selectedPetName}>{getPetInfo(selectedPet).name}</Text>
                      <Text style={styles.selectedPetType}>{getPetInfo(selectedPet).type}</Text>
                    </View>
                    <Icon name="swap-horizontal" size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.choosePetButton}
                  onPress={() => setShowPetModal(true)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#1e293b', '#334155']}
                    style={styles.choosePetGradient}
                  >
                    <Text style={styles.choosePetEmoji}>🐾</Text>
                    <Text style={styles.choosePetText}>Tap to Choose</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={18} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00D4A1', '#4CAF50']}
                style={styles.submitGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitText}>Continue</Text>
                    <Icon name="arrow-forward" size={22} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.footer}>🔒 Your data is private and secure</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Pet Selector Modal */}
      <PetSelector
        visible={showPetModal}
        onClose={() => setShowPetModal(false)}
        onSelect={(pet) => {
          setSelectedPet(pet);
          setShowPetModal(false);
        }}
        title="Choose Your Pet"
        subtitle="Pick a companion that matches your financial personality"
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 32 },
  iconContainer: { marginBottom: 20 },
  iconGradient: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', shadowColor: '#00D4A1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  walletEmoji: { fontSize: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
  form: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  helper: { fontSize: 12, color: '#64748b', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, paddingHorizontal: 16, height: 56, borderWidth: 2, borderColor: '#334155' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#fff', fontSize: 16 },
  selectedPetCard: { borderRadius: 16, overflow: 'hidden' },
  selectedPetGradient: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  selectedPetEmoji: { fontSize: 36 },
  selectedPetInfo: { flex: 1 },
  selectedPetName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  selectedPetType: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)', marginTop: 2 },
  choosePetButton: { borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#334155' },
  choosePetGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 12 },
  choosePetEmoji: { fontSize: 32 },
  choosePetText: { fontSize: 16, fontWeight: '600', color: '#94a3b8' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#ef4444' },
  errorText: { color: '#ef4444', marginLeft: 8, fontSize: 14, flex: 1 },
  submitButton: { marginTop: 8 },
  submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 16, gap: 8 },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  footer: { textAlign: 'center', color: '#64748b', fontSize: 12, marginTop: 32 },
});
