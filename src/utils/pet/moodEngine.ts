import { MoodState, PetType } from '../../types/pet';

export interface MoodChange {
  newMood: MoodState;
  happinessChange: number;
  energyChange: number;
  message: string;
}

/**
 * Calculate pet mood based on spending behavior
 */
export const calculateMoodFromSpending = (
  dailySpent: number,
  dailyBudget: number,
  currentHappiness: number,
  currentEnergy: number,
  petType: PetType
): MoodChange => {
  const spendingRatio = dailyBudget > 0 ? dailySpent / dailyBudget : 0;
  
  let happinessChange = 0;
  let energyChange = -5; // Slight energy loss over time
  let newMood: MoodState = 'neutral';
  let message = '';

  // Under budget (Good!)
  if (spendingRatio < 0.7) {
    happinessChange = 10;
    newMood = 'happy';
    
    const messages = [
      `${getPetName(petType)} is proud of you! 🌟`,
      `Great job staying under budget! ${getPetEmoji(petType)}`,
      `${getPetName(petType)} is doing a happy dance! 💃`,
      `Your savings game is strong today! 💪`,
    ];
    message = messages[Math.floor(Math.random() * messages.length)];
  }
  // Near budget (Neutral)
  else if (spendingRatio < 0.9) {
    happinessChange = 0;
    newMood = 'neutral';
    message = `${getPetName(petType)} is watching your budget closely... 👀`;
  }
  // Over budget (Sad)
  else if (spendingRatio < 1.2) {
    happinessChange = -15;
    newMood = 'sad';
    
    const messages = [
      `${getPetName(petType)} is worried about your spending... 😰`,
      `Budget exceeded! ${getPetName(petType)} looks concerned.`,
      `${getPetName(petType)} hopes you know what you're doing... 🤔`,
    ];
    message = messages[Math.floor(Math.random() * messages.length)];
  }
  // Way over budget (Very sad)
  else {
    happinessChange = -25;
    newMood = 'sad';
    message = `${getPetName(petType)} is very worried! You're way over budget! 🚨`;
  }

  // Pet-specific reactions
  if (petType === 'meow') {
    // Meow is more anxious - reacts stronger to overspending
    if (spendingRatio > 1.0) {
      happinessChange -= 5;
      message = `Meow is having anxiety about your spending! 😱`;
    }
  }

  if (petType === 'chill') {
    // Chill is more relaxed - less extreme reactions
    happinessChange = Math.floor(happinessChange * 0.7);
    if (spendingRatio > 1.0) {
      message = `Chill says: "It's okay, just do better tomorrow" ��`;
    }
  }

  if (petType === 'dragon') {
    // Dragon REALLY hates spending
    if (spendingRatio > 0.8) {
      happinessChange -= 10;
      message = `Dragon is guarding the treasure! STOP SPENDING! 🐉🔥`;
    }
  }

  // Calculate final happiness (0-100)
  const newHappiness = Math.max(0, Math.min(100, currentHappiness + happinessChange));
  const newEnergy = Math.max(0, Math.min(100, currentEnergy + energyChange));

  // Determine final mood based on happiness
  if (newHappiness > 70) {
    newMood = 'happy';
  } else if (newHappiness > 40) {
    newMood = 'neutral';
  } else if (newHappiness > 20) {
    newMood = 'sad';
  } else {
    newMood = 'sleeping'; // Too sad, went to sleep
    message = `${getPetName(petType)} is too sad and went to sleep... 😴`;
  }

  // Energy affects mood
  if (newEnergy < 20) {
    newMood = 'sleeping';
    message = `${getPetName(petType)} is exhausted and needs rest... 😴`;
  }

  return {
    newMood,
    happinessChange,
    energyChange,
    message,
  };
};

/**
 * Calculate mood after feeding pet
 */
export const calculateMoodAfterFeeding = (
  currentHappiness: number,
  currentEnergy: number,
  petType: PetType
): MoodChange => {
  return {
    newMood: 'excited',
    happinessChange: 20,
    energyChange: 30,
    message: `${getPetName(petType)} loved the food! Yum! 😋`,
  };
};

/**
 * Calculate mood when goal is achieved
 */
export const calculateMoodAfterGoal = (
  petType: PetType
): MoodChange => {
  return {
    newMood: 'excited',
    happinessChange: 30,
    energyChange: 10,
    message: `${getPetName(petType)} is celebrating your goal! 🎉🎊`,
  };
};

/**
 * Calculate mood decay over time (if not fed)
 */
export const calculateMoodDecay = (
  hoursSinceLastFed: number,
  currentHappiness: number,
  currentEnergy: number
): MoodChange => {
  let happinessChange = 0;
  let energyChange = 0;
  let newMood: MoodState = 'neutral';
  let message = '';

  if (hoursSinceLastFed > 48) {
    // 2 days without feeding
    happinessChange = -30;
    energyChange = -40;
    newMood = 'sleeping';
    message = 'Your pet is starving and exhausted! Please feed them! 😭';
  } else if (hoursSinceLastFed > 24) {
    // 1 day without feeding
    happinessChange = -15;
    energyChange = -20;
    newMood = 'sad';
    message = 'Your pet is getting hungry... 🍽️';
  } else if (hoursSinceLastFed > 12) {
    // Half day
    happinessChange = -5;
    energyChange = -10;
    message = 'Your pet could use some food soon...';
  }

  const newHappiness = Math.max(0, currentHappiness + happinessChange);
  const newEnergy = Math.max(0, currentEnergy + energyChange);

  return {
    newMood,
    happinessChange,
    energyChange,
    message,
  };
};

// Helper functions
const getPetName = (petType: PetType): string => {
  const names: Record<PetType, string> = {
    meow: 'Meow',
    doge: 'Doge',
    finny: 'Finny',
    chill: 'Chill',
    sensei: 'Sensei',
    zoom: 'Zoom',
    lazy: 'Lazy',
    trashpanda: 'Trash Panda',
    dragon: 'Dragon',
    mystic: 'Mystic',
  };
  return names[petType];
};

const getPetEmoji = (petType: PetType): string => {
  const emojis: Record<PetType, string> = {
    meow: '🐱',
    doge: '🐶',
    finny: '🦊',
    chill: '🐻',
    sensei: '🦉',
    zoom: '🐰',
    lazy: '🐼',
    trashpanda: '🦝',
    dragon: '🐉',
    mystic: '🦄',
  };
  return emojis[petType];
};

/**
 * Get mood animation style
 */
export const getMoodAnimation = (mood: MoodState): string => {
  const animations: Record<MoodState, string> = {
    happy: 'bounce',
    neutral: 'idle',
    sad: 'droop',
    sleeping: 'breathe',
    excited: 'jump',
  };
  return animations[mood];
};

/**
 * Get mood color filter
 */
export const getMoodFilter = (mood: MoodState): string => {
  const filters: Record<MoodState, string> = {
    happy: 'brightness(1.2) saturate(1.3)',
    neutral: 'none',
    sad: 'grayscale(0.6) brightness(0.8)',
    sleeping: 'blur(1px) grayscale(0.8)',
    excited: 'brightness(1.4) saturate(1.5)',
  };
  return filters[mood];
};
