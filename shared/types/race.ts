// Race Types for Text-Based Stance Card Combat System

import { StatModifiers } from './stats';

export type RaceId = 'human' | 'elf' | 'orc' | 'construct' | 'aetherborn';

export interface Race {
  id: RaceId;
  name: string;
  description: string;
  statMods: StatModifiers;
  passiveAbility: {
    name: string;
    description: string;
    trigger: 'on_turn_start' | 'on_damage_taken' | 'on_damage_dealt' | 'on_status_applied' | 'always';
    effect: string;
  };
}

export function createRace(base: Partial<Race>): Race {
  return {
    id: base.id || 'human',
    name: base.name || 'Unknown Race',
    description: base.description || '',
    statMods: base.statMods || {},
    passiveAbility: base.passiveAbility || {
      name: 'None',
      description: 'No passive ability',
      trigger: 'always',
      effect: '',
    },
  };
}

export const RACES: Record<RaceId, Race> = {
  human: createRace({
    id: 'human',
    name: 'Human',
    description: 'Versatile and adaptable, humans excel at learning any role.',
    statMods: { staMod: 0.1 },
    passiveAbility: {
      name: 'Adaptability',
      description: 'Gain 10% bonus stamina regeneration.',
      trigger: 'always',
      effect: 'sta_regen_bonus',
    },
  }),
  elf: createRace({
    id: 'elf',
    name: 'Elf',
    description: 'Agile and intelligent, elves favor speed and precision.',
    statMods: { spdMod: 0.15, intMod: 0.1, hpMod: -0.05 },
    passiveAbility: {
      name: 'Quick Reflexes',
      description: '15% chance to act first when speeds are tied.',
      trigger: 'on_turn_start',
      effect: 'priority_boost',
    },
  }),
  orc: createRace({
    id: 'orc',
    name: 'Orc',
    description: 'Brutal warriors with immense physical power.',
    statMods: { atkMod: 0.15, hpMod: 0.1, defMod: -0.05, intMod: -0.1 },
    passiveAbility: {
      name: 'Berserker Rage',
      description: 'Deal 10% more damage when below 50% HP.',
      trigger: 'on_damage_dealt',
      effect: 'low_hp_damage_boost',
    },
  }),
  construct: createRace({
    id: 'construct',
    name: 'Construct',
    description: 'Mechanical beings with high defense but low mobility.',
    statMods: { defMod: 0.2, hpMod: 0.1, spdMod: -0.15, resMod: 0.1 },
    passiveAbility: {
      name: 'Steel Body',
      description: 'Immune to Bleed status effects.',
      trigger: 'on_status_applied',
      effect: 'bleed_immunity',
    },
  }),
  aetherborn: createRace({
    id: 'aetherborn',
    name: 'Aetherborn',
    description: 'Mystical beings connected to arcane energies.',
    statMods: { intMod: 0.15, resMod: 0.1, hpMod: -0.1 },
    passiveAbility: {
      name: 'Arcane Affinity',
      description: 'Ability effects are 10% stronger.',
      trigger: 'always',
      effect: 'ability_power_boost',
    },
  }),
};