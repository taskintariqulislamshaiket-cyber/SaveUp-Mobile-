// Insights calculation logic
export interface Insight {
  id: string;
  type: 'critical' | 'warning' | 'success' | 'info';
  emoji: string;
  title: string;
  message: string;
  priority: number;
}

export interface ExpenseItem {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  userId: string;
}

export interface InsightData {
  totalSpent: number;
  monthlyIncome: number;
  remainingBalance: number;
  daysIntoMonth: number;
  daysUntilPayday: number;
  salaryDay: number;
  expenses: ExpenseItem[];
  personalityType: string;
}

export function calculateInsights(data: InsightData): Insight[] {
  const insights: Insight[] = [];
  const {
    totalSpent,
    monthlyIncome,
    remainingBalance,
    daysIntoMonth,
    daysUntilPayday,
    expenses,
    personalityType,
  } = data;

  // Calculate daily burn rate
  const dailyBurnRate = daysIntoMonth > 0 ? totalSpent / daysIntoMonth : 0;
  const projectedSpending = dailyBurnRate * 30;
  const daysUntilBroke = dailyBurnRate > 0 ? remainingBalance / dailyBurnRate : 999;

  // Personality-based tone
  const isSaver = personalityType === 'saver';
  const isSpender = personalityType === 'spender';

  // 1. CRITICAL: Days until broke
  if (daysUntilBroke < daysUntilPayday && daysUntilBroke < 10) {
    const tone = isSpender
      ? `Whoa there, big spender! 😅 At this pace, you'll be broke in ${Math.floor(daysUntilBroke)} days. That's ${daysUntilPayday - Math.floor(daysUntilBroke)} days BEFORE payday!`
      : `Alert! 🚨 You'll run out of money in ${Math.floor(daysUntilBroke)} days if you keep this up. Time to tighten the belt!`;
    
    insights.push({
      id: 'days-until-broke',
      type: 'critical',
      emoji: '🔥',
      title: 'Critical Warning',
      message: tone,
      priority: 10,
    });
  }

  // 2. BURN RATE WARNING
  if (projectedSpending > monthlyIncome * 1.2) {
    const overspend = projectedSpending - monthlyIncome;
    const tone = isSpender
      ? `Buddy, your burn rate is ৳${dailyBurnRate.toFixed(0)}/day. That's ৳${overspend.toFixed(0)} over budget! Pump the brakes! 🚗💨`
      : `Your daily spending of ৳${dailyBurnRate.toFixed(0)} is too high. You're on track to overspend by ৳${overspend.toFixed(0)} this month.`;
    
    insights.push({
      id: 'burn-rate',
      type: 'critical',
      emoji: '💸',
      title: 'High Burn Rate',
      message: tone,
      priority: 9,
    });
  }

  // 3. BUDGET HEALTH
  const percentSpent = (totalSpent / monthlyIncome) * 100;
  const percentIntoMonth = (daysIntoMonth / 30) * 100;

  if (percentSpent > percentIntoMonth + 20) {
    const tone = isSpender
      ? `You've spent ${percentSpent.toFixed(0)}% of your budget in just ${daysIntoMonth} days. Slow down! 🐌`
      : `Warning: You're ${(percentSpent - percentIntoMonth).toFixed(0)}% ahead of budget pace.`;
    
    insights.push({
      id: 'budget-health',
      type: 'warning',
      emoji: '⚠️',
      title: 'Spending Ahead',
      message: tone,
      priority: 8,
    });
  } else if (percentSpent < percentIntoMonth - 10) {
    const tone = isSaver
      ? `You're crushing it! 🌟 Only ${percentSpent.toFixed(0)}% spent on day ${daysIntoMonth}. Keep going!`
      : `Nice! You're ${(percentIntoMonth - percentSpent).toFixed(0)}% under budget pace. Great job! 💪`;
    
    insights.push({
      id: 'budget-health',
      type: 'success',
      emoji: '✅',
      title: 'On Track',
      message: tone,
      priority: 5,
    });
  }

  // 4. CATEGORY ANALYSIS
  if (expenses.length > 0) {
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((exp) => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    const topCategory = Object.keys(categoryTotals).reduce((a, b) =>
      categoryTotals[a] > categoryTotals[b] ? a : b
    );
    const topCategoryPercent = (categoryTotals[topCategory] / totalSpent) * 100;

    if (topCategoryPercent > 40) {
      const suggestions: Record<string, string> = {
        Food: 'Maybe meal prep this week? 🍱',
        Entertainment: 'Netflix > Cinema for a few weeks? 📺',
        Transport: 'Can you carpool or use public transport? 🚌',
        Shopping: 'Do you really need all those things? 🛍️',
      };

      insights.push({
        id: 'category-analysis',
        type: 'info',
        emoji: '📊',
        title: `${topCategory} Alert`,
        message: `${topCategory} is ${topCategoryPercent.toFixed(0)}% of your spending (৳${categoryTotals[topCategory].toFixed(0)}). ${suggestions[topCategory] || 'Consider cutting back.'}`,
        priority: 6,
      });
    }
  }

  // 5. DAYS UNTIL PAYDAY
  if (daysUntilPayday <= 5 && remainingBalance < monthlyIncome * 0.1) {
    const tone = isSpender
      ? `Just ${daysUntilPayday} days until payday and you have ৳${remainingBalance.toFixed(0)} left. You got this! Hang in there! 💪`
      : `${daysUntilPayday} days to go with ৳${remainingBalance.toFixed(0)}. Stay strong!`;
    
    insights.push({
      id: 'payday-countdown',
      type: 'warning',
      emoji: '📅',
      title: 'Almost Payday',
      message: tone,
      priority: 7,
    });
  }

  // 6. POSITIVE REINFORCEMENT
  if (percentSpent < 50 && daysIntoMonth >= 15) {
    const savingsPotential = monthlyIncome - projectedSpending;
    const tone = isSaver
      ? `Legend status! 🏆 You're on track to save ৳${savingsPotential.toFixed(0)} this month!`
      : `You're doing great! At this rate, you'll save ৳${savingsPotential.toFixed(0)} this month. Keep it up! 🎉`;
    
    insights.push({
      id: 'positive',
      type: 'success',
      emoji: '🎉',
      title: 'Winning!',
      message: tone,
      priority: 4,
    });
  }

  // Sort by priority (highest first)
  return insights.sort((a, b) => b.priority - a.priority);
}
