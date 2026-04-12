// Faction Types for Text-Based Stance Card Combat System

import { StatModifiers } from './stats';

export type FactionId = 'solaris_order' | 'void_syndicate' | 'iron_legion' | 'wild_pact';

export interface Faction {
  id: FactionId;
  name: string;
  description: string;
  statMods: StatModifiers;
  passiveAbility: {
    name: string;
    description: string;
    trigger: 'on_turn_start' | 'on_damage_taken' | 'on_damage_dealt' | 'on_kill' | 'always';
    effect: string;
  };
}

export function createFaction(base: Partial<Faction>): Faction {
  return {
    id: base.id || 'solaris_order',
    name: base.name || 'Unknown Faction',
    description: base.description || '',
    statMods: base.statMods || {},
    passiveAbility: base.passiveAbility || {
      name: 'None',
      description: 'No faction bonus',
      trigger: 'always',
      effect: '',
    },
  };
}

export const FACTIONS: Record<FactionId, Faction> = {
  solaris_order: createFaction({
    id: 'solaris_order',
    name: 'Solaris Order',
    description: 'Holy warriors who draw power from light and order.',
    statMods: { intMod: 0.1, resMod: 0.1 },
    passiveAbility: {
      name: 'Divine Blessing',
      description: 'Heal 5% of max HP at the start of each turn.',
      trigger: 'on_turn_start',
      effect: 'hp_regen',
    },
  }),
  void_syndicate: createFaction({
    id: 'void_syndicate',
    name: 'Void Syndicate',
    description: 'Shadowy operatives who manipulate darkness and chaos.',
    statMods: { spdMod: 0.1, atkMod: 0.05 },
    passiveAbility: {
      name: 'Shadow Strike',
      description: 'First attack each turn deals 20% more damage.',
      trigger: 'on_damage_dealt',
      effect: 'first_strike_bonus',
    },
  }),
  iron_legion: createFaction({
    id: 'iron_legion',
    name: 'Iron Legion',
    description: 'Disciplined soldiers focused on defense and endurance.',
    statMods: { defMod: 0.15, hpMod: 0.1, spdMod: -0.05 },
    passiveAbility: {
      name: 'Iron Will',
      description: 'Gain a shield equal to 10% of damage taken.',
      trigger: 'on_damage_taken',
      effect: 'damage_shield',
    },
  }),
  wild_pact: createFaction({
    id: 'wild_pact',
    name: 'Wild Pact',
    description: 'Nature-bound fighters who embrace primal fury.',
    statMods: { atkMod: 0.1, hpMod: 0.05, intMod: -0.1 },
    passiveAbility: {
      name: 'Primal Fury',
      description: 'Gain 5% attack for each turn passed (max 25%).',
      trigger: 'on_turn_start',
      effect: 'stacking_attack',
    },
  }),
};