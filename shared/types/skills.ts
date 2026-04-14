/**
 * Skill System Types - New RPG Structure
 * 
 * Skills are a major progression path:
 * - Players gain skill points on level up
 * - Skill points unlock or upgrade skills
 * - Skill Shop for buying new skills
 * - Skills linked to character class and progression
 */

export interface Skill {
  id: string;
  name: string;
  type: SkillType;
  category: SkillCategory;
  
  // Cost to learn/upgrade
  baseCost: number;  // Skill points required
  
  // Effects
  effects: SkillEffect[];
  description: string;
  
  // Requirements
  requirements: SkillRequirements;
  
  // Upgrade info
  maxUpgradeLevel: number;
  damagePerLevel?: number;
  cooldownReductionPerLevel?: number;
  
  // Tags for filtering
  tags: string[];
}

export type SkillType = 'attack' | 'defense' | 'buff' | 'debuff' | 'utility' | 'passive';
export type SkillCategory = 'basic' | 'advanced' | 'ultimate' | 'class' | 'racial';

export interface SkillEffect {
  type: EffectType;
  value: number;
  duration?: number;  // In turns/seconds
  scaling?: 'stat' | 'level' | 'weapon';
  statScaling?: string;  // Which stat to scale with
}

export type EffectType = 
  | 'damage'
  | 'heal'
  | 'shield'
  | 'buff'
  | 'debuff'
  | 'stun'
  | 'dot'  // Damage over time
  | 'hot'  // Heal over time
  | 'teleport'
  | 'summon';

export interface SkillRequirements {
  minLevel?: number;
  classIds?: string[];
  raceIds?: string[];
  prerequisiteSkillIds?: string[];
  statRequirements?: {
    strength?: number;
    agility?: number;
    intelligence?: number;
    charisma?: number;
    endurance?: number;
    perception?: number;
    luck?: number;
  };
}

// Learned skill instance on a character
export interface CharacterSkill {
  skillId: string;
  unlockLevel: number;  // Level when learned
  upgradeLevel: number;  // Current upgrade level (0 = base)
  spentPoints: number;   // Total skill points invested
  isEquipped: boolean;   // Whether skill is in active bar
}

// Skill shop item
export interface SkillShopItem {
  skillId: string;
  cost: number;  // Gold cost
  currency: 'gold' | 'skillPoints';
  available: boolean;
  stock?: number;  // -1 for infinite
  refreshes?: boolean;
}

// Skill shop state
export interface SkillShopState {
  availableSkills: SkillShopItem[];
  lastRefresh: number;
  nextRefresh: number;
  playerUnlocks: string[];  // Skill IDs player has unlocked
}

// Default skill categories
export const SKILL_CATEGORIES: SkillCategory[] = [
  'basic',
  'advanced',
  'ultimate',
  'class',
  'racial',
];

// Default skill types
export const SKILL_TYPES: SkillType[] = [
  'attack',
  'defense',
  'buff',
  'debuff',
  'utility',
  'passive',
];

/**
 * Calculate skill cost based on upgrade level
 */
export function calculateSkillCost(baseCost: number, currentLevel: number): number {
  // Cost increases by 50% per upgrade level
  return Math.floor(baseCost * (1 + currentLevel * 0.5));
}

/**
 * Get skill effect value at current upgrade level
 */
export function getSkillEffectValue(
  baseValue: number,
  upgradeLevel: number,
  damagePerLevel?: number
): number {
  if (damagePerLevel) {
    return baseValue + (upgradeLevel * damagePerLevel);
  }
  // Default: 10% increase per level
  return Math.floor(baseValue * (1 + upgradeLevel * 0.1));
}

/**
 * Check if character meets skill requirements
 */
export function canLearnSkill(
  characterLevel: number,
  characterClass: string,
  characterRace: string,
  characterStats: Record<string, number>,
  learnedSkillIds: string[],
  skill: Skill
): boolean {
  const req = skill.requirements;
  
  // Check level requirement
  if (req.minLevel && characterLevel < req.minLevel) {
    return false;
  }
  
  // Check class requirement
  if (req.classIds && !req.classIds.includes(characterClass)) {
    return false;
  }
  
  // Check race requirement
  if (req.raceIds && !req.raceIds.includes(characterRace)) {
    return false;
  }
  
  // Check prerequisite skills
  if (req.prerequisiteSkillIds) {
    for (const prereqId of req.prerequisiteSkillIds) {
      if (!learnedSkillIds.includes(prereqId)) {
        return false;
      }
    }
  }
  
  // Check stat requirements
  if (req.statRequirements) {
    const stats = req.statRequirements;
    if (stats.strength && characterStats.strength < stats.strength) return false;
    if (stats.agility && characterStats.agility < stats.agility) return false;
    if (stats.intelligence && characterStats.intelligence < stats.intelligence) return false;
    if (stats.charisma && characterStats.charisma < stats.charisma) return false;
    if (stats.endurance && characterStats.endurance < stats.endurance) return false;
    if (stats.perception && characterStats.perception < stats.perception) return false;
    if (stats.luck && characterStats.luck < stats.luck) return false;
  }
  
  return true;
}

/**
 * Create default skill shop state
 */
export function createDefaultSkillShop(): SkillShopState {
  return {
    availableSkills: [],
    lastRefresh: Date.now(),
    nextRefresh: Date.now() + 24 * 60 * 60 * 1000,  // 24 hours
    playerUnlocks: [],
  };
}

/**
 * Serialize skill shop for storage
 */
export function serializeSkillShop(shop: SkillShopState): string {
  return JSON.stringify(shop);
}

/**
 * Deserialize skill shop from storage
 */
export function deserializeSkillShop(data: string): SkillShopState {
  return JSON.parse(data);
}
