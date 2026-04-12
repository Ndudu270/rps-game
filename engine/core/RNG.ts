// Seeded Random Number Generator for Deterministic Combat
// Uses Mulberry32 algorithm for reproducible randomness

export class SeededRNG {
  private seed: number;
  private state: number;

  constructor(seed: number) {
    this.seed = seed;
    this.state = this.hashSeed(seed);
  }

  // Hash the seed to get a good initial state
  private hashSeed(seed: number): number {
    let h = seed >>> 0;
    h = Math.imul(h ^ (h >>> 16), 0x21f0aaad);
    h = Math.imul(h ^ (h >>> 15), 0x735a2d97);
    h = h ^ (h >>> 15);
    return h >>> 0;
  }

  // Reset to original seed
  reset(): void {
    this.state = this.hashSeed(this.seed);
  }

  // Set a new seed
  setSeed(seed: number): void {
    this.seed = seed;
    this.state = this.hashSeed(seed);
  }

  // Get current seed
  getSeed(): number {
    return this.seed;
  }

  // Generate next random float [0, 1)
  next(): number {
    // Mulberry32 algorithm
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Generate random integer in range [min, max] inclusive
  nextInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Generate random float in range [min, max)
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  // Pick random element from array
  pick<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    return array[this.nextInt(0, array.length - 1)];
  }

  // Shuffle array in place (Fisher-Yates)
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Generate chance check (returns true if roll < chance)
  chance(percent: number): boolean {
    return this.next() * 100 < percent;
  }
}

// Global RNG instance - should be initialized by GameEngine
let globalRNG: SeededRNG | null = null;

export function initRNG(seed: number): SeededRNG {
  globalRNG = new SeededRNG(seed);
  return globalRNG;
}

export function getRNG(): SeededRNG {
  if (!globalRNG) {
    throw new Error('RNG not initialized. Call initRNG first.');
  }
  return globalRNG;
}