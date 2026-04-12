// Shop System Types

import { Item, ItemRarity } from './inventory';

export interface ShopItem extends Item {
  stock?: number; // -1 for infinite stock
  unlockRequirement?: string; // Future: level, achievement, etc.
}

export interface ShopCategory {
  id: string;
  name: string;
  items: ShopItem[];
}

export interface ShopState {
  categories: ShopCategory[];
  playerGold: number;
}

export interface PurchaseResult {
  success: boolean;
  message: string;
  item?: Item;
  remainingGold?: number;
}

/**
 * Create a shop category
 */
export function createShopCategory(
  id: string,
  name: string,
  items: ShopItem[]
): ShopCategory {
  return { id, name, items };
}

/**
 * Create the default shop with starter items
 */
export function createDefaultShop(): ShopState {
  return {
    categories: [
      createShopCategory('weapons', 'Weapons', [
        // Common Weapons
        {
          id: 'w_rusty_sword',
          name: 'Rusty Sword',
          type: 'weapon',
          rarity: 'common',
          cost: 50,
          description: 'A worn blade, better than nothing.',
          modifiers: { atk: 3, spd: 0, critChance: 0 },
          weaponData: { baseDamage: 3, speedModifier: 0, critChance: 0 },
        },
        {
          id: 'w_iron_sword',
          name: 'Iron Sword',
          type: 'weapon',
          rarity: 'common',
          cost: 100,
          description: 'A reliable blade for novice warriors.',
          modifiers: { atk: 6, spd: 0, critChance: 2 },
          weaponData: { baseDamage: 6, speedModifier: 0, critChance: 2 },
        },
        {
          id: 'w_dagger',
          name: "Assassin's Dagger",
          type: 'weapon',
          rarity: 'common',
          cost: 80,
          description: 'Quick and deadly, favored by rogues.',
          modifiers: { atk: 4, spd: 3, critChance: 5 },
          weaponData: { baseDamage: 4, speedModifier: 3, critChance: 5 },
        },
        {
          id: 'w_greatsword',
          name: 'Greatsword',
          type: 'weapon',
          rarity: 'rare',
          cost: 200,
          description: 'A massive blade that deals devastating damage.',
          modifiers: { atk: 12, spd: -2, critChance: 3 },
          weaponData: { baseDamage: 12, speedModifier: -2, critChance: 3 },
        },
        {
          id: 'w_battle_axe',
          name: 'Battle Axe',
          type: 'weapon',
          rarity: 'rare',
          cost: 180,
          description: 'Brutal and effective against armored foes.',
          modifiers: { atk: 10, spd: -1, critChance: 5 },
          weaponData: { baseDamage: 10, speedModifier: -1, critChance: 5 },
        },
        {
          id: 'w_spear',
          name: 'Long Spear',
          type: 'weapon',
          rarity: 'common',
          cost: 90,
          description: 'Reach advantage with balanced stats.',
          modifiers: { atk: 7, spd: 1, critChance: 2 },
          weaponData: { baseDamage: 7, speedModifier: 1, critChance: 2 },
        },
        {
          id: 'w_mithril_blade',
          name: 'Mithril Blade',
          type: 'weapon',
          rarity: 'epic',
          cost: 400,
          description: 'Forged from legendary metal, light and deadly.',
          modifiers: { atk: 15, spd: 4, critChance: 8 },
          weaponData: { baseDamage: 15, speedModifier: 4, critChance: 8 },
        },
        {
          id: 'w_dragon_slayer',
          name: 'Dragon Slayer',
          type: 'weapon',
          rarity: 'legendary',
          cost: 800,
          description: 'A legendary weapon capable of felling dragons.',
          modifiers: { atk: 25, spd: 2, critChance: 15 },
          weaponData: { baseDamage: 25, speedModifier: 2, critChance: 15 },
        },
      ]),
      createShopCategory('armor', 'Armor', [
        // Common Armor
        {
          id: 'a_cloth_armor',
          name: 'Cloth Armor',
          type: 'armor',
          rarity: 'common',
          cost: 40,
          description: 'Basic protection for mages and scholars.',
          modifiers: { def: 2, hp: 10 },
          armorData: { defenseValue: 2 },
          accessoryData: { hpBonus: 10 },
        },
        {
          id: 'a_leather_armor',
          name: 'Leather Armor',
          type: 'armor',
          rarity: 'common',
          cost: 80,
          description: 'Lightweight armor favored by rogues.',
          modifiers: { def: 4, hp: 20 },
          armorData: { defenseValue: 4 },
          accessoryData: { hpBonus: 20 },
        },
        {
          id: 'a_chain_mail',
          name: 'Chain Mail',
          type: 'armor',
          rarity: 'rare',
          cost: 150,
          description: 'Reliable protection for frontline fighters.',
          modifiers: { def: 8, hp: 40 },
          armorData: { defenseValue: 8 },
          accessoryData: { hpBonus: 40 },
        },
        {
          id: 'a_plate_armor',
          name: 'Plate Armor',
          type: 'armor',
          rarity: 'rare',
          cost: 250,
          description: 'Heavy armor providing excellent protection.',
          modifiers: { def: 12, hp: 60 },
          armorData: { defenseValue: 12 },
          accessoryData: { hpBonus: 60 },
        },
        {
          id: 'a_dragon_scale',
          name: 'Dragon Scale Mail',
          type: 'armor',
          rarity: 'epic',
          cost: 450,
          description: 'Crafted from dragon scales, resists fire.',
          modifiers: { def: 18, hp: 100 },
          armorData: { defenseValue: 18 },
          accessoryData: { hpBonus: 100 },
        },
        {
          id: 'a_mythril_plate',
          name: 'Mythril Plate',
          type: 'armor',
          rarity: 'legendary',
          cost: 750,
          description: 'The pinnacle of armor crafting.',
          modifiers: { def: 25, hp: 150 },
          armorData: { defenseValue: 25 },
          accessoryData: { hpBonus: 150 },
        },
      ]),
      createShopCategory('accessories', 'Accessories', [
        // Common Accessories
        {
          id: 'acc_health_ring',
          name: 'Health Ring',
          type: 'accessory',
          rarity: 'common',
          cost: 60,
          description: 'A simple ring that boosts vitality.',
          modifiers: { hp: 30 },
          accessoryData: { hpBonus: 30 },
        },
        {
          id: 'acc_strength_charm',
          name: 'Strength Charm',
          type: 'accessory',
          rarity: 'common',
          cost: 70,
          description: 'Increases physical power.',
          modifiers: { atk: 4 },
          accessoryData: { attackBonus: 4 },
        },
        {
          id: 'acc_lucky_coin',
          name: 'Lucky Coin',
          type: 'accessory',
          rarity: 'rare',
          cost: 120,
          description: 'Brings fortune to its bearer.',
          modifiers: { luck: 10, critChance: 3 },
          accessoryData: { luckBonus: 10, critChanceBonus: 3 },
        },
        {
          id: 'acc_warriors_emblem',
          name: "Warrior's Emblem",
          type: 'accessory',
          rarity: 'rare',
          cost: 180,
          description: 'Symbol of battle prowess.',
          modifiers: { atk: 8, hp: 40 },
          accessoryData: { attackBonus: 8, hpBonus: 40 },
        },
        {
          id: 'acc_shadow Pendant',
          name: 'Shadow Pendant',
          type: 'accessory',
          rarity: 'epic',
          cost: 350,
          description: 'Enhances critical strikes.',
          modifiers: { critChance: 12, spd: 3 },
          accessoryData: { critChanceBonus: 12 },
        },
        {
          id: 'acc_phoenix_feather',
          name: 'Phoenix Feather',
          type: 'accessory',
          rarity: 'legendary',
          cost: 600,
          description: 'A rare feather with life-giving properties.',
          modifiers: { hp: 100, luck: 20, critChance: 8 },
          accessoryData: { hpBonus: 100, luckBonus: 20, critChanceBonus: 8 },
        },
      ]),
    ],
    playerGold: 500, // Starting gold
  };
}

