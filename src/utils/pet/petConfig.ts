import { PetConfig, PetType } from '../../types/pet';

export const PET_CONFIGS: Record<PetType, PetConfig> = {
  meow: {
    id: 'meow',
    name: 'Meow',
    emoji: '🐱',
    personality: 'Anxious Saver',
    description: 'Your worried friend who checks prices 10 times. "Are you SURE you need that?" energy.',
    unlockRequirement: {
      type: 'starter',
      value: 0,
    },
    bonusType: 'Anti-impulse',
    bonusDescription: '+20% gems for resisting impulse buys',
    gradient: ['#ec4899', '#f43f5e'],
  },
  doge: {
    id: 'doge',
    name: 'Doge',
    emoji: '🐶',
    personality: 'Loyal Budgeter',
    description: 'Much save, very budget, wow. Supportive golden retriever energy.',
    unlockRequirement: {
      type: 'starter',
      value: 0,
    },
    bonusType: 'Consistency',
    bonusDescription: '2x gems on 7-day streaks',
    gradient: ['#f59e0b', '#f97316'],
  },
  finny: {
    id: 'finny',
    name: 'Finny',
    emoji: '🦊',
    personality: 'Smart Spender',
    description: 'The friend who finds all the deals. "Actually, there\'s a cheaper option..."',
    unlockRequirement: {
      type: 'starter',
      value: 0,
    },
    bonusType: 'Optimization',
    bonusDescription: 'Daily spending tips & alternatives',
    gradient: ['#8b5cf6', '#7c3aed'],
  },
  chill: {
    id: 'chill',
    name: 'Chill',
    emoji: '🐻',
    personality: 'Long-term Planner',
    description: '"It\'s about the journey" slow-life advocate. Monk mode, delayed gratification king.',
    unlockRequirement: {
      type: 'starter',
      value: 0,
    },
    bonusType: 'Long-term',
    bonusDescription: 'Monthly goal bonuses (500 gems)',
    gradient: ['#06b6d4', '#0891b2'],
  },
  sensei: {
    id: 'sensei',
    name: 'Sensei',
    emoji: '🦉',
    personality: 'Wise Mentor',
    description: 'Financial literacy king. Drops knowledge bombs about investing.',
    unlockRequirement: {
      type: 'totalSaved',
      value: 50000,
    },
    bonusType: 'Education',
    bonusDescription: 'Teaches you about tax, investments. "Did you know?" daily facts',
    gradient: ['#10b981', '#059669'],
  },
  zoom: {
    id: 'zoom',
    name: 'Zoom',
    emoji: '🐰',
    personality: 'Fast-paced Tracker',
    description: 'ADHD energy, chaos organized. "Quick! Log that expense NOW!"',
    unlockRequirement: {
      type: 'streak',
      value: 30,
    },
    bonusType: 'Efficiency',
    bonusDescription: 'Instant reminders, speed tracking rewards. 1-click categories',
    gradient: ['#3b82f6', '#2563eb'],
  },
  lazy: {
    id: 'lazy',
    name: 'Lazy',
    emoji: '🐼',
    personality: 'Automation King',
    description: 'Work smarter not harder. "Why do manually what tech can do?"',
    unlockRequirement: {
      type: 'automation',
      value: 5,
    },
    bonusType: 'Passive',
    bonusDescription: 'Auto-tracking bonus gems. Passive gem generation while you sleep',
    gradient: ['#14b8a6', '#0d9488'],
  },
  trashpanda: {
    id: 'trashpanda',
    name: 'Trash Panda',
    emoji: '🦝',
    personality: 'Budget Hacker',
    description: 'Chaotic good, dumpster-diver-but-make-it-cute. "One person\'s expense is my treasure"',
    unlockRequirement: {
      type: 'challenges',
      value: 20,
    },
    bonusType: 'Resourceful',
    bonusDescription: 'Extra gems for low-budget meals/thrift finds. "Trash to Treasure" challenges',
    gradient: ['#64748b', '#475569'],
  },
  dragon: {
    id: 'dragon',
    name: 'Dragon',
    emoji: '🐉',
    personality: 'Wealth Hoarder',
    description: 'Smaug energy. "A dragon sleeps on a pile of savings"',
    unlockRequirement: {
      type: 'goals',
      value: 10,
    },
    bonusType: 'Max Saver',
    bonusDescription: '3x gems for NOT spending. Treasure vault visualization',
    gradient: ['#ef4444', '#dc2626'],
  },
  mystic: {
    id: 'mystic',
    name: 'Mystic',
    emoji: '🦄',
    personality: 'Financial Freedom',
    description: 'Legendary. Financial freedom achieved, zen master. Only 1% unlock this.',
    unlockRequirement: {
      type: 'totalSaved',
      value: 100000,
    },
    bonusType: 'Ultimate',
    bonusDescription: 'ALL bonuses from all pets combined. Rainbow trail effects',
    gradient: ['#a855f7', '#ec4899'],
  },
};

export const STARTER_PETS: PetType[] = ['meow', 'doge', 'finny', 'chill'];
export const UNLOCKABLE_PETS: PetType[] = ['sensei', 'zoom', 'lazy', 'trashpanda', 'dragon', 'mystic'];

export const getPetConfig = (petType: PetType): PetConfig => {
  return PET_CONFIGS[petType];
};

export const getAllPets = (): PetConfig[] => {
  return Object.values(PET_CONFIGS);
};

export const getStarterPets = (): PetConfig[] => {
  return STARTER_PETS.map(id => PET_CONFIGS[id]);
};

export const getUnlockablePets = (): PetConfig[] => {
  return UNLOCKABLE_PETS.map(id => PET_CONFIGS[id]);
};
