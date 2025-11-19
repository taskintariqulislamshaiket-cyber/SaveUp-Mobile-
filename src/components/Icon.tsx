import React from 'react';
import { Platform, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

const EMOJI_ICONS: Record<string, string> = {
  'home': '🏠',
  'receipt': '🧾',
  'trophy': '🏆',
  'bulb': '💡',
  'stats-chart': '📊',
  'person': '👤',
  'paw': '🐾',
  'add': '➕',
  'close': '✕',
  'cash': '💵',
  'wallet': '💳',
  'calendar': '📅',
  'trending-up': '📈',
  'lock-closed': '🔒',
  'card': '💳',
  'shield-checkmark': '🛡️',
  'log-out': '🚪',
  'information-circle': 'ℹ️',
  'star': '⭐',
  'swap-horizontal': '🔄',
  'fast-food': '🍔',
  'car': '🚗',
  'cart': '🛒',
  'game-controller': '��',
  'fitness': '💪',
  'ellipsis-horizontal': '⋯',
  'trash': '🗑️',
  'alert-circle': '⚠️',
  'arrow-forward': '→',
};

export default function Icon({ name, size = 24, color = '#000', style }: IconProps) {
  if (EMOJI_ICONS[name]) {
    return (
      <Text style={[{ fontSize: size, color }, style]}>
        {EMOJI_ICONS[name]}
      </Text>
    );
  }

  return <Ionicons name={name as any} size={size} color={color} style={style} />;
}
