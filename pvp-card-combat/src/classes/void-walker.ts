// Void-Walker Class Definition

import { Stance, Ability, AbilityContext, AbilityResult, Stats, StanceType } from '../types';

export const VOID_WALKER_STANCES: Record<StanceType, Stance> = {
  'phase-shift': {
    id: 'phase-shift',
    name: 'Phase-Shift',
    description: 'Evasive stance with increased dodge but reduced damage',
    effects: {
      dodgeBonus: 0.20,
      damageBonus: -0.10,
      fluxGenerationMultiplier: 2.0, // Double flux from damage taken
    },
  },
  'singularity': {
    id: 'singularity',
    name: 'Singularity',
    description: 'Aggressive stance with increased damage but vulnerability',
    effects: {
      damageBonus: 0.25,
      dodgeBonus: -0.15,
      damageTakenBonus: 0.10,
      fluxGenerationMultiplier: 2.0, // Double flux generation, no AP cost handled in resolver
    },
  },
  'entropy': {
    id: 'entropy',
    name: 'Entropy',
    description: 'Unstable high-flux stance with crit bonus and self-damage',
    effects: {
      critDamageBonus: 0.50,
      defenseIgnore: 0.20,
      endTurnDamageFluxPercent: 0.10,
    },
    condition: (stats: Stats) => stats.flux > 80,
  },
};

export const VOID_WALKER_ABILITIES: Ability[] = [
  {
    id: 'void-slash',
    name: 'Void Slash',
    description: 'Basic attack that generates Flux',
    apCost: 1,
    execute: (context: AbilityContext): AbilityResult => {
      const baseDamage = 15;
      let fluxGen = 5;
      
      if (context.stance === 'singularity') {
        // Hits twice in Singularity
        fluxGen = 10;
        return {
          damage: baseDamage * 2,
          fluxGenerated: fluxGen,
          message: `${context.user.name} slashes twice with Void energy!`,
        };
      }
      
      return {
        damage: baseDamage,
        fluxGenerated: fluxGen,
        message: `${context.user.name} slashes with Void energy!`,
      };
    },
  },
  {
    id: 'flash-step',
    name: 'Flash-Step',
    description: 'Dodge next attack and counter, prevents Flux generation',
    apCost: 1,
    execute: (context: AbilityContext): AbilityResult => {
      return {
        statusEffects: [{ type: 'dodge-next', duration: 1 }],
        fluxGenerated: 0, // Explicitly prevents flux
        message: `${context.user.name} phases out of reality, ready to dodge!`,
      };
    },
  },
  {
    id: 'flux-burn',
    name: 'Flux Burn',
    description: 'Consume all Flux for massive damage',
    apCost: 2,
    execute: (context: AbilityContext): AbilityResult => {
      const currentFlux = context.user.stats.flux;
      
      if (currentFlux < 20) {
        return {
          damage: 0,
          stunUser: true,
          fluxGenerated: -currentFlux, // Reset to 0
          message: `${context.user.name}'s Flux Burn fizzles! They are stunned!`,
        };
      }
      
      const baseDamage = 10;
      const damage = Math.floor(baseDamage * (currentFlux / 10));
      
      return {
        damage,
        fluxGenerated: -currentFlux, // Reset to 0
        message: `${context.user.name} burns ${currentFlux} Flux for ${damage} damage!`,
      };
    },
  },
  {
    id: 'paradox-clone',
    name: 'Paradox Clone',
    description: 'Create a clone to absorb attacks',
    apCost: 2,
    execute: (context: AbilityContext): AbilityResult => {
      return {
        statusEffects: [{ type: 'clone', duration: 2, value: 0.5 }], // 50% chance
        fluxGenerated: 0,
        message: `${context.user.name} creates a Paradox Clone!`,
      };
    },
  },
  {
    id: 'event-horizon',
    name: 'Event Horizon',
    description: 'Pull enemy and silence their passives',
    apCost: 1,
    execute: (context: AbilityContext): AbilityResult => {
      const selfDamage = Math.floor(context.user.stats.maxHp * 0.05);
      
      return {
        damage: 10,
        selfDamage,
        statusEffects: [{ type: 'silence', duration: 1 }],
        fluxGenerated: 5,
        message: `${context.user.name} pulls the enemy into an Event Horizon!`,
      };
    },
  },
  {
    id: 'zero-point-reset',
    name: 'Zero-Point Reset',
    description: 'Reset Flux and heal, gain AP next turn',
    apCost: 3,
    execute: (context: AbilityContext): AbilityResult => {
      const currentFlux = context.user.stats.flux;
      const healing = currentFlux; // 1 HP per Flux
      
      return {
        healing,
        fluxGenerated: -currentFlux, // Reset to 0
        statusEffects: [], // AP gain handled in resolver
        message: `${context.user.name} resets to Zero Point, healing for ${healing} HP!`,
      };
    },
  },
  {
    id: 'collapse-reality',
    name: 'Collapse Reality',
    description: 'Ultimate: Execute or massive damage with permanent HP penalty',
    apCost: 3,
    execute: (context: AbilityContext): AbilityResult => {
      const targetHpPercent = context.target.stats.hp / context.target.stats.maxHp;
      
      if (targetHpPercent <= 0.20) {
        return {
          damage: context.target.stats.hp, // Kill
          hpReductionPermanent: 0.50, // 50% max HP reduction
          fluxGenerated: -100, // Reset
          message: `${context.user.name} collapses reality! INSTANT KILL!`,
        };
      }
      
      const damage = Math.floor(context.target.stats.hp * 0.40);
      return {
        damage,
        hpReductionPermanent: 0.50, // 50% max HP reduction
        fluxGenerated: -100,
        message: `${context.user.name} collapses reality for ${damage} damage!`,
      };
    },
  },
];

export function getVoidWalkerAbilities(): Ability[] {
  return VOID_WALKER_ABILITIES;
}

export function getVoidWalkerStance(stanceId: StanceType): Stance | undefined {
  return VOID_WALKER_STANCES[stanceId];
}
