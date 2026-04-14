/**
 * Character Types - New RPG Progression Model
 * 
 * Supports:
 * - Character creation with base stats
 * - Leveling up with XP
 * - Skill points for skill upgrades
 * - Equipment points for gear progression
 * - Persistent character data
 */

import { BaseStatsConfig } from '../../config/gameConfig';

export interface Character {
  // Identity
  id: string;
  name: string;
  class: string;
  race: string;
  
  // Progression
  level: number;
  xp: number;
  xpToNextLevel: number;
  
  // Points for progression
  skillPoints: number;
  equipmentPoints: number;
  
  // Stats
  baseStats: CharacterStats;
  derivedStats: DerivedStats;
  
  // Skills
  learnedSkills: LearnedSkill[];
  equippedSkills: string[];  // Skill IDs
  
  // Equipment
  equippedGear: EquippedGear;
  
  // Metadata
  createdAt: number;
  lastPlayedAt: number;
}

export interface CharacterStats extends BaseStatsConfig {
  // All stats extend from config
}

export interface DerivedStats {
  // Combat stats derived from base stats + equipment
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  critChance: number;
  critDamage: number;
}

export interface LearnedSkill {
  skillId: string;
  unlockLevel: number;
  upgradeLevel: number;  // 0 = base, max varies by skill
  spentPoints: number;   // Total skill points invested
}

export interface EquippedGear {
  weapon: EquippedItem | null;
  armor: EquippedItem | null;
  accessory: EquippedItem | null;
}

export interface EquippedItem {
  itemId: string;
  upgradeLevel: number;
  equipmentPointsSpent: number;
}

// Character creation data (before finalization)
export interface CharacterCreationData {
  name: string;
  class: string;
  race: string;
  baseStats: CharacterStats;
}

// Default stats for new characters
export const DEFAULT_BASE_STATS: CharacterStats = {
  strength: 5,
  agility: 5,
  intelligence: 5,
  charisma: 5,
  endurance: 5,
  perception: 5,
  luck: 5,
};

// Stat points available at character creation
export const CHARACTER_CREATION_STAT_POINTS = 30;
export const MIN_STAT_VALUE = 1;
export const MAX_STAT_VALUE_AT_CREATION = 10;

/**
 * Create a new character with default values
 */
export function createNewCharacter(creationData: CharacterCreationData): Character {
  const now = Date.now();
  
  return {
    id: generateCharacterId(),
    name: creationData.name,
    class: creationData.class,
    race: creationData.race,
    
    level: 1,
    xp: 0,
    xpToNextLevel: 100,  // Base XP for level 2
    
    skillPoints: 0,
    equipmentPoints: 0,
    
    baseStats: { ...creationData.baseStats },
    derivedStats: calculateDerivedStats(creationData.baseStats, { weapon: null, armor: null, accessory: null }),
    
    learnedSkills: [],
    equippedSkills: [],
    
    equippedGear: {
      weapon: null,
      armor: null,
      accessory: null,
    },
    
    createdAt: now,
    lastPlayedAt: now,
  };
}

/**
 * Calculate derived stats from base stats and equipment
 */
export function calculateDerivedStats(
  baseStats: CharacterStats,
  gear: EquippedGear
): DerivedStats {
  // Base calculations from primary stats
  const hp = Math.floor(100 + (baseStats.endurance * 10) + (baseStats.strength * 5));
  const attack = Math.floor(baseStats.strength * 2 + baseStats.agility * 1.5);
  const defense = Math.floor(baseStats.endurance * 1.5 + baseStats.strength * 0.5);
  const speed = Math.floor(baseStats.agility * 2 + baseStats.perception * 0.5);
  const critChance = Math.floor(baseStats.luck * 0.5 + baseStats.agility * 0.3);
  const critDamage = 150 + (baseStats.strength * 2);
  
  // Add equipment bonuses
  let equipmentAttack = 0;
  let equipmentDefense = 0;
  let equipmentHp = 0;
  let equipmentSpeed = 0;
  
  if (gear.weapon) {
    equipmentAttack += getEquipmentBonus('weapon', gear.weapon.upgradeLevel);
  }
  if (gear.armor) {
    equipmentDefense += getEquipmentBonus('armor', gear.armor.upgradeLevel);
    equipmentHp += getEquipmentBonus('armor', gear.armor.upgradeLevel) * 5;
  }
  if (gear.accessory) {
    equipmentSpeed += getEquipmentBonus('accessory', gear.accessory.upgradeLevel);
    equipmentAttack += getEquipmentBonus('accessory', gear.accessory.upgradeLevel) * 0.5;
  }
  
  return {
    hp: hp + equipmentHp,
    maxHp: hp + equipmentHp,
    attack: attack + equipmentAttack,
    defense: defense + equipmentDefense,
    speed: speed + equipmentSpeed,
    critChance: Math.min(critChance, 50),  // Cap at 50%
    critDamage: critDamage,
  };
}

