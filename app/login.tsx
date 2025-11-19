import WalletIcon from '../src/components/WalletIcon';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../src/contexts/AuthContext';
import Icon from '../src/components/Icon';

const { width, height } = Dimensions.get('window');

export default function LoginPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const logoSpin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleAuth = async () => {
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setLoading(true);
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      if (isLogin) {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
      }

      await new Promise(resolve => setTimeout(resolve, 800));

      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      await signInWithGoogle();
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setError(err.message || 'Google Sign-In failed');
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsLogin(!isLogin);
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#0f172a', '#1e1b4b', '#1e293b']}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.backgroundCircles}>
          <Animated.View
            style={[styles.circle, styles.circle1, { transform: [{ rotate: logoSpin }] }]}
          />
          <Animated.View
            style={[styles.circle, styles.circle2, { transform: [{ rotate: logoSpin }] }]}
          />
        </View>

        <Animated.View
          style={[
            styles.headerContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <Animated.View style={[styles.logoContainer, { transform: [{ rotate: logoSpin }] }]}>
            <LinearGradient
              colors={['#00D4A1', '#4CAF50', '#8BD3C7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Text style={styles.walletEmoji}>💰</Text>
            </LinearGradient>
          </Animated.View>

          <Text style={styles.title}>SaveUp</Text>
          <Text style={styles.tagline}>
            {isLogin 
              ? 'Your money, your future, simplified.' 
              : 'Start your journey to financial freedom.'}
          </Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Welcome back! 👋' : 'Join thousands saving smarter ✨'}
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#fff', '#f3f4f6']}
              style={styles.googleGradient}
            >
              <Icon name="logo-google" size={24} color="#EA4335" />
              <Text style={styles.googleText}>
                {isLogin ? 'Sign in' : 'Sign up'} with Google
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="mail" size={20} color="#00D4A1" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#64748b"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock-closed" size={20} color="#00D4A1" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#64748b"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              returnKeyType={isLogin ? 'done' : 'next'}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Icon name={showPassword ? 'eye' : 'eye-off'} size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <Icon name="lock-closed" size={20} color="#00D4A1" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#64748b"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType="done"
              />
            </View>
          )}

          {error ? (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient 
                colors={['#00D4A1', '#4CAF50']} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 0 }} 
                style={styles.submitGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitText}>
                      {isLogin ? 'Sign In' : 'Create Account'}
                    </Text>
                    <Icon name="arrow-forward" size={20} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity onPress={toggleMode} style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <Text style={styles.toggleLink}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.footer}>
          🔒 Bank-level security • Your data stays private
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20, minHeight: height },
  backgroundCircles: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  circle: { position: 'absolute', borderRadius: 999, opacity: 0.05 },
  circle1: { width: 300, height: 300, backgroundColor: '#00D4A1', top: -100, right: -100 },
  circle2: { width: 200, height: 200, backgroundColor: '#4CAF50', bottom: -50, left: -50 },
  headerContainer: { alignItems: 'center', marginBottom: 40 },
  logoContainer: { marginBottom: 20 },
  logoGradient: {
    width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#00D4A1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5,
    shadowRadius: 16, elevation: 10,
  },
  walletEmoji: { fontSize: 50 },
  title: { fontSize: 48, fontWeight: 'bold', color: '#fff', marginBottom: 8, letterSpacing: 1 },
  tagline: { fontSize: 16, color: '#94a3b8', textAlign: 'center', marginBottom: 4, fontStyle: 'italic' },
  subtitle: { fontSize: 18, color: '#94a3b8', textAlign: 'center' },
  formContainer: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  googleButton: { marginBottom: 20 },
  googleGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56,
    borderRadius: 16, gap: 12, borderWidth: 2, borderColor: '#e5e7eb',
  },
  googleText: { color: '#1f2937', fontSize: 16, fontWeight: '600' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divider: { flex: 1, height: 1, backgroundColor: '#334155' },
  dividerText: { color: '#64748b', marginHorizontal: 16, fontSize: 14 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 16,
    marginBottom: 16, paddingHorizontal: 16, height: 56, borderWidth: 2, borderColor: '#334155',
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#fff', fontSize: 16 },
  eyeIcon: { padding: 4 },
  errorContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ef44441a',
    borderRadius: 12, padding: 12, marginBottom: 16,
  },
  errorText: { color: '#ef4444', marginLeft: 8, fontSize: 14 },
  submitButton: { marginTop: 8, marginBottom: 20 },
  submitGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 56, borderRadius: 16, gap: 8,
  },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  toggleContainer: { alignItems: 'center', paddingVertical: 16 },
  toggleText: { color: '#94a3b8', fontSize: 14 },
  toggleLink: { color: '#00D4A1', fontWeight: 'bold' },
  footer: { textAlign: 'center', color: '#64748b', fontSize: 12, marginTop: 32 },
});
