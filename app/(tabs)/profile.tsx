import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';

export default function ProfileScreen() {
  const { user, userProfile, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      console.log('🚪 Sign out button pressed');
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <LinearGradient colors={['#0f172a' as any, '#1e293b' as any]} style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.userCard}>
          <LinearGradient
            colors={['#8b5cf6', '#ec4899'] as any}
            style={styles.userGradient}
          >
            <Text style={styles.avatar}>
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </Text>
            <Text style={styles.userName}>{user?.email?.split('@')[0] || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Info</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="cash" size={20} color="#8b5cf6" />
              <Text style={styles.infoLabel}>Monthly Income</Text>
            </View>
            <Text style={styles.infoValue}>৳{userProfile?.monthlyIncome?.toFixed(0) || '0'}</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="wallet" size={20} color="#10b981" />
              <Text style={styles.infoLabel}>Current Balance</Text>
            </View>
            <Text style={styles.infoValue}>৳{userProfile?.remainingBalanceCurrentMonth?.toFixed(0) || '0'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out" size={22} color="#fff" />
            <Text style={styles.signOutText}>Sign Out</Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>SaveUp Mobile v1.0.0</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  header: { padding: 20, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  userCard: { marginHorizontal: 20, marginBottom: 24, borderRadius: 24, overflow: 'hidden' },
  userGradient: { padding: 32, alignItems: 'center' },
  avatar: { fontSize: 48, color: '#fff', marginBottom: 16 },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#fff', opacity: 0.8 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  infoCard: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoLabel: { fontSize: 14, color: '#94a3b8' },
  infoValue: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ef4444',
    padding: 18,
    borderRadius: 16,
    gap: 12,
  },
  signOutText: { fontSize: 18, fontWeight: 'bold', color: '#fff', flex: 1, marginLeft: 8 },
  footer: { alignItems: 'center', paddingVertical: 32 },
  footerText: { fontSize: 12, color: '#64748b' },
});
