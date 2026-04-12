// Stance Types for Text-Based Stance Card Combat System

import { StatModifiers } from './stats';

export interface StanceBonus {
  statMods?: StatModifiers;
  damageMod?: number;      // Multiplier to damage dealt
  defenseMod?: number;     // Multiplier to defense
  speedMod?: number;       // Modifier to turn priority
  critChance?: number;     // Critical hit chance bonus
  critMult?: number;       // Critical hit multiplier bonus
}

export interface StancePenalty {
  statMods?: StatModifiers;
  damageReduction?: number;  // Reduction to damage dealt
  defenseReduction?: number; // Reduction to defense
  restrictions?: string[];   // Ability type restrictions
}

export interface Stance {
  id: string;
  name: string;
  description: string;
  bonus: StanceBonus;
  penalty?: StancePenalty;
  duration?: number;    // -1 for indefinite until changed
  exclusive?: boolean;  // Cannot be combined with other stances
}

export function createStance(base: Partial<Stance>): Stance {
  return {
    id: base.id || 'unknown',
    name: base.name || 'Unknown Stance',
    description: base.description || '',
    bonus: base.bonus || {},
    penalty: base.penalty,
    duration: base.duration ?? -1,
    exclusive: base.exclusive ?? false,
  };
}