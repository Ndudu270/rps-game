// Faction System - Handles faction-specific modifiers and passives

import { FACTIONS, Faction } from '../../shared/types/faction';
import { PlayerStateInMatch, CombatEvent } from '../../shared/types/match';
import { StatModifiers } from '../../shared/types/stats';

export interface FactionEffectResult {
  events: CombatEvent[];
  statMods?: StatModifiers;
  damageMod?: number;
  healAmount?: number;
  shieldAmount?: number;
}

/**
 * Get faction by ID
 */
export function getFaction(factionId: string): Faction | undefined {
  return FACTIONS[factionId as keyof typeof FACTIONS];
}

/**
 * Apply faction stat modifiers to base stats
 */
export function applyFactionStatMods(
  baseStats: import('../../shared/types/stats').Stats,
  factionId: string
): import('../../shared/types/stats').Stats {
  const faction = getFaction(factionId);
  if (!faction || !faction.statMods) {
    return baseStats;
  }

  const mods = faction.statMods;
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
 * Process faction passive ability on turn start
 */
export function processFactionPassiveOnTurnStart(
  playerState: PlayerStateInMatch,
  turnNumber: number
): FactionEffectResult {
  const events: CombatEvent[] = [];
  const faction = getFaction(playerState.config.factionId);
  
  if (!faction) {
    return { events };
  }

  let healAmount = 0;
  let damageMod = 1;

  switch (faction.passiveAbility.effect) {
    case 'hp_regen':
      // Solaris Order: Heal 5% of max HP at start of turn
      healAmount = Math.floor(playerState.maxHp * 0.05);
      playerState.currentHp = Math.min(playerState.maxHp, playerState.currentHp + healAmount);
      
      events.push({
        type: 'heal',
        sourceId: playerState.config.id,
        targetId: playerState.config.id,
        value: healAmount,
        message: `${playerState.config.name}'s Divine Blessing heals for ${healAmount} HP!`,
      });
      break;

    case 'stacking_attack':
      // Wild Pact: Gain 5% attack per turn (max 25%)
      const attackBonus = Math.min(0.25, turnNumber * 0.05);
      damageMod = 1 + attackBonus;
      
      events.push({
        type: 'message',
        sourceId: playerState.config.id,
        targetId: playerState.config.id,
        message: `${playerState.config.name}'s Primal Fury grows stronger! (+${(attackBonus * 100).toFixed(0)}% ATK)`,
      });
      break;

    default:
      break;
  }

  return { events, damageMod, healAmount };
}

/**
 * Process faction passive on damage taken
 */
export function processFactionPassiveOnDamageTaken(
  playerState: PlayerStateInMatch,
  damageTaken: number
): FactionEffectResult {
  const events: CombatEvent[] = [];
  const faction = getFaction(playerState.config.factionId);
  
  if (!faction) {
    return { events };
  }

  let shieldAmount = 0;

  switch (faction.passiveAbility.effect) {
    case 'damage_shield':
      // Iron Legion: Gain shield equal to 10% of damage taken
      shieldAmount = Math.floor(damageTaken * 0.1);
      playerState.shield += shieldAmount;
      
      events.push({
        type: 'shield',
        sourceId: playerState.config.id,
        targetId: playerState.config.id,
        value: shieldAmount,
        message: `${playerState.config.name}'s Iron Will generates ${shieldAmount} shield!`,
      });
      break;

    default:
      break;
  }

  return { events, shieldAmount };
}

/**
 * Process faction passive on damage dealt
 */
export function processFactionPassiveOnDamageDealt(
  playerState: PlayerStateInMatch,
  isFirstAttack: boolean
): FactionEffectResult {
  const events: CombatEvent[] = [];
  const faction = getFaction(playerState.config.factionId);
  
  if (!faction) {
    return { events };
  }

  let damageMod = 1;

  switch (faction.passiveAbility.effect) {
    case 'first_strike_bonus':
      // Void Syndicate: First attack deals 20% more damage
      if (isFirstAttack) {
        damageMod = 1.2;
        
        events.push({
          type: 'message',
          sourceId: playerState.config.id,
          targetId: playerState.config.id,
          message: `${playerState.config.name}'s Shadow Strike empowers the attack!`,
        });
      }
      break;

    default:
      break;
  }

  return { events, damageMod };
}

/**
 * Get faction damage modifier
 */
export function getFactionDamageModifier(
  playerState: PlayerStateInMatch,
  context: 'on_damage_dealt' | 'on_turn_start',
  isFirstAttack: boolean = false,
  turnNumber: number = 0
): number {
  const faction = getFaction(playerState.config.factionId);
  if (!faction) return 1;

  switch (faction.passiveAbility.effect) {
    case 'first_strike_bonus':
      if (context === 'on_damage_dealt' && isFirstAttack) {
        return 1.2;
      }
      break;
    
    case 'stacking_attack':
      if (context === 'on_turn_start') {
        return 1 + Math.min(0.25, turnNumber * 0.05);
      }
      break;
  }

  return 1;
}