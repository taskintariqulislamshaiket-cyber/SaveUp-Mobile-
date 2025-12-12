import { Tabs, useRouter, Redirect } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Platform } from 'react-native';
import Icon from '../../src/components/Icon';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import * as Haptics from 'expo-haptics';

export default function TabLayout() {
  const { colors } = useTheme();
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  
  // Redirect if profile incomplete
  if (!loading && user && userProfile) {
    if (!userProfile.profileComplete) {
      return <Redirect href="/profile-setup" />;
    }
    if (!userProfile.moneyPersonality && !userProfile.quizCompleted) {
      return <Redirect href="/quiz" />;
    }
  }

  return (
    <Tabs 
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 65,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
      screenListeners={{
        tabPress: async (e) => {
          if (Platform.OS !== 'web') {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        },
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Animated.View style={{ transform: [{ scale: focused ? 1.1 : 1.0 }] }}>
              <Icon name={focused ? "home" : "home-outline"} size={size} color={color} />
            </Animated.View>
          ),
        }} 
      />
      
      <Tabs.Screen 
        name="expenses" 
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color, size, focused }) => (
            <Animated.View style={{ transform: [{ scale: focused ? 1.1 : 1.0 }] }}>
              <Icon name={focused ? "wallet" : "wallet-outline"} size={size} color={color} />
            </Animated.View>
          ),
        }} 
      />
      
      <Tabs.Screen 
        name="trips" 
        options={{
          title: 'Trips',
          tabBarIcon: ({ color, size, focused }) => (
            <Animated.View style={{ transform: [{ scale: focused ? 1.1 : 1.0 }] }}>
              <Icon name={focused ? "airplane" : "airplane-outline"} size={size} color={color} />
            </Animated.View>
          ),
        }} 
      />
      
      <Tabs.Screen 
        name="pet" 
        options={{
          title: 'Pet',
          tabBarIcon: ({ color, size, focused }) => (
            <Animated.View style={{ transform: [{ scale: focused ? 1.1 : 1.0 }] }}>
              <Icon name={focused ? "paw" : "paw-outline"} size={size} color={color} />
            </Animated.View>
          ),
        }} 
      />
      
      <Tabs.Screen 
        name="goals" 
        options={{
          title: 'Goals',
          tabBarIcon: ({ color, size, focused }) => (
            <Animated.View style={{ transform: [{ scale: focused ? 1.1 : 1.0 }] }}>
              <Icon name={focused ? "trophy" : "trophy-outline"} size={size} color={color} />
            </Animated.View>
          ),
        }} 
      />
      
      <Tabs.Screen 
        name="insights" 
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size, focused }) => (
            <Animated.View style={{ transform: [{ scale: focused ? 1.1 : 1.0 }] }}>
              <Icon name={focused ? "bulb" : "bulb-outline"} size={size} color={color} />
            </Animated.View>
          ),
        }} 
      />
      
      <Tabs.Screen 
        name="profile" 
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Animated.View style={{ transform: [{ scale: focused ? 1.1 : 1.0 }] }}>
              <Icon name={focused ? "person" : "person-outline"} size={size} color={color} />
            </Animated.View>
          ),
        }} 
      />
    </Tabs>
  );
}
