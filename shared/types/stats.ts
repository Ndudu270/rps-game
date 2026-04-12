// Shared Types for Text-Based Stance Card Combat System

export interface Stats {
  hp: number;      // Health Points
  atk: number;     // Attack
  def: number;     // Defense
  spd: number;     // Speed
  int: number;     // Intelligence (ability power)
  res: number;     // Resistance (status effect resistance)
  sta: number;     // Stamina (resource for abilities)
}

export interface StatModifiers {
  hpMod?: number;
  atkMod?: number;
  defMod?: number;
  spdMod?: number;
  intMod?: number;
  resMod?: number;
  staMod?: number;
}

export function createBaseStats(): Stats {
  return { hp: 100, atk: 10, def: 5, spd: 10, int: 10, res: 10, sta: 100 };
}

export function applyStatModifiers(base: Stats, mods: StatModifiers): Stats {
  return {
    hp: Math.max(1, Math.floor(base.hp * (1 + (mods.hpMod || 0)))),
    atk: Math.max(1, Math.floor(base.atk * (1 + (mods.atkMod || 0)))),
    def: Math.max(1, Math.floor(base.def * (1 + (mods.defMod || 0)))),
    spd: Math.max(1, Math.floor(base.spd * (1 + (mods.spdMod || 0)))),
    int: Math.max(1, Math.floor(base.int * (1 + (mods.intMod || 0)))),
    res: Math.max(1, Math.floor(base.res * (1 + (mods.resMod || 0)))),
    sta: Math.max(1, Math.floor(base.sta * (1 + (mods.staMod || 0)))),
  };
}