// Core Game Types and Interfaces

export type StatType = 'hp' | 'maxHp' | 'speed' | 'defense' | 'critChance' | 'critDamage' | 'flux';

export interface Stats {
  hp: number;
  maxHp: number;
  speed: number;
  defense: number;
  critChance: number;
  critDamage: number;
  flux: number; // Unique to Void-Walker
}

export type StanceType = 'phase-shift' | 'singularity' | 'entropy';

export interface Stance {
  id: StanceType;
  name: string;
  description: string;
  effects: {
    dodgeBonus?: number;
    damageBonus?: number;
    damageTakenBonus?: number;
    critDamageBonus?: number;
    defenseIgnore?: number;
    fluxGenerationMultiplier?: number;
    endTurnDamageFluxPercent?: number;
  };
  condition?: (stats: Stats) => boolean; // For conditional stances like Entropy
}

export type AbilityId = 
  | 'void-slash' 
  | 'flash-step' 
  | 'flux-burn' 
  | 'paradox-clone' 
  | 'event-horizon' 
  | 'zero-point-reset' 
  | 'collapse-reality';

export interface Ability {
  id: AbilityId;
  name: string;
  description: string;
  apCost: number;
  cooldown?: number;
  execute: (context: AbilityContext) => AbilityResult;
}

export interface AbilityContext {
  user: PlayerState;
  target: PlayerState;
  stance: StanceType;
  turn: number;
}

export interface AbilityResult {
  damage?: number;
  healing?: number;
  statusEffects?: StatusEffect[];
  message: string;
  fluxGenerated?: number;
  selfDamage?: number;
  stunUser?: boolean;
  hpReductionPermanent?: number; // For ultimate penalty
}

export interface StatusEffect {
  type: 'silence' | 'stun' | 'clone' | 'dodge-next';
  duration: number; // turns remaining
  value?: number; // optional potency
}

export type Race = 'human' | 'elf' | 'orc' | 'undead';
export type Faction = 'alliance' | 'horde' | 'neutral';
export type ClassType = 'void-walker' | 'warrior' | 'mage'; // Expandable

export interface PlayerConfig {
  id: string;
  name: string;
  race: Race;
  faction: Faction;
  classType: ClassType;
}

export interface PlayerState extends PlayerConfig {
  stats: Stats;
  currentStance: StanceType;
  actionPoints: number;
  maxActionPoints: number;
  abilities: AbilityId[];
  statusEffects: StatusEffect[];
  permanentHpReduction: number; // Tracks HP reduction from ultimate
}

export interface GameState {
  id: string;
  players: [PlayerState, PlayerState];
  turn: number;
  currentPlayerIndex: 0 | 1;
  phase: 'selection' | 'resolution' | 'ended';
  winner?: string;
  log: CombatLogEntry[];
}

export interface CombatLogEntry {
  turn: number;
  player: string;
  action: string;
  result: string;
  timestamp: Date;
}

export interface TurnSelection {
  stance: StanceType;
  ability: AbilityId;
}
