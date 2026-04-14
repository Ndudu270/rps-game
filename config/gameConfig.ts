/**
 * Game Configuration - New RPG Structure
 * 
 * This is a structured RPG with:
 * - Character building
 * - Leveling up
 * - Skill points
 * - Equipment points
 * - Story Mode with 10 Parts
 * - Survival Mode for each Part or Act
 * - Tower Mode from 1 to 100
 * - Training Mode
 * - Duels for PvP
 */

export interface GameConfig {
  // Progression settings
  maxLevel: number;
  xpPerLevel: number[];
  skillPointsPerLevel: number;
  equipmentPointsPerLevel: number;
  
  // Base stats configuration
  baseStats: BaseStatsConfig;
  
  // Game modes
  storyMode: StoryModeConfig;
  towerMode: TowerModeConfig;
  survivalMode: SurvivalModeConfig;
  trainingMode: TrainingModeConfig;
  duelMode: DuelModeConfig;
}

export interface BaseStatsConfig {
  strength: number;
  agility: number;
  intelligence: number;
  charisma: number;
  endurance: number;
  perception: number;
  luck: number;
}

export interface StoryModeConfig {
  totalParts: number;  // 10 Parts
  parts: StoryPartConfig[];
}

export interface StoryPartConfig {
  partNumber: number;
  name: string;
  description: string;
  minLevel: number;
  enemyLevels: number[];
  bossLevel: number;
  rewards: {
    gold: number;
    xp: number;
    equipmentPoints: number;
  };
}

export interface TowerModeConfig {
  totalFloors: number;  // 100 floors
  floors: TowerFloorConfig[];
}

export interface TowerFloorConfig {
  floorNumber: number;
  difficulty: number;
  enemyLevel: number;
  rewards: {
    gold: number;
    xp: number;
    equipmentPoints: number;
  };
}

export interface SurvivalModeConfig {
  wavesPerDifficulty: number;
  difficulties: SurvivalDifficultyConfig[];
}

export interface SurvivalDifficultyConfig {
  name: string;
  minLevel: number;
  waveCount: number;
  enemyLevelScaling: number;
}

export interface TrainingModeConfig {
  enabled: boolean;
  dummyTypes: TrainingDummyConfig[];
}

export interface TrainingDummyConfig {
  name: string;
  level: number;
  hp: number;
  defense: number;
}

export interface DuelModeConfig {
  enabled: boolean;
  ranked: boolean;
  casual: boolean;
  matchmakingEnabled: boolean;
}

// Default game configuration
export const defaultGameConfig: GameConfig = {
  maxLevel: 100,
  xpPerLevel: generateXpCurve(100),
  skillPointsPerLevel: 2,
  equipmentPointsPerLevel: 1,
  
  baseStats: {
    strength: 5,
    agility: 5,
    intelligence: 5,
    charisma: 5,
    endurance: 5,
    perception: 5,
    luck: 5,
  },
  
  storyMode: {
    totalParts: 10,
    parts: generateStoryParts(10),
  },
  
  towerMode: {
    totalFloors: 100,
    floors: generateTowerFloors(100),
  },
  
  survivalMode: {
    wavesPerDifficulty: 10,
    difficulties: [
      { name: 'Easy', minLevel: 1, waveCount: 10, enemyLevelScaling: 1.0 },
      { name: 'Normal', minLevel: 10, waveCount: 15, enemyLevelScaling: 1.2 },
      { name: 'Hard', minLevel: 25, waveCount: 20, enemyLevelScaling: 1.5 },
      { name: 'Expert', minLevel: 50, waveCount: 25, enemyLevelScaling: 2.0 },
      { name: 'Master', minLevel: 75, waveCount: 30, enemyLevelScaling: 2.5 },
    ],
  },
  
  trainingMode: {
    enabled: true,
    dummyTypes: [
      { name: 'Training Dummy', level: 1, hp: 100, defense: 0 },
      { name: 'Advanced Dummy', level: 10, hp: 500, defense: 10 },
      { name: 'Master Dummy', level: 50, hp: 2000, defense: 50 },
    ],
  },
  
  duelMode: {
    enabled: true,
    ranked: true,
    casual: true,
    matchmakingEnabled: true,
  },
};

// Direct exports for easy access in scenes
export const STORY_PARTS = defaultGameConfig.storyMode.parts;
export const TOWER_FLOORS = defaultGameConfig.towerMode.floors;
export const SURVIVAL_DIFFICULTIES = defaultGameConfig.survivalMode.difficulties;
export const TRAINING_DUMMIES = defaultGameConfig.trainingMode.dummyTypes;

function generateXpCurve(maxLevel: number): number[] {
  const xpCurve: number[] = [];
  for (let i = 0; i < maxLevel; i++) {
    // Exponential XP curve: base * (level ^ 2.5)
    xpCurve.push(Math.floor(100 * Math.pow(i + 1, 2.5)));
  }
  return xpCurve;
}

function generateStoryParts(totalParts: number): StoryPartConfig[] {
  const parts: StoryPartConfig[] = [];
  const partNames = [
    'The Beginning',
    'Rising Threat',
    'Dark Omens',
    'The First War',
    'Betrayal',
    'The Shadow Realm',
    'Alliance',
    'The Final Push',
    'Confrontation',
    'Destiny Fulfilled',
  ];
  
  for (let i = 0; i < totalParts; i++) {
    parts.push({
      partNumber: i + 1,
      name: partNames[i] || `Part ${i + 1}`,
      description: `Story Part ${i + 1}`,
      minLevel: i * 10 + 1,
      enemyLevels: [i * 10 + 1, i * 10 + 3, i * 10 + 5],
      bossLevel: i * 10 + 10,
      rewards: {
        gold: 100 * (i + 1),
        xp: 200 * (i + 1),
        equipmentPoints: i + 1,
      },
    });
  }
  return parts;
}

function generateTowerFloors(totalFloors: number): TowerFloorConfig[] {
  const floors: TowerFloorConfig[] = [];
  
  for (let i = 0; i < totalFloors; i++) {
    const floorNum = i + 1;
    const difficulty = 1 + (i * 0.1);
    const enemyLevel = Math.floor(1 + i * 0.5);
    
    floors.push({
      floorNumber: floorNum,
      difficulty,
      enemyLevel,
      rewards: {
        gold: Math.floor(10 * difficulty),
        xp: Math.floor(20 * difficulty),
        equipmentPoints: floorNum % 10 === 0 ? 1 : 0,
      },
    });
  }
  
  return floors;
}