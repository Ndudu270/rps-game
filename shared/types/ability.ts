// Ability Types for Text-Based Stance Card Combat System

export type AbilityType = 
  | 'attack'
  | 'defense'
  | 'buff'
  | 'debuff'
  | 'heal'
  | 'utility';

export type TargetType = 'self' | 'enemy' | 'both';

export interface AbilityEffect {
  type: 'damage' | 'heal' | 'shield' | 'status' | 'stat_mod';
  value?: number;
  stat?: keyof import('./stats').Stats;
  modifier?: number;
  duration?: number;
  statusId?: string;
  target?: 'self' | 'enemy';
}

export interface AbilityCondition {
  type: 'stance' | 'status' | 'hp_threshold' | 'sta_threshold' | 'turn_number';
  value?: string | number;
  stanceId?: string;
  statusId?: string;
  threshold?: number;
  comparison?: 'lt' | 'lte' | 'gt' | 'gte' | 'eq';
}

export interface Ability {
  id: string;
  name: string;
  description: string;
  type: AbilityType;
  cost: number;        // Stamina cost
  cooldown: number;    // Turns before reuse
  target: TargetType;
  effects: AbilityEffect[];
  conditions?: AbilityCondition[];
  multiplier?: number; // Damage/heal multiplier
  priority?: number;   // Action priority within turn
}

export function createAbility(base: Partial<Ability>): Ability {
  return {
    id: base.id || 'unknown',
    name: base.name || 'Unknown Ability',
    description: base.description || '',
    type: base.type || 'attack',
    cost: base.cost || 0,
    cooldown: base.cooldown || 0,
    target: base.target || 'enemy',
    effects: base.effects || [],
    conditions: base.conditions,
    multiplier: base.multiplier || 1.0,
    priority: base.priority || 0,
  };
}