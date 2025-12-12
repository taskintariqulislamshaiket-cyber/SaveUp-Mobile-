import WalletIcon from '../src/components/WalletIcon';
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

const ACCOUNT_TYPES = [
  { id: 'cash', name: 'Cash', icon: 'cash-outline', color: '#10b981' },
  { id: 'bkash', name: 'bKash', icon: 'phone-portrait-outline', color: '#e91e63' },
  { id: 'nagad', name: 'Nagad', icon: 'wallet-outline', color: '#ff9800' },
  { id: 'rocket', name: 'Rocket', icon: 'rocket-outline', color: '#9c27b0' },
  { id: 'bank', name: 'Bank', icon: 'business-outline', color: '#2196f3' },
];

export default function ProfileSetup() {
  const { user, refreshUserProfile } = useAuth();
  const { selectPet, earnGems } = usePet();
  const router = useRouter();
  
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [remainingBalance, setRemainingBalance] = useState('');
  const [salaryDay, setSalaryDay] = useState('');
  const [existingSavings, setExistingSavings] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedPet, setSelectedPet] = useState<PetType | null>(null);
  const [showPetModal, setShowPetModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(['cash', 'bkash', 'nagad']);
  const [accountBalances, setAccountBalances] = useState<Record<string, string>>({
    cash: '', bkash: '', nagad: '', rocket: '', bank: '',
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
    Animated.loop(Animated.timing(logoRotate, { toValue: 1, duration: 15000, useNativeDriver: true })).start();
  }, []);

  const logoSpin = logoRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const toggleAccount = async (accountId: string) => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAccounts(prev => {
      if (prev.includes(accountId)) {
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== accountId);
      } else {
        return [...prev, accountId];
      }
    });
  };

  const handleSubmit = async () => {
    if (!monthlyIncome || !remainingBalance || !salaryDay) {
      setError('Please fill in all required fields');
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!phoneNumber || !phoneNumber.startsWith("+880")) {
      setError("Please enter a valid Bangladeshi WhatsApp number starting with +880");
      if (Platform.OS !== "web") await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!selectedPet) {
      setError('Please choose your pet companion! 🐾');
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (selectedAccounts.length === 0) {
      setError('Please select at least one account');
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const salaryDayNum = parseInt(salaryDay);
    if (salaryDayNum < 1 || salaryDayNum > 31) {
      setError('Salary day must be between 1-31');
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    setError('');
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (user) {
        const balances: Record<string, number> = {};
        selectedAccounts.forEach(accountId => {
          const balance = parseFloat(accountBalances[accountId] || '0');
          balances[accountId] = balance;
        });

        await updateDoc(doc(db, 'users', user.uid), {
          monthlyIncome: parseFloat(monthlyIncome),
          remainingBalanceCurrentMonth: parseFloat(remainingBalance),
          salaryDay: salaryDayNum,
          existingSavings: existingSavings ? parseFloat(existingSavings) : 0,
          phoneNumber: phoneNumber,
          selectedAccounts: selectedAccounts,
          accountBalances: balances,
          profileComplete: true,
          updatedAt: new Date(),
        });

        await selectPet(selectedPet);
        await earnGems('COMPLETE_PROFILE', 50);
        await refreshUserProfile();
        if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/quiz');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
            <Animated.View style={[styles.iconContainer, { transform: [{ rotate: logoSpin }] }]}>
              <LinearGradient colors={['#00D4A1', '#4CAF50']} style={styles.iconGradient}>
                <WalletIcon size={80} />
              </LinearGradient>
            </Animated.View>
            <Text style={styles.title}>Let's Set You Up! 🚀</Text>
            <Text style={styles.subtitle}>This helps us personalize your experience</Text>
          </Animated.View>

          <Animated.View style={[styles.form, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>💰 Monthly Income (৳) *</Text>
              <Text style={styles.helper}>Your salary after taxes</Text>
              <View style={styles.inputContainer}>
                <Icon name="cash" size={22} color="#00D4A1" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="e.g., 50000" placeholderTextColor="#64748b" value={monthlyIncome} onChangeText={setMonthlyIncome} keyboardType="numeric" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>💳 Money Left This Month (৳) *</Text>
              <Text style={styles.helper}>How much do you have right now?</Text>
              <View style={styles.inputContainer}>
                <Icon name="wallet" size={22} color="#00D4A1" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="e.g., 20000" placeholderTextColor="#64748b" value={remainingBalance} onChangeText={setRemainingBalance} keyboardType="numeric" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>📅 Salary Day *</Text>
              <Text style={styles.helper}>Which day of the month? (1-31)</Text>
              <View style={styles.inputContainer}>
                <Icon name="calendar" size={22} color="#00D4A1" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="e.g., 1" placeholderTextColor="#64748b" value={salaryDay} onChangeText={setSalaryDay} keyboardType="numeric" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>💎 Existing Savings (৳)</Text>
              <Text style={styles.helper}>Bank balance, FDR, investments (optional)</Text>
              <View style={styles.inputContainer}>
                <Icon name="trending-up" size={22} color="#00D4A1" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="e.g., 100000" placeholderTextColor="#64748b" value={existingSavings} onChangeText={setExistingSavings} keyboardType="numeric" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>📱 WhatsApp Number *</Text>
              <Text style={styles.helper}>For WhatsApp bot sync (e.g., +8801712345678)</Text>
              <View style={styles.inputContainer}>
                <Icon name="phone-portrait" size={22} color="#00D4A1" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="+8801712345678" placeholderTextColor="#64748b" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>🏦 Select Your Accounts *</Text>
              <Text style={styles.helper}>Choose accounts you use (tap to select)</Text>
              <View style={styles.accountsGrid}>
                {ACCOUNT_TYPES.map(account => {
                  const isSelected = selectedAccounts.includes(account.id);
                  return (
                    <TouchableOpacity key={account.id} style={[styles.accountOption, isSelected && styles.accountOptionSelected, { borderColor: isSelected ? account.color : '#334155' }]} onPress={() => toggleAccount(account.id)}>
                      <View style={[styles.accountIconCircle, { backgroundColor: account.color + '20' }]}>
                        <Icon name={account.icon} size={24} color={account.color} />
                      </View>
                      <Text style={[styles.accountOptionText, { color: isSelected ? '#fff' : '#94a3b8' }]}>{account.name}</Text>
                      {isSelected && (
                        <View style={[styles.checkBadge, { backgroundColor: account.color }]}>
                          <Icon name="checkmark" size={16} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedAccounts.length > 0 && (
                <View style={styles.balancesSection}>
                  <Text style={styles.balancesSectionTitle}>💵 Current Balance in Each Account</Text>
                  {selectedAccounts.map(accountId => {
                    const account = ACCOUNT_TYPES.find(a => a.id === accountId);
                    if (!account) return null;
                    return (
                      <View key={accountId} style={styles.balanceInput}>
                        <View style={styles.balanceInputHeader}>
                          <Icon name={account.icon} size={18} color={account.color} />
                          <Text style={styles.balanceInputLabel}>{account.name}</Text>
                        </View>
                        <TextInput style={styles.balanceInputField} placeholder="0" placeholderTextColor="#64748b" value={accountBalances[accountId]} onChangeText={(text) => setAccountBalances(prev => ({ ...prev, [accountId]: text }))} keyboardType="numeric" />
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>🐾 Choose Your Pet Companion *</Text>
              <Text style={styles.helper}>Pick one that matches your financial personality</Text>
              {selectedPet ? (
                <TouchableOpacity style={styles.selectedPetCard} onPress={() => setShowPetModal(true)} activeOpacity={0.8}>
                  <LinearGradient colors={['#00D4A1', '#4CAF50']} style={styles.selectedPetGradient}>
                    <Text style={styles.selectedPetEmoji}>{getPetInfo(selectedPet).emoji}</Text>
                    <View style={styles.selectedPetInfo}>
                      <Text style={styles.selectedPetName}>{getPetInfo(selectedPet).name}</Text>
                      <Text style={styles.selectedPetType}>{getPetInfo(selectedPet).type}</Text>
                    </View>
                    <Icon name="swap-horizontal" size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.choosePetButton} onPress={() => setShowPetModal(true)} activeOpacity={0.8}>
                  <LinearGradient colors={['#1e293b', '#334155']} style={styles.choosePetGradient}>
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

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
              <LinearGradient colors={['#00D4A1', '#4CAF50']} style={styles.submitGradient}>
                {loading ? <ActivityIndicator color="#fff" /> : (
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
      <PetSelector visible={showPetModal} onClose={() => setShowPetModal(false)} onSelect={(pet) => { setSelectedPet(pet); setShowPetModal(false); }} title="Choose Your Pet" subtitle="Pick a companion that matches your financial personality" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 32 },
  iconContainer: { marginBottom: 20 },
  iconGradient: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', shadowColor: '#00D4A1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
  form: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  helper: { fontSize: 12, color: '#64748b', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, paddingHorizontal: 16, height: 56, borderWidth: 2, borderColor: '#334155' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#fff', fontSize: 16 },
  accountsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  accountOption: { width: '47%', backgroundColor: '#1e293b', borderRadius: 12, padding: 16, borderWidth: 2, alignItems: 'center', position: 'relative' },
  accountOptionSelected: { backgroundColor: '#2d3748' },
  accountIconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  accountOptionText: { fontSize: 14, fontWeight: '600' },
  checkBadge: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  balancesSection: { marginTop: 16, padding: 16, backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 2, borderColor: '#334155' },
  balancesSectionTitle: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 12 },
  balanceInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  balanceInputHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  balanceInputLabel: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },
  balanceInputField: { backgroundColor: '#0f172a', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: '#fff', fontSize: 14, width: 120, textAlign: 'right', borderWidth: 1, borderColor: '#334155' },
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
