import React from 'react';
import { Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Web-safe icons using react-icons
let ReactIcons: any = null;
if (Platform.OS === 'web') {
  try {
    const io5 = require('react-icons/io5');
    ReactIcons = {
      IoHome: io5.IoHome,
      IoReceipt: io5.IoReceipt,
      IoTrophy: io5.IoTrophy,
      IoBulb: io5.IoBulb,
      IoPerson: io5.IoPerson,
      IoAdd: io5.IoAdd,
      IoClose: io5.IoClose,
      IoCloseCircle: io5.IoCloseCircle,
      IoArrowForward: io5.IoArrowForward,
      IoCheckmark: io5.IoCheckmark,
      IoCheckmarkCircle: io5.IoCheckmarkCircle,
      IoFastFood: io5.IoFastFood,
      IoCar: io5.IoCar,
      IoCart: io5.IoCart,
      IoGameController: io5.IoGameController,
      IoFitness: io5.IoFitness,
      IoEllipsisHorizontal: io5.IoEllipsisHorizontal,
      IoWallet: io5.IoWallet,
      IoCash: io5.IoCash,
      IoCreate: io5.IoCreate,
      IoTrashOutline: io5.IoTrashOutline,
      IoMail: io5.IoMail,
      IoLockClosed: io5.IoLockClosed,
      IoEye: io5.IoEye,
      IoEyeOff: io5.IoEyeOff,
      IoLogoGoogle: io5.IoLogoGoogle,
      IoAlertCircle: io5.IoAlertCircle,
      IoFlash: io5.IoFlash,
      IoWarning: io5.IoWarning,
      IoChatbubbles: io5.IoChatbubbles,
      IoRocket: io5.IoRocket,
      IoSadOutline: io5.IoSadOutline,
    };
  } catch (e) {
    console.error('Failed to load react-icons:', e);
  }
}

const iconMap: Record<string, string> = {
  'home': 'IoHome',
  'receipt': 'IoReceipt',
  'trophy': 'IoTrophy',
  'bulb': 'IoBulb',
  'person': 'IoPerson',
  'add': 'IoAdd',
  'close': 'IoClose',
  'close-circle': 'IoCloseCircle',
  'arrow-forward': 'IoArrowForward',
  'checkmark': 'IoCheckmark',
  'checkmark-circle': 'IoCheckmarkCircle',
  'fast-food': 'IoFastFood',
  'car': 'IoCar',
  'cart': 'IoCart',
  'game-controller': 'IoGameController',
  'fitness': 'IoFitness',
  'ellipsis-horizontal': 'IoEllipsisHorizontal',
  'wallet': 'IoWallet',
  'cash': 'IoCash',
  'create': 'IoCreate',
  'trash-outline': 'IoTrashOutline',
  'mail': 'IoMail',
  'lock-closed': 'IoLockClosed',
  'eye': 'IoEye',
  'eye-off': 'IoEyeOff',
  'logo-google': 'IoLogoGoogle',
  'alert-circle': 'IoAlertCircle',
  'flash': 'IoFlash',
  'warning': 'IoWarning',
  'chatbubbles': 'IoChatbubbles',
  'rocket': 'IoRocket',
  'sad-outline': 'IoSadOutline',
};

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

export default function Icon({ name, size = 24, color = '#fff', style }: IconProps) {
  // Mobile: Use Ionicons
  if (Platform.OS !== 'web') {
    return <Ionicons name={name as any} size={size} color={color} style={style} />;
  }

  // Web: Use react-icons
  const iconComponentName = iconMap[name];
  if (!iconComponentName || !ReactIcons) {
    return <View style={[{ width: size, height: size }, style]} />;
  }

  const IconComponent = ReactIcons[iconComponentName];
  if (!IconComponent) {
    return <View style={[{ width: size, height: size }, style]} />;
  }

  return (
    <View style={[{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }, style]}>
      <IconComponent size={size} color={color} />
    </View>
  );
}
