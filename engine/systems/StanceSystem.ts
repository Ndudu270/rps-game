// Stance System - Manages stance selection and bonuses

import { Stance, createStance } from '../../shared/types/stance';
import { PlayerStateInMatch, CombatEvent } from '../../shared/types/match';
import { StatModifiers } from '../../shared/types/stats';

export interface StanceChangeResult {
  updatedState: PlayerStateInMatch;
  event: CombatEvent | null;
  success: boolean;
  message?: string;
}

/**
 * Change a player's stance
 */
export function changeStance(
  playerState: PlayerStateInMatch,
  newStance: Stance | null
): StanceChangeResult {
  if (newStance === playerState.currentStance) {
    return {
      updatedState: playerState,
      event: null,
      success: false,
      message: 'Already in this stance',
    };
  }

  const oldStanceName = playerState.currentStance?.name || 'Neutral';
  
  playerState.currentStance = newStance;

  const event: CombatEvent | null = newStance ? {
    type: 'stance_changed',
    sourceId: playerState.config.id,
    targetId: playerState.config.id,
    stanceId: newStance.id,
    message: `${playerState.config.name} switches to ${newStance.name} stance!`,
  } : {
    type: 'stance_changed',
    sourceId: playerState.config.id,
    targetId: playerState.config.id,
    message: `${playerState.config.name} returns to neutral stance!`,
  };

  return {
    updatedState: playerState,
    event,
    success: true,
  };
}

/**
 * Get the current stance bonuses for a player
 */
export function getStanceBonuses(playerState: PlayerStateInMatch): {
  statMods?: StatModifiers;
  damageMod?: number;
  defenseMod?: number;
  speedMod?: number;
  critChance?: number;
  critMult?: number;
} {
  if (!playerState.currentStance) {
    return {};
  }

  return playerState.currentStance.bonus;
}

/**
 * Get the current stance penalties for a player
 */
export function getStancePenalties(playerState: PlayerStateInMatch) {
  if (!playerState.currentStance?.penalty) {
    return {};
  }

  return playerState.currentStance.penalty;
}

/**
 * Check if a stance change is allowed
 */
export function canChangeStance(
  playerState: PlayerStateInMatch,
  newStance: Stance
): { allowed: boolean; reason?: string } {
  // Check if player is silenced (some stances might require abilities)
  // For now, stance changes are always allowed
  
  return { allowed: true };
}

/**
 * Apply stance modifiers to stats
 */
export function applyStanceStatMods(
  baseStats: import('../../shared/types/stats').Stats,
  stanceBonus?: import('../../shared/types/stance').StanceBonus,
  stancePenalty?: import('../../shared/types/stance').StancePenalty
): import('../../shared/types/stats').Stats {
  let stats = { ...baseStats };

  if (stanceBonus?.statMods) {
    const mods = stanceBonus.statMods;
    if (mods.hpMod) stats.hp = Math.floor(stats.hp * (1 + mods.hpMod));
    if (mods.atkMod) stats.atk = Math.floor(stats.atk * (1 + mods.atkMod));
    if (mods.defMod) stats.def = Math.floor(stats.def * (1 + mods.defMod));
    if (mods.spdMod) stats.spd = Math.floor(stats.spd * (1 + mods.spdMod));
    if (mods.intMod) stats.int = Math.floor(stats.int * (1 + mods.intMod));
    if (mods.resMod) stats.res = Math.floor(stats.res * (1 + mods.resMod));
    if (mods.staMod) stats.sta = Math.floor(stats.sta * (1 + mods.staMod));
  }

  if (stancePenalty?.statMods) {
    const mods = stancePenalty.statMods;
    if (mods.hpMod && mods.hpMod < 0) stats.hp = Math.floor(stats.hp * (1 + mods.hpMod));
    if (mods.atkMod && mods.atkMod < 0) stats.atk = Math.floor(stats.atk * (1 + mods.atkMod));
    if (mods.defMod && mods.defMod < 0) stats.def = Math.floor(stats.def * (1 + mods.defMod));
    if (mods.spdMod && mods.spdMod < 0) stats.spd = Math.floor(stats.spd * (1 + mods.spdMod));
    if (mods.intMod && mods.intMod < 0) stats.int = Math.floor(stats.int * (1 + mods.intMod));
    if (mods.resMod && mods.resMod < 0) stats.res = Math.floor(stats.res * (1 + mods.resMod));
    if (mods.staMod && mods.staMod < 0) stats.sta = Math.floor(stats.sta * (1 + mods.staMod));
  }

  return stats;
}