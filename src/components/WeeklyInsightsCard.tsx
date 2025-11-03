import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function WeeklyInsightsCard({ insights }: { insights: any }) {
  return (
    <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.card}>
      <Text style={styles.title}>Weekly Summary</Text>
      <Text style={styles.amount}>৳{insights.thisWeekTotal.toFixed(0)}</Text>
      <Text style={styles.change}>
        {insights.change >= 0 ? '▲' : '▼'} {Math.abs(insights.change).toFixed(1)}%
      </Text>
      <Text style={styles.text}>{insights.smartText}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, borderRadius: 16, marginHorizontal: 20, marginBottom: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  amount: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  change: { color: '#e0e7ff', fontSize: 16, marginTop: 4 },
  text: { color: '#fff', fontSize: 13, marginTop: 8 },
});
