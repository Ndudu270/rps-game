// Game Engine - Main game loop and match orchestration
// This is the authoritative engine that processes all combat logic

import { MatchState, PlayerId, TurnAction, MatchPhase, PlayerStateInMatch, CombatEvent, MatchCreationRequest } from '../../shared/types/match';
import { SeededRNG, initRNG, getRNG } from './RNG';
import { resolveTurn, canPlayerAct } from './TurnResolver';
import { executeAbility, reduceCooldowns, getBasicAttack } from '../systems/AbilitySystem';
import { changeStance, applyStanceStatMods } from '../systems/StanceSystem';
import { processStartOfTurnStatuses, canUseAbilities } from '../systems/StatusSystem';
import { applyRaceStatMods, hasStatusImmunity } from '../systems/RaceSystem';
import { applyFactionStatMods, processFactionPassiveOnTurnStart, processFactionPassiveOnDamageTaken } from '../systems/FactionSystem';
import { createBaseStats, Stats, applyStatModifiers, StatModifiers } from '../../shared/types/stats';
import { Ability, createAbility } from '../../shared/types/ability';
import { Stance, createStance } from '../../shared/types/stance';
import { RACES } from '../../shared/types/race';
import { FACTIONS } from '../../shared/types/faction';
import { EquippedItems, calculateDerivedStats } from '../../shared/types/inventory';

// Class definitions with stances and abilities
export interface ClassDefinition {
  id: string;
  name: string;
  description: string;
  baseStats: Partial<Stats>;
  stances: Stance[];
  abilities: Ability[];
}

export const CLASSES: Record<string, ClassDefinition> = {};

export interface GameState {
  matches: Map<string, MatchState>;
  rng: SeededRNG | null;
}

/**
 * Initialize the game engine
 */
export function initializeGameEngine(): GameState {
  return {
    matches: new Map(),
    rng: null,
  };
}

/**
 * Create initial player state for a match
 */
function createPlayerState(config: import('../../shared/types/match').PlayerConfig, seed: number): PlayerStateInMatch {
  const race = RACES[config.raceId];
  const faction = FACTIONS[config.factionId];
  
  // Start with base stats
  let stats = createBaseStats();
  
  // Apply class-specific stat biases (if class data loaded)
  const classDef = CLASSES[config.classId];
  if (classDef && classDef.baseStats) {
    stats = { ...stats, ...classDef.baseStats };
  }
  
  // Apply race modifiers
  stats = applyRaceStatMods(stats, config.raceId);
  
  // Apply faction modifiers
  stats = applyFactionStatMods(stats, config.factionId);
  
  // Apply equipment modifiers (derived stats calculation)
  if (config.equippedItems) {
    const derivedStats = calculateDerivedStats(
      stats.atk,
      stats.def,
      stats.spd,
      stats.hp,
      0, // base crit chance
      0, // base luck
      config.equippedItems
    );
    
    // Apply derived stat changes
    stats.atk = derivedStats.atk;
    stats.def = derivedStats.def;
    stats.spd = derivedStats.spd;
    stats.hp = derivedStats.hp;
  }
  
  // Calculate HP and STA from stats
  const maxHp = stats.hp;
  const maxSta = stats.sta;
  
  return {
    config,
    currentHp: maxHp,
    maxHp,
    currentSta: maxSta,
    maxSta,
    stats,
    currentStance: null,
    activeStatuses: [],
    shield: 0,
    abilityCooldowns: {},
    buffs: [],
  };
}

/**
 * Create a new match
 */
