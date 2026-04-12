// Ability System - Manages ability execution and effects

import { Ability, AbilityEffect } from '../../shared/types/ability';
import { PlayerStateInMatch, CombatEvent, PlayerId } from '../../shared/types/match';
import { SeededRNG } from '../core/RNG';
import { calculateDamage, calculateHeal, applyShield } from '../core/CombatCalculator';
import { applyStatus, canUseAbilities } from './StatusSystem';
import { getStanceBonuses, getStancePenalties } from './StanceSystem';
import { RACES } from '../../shared/types/race';
import { FACTIONS } from '../../shared/types/faction';

export interface AbilityExecutionResult {
  success: boolean;
  events: CombatEvent[];
  message?: string;
  cooldownApplied: boolean;
}

/**
 * Check if a player can use an ability
 */
export function canUseAbility(
  playerState: PlayerStateInMatch,
  ability: Ability
): { allowed: boolean; reason?: string } {
  // Check silence
  if (!canUseAbilities(playerState)) {
    return { allowed: false, reason: 'Silenced' };
  }

  // Check stamina cost
  if (playerState.currentSta < ability.cost) {
    return { allowed: false, reason: 'Not enough stamina' };
  }

  // Check cooldown
  const remainingCooldown = playerState.abilityCooldowns[ability.id] || 0;
  if (remainingCooldown > 0) {
    return { allowed: false, reason: `On cooldown (${remainingCooldown} turns)` };
  }

  // Check conditions
  if (ability.conditions) {
    for (const condition of ability.conditions) {
      if (!checkCondition(playerState, condition)) {
        return { allowed: false, reason: 'Conditions not met' };
      }
    }
  }

  return { allowed: true };
}

/**
 * Check if a condition is met
 */
function checkCondition(
  playerState: PlayerStateInMatch,
  condition: import('../../shared/types/ability').AbilityCondition
): boolean {
  switch (condition.type) {
    case 'stance':
      return playerState.currentStance?.id === condition.stanceId;
    
    case 'status':
      return playerState.activeStatuses.some(s => s.id === condition.statusId);
    
    case 'hp_threshold': {
      const hpPercent = playerState.currentHp / playerState.maxHp;
      switch (condition.comparison) {
        case 'lt': return hpPercent < (condition.threshold || 0);
        case 'lte': return hpPercent <= (condition.threshold || 0);
        case 'gt': return hpPercent > (condition.threshold || 0);
        case 'gte': return hpPercent >= (condition.threshold || 0);
        case 'eq': return hpPercent === (condition.threshold || 0);
        default: return false;
      }
    }
    
    case 'sta_threshold': {
      const staPercent = playerState.currentSta / playerState.maxSta;
      switch (condition.comparison) {
        case 'lt': return staPercent < (condition.threshold || 0);
        case 'lte': return staPercent <= (condition.threshold || 0);
        case 'gt': return staPercent > (condition.threshold || 0);
        case 'gte': return staPercent >= (condition.threshold || 0);
        case 'eq': return staPercent === (condition.threshold || 0);
        default: return false;
      }
    }
    
    default:
      return true;
  }
}

/**
 * Execute an ability
 */
