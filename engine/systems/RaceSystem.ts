// Race System - Handles race-specific modifiers and passives

import { RACES, Race } from '../../shared/types/race';
import { PlayerStateInMatch, CombatEvent } from '../../shared/types/match';
import { StatModifiers } from '../../shared/types/stats';

export interface RaceEffectResult {
  events: CombatEvent[];
  statMods?: StatModifiers;
  damageMod?: number;
}

/**
 * Get race by ID
 */
export function getRace(raceId: string): Race | undefined {
  return RACES[raceId as keyof typeof RACES];
}

/**
 * Apply race stat modifiers to base stats
 */
export function applyRaceStatMods(
  baseStats: import('../../shared/types/stats').Stats,
  raceId: string
): import('../../shared/types/stats').Stats {
  const race = getRace(raceId);
  if (!race || !race.statMods) {
    return baseStats;
  }

  const mods = race.statMods;
  return {
    hp: Math.max(1, Math.floor(baseStats.hp * (1 + (mods.hpMod || 0)))),
    atk: Math.max(1, Math.floor(baseStats.atk * (1 + (mods.atkMod || 0)))),
    def: Math.max(1, Math.floor(baseStats.def * (1 + (mods.defMod || 0)))),
    spd: Math.max(1, Math.floor(baseStats.spd * (1 + (mods.spdMod || 0)))),
    int: Math.max(1, Math.floor(baseStats.int * (1 + (mods.intMod || 0)))),
    res: Math.max(1, Math.floor(baseStats.res * (1 + (mods.resMod || 0)))),
    sta: Math.max(1, Math.floor(baseStats.sta * (1 + (mods.staMod || 0)))),
  };
}

/**
 * Process race passive ability on turn start
 */
export function processRacePassiveOnTurnStart(
  playerState: PlayerStateInMatch
): RaceEffectResult {
  const events: CombatEvent[] = [];
  const race = getRace(playerState.config.raceId);
  
  if (!race) {
    return { events };
  }

  // Handle specific race passives
  switch (race.passiveAbility.effect) {
    case 'sta_regen_bonus':
      // Human: Extra stamina regen handled elsewhere
      break;
    
    case 'priority_boost':
      // Elf: Handled in TurnResolver
      break;
    
    default:
      break;
  }

  return { events };
}

/**
 * Check if race provides immunity to a status effect
 */
export function hasStatusImmunity(raceId: string, statusId: string): boolean {
  const race = getRace(raceId);
  if (!race) return false;

  // Construct is immune to bleed
  if (raceId === 'construct' && statusId === 'bleed') {
    return true;
  }

  return false;
}

/**
 * Get damage modifier based on race passive
 */
export function getRaceDamageModifier(
  playerState: PlayerStateInMatch,
  isLowHp: boolean
): number {
  const race = getRace(playerState.config.raceId);
  if (!race) return 1;

  // Orc berserker rage
  if (race.passiveAbility.effect === 'low_hp_damage_boost' && isLowHp) {
    return 1.1;
  }

  return 1;
}