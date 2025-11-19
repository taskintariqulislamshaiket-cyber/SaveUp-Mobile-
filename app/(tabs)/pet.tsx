import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
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

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh will happen automatically via Firestore listeners
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleFeedPet = async () => {
    if (!petState) return;

    if (petState.gems < GEM_SPENDING_RULES.FEED_PET) {
      Alert.alert(
        'Not Enough Gems! 💎',
        `You need ${GEM_SPENDING_RULES.FEED_PET} gems to feed your pet. You have ${petState.gems} gems.`,
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await feedPet();
      Alert.alert(
        'Yum! 😋',
        'Your pet loved the food! Happiness and energy restored.',
        [{ text: 'Great!' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleChangePet = async (newPet: PetType) => {
    try {
      await selectPet(newPet);
      Alert.alert(
        'Pet Changed! ✨',
        `You're now with ${getPetConfig(newPet).name}!`,
        [{ text: 'Awesome!' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading || !petState || !achievements) {
    return (
      <LinearGradient colors={[colors.background, colors.cardBackground]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your pet... 🐾</Text>
        </View>
      </LinearGradient>
    );
  }

  const unlockStatuses = getAllUnlockStatuses(petState.unlockedPets, achievements);
  const unlockedCount = unlockStatuses.filter(s => s.isUnlocked).length;
  const totalPets = unlockStatuses.length;

  return (
    <LinearGradient colors={[colors.background, colors.cardBackground]} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Your Pet 🐾</Text>
            <Text style={styles.headerSubtitle}>
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
            <LinearGradient colors={['#ec4899', '#f43f5e']} style={styles.actionButtonGradient}>
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
            <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.actionButtonGradient}>
              <Text style={styles.actionIcon}>🔄</Text>
              <Text style={styles.actionText}>Change Pet</Text>
              <Text style={styles.actionCost}>{unlockedCount} available</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Pet Info Card */}
        <View style={styles.infoCard}>
          <LinearGradient
            colors={getPetConfig(petState.currentPet).gradient}
            style={styles.infoCardGradient}
          >
            <Text style={styles.infoCardTitle}>About {getPetConfig(petState.currentPet).name}</Text>
            <Text style={styles.infoCardDescription}>
              {getPetConfig(petState.currentPet).description}
            </Text>
            <View style={styles.bonusContainer}>
              <Icon name="star" size={16} color="#fbbf24" />
              <Text style={styles.bonusText}>
                {getPetConfig(petState.currentPet).bonusDescription}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* XP Progress */}
        <View style={styles.xpCard}>
          <View style={styles.xpHeader}>
            <Text style={styles.xpTitle}>Level {petState.petLevel}</Text>
            <Text style={styles.xpValue}>{petState.petXP} XP</Text>
          </View>
          <View style={styles.xpBarContainer}>
            <View
              style={[
                styles.xpBar,
                {
                  width: `${Math.min(
                    100,
                    (petState.petXP % 1000) / 10
                  )}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.xpSubtitle}>Track expenses to earn XP!</Text>
        </View>

        {/* Unlock Progress */}
        <View style={styles.unlockSection}>
          <Text style={styles.sectionTitle}>Unlock More Pets 🔓</Text>
          {unlockStatuses
            .filter(status => !status.isUnlocked)
            .slice(0, 3)
            .map(status => {
              const petConfig = getPetConfig(status.petType);
              return (
                <View key={status.petType} style={styles.unlockCard}>
                  <View style={styles.unlockHeader}>
                    <Text style={styles.unlockEmoji}>{petConfig.emoji}</Text>
                    <View style={styles.unlockInfo}>
                      <Text style={styles.unlockName}>{petConfig.name}</Text>
                      <Text style={styles.unlockRequirement}>{status.requirement}</Text>
                    </View>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${status.progress}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{status.progress}% complete</Text>
                </View>
              );
            })}
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Pet Care Tips</Text>
          <Text style={styles.tipItem}>• Feed your pet regularly to keep happiness high</Text>
          <Text style={styles.tipItem}>• Stay under budget to make your pet happy</Text>
          <Text style={styles.tipItem}>• Track expenses daily to earn XP and level up</Text>
          <Text style={styles.tipItem}>• Complete goals to unlock rare pets</Text>
        </View>
      </ScrollView>

      {/* Pet Selector Modal */}
      <PetSelector
        visible={showPetSelector}
        onClose={() => setShowPetSelector(false)}
        onSelect={handleChangePet}
        title="Switch Your Pet"
        subtitle="Choose from your unlocked pets"
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 18,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 40,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  petDisplayContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 32,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionCost: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  infoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  infoCardGradient: {
    padding: 20,
  },
  infoCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  infoCardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    marginBottom: 12,
  },
  bonusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 12,
  },
  bonusText: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  xpCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  xpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  xpValue: {
    fontSize: 16,
    color: '#00D4A1',
    fontWeight: '600',
  },
  xpBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  xpBar: {
    height: '100%',
    backgroundColor: '#00D4A1',
    borderRadius: 4,
  },
  xpSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  unlockSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  unlockCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  unlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  unlockEmoji: {
    fontSize: 40,
  },
  unlockInfo: {
    flex: 1,
  },
  unlockName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  unlockRequirement: {
    fontSize: 12,
    color: '#94a3b8',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00D4A1',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: '#00D4A1',
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  tipItem: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 22,
    marginBottom: 8,
  },
});
