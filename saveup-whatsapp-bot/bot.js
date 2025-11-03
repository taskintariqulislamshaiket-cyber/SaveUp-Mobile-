const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Initialize WhatsApp Client
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

// Generate QR Code
client.on('qr', (qr) => {
  console.log('📱 Scan this QR code with your WhatsApp:');
  qrcode.generate(qr, { small: true });
});

// Bot is ready
client.on('ready', () => {
  console.log('✅ SaveUp WhatsApp Bot is ready!');
});

// Handle incoming messages
client.on('message', async (message) => {
  const userPhone = message.from.replace('@c.us', '');
  const userMessage = message.body.toLowerCase().trim();

  console.log(`📩 Message from ${userPhone}: ${userMessage}`);

  try {
    // Command: Add Expense
    if (userMessage.startsWith('add expense') || userMessage.startsWith('expense')) {
      await handleAddExpense(message, userPhone);
    }
    // Command: Check Balance
    else if (userMessage.includes('balance') || userMessage.includes('remaining')) {
      await handleCheckBalance(message, userPhone);
    }
    // Command: View Goals
    else if (userMessage.includes('goal')) {
      await handleViewGoals(message, userPhone);
    }
    // Command: Budget Status
    else if (userMessage.includes('status') || userMessage.includes('budget')) {
      await handleBudgetStatus(message, userPhone);
    }
    // Command: Help
    else if (userMessage.includes('help') || userMessage === 'hi' || userMessage === 'hello') {
      await handleHelp(message);
    }
    // Unknown command
    else {
      await message.reply('❓ I didn\'t understand that. Type *help* to see what I can do!');
    }
  } catch (error) {
    console.error('Error handling message:', error);
    await message.reply('⚠️ Oops! Something went wrong. Please try again.');
  }
});

// Add Expense Function with Smart Warnings
async function handleAddExpense(message, userPhone) {
  const text = message.body;
  const match = text.match(/(\d+)\s*(.+)/);

  if (!match) {
    await message.reply('❌ Please use format: *add expense 500 lunch*');
    return;
  }

  const amount = parseInt(match[1]);
  const description = match[2].trim();

  // Save to Firebase
  await db.collection('expenses').add({
    userId: userPhone,
    amount: amount,
    description: description,
    category: 'Other',
    date: new Date(),
    createdAt: new Date(),
    source: 'whatsapp'
  });

  let response = `✅ Added expense:\n💰 ${amount} Tk\n📝 ${description}\n\n`;

  // Check budget status and add warning
  const budgetWarning = await checkBudgetWarning(userPhone);
  if (budgetWarning) {
    response += `\n⚠️ *BUDGET WARNING*\n${budgetWarning}`;
  }

  await message.reply(response);
}

// Smart Budget Warning Function
async function checkBudgetWarning(userPhone) {
  try {
    // Get user profile
    const userSnapshot = await db.collection('users')
      .where('userId', '==', userPhone)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return null;
    }

    const userData = userSnapshot.docs[0].data();
    const monthlyIncome = userData.monthlyIncome || 0;
    const salaryDay = userData.salaryDay || 1;

    if (monthlyIncome === 0) {
      return null;
    }

    // Calculate days until next salary
    const today = new Date();
    const currentDay = today.getDate();
    
    let nextSalaryDate = new Date(today.getFullYear(), today.getMonth(), salaryDay);
    if (currentDay >= salaryDay) {
      nextSalaryDate.setMonth(nextSalaryDate.getMonth() + 1);
    }
    
    const daysUntilSalary = Math.ceil((nextSalaryDate - today) / (1000 * 60 * 60 * 24));

    // Get this month's expenses
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), salaryDay);
    if (currentDay < salaryDay) {
      startOfMonth.setMonth(startOfMonth.getMonth() - 1);
    }

    const expensesSnapshot = await db.collection('expenses')
      .where('userId', '==', userPhone)
      .where('date', '>=', startOfMonth)
      .get();

    let totalSpent = 0;
    expensesSnapshot.forEach(doc => {
      totalSpent += doc.data().amount || 0;
    });

    // Calculate average daily spending
    const daysSinceSalary = Math.ceil((today - startOfMonth) / (1000 * 60 * 60 * 24));
    const avgDailySpending = totalSpent / (daysSinceSalary || 1);
    const remainingBudget = monthlyIncome - totalSpent;
    const daysUntilBudgetRunsOut = Math.floor(remainingBudget / (avgDailySpending || 1));

    // Generate warning if budget will run out before salary
    if (daysUntilBudgetRunsOut < daysUntilSalary && daysUntilBudgetRunsOut > 0) {
      const shortfall = daysUntilSalary - daysUntilBudgetRunsOut;
      return `🚨 At your current spending rate (${Math.round(avgDailySpending)} Tk/day), your budget will run out in *${daysUntilBudgetRunsOut} days*.\n\n` +
             `⏰ But your next salary is in *${daysUntilSalary} days*.\n\n` +
             `📉 You'll run out *${shortfall} days early*!\n\n` +
             `💡 Try to spend less than ${Math.round(remainingBudget / daysUntilSalary)} Tk/day to make it last.`;
    }

    const recommendedDailyBudget = monthlyIncome / 30;
    if (avgDailySpending > recommendedDailyBudget * 1.5) {
      return `⚠️ You're spending ${Math.round(avgDailySpending)} Tk/day on average.\n\n` +
             `📊 That's ${Math.round((avgDailySpending / recommendedDailyBudget) * 100)}% of your recommended daily budget!\n\n` +
             `💰 ${Math.round(remainingBudget)} Tk remaining for ${daysUntilSalary} days.`;
    }

    return null;
  } catch (error) {
    console.error('Error checking budget:', error);
    return null;
  }
}

