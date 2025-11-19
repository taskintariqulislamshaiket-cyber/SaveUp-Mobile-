import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePet } from '../../src/contexts/PetContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import PetDisplay from '../../src/components/pet/PetDisplay';
import GemCounter from '../../src/components/pet/GemCounter';
import PetSelector from '../../src/components/pet/PetSelector';
import Icon from '../../src/components/Icon';
import { PetType } from '../../src/types/pet';
import { GEM_SPENDING_RULES } from '../../src/utils/pet/gemCalculator';
import { getAllUnlockStatuses } from '../../src/utils/pet/unlockSystem';
import { getPetConfig } from '../../src/utils/pet/petConfig';

export default function PetTab() {
  const { colors } = useTheme();
  const { petState, achievements, feedPet, selectPet, loading } = usePet();
  const [refreshing, setRefreshing] = useState(false);
  const [showPetSelector, setShowPetSelector] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleFeedPet = async () => {
    if (!petState) return;

    if (petState.gems < GEM_SPENDING_RULES.FEED_PET) {
      Alert.alert(
        'Not Enough Gems! 💎',
        `You need ${GEM_SPENDING_RULES.FEED_PET} gems to feed your pet. You have ${petState.gems} gems.`
      );
      return;
    }

    try {
      await feedPet();
      Alert.alert('Yum! 😋', 'Your pet loved the food! Happiness and energy restored.');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleChangePet = async (newPet: PetType) => {
    try {
      await selectPet(newPet);
      setShowPetSelector(false);
      Alert.alert('Pet Changed! ✨', `You're now with ${getPetConfig(newPet).name}!`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading || !petState || !achievements) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your pet... 🐾</Text>
        </View>
      </View>
    );
  }

  const unlockStatuses = getAllUnlockStatuses(petState.unlockedPets, achievements);
  const unlockedCount = unlockStatuses.filter(s => s.isUnlocked).length;
  const totalPets = unlockStatuses.length;
  const petConfig = getPetConfig(petState.currentPet);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Your Pet 🐾</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {unlockedCount}/{totalPets} pets unlocked
              </Text>
            </View>
            <GemCounter size="medium" />
          </View>

          {/* Pet Display */}
          <View style={styles.petDisplayContainer}>
            <PetDisplay size="large" showStats={true} interactive={false} />
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleFeedPet}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#00D4A1', '#4CAF50']} style={styles.actionButtonGradient}>
                <Text style={styles.actionIcon}>🍎</Text>
                <Text style={styles.actionText}>Feed Pet</Text>
                <Text style={styles.actionCost}>💎 {GEM_SPENDING_RULES.FEED_PET}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowPetSelector(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.actionButtonSolid, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={styles.actionIcon}>🔄</Text>
                <Text style={[styles.actionText, { color: colors.text }]}>Change Pet</Text>
                <Text style={[styles.actionCost, { color: colors.primary }]}>{unlockedCount} available</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Pet Info Card */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.infoCardHeader}>
              <Icon name="information-circle" size={20} color={colors.primary} />
              <Text style={[styles.infoCardTitle, { color: colors.text }]}>
                About {petConfig.name}
              </Text>
            </View>
            <Text style={[styles.infoCardDescription, { color: colors.textSecondary }]}>
              {petConfig.description}
            </Text>
            <View style={[styles.bonusContainer, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
              <Icon name="star" size={16} color={colors.primary} />
              <Text style={[styles.bonusText, { color: colors.text }]}>
                {petConfig.bonusDescription}
              </Text>
            </View>
          </View>

          {/* XP Progress */}
          <View style={[styles.xpCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.xpHeader}>
              <Text style={[styles.xpTitle, { color: colors.text }]}>Level {petState.petLevel}</Text>
              <Text style={[styles.xpValue, { color: colors.primary }]}>{petState.petXP} XP</Text>
            </View>
            <View style={[styles.xpBarContainer, { backgroundColor: colors.border }]}>
              <LinearGradient
                colors={['#00D4A1', '#4CAF50']}
                style={[styles.xpBar, { width: `${Math.min(100, (petState.petXP % 1000) / 10)}%` }]}
              />
            </View>
            <Text style={[styles.xpSubtitle, { color: colors.textSecondary }]}>
              Track expenses to earn XP!
            </Text>
          </View>

          {/* Unlock Progress */}
          <View style={styles.unlockSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Unlock More Pets 🔓</Text>
            {unlockStatuses
              .filter(status => !status.isUnlocked)
              .slice(0, 3)
              .map(status => {
                const unlockPetConfig = getPetConfig(status.petType);
                return (
                  <View key={status.petType} style={[styles.unlockCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.unlockHeader}>
                      <Text style={styles.unlockEmoji}>{unlockPetConfig.emoji}</Text>
                      <View style={styles.unlockInfo}>
                        <Text style={[styles.unlockName, { color: colors.text }]}>{unlockPetConfig.name}</Text>
                        <Text style={[styles.unlockRequirement, { color: colors.textSecondary }]}>
                          {status.requirement}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
                      <LinearGradient
                        colors={['#00D4A1', '#4CAF50']}
                        style={[styles.progressBar, { width: `${status.progress}%` }]}
                      />
                    </View>
                    <Text style={[styles.progressText, { color: colors.primary }]}>
                      {status.progress}% complete
                    </Text>
                  </View>
                );
              })}
          </View>

          {/* Tips */}
          <View style={[styles.tipsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.tipsTitle, { color: colors.text }]}>💡 Pet Care Tips</Text>
            <Text style={[styles.tipItem, { color: colors.textSecondary }]}>
              • Feed your pet regularly to keep happiness high
            </Text>
            <Text style={[styles.tipItem, { color: colors.textSecondary }]}>
              • Stay under budget to make your pet happy
            </Text>
            <Text style={[styles.tipItem, { color: colors.textSecondary }]}>
              • Track expenses daily to earn XP and level up
            </Text>
            <Text style={[styles.tipItem, { color: colors.textSecondary }]}>
              • Complete goals to unlock rare pets
            </Text>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Pet Selector Modal */}
      <PetSelector
        visible={showPetSelector}
        onClose={() => setShowPetSelector(false)}
        onSelect={handleChangePet}
        title="Switch Your Pet"
        subtitle="Choose from your unlocked pets"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18 },
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerTitle: { fontSize: 32, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 14, marginTop: 4 },
  petDisplayContainer: { alignItems: 'center', marginBottom: 32 },
  actionsContainer: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionButton: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  actionButtonGradient: { padding: 16, alignItems: 'center', gap: 4 },
  actionButtonSolid: { padding: 16, alignItems: 'center', gap: 4, borderRadius: 16, borderWidth: 1 },
  actionIcon: { fontSize: 32 },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  actionCost: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 12 },
  infoCard: { borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1 },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  infoCardTitle: { fontSize: 18, fontWeight: 'bold' },
  infoCardDescription: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  bonusContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  bonusText: { flex: 1, fontSize: 13, fontWeight: '600' },
  xpCard: { borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1 },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  xpTitle: { fontSize: 18, fontWeight: 'bold' },
  xpValue: { fontSize: 16, fontWeight: '600' },
  xpBarContainer: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  xpBar: { height: '100%', borderRadius: 4 },
  xpSubtitle: { fontSize: 12 },
  unlockSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  unlockCard: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  unlockHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  unlockEmoji: { fontSize: 40 },
  unlockInfo: { flex: 1 },
  unlockName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  unlockRequirement: { fontSize: 12 },
  progressBarContainer: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressBar: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 11, fontWeight: '600' },
  tipsCard: { borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1 },
  tipsTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  tipItem: { fontSize: 14, lineHeight: 22, marginBottom: 8 },
});
