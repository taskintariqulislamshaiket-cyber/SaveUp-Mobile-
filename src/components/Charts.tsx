import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';

export function CategoryPieChart({ data }: { data: Record<string, number> }) {
  const colors = ['#8b5cf6','#ec4899','#10b981','#f59e0b','#3b82f6','#ef4444','#64748b'];
  const chartData = Object.entries(data).map(([name, value], i) => ({ name, value, fill: colors[i % colors.length] }));
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spending by Category</Text>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={90} label />
          <Tooltip />
          <Legend />
          {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
        </PieChart>
      </ResponsiveContainer>
    </View>
  );
}

export function DailySpendingChart({ data }: { data: any[] }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily Spending Trend</Text>
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
