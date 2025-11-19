export type PetType = 'meow' | 'doge' | 'finny' | 'chill' | 'sensei' | 'zoom' | 'lazy' | 'trashpanda' | 'dragon' | 'mystic';

export type MoodState = 'happy' | 'neutral' | 'sad' | 'sleeping' | 'excited';

export interface PetConfig {
  id: PetType;
  name: string;
  emoji: string;
  personality: string;
  description: string;
  unlockRequirement: {
    type: 'starter' | 'totalSaved' | 'streak' | 'automation' | 'challenges' | 'goals';
    value: number;
  };
  bonusType: string;
  bonusDescription: string;
  gradient: [string, string];
}

export interface PetState {
  currentPet: PetType;
  gems: number;
  unlockedPets: PetType[];
  accessories: string[];
  petLevel: number;
  petXP: number;
  lastFed: Date | null;
  moodState: MoodState;
  happiness: number; // 0-100
  energy: number; // 0-100
}

export interface Achievement {
  totalSaved: number;
  streakDays: number;
  automatedExpenses: number;
  challengesCompleted: number;
  goalsHit: number;
}

export interface GemTransaction {
  type: 'earn' | 'spend';
  amount: number;
  reason: string;
  timestamp: Date;
}
