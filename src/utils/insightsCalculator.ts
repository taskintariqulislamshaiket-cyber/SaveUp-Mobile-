export interface Expense {
  amount: number;
  category: string;
  date: Date;
}

export const calculateInsights = (expenses: Expense[]) => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const lastWeekStart = new Date(startOfWeek);
  lastWeekStart.setDate(startOfWeek.getDate() - 7);
  const lastWeekEnd = new Date(startOfWeek);
  lastWeekEnd.setDate(startOfWeek.getDate() - 1);

  const sum = (arr: Expense[]) => arr.reduce((a, b) => a + (b.amount || 0), 0);
  const thisWeek = expenses.filter(e => e.date >= startOfWeek && e.date <= now);
  const lastWeek = expenses.filter(e => e.date >= lastWeekStart && e.date <= lastWeekEnd);

  const thisWeekTotal = sum(thisWeek);
  const lastWeekTotal = sum(lastWeek);
  const change = lastWeekTotal > 0 ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 : 0;

  const byCategory: Record<string, number> = {};
  expenses.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  });

  const dailyData: { day: string; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const total = expenses
      .filter(e => e.date.toDateString() === d.toDateString())
      .reduce((a, b) => a + (b.amount || 0), 0);
    dailyData.push({ day: label, total });
  }

  const smartText =
    change > 10
      ? "You're spending more than last week ��"
      : change < -10
      ? "Great job! Spending is down 🔻"
      : "Stable spending this week ⚖️";

  return { thisWeekTotal, lastWeekTotal, change, dailyData, byCategory, smartText };
};
