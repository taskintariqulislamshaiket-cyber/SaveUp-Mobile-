import { PetType, Achievement } from '../../types/pet';
import { PET_CONFIGS } from './petConfig';

export interface UnlockStatus {
  petType: PetType;
  isUnlocked: boolean;
  progress: number; // 0-100
  requirement: string;
  requirementMet: boolean;
}

/**
 * Check if a pet can be unlocked based on achievements
 */
export const canUnlockPet = (petType: PetType, achievements: Achievement): boolean => {
  const config = PET_CONFIGS[petType];
  
  switch (config.unlockRequirement.type) {
    case 'starter':
      return true; // Always unlocked
    
    case 'totalSaved':
      return achievements.totalSaved >= config.unlockRequirement.value;
    
    case 'streak':
      return achievements.streakDays >= config.unlockRequirement.value;
    
    case 'automation':
      return achievements.automatedExpenses >= config.unlockRequirement.value;
    
    case 'challenges':
      return achievements.challengesCompleted >= config.unlockRequirement.value;
    
    case 'goals':
      return achievements.goalsHit >= config.unlockRequirement.value;
    
    default:
      return false;
  }
};

/**
 * Get unlock progress for a pet (0-100)
 */
export const getUnlockProgress = (petType: PetType, achievements: Achievement): number => {
  const config = PET_CONFIGS[petType];
  
  if (config.unlockRequirement.type === 'starter') {
    return 100;
  }
  
  let current = 0;
  const target = config.unlockRequirement.value;
  
  switch (config.unlockRequirement.type) {
    case 'totalSaved':
      current = achievements.totalSaved;
      break;
    
    case 'streak':
      current = achievements.streakDays;
      break;
    
    case 'automation':
      current = achievements.automatedExpenses;
      break;
    
    case 'challenges':
      current = achievements.challengesCompleted;
      break;
    
    case 'goals':
      current = achievements.goalsHit;
      break;
  }
  
  return Math.min(100, Math.floor((current / target) * 100));
};

/**
 * Get unlock status for all pets
 */
export const getAllUnlockStatuses = (
  unlockedPets: PetType[],
  achievements: Achievement
): UnlockStatus[] => {
  return Object.keys(PET_CONFIGS).map(petType => {
    const pet = petType as PetType;
    const config = PET_CONFIGS[pet];
    const isUnlocked = unlockedPets.includes(pet);
    const requirementMet = canUnlockPet(pet, achievements);
    const progress = getUnlockProgress(pet, achievements);
    
    let requirement = '';
    switch (config.unlockRequirement.type) {
      case 'starter':
        requirement = 'Available from start';
        break;
      case 'totalSaved':
        requirement = `Save ৳${config.unlockRequirement.value.toLocaleString()} total`;
        break;
      case 'streak':
        requirement = `Maintain ${config.unlockRequirement.value}-day tracking streak`;
        break;
      case 'automation':
        requirement = `Automate ${config.unlockRequirement.value} recurring expenses`;
        break;
      case 'challenges':
        requirement = `Complete ${config.unlockRequirement.value} daily challenges`;
        break;
      case 'goals':
        requirement = `Achieve ${config.unlockRequirement.value} savings goals`;
        break;
    }
    
    return {
      petType: pet,
      isUnlocked,
      progress,
      requirement,
      requirementMet,
    };
  });
};

/**
 * Get next unlockable pet (closest to unlocking)
 */
export const getNextUnlockablePet = (
  unlockedPets: PetType[],
  achievements: Achievement
): UnlockStatus | null => {
  const statuses = getAllUnlockStatuses(unlockedPets, achievements)
    .filter(status => !status.isUnlocked && !status.requirementMet)
    .sort((a, b) => b.progress - a.progress);
  
  return statuses.length > 0 ? statuses[0] : null;
};

/**
 * Get newly unlockable pets (requirements met but not yet unlocked)
 */
export const getNewlyUnlockablePets = (
  unlockedPets: PetType[],
  achievements: Achievement
): PetType[] => {
  return Object.keys(PET_CONFIGS)
    .filter(petType => {
      const pet = petType as PetType;
      return !unlockedPets.includes(pet) && canUnlockPet(pet, achievements);
    }) as PetType[];
};
