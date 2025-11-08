import React from 'react';
import { Platform, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

// Emoji fallbacks - GUARANTEED to work everywhere
const EMOJI_ICONS: Record<string, string> = {
  'home': '🏠',
  'receipt': '🧾',
  'trophy': '🏆',
  'bulb': '💡',
  'person': '👤',
  'add': '➕',
  'close': '✕',
  'close-circle': '❌',
  'arrow-forward': '→',
  'checkmark': '✓',
  'checkmark-circle': '✅',
  'fast-food': '🍔',
  'car': '🚗',
  'cart': '🛒',
  'game-controller': '🎮',
  'fitness': '💪',
  'ellipsis-horizontal': '⋯',
  'wallet': '💰',
  'cash': '💵',
  'create': '✏️',
  'trash-outline': '🗑️',
  'mail': '📧',
  'lock-closed': '🔒',
  'eye': '👁️',
  'eye-off': '🙈',
  'logo-google': '🔵',
  'alert-circle': '⚠️',
  'flash': '⚡',
  'warning': '⚠️',
  'chatbubbles': '💬',
  'rocket': '🚀',
  'sad-outline': '😢',
};

export default function Icon({ name, size = 24, color = '#fff', style }: IconProps) {
  // Mobile: Use Ionicons
  if (Platform.OS !== 'web') {
    return <Ionicons name={name as any} size={size} color={color} style={style} />;
  }

  // Web: Use emoji (ALWAYS works)
  const emoji = EMOJI_ICONS[name] || '•';
  
  return (
    <View style={[{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }, style]}>
      <Text style={{ fontSize: size * 0.8, lineHeight: size }}>{emoji}</Text>
    </View>
  );
}
