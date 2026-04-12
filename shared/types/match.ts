// Match Types for Text-Based Stance Card Combat System

import { Stats } from './stats';
import { Ability } from './ability';
import { Stance } from './stance';
import { RaceId } from './race';
import { FactionId } from './faction';

export type PlayerId = string;
export type MatchId = string;

export interface PlayerConfig {
  id: PlayerId;
  name: string;
  classId: string;
  raceId: RaceId;
  factionId: FactionId;
}

export interface PlayerStateInMatch {
  config: PlayerConfig;
  currentHp: number;
  maxHp: number;
  currentSta: number;
  maxSta: number;
  stats: Stats;
  currentStance: Stance | null;
  activeStatuses: ActiveStatus[];
  shield: number;
  abilityCooldowns: Record<string, number>;
  buffs: StatBuff[];
}

export interface ActiveStatus {
  id: string;
  name: string;
  duration: number;
  stacks?: number;
  effect: StatusEffectData;
}

export interface StatusEffectData {
  type: 'stun' | 'bleed' | 'shield' | 'silence' | 'poison' | 'burn' | 'freeze';
  value?: number;
  statMod?: import('./stats').StatModifiers;
}

export interface StatBuff {
  id: string;
  name: string;
  duration: number;
  modifier: import('./stats').StatModifiers;
}

export interface TurnAction {
  playerId: PlayerId;
  stanceId: string | null;  // null means keep current stance
  abilityId: string | null; // null means basic attack
  targetId: PlayerId | null;
}

export interface TurnResult {
  turnNumber: number;
  actions: TurnAction[];
  resolutionOrder: PlayerId[];
  events: CombatEvent[];
  playerStates: Record<PlayerId, PlayerStateInMatch>;
}

export interface CombatEvent {
  type: 'damage' | 'heal' | 'shield' | 'status_applied' | 'status_removed' | 
        'stance_changed' | 'ability_used' | 'cooldown_reset' | 'death' | 'message';
  sourceId: PlayerId;
  targetId: PlayerId;
  value?: number;
  abilityId?: string;
  stanceId?: string;
  statusId?: string;
  message: string;
}

export type MatchPhase = 'waiting' | 'action_selection' | 'resolution' | 'finished';

export interface MatchState {
  id: MatchId;
  players: PlayerId[];
  phase: MatchPhase;
  turnNumber: number;
  maxTurns: number;
  playerStates: Record<PlayerId, PlayerStateInMatch>;
  turnHistory: TurnResult[];
  winner: PlayerId | null;
  seed: number;
  createdAt: number;
  updatedAt: number;
}

export interface MatchCreationRequest {
  player1: PlayerConfig;
  player2: PlayerConfig;
  seed?: number;
  maxTurns?: number;
}