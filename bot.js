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

// Conversation context storage (in-memory for this session)
const conversationContext = new Map();

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
client.on('ready', async () => {
  console.log('✅ SaveUp WhatsApp Bot is ready!');
  startDailyCheckIn();
  startProactiveMessaging();
});

// ========================================
// ADVANCED NLP: Pattern Matching Engine
// ========================================

function parseExpenseWithAdvancedNLP(text, userPhone) {
  const clean = text.toLowerCase().trim();
  
  // Check for "same as yesterday" memory
  if (clean.match(/same as (yesterday|last time|previous|আগের)/i)) {
    return { intent: 'repeat_last_expense', requiresHistory: true };
  }
  
  // Check for "no expense today"
  if (clean.match(/(no|কোনো|nai|নাই).*(expense|খরচ|spending)|আজ কোনো খরচ নাই/i)) {
    return { intent: 'no_expense_today', amount: 0 };
  }
  
  let amount = null;
  let description = '';
  let emotion = detectEmotion(text);
  
  // Extract amount (supports: 5000, ৫০০০, 5k, etc.)
  const amountMatch = clean.match(/(\d+k?|\d+(?:\.\d+)?)/i);
  if (amountMatch) {
    amount = parseAmount(amountMatch[1]);
  }
  
  // Pattern 1: "for lunch 5000" / "lunch er 5000"
  let match = clean.match(/(?:for|e|এ|er|জন্য)\s+([a-z\u0980-\u09FF]+)\s+(\d+)/i);
  if (match) {
    return { 
      intent: 'add_expense',
      amount: parseInt(match[2]), 
      description: match[1],
      emotion: emotion
    };
  }
  
  // Pattern 2: "made a cost of 5000 tk for family"
  match = clean.match(/(?:made|cost|spent|khorse|খরচ|দিলাম|gese|গেছে)\s+(?:a|of|for)?\s*(\d+)\s*(?:tk|taka|টাকা)?\s+(?:for|e|এ)?\s*([a-z\u0980-\u09FF\s]+)/i);
  if (match) {
    return { 
      intent: 'add_expense',
      amount: parseInt(match[1]), 
      description: match[2].trim(),
      emotion: emotion
    };
  }
  
  // Pattern 3: "spent for lunch 600"
  match = clean.match(/(?:spent|add|খরচ|দিলাম|cost)\s+(?:for|e|এ)?\s+([a-z\u0980-\u09FF]+)\s+(\d+)/i);
  if (match) {
    return { 
      intent: 'add_expense',
      amount: parseInt(match[2]), 
      description: match[1],
      emotion: emotion
    };
  }
  
  // Pattern 4: Casual "lunch 5000" / "5000 lunch"
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
  
  // Pattern 5: Emotional variants "bro add 500 taka dinner pls"
  match = clean.match(/(?:bro|dude|ভাই)?\s*(?:add|spent|cost)?\s*(\d+)\s*(?:taka|tk|টাকা)?\s+([a-z\u0980-\u09FF]+)/i);
  if (match) {
    return { 
      intent: 'add_expense',
      amount: parseInt(match[1]), 
      description: match[2],
      emotion: emotion
    };
  }
  
  // Pattern 6: "today's expense was 250 bus fare"
  match = clean.match(/(?:today|আজ|আজকে).*(expense|খরচ|cost).*?(\d+)\s+([a-z\u0980-\u09FF\s]+)/i);
  if (match) {
    return { 
      intent: 'add_expense',
      amount: parseInt(match[2]), 
      description: match[3].trim(),
      emotion: emotion
    };
  }
  
  // Pattern 7: "spent 350 for coffee earlier, did it save?"
  match = clean.match(/(spent|add|খরচ)\s+(\d+)\s+(?:for|e)?\s*([a-z\u0980-\u09FF]+).*(?:did it|save|হয়েছে)/i);
  if (match) {
    return { 
      intent: 'add_expense_confirm',
      amount: parseInt(match[2]), 
      description: match[3],
      emotion: emotion,
      needsConfirmation: true
    };
  }
  
  // Pattern 8: Banglish "আজকে ৫০০ টাকার lunch"
  match = clean.match(/(আজ|আজকে).*?(\d+)\s*(?:টাকা|টাকার|taka)?\s+([a-z\u0980-\u09FF]+)/i);
  if (match) {
    return { 
      intent: 'add_expense',
      amount: parseInt(match[2]), 
      description: match[3],
      emotion: emotion
    };
  }
  
  // Pattern 9: "groceries e 800" / "bus er fare 40 tk"
  match = clean.match(/([a-z\u0980-\u09FF]+)\s+(?:e|er|এ|এর)\s+(?:fare)?\s*(\d+)/i);
  if (match) {
    return { 
      intent: 'add_expense',
      amount: parseInt(match[2]), 
      description: match[1],
      emotion: emotion
    };
  }
  
  // Pattern 10: Emotional variants "wallet crying... 1500 lunch"
  match = clean.match(/wallet.*?(\d+)\s+([a-z\u0980-\u09FF]+)/i);
  if (match) {
    return { 
      intent: 'add_expense',
      amount: parseInt(match[1]), 
      description: match[2],
      emotion: 'sad'
    };
  }
  
  // If amount exists but no clear pattern, ask for clarification
  if (amount) {
    return {
      intent: 'unclear_expense',
      amount: amount,
      needsClarification: true
    };
  }
  
  return null;
}

