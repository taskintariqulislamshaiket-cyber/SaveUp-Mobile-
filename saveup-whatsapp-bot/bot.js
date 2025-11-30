const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const admin = require('firebase-admin');
require('dotenv').config();

const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Helper: Get userId from phone number
async function getUserIdFromPhone(phoneNumber) {
  try {
    const usersSnapshot = await db.collection('users')
      .where('phoneNumber', '==', phoneNumber)
      .limit(1)
      .get();
    
    if (!usersSnapshot.empty) {
      return usersSnapshot.docs[0].id; // Return the userId (document ID)
    }
    
    // Fallback: use phone if user not found (for backward compatibility)
    console.warn(`User not found for phone ${phoneNumber}, using phone as userId`);
    return phoneNumber;
  } catch (error) {
    console.error('Error getting userId:', error);
    return phoneNumber; // Fallback to phone
  }
}
const conversationContext = new Map();

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', (qr) => {
  console.log('📱 Scan this QR code with your WhatsApp:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
  console.log('✅ SaveUp WhatsApp Bot is ready!');
  startDailyCheckIn();
  startProactiveMessaging();
});

// ========================================
// MULTI-LINE EXPENSE PARSER
// ========================================

function parseMultiLineExpenses(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const items = [];
  
  for (const line of lines) {
    // Pattern 1: "rice bran oil- 950" or "Ginger 120"
    let match = line.match(/^(.+?)[\s\-:]+(\d+)\s*(?:tk|taka|টাকা)?$/i);
    if (match) {
      items.push({
        description: match[1].trim(),
        amount: parseInt(match[2])
      });
      continue;
    }
    
    // Pattern 2: "950 rice bran oil"
    match = line.match(/^(\d+)\s*(?:tk|taka|টাকা)?\s+(.+)$/i);
    if (match) {
      items.push({
        description: match[2].trim(),
        amount: parseInt(match[1])
      });
      continue;
    }
  }
  
  return items;
}

