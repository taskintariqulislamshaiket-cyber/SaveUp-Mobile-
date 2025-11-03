import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function CategoryPieChart({ data }: { data: Record<string, number> }) {
  const colors = ['#8b5cf6','#ec4899','#10b981','#f59e0b','#3b82f6','#ef4444','#64748b'];
  const chartData = Object.entries(data).map(([name, value], i) => ({ name, value, fill: colors[i % colors.length] }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spending by Category</Text>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label />
          <Tooltip />
          <Legend />
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </PieChart>
      </ResponsiveContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#1e293b', marginHorizontal: 20, borderRadius: 16, padding: 12, marginBottom: 24 },
  title: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 8 },
});
