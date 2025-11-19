import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePet } from '../../contexts/PetContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getPetConfig } from '../../utils/pet/petConfig';

interface PetDisplayProps {
  size?: 'small' | 'medium' | 'large';
  showStats?: boolean;
  interactive?: boolean;
}

export default function PetDisplay({ 
  size = 'medium', 
  showStats = false 
}: PetDisplayProps) {
  const { petState } = usePet();
  const { colors } = useTheme();

  if (!petState) return null;

  const petConfig = getPetConfig(petState.currentPet);

  const sizeStyles = {
    small: { container: 80, emoji: 40, badge: 16 },
    medium: { container: 120, emoji: 60, badge: 20 },
    large: { container: 180, emoji: 90, badge: 24 },
  };

  const currentSize = sizeStyles[size];

  const getMoodEmoji = () => {
    if (petState.mood === 'happy') return '😊';
    if (petState.mood === 'sad') return '😢';
    if (petState.mood === 'angry') return '😠';
    return '😐';
  };

  const getHappinessColor = () => {
    if (petState.happiness >= 80) return '#4CAF50';
    if (petState.happiness >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getEnergyColor = () => {
    if (petState.energy >= 80) return '#00D4A1';
    if (petState.energy >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#00D4A1', '#4CAF50']}
        style={[styles.petCircle, { width: currentSize.container, height: currentSize.container }]}
      >
        <Text style={[styles.petEmoji, { fontSize: currentSize.emoji }]}>{petConfig.emoji}</Text>
        <View style={[styles.moodBadge, { width: currentSize.badge * 1.5, height: currentSize.badge * 1.5 }]}>
          <Text style={{ fontSize: currentSize.badge }}>{getMoodEmoji()}</Text>
        </View>
        <View style={[styles.levelBadge, { backgroundColor: colors.surface }]}>
          <Text style={[styles.levelText, { color: colors.text }]}>Lv.{petState.petLevel}</Text>
        </View>
      </LinearGradient>

      <Text style={[styles.petName, { color: colors.text }]}>{petConfig.name}</Text>
      <Text style={[styles.petPersonality, { color: colors.textSecondary }]}>{petConfig.personality}</Text>

      {showStats && (
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Text style={styles.statIcon}>😊</Text>
            <View style={styles.statInfo}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Happiness</Text>
              <View style={[styles.statBarContainer, { backgroundColor: colors.border }]}>
                <View style={[styles.statBar, { width: `${petState.happiness}%`, backgroundColor: getHappinessColor() }]} />
              </View>
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{petState.happiness}%</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statIcon}>⚡</Text>
            <View style={styles.statInfo}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Energy</Text>
              <View style={[styles.statBarContainer, { backgroundColor: colors.border }]}>
                <View style={[styles.statBar, { width: `${petState.energy}%`, backgroundColor: getEnergyColor() }]} />
              </View>
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{petState.energy}%</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  petCircle: { borderRadius: 999, justifyContent: 'center', alignItems: 'center', shadowColor: '#00D4A1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  petEmoji: { fontWeight: 'bold' },
  moodBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 999, justifyContent: 'center', alignItems: 'center' },
  levelBadge: { position: 'absolute', bottom: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  levelText: { fontSize: 12, fontWeight: 'bold' },
  petName: { fontSize: 24, fontWeight: 'bold', marginTop: 16 },
  petPersonality: { fontSize: 14, marginTop: 4 },
  statsContainer: { width: '100%', marginTop: 24, gap: 16 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIcon: { fontSize: 24 },
  statInfo: { flex: 1 },
  statLabel: { fontSize: 12, marginBottom: 6, fontWeight: '600' },
  statBarContainer: { height: 8, borderRadius: 4, overflow: 'hidden' },
  statBar: { height: '100%', borderRadius: 4 },
  statValue: { fontSize: 14, fontWeight: 'bold', minWidth: 45, textAlign: 'right' },
});