// Helper: Parse amount (handles 5k = 5000)
function parseAmount(str) {
  if (str.toLowerCase().includes('k')) {
    return parseInt(str.replace('k', '')) * 1000;
  }
  return parseInt(str);
}

// Helper: Detect emotion from text
function detectEmotion(text) {
  if (text.match(/😭|😢|😞|crying|sad|regret|waste/i)) return 'sad';
  if (text.match(/😊|😄|😁|happy|worth|good|nice/i)) return 'happy';
  if (text.match(/😅|��|uff|oops|again/i)) return 'guilty';
  if (text.match(/😐|okay|fine/i)) return 'neutral';
  return 'neutral';
}

// ========================================
// PERSONALITY & EMOTIONAL RESPONSES
// ========================================

function getPersonalityResponse(amount, description, emotion) {
  // High amount responses
  if (amount > 2000) {
    const responses = [
      `💰 Big spend: ${amount} Tk on ${description}! Worth it though? 😊`,
      `Whoa! ${amount} Tk for ${description}. Hope it was good! Logged. 📝`,
      `${amount} Tk on ${description}... treating yourself! 🎉 Added.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Food-related responses
  if (description.match(/lunch|dinner|food|breakfast|কাবার|খাবার|coffee|tea/i)) {
    if (emotion === 'guilty') {
      return `🍽️ ${amount} Tk for ${description}... again? 😅 It's okay, logged!`;
    }
    return `🍽️ ${amount} Tk for ${description}! Bon appétit! Added. 😋`;
  }
  
  // Low amount - encourage
  if (amount < 200) {
    return `✅ Nice! Only ${amount} Tk for ${description}. Keeping it lean! 💪 Logged.`;
  }
  
  // Sad emotion
  if (emotion === 'sad') {
    return `😔 I feel you... ${amount} Tk on ${description}. Let's call it self-care! Added.`;
  }
  
  // Happy emotion
  if (emotion === 'happy') {
    return `🎉 ${amount} Tk on ${description}! Worth it! Expense logged. 😊`;
  }
  
  // Default friendly responses
  const responses = [
    `✅ Got it! ${amount} Tk for ${description} logged. 📝`,
    `Added ${amount} Tk (${description}) to your expenses! ✓`,
    `Logged! ${amount} Tk spent on ${description}. 💸`,
    `${amount} Tk for ${description} - saved to your ledger! 📊`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// ========================================
// MESSAGE HANDLER WITH FULL NLP
// ========================================

client.on('message', async (message) => {
  const userPhone = message.from.replace('@c.us', '');
  const userMessage = message.body.trim();

  console.log(`📩 from ${userPhone}: ${userMessage}`);

  try {
    // Get conversation context
    let context = conversationContext.get(userPhone) || {};
    
    // Check if responding to mood question
    if (context.awaitingMoodResponse) {
      await handleMoodResponse(message, userPhone, userMessage);
      return;
    }
    
    // Try advanced NLP parsing
    const parsed = parseExpenseWithAdvancedNLP(userMessage, userPhone);
    
    if (parsed) {
      if (parsed.intent === 'add_expense') {
        await handleIntelligentExpense(message, userPhone, parsed);
        return;
      }
      
      if (parsed.intent === 'repeat_last_expense') {
        await handleRepeatLastExpense(message, userPhone);
        return;
      }
      
      if (parsed.intent === 'no_expense_today') {
        await message.reply('✅ Great! No-spend day marked. 🏆 Keep it up!');
        return;
      }
      
      if (parsed.intent === 'unclear_expense') {
        await message.reply(`I see ${parsed.amount} Tk, but what was it for? 🤔\n\nJust reply: "lunch" or "bus fare"`);
        context.pendingAmount = parsed.amount;
        conversationContext.set(userPhone, context);
        return;
      }
    }
    
    // If context has pending amount, treat this as description
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
    
    // Check for other commands
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
    else if (lower.match(/predict|will i run out/i)) {
      await handlePrediction(message, userPhone);
    }
    else {
      // Friendly fallback
      await message.reply(
        '🤔 Hmm, not sure I got that!\n\n' +
        'Try:\n' +
        '• "lunch 500"\n' +
        '• "spent 300 for bus"\n' +
        '• "balance"\n' +
        '• "help"'
      );
    }
    
  } catch (error) {
    console.error('Error:', error);
    await message.reply('⚠️ Oops! Something went wrong. Try again?');
  }
});

// ========================================
// INTELLIGENT EXPENSE HANDLER
// ========================================

async function handleIntelligentExpense(message, userPhone, parsed) {
  const { amount, description, emotion } = parsed;

  // Save to Firebase
  const expenseRef = await db.collection('expenses').add({
    userId: userPhone,
    amount: amount,
    description: description,
    category: 'Other',
    date: new Date(),
    createdAt: new Date(),
    source: 'whatsapp',
    emotion: emotion || 'neutral'
  });

  // Save to last expense for "same as yesterday" feature
  await db.collection('users').doc(userPhone).set({
    lastExpense: { amount, description },
    lastExpenseDate: new Date()
  }, { merge: true });

  // Personality response
  let response = getPersonalityResponse(amount, description, emotion);

  // Check budget warning
  const budgetWarning = await checkBudgetWarning(userPhone);
  if (budgetWarning) {
    response += `\n\n${budgetWarning}`;
  }

  await message.reply(response);

  // Proactive mood check (3 seconds after)
  setTimeout(async () => {
    try {
      await client.sendMessage(message.from, 
        `💭 Quick check: How do you feel about this ${description} expense?\n\n` +
        `Reply: 😊 Happy | 😐 Okay | 😢 Regret`
      );
      
      let context = conversationContext.get(userPhone) || {};
      context.awaitingMoodResponse = true;
      context.lastExpenseId = expenseRef.id;
      conversationContext.set(userPhone, context);
    } catch (err) {
      console.error('Could not send mood check:', err);
    }
  }, 3000);
}

// Handle mood response
async function handleMoodResponse(message, userPhone, response) {
  const lower = response.toLowerCase();
  let mood = 'neutral';
  
  if (lower.match(/😊|happy|good|worth|okay with it|glad/i)) {
    mood = 'happy';
  } else if (lower.match(/😢|😭|regret|waste|sad|bad|shouldn't/i)) {
    mood = 'regret';
  } else if (lower.match(/😐|okay|fine|neutral|meh/i)) {
    mood = 'neutral';
  }
  
  let context = conversationContext.get(userPhone);
  if (context && context.lastExpenseId) {
    await db.collection('expenses').doc(context.lastExpenseId).update({
      mood: mood,
      moodRecordedAt: new Date()
    });
  }
  
  // Respond based on mood
  if (mood === 'happy') {
    await message.reply('😊 Great! Glad it was worth it. Keep enjoying responsibly! 💚');
  } else if (mood === 'regret') {
    await message.reply('😔 I understand. Next time, maybe pause before spending? You've got this! 💪');
  } else {
    await message.reply('👍 Noted! Thanks for sharing.');
  }
  
  context.awaitingMoodResponse = false;
  conversationContext.set(userPhone, context);
}

// Repeat last expense
async function handleRepeatLastExpense(message, userPhone) {
  const userDoc = await db.collection('users').doc(userPhone).get();
  
  if (!userDoc.exists || !userDoc.data().lastExpense) {
    await message.reply('🤔 I don\'t remember your last expense. Can you tell me again?');
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

// Budget warning (same as before)
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

// Other handlers
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

async function handlePrediction(message, userPhone) {
  await message.reply('🔮 Prediction feature coming soon! Stay tuned.');
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

I'm your AI money buddy! Just chat naturally:

💸 *Add Expense (any format!)*
- "lunch 500"
- "for dinner 800"
- "spent 300 for bus"
- "আজকে ৫০০ টাকার lunch"
- "bro add 1000 taka pls"
- "same as yesterday"

💰 *Check Balance*
"balance" / "বাকি"

📊 *Commands*
- "status" - Budget report
- "goals" - View goals
- "motivate" - Get inspired
- "predict" - Will I run out?

Just talk to me! I understand Bangla, English, emotions & more! 😊🇧🇩
  `;
  await message.reply(helpText);
}

// Daily check-in at 9 PM
function startDailyCheckIn() {
  setInterval(async () => {
    const now = new Date();
    if (now.getHours() === 21 && now.getMinutes() === 0) {
      const users = await db.collection('users').get();
      users.forEach(async (doc) => {
        const userPhone = doc.data().userId;
        try {
          await client.sendMessage(`${userPhone}@c.us`, 
            `🌙 Evening check-in!\n\n💭 What did you spend today?\n\nJust say "lunch 500" or "no expense today"`
          );
        } catch (err) {
          console.error(`Could not send to ${userPhone}`);
        }
      });
    }
  }, 60000);
}

// Proactive messaging
function startProactiveMessaging() {
  // Future: Add more proactive features
  console.log('🤖 Proactive messaging enabled');
}

client.initialize();
console.log('🚀 Starting SaveUp Conversational AI Bot...');
