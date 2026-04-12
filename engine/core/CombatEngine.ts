// Core Combat Engine for RPS WAR
// Deterministic combat resolution system
// Pure functions with no side effects

import { Stats } from '../../shared/types/stats';
import { StanceBonus, StancePenalty } from '../../shared/types/stance';
import { SeededRNG } from './RNG';
import { calculateDamage, DamageCalculationInput } from './CombatCalculator';

// ============================================================================
// TYPES
// ============================================================================

export type StanceId = 'aggressive' | 'balanced' | 'defensive';

export type ActionType = 'SLASH' | 'BLOCK';

export interface CombatAction {
  type: ActionType;
  stanceId: StanceId;
}

export interface CombatEntity {
  id: string;
  name: string;
  maxHp: number;
  currentHp: number;
  stats: Stats;
  stance: StanceData;
  isBlocking: boolean;
}

export interface StanceData {
  id: StanceId;
  name: string;
  description: string;
  bonus: StanceBonus;
  penalty?: StancePenalty;
}

export interface RoundInput {
  player: CombatEntity;
  enemy: CombatEntity;
  playerActions: CombatAction[];  // Max 2 actions (AP system)
  enemyActions: CombatAction[];   // Max 2 actions (AP system)
  rng: SeededRNG;
}

export interface ActionResult {
  actionType: ActionType;
  sourceId: string;
  targetId: string;
  damageDealt: number;
  damageReduced: number;
  isBlocked: boolean;
  message: string;
}

export interface RoundResult {
  turnNumber: number;
  playerHp: number;
  enemyHp: number;
  playerStance: StanceId;
  enemyStance: StanceId;
  playerActions: ActionResult[];
  enemyActions: ActionResult[];
  combatLog: string[];
  battleEnded: boolean;
  winner: 'player' | 'enemy' | null;
}

// ============================================================================
// STANCE DEFINITIONS (MVP)
// ============================================================================

export const STANCES: Record<StanceId, StanceData> = {
  aggressive: {
    id: 'aggressive',
    name: 'Aggressive',
    description: '+25% damage dealt, -15% damage reduction',
    bonus: { damageMod: 1.25, defenseMod: 0.85 },
    penalty: { damageReduction: 0 }
  },
  balanced: {
    id: 'balanced',
    name: 'Balanced',
    description: 'No modifiers',
    bonus: { damageMod: 1.0, defenseMod: 1.0 },
    penalty: { damageReduction: 0 }
  },
  defensive: {
    id: 'defensive',
    name: 'Defensive',
    description: '-15% damage dealt, +30% damage reduction',
    bonus: { damageMod: 0.85, defenseMod: 1.3 },
    penalty: { damageReduction: 0 }
  }
};

// ============================================================================
// CORE COMBAT ENGINE
// ============================================================================

/**
 * Resolve a single combat round
 * Pure function: input → output, no side effects
 */
export function resolveRound(input: RoundInput): RoundResult {
  const { player, enemy, playerActions, enemyActions, rng } = input;
  
  // Clone entities to avoid mutations
  const playerClone = cloneEntity(player);
  const enemyClone = cloneEntity(enemy);
  
  const combatLog: string[] = [];
  const playerActionResults: ActionResult[] = [];
  const enemyActionResults: ActionResult[] = [];
  
  // Apply stance modifiers at round start
  applyStanceToEntity(playerClone, playerActions.length > 0 ? playerActions[0].stanceId : player.stance.id);
  applyStanceToEntity(enemyClone, enemyActions.length > 0 ? enemyActions[0].stanceId : enemy.stance.id);
  
  combatLog.push(`Turn ${input.rng.nextInt(1, 999)}: Player chose ${playerClone.stance.name}, Enemy chose ${enemyClone.stance.name}`);
  
  // Process player actions (max 2 AP)
  let playerAp = 2;
  for (const action of playerActions) {
    if (playerAp <= 0) break;
    
    const result = resolveAction(action, playerClone, enemyClone, rng);
    playerActionResults.push(result);
    
    if (result.damageDealt > 0) {
      enemyClone.currentHp = Math.max(0, enemyClone.currentHp - result.damageDealt);
    }
    
    combatLog.push(result.message);
    playerAp--;
  }
  
  // Process enemy actions (max 2 AP)
  let enemyAp = 2;
  for (const action of enemyActions) {
    if (enemyAp <= 0) break;
    
    const result = resolveAction(action, enemyClone, playerClone, rng);
    enemyActionResults.push(result);
    
    if (result.damageDealt > 0) {
      playerClone.currentHp = Math.max(0, playerClone.currentHp - result.damageDealt);
    }
    
    combatLog.push(result.message);
    enemyAp--;
  }
  
  // Check for battle end
  let battleEnded = false;
  let winner: 'player' | 'enemy' | null = null;
  
  if (enemyClone.currentHp <= 0) {
    battleEnded = true;
    winner = 'player';
    combatLog.push('🎉 Enemy defeated!');
  } else if (playerClone.currentHp <= 0) {
    battleEnded = true;
    winner = 'enemy';
    combatLog.push('💀 Player defeated!');
  }
  
  return {
    turnNumber: playerActionResults.length + enemyActionResults.length,
    playerHp: playerClone.currentHp,
    enemyHp: enemyClone.currentHp,
    playerStance: playerClone.stance.id,
    enemyStance: enemyClone.stance.id,
    playerActions: playerActionResults,
    enemyActions: enemyActionResults,
    combatLog,
    battleEnded,
    winner
  };
}