// Budget Status Function
async function handleBudgetStatus(message, userPhone) {
  try {
    const userSnapshot = await db.collection('users')
      .where('userId', '==', userPhone)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      await message.reply('❌ Please set up your profile in the SaveUp app first!');
      return;
    }

    const userData = userSnapshot.docs[0].data();
    const monthlyIncome = userData.monthlyIncome || 0;
    const salaryDay = userData.salaryDay || 1;

    if (monthlyIncome === 0) {
      await message.reply('❌ Please set your monthly income in the SaveUp app first!');
      return;
    }

    const today = new Date();
    const currentDay = today.getDate();
    
    let nextSalaryDate = new Date(today.getFullYear(), today.getMonth(), salaryDay);
    if (currentDay >= salaryDay) {
      nextSalaryDate.setMonth(nextSalaryDate.getMonth() + 1);
    }
    
    const daysUntilSalary = Math.ceil((nextSalaryDate - today) / (1000 * 60 * 60 * 24));

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), salaryDay);
    if (currentDay < salaryDay) {
      startOfMonth.setMonth(startOfMonth.getMonth() - 1);
    }

    const expensesSnapshot = await db.collection('expenses')
      .where('userId', '==', userPhone)
      .where('date', '>=', startOfMonth)
      .get();

    let totalSpent = 0;
    expensesSnapshot.forEach(doc => {
      totalSpent += doc.data().amount || 0;
    });

    const daysSinceSalary = Math.ceil((today - startOfMonth) / (1000 * 60 * 60 * 24));
    const avgDailySpending = totalSpent / (daysSinceSalary || 1);
    const remainingBudget = monthlyIncome - totalSpent;
    const daysUntilBudgetRunsOut = Math.floor(remainingBudget / (avgDailySpending || 1));
    const recommendedDailyBudget = remainingBudget / daysUntilSalary;

    let statusEmoji = '✅';
    if (daysUntilBudgetRunsOut < daysUntilSalary) {
      statusEmoji = '🚨';
    } else if (avgDailySpending > (monthlyIncome / 30) * 1.3) {
      statusEmoji = '⚠️';
    }

    let response = `${statusEmoji} *Budget Status Report*\n\n`;
    response += `💰 *Monthly Income:* ${monthlyIncome} Tk\n`;
    response += `📊 *Spent so far:* ${Math.round(totalSpent)} Tk (${Math.round((totalSpent/monthlyIncome)*100)}%)\n`;
    response += `💵 *Remaining:* ${Math.round(remainingBudget)} Tk\n\n`;
    response += `📅 *Days until salary:* ${daysUntilSalary} days\n`;
    response += `📈 *Avg daily spending:* ${Math.round(avgDailySpending)} Tk/day\n`;
    response += `🎯 *Recommended daily:* ${Math.round(recommendedDailyBudget)} Tk/day\n\n`;

    if (daysUntilBudgetRunsOut < daysUntilSalary && daysUntilBudgetRunsOut > 0) {
      response += `🚨 *WARNING:* Budget runs out in ${daysUntilBudgetRunsOut} days!\n`;
      response += `⚠️ That's ${daysUntilSalary - daysUntilBudgetRunsOut} days before your salary!\n\n`;
      response += `💡 *Tip:* Reduce spending to ${Math.round(recommendedDailyBudget)} Tk/day to make it last.`;
    } else {
      response += `✅ You're on track! Keep it up! 🎉`;
    }

    await message.reply(response);
  } catch (error) {
    console.error('Error getting budget status:', error);
    await message.reply('⚠️ Could not get budget status. Please try again.');
  }
}

// Check Balance Function
async function handleCheckBalance(message, userPhone) {
  const expensesSnapshot = await db.collection('expenses')
    .where('userId', '==', userPhone)
    .get();

  let total = 0;
  expensesSnapshot.forEach(doc => {
    total += doc.data().amount || 0;
  });

  await message.reply(`💰 *Your Total Spending*\n\n📊 ${total} Tk spent so far`);
}

// View Goals Function
async function handleViewGoals(message, userPhone) {
  const goalsSnapshot = await db.collection('goals')
    .where('userId', '==', userPhone)
    .get();

  if (goalsSnapshot.empty) {
    await message.reply('🎯 You have no goals yet!\n\nCreate one in the SaveUp app.');
    return;
  }

  let response = '🎯 *Your Goals*\n\n';
  goalsSnapshot.forEach(doc => {
    const goal = doc.data();
    const progress = Math.round((goal.currentAmount / goal.targetAmount) * 100);
    response += `📌 ${goal.name}\n`;
    response += `💰 ${goal.currentAmount}/${goal.targetAmount} Tk (${progress}%)\n\n`;
  });

  await message.reply(response);
}

// Help Function
async function handleHelp(message) {
  const helpText = `
👋 *Welcome to SaveUp!*

I can help you track your money. Here's what I can do:

💸 *Add Expense*
_add expense 500 lunch_

💰 *Check Balance*
_balance_ or _show balance_

📊 *Budget Status*
_status_ or _budget_
(Shows daily spending, warnings, etc.)

🎯 *View Goals*
_show goals_ or _goals_

❓ *Help*
_help_

Try it now! 🚀
  `;
  await message.reply(helpText);
}

// Start the client
client.initialize();

console.log('🚀 Starting SaveUp WhatsApp Bot...');