function parseExpenseWithAdvancedNLP(text, userPhone) {
  const clean = text.toLowerCase().trim();
  
  // Check for "what is total today" queries
  if (clean.match(/(what|কত|total|মোট).*(expense|খরচ|cost|spent).*(today|আজ|আজকে)/i) || 
      clean.match(/(today|আজ|আজকে).*(total|মোট|expense|খরচ)/i)) {
    return { intent: 'daily_total' };
  }
  
  // Check for "add separately" override
  const wantsSeparate = clean.match(/(add|log|save).*(separately|আলাদা|each|individually)/i);
  
  // Try multi-line parsing first
  const multiItems = parseMultiLineExpenses(text);
  if (multiItems.length > 1) {
    return {
      intent: 'multi_item_expense',
      items: multiItems,
      logSeparately: wantsSeparate ? true : false
    };
  }
  
  // Single line patterns below...
  
  if (clean.match(/same as (yesterday|last time|previous|আগের)/i)) {
    return { intent: 'repeat_last_expense', requiresHistory: true };
  }
  
  if (clean.match(/(no|কোনো|nai|নাই).*(expense|খরচ|spending)|আজ কোনো খরচ নাই/i)) {
    return { intent: 'no_expense_today', amount: 0 };
  }
  
  let emotion = detectEmotion(text);
  
  // Single item patterns
  let match = clean.match(/(?:for|e|এ|er|জন্য)\s+([a-z\u0980-\u09FF]+)\s+(\d+)/i);
  if (match) {
    return { 
      intent: 'add_expense',
      amount: parseInt(match[2]), 
      description: match[1],
      emotion: emotion
    };
  }
  
  match = clean.match(/(?:made|cost|spent|khorse|খরচ|দিলাম|gese|গেছে)\s+(?:a|of|for)?\s*(\d+)\s*(?:tk|taka|টাকা)?\s+(?:for|e|এ)?\s*([a-z\u0980-\u09FF\s]+)/i);
  if (match) {
    return { 
      intent: 'add_expense',
      amount: parseInt(match[1]), 
      description: match[2].trim(),
      emotion: emotion
    };
  }
  
  match = clean.match(/(?:spent|add|খরচ|দিলাম|cost)\s+(?:for|e|এ)?\s+([a-z\u0980-\u09FF]+)\s+(\d+)/i);
  if (match) {
    return { 
      intent: 'add_expense',
      amount: parseInt(match[2]), 
      description: match[1],
      emotion: emotion
    };
  }
  
  match = clean.match(/([a-z\u0980-\u09FF]+)\s+(\d+)/i);
  if (match) {
    return { 
      intent: 'add_expense',
      amount: parseInt(match[2]), 
      description: match[1],
      emotion: emotion
    };
  }
  
  match = clean.match(/(\d+)\s+([a-z\u0980-\u09FF]+)/i);
  if (match) {
    return { 
      intent: 'add_expense',
      amount: parseInt(match[1]), 
      description: match[2],
      emotion: emotion
    };
  }
  
  match = clean.match(/(?:bro|dude|ভাই)?\s*(?:add|spent|cost)?\s*(\d+)\s*(?:taka|tk|টাকা)?\s+([a-z\u0980-\u09FF]+)/i);
  if (match) {
    return { 
      intent: 'add_expense',
      amount: parseInt(match[1]), 
      description: match[2],
      emotion: emotion
    };
  }
  
  match = clean.match(/(?:today|আজ|আজকে).*(expense|খরচ|cost).*?(\d+)\s+([a-z\u0980-\u09FF\s]+)/i);
  if (match) {
    return { 
      intent: 'add_expense',
      amount: parseInt(match[2]), 
      description: match[3].trim(),
      emotion: emotion
    };
  }
  
  match = clean.match(/(আজ|আজকে).*?(\d+)\s*(?:টাকা|টাকার|taka)?\s+([a-z\u0980-\u09FF]+)/i);
  if (match) {
    return { 
      intent: 'add_expense',
      amount: parseInt(match[2]), 
      description: match[3],
      emotion: emotion
    };
  }
  
  match = clean.match(/([a-z\u0980-\u09FF]+)\s+(?:e|er|এ|এর)\s+(?:fare)?\s*(\d+)/i);
  if (match) {
    return { 
      intent: 'add_expense',
      amount: parseInt(match[2]), 
      description: match[1],
      emotion: emotion
    };
  }
  
  match = clean.match(/wallet.*?(\d+)\s+([a-z\u0980-\u09FF]+)/i);
  if (match) {
    return { 
      intent: 'add_expense',
      amount: parseInt(match[1]), 
      description: match[2],
      emotion: 'sad'
    };
  }
  
  const amountMatch = clean.match(/(\d+)/);
  if (amountMatch) {
    return {
      intent: 'unclear_expense',
      amount: parseInt(amountMatch[1]),
      needsClarification: true
    };
  }
  
  return null;
}

function detectEmotion(text) {
  if (text.match(/😭|😢|😞|crying|sad|regret|waste/i)) return 'sad';
  if (text.match(/😊|😄|😁|happy|worth|good|nice/i)) return 'happy';
  if (text.match(/😅|😬|uff|oops|again/i)) return 'guilty';
  if (text.match(/😐|okay|fine/i)) return 'neutral';
  return 'neutral';
}