export function executeAbility(
  sourceState: PlayerStateInMatch,
  targetState: PlayerStateInMatch | null,
  ability: Ability,
  rng: SeededRNG
): AbilityExecutionResult {
  const events: CombatEvent[] = [];
  
  // Check if ability can be used
  const canUse = canUseAbility(sourceState, ability);
  if (!canUse.allowed) {
    return {
      success: false,
      events: [],
      message: canUse.reason,
      cooldownApplied: false,
    };
  }

  // Deduct stamina cost
  sourceState.currentSta = Math.max(0, sourceState.currentSta - ability.cost);

  // Get stance bonuses/penalties
  const sourceBonuses = getStanceBonuses(sourceState);
  const sourcePenalties = getStancePenalties(sourceState);
  const targetBonuses = targetState ? getStanceBonuses(targetState) : undefined;
  const targetPenalties = targetState ? getStancePenalties(targetState) : undefined;

  // Get race and faction modifiers
  const sourceRace = RACES[sourceState.config.raceId];
  const sourceFaction = FACTIONS[sourceState.config.factionId];
  const raceMod = sourceRace?.passiveAbility.effect === 'ability_power_boost' ? 1.1 : 1;
  const factionMod = 1; // Faction mods handled elsewhere

  // Process each effect
  for (const effect of ability.effects) {
    switch (effect.type) {
      case 'damage': {
        if (!targetState) continue;
        
        const damageInput = {
          attackerStats: sourceState.stats,
          defenderStats: targetState.stats,
          abilityMultiplier: ability.multiplier || 1,
          attackerStanceBonus: sourceBonuses,
          attackerStancePenalty: sourcePenalties,
          defenderStanceBonus: targetBonuses,
          defenderStancePenalty: targetPenalties,
          raceModifier: raceMod,
          factionModifier: factionMod,
          critChance: sourceBonuses.critChance || 0,
          critMultiplier: sourceBonuses.critMult || 2,
        };

        const damageResult = calculateDamage(damageInput, rng);

        // Apply shield absorption
        let actualDamage = damageResult.finalDamage;
        if (targetState.shield > 0) {
          const absorbed = Math.min(targetState.shield, actualDamage);
          targetState.shield -= absorbed;
          actualDamage -= absorbed;
          
          if (absorbed > 0) {
            events.push({
              type: 'shield',
              sourceId: targetState.config.id,
              targetId: targetState.config.id,
              value: -absorbed,
              message: `${targetState.config.name}'s shield absorbs ${absorbed} damage!`,
            });
          }
        }

        // Apply damage to HP
        targetState.currentHp = Math.max(0, targetState.currentHp - actualDamage);

        events.push({
          type: 'damage',
          sourceId: sourceState.config.id,
          targetId: targetState.config.id,
          value: actualDamage,
          abilityId: ability.id,
          message: `${sourceState.config.name} uses ${ability.name} dealing ${actualDamage} damage to ${targetState.config.name}!${damageResult.isCrit ? ' CRITICAL HIT!' : ''}`,
        });
        break;
      }

      case 'heal': {
        const healInput = {
          healerStats: sourceState.stats,
          baseHeal: effect.value || 0,
          abilityMultiplier: ability.multiplier || 1,
          stanceBonus: sourceBonuses,
          raceModifier: raceMod,
          factionModifier: factionMod,
        };

        const healResult = calculateHeal(healInput);
        const healTarget = effect.target === 'self' ? sourceState : targetState;
        
        if (healTarget) {
          healTarget.currentHp = Math.min(healTarget.maxHp, healTarget.currentHp + healResult.finalHeal);
          
          events.push({
            type: 'heal',
            sourceId: sourceState.config.id,
            targetId: healTarget.config.id,
            value: healResult.finalHeal,
            abilityId: ability.id,
            message: `${sourceState.config.name} heals ${healTarget.config.name} for ${healResult.finalHeal} HP!`,
          });
        }
        break;
      }

      case 'shield': {
        const shieldAmount = effect.value || 0;
        const shieldTarget = effect.target === 'self' ? sourceState : targetState;
        
        if (shieldTarget) {
          shieldTarget.shield = applyShield(shieldTarget.shield, shieldAmount);
          
          events.push({
            type: 'shield',
            sourceId: sourceState.config.id,
            targetId: shieldTarget.config.id,
            value: shieldAmount,
            abilityId: ability.id,
            message: `${sourceState.config.name} gains ${shieldAmount} shield!`,
          });
        }
        break;
      }

      case 'status': {
        if (effect.statusId && targetState) {
          const statusTarget = effect.target === 'self' ? sourceState : targetState;
          const result = applyStatus(statusTarget, effect.statusId, effect.duration, effect.value);
          
          if (result.event) {
            result.event.sourceId = sourceState.config.id;
            result.event.abilityId = ability.id;
            events.push(result.event);
          }
        }
        break;
      }

      case 'stat_mod': {
        // Handle temporary stat modifications (buffs/debuffs)
        // This would require a buff system implementation
        break;
      }
    }
  }

  // Apply cooldown
  sourceState.abilityCooldowns[ability.id] = ability.cooldown;

  return {
    success: true,
    events,
    cooldownApplied: true,
  };
}

/**
 * Reduce cooldowns at the start of turn
 */
export function reduceCooldowns(playerState: PlayerStateInMatch): void {
  for (const [abilityId, cooldown] of Object.entries(playerState.abilityCooldowns)) {
    if (cooldown > 0) {
      playerState.abilityCooldowns[abilityId] = cooldown - 1;
    }
  }
}

/**
 * Get basic attack ability
 */
export function getBasicAttack(): Ability {
  return {
    id: 'basic_attack',
    name: 'Basic Attack',
    description: 'A simple melee attack',
    type: 'attack',
    cost: 0,
    cooldown: 0,
    target: 'enemy',
    effects: [{ type: 'damage', value: 1 }],
    multiplier: 1.0,
    priority: 0,
  };
}