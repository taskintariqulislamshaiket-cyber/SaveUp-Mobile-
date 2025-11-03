import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function DailySpendingChart({ data }: { data: any[] }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>30-Day Spending Trend</Text>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <Tooltip />
          <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#1e293b', marginHorizontal: 20, borderRadius: 16, padding: 12, marginBottom: 16 },
  title: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 8 },
});