/**
 * Check if player can afford an item
 */
export function canAffordItem(playerGold: number, itemCost: number): boolean {
  return playerGold >= itemCost;
}

/**
 * Attempt to purchase an item
 */
export function purchaseItem(
  shopState: ShopState,
  itemId: string
): PurchaseResult {
  // Find the item in shop categories
  let foundItem: ShopItem | undefined;
  
  for (const category of shopState.categories) {
    const item = category.items.find((i) => i.id === itemId);
    if (item) {
      foundItem = item;
      break;
    }
  }

  if (!foundItem) {
    return { success: false, message: 'Item not found in shop' };
  }

  // Check stock
  if (foundItem.stock !== undefined && foundItem.stock <= 0) {
    return { success: false, message: 'Item out of stock' };
  }

  // Check affordability
  if (!canAffordItem(shopState.playerGold, foundItem.cost)) {
    return { 
      success: false, 
      message: `Not enough gold. Need ${foundItem.cost}, have ${shopState.playerGold}` 
    };
  }

  // Deduct gold
  shopState.playerGold -= foundItem.cost;

  // Reduce stock if limited
  if (foundItem.stock !== undefined && foundItem.stock > 0) {
    foundItem.stock--;
  }

  // Create inventory item (clone without stock/unlock data)
  const inventoryItem: Item = {
    id: foundItem.id,
    name: foundItem.name,
    type: foundItem.type,
    rarity: foundItem.rarity,
    cost: foundItem.cost,
    description: foundItem.description,
    modifiers: { ...foundItem.modifiers },
    weaponData: foundItem.weaponData ? { ...foundItem.weaponData } : undefined,
    armorData: foundItem.armorData ? { ...foundItem.armorData } : undefined,
    accessoryData: foundItem.accessoryData ? { ...foundItem.accessoryData } : undefined,
  };

  return {
    success: true,
    message: `Purchased ${foundItem.name} for ${foundItem.cost} gold`,
    item: inventoryItem,
    remainingGold: shopState.playerGold,
  };
}

