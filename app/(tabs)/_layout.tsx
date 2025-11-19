import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import Icon from '../../src/components/Icon';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';

export default function TabLayout() {
  const { colors } = useTheme();
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      console.log('🔍 Tabs: Checking profile...', userProfile);
      
      // If profile not complete, go to profile-setup
      if (!userProfile?.profileComplete) {
        console.log('→ Tabs: Redirecting to profile-setup');
        router.replace('/profile-setup');
      }
      // If quiz not complete, go to quiz
      else if (!userProfile?.moneyPersonality && !userProfile?.quizCompleted) {
        console.log('→ Tabs: Redirecting to quiz');
        router.replace('/quiz');
      }
    }
  }, [user, userProfile, loading]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color, size }) => <Icon name="wallet" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="pet"
        options={{
          title: 'Pet',
          tabBarIcon: ({ color, size }) => <Icon name="paw" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: ({ color, size }) => <Icon name="trophy" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size }) => <Icon name="bulb" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Icon name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
