// Combat Calculator - Handles all damage and effect calculations
// Pure functions for deterministic results

import { Stats, applyStatModifiers } from '../../shared/types/stats';
import { AbilityEffect } from '../../shared/types/ability';
import { StanceBonus, StancePenalty } from '../../shared/types/stance';
import { SeededRNG } from './RNG';
import { clamp } from '../utils/clamp';

export interface DamageCalculationInput {
  attackerStats: Stats;
  defenderStats: Stats;
  abilityMultiplier: number;
  attackerStanceBonus?: StanceBonus;
  attackerStancePenalty?: StancePenalty;
  defenderStanceBonus?: StanceBonus;
  defenderStancePenalty?: StancePenalty;
  raceModifier?: number;
  factionModifier?: number;
  critChance?: number;
  critMultiplier?: number;
}

export interface DamageCalculationResult {
  baseDamage: number;
  finalDamage: number;
  isCrit: boolean;
  damageAfterDefense: number;
  modifiers: string[];
}

export interface HealCalculationInput {
  healerStats: Stats;
  baseHeal: number;
  abilityMultiplier: number;
  stanceBonus?: StanceBonus;
  raceModifier?: number;
  factionModifier?: number;
}

export interface HealCalculationResult {
  baseHeal: number;
  finalHeal: number;
  modifiers: string[];
}

/**
 * Calculate damage using the formula:
 * Base Damage = (ATK × ability multiplier) - DEF
 * Minimum damage = 1
 * All modifiers apply multiplicatively
 */
export function calculateDamage(input: DamageCalculationInput, rng: SeededRNG): DamageCalculationResult {
  const modifiers: string[] = [];
  
  const { 
    attackerStats, 
    defenderStats, 
    abilityMultiplier,
    attackerStanceBonus,
    attackerStancePenalty,
    defenderStanceBonus,
    defenderStancePenalty,
    raceModifier = 1,
    factionModifier = 1,
    critChance = 0,
    critMultiplier = 2,
  } = input;

  // Calculate base damage
  let baseDamage = attackerStats.atk * abilityMultiplier;
  
  // Apply attacker stance bonus damage modifier
  if (attackerStanceBonus?.damageMod && attackerStanceBonus.damageMod !== 1) {
    baseDamage *= attackerStanceBonus.damageMod;
    modifiers.push(`stance bonus ×${attackerStanceBonus.damageMod.toFixed(2)}`);
  }
  
  // Apply attacker stance penalty damage reduction
  if (attackerStancePenalty?.damageReduction && attackerStancePenalty.damageReduction > 0) {
    baseDamage *= (1 - attackerStancePenalty.damageReduction);
    modifiers.push(`stance penalty ×${(1 - attackerStancePenalty.damageReduction).toFixed(2)}`);
  }

  // Calculate effective defense
  let effectiveDefense = defenderStats.def;
  
  // Apply defender stance bonus defense modifier
  if (defenderStanceBonus?.defenseMod && defenderStanceBonus.defenseMod !== 1) {
    effectiveDefense *= defenderStanceBonus.defenseMod;
    modifiers.push(`defender stance defense ×${defenderStanceBonus.defenseMod.toFixed(2)}`);
  }

  // Calculate damage after defense
  let damageAfterDefense = Math.max(1, baseDamage - effectiveDefense);

  // Apply race modifier
  if (raceModifier !== 1) {
    damageAfterDefense *= raceModifier;
    modifiers.push(`race ×${raceModifier.toFixed(2)}`);
  }

  // Apply faction modifier
  if (factionModifier !== 1) {
    damageAfterDefense *= factionModifier;
    modifiers.push(`faction ×${factionModifier.toFixed(2)}`);
  }

  // Check for critical hit
  let isCrit = false;
  let finalDamage = damageAfterDefense;
  
  if (critChance > 0 && rng.chance(critChance)) {
    isCrit = true;
    finalDamage *= critMultiplier;
    modifiers.push(`CRIT ×${critMultiplier.toFixed(2)}`);
  }

  // Ensure minimum damage of 1
  finalDamage = Math.max(1, Math.floor(finalDamage));

  return {
    baseDamage: Math.floor(baseDamage),
    finalDamage,
    isCrit,
    damageAfterDefense: Math.floor(damageAfterDefense),
    modifiers,
  };
}

/**
 * Calculate healing amount
 */
export function calculateHeal(input: HealCalculationInput): HealCalculationResult {
  const modifiers: string[] = [];
  
  const {
    healerStats,
    baseHeal,
    abilityMultiplier,
    stanceBonus,
    raceModifier = 1,
    factionModifier = 1,
  } = input;

  // Calculate base heal
  let healAmount = baseHeal * abilityMultiplier;
  
  // Add INT scaling (10% of INT adds to heal)
  healAmount += healerStats.int * 0.1;

  // Apply stance bonus
  if (stanceBonus?.damageMod && stanceBonus.damageMod !== 1) {
    healAmount *= stanceBonus.damageMod;
    modifiers.push(`stance ×${stanceBonus.damageMod.toFixed(2)}`);
  }

  // Apply race modifier
  if (raceModifier !== 1) {
    healAmount *= raceModifier;
    modifiers.push(`race ×${raceModifier.toFixed(2)}`);
  }

  // Apply faction modifier
  if (factionModifier !== 1) {
    healAmount *= factionModifier;
    modifiers.push(`faction ×${factionModifier.toFixed(2)}`);
  }

  const finalHeal = Math.max(1, Math.floor(healAmount));

  return {
    baseHeal: Math.floor(baseHeal * abilityMultiplier),
    finalHeal,
    modifiers,
  };
}

/**
 * Apply shield to a player
 */
export function applyShield(currentShield: number, shieldAmount: number, maxShield?: number): number {
  let newShield = currentShield + shieldAmount;
  if (maxShield !== undefined) {
    newShield = Math.min(newShield, maxShield);
  }
  return Math.max(0, newShield);
}

/**
 * Calculate effective stats after all modifiers
 */
export function calculateEffectiveStats(
  baseStats: Stats,
  statMods: import('../../shared/types/stats').StatModifiers
): Stats {
  return applyStatModifiers(baseStats, statMods);
}

/**
 * Clamp a value between min and max bounds
 */
export function clampValue(value: number, min: number, max: number): number {
  return clamp(value, min, max);
}