import React from 'react';
import { View } from 'react-native';
import Svg, { Rect, Path, Circle } from 'react-native-svg';

interface WalletIconProps {
  size?: number;
}

export default function WalletIcon({ size = 100 }: WalletIconProps) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size * 0.8} height={size * 0.8} viewBox="0 0 100 80">
        <Rect x="10" y="25" width="80" height="50" rx="6" fill="#B8764F" />
        <Path d="M 10 32 L 90 32" stroke="#8B5A3C" strokeWidth="1.5" />
        <Path d="M 10 35 L 90 35" stroke="#8B5A3C" strokeWidth="0.5" />
        <Rect x="15" y="12" width="38" height="24" rx="2" fill="#1e3a5f" />
        <Rect x="19" y="19" width="11" height="9" rx="1" fill="#FFD700" />
        <Path d="M 15 22 L 53 22" stroke="#0a1f3d" strokeWidth="3" />
        <Circle cx="72" cy="50" r="9" fill="#FFD700" />
        <Circle cx="72" cy="50" r="7" fill="#FFA500" />
        <Path d="M 19 29 L 43 29" stroke="#4a6fa5" strokeWidth="1" />
        <Path d="M 19 32 L 35 32" stroke="#4a6fa5" strokeWidth="1" />
      </Svg>
    </View>
  );
}
