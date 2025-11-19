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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPetSelector, setShowPetSelector] = useState(false);
  const [selectedPet, setSelectedPet] = useState<PetType | null>(null);
  
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

  const handlePetSelected = (petType: PetType) => {
    setSelectedPet(petType);
    setShowPetSelector(false);
  };

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

        // Select the chosen pet
        await selectPet(selectedPet);
        
        // Give welcome bonus gems
        await earnGems('COMPLETE_PROFILE', 50);

        await refreshUserProfile();

        if (Platform.OS !== 'web') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        router.replace('/quiz');
      }
    } catch (err: any) {
      console.error('Profile setup error:', err);
      setError(err.message || 'Failed to save profile');
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setLoading(false);
    }
  };

  const getPetInfo = (petType: PetType) => {
    const pets = {
      meow: { name: 'Meow', personality: 'Anxious Saver', emoji: '🐱' },
      doge: { name: 'Doge', personality: 'Loyal Budgeter', emoji: '🐶' },
      finny: { name: 'Finny', personality: 'Smart Spender', emoji: '🦊' },
      chill: { name: 'Chill', personality: 'Long-term Planner', emoji: '🐻' },
    };
    return pets[petType as keyof typeof pets] || pets.meow;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#0f172a', '#1e1b4b', '#1e293b']}
          style={StyleSheet.absoluteFillObject}
        />

        <Animated.View
          style={[
            styles.headerContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <Animated.View style={[styles.logoContainer, { transform: [{ rotate: logoSpin }] }]}>
            <LinearGradient
              colors={['#00D4A1', '#4CAF50', '#8BD3C7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Text style={styles.walletEmoji}>💰</Text>
            </LinearGradient>
          </Animated.View>

          <Text style={styles.title}>Let's Get Started! 🚀</Text>
          <Text style={styles.subtitle}>Tell us about your finances</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💵 Monthly Income</Text>
            <View style={styles.inputContainer}>
              <Icon name="cash" size={20} color="#00D4A1" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., 50000"
                placeholderTextColor="#64748b"
                value={monthlyIncome}
                onChangeText={setMonthlyIncome}
                keyboardType="numeric"
              />
              <Text style={styles.currency}>৳</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💳 Current Balance</Text>
            <Text style={styles.sectionSubtitle}>How much do you have right now?</Text>
            <View style={styles.inputContainer}>
              <Icon name="wallet" size={20} color="#00D4A1" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., 30000"
                placeholderTextColor="#64748b"
                value={remainingBalance}
                onChangeText={setRemainingBalance}
                keyboardType="numeric"
              />
              <Text style={styles.currency}>৳</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Salary Day</Text>
            <Text style={styles.sectionSubtitle}>Which day of the month?</Text>
            <View style={styles.inputContainer}>
              <Icon name="calendar" size={20} color="#00D4A1" style={styles.inputIcon} />
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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💎 Existing Savings (Optional)</Text>
            <Text style={styles.sectionSubtitle}>Bank balance, investments, etc.</Text>
            <View style={styles.inputContainer}>
              <Icon name="trending-up" size={20} color="#00D4A1" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., 100000"
                placeholderTextColor="#64748b"}
                value={existingSavings}
                onChangeText={setExistingSavings}
                keyboardType="numeric"
              />
              <Text style={styles.currency}>৳</Text>
            </View>
          </View>

          {/* Pet Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose Your Pet Companion 🐾</Text>
            <Text style={styles.sectionSubtitle}>
              Pick a pet that matches your financial personality
            </Text>
            
            {selectedPet ? (
              <TouchableOpacity
                style={styles.selectedPetCard}
                onPress={() => setShowPetSelector(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#00D4A1', '#4CAF50']}
                  style={styles.selectedPetGradient}
                >
                  <Text style={styles.selectedPetEmoji}>
                    {getPetInfo(selectedPet).emoji}
                  </Text>
                  <View style={styles.selectedPetInfo}>
                    <Text style={styles.selectedPetName}>
                      {getPetInfo(selectedPet).name}
                    </Text>
                    <Text style={styles.selectedPetPersonality}>
                      {getPetInfo(selectedPet).personality}
                    </Text>
                  </View>
                  <Text style={styles.changePetText}>Change</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.choosePetButton}
                onPress={() => setShowPetSelector(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#7c3aed']}
                  style={styles.choosePetGradient}
                >
                  <Text style={styles.choosePetEmoji}>🐾</Text>
                  <Text style={styles.choosePetText}>Choose Your Pet</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={16} color="#ef4444" />
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
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.submitText}>Continue</Text>
                  <Icon name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.footer}>
          🔒 Your data is private and secure
        </Text>
      </ScrollView>

      {/* Pet Selector Modal */}
      <PetSelector
        visible={showPetSelector}
        onClose={() => setShowPetSelector(false)}
        onSelect={handlePetSelected}
        title="Choose Your Pet"
        subtitle="Pick a companion that matches your financial personality"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  headerContainer: { alignItems: 'center', marginBottom: 32, marginTop: 40 },
  logoContainer: { marginBottom: 16 },
  logoGradient: {
    width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#00D4A1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  walletEmoji: { fontSize: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#94a3b8' },
  formContainer: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, color: '#64748b', marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b',
    borderRadius: 12, paddingHorizontal: 16, height: 56, borderWidth: 2, borderColor: '#334155',
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#fff', fontSize: 16 },
  currency: { color: '#00D4A1', fontSize: 16, fontWeight: 'bold' },
  selectedPetCard: { borderRadius: 16, overflow: 'hidden', marginTop: 12 },
  selectedPetGradient: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  selectedPetEmoji: { fontSize: 48 },
  selectedPetInfo: { flex: 1 },
  selectedPetName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  selectedPetPersonality: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)', marginTop: 2 },
  changePetText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  choosePetButton: { borderRadius: 16, overflow: 'hidden', marginTop: 12 },
  choosePetGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 12 },
  choosePetEmoji: { fontSize: 36 },
  choosePetText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  errorContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ef44441a',
    borderRadius: 12, padding: 12, marginBottom: 16,
  },
  errorText: { color: '#ef4444', marginLeft: 8, fontSize: 14 },
  submitButton: { marginTop: 8, marginBottom: 20 },
  submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 12, gap: 8 },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  footer: { textAlign: 'center', color: '#64748b', fontSize: 12, marginTop: 24 },
});
