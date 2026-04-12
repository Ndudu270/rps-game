// Turn Resolver - Determines action order and resolves simultaneous actions
// Both players select stance + ability, then resolve based on SPD + rules

import { PlayerId, TurnAction, TurnResult, PlayerStateInMatch, CombatEvent } from '../../shared/types/match';
import { SeededRNG } from './RNG';

export interface ActionWithPriority {
  action: TurnAction;
  priority: number;
  speed: number;
}

/**
 * Calculate action priority for a player's action
 * Higher priority acts first
 */
export function calculateActionPriority(
  playerState: PlayerStateInMatch,
  action: TurnAction,
  rng: SeededRNG
): number {
  let priority = playerState.stats.spd;
  
  // Add small random variance (0-5) for tiebreaking while maintaining determinism
  const variance = rng.nextInt(0, 5);
  priority += variance;
  
  // Stance speed modifier
  if (playerState.currentStance?.bonus.speedMod) {
    priority += playerState.currentStance.bonus.speedMod * 10;
  }
  
  // Ability priority
  // Note: We don't have ability data here, this is handled by AbilitySystem
  
  return priority;
}

/**
 * Determine the order in which actions should be resolved
 */
export function determineResolutionOrder(
  actions: TurnAction[],
  playerStates: Record<PlayerId, PlayerStateInMatch>,
  rng: SeededRNG
): PlayerId[] {
  if (actions.length === 0) return [];
  
  // Create action-priority pairs
  const actionsWithPriority: ActionWithPriority[] = actions.map(action => {
    const playerState = playerStates[action.playerId];
    const priority = calculateActionPriority(playerState, action, rng);
    
    return {
      action,
      priority,
      speed: playerState.stats.spd,
    };
  });
  
  // Sort by priority (descending), then by speed (descending) as tiebreaker
  actionsWithPriority.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return b.speed - a.speed;
  });
  
  // Return ordered player IDs
  return actionsWithPriority.map(ap => ap.action.playerId);
}

/**
 * Check if a player can act (not stunned, etc.)
 */
export function canPlayerAct(playerState: PlayerStateInMatch): boolean {
  // Check for stun status
  const isStunned = playerState.activeStatuses.some(
    status => status.effect.type === 'stun' && status.duration > 0
  );
  
  if (isStunned) {
    return false;
  }
  
  return true;
}

/**
 * Process a single turn's actions
 */
export function resolveTurn(
  actions: TurnAction[],
  playerStates: Record<PlayerId, PlayerStateInMatch>,
  turnNumber: number,
  rng: SeededRNG
): TurnResult {
  // Filter out players who can't act (stunned)
  const validActions = actions.filter(action => {
    const playerState = playerStates[action.playerId];
    return canPlayerAct(playerState);
  });
  
  // Determine resolution order
  const resolutionOrder = determineResolutionOrder(validActions, playerStates, rng);
  
  // Create initial turn result
  const events: CombatEvent[] = [];
  
  // Clone player states for this turn
  const playerStatesCopy: Record<PlayerId, PlayerStateInMatch> = JSON.parse(JSON.stringify(playerStates));
  
  return {
    turnNumber,
    actions: validActions,
    resolutionOrder,
    events,
    playerStates: playerStatesCopy,
  };
}

/**
 * Handle stalemate when both players have same priority
 */
export function handleTiebreak(
  player1Speed: number,
  player2Speed: number,
  rng: SeededRNG
): number {
  // Return 1 for player1 wins, 2 for player2 wins
  if (player1Speed > player2Speed) return 1;
  if (player2Speed > player1Speed) return 2;
  
  // True tie - use RNG for deterministic coin flip
  return rng.chance(50) ? 1 : 2;
}