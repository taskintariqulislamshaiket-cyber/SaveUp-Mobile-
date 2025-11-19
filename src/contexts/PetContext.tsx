import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PetType, PetState, MoodState, Achievement, GemTransaction } from '../types/pet';
import { useAuth } from './AuthContext';
import { db, firebase } from '../config/firebase-config';
import { 
  calculateGemsEarned, 
  calculateXPEarned, 
  calculateLevel,
  GEM_SPENDING_RULES 
} from '../utils/pet/gemCalculator';
import { 
  calculateMoodFromSpending, 
  calculateMoodAfterFeeding,
  calculateMoodAfterGoal,
  calculateMoodDecay 
} from '../utils/pet/moodEngine';
import { canUnlockPet, getNewlyUnlockablePets } from '../utils/pet/unlockSystem';
import { STARTER_PETS } from '../utils/pet/petConfig';

interface PetContextType {
  petState: PetState | null;
  achievements: Achievement | null;
  loading: boolean;
  
  // Pet actions
  selectPet: (petType: PetType) => Promise<void>;
  feedPet: () => Promise<void>;
  earnGems: (reason: string, amount?: number) => Promise<void>;
  spendGems: (amount: number, reason: string) => Promise<void>;
  unlockPet: (petType: PetType) => Promise<void>;
  
  // Mood updates
  updateMoodFromSpending: (dailySpent: number, dailyBudget: number) => Promise<void>;
  updateMoodFromGoal: () => Promise<void>;
  
  // XP and leveling
  addXP: (amount: number) => Promise<void>;
  
  // Achievements
  updateAchievements: (updates: Partial<Achievement>) => Promise<void>;
  
  // Accessories
  buyAccessory: (accessoryId: string, cost: number) => Promise<void>;
}

const PetContext = createContext<PetContextType | undefined>(undefined);

export const usePet = () => {
  const context = useContext(PetContext);
  if (!context) {
    throw new Error('usePet must be used within PetProvider');
  }
  return context;
};

