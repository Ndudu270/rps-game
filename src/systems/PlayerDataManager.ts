// Player Data Manager - Handles persistent player data including inventory and shop

import { Inventory, createInventory, serializeInventory, deserializeInventory, calculateDerivedStats } from '../../shared/types/inventory';
import { ShopState, createDefaultShop, serializeShopState, deserializeShopState, addGold } from '../../shared/types/shop';

export interface PlayerProfile {
  name: string;
  race: string;
  class: string;
  background: string;
  talents: string[];
  stats: {
    strength: number;
    agility: number;
    intelligence: number;
    charisma: number;
    endurance: number;
    perception: number;
    luck: number;
  };
}

export interface PlayerData {
  profile: PlayerProfile | null;
  inventory: Inventory;
  shop: ShopState;
  gold: number; // Deprecated: use shop.playerGold instead
}

const STORAGE_KEY = 'rpsWarPlayerData';

/**
 * Create default player data for new players
 */
export function createDefaultPlayerData(): PlayerData {
  const shop = createDefaultShop();
  
  return {
    profile: null,
    inventory: createInventory(),
    shop,
    gold: shop.playerGold,
  };
}

/**
 * Load player data from localStorage
 */
export function loadPlayerData(): PlayerData {
  if (typeof localStorage === 'undefined') {
    return createDefaultPlayerData();
  }
  
  const saved = localStorage.getItem(STORAGE_KEY);
  
  if (!saved) {
    return createDefaultPlayerData();
  }
  
  try {
    const parsed = JSON.parse(saved);
    
    // Reconstruct inventory
    const inventory = parsed.inventory 
      ? deserializeInventory(JSON.stringify(parsed.inventory))
      : createInventory();
    
    // Reconstruct shop
    const shop = parsed.shop 
      ? deserializeShopState(JSON.stringify(parsed.shop))
      : createDefaultShop();
    
    return {
      profile: parsed.profile || null,
      inventory,
      shop,
      gold: parsed.gold ?? shop.playerGold,
    };
  } catch (e) {
    console.error('Failed to load player data:', e);
    return createDefaultPlayerData();
  }
}

/**
 * Save player data to localStorage
 */
export function savePlayerData(data: PlayerData): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  
  try {
    const toSave = {
      profile: data.profile,
      inventory: {
        items: data.inventory.items,
        equipped: data.inventory.equipped,
      },
      shop: {
        categories: data.shop.categories,
        playerGold: data.shop.playerGold,
      },
      gold: data.shop.playerGold, // Keep gold in sync with shop
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error('Failed to save player data:', e);
  }
}

/**
 * Initialize or load player data
 */
export function initializePlayerData(): PlayerData {
  const data = loadPlayerData();
  savePlayerData(data); // Ensure data is saved
  return data;
}

/**
 * Update player profile
 */
export function updatePlayerProfile(data: PlayerData, profile: PlayerData['profile']): void {
  data.profile = profile;
  savePlayerData(data);
}

/**
 * Add gold to player (from rewards, etc.)
 */
export function addGoldToPlayer(data: PlayerData, amount: number): void {
  addGold(data.shop, amount);
  data.gold = data.shop.playerGold;
  savePlayerData(data);
}

/**
 * Set player gold (for initialization)
 */
export function setPlayerGold(data: PlayerData, amount: number): void {
  data.shop.playerGold = amount;
  data.gold = amount;
  savePlayerData(data);
}

/**
 * Get derived stats for combat based on base stats and equipped items
 */
export function getDerivedStatsForCombat(
  baseAtk: number,
  baseDef: number,
  baseSpd: number,
  baseHp: number,
  inventory: Inventory
): { atk: number; def: number; spd: number; hp: number; critChance: number; luck: number } {
  return calculateDerivedStats(
    baseAtk,
    baseDef,
    baseSpd,
    baseHp,
    0, // base crit chance
    0, // base luck
    inventory.equipped
  );
}

/**
 * Reset player data (for testing or new game)
 */
export function resetPlayerData(): PlayerData {
  const newData = createDefaultPlayerData();
  savePlayerData(newData);
  return newData;
}

/**
 * Check if player has a specific item in inventory
 */
export function hasItemInInventory(data: PlayerData, itemId: string): boolean {
  return data.inventory.items.some(item => item.id === itemId) ||
         Object.values(data.inventory.equipped).some(item => item?.id === itemId);
}

/**
 * Get total item count in inventory (including equipped)
 */
export function getInventoryCount(data: PlayerData): number {
  return data.inventory.items.length + 
         Object.values(data.inventory.equipped).filter(Boolean).length;
}

/**
 * Export player data for backup
 */
export function exportPlayerData(data: PlayerData): string {
  return JSON.stringify({
    profile: data.profile,
    inventory: data.inventory,
    shop: data.shop,
    exportedAt: Date.now(),
    version: '1.0',
  });
}

/**
 * Import player data from backup
 */
export function importPlayerData(importedData: string): PlayerData {
  try {
    const parsed = JSON.parse(importedData);
    
    const data: PlayerData = {
      profile: parsed.profile || null,
      inventory: parsed.inventory 
        ? deserializeInventory(JSON.stringify(parsed.inventory))
        : createInventory(),
      shop: parsed.shop 
        ? deserializeShopState(JSON.stringify(parsed.shop))
        : createDefaultShop(),
      gold: parsed.gold ?? parsed.shop?.playerGold ?? 500,
    };
    
    savePlayerData(data);
    return data;
  } catch (e) {
    console.error('Failed to import player data:', e);
    throw new Error('Invalid import data format');
  }
}
