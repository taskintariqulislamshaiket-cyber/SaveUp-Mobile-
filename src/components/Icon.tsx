import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

// ✅ ALWAYS use Ionicons - no emoji fallbacks
export default function Icon({ name, size = 24, color = '#fff', style }: IconProps) {
  return <Ionicons name={name as any} size={size} color={color} style={style} />;
}