export const PetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [petState, setPetState] = useState<PetState | null>(null);
  const [achievements, setAchievements] = useState<Achievement | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize pet data for new users
  const initializePetData = async (userId: string) => {
    const initialPetState: PetState = {
      currentPet: 'meow', // Default starter pet
      gems: 50, // Welcome bonus
      unlockedPets: [...STARTER_PETS],
      accessories: [],
      petLevel: 1,
      petXP: 0,
      lastFed: new Date(),
      moodState: 'happy',
      happiness: 80,
      energy: 100,
    };

    const initialAchievements: Achievement = {
      totalSaved: 0,
      streakDays: 0,
      automatedExpenses: 0,
      challengesCompleted: 0,
      goalsHit: 0,
    };

    await db.collection('users').doc(userId).collection('petData').doc('state').set(initialPetState);
    await db.collection('users').doc(userId).collection('petData').doc('achievements').set(initialAchievements);

    return { initialPetState, initialAchievements };
  };

  // Load pet data from Firestore
  useEffect(() => {
    if (!user) {
      setPetState(null);
      setAchievements(null);
      setLoading(false);
      return;
    }

    const petStateRef = db.collection('users').doc(user.uid).collection('petData').doc('state');
    const achievementsRef = db.collection('users').doc(user.uid).collection('petData').doc('achievements');

    const unsubscribeState = petStateRef.onSnapshot(
      async (snapshot) => {
        if (!snapshot.exists) {
          // Initialize for new user
          const { initialPetState } = await initializePetData(user.uid);
          setPetState(initialPetState);
        } else {
          const data = snapshot.data() as PetState;
          // Convert Firestore timestamp to Date
          if (data.lastFed && typeof data.lastFed !== 'string') {
            data.lastFed = (data.lastFed as any).toDate();
          }
          setPetState(data);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error loading pet state:', error);
        setLoading(false);
      }
    );

    const unsubscribeAchievements = achievementsRef.onSnapshot(
      async (snapshot) => {
        if (!snapshot.exists) {
          const { initialAchievements } = await initializePetData(user.uid);
          setAchievements(initialAchievements);
        } else {
          setAchievements(snapshot.data() as Achievement);
        }
      },
      (error) => {
        console.error('Error loading achievements:', error);
      }
    );

    // Check for mood decay every hour
    const decayInterval = setInterval(() => {
      if (petState && petState.lastFed) {
        const hoursSinceLastFed = (Date.now() - new Date(petState.lastFed).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastFed > 12) {
          const decay = calculateMoodDecay(hoursSinceLastFed, petState.happiness, petState.energy);
          updatePetState({
            happiness: Math.max(0, petState.happiness + decay.happinessChange),
            energy: Math.max(0, petState.energy + decay.energyChange),
            moodState: decay.newMood,
          });
        }
      }
    }, 3600000); // Every hour

    return () => {
      unsubscribeState();
      unsubscribeAchievements();
      clearInterval(decayInterval);
    };
  }, [user]);

  // Update pet state in Firestore
  const updatePetState = async (updates: Partial<PetState>) => {
    if (!user || !petState) return;

    const petStateRef = db.collection('users').doc(user.uid).collection('petData').doc('state');
    await petStateRef.update(updates);
  };

  // Select/switch pet
  const selectPet = async (petType: PetType) => {
    if (!user || !petState) return;

    if (!petState.unlockedPets.includes(petType)) {
      throw new Error('Pet not unlocked yet!');
    }

    await updatePetState({ currentPet: petType });
  };

  // Feed pet
  const feedPet = async () => {
    if (!user || !petState) return;

    if (petState.gems < GEM_SPENDING_RULES.FEED_PET) {
      throw new Error('Not enough gems to feed pet!');
    }

    const moodChange = calculateMoodAfterFeeding(
      petState.happiness,
      petState.energy,
      petState.currentPet
    );

    await updatePetState({
      gems: petState.gems - GEM_SPENDING_RULES.FEED_PET,
      happiness: Math.min(100, petState.happiness + moodChange.happinessChange),
      energy: Math.min(100, petState.energy + moodChange.energyChange),
      moodState: moodChange.newMood,
      lastFed: new Date(),
    });

    // Log transaction
    await logGemTransaction('spend', GEM_SPENDING_RULES.FEED_PET, 'Fed pet');
  };

  // Earn gems
  const earnGems = async (reason: string, customAmount?: number) => {
    if (!user || !petState || !achievements) return;

    const amount = customAmount || calculateGemsEarned(reason, petState.currentPet, achievements.streakDays);

    await updatePetState({
      gems: petState.gems + amount,
    });

    await logGemTransaction('earn', amount, reason);
  };

  // Spend gems
  const spendGems = async (amount: number, reason: string) => {
    if (!user || !petState) return;

    if (petState.gems < amount) {
      throw new Error('Not enough gems!');
    }

    await updatePetState({
      gems: petState.gems - amount,
    });

    await logGemTransaction('spend', amount, reason);
  };

  // Unlock pet
  const unlockPet = async (petType: PetType) => {
    if (!user || !petState || !achievements) return;

    if (petState.unlockedPets.includes(petType)) {
      throw new Error('Pet already unlocked!');
    }

    if (!canUnlockPet(petType, achievements)) {
      throw new Error('Requirements not met!');
    }

    await updatePetState({
      unlockedPets: [...petState.unlockedPets, petType],
    });
  };

  // Update mood from spending
  const updateMoodFromSpending = async (dailySpent: number, dailyBudget: number) => {
    if (!user || !petState) return;

    const moodChange = calculateMoodFromSpending(
      dailySpent,
      dailyBudget,
      petState.happiness,
      petState.energy,
      petState.currentPet
    );

    await updatePetState({
      happiness: Math.min(100, Math.max(0, petState.happiness + moodChange.happinessChange)),
      energy: Math.min(100, Math.max(0, petState.energy + moodChange.energyChange)),
      moodState: moodChange.newMood,
    });
  };

  // Update mood from goal achievement
  const updateMoodFromGoal = async () => {
    if (!user || !petState) return;

    const moodChange = calculateMoodAfterGoal(petState.currentPet);

    await updatePetState({
      happiness: Math.min(100, petState.happiness + moodChange.happinessChange),
      energy: Math.min(100, petState.energy + moodChange.energyChange),
      moodState: moodChange.newMood,
    });

    // Bonus gems for goal achievement
    await earnGems('GOAL_ACHIEVED');
  };

  // Add XP
  const addXP = async (amount: number) => {
    if (!user || !petState) return;

    const newXP = petState.petXP + amount;
    const newLevel = calculateLevel(newXP);

    await updatePetState({
      petXP: newXP,
      petLevel: newLevel,
    });

    // Level up bonus
    if (newLevel > petState.petLevel) {
      await earnGems('LEVEL_UP', newLevel * 20);
    }
  };

  // Update achievements
  const updateAchievements = async (updates: Partial<Achievement>) => {
    if (!user || !achievements) return;

    const achievementsRef = db.collection('users').doc(user.uid).collection('petData').doc('achievements');
    await achievementsRef.update(updates);

    // Check for newly unlockable pets
    const newAchievements = { ...achievements, ...updates };
    const newlyUnlockable = getNewlyUnlockablePets(petState?.unlockedPets || [], newAchievements);
    
    // Auto-unlock if requirements met
    for (const petType of newlyUnlockable) {
      await unlockPet(petType);
    }
  };

  // Buy accessory
  const buyAccessory = async (accessoryId: string, cost: number) => {
    if (!user || !petState) return;

    if (petState.gems < cost) {
      throw new Error('Not enough gems!');
    }

    await updatePetState({
      gems: petState.gems - cost,
      accessories: [...petState.accessories, accessoryId],
    });

    await logGemTransaction('spend', cost, `Bought accessory: ${accessoryId}`);
  };

  // Log gem transaction
  const logGemTransaction = async (type: 'earn' | 'spend', amount: number, reason: string) => {
    if (!user) return;

    const transaction: GemTransaction = {
      type,
      amount,
      reason,
      timestamp: new Date(),
    };

    await db
      .collection('users')
      .doc(user.uid)
      .collection('petData')
      .doc('transactions')
      .collection('history')
      .add(transaction);
  };

  const value: PetContextType = {
    petState,
    achievements,
    loading,
    selectPet,
    feedPet,
    earnGems,
    spendGems,
    unlockPet,
    updateMoodFromSpending,
    updateMoodFromGoal,
    addXP,
    updateAchievements,
    buyAccessory,
  };

  return <PetContext.Provider value={value}>{children}</PetContext.Provider>;
};
