// Inventory and Equipment System Types

export type ItemType = 'weapon' | 'armor' | 'accessory';
export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface ItemModifiers {
  atk?: number;
  def?: number;
  spd?: number;
  hp?: number;
  critChance?: number;
  luck?: number;
}

export interface WeaponData {
  baseDamage: number;
  speedModifier: number;
  critChance: number;
}

export interface ArmorData {
  defenseValue: number;
}

export interface AccessoryData {
  hpBonus?: number;
  attackBonus?: number;
  critChanceBonus?: number;
  luckBonus?: number;
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  cost: number;
  description: string;
  modifiers: ItemModifiers;
  // Type-specific data
  weaponData?: WeaponData;
  armorData?: ArmorData;
  accessoryData?: AccessoryData;
}

export interface EquippedItems {
  weapon: Item | null;
  armor: Item | null;
  accessory: Item | null;
}

export interface Inventory {
  items: Item[];
  equipped: EquippedItems;
}

export interface DerivedStats {
  atk: number;
  def: number;
  spd: number;
  hp: number;
  critChance: number;
  luck: number;
}

/**
 * Create a new weapon item
 */
export function createWeapon(
  id: string,
  name: string,
  rarity: ItemRarity,
  cost: number,
  baseDamage: number,
  speedModifier: number,
  critChance: number,
  description: string
): Item {
  return {
    id,
    name,
    type: 'weapon',
    rarity,
    cost,
    description,
    modifiers: {
      atk: baseDamage,
      spd: speedModifier,
      critChance,
    },
    weaponData: {
      baseDamage,
      speedModifier,
      critChance,
    },
  };
}

/**
 * Create a new armor item
 */
export function createArmor(
  id: string,
  name: string,
  rarity: ItemRarity,
  cost: number,
  defenseValue: number,
  description: string,
  hpBonus?: number
): Item {
  return {
    id,
    name,
    type: 'armor',
    rarity,
    cost,
    description,
    modifiers: {
      def: defenseValue,
      hp: hpBonus,
    },
    armorData: {
      defenseValue,
    },
    accessoryData: hpBonus ? { hpBonus } : undefined,
  };
}

/**
 * Create a new accessory item
 */
export function createAccessory(
  id: string,
  name: string,
  rarity: ItemRarity,
  cost: number,
  hpBonus?: number,
  attackBonus?: number,
  critChanceBonus?: number,
  luckBonus?: number,
  description?: string
): Item {
  const desc = description || `A ${rarity} accessory with special properties`;
  
  return {
    id,
    name,
    type: 'accessory',
    rarity,
    cost,
    description: desc,
    modifiers: {
      hp: hpBonus,
      atk: attackBonus,
      critChance: critChanceBonus,
      luck: luckBonus,
    },
    accessoryData: {
      hpBonus,
      attackBonus,
      critChanceBonus,
      luckBonus,
    },
  };
}

/**
 * Create an empty inventory
 */
export function createInventory(): Inventory {
  return {
    items: [],
    equipped: {
      weapon: null,
      armor: null,
      accessory: null,
    },
  };
}

/**
 * Calculate derived stats from base stats and equipped items
 */
export function calculateDerivedStats(
  baseAtk: number,
  baseDef: number,
  baseSpd: number,
  baseHp: number,
  baseCritChance: number,
  baseLuck: number,
  equipped: EquippedItems
): DerivedStats {
  let atk = baseAtk;
  let def = baseDef;
  let spd = baseSpd;
  let hp = baseHp;
  let critChance = baseCritChance;
  let luck = baseLuck;

  // Apply weapon modifiers
  if (equipped.weapon) {
    const w = equipped.weapon;
    if (w.modifiers.atk !== undefined) atk += w.modifiers.atk;
    if (w.modifiers.spd !== undefined) spd += w.modifiers.spd;
    if (w.modifiers.critChance !== undefined) critChance += w.modifiers.critChance;
  }

  // Apply armor modifiers
  if (equipped.armor) {
    const a = equipped.armor;
    if (a.modifiers.def !== undefined) def += a.modifiers.def;
    if (a.modifiers.hp !== undefined) hp += a.modifiers.hp;
  }

  // Apply accessory modifiers
  if (equipped.accessory) {
    const acc = equipped.accessory;
    if (acc.modifiers.hp !== undefined) hp += acc.modifiers.hp;
    if (acc.modifiers.atk !== undefined) atk += acc.modifiers.atk;
    if (acc.modifiers.critChance !== undefined) critChance += acc.modifiers.critChance;
    if (acc.modifiers.luck !== undefined) luck += acc.modifiers.luck;
  }

  // Ensure minimum values
  atk = Math.max(1, atk);
  def = Math.max(0, def);
  spd = Math.max(1, spd);
  hp = Math.max(1, hp);
  critChance = Math.max(0, Math.min(100, critChance));
  luck = Math.max(0, luck);

  return { atk, def, spd, hp, critChance, luck };
}