function getPersonalityResponse(amount, description, emotion) {
  if (amount > 2000) {
    const responses = [
      `💰 Big spend: ${amount} Tk on ${description}! Worth it though? 😊`,
      `Whoa! ${amount} Tk for ${description}. Hope it was good! Logged.`,
      `${amount} Tk on ${description}... treating yourself! Added.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (description.match(/lunch|dinner|food|breakfast|কাবার|খাবার|coffee|tea/i)) {
    if (emotion === 'guilty') {
      return `🍽️ ${amount} Tk for ${description}... again? 😅 It is okay, logged!`;
    }
    return `🍽️ ${amount} Tk for ${description}! Bon appetit! Added.`;
  }
  
  if (amount < 200) {
    return `✅ Nice! Only ${amount} Tk for ${description}. Keeping it lean! Logged.`;
  }
  
  if (emotion === 'sad') {
    return `😔 I feel you... ${amount} Tk on ${description}. Let us call it self-care! Added.`;
  }
  
  if (emotion === 'happy') {
    return `🎉 ${amount} Tk on ${description}! Worth it! Expense logged.`;
  }
  
  const responses = [
    `✅ Got it! ${amount} Tk for ${description} logged.`,
    `Added ${amount} Tk (${description}) to your expenses!`,
    `Logged! ${amount} Tk spent on ${description}.`,
    `${amount} Tk for ${description} - saved to your ledger!`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// ========================================
// MESSAGE HANDLER
// ========================================

client.on('message', async (message) => {
  const userPhone = message.from.replace('@c.us', '');
  const userMessage = message.body.trim();

  console.log(`📩 from ${userPhone}: ${userMessage}`);

  try {
    let context = conversationContext.get(userPhone) || {};
    
    if (context.awaitingMoodResponse) {
      await handleMoodResponse(message, userPhone, userMessage);
      return;
    }
    
    const parsed = parseExpenseWithAdvancedNLP(userMessage, userPhone);
    
    if (parsed) {
      // Handle daily total query
      if (parsed.intent === 'daily_total') {
        await handleDailyTotal(message, userPhone);
        return;
      }
      
      // Handle multi-item expenses
      if (parsed.intent === 'multi_item_expense') {
        await handleMultiItemExpense(message, userPhone, parsed);
        return;
      }
      
      if (parsed.intent === 'add_expense') {
        await handleIntelligentExpense(message, userPhone, parsed);
        return;
      }
      
      if (parsed.intent === 'repeat_last_expense') {
        await handleRepeatLastExpense(message, userPhone);
        return;
      }
      
      if (parsed.intent === 'no_expense_today') {
        await message.reply('✅ Great! No-spend day marked. Keep it up!');
        return;
      }
      
      if (parsed.intent === 'unclear_expense') {
        await message.reply(`I see ${parsed.amount} Tk, but what was it for?\n\nJust reply: "lunch" or "bus fare"`);
        context.pendingAmount = parsed.amount;
        conversationContext.set(userPhone, context);
        return;
      }
    }
    
    if (context.pendingAmount) {
      await handleIntelligentExpense(message, userPhone, {
        intent: 'add_expense',
        amount: context.pendingAmount,
        description: userMessage,
        emotion: 'neutral'
      });
      context.pendingAmount = null;
      conversationContext.set(userPhone, context);
      return;
    }
    
    const lower = userMessage.toLowerCase();
    
    if (lower.match(/balance|বাকি|remaining|how much left/i)) {
      await handleCheckBalance(message, userPhone);
    }
    else if (lower.match(/goal|লক্ষ্য/i)) {
      await handleViewGoals(message, userPhone);
    }
    else if (lower.match(/status|budget|report/i)) {
      await handleBudgetStatus(message, userPhone);
    }
    else if (lower.match(/help|start|hi|hello|হাই|হেল্প/i)) {
      await handleHelp(message);
    }
    else if (lower.match(/motivate|quote|inspire/i)) {
      await sendMotivationalQuote(message);
    }
    else {
      await message.reply(
        'Hmm, not sure I got that!\n\n' +
        'Try:\n' +
        '• "lunch 500"\n' +
        '• "balance"\n' +
        '• "help"'
      );
    }
    
  } catch (error) {
    console.error('Error:', error);
    await message.reply('Oops! Something went wrong. Try again?');
  }
});

// ========================================
// MULTI-ITEM EXPENSE HANDLER
// ========================================

async function handleMultiItemExpense(message, userPhone, parsed) {
  const { items, logSeparately } = parsed;
  
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  
  if (logSeparately) {
    // Log each item separately
    for (const item of items) {
      await db.collection('expenses').add({
      const userId = await getUserIdFromPhone(userPhone);
        userId: userId,
        amount: item.amount,
        description: item.description,
        category: 'Other',
        date: new Date(),
        createdAt: new Date(),
        source: 'whatsapp'
      });
    }
    
    let response = `✅ Logged ${items.length} separate expenses:\n\n`;
    items.forEach(item => {
      response += `• ${item.description} - ${item.amount} Tk\n`;
    });
    response += `\n💰 Total: ${totalAmount} Tk`;
    
    await message.reply(response);
  } else {
    // Log as ONE shopping expense (default)
    const itemsList = items.map(item => `${item.description} (${item.amount})`).join(', ');
    
    const userId = await getUserIdFromPhone(userPhone);
    await db.collection('expenses').add({
      userId: userId,
      amount: totalAmount,
      description: `Shopping: ${itemsList}`,
      category: 'Groceries',
      date: new Date(),
      createdAt: new Date(),
      source: 'whatsapp',
      itemBreakdown: items
    });
    
    let response = `✅ Logged Groceries: ${totalAmount} Tk\n\n📝 Items (${items.length}):\n`;
    items.forEach(item => {
      response += `• ${item.description} - ${item.amount} Tk\n`;
    });
    
    await message.reply(response);
  }
  
  const budgetWarning = await checkBudgetWarning(userPhone);
  if (budgetWarning) {
    await message.reply(budgetWarning);
  }
}

// ========================================
// DAILY TOTAL CALCULATOR
// ========================================

async function handleDailyTotal(message, userPhone) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const expensesSnapshot = await db.collection('expenses')
    .where('userId', '==', userPhone)
    .where('date', '>=', today)
    .where('date', '<', tomorrow)
    .get();
  
  if (expensesSnapshot.empty) {
    await message.reply('📊 No expenses logged today yet!');
    return;
  }
  
  let total = 0;
  let itemCount = 0;
  let breakdown = '';
  
  expensesSnapshot.forEach(doc => {
    const expense = doc.data();
    total += expense.amount || 0;
    itemCount++;
    breakdown += `• ${expense.description} - ${expense.amount} Tk\n`;
  });
  
  const response = `📊 *Today's Expenses*\n\n${breakdown}\n💰 *Total: ${total} Tk* (${itemCount} items)`;
  
  await message.reply(response);
}

// ========================================
// SINGLE EXPENSE HANDLER
// ========================================

  const userId = await getUserIdFromPhone(userPhone);
async function handleIntelligentExpense(message, userPhone, parsed) {
  const { amount, description, emotion } = parsed;

  await db.collection('expenses').add({
    userId: userPhone,
    amount: amount,
    description: description,
    category: 'Other',
    date: new Date(),
    createdAt: new Date(),
    source: 'whatsapp',
    emotion: emotion || 'neutral'
  });

  await db.collection('users').doc(userPhone).set({
    lastExpense: { amount, description },
    lastExpenseDate: new Date()
  }, { merge: true });

  let response = getPersonalityResponse(amount, description, emotion);

  const budgetWarning = await checkBudgetWarning(userPhone);
  if (budgetWarning) {
    response += `\n\n${budgetWarning}`;
  }

  await message.reply(response);

  setTimeout(async () => {
    try {
      await client.sendMessage(message.from, 
        `💭 Quick check: How do you feel about this ${description} expense?\n\n` +
        `Reply: 😊 Happy | 😐 Okay | 😢 Regret`
      );
      
      let context = conversationContext.get(userPhone) || {};
      context.awaitingMoodResponse = true;
      conversationContext.set(userPhone, context);
    } catch (err) {
      console.error('Could not send mood check:', err);
    }
  }, 3000);
}

async function handleMoodResponse(message, userPhone, response) {
  const lower = response.toLowerCase();
  let mood = 'neutral';
  
  if (lower.match(/😊|happy|good|worth|okay with it|glad/i)) {
    mood = 'happy';
  } else if (lower.match(/😢|😭|regret|waste|sad|bad|should not/i)) {
    mood = 'regret';
  } else if (lower.match(/😐|okay|fine|neutral|meh/i)) {
    mood = 'neutral';
  }
  
  if (mood === 'happy') {
    await message.reply('😊 Great! Glad it was worth it. Keep enjoying responsibly!');
  } else if (mood === 'regret') {
    await message.reply('😔 I understand. Next time, maybe pause before spending? You have got this!');
  } else {
    await message.reply('👍 Noted! Thanks for sharing.');
  }
  
  let context = conversationContext.get(userPhone);
  context.awaitingMoodResponse = false;
  conversationContext.set(userPhone, context);
}

async function handleRepeatLastExpense(message, userPhone) {
  const userDoc = await db.collection('users').doc(userPhone).get();
  
  if (!userDoc.exists || !userDoc.data().lastExpense) {
    await message.reply('I do not remember your last expense. Can you tell me again?');
    return;
  }
  
  const { amount, description } = userDoc.data().lastExpense;
  
  await handleIntelligentExpense(message, userPhone, {
    intent: 'add_expense',
    amount: amount,
    description: description,
    emotion: 'neutral'
  });
}

async function checkBudgetWarning(userPhone) {
  try {
    const userSnapshot = await db.collection('users')
      .where('userId', '==', userPhone)
      .limit(1)
      .get();

    if (userSnapshot.empty) return null;

    const userData = userSnapshot.docs[0].data();
    const monthlyIncome = userData.monthlyIncome || 0;
    const salaryDay = userData.salaryDay || 1;

    if (monthlyIncome === 0) return null;

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

    if (daysUntilBudgetRunsOut < daysUntilSalary && daysUntilBudgetRunsOut > 0) {
      return `🚨 Budget alert: Runs out in ${daysUntilBudgetRunsOut} days, salary in ${daysUntilSalary}!`;
    }

    return null;
  } catch (error) {
    return null;
  }
}

async function handleCheckBalance(message, userPhone) {
  const expensesSnapshot = await db.collection('expenses')
    .where('userId', '==', userPhone)
    .get();

  let total = 0;
  expensesSnapshot.forEach(doc => {
    total += doc.data().amount || 0;
  });

  await message.reply(`💰 *Total Spending*\n\n📊 ${total} Tk`);
}

async function handleViewGoals(message, userPhone) {
  await message.reply('🎯 Goals feature coming soon in the app!');
}

async function handleBudgetStatus(message, userPhone) {
  await message.reply('📊 Detailed budget report coming soon!');
}

async function sendMotivationalQuote(message) {
  const quotes = [
    '💡 "Save money today, secure tomorrow."',
    '🌟 "Small savings today = Big dreams tomorrow."',
    '💪 "Discipline today, freedom tomorrow."',
    '🎯 "Track every taka, treasure every dream."'
  ];
  await message.reply(quotes[Math.floor(Math.random() * quotes.length)]);
}

async function handleHelp(message) {
  const helpText = `
👋 *Welcome to SaveUp!*

I am your AI money buddy! I understand:

💸 *Single expenses*
- "lunch 500"
- "spent 300 for bus"

🛒 *Shopping lists* (multi-line)
- rice - 950
- onion 80
- ginger 120

📊 *Queries*
- "what is total today?"
- "balance"
- "status"

Just talk naturally! I got you! 😊
  `;
  await message.reply(helpText);
}

function startDailyCheckIn() {
  setInterval(async () => {
    const now = new Date();
    if (now.getHours() === 21 && now.getMinutes() === 0) {
      const users = await db.collection('users').get();
      users.forEach(async (doc) => {
        const userPhone = doc.data().userId;
        try {
          await client.sendMessage(`${userPhone}@c.us`, 
            `🌙 Evening check-in!\n\n💭 What did you spend today?\n\nType "what is total today?" to see!`
          );
        } catch (err) {
          console.error(`Could not send to ${userPhone}`);
        }
      });
    }
  }, 60000);
}

function startProactiveMessaging() {
  console.log('🤖 Proactive messaging enabled');
}

client.initialize();
console.log('🚀 Starting SaveUp Conversational AI Bot...');
