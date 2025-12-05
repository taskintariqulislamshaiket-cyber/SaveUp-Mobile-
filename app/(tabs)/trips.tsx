import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../../src/components/Icon';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../src/config/firebase-config';

// Bangladesh Popular Destinations
const BD_DESTINATIONS = [
  { name: "Cox's Bazar", emoji: '🏖️', gradient: ['#ff6b6b', '#ee5a6f'] },
  { name: 'Sajek Valley', emoji: '🌲', gradient: ['#4facfe', '#00f2fe'] },
  { name: 'Saint Martin', emoji: '🌊', gradient: ['#43e97b', '#38f9d7'] },
  { name: 'Bandarban', emoji: '🏔️', gradient: ['#fa709a', '#fee140'] },
  { name: 'Sylhet', emoji: '🍃', gradient: ['#30cfd0', '#330867'] },
  { name: 'Sundarbans', emoji: '🌳', gradient: ['#a8e063', '#56ab2f'] },
  { name: 'Rangamati', emoji: '🏛️', gradient: ['#667eea', '#764ba2'] },
  { name: 'Srimangal', emoji: '🌾', gradient: ['#f093fb', '#f5576c'] },
  { name: 'Kuakata', emoji: '🌅', gradient: ['#4facfe', '#00f2fe'] },
  { name: 'Custom Trip', emoji: '✈️', gradient: ['#00D4A1', '#4CAF50'] },
];

interface Trip {
  id: string;
  userId: string;
  name: string;
  emoji: string;
  budget: number;
  spent: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed';
  gradient: string[];
  createdAt: Date;
}