/**
 * Resolve a single action
 */
function resolveAction(
  action: CombatAction,
  attacker: CombatEntity,
  defender: CombatEntity,
  rng: SeededRNG
): ActionResult {
  let damageDealt = 0;
  let damageReduced = 0;
  let isBlocked = false;
  let message = '';
  
  if (action.type === 'SLASH') {
    // Calculate base damage
    const input: DamageCalculationInput = {
      attackerStats: attacker.stats,
      defenderStats: defender.stats,
      abilityMultiplier: 1.0,
      attackerStanceBonus: attacker.stance.bonus,
      attackerStancePenalty: attacker.stance.penalty,
      defenderStanceBonus: defender.stance.bonus,
      defenderStancePenalty: defender.stance.penalty,
      critChance: attacker.stance.bonus.critChance || 0,
      critMultiplier: 2.0
    };
    
    const calcResult = calculateDamage(input, rng);
    damageDealt = calcResult.finalDamage;
    
    // Apply BLOCK reduction
    if (defender.isBlocking) {
      damageReduced = Math.floor(damageDealt * 0.5);
      damageDealt = damageDealt - damageReduced;
      isBlocked = true;
    }
    
    // Ensure minimum damage of 1
    damageDealt = Math.max(1, damageDealt);
    
    if (isBlocked) {
      message = `${attacker.name} used SLASH for ${damageDealt} damage (${damageReduced} blocked)`;
    } else {
      message = `${attacker.name} used SLASH for ${damageDealt} damage`;
    }
    
  } else if (action.type === 'BLOCK') {
    attacker.isBlocking = true;
    message = `${attacker.name} used BLOCK (reduces incoming damage by 50%)`;
  }
  
  return {
    actionType: action.type,
    sourceId: attacker.id,
    targetId: defender.id,
    damageDealt,
    damageReduced,
    isBlocked,
    message
  };
}

/**
 * Apply stance to entity
 */
function applyStanceToEntity(entity: CombatEntity, stanceId: StanceId): void {
  entity.stance = STANCES[stanceId];
}

/**
 * Clone a combat entity
 */
function cloneEntity(entity: CombatEntity): CombatEntity {
  return {
    ...entity,
    stats: { ...entity.stats },
    stance: {
      ...entity.stance,
      bonus: { ...entity.stance.bonus },
      penalty: entity.stance.penalty ? { ...entity.stance.penalty } : undefined
    }
  };
}

// ============================================================================
// ENEMY AI
// ============================================================================

/**
 * Generate enemy actions based on AI logic
 * - 50% Aggressive, 30% Balanced, 20% Defensive stance
 * - If HP > 50%: prefer SLASH
 * - If HP <= 50%: prefer BLOCK
 */
export function generateEnemyActions(
  enemy: CombatEntity,
  rng: SeededRNG
): CombatAction[] {
  const actions: CombatAction[] = [];
  const hpPercent = enemy.currentHp / enemy.maxHp;
  
  // Determine stance
  const stanceRoll = rng.next();
  let chosenStance: StanceId = 'balanced';
  
  if (stanceRoll < 0.5) {
    chosenStance = 'aggressive';
  } else if (stanceRoll < 0.8) {
    chosenStance = 'balanced';
  } else {
    chosenStance = 'defensive';
  }
  
  // Generate up to 2 actions
  let ap = 2;
  
  while (ap > 0) {
    const actionRoll = rng.next();
    
    if (hpPercent > 0.5) {
      // Prefer SLASH when HP is high
      if (actionRoll < 0.7) {
        actions.push({ type: 'SLASH', stanceId: chosenStance });
      } else {
        actions.push({ type: 'BLOCK', stanceId: chosenStance });
      }
    } else {
      // Prefer BLOCK when HP is low
      if (actionRoll < 0.4) {
        actions.push({ type: 'SLASH', stanceId: chosenStance });
      } else {
        actions.push({ type: 'BLOCK', stanceId: chosenStance });
      }
    }
    
    ap--;
  }
  
  return actions;
}

// ============================================================================
// TRAINING MODE HELPERS
// ============================================================================

/**
 * Create a training dummy enemy
 */
export function createTrainingDummy(): CombatEntity {
  return {
    id: 'dummy',
    name: 'Training Dummy',
    maxHp: 100,
    currentHp: 100,
    stats: {
      hp: 100,
      atk: 10,
      def: 5,
      spd: 8,
      int: 5,
      res: 5,
      sta: 100
    },
    stance: STANCES.balanced,
    isBlocking: false
  };
}

/**
 * Create player combat entity from stats
 */
export function createPlayerEntity(
  name: string,
  stats: Stats
): CombatEntity {
  return {
    id: 'player',
    name,
    maxHp: stats.hp,
    currentHp: stats.hp,
    stats: { ...stats },
    stance: STANCES.balanced,
    isBlocking: false
  };
}
