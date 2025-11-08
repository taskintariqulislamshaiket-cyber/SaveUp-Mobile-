import React from 'react';
import { Platform, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Emoji fallbacks for web
const ICON_MAP: Record<string, string> = {
  // Navigation/UI
  'home': '🏠',
  'receipt': '🧾',
  'trophy': '🏆',
  'bulb': '💡',
  'person': '👤',
  'add': '➕',
  'close-circle': '❌',
  'arrow-forward': '→',
  'arrow-back': '←',
  'checkmark': '✓',
  'checkmark-circle': '✓',
  'close': '✕',
  
  // Expense categories
  'fast-food': '��',
  'car': '🚗',
  'cart': '🛒',
  'game-controller': '🎮',
  'fitness': '💪',
  'ellipsis-horizontal': '⋯',
  
  // Finance
  'wallet': '💰',
  'cash': '💵',
  'create': '✏️',
  'trash-outline': '��️',
  
  // Auth
  'mail': '📧',
  'lock-closed': '🔒',
  'eye': '👁️',
  'eye-off': '🙈',
  'logo-google': '🔵',
  'alert-circle': '⚠️',
  
  // Other
  'flash': '⚡',
  'warning': '⚠️',
  'chatbubbles': '💬',
  'rocket': '🚀',
  'sad-outline': '😢',
};

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

export default function Icon({ name, size = 24, color = '#fff', style }: IconProps) {
  // On mobile: use Ionicons (perfect support)
  if (Platform.OS !== 'web') {
    return <Ionicons name={name as any} size={size} color={color} style={style} />;
  }

  // On web: use emoji fallback
  const emoji = ICON_MAP[name] || '•';
  
  return (
    <View style={[styles.webIconContainer, style]}>
      <Text style={[styles.webIcon, { fontSize: size * 0.9, color }]}>
        {emoji}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  webIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  webIcon: {
    textAlign: 'center',
    lineHeight: undefined, // Let platform handle it
  },
});
