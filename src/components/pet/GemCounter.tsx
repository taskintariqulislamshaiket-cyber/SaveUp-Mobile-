import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePet } from '../../contexts/PetContext';
import { useTheme } from '../../contexts/ThemeContext';

interface GemCounterProps {
  size?: 'small' | 'medium' | 'large';
}

export default function GemCounter({ size = 'medium' }: GemCounterProps) {
  const { petState } = usePet();
  const { colors } = useTheme();

  if (!petState) return null;

  const sizeStyles = {
    small: {
      container: { paddingHorizontal: 12, paddingVertical: 6 },
      emoji: { fontSize: 16 },
      text: { fontSize: 14 },
    },
    medium: {
      container: { paddingHorizontal: 16, paddingVertical: 10 },
      emoji: { fontSize: 20 },
      text: { fontSize: 18 },
    },
    large: {
      container: { paddingHorizontal: 20, paddingVertical: 12 },
      emoji: { fontSize: 24 },
      text: { fontSize: 22 },
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <LinearGradient
      colors={['#00D4A1', '#4CAF50']}
      style={[styles.container, currentSize.container]}
    >
      <Text style={[styles.emoji, currentSize.emoji]}>💎</Text>
      <Text style={[styles.count, currentSize.text]}>{petState.gems}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    gap: 6,
    shadowColor: '#00D4A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emoji: {
    fontWeight: 'bold',
  },
  count: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
