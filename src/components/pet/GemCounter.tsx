import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePet } from '../../contexts/PetContext';

interface GemCounterProps {
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
}

export default function GemCounter({ size = 'medium', onPress }: GemCounterProps) {
  const { petState } = usePet();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const previousGems = useRef(petState?.gems || 0);

  useEffect(() => {
    if (!petState) return;

    // Animate when gems change
    if (petState.gems !== previousGems.current) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      previousGems.current = petState.gems;
    }
  }, [petState?.gems]);

  if (!petState) return null;

  const sizeStyles = {
    small: { fontSize: 16, padding: 8, gemSize: 20 },
    medium: { fontSize: 20, padding: 12, gemSize: 24 },
    large: { fontSize: 28, padding: 16, gemSize: 32 },
  };

  const currentSize = sizeStyles[size];

  return (
    <TouchableOpacity activeOpacity={onPress ? 0.8 : 1} onPress={onPress} disabled={!onPress}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <LinearGradient
          colors={['#a855f7', '#ec4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.container, { padding: currentSize.padding }]}
        >
          <Text style={[styles.gemIcon, { fontSize: currentSize.gemSize }]}>💎</Text>
          <Text style={[styles.gemCount, { fontSize: currentSize.fontSize }]}>
            {petState.gems.toLocaleString()}
          </Text>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    gap: 8,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  gemIcon: {
    lineHeight: 32,
  },
  gemCount: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
