// Status System - Manages status effects (stun, bleed, shield, silence, etc.)

import { PlayerStateInMatch, ActiveStatus, StatusEffectData, CombatEvent, PlayerId } from '../../shared/types/match';
import { Stats } from '../../shared/types/stats';
import { SeededRNG } from './RNG';

export interface StatusDefinition {
  id: string;
  name: string;
  type: StatusEffectData['type'];
  description: string;
  baseDuration: number;
  maxStacks?: number;
  value?: number;
  statMod?: Stats;
}

// Status effect definitions
export const STATUS_EFFECTS: Record<string, StatusDefinition> = {
  stun: {
    id: 'stun',
    name: 'Stun',
    type: 'stun',
    description: 'Skip next turn',
    baseDuration: 1,
    maxStacks: 1,
  },
  bleed: {
    id: 'bleed',
    name: 'Bleed',
    type: 'bleed',
    description: 'Take 10% max HP damage at start of turn',
    baseDuration: 3,
    maxStacks: 5,
    value: 0.1,
  },
  shield: {
    id: 'shield',
    name: 'Shield',
    type: 'shield',
    description: 'Absorbs damage',
    baseDuration: 1,
    maxStacks: undefined,
  },
  silence: {
    id: 'silence',
    name: 'Silence',
    type: 'silence',
    description: 'Cannot use abilities',
    baseDuration: 2,
    maxStacks: 1,
  },
  poison: {
    id: 'poison',
    name: 'Poison',
    type: 'poison',
    description: 'Take damage equal to 15% of current HP at start of turn',
    baseDuration: 3,
    maxStacks: 3,
    value: 0.15,
  },
  burn: {
    id: 'burn',
    name: 'Burn',
    type: 'burn',
    description: 'Take fixed damage at start of turn',
    baseDuration: 2,
    maxStacks: 3,
    value: 10,
  },
  freeze: {
    id: 'freeze',
    name: 'Freeze',
    type: 'freeze',
    description: 'Cannot act, duration decreases when hit',
    baseDuration: 1,
    maxStacks: 1,
  },
};

/**
 * Apply a status effect to a player
 */
export function applyStatus(
  playerState: PlayerStateInMatch,
  statusId: string,
  duration?: number,
  stacks?: number
): { updatedState: PlayerStateInMatch; event: CombatEvent | null } {
  const statusDef = STATUS_EFFECTS[statusId];
  if (!statusDef) {
    return { updatedState: playerState, event: null };
  }

  const existingStatus = playerState.activeStatuses.find(s => s.id === statusId);
  
  if (existingStatus) {
    // Refresh duration or add stacks
    if (duration !== undefined) {
      existingStatus.duration = Math.max(existingStatus.duration, duration);
    }
    if (stacks !== undefined && statusDef.maxStacks) {
      existingStatus.stacks = Math.min(
        (existingStatus.stacks || 1) + stacks,
        statusDef.maxStacks
      );
    }
  } else {
    // Add new status
    const newStatus: ActiveStatus = {
      id: statusId,
      name: statusDef.name,
      duration: duration ?? statusDef.baseDuration,
      stacks: stacks ?? 1,
      effect: {
        type: statusDef.type,
        value: statusDef.value,
      },
    };
    playerState.activeStatuses.push(newStatus);
  }

  const event: CombatEvent = {
    type: 'status_applied',
    sourceId: playerState.config.id,
    targetId: playerState.config.id,
    statusId,
    message: `${playerState.config.name} is affected by ${statusDef.name}!`,
  };

  return { updatedState: playerState, event };
}

/**
 * Remove a status effect from a player
 */
