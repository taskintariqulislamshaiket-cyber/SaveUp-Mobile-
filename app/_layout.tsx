import { Stack } from 'expo-router';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" />
          <Stack.Screen name="quiz" />
          <Stack.Screen name="profile-setup" />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