export default function TripsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [destinationModalVisible, setDestinationModalVisible] = useState(false);
  
  // Form states
  const [selectedDestination, setSelectedDestination] = useState<any>(null);
  const [tripName, setTripName] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadTrips();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadTrips = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'trips'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      const tripsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate?.() || new Date(),
        endDate: doc.data().endDate?.toDate?.() || new Date(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      })) as Trip[];
      
      // Auto-complete trips past end date
      const now = new Date();
      tripsData.forEach(async trip => {
        if (trip.status === 'active' && trip.endDate < now) {
          await updateDoc(doc(db, 'trips', trip.id), { status: 'completed' });
        }
      });
      
      setTrips(tripsData);
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDestination = (destination: any) => {
    setSelectedDestination(destination);
    if (destination.name !== 'Custom Trip') {
      setTripName(destination.name);
    } else {
      setTripName('');
    }
    setDestinationModalVisible(false);
    setModalVisible(true);
  };

  const handleCreateTrip = async () => {
    if (!tripName || !budget || !startDate || !endDate) {
      alert('Please fill in all fields');
      return;
    }

    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      await addDoc(collection(db, 'trips'), {
        userId: user?.uid,
        name: tripName,
        emoji: selectedDestination?.emoji || '✈️',
        gradient: selectedDestination?.gradient || ['#00D4A1', '#4CAF50'],
        budget: parseFloat(budget),
        spent: 0,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'active',
        createdAt: new Date(),
      });

      setModalVisible(false);
      setTripName('');
      setBudget('');
      setStartDate('');
      setEndDate('');
      loadTrips();

      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error creating trip:', error);
      alert('Failed to create trip');
    }
  };

  const activeTrips = trips.filter(t => t.status === 'active');
  const completedTrips = trips.filter(t => t.status === 'completed');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Trips</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Track your adventures 🎒
            </Text>
          </View>
        </Animated.View>

        {/* Active Trips */}
        {activeTrips.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>✈️ Active Trips</Text>
            {activeTrips.map(trip => {
              const progress = (trip.spent / trip.budget) * 100;
              const isOverBudget = trip.spent > trip.budget;
              
              return (
                <TouchableOpacity key={trip.id} style={[styles.tripCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <LinearGradient
                    colors={trip.gradient}
                    style={styles.tripGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.tripEmoji}>{trip.emoji}</Text>
                  </LinearGradient>
                  
                  <View style={styles.tripInfo}>
                    <Text style={[styles.tripName, { color: colors.text }]}>{trip.name}</Text>
                    <Text style={[styles.tripDates, { color: colors.textSecondary }]}>
                      {new Date(trip.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {new Date(trip.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                    
                    <View style={styles.budgetRow}>
                      <Text style={[styles.budgetText, { color: isOverBudget ? '#ef4444' : colors.text }]}>
                        ৳{trip.spent.toLocaleString('en-BD')} / ৳{trip.budget.toLocaleString('en-BD')}
                      </Text>
                      <Text style={[styles.progressPercent, { color: isOverBudget ? '#ef4444' : trip.gradient[0] }]}>
                        {Math.round(progress)}%
                      </Text>
                    </View>
                    
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                      <LinearGradient
                        colors={isOverBudget ? ['#ef4444', '#dc2626'] : trip.gradient}
                        style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Completed Trips */}
        {completedTrips.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>✅ Completed Trips</Text>
            {completedTrips.map(trip => (
              <TouchableOpacity key={trip.id} style={[styles.completedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={styles.completedEmoji}>{trip.emoji}</Text>
                <View style={styles.completedInfo}>
                  <Text style={[styles.completedName, { color: colors.text }]}>{trip.name}</Text>
                  <Text style={[styles.completedDate, { color: colors.textSecondary }]}>
                    {new Date(trip.endDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <Text style={[styles.completedAmount, { color: colors.text }]}>
                  ৳{trip.spent.toLocaleString('en-BD')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty State */}
        {trips.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>✈️</Text>
            <Text style={[styles.emptyText, { color: colors.text }]}>No trips yet</Text>
            <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
              Plan your first adventure!
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Trip FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setDestinationModalVisible(true);
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }}
      >
        <LinearGradient colors={['#00D4A1', '#4CAF50']} style={styles.fabGradient}>
          <Icon name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Destination Selection Modal */}
      <Modal
        visible={destinationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDestinationModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setDestinationModalVisible(false)}
          />
          <View style={[styles.destinationModal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Where to? 🗺️</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Popular destinations in Bangladesh
            </Text>
            
            <ScrollView style={styles.destinationsGrid} showsVerticalScrollIndicator={false}>
              {BD_DESTINATIONS.map(dest => (
                <TouchableOpacity
                  key={dest.name}
                  style={[styles.destinationCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => handleSelectDestination(dest)}
                >
                  <LinearGradient
                    colors={dest.gradient}
                    style={styles.destinationGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.destinationEmoji}>{dest.emoji}</Text>
                  </LinearGradient>
                  <Text style={[styles.destinationName, { color: colors.text }]}>{dest.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create Trip Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedDestination?.emoji} Plan Your Trip
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedDestination?.name === 'Custom Trip' && (
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder="Trip Name"
                  placeholderTextColor={colors.textSecondary}
                  value={tripName}
                  onChangeText={setTripName}
                />
              )}

              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Budget (৳)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={budget}
                onChangeText={setBudget}
              />

              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Start Date (YYYY-MM-DD)"
                placeholderTextColor={colors.textSecondary}
                value={startDate}
                onChangeText={setStartDate}
              />

              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="End Date (YYYY-MM-DD)"
                placeholderTextColor={colors.textSecondary}
                value={endDate}
                onChangeText={setEndDate}
              />

              <TouchableOpacity style={styles.createButton} onPress={handleCreateTrip}>
                <LinearGradient colors={['#00D4A1', '#4CAF50']} style={styles.createButtonGradient}>
                  <Text style={styles.createButtonText}>Create Trip</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  header: { padding: 20, paddingTop: 60 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  headerSubtitle: { fontSize: 14 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  tripCard: { flexDirection: 'row', padding: 16, borderRadius: 16, borderWidth: 2, marginBottom: 12 },
  tripGradient: { width: 60, height: 60, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  tripEmoji: { fontSize: 32 },
  tripInfo: { flex: 1, marginLeft: 12 },
  tripName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  tripDates: { fontSize: 12, marginBottom: 8 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  budgetText: { fontSize: 14, fontWeight: '600' },
  progressPercent: { fontSize: 16, fontWeight: 'bold' },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  completedCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  completedEmoji: { fontSize: 24, marginRight: 12 },
  completedInfo: { flex: 1 },
  completedName: { fontSize: 16, fontWeight: '600' },
  completedDate: { fontSize: 12 },
  completedAmount: { fontSize: 16, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  emptyHint: { fontSize: 14 },
  fab: { position: 'absolute', bottom: 30, right: 30, borderRadius: 30, shadowColor: '#00D4A1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  fabGradient: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' },
  destinationModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  modalSubtitle: { fontSize: 14, marginBottom: 20 },
  destinationsGrid: { maxHeight: 400 },
  destinationCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 2, marginBottom: 12 },
  destinationGradient: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  destinationEmoji: { fontSize: 24 },
  destinationName: { fontSize: 16, fontWeight: '600' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  input: { padding: 16, borderRadius: 12, borderWidth: 2, marginBottom: 16, fontSize: 16 },
  createButton: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  createButtonGradient: { padding: 18, alignItems: 'center' },
  createButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
