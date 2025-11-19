import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePet } from '../../contexts/PetContext';
import { getPetConfig } from '../../utils/pet/petConfig';
import { getMoodAnimation, getMoodFilter } from '../../utils/pet/moodEngine';

interface PetDisplayProps {
  size?: 'small' | 'medium' | 'large';
  showStats?: boolean;
  interactive?: boolean;
  onPress?: () => void;
}

export default function PetDisplay({ 
  size = 'medium', 
  showStats = true, 
  interactive = true,
  onPress 
}: PetDisplayProps) {
  const { petState } = usePet();
  
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!petState) return;

    const animation = getMoodAnimation(petState.moodState);

    // Different animations based on mood
    if (animation === 'bounce') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -20,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else if (animation === 'droop') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 0.95,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else if (animation === 'breathe') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else if (animation === 'jump') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -30,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    return () => {
      bounceAnim.stopAnimation();
      scaleAnim.stopAnimation();
      rotateAnim.stopAnimation();
    };
  }, [petState?.moodState]);

  if (!petState) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading pet...</Text>
      </View>
    );
  }

  const petConfig = getPetConfig(petState.currentPet);
  const filter = getMoodFilter(petState.moodState);
  
  const sizeStyles = {
    small: { fontSize: 60, containerSize: 120 },
    medium: { fontSize: 100, containerSize: 180 },
    large: { fontSize: 140, containerSize: 240 },
  };

  const currentSize = sizeStyles[size];

  return (
    <TouchableOpacity 
      activeOpacity={interactive ? 0.8 : 1} 
      onPress={onPress}
      disabled={!interactive}
    >
      <View style={[styles.container, { width: currentSize.containerSize, height: currentSize.containerSize }]}>
        <LinearGradient
          colors={['#00D4A1', '#4CAF50']}
          style={[styles.petCircle, { width: currentSize.containerSize, height: currentSize.containerSize }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.View
            style={{
              transform: [
                { translateY: bounceAnim },
                { scale: scaleAnim },
              ],
            }}
          >
            <Text 
              style={[
                styles.petEmoji, 
                { fontSize: currentSize.fontSize },
                petState.moodState === 'sad' && styles.sadFilter,
                petState.moodState === 'sleeping' && styles.sleepingFilter,
              ]}
            >
              {petConfig.emoji}
            </Text>
          </Animated.View>

          {/* Mood indicator */}
          <View style={styles.moodIndicator}>
            <Text style={styles.moodEmoji}>
              {petState.moodState === 'happy' && '😊'}
              {petState.moodState === 'neutral' && '😐'}
              {petState.moodState === 'sad' && '😢'}
              {petState.moodState === 'sleeping' && '😴'}
              {petState.moodState === 'excited' && '🤩'}
            </Text>
          </View>

          {/* Level badge */}
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Lv.{petState.petLevel}</Text>
          </View>
        </LinearGradient>

        {/* Pet name */}
        <Text style={styles.petName}>{petConfig.name}</Text>
        <Text style={styles.petPersonality}>{petConfig.personality}</Text>

        {/* Stats bars */}
        {showStats && (
          <View style={styles.statsContainer}>
            {/* Happiness bar */}
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>💝 Happiness</Text>
              <View style={styles.statBarContainer}>
                <View style={[styles.statBar, { width: `${petState.happiness}%`, backgroundColor: '#ec4899' }]} />
              </View>
              <Text style={styles.statValue}>{petState.happiness}%</Text>
            </View>

            {/* Energy bar */}
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>⚡ Energy</Text>
              <View style={styles.statBarContainer}>
                <View style={[styles.statBar, { width: `${petState.energy}%`, backgroundColor: '#f59e0b' }]} />
              </View>
              <Text style={styles.statValue}>{petState.energy}%</Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    color: '#94a3b8',
    fontSize: 16,
  },
  petCircle: {
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    position: 'relative',
  },
  petEmoji: {
    textAlign: 'center',
  },
  sadFilter: {
    opacity: 0.7,
  },
  sleepingFilter: {
    opacity: 0.6,
  },
  moodIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 20,
  },
  levelBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  levelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  petName: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  petPersonality: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  statsContainer: {
    marginTop: 20,
    width: '100%',
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    width: 100,
  },
  statBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  statBar: {
    height: '100%',
    borderRadius: 4,
  },
  statValue: {
    fontSize: 12,
    color: '#94a3b8',
    width: 40,
    textAlign: 'right',
  },
});