/**
 * Get equipment bonus based on upgrade level
 */
function getEquipmentBonus(slot: string, upgradeLevel: number): number {
  const baseValues: Record<string, number> = {
    weapon: 10,
    armor: 8,
    accessory: 5,
  };
  const baseValue = baseValues[slot] || 5;
  return Math.floor(baseValue * (1 + upgradeLevel * 0.5));
}

/**
 * Generate a unique character ID
 */
function generateCharacterId(): string {
  return `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Add XP to character and handle leveling up
 */
export function addXp(character: Character, xpAmount: number): { leveledUp: boolean; newLevel: number } {
  character.xp += xpAmount;
  
  let leveledUp = false;
  let newLevel = character.level;
  
  while (character.xp >= character.xpToNextLevel && character.level < 100) {
    character.xp -= character.xpToNextLevel;
    character.level++;
    newLevel = character.level;
    leveledUp = true;
    
    // Grant skill points and equipment points on level up
    character.skillPoints += 2;  // 2 skill points per level
    character.equipmentPoints += 1;  // 1 equipment point per level
    
    // Increase XP requirement for next level
    character.xpToNextLevel = Math.floor(100 * Math.pow(character.level, 2.5));
    
    // Increase base stats slightly on level up
    increaseBaseStatsOnLevelUp(character);
  }
  
  // Recalculate derived stats
  character.derivedStats = calculateDerivedStats(character.baseStats, character.equippedGear);
  
  return { leveledUp, newLevel };
}

/**
 * Increase base stats on level up
 */
function increaseBaseStatsOnLevelUp(character: Character): void {
  // Small stat increases per level
  character.baseStats.strength += 0.5;
  character.baseStats.agility += 0.5;
  character.baseStats.intelligence += 0.5;
  character.baseStats.endurance += 0.5;
  character.baseStats.perception += 0.3;
  character.baseStats.luck += 0.2;
  character.baseStats.charisma += 0.2;
}

/**
 * Spend skill points to learn or upgrade a skill
 */
export function spendSkillPoints(
  character: Character,
  skillId: string,
  cost: number
): boolean {
  if (character.skillPoints < cost) {
    return false;
  }
  
  const existingSkill = character.learnedSkills.find(s => s.skillId === skillId);
  
  if (existingSkill) {
    // Upgrade existing skill
    existingSkill.upgradeLevel++;
    existingSkill.spentPoints += cost;
  } else {
    // Learn new skill
    character.learnedSkills.push({
      skillId,
      unlockLevel: character.level,
      upgradeLevel: 0,
      spentPoints: cost,
    });
  }
  
  character.skillPoints -= cost;
  return true;
}

/**
 * Spend equipment points to buy or upgrade equipment
 */
export function spendEquipmentPoints(
  character: Character,
  slot: 'weapon' | 'armor' | 'accessory',
  itemId: string,
  cost: number
): boolean {
  if (character.equipmentPoints < cost) {
    return false;
  }
  
  const currentGear = character.equippedGear[slot];
  
  if (currentGear && currentGear.itemId === itemId) {
    // Upgrade existing equipment
    currentGear.upgradeLevel++;
    currentGear.equipmentPointsSpent += cost;
  } else {
    // Equip new item
    character.equippedGear[slot] = {
      itemId,
      upgradeLevel: 0,
      equipmentPointsSpent: cost,
    };
  }
  
  character.equipmentPoints -= cost;
  
  // Recalculate derived stats
  character.derivedStats = calculateDerivedStats(character.baseStats, character.equippedGear);
  
  return true;
}

/**
 * Serialize character for storage
 */
export function serializeCharacter(character: Character): string {
  return JSON.stringify(character);
}

/**
 * Deserialize character from storage
 */
export function deserializeCharacter(data: string): Character {
  return JSON.parse(data);
}

/**
 * Get character summary for display
 */
export function getCharacterSummary(character: Character): string {
  return `${character.name} - Lv.${character.level} ${character.race} ${character.class}
XP: ${character.xp}/${character.xpToNextLevel}
Skill Points: ${character.skillPoints}
Equipment Points: ${character.equipmentPoints}
HP: ${character.derivedStats.hp}
ATK: ${character.derivedStats.attack}
DEF: ${character.derivedStats.defense}
SPD: ${character.derivedStats.speed}`;
}
