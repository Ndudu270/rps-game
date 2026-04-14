/**
 * Equipment System Types - New RPG Structure
 * 
 * Equipment uses Equipment Points instead of complex merge/crafting:
 * - Players gain equipment points through progression
 * - Equipment points buy new equipment or upgrade existing
 * - Simple categories: weapon, armor, accessory
 */

export interface Equipment {
  id: string;
  name: string;
  slot: EquipmentSlot;
  tier: EquipmentTier;
  
  // Stats provided
  stats: EquipmentStats;
  
  // Cost
  baseCost: number;  // Equipment points required
  goldCost?: number;  // Optional gold cost
  
  // Requirements
  requirements: EquipmentRequirements;
  
  // Description
  description: string;
  
  // Tags for filtering
  tags: string[];
}

export type EquipmentSlot = 'weapon' | 'armor' | 'accessory';
export type EquipmentTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface EquipmentStats {
  // Primary stats
  attack?: number;
  defense?: number;
  hp?: number;
  speed?: number;
  
  // Secondary stats
  critChance?: number;
  critDamage?: number;
  lifesteal?: number;
  cooldownReduction?: number;
  
  // Special effects
  specialEffects?: EquipmentEffect[];
}

export interface EquipmentEffect {
  id: string;
  name: string;
  description: string;
  value: number;
  trigger?: 'onHit' | 'onKill' | 'onDamageTaken' | 'passive';
}

export interface EquipmentRequirements {
  minLevel?: number;
  classIds?: string[];
  statRequirements?: {
    strength?: number;
    agility?: number;
    intelligence?: number;
    endurance?: number;
  };
}

// Player's owned equipment
export interface OwnedEquipment {
  equipmentId: string;
  upgradeLevel: number;
  equipmentPointsSpent: number;
  acquiredAt: number;
}

// Currently equipped gear
export interface EquippedGear {
  weapon: OwnedEquipment | null;
  armor: OwnedEquipment | null;
  accessory: OwnedEquipment | null;
}

// Equipment shop item
export interface EquipmentShopItem {
  equipmentId: string;
  cost: number;  // Equipment points or gold
  currency: 'equipmentPoints' | 'gold';
  available: boolean;
  stock?: number;  // -1 for infinite
}

// Equipment shop state
export interface EquipmentShopState {
  availableItems: EquipmentShopItem[];
  playerOwned: string[];  // Equipment IDs player owns
}

// Tier multipliers for stats
export const TIER_MULTIPLIERS: Record<EquipmentTier, number> = {
  common: 1.0,
  uncommon: 1.3,
  rare: 1.6,
  epic: 2.0,
  legendary: 2.5,
};

// Slot base values
export const SLOT_BASE_VALUES = {
  weapon: { attack: 10, critChance: 2 },
  armor: { defense: 8, hp: 50 },
  accessory: { speed: 5, critDamage: 10 },
};

/**
 * Calculate equipment cost based on upgrade level
 */
export function calculateEquipmentCost(baseCost: number, currentLevel: number): number {
  // Cost increases by 40% per upgrade level
  return Math.floor(baseCost * (1 + currentLevel * 0.4));
}

/**
 * Get equipment stats at current upgrade level
 */
export function getEquipmentStats(equipment: Equipment, upgradeLevel: number): EquipmentStats {
  const tierMult = TIER_MULTIPLIERS[equipment.tier];
  const levelMult = 1 + (upgradeLevel * 0.2);  // 20% increase per level
  const totalMult = tierMult * levelMult;
  
  const result: EquipmentStats = {};
  
  if (equipment.stats.attack) {
    result.attack = Math.floor(equipment.stats.attack * totalMult);
  }
  if (equipment.stats.defense) {
    result.defense = Math.floor(equipment.stats.defense * totalMult);
  }
  if (equipment.stats.hp) {
    result.hp = Math.floor(equipment.stats.hp * totalMult);
  }
  if (equipment.stats.speed) {
    result.speed = Math.floor(equipment.stats.speed * totalMult);
  }
  if (equipment.stats.critChance) {
    result.critChance = Math.min(equipment.stats.critChance * levelMult, 50);  // Cap at 50%
  }
  if (equipment.stats.critDamage) {
    result.critDamage = Math.floor(equipment.stats.critDamage * levelMult);
  }
  if (equipment.stats.lifesteal) {
    result.lifesteal = Math.min(equipment.stats.lifesteal * levelMult, 30);  // Cap at 30%
  }
  if (equipment.stats.cooldownReduction) {
    result.cooldownReduction = Math.min(equipment.stats.cooldownReduction * levelMult, 50);  // Cap at 50%
  }
  
  // Copy special effects
  if (equipment.stats.specialEffects) {
    result.specialEffects = equipment.stats.specialEffects.map(effect => ({
      ...effect,
      value: Math.floor(effect.value * levelMult),
    }));
  }
  
  return result;
}

/**
 * Check if character meets equipment requirements
 */
export function canEquip(
  characterLevel: number,
  characterClass: string,
  characterStats: Record<string, number>,
  equipment: Equipment
): boolean {
  const req = equipment.requirements;
  
  // Check level requirement
  if (req.minLevel && characterLevel < req.minLevel) {
    return false;
  }
  
  // Check class requirement
  if (req.classIds && !req.classIds.includes(characterClass)) {
    return false;
  }
  
  // Check stat requirements
  if (req.statRequirements) {
    const stats = req.statRequirements;
    if (stats.strength && characterStats.strength < stats.strength) return false;
    if (stats.agility && characterStats.agility < stats.agility) return false;
    if (stats.intelligence && characterStats.intelligence < stats.intelligence) return false;
    if (stats.endurance && characterStats.endurance < stats.endurance) return false;
  }
  
  return true;
}

/**
 * Create default equipment shop state
 */
export function createDefaultEquipmentShop(): EquipmentShopState {
  return {
    availableItems: [],
    playerOwned: [],
  };
}

/**
 * Serialize equipment shop for storage
 */
export function serializeEquipmentShop(shop: EquipmentShopState): string {
  return JSON.stringify(shop);
}

/**
 * Deserialize equipment shop from storage
 */
export function deserializeEquipmentShop(data: string): EquipmentShopState {
  return JSON.parse(data);
}

/**
 * Get total stats from equipped gear
 */
export function getTotalGearStats(gear: EquippedGear): EquipmentStats {
  const total: EquipmentStats = {};
  
  for (const slot of ['weapon', 'armor', 'accessory'] as EquipmentSlot[]) {
    const item = gear[slot];
    if (!item) continue;
    
    // In a real implementation, we'd look up the equipment data
    // For now, just aggregate what we have stored
  }
  
  return total;
}