export function createMatch(
  request: import('../../shared/types/match').MatchCreationRequest
): MatchState {
  const seed = request.seed || Math.floor(Math.random() * 1000000);
  initRNG(seed);
  
  const matchId = `match_${Date.now()}_${seed}`;
  
  const player1State = createPlayerState(request.player1, seed);
  const player2State = createPlayerState(request.player2, seed + 1);
  
  const matchState: MatchState = {
    id: matchId,
    players: [request.player1.id, request.player2.id],
    phase: 'action_selection',
    turnNumber: 0,
    maxTurns: request.maxTurns || 50,
    playerStates: {
      [request.player1.id]: player1State,
      [request.player2.id]: player2State,
    },
    turnHistory: [],
    winner: null,
    seed,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  return matchState;
}

/**
 * Submit an action for a player
 */
export function submitAction(
  matchState: MatchState,
  playerId: PlayerId,
  stanceId: string | null,
  abilityId: string | null
): { success: boolean; message?: string } {
  if (matchState.phase !== 'action_selection') {
    return { success: false, message: 'Match is not in action selection phase' };
  }
  
  const playerState = matchState.playerStates[playerId];
  if (!playerState) {
    return { success: false, message: 'Player not found in match' };
  }
  
  // Store the pending action on player state (will be processed in resolveTurn)
  // For now, we just validate it can be done
  if (stanceId) {
    // Validate stance exists for this class
    const classDef = CLASSES[playerState.config.classId];
    if (classDef) {
      const stance = classDef.stances.find(s => s.id === stanceId);
      if (!stance) {
        return { success: false, message: 'Invalid stance for this class' };
      }
    }
  }
  
  if (abilityId && abilityId !== 'basic_attack') {
    // Validate ability exists and can be used
    const classDef = CLASSES[playerState.config.classId];
    if (classDef) {
      const ability = classDef.abilities.find(a => a.id === abilityId);
      if (!ability) {
        return { success: false, message: 'Invalid ability for this class' };
      }
      
      const canUse = canUseAbilityCheck(playerState, ability);
      if (!canUse.allowed) {
        return { success: false, message: canUse.reason };
      }
    }
  }
  
  return { success: true };
}

/**
 * Check if ability can be used (simplified version for validation)
 */
function canUseAbilityCheck(
  playerState: PlayerStateInMatch,
  ability: Ability
): { allowed: boolean; reason?: string } {
  if (!canUseAbilities(playerState)) {
    return { allowed: false, reason: 'Silenced' };
  }
  if (playerState.currentSta < ability.cost) {
    return { allowed: false, reason: 'Not enough stamina' };
  }
  const remainingCooldown = playerState.abilityCooldowns[ability.id] || 0;
  if (remainingCooldown > 0) {
    return { allowed: false, reason: `On cooldown (${remainingCooldown} turns)` };
  }
  return { allowed: true };
}

/**
 * Resolve a turn - process all submitted actions
 */
export function resolveMatchTurn(
  matchState: MatchState,
  actions: TurnAction[]
): MatchState {
  const rng = getRNG();
  
  // Increment turn number
  matchState.turnNumber++;
  
  const events: CombatEvent[] = [];
  
  // Process start of turn for each player
  for (const playerId of matchState.players) {
    const playerState = matchState.playerStates[playerId];
    
    // Reduce cooldowns
    reduceCooldowns(playerState);
    
    // Process status effects
    const statusResult = processStartOfTurnStatuses(playerState, rng);
    events.push(...statusResult.events);
    
    // Process faction passives
    const factionResult = processFactionPassiveOnTurnStart(playerState, matchState.turnNumber);
    events.push(...factionResult.events);
    
    // Stamina regeneration (base 10 + INT modifier)
    const staRegen = 10 + Math.floor(playerState.stats.int * 0.1);
    playerState.currentSta = Math.min(playerState.maxSta, playerState.currentSta + staRegen);
  }
  
  // Filter out actions from dead players
  const validActions = actions.filter(action => {
    const playerState = matchState.playerStates[action.playerId];
    return playerState && playerState.currentHp > 0 && canPlayerAct(playerState);
  });
  
  // Determine resolution order
  const resolutionOrder = validActions.length > 0 
    ? validActions.sort((a, b) => {
        const aSpeed = matchState.playerStates[a.playerId].stats.spd;
        const bSpeed = matchState.playerStates[b.playerId].stats.spd;
        return bSpeed - aSpeed;
      }).map(a => a.playerId)
    : [];
  
  // Execute actions in order
  for (const playerId of resolutionOrder) {
    const action = validActions.find(a => a.playerId === playerId);
    if (!action) continue;
    
    const sourceState = matchState.playerStates[playerId];
    const targetId = matchState.players.find(p => p !== playerId);
    const targetState = targetId ? matchState.playerStates[targetId] : null;
    
    if (!targetState) continue;
    
    // Handle stance change
    if (action.stanceId) {
      const classDef = CLASSES[sourceState.config.classId];
      if (classDef) {
        const newStance = classDef.stances.find(s => s.id === action.stanceId);
        if (newStance) {
          const result = changeStance(sourceState, newStance);
          if (result.event) {
            events.push(result.event);
          }
        }
      }
    }
    
    // Handle ability execution
    let ability: Ability | null = null;
    if (action.abilityId && action.abilityId !== 'basic_attack') {
      const classDef = CLASSES[sourceState.config.classId];
      if (classDef) {
        ability = classDef.abilities.find(a => a.id === action.abilityId) || null;
      }
    } else {
      ability = getBasicAttack();
    }
    
    if (ability) {
      const result = executeAbility(sourceState, targetState, ability, rng);
      events.push(...result.events);
      
      // Check for death
      if (targetState.currentHp <= 0) {
        events.push({
          type: 'death',
          sourceId: sourceState.config.id,
          targetId: targetState.config.id,
          message: `${targetState.config.name} has been defeated!`,
        });
      }
    }
  }
  
  // Check for match end
  for (const playerId of matchState.players) {
    const playerState = matchState.playerStates[playerId];
    if (playerState.currentHp <= 0) {
      const winner = matchState.players.find(p => p !== playerId);
      matchState.winner = winner || null;
      matchState.phase = 'finished';
      break;
    }
  }
  
  // Check for turn limit
  if (matchState.turnNumber >= matchState.maxTurns && !matchState.winner) {
    // Determine winner by HP percentage
    const p1 = matchState.playerStates[matchState.players[0]];
    const p2 = matchState.playerStates[matchState.players[1]];
    const p1Percent = p1.currentHp / p1.maxHp;
    const p2Percent = p2.currentHp / p2.maxHp;
    
    if (p1Percent > p2Percent) {
      matchState.winner = matchState.players[0];
    } else if (p2Percent > p1Percent) {
      matchState.winner = matchState.players[1];
    }
    // else tie - no winner
    
    matchState.phase = 'finished';
  }
  
  // Update turn history
  matchState.turnHistory.push({
    turnNumber: matchState.turnNumber,
    actions: validActions,
    resolutionOrder,
    events,
    playerStates: JSON.parse(JSON.stringify(matchState.playerStates)),
  });
  
  matchState.updatedAt = Date.now();
  
  // Set phase back to action selection if match continues
  if (matchState.phase !== 'finished') {
    matchState.phase = 'action_selection';
  }
  
  return matchState;
}

/**
 * Get available stances for a player
 */
export function getAvailableStances(matchState: MatchState, playerId: PlayerId): Stance[] {
  const playerState = matchState.playerStates[playerId];
  if (!playerState) return [];
  
  const classDef = CLASSES[playerState.config.classId];
  return classDef?.stances || [];
}

/**
 * Get available abilities for a player
 */
export function getAvailableAbilities(matchState: MatchState, playerId: PlayerId): Ability[] {
  const playerState = matchState.playerStates[playerId];
  if (!playerState) return [];
  
  const classDef = CLASSES[playerState.config.classId];
  return classDef?.abilities || [];
}

/**
 * Register a class definition
 */
export function registerClass(classDef: ClassDefinition): void {
  CLASSES[classDef.id] = classDef;
}

/**
 * Load all class definitions
 */
export function loadClasses(classes: ClassDefinition[]): void {
  for (const classDef of classes) {
    registerClass(classDef);
  }
}