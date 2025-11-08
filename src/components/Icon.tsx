import React from 'react';
import { Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Svg, Path, Circle, G } from 'react-native-svg';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

// Inline SVG paths for common icons (no external dependencies)
const SVG_ICONS: Record<string, (size: number, color: string) => JSX.Element> = {
  'home': (size, color) => (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
      <Path d="M261.56 101.28a8 8 0 00-11.06 0L66.4 277.15a8 8 0 00-2.47 5.79L63.9 448a32 32 0 0032 32H192a16 16 0 0016-16V328a8 8 0 018-8h80a8 8 0 018 8v136a16 16 0 0016 16h96.06a32 32 0 0032-32V282.94a8 8 0 00-2.47-5.79z" />
      <Path d="M490.91 244.15l-74.8-71.56V64a16 16 0 00-16-16h-48a16 16 0 00-16 16v32l-57.92-55.38C272.77 35.14 264.71 32 256 32c-8.68 0-16.72 3.14-22.14 8.63l-212.7 203.5c-6.22 6-7 15.87-1.34 22.37A16 16 0 0043 267.56L250.5 69.28a8 8 0 0111.06 0l207.52 198.28a16 16 0 0022.59-.44c6.14-6.36 5.63-16.86-.76-22.97z" />
    </Svg>
  ),
  'receipt': (size, color) => (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
      <Path d="M448 48L64 48 64 464 128 416 192 464 256 416 320 464 384 416 448 464 448 48z" stroke={color} strokeWidth="32" strokeLinejoin="round" fill="none"/>
      <Path d="M144 144h224M144 208h224M144 272h224M144 336h224" stroke={color} strokeWidth="32" strokeLinecap="round"/>
    </Svg>
  ),
  'trophy': (size, color) => (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
      <Path d="M464 80H400a16 16 0 00-16 16 48 48 0 01-32 45.26 32 32 0 00-21.26 30.74l-1.2 30.48a3.6 3.6 0 01-1.19 2.71c-8.74 7.42-18.24 14.2-28.27 20.13a16 16 0 0015.82 28 16 16 0 006.12-1.17c11.52-4.76 22.4-10.56 32.6-17.25 19.26-12.67 36.17-27.39 50.35-43.76 11.85-13.68 22.55-28.67 31.94-44.75A16 16 0 00464 128zM48 96a16 16 0 0016-16 48 48 0 0032-45.26A16 16 0 00112 16H48a16 16 0 00-16 16v48a16 16 0 0016 16z"/>
    </Svg>
  ),
  'wallet': (size, color) => (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
      <Path d="M95.5 104h320a87.73 87.73 0 0111.18.71 66 66 0 00-77.51-55.56L86 94.08h-.3a66 66 0 00-41.07 26.13A87.57 87.57 0 0195.5 104zM415.5 128h-320a64.07 64.07 0 00-64 64v192a64.07 64.07 0 0064 64h320a64.07 64.07 0 0064-64V192a64.07 64.07 0 00-64-64zM368 320a32 32 0 1132-32 32 32 0 01-32 32z"/>
    </Svg>
  ),
  'add': (size, color) => (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill="none" stroke={color}>
      <Path d="M256 112v288M400 256H112" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  ),
  'close-circle': (size, color) => (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
      <Path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm86.63 272L320 342.63l-64-64-64 64L169.37 320l64-64-64-64L192 169.37l64 64 64-64L342.63 192l-64 64z"/>
    </Svg>
  ),
  'arrow-forward': (size, color) => (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill="none" stroke={color}>
      <Path d="M268 112l144 144-144 144M392 256H100" strokeWidth="48" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  ),
  'checkmark': (size, color) => (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill="none" stroke={color}>
      <Path d="M416 128L192 384l-96-96" strokeWidth="44" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  ),
};

export default function Icon({ name, size = 24, color = '#fff', style }: IconProps) {
  // Mobile: Use Ionicons
  if (Platform.OS !== 'web') {
    return <Ionicons name={name as any} size={size} color={color} style={style} />;
  }

  // Web: Use inline SVG (guaranteed to work)
  const SvgIcon = SVG_ICONS[name];
  
  if (!SvgIcon) {
    // Fallback: simple circle
    return (
      <View style={[{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }, style]}>
        <Svg width={size} height={size} viewBox="0 0 512 512">
          <Circle cx="256" cy="256" r="200" fill={color} />
        </Svg>
      </View>
    );
  }

  return (
    <View style={[{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }, style]}>
      {SvgIcon(size, color)}
    </View>
  );
}
