/**
 * Player Data Manager - New RPG Progression Model
 * 
 * Handles persistent character data including:
 * - Character creation and progression
 * - Leveling up with XP
 * - Skill points and skill upgrades
 * - Equipment points and gear progression
 * - Game mode progress
 */

import { 
  Character, 
  CharacterCreationData, 
  createNewCharacter, 
  serializeCharacter, 
  deserializeCharacter,
  addXp,
  spendSkillPoints,
  spendEquipmentPoints,
} from '../../shared/types/character';

export interface PlayerProgress {
  // Story Mode progress
  storyMode: {
    currentPart: number;  // 1-10
    completedParts: number[];
    partProgress: Record<number, { completed: boolean; stars: number }>;
  };
  
  // Tower Mode progress
  towerMode: {
    highestFloor: number;  // 1-100
    completedFloors: number[];
  };
  
  // Survival Mode progress
  survivalMode: {
    bestWave: number;
    bestDifficulty: string;
  };
  
  // Training Mode
  trainingMode: {
    sessionsCompleted: number;
  };
  
  // Duels
  duels: {
    wins: number;
    losses: number;
    rating: number;
  };
}

export interface PlayerData {
  character: Character | null;
  progress: PlayerProgress;
  gold: number;
}

const STORAGE_KEY = 'rpsWarPlayerData_v2';

/**
 * Create default player progress tracking
 */
function createDefaultProgress(): PlayerProgress {
  return {
    storyMode: {
      currentPart: 1,
      completedParts: [],
      partProgress: {},
    },
    towerMode: {
      highestFloor: 0,
      completedFloors: [],
    },
    survivalMode: {
      bestWave: 0,
      bestDifficulty: 'None',
    },
    trainingMode: {
      sessionsCompleted: 0,
    },
    duels: {
      wins: 0,
      losses: 0,
      rating: 1000,
    },
  };
}

/**
 * Create default player data for new players
 */
export function createDefaultPlayerData(): PlayerData {
  return {
    character: null,
    progress: createDefaultProgress(),
    gold: 100,  // Starting gold
  };
}

/**
 * Load player data from localStorage
 */
export function loadPlayerData(): PlayerData {
  if (typeof localStorage === 'undefined') {
    return createDefaultPlayerData();
  }
  
  const saved = localStorage.getItem(STORAGE_KEY);
  
  if (!saved) {
    return createDefaultPlayerData();
  }
  
  try {
    const parsed = JSON.parse(saved);
    
    // Reconstruct character
    let character: Character | null = null;
    if (parsed.character) {
      if (typeof parsed.character === 'string') {
        character = deserializeCharacter(parsed.character);
      } else {
        character = parsed.character as Character;
      }
    }
    
    // Reconstruct progress
    const progress: PlayerProgress = parsed.progress || createDefaultProgress();
    
    return {
      character,
      progress,
      gold: parsed.gold ?? 100,
    };
  } catch (e) {
    console.error('Failed to load player data:', e);
    return createDefaultPlayerData();
  }
}

/**
 * Save player data to localStorage
 */
export function savePlayerData(data: PlayerData): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  
  try {
    const toSave = {
      character: data.character ? serializeCharacter(data.character) : null,
      progress: data.progress,
      gold: data.gold,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error('Failed to save player data:', e);
  }
}

/**
 * Initialize or load player data
 */
export function initializePlayerData(): PlayerData {
  const data = loadPlayerData();
  savePlayerData(data);
  return data;
}

/**
 * Create a new character
 */
export function createCharacter(data: PlayerData, creationData: CharacterCreationData): Character {
  const character = createNewCharacter(creationData);
  data.character = character;
  savePlayerData(data);
  return character;
}

/**
 * Get the current character
 */
export function getCharacter(data: PlayerData): Character | null {
  return data.character;
}

/**
 * Add XP to character
 */
export function addXpToCharacter(data: PlayerData, xpAmount: number): { leveledUp: boolean; newLevel: number } | null {
  if (!data.character) {
    return null;
  }
  
  const result = addXp(data.character, xpAmount);
  savePlayerData(data);
  return result;
}