/**
 * Equip an item to a specific slot
 */
export function equipItem(
  inventory: Inventory,
  itemId: string,
  slot: 'weapon' | 'armor' | 'accessory'
): { success: boolean; message: string; replacedItem?: Item } {
  const itemIndex = inventory.items.findIndex((item) => item.id === itemId);
  
  if (itemIndex === -1) {
    return { success: false, message: 'Item not found in inventory' };
  }

  const item = inventory.items[itemIndex];

  if (item.type !== slot) {
    return { success: false, message: `Cannot equip ${item.type} in ${slot} slot` };
  }

  let replacedItem: Item | undefined;

  // If there's already an item equipped, unequip it first
  if (inventory.equipped[slot]) {
    replacedItem = inventory.equipped[slot]!;
    inventory.items.push(replacedItem);
  }

  // Remove item from inventory and equip it
  inventory.items.splice(itemIndex, 1);
  inventory.equipped[slot] = item;

  return { 
    success: true, 
    message: `Equipped ${item.name}`,
    replacedItem 
  };
}

/**
 * Unequip an item from a specific slot
 */
export function unequipItem(
  inventory: Inventory,
  slot: 'weapon' | 'armor' | 'accessory'
): { success: boolean; message: string; item?: Item } {
  if (!inventory.equipped[slot]) {
    return { success: false, message: 'No item equipped in this slot' };
  }

  const item = inventory.equipped[slot]!;
  inventory.items.push(item);
  inventory.equipped[slot] = null;

  return { success: true, message: `Unequipped ${item.name}`, item };
}

/**
 * Add an item to inventory (from shop purchase or other sources)
 */
export function addItemToInventory(inventory: Inventory, item: Item): void {
  inventory.items.push(item);
}

/**
 * Get preview of stat changes when equipping an item
 */
export function getStatChangePreview(
  baseAtk: number,
  baseDef: number,
  baseSpd: number,
  baseHp: number,
  baseCritChance: number,
  baseLuck: number,
  currentEquipped: EquippedItems,
  newItem: Item | null,
  slot: 'weapon' | 'armor' | 'accessory'
): { current: DerivedStats; preview: DerivedStats; changes: Partial<DerivedStats> } {
  const current = calculateDerivedStats(
    baseAtk, baseDef, baseSpd, baseHp, baseCritChance, baseLuck,
    currentEquipped
  );

  // Create temporary equipped state with new item
  const tempEquipped = { ...currentEquipped, [slot]: newItem };
  const preview = calculateDerivedStats(
    baseAtk, baseDef, baseSpd, baseHp, baseCritChance, baseLuck,
    tempEquipped
  );

  const changes: Partial<DerivedStats> = {};
  if (preview.atk !== current.atk) changes.atk = preview.atk - current.atk;
  if (preview.def !== current.def) changes.def = preview.def - current.def;
  if (preview.spd !== current.spd) changes.spd = preview.spd - current.spd;
  if (preview.hp !== current.hp) changes.hp = preview.hp - current.hp;
  if (preview.critChance !== current.critChance) changes.critChance = preview.critChance - current.critChance;
  if (preview.luck !== current.luck) changes.luck = preview.luck - current.luck;

  return { current, preview, changes };
}

/**
 * Serialize inventory for storage
 */
export function serializeInventory(inventory: Inventory): string {
  return JSON.stringify({
    items: inventory.items,
    equipped: inventory.equipped,
  });
}

/**
 * Deserialize inventory from storage
 */
export function deserializeInventory(data: string): Inventory {
  const parsed = JSON.parse(data);
  return {
    items: parsed.items || [],
    equipped: parsed.equipped || { weapon: null, armor: null, accessory: null },
  };
}