/**
 * Get all items of a specific rarity
 */
export function getItemsByRarity(
  shopState: ShopState,
  rarity: ItemRarity
): ShopItem[] {
  const items: ShopItem[] = [];
  
  for (const category of shopState.categories) {
    for (const item of category.items) {
      if (item.rarity === rarity) {
        items.push(item);
      }
    }
  }
  
  return items;
}

/**
 * Get all items of a specific type
 */
export function getItemsByType(
  shopState: ShopState,
  type: 'weapon' | 'armor' | 'accessory'
): ShopItem[] {
  const items: ShopItem[] = [];
  
  for (const category of shopState.categories) {
    for (const item of category.items) {
      if (item.type === type) {
        items.push(item);
      }
    }
  }
  
  return items;
}

/**
 * Serialize shop state for storage
 */
export function serializeShopState(shopState: ShopState): string {
  return JSON.stringify({
    categories: shopState.categories,
    playerGold: shopState.playerGold,
  });
}

/**
 * Deserialize shop state from storage
 */
export function deserializeShopState(data: string): ShopState {
  const parsed = JSON.parse(data);
  return {
    categories: parsed.categories || [],
    playerGold: parsed.playerGold || 500,
  };
}

/**
 * Add gold to player (for testing or rewards)
 */
export function addGold(shopState: ShopState, amount: number): void {
  shopState.playerGold += amount;
}

/**
 * Set gold (for initialization)
 */
export function setGold(shopState: ShopState, amount: number): void {
  shopState.playerGold = amount;
}