/**
 * Spend skill points
 */
export function spendSkillPointsOnCharacter(
  data: PlayerData, 
  skillId: string, 
  cost: number
): boolean {
  if (!data.character) {
    return false;
  }
  
  const success = spendSkillPoints(data.character, skillId, cost);
  if (success) {
    savePlayerData(data);
  }
  return success;
}

/**
 * Spend equipment points
 */
export function spendEquipmentPointsOnCharacter(
  data: PlayerData,
  slot: 'weapon' | 'armor' | 'accessory',
  itemId: string,
  cost: number
): boolean {
  if (!data.character) {
    return false;
  }
  
  const success = spendEquipmentPoints(data.character, slot, itemId, cost);
  if (success) {
    savePlayerData(data);
  }
  return success;
}

/**
 * Update story mode progress
 */
export function updateStoryProgress(
  data: PlayerData,
  partNumber: number,
  completed: boolean,
  stars: number = 0
): void {
  if (completed && !data.progress.storyMode.completedParts.includes(partNumber)) {
    data.progress.storyMode.completedParts.push(partNumber);
  }
  data.progress.storyMode.partProgress[partNumber] = { completed, stars };
  
  // Unlock next part if completed
  if (completed && partNumber === data.progress.storyMode.currentPart && partNumber < 10) {
    data.progress.storyMode.currentPart = partNumber + 1;
  }
  
  savePlayerData(data);
}

/**
 * Update tower mode progress
 */
export function updateTowerProgress(data: PlayerData, floorNumber: number): void {
  if (floorNumber > data.progress.towerMode.highestFloor) {
    data.progress.towerMode.highestFloor = floorNumber;
  }
  if (!data.progress.towerMode.completedFloors.includes(floorNumber)) {
    data.progress.towerMode.completedFloors.push(floorNumber);
  }
  savePlayerData(data);
}

/**
 * Update survival mode progress
 */
export function updateSurvivalProgress(
  data: PlayerData,
  wave: number,
  difficulty: string
): void {
  if (wave > data.progress.survivalMode.bestWave) {
    data.progress.survivalMode.bestWave = wave;
    data.progress.survivalMode.bestDifficulty = difficulty;
  }
  savePlayerData(data);
}

/**
 * Update duel record
 */
export function updateDuelRecord(data: PlayerData, won: boolean, ratingChange: number): void {
  if (won) {
    data.progress.duels.wins++;
  } else {
    data.progress.duels.losses++;
  }
  data.progress.duels.rating += ratingChange;
  savePlayerData(data);
}

/**
 * Add gold to player
 */
export function addGold(data: PlayerData, amount: number): void {
  data.gold += amount;
  savePlayerData(data);
}

/**
 * Spend gold
 */
export function spendGold(data: PlayerData, amount: number): boolean {
  if (data.gold < amount) {
    return false;
  }
  data.gold -= amount;
  savePlayerData(data);
  return true;
}

/**
 * Reset player data (for new game)
 */
export function resetPlayerData(): PlayerData {
  const newData = createDefaultPlayerData();
  savePlayerData(newData);
  return newData;
}

/**
 * Export player data for backup
 */
export function exportPlayerData(data: PlayerData): string {
  return JSON.stringify({
    character: data.character ? serializeCharacter(data.character) : null,
    progress: data.progress,
    gold: data.gold,
    exportedAt: Date.now(),
    version: '2.0',
  });
}

/**
 * Import player data from backup
 */
export function importPlayerData(importedData: string): PlayerData {
  try {
    const parsed = JSON.parse(importedData);
    
    const data: PlayerData = {
      character: parsed.character ? deserializeCharacter(parsed.character) : null,
      progress: parsed.progress || createDefaultProgress(),
      gold: parsed.gold ?? 100,
    };
    
    savePlayerData(data);
    return data;
  } catch (e) {
    console.error('Failed to import player data:', e);
    throw new Error('Invalid import data format');
  }
}
