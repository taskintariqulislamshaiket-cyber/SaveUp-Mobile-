import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Rect, Path } from 'react-native-svg';

interface WalletIconProps {
  size?: number;
}

export default function WalletIcon({ size = 100 }: WalletIconProps) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Circle cx="60" cy="60" r="60" fill="#00D4A1" />
        <Rect x="25" y="45" width="70" height="45" rx="6" fill="#B8764F" />
        <Path d="M 25 52 L 95 52" stroke="#8B5A3C" strokeWidth="1.5" />
        <Path d="M 25 55 L 95 55" stroke="#8B5A3C" strokeWidth="0.5" />
        <Rect x="30" y="35" width="35" height="22" rx="2" fill="#1e3a5f" />
        <Rect x="34" y="42" width="10" height="8" rx="1" fill="#FFD700" />
        <Path d="M 30 44 L 65 44" stroke="#0a1f3d" strokeWidth="3" />
        <Circle cx="78" cy="67" r="8" fill="#FFD700" />
        <Circle cx="78" cy="67" r="6" fill="#FFA500" />
        <Path d="M 34 51 L 55 51" stroke="#4a6fa5" strokeWidth="1" />
        <Path d="M 34 54 L 48 54" stroke="#4a6fa5" strokeWidth="1" />
      </Svg>
    </View>
  );
}
