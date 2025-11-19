import { PetType } from '../../types/pet';

export interface GemEarningReason {
  type: string;
  baseAmount: number;
  description: string;
}

export const GEM_EARNING_RULES: Record<string, GemEarningReason> = {
  TRACK_EXPENSE: {
    type: 'TRACK_EXPENSE',
    baseAmount: 5,
    description: 'Tracked an expense',
  },
  DAILY_LOGIN: {
    type: 'DAILY_LOGIN',
    baseAmount: 10,
    description: 'Daily login bonus',
  },
  UNDER_BUDGET: {
    type: 'UNDER_BUDGET',
    baseAmount: 20,
    description: 'Stayed under daily budget',
  },
  WEEKLY_STREAK: {
    type: 'WEEKLY_STREAK',
    baseAmount: 50,
    description: '7-day tracking streak',
  },
  GOAL_ACHIEVED: {
    type: 'GOAL_ACHIEVED',
    baseAmount: 100,
    description: 'Savings goal achieved',
  },
  COMPLETE_PROFILE: {
    type: 'COMPLETE_PROFILE',
    baseAmount: 50,
    description: 'Completed profile setup',
  },
  WHATSAPP_TRACK: {
    type: 'WHATSAPP_TRACK',
    baseAmount: 8,
    description: 'Tracked via WhatsApp bot',
  },
  SMS_AUTO_TRACK: {
    type: 'SMS_AUTO_TRACK',
    baseAmount: 5,
    description: 'SMS auto-tracked',
  },
  CHALLENGE_COMPLETE: {
    type: 'CHALLENGE_COMPLETE',
    baseAmount: 30,
    description: 'Daily challenge completed',
  },
  RESIST_IMPULSE: {
    type: 'RESIST_IMPULSE',
    baseAmount: 15,
    description: 'Resisted impulse buy',
  },
};

export const GEM_SPENDING_RULES = {
  FEED_PET: 20,
  ACCESSORY_BASIC: 50,
  ACCESSORY_PREMIUM: 100,
  ACCESSORY_LEGENDARY: 500,
  CHANGE_PET: 200,
  UNLOCK_PET_EARLY: 2000,
  XP_BOOSTER: 150,
  ENVIRONMENT: 300,
  ANIMATION: 200,
};

/**
 * Calculate gems earned with pet bonus
 */
export const calculateGemsEarned = (
  reason: string,
  currentPet: PetType,
  streakDays: number = 0
): number => {
  const rule = GEM_EARNING_RULES[reason];
  if (!rule) return 0;

  let amount = rule.baseAmount;

  // Apply pet bonuses
  if (currentPet === 'meow' && reason === 'RESIST_IMPULSE') {
    amount = Math.floor(amount * 1.2); // +20% for Meow
  }

  if (currentPet === 'doge' && reason === 'WEEKLY_STREAK') {
    amount = amount * 2; // 2x for Doge
  }

  if (currentPet === 'dragon' && reason === 'UNDER_BUDGET') {
    amount = amount * 3; // 3x for Dragon
  }

  if (currentPet === 'mystic') {
    amount = Math.floor(amount * 1.5); // +50% for Mystic on everything
  }

  return amount;
};

/**
 * Calculate XP earned from expense tracking
 */
export const calculateXPEarned = (expenseAmount: number): number => {
  // 1 XP per ৳10 spent (max 50 XP per expense)
  return Math.min(Math.floor(expenseAmount / 10), 50);
};

/**
 * Calculate level from XP
 */
export const calculateLevel = (xp: number): number => {
  // Level progression: 100 XP for level 1, +50 XP per level
  // Level 1: 0-100 XP
  // Level 2: 100-250 XP
  // Level 3: 250-450 XP
  // etc.
  let level = 0;
  let xpNeeded = 0;
  let increment = 100;

  while (xp >= xpNeeded) {
    level++;
    xpNeeded += increment;
    increment += 50;
  }

  return level;
};

/**
 * Calculate XP needed for next level
 */
export const calculateXPForNextLevel = (currentXP: number): { current: number; needed: number; level: number } => {
  const level = calculateLevel(currentXP);
  let xpNeeded = 0;
  let increment = 100;

  for (let i = 0; i <= level; i++) {
    xpNeeded += increment;
    increment += 50;
  }

  return {
    current: currentXP,
    needed: xpNeeded,
    level: level + 1,
  };
};
