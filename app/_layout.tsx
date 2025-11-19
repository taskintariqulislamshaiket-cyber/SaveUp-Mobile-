import { Stack } from 'expo-router';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { PetProvider } from '../src/contexts/PetContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PetProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" />
            <Stack.Screen name="quiz" />
            <Stack.Screen name="profile-setup" />
          </Stack>
        </PetProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