export function removeStatus(
  playerState: PlayerStateInMatch,
  statusId: string
): { updatedState: PlayerStateInMatch; event: CombatEvent | null } {
  const index = playerState.activeStatuses.findIndex(s => s.id === statusId);
  
  if (index === -1) {
    return { updatedState: playerState, event: null };
  }

  const status = playerState.activeStatuses[index];
  playerState.activeStatuses.splice(index, 1);

  const event: CombatEvent = {
    type: 'status_removed',
    sourceId: playerState.config.id,
    targetId: playerState.config.id,
    statusId,
    message: `${playerState.config.name}'s ${status.name} wears off!`,
  };

  return { updatedState: playerState, event };
}

/**
 * Process status effects at the start of a turn
 */
export function processStartOfTurnStatuses(
  playerState: PlayerStateInMatch,
  rng: SeededRNG
): { updatedState: PlayerStateInMatch; events: CombatEvent[] } {
  const events: CombatEvent[] = [];
  const statusesToRemove: string[] = [];

  for (const status of playerState.activeStatuses) {
    // Decrease duration
    status.duration--;

    // Apply effect based on type
    switch (status.effect.type) {
      case 'bleed': {
        const bleedDamage = Math.floor(playerState.maxHp * (status.effect.value || 0.1));
        const actualDamage = Math.max(1, bleedDamage);
        
        // Apply damage (ignore shield for bleed)
        playerState.currentHp = Math.max(1, playerState.currentHp - actualDamage);
        
        events.push({
          type: 'damage',
          sourceId: playerState.config.id,
          targetId: playerState.config.id,
          value: actualDamage,
          statusId: status.id,
          message: `${playerState.config.name} takes ${actualDamage} bleed damage!`,
        });
        break;
      }

      case 'poison': {
        const poisonDamage = Math.floor(playerState.currentHp * (status.effect.value || 0.15));
        const actualDamage = Math.max(1, poisonDamage);
        
        playerState.currentHp = Math.max(1, playerState.currentHp - actualDamage);
        
        events.push({
          type: 'damage',
          sourceId: playerState.config.id,
          targetId: playerState.config.id,
          value: actualDamage,
          statusId: status.id,
          message: `${playerState.config.name} takes ${actualDamage} poison damage!`,
        });
        break;
      }

      case 'burn': {
        const burnDamage = status.effect.value || 10;
        playerState.currentHp = Math.max(1, playerState.currentHp - burnDamage);
        
        events.push({
          type: 'damage',
          sourceId: playerState.config.id,
          targetId: playerState.config.id,
          value: burnDamage,
          statusId: status.id,
          message: `${playerState.config.name} takes ${burnDamage} burn damage!`,
        });
        break;
      }
    }

    // Mark for removal if expired
    if (status.duration <= 0) {
      statusesToRemove.push(status.id);
    }
  }

  // Remove expired statuses
  for (const statusId of statusesToRemove) {
    const result = removeStatus(playerState, statusId);
    if (result.event) {
      events.push(result.event);
    }
  }

  return { updatedState: playerState, events };
}

/**
 * Check if a player can use abilities (not silenced)
 */
export function canUseAbilities(playerState: PlayerStateInMatch): boolean {
  return !playerState.activeStatuses.some(
    status => status.effect.type === 'silence' && status.duration > 0
  );
}

/**
 * Check if a player has shield active
 */
export function getShieldAmount(playerState: PlayerStateInMatch): number {
  return playerState.shield;
}

/**
 * Apply shield to player
 */
export function applyShieldToPlayer(
  playerState: PlayerStateInMatch,
  amount: number,
  duration: number = 1
): { updatedState: PlayerStateInMatch; event: CombatEvent } {
  playerState.shield += amount;
  
  // Add shield status if not present
  const existingShield = playerState.activeStatuses.find(s => s.id === 'shield');
  if (!existingShield) {
    playerState.activeStatuses.push({
      id: 'shield',
      name: 'Shield',
      duration,
      effect: { type: 'shield' },
    });
  }

  const event: CombatEvent = {
    type: 'shield',
    sourceId: playerState.config.id,
    targetId: playerState.config.id,
    value: amount,
    message: `${playerState.config.name} gains ${amount} shield!`,
  };

  return { updatedState: playerState, event };
}