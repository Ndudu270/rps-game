import { CharacterClass } from './character';

export type SkillType = 'active' | 'passive' | 'ultimate';

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  type: SkillType;
  baseCost: number; // Cost in skill points to unlock
  upgradeCostBase: number; // Base cost to upgrade (multiplied by level)
  maxLevel: number;
  effect: {
    type: string; // e.g., 'damage', 'heal', 'buff', 'stat_boost'
    value: number; // Base value
    scaling?: string; // e.g., 'strength', 'intelligence'
  };
  requiredClass?: CharacterClass;
  requiredLevel?: number;
  icon?: string;
}

export const SKILL_DATABASE: SkillDefinition[] = [
  // Warrior Skills
  {
    id: 'warrior_strike',
    name: 'Power Strike',
    description: 'A heavy blow dealing increased damage based on Strength.',
    type: 'active',
    baseCost: 1,
    upgradeCostBase: 1,
    maxLevel: 5,
    effect: { type: 'damage', value: 15, scaling: 'strength' },
    requiredClass: 'warrior',
    requiredLevel: 1,
  },
  {
    id: 'warrior_shout',
    name: 'Battle Cry',
    description: 'Temporarily increases Strength and Endurance.',
    type: 'active',
    baseCost: 2,
    upgradeCostBase: 2,
    maxLevel: 3,
    effect: { type: 'buff', value: 10, scaling: 'charisma' },
    requiredClass: 'warrior',
    requiredLevel: 5,
  },
  {
    id: 'warrior_mastery',
    name: 'Weapon Mastery',
    description: 'Passively increases weapon damage.',
    type: 'passive',
    baseCost: 3,
    upgradeCostBase: 3,
    maxLevel: 5,
    effect: { type: 'stat_boost', value: 5, scaling: 'strength' },
    requiredClass: 'warrior',
    requiredLevel: 10,
  },

  // Mage Skills
  {
    id: 'mage_fireball',
    name: 'Fireball',
    description: 'Hurls a ball of fire dealing magic damage.',
    type: 'active',
    baseCost: 1,
    upgradeCostBase: 1,
    maxLevel: 5,
    effect: { type: 'damage', value: 20, scaling: 'intelligence' },
    requiredClass: 'mage',
    requiredLevel: 1,
  },
  {
    id: 'mage_shield',
    name: 'Arcane Shield',
    description: 'Creates a barrier absorbing damage based on Intelligence.',
    type: 'active',
    baseCost: 2,
    upgradeCostBase: 2,
    maxLevel: 3,
    effect: { type: 'buff', value: 15, scaling: 'intelligence' },
    requiredClass: 'mage',
    requiredLevel: 5,
  },
  {
    id: 'mage_wisdom',
    name: 'Arcane Wisdom',
    description: 'Passively increases maximum Mana.',
    type: 'passive',
    baseCost: 3,
    upgradeCostBase: 3,
    maxLevel: 5,
    effect: { type: 'stat_boost', value: 10, scaling: 'intelligence' },
    requiredClass: 'mage',
    requiredLevel: 10,
  },

  // Rogue Skills
  {
    id: 'rogue_backstab',
    name: 'Backstab',
    description: 'Strikes from behind dealing critical damage based on Agility.',
    type: 'active',
    baseCost: 1,
    upgradeCostBase: 1,
    maxLevel: 5,
    effect: { type: 'damage', value: 18, scaling: 'agility' },
    requiredClass: 'rogue',
    requiredLevel: 1,
  },
  {
    id: 'rogue_vanish',
    name: 'Vanish',
    description: 'Briefly becomes invisible, increasing dodge chance.',
    type: 'active',
    baseCost: 2,
    upgradeCostBase: 2,
    maxLevel: 3,
    effect: { type: 'buff', value: 20, scaling: 'agility' },
    requiredClass: 'rogue',
    requiredLevel: 5,
  },
  {
    id: 'rogue_precision',
    name: 'Precision Strikes',
    description: 'Passively increases critical hit chance.',
    type: 'passive',
    baseCost: 3,
    upgradeCostBase: 3,
    maxLevel: 5,
    effect: { type: 'stat_boost', value: 2, scaling: 'agility' }, // 2% per level
    requiredClass: 'rogue',
    requiredLevel: 10,
  },

  // General / Hybrid Skills
  {
    id: 'general_first_aid',
    name: 'First Aid',
    description: 'Heals a small amount of HP instantly.',
    type: 'active',
    baseCost: 1,
    upgradeCostBase: 1,
    maxLevel: 5,
    effect: { type: 'heal', value: 20, scaling: 'endurance' },
    requiredLevel: 1,
  },
  {
    id: 'general_endurance',
    name: 'Iron Will',
    description: 'Increases maximum Health.',
    type: 'passive',
    baseCost: 2,
    upgradeCostBase: 2,
    maxLevel: 5,
    effect: { type: 'stat_boost', value: 10, scaling: 'endurance' },
    requiredLevel: 5,
  },
];

export function getSkillById(id: string): SkillDefinition | undefined {
  return SKILL_DATABASE.find((s) => s.id === id);
}

export function getSkillsForClass(cls: CharacterClass): SkillDefinition[] {
  return SKILL_DATABASE.filter(
    (s) => !s.requiredClass || s.requiredClass === cls
  );
}
