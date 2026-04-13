// Inventory Scene - Pixi.js UI for managing equipment

import { Container, Graphics, Text, TextStyle, EventMode } from 'pixi.js';
import { SceneManager, IScene } from './SceneManager';
import { Inventory, Item, EquippedItems, equipItem, unequipItem, getStatChangePreview, calculateDerivedStats } from '../../shared/types/inventory';
import { loadPlayerData, savePlayerData, PlayerData } from '../systems/PlayerDataManager';

export class InventoryScene implements IScene {
  container: Container;
  private sceneManager: SceneManager;
  private playerData: PlayerData | null;
  private backgroundGraphics: Graphics;
  
  // UI Containers
  private equippedPanel: Container | null;
  private inventoryPanel: Container | null;
  private statsPanel: Container | null;
  private selectedItemDetail: Container | null;
  
  // State
  private selectedItemId: string | null;
  private selectedItemSlot: 'inventory' | 'weapon' | 'armor' | 'accessory' | null;
  
  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.container = new Container();
    this.playerData = null;
    this.backgroundGraphics = new Graphics();
    this.equippedPanel = null;
    this.inventoryPanel = null;
    this.statsPanel = null;
    this.selectedItemDetail = null;
    this.selectedItemId = null;
    this.selectedItemSlot = null;
  }

  onEnter(): void {
    this.playerData = loadPlayerData();
    this.createBackground();
    this.createEquippedPanel();
    this.createInventoryPanel();
    this.createStatsPanel();
    this.createSelectedItemDetail();
    this.createBackButton();
    this.refreshUI();
  }

  onExit(): void {
    if (this.playerData) {
      savePlayerData(this.playerData);
    }
  }

  update(delta: number): void {
    // No continuous updates needed
  }

  private createBackground(): void {
    const width = 1024;
    const height = 768;
    this.backgroundGraphics.clear();
    
    // Dark gradient background
    for (let i = 0; i < height; i += 3) {
      const ratio = i / height;
      const r = Math.floor(10 + ratio * 20);
      const g = Math.floor(5 + ratio * 10);
      const b = Math.floor(20 + ratio * 35);
      this.backgroundGraphics.rect(0, i, width, 3);
      this.backgroundGraphics.fill(`rgb(${r}, ${g}, ${b})`);
    }
    
    this.container.addChild(this.backgroundGraphics);
  }

  private createEquippedPanel(): void {
    const panel = new Container();
    panel.position.set(180, 100);
    
    // Panel background
    const bg = new Graphics();
    bg.roundRect(-140, -80, 280, 320, 10);
    bg.fill({ color: 0x1a1a3e });
    bg.stroke({ width: 2, color: 0x4444ff });
    panel.addChild(bg);
    
    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0xffd700,
      stroke: { color: 0x000000, width: 1 },
    });
    const title = new Text({ text: 'EQUIPPED', style: titleStyle });
    title.anchor.set(0.5, 0);
    title.position.set(0, -70);
    panel.addChild(title);
    
    // Equipment slots
    const slots = [
      { id: 'weapon', label: 'Weapon', y: -20 },
      { id: 'armor', label: 'Armor', y: 60 },
      { id: 'accessory', label: 'Accessory', y: 140 },
    ];
    
    slots.forEach(slot => {
      const slotContainer = new Container();
      slotContainer.position.set(0, slot.y);
      slotContainer.eventMode = 'static' as EventMode;
      slotContainer.cursor = 'pointer';
      
      // Slot background
      const slotBg = new Graphics();
      slotBg.roundRect(-120, -25, 240, 50, 5);
      slotBg.fill({ color: 0x2a2a4e });
      slotBg.stroke({ width: 1, color: 0x6666ff });
      slotContainer.addChild(slotBg);
      
      // Label
      const labelStyle = new TextStyle({
        fontFamily: 'Arial',
        fontSize: 14,
        fill: 0xcccccc,
      });
      const label = new Text({ text: slot.label, style: labelStyle });
      label.anchor.set(0, 0.5);
      label.position.set(-110, 0);
      slotContainer.addChild(label);
      
      // Item name placeholder
      const itemName = new Text({ 
        text: 'Empty', 
        style: new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: 0x888888 }) 
      });
      itemName.anchor.set(1, 0.5);
      itemName.position.set(110, 0);
      itemName.name = 'itemName';
      slotContainer.addChild(itemName);
      
      // Click to unequip
      slotContainer.on('pointerup', () => {
        this.handleUnequipClick(slot.id as 'weapon' | 'armor' | 'accessory');
      });
      
      panel.addChild(slotContainer);
    });
    
    this.equippedPanel = panel;
    this.container.addChild(panel);
  }

  private createInventoryPanel(): void {
    const panel = new Container();
    panel.position.set(520, 100);
    
    // Panel background
    const bg = new Graphics();
    bg.roundRect(-180, -80, 360, 480, 10);
    bg.fill({ color: 0x1a1a3e });
    bg.stroke({ width: 2, color: 0x4444ff });
    panel.addChild(bg);
    
    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0xffd700,
      stroke: { color: 0x000000, width: 1 },
    });
    const title = new Text({ text: 'INVENTORY', style: titleStyle });
    title.anchor.set(0.5, 0);
    title.position.set(0, -70);
    panel.addChild(title);
    
    // Scrollable item list container
    const itemListContainer = new Container();
    itemListContainer.position.set(0, -40);
    itemListContainer.name = 'itemList';
    panel.addChild(itemListContainer);
    
    this.inventoryPanel = panel;
    this.container.addChild(panel);
  }

  private createStatsPanel(): void {
    const panel = new Container();
    panel.position.set(850, 520);
    
    // Panel background
    const bg = new Graphics();
    bg.roundRect(-150, -60, 300, 140, 10);
    bg.fill({ color: 0x1a1a3e });
    bg.stroke({ width: 2, color: 0x4444ff });
    panel.addChild(bg);
    
    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0x00ff88,
      stroke: { color: 0x000000, width: 1 },
    });
    const title = new Text({ text: 'COMBAT STATS', style: titleStyle });
    title.anchor.set(0.5, 0);
    title.position.set(0, -50);
    panel.addChild(title);
    
    // Stats display
    const statsContainer = new Container();
    statsContainer.position.set(0, -20);
    statsContainer.name = 'statsDisplay';
    panel.addChild(statsContainer);
    
    this.statsPanel = panel;
    this.container.addChild(panel);
  }

  private createSelectedItemDetail(): void {
    const panel = new Container();
    panel.position.set(520, 520);
    panel.visible = false;
    
    // Panel background
    const bg = new Graphics();
    bg.roundRect(-180, -60, 360, 140, 10);
    bg.fill({ color: 0x2a2a5e });
    bg.stroke({ width: 2, color: 0xffd700 });
    panel.addChild(bg);
    
    // Item name
    const nameStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0xffd700,
      stroke: { color: 0x000000, width: 1 },
    });
    const nameText = new Text({ text: '', style: nameStyle });
    nameText.anchor.set(0.5, 0);
    nameText.position.set(0, -50);
    nameText.name = 'itemName';
    panel.addChild(nameText);
    
    // Item stats
    const statsStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0xcccccc,
    });
    const statsText = new Text({ text: '', style: statsStyle });
    statsText.anchor.set(0.5, 0);
    statsText.position.set(0, -25);
    statsText.name = 'itemStats';
    panel.addChild(statsText);
    
    // Action buttons container
    const actionsContainer = new Container();
    actionsContainer.position.set(0, 20);
    actionsContainer.name = 'actions';
    panel.addChild(actionsContainer);
    
    this.selectedItemDetail = panel;
    this.container.addChild(panel);
  }

  private createBackButton(): void {
    const button = new Container();
    button.position.set(50, 720);
    button.eventMode = 'static' as EventMode;
    button.cursor = 'pointer';
    
    const bg = new Graphics();
    bg.roundRect(-60, -20, 120, 40, 5);
    bg.fill({ color: 0xaa2222 });
    bg.stroke({ width: 2, color: 0xff4444 });
    button.addChild(bg);
    
    const textStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0xffffff,
    });
    const text = new Text({ text: 'BACK', style: textStyle });
    text.anchor.set(0.5);
    button.addChild(text);
    
    button.on('pointerenter', () => {
      bg.clear();
      bg.roundRect(-60, -20, 120, 40, 5);
      bg.fill({ color: 0xff4444 });
      bg.stroke({ width: 2, color: 0xff6666 });
    });
    
    button.on('pointerleave', () => {
      bg.clear();
      bg.roundRect(-60, -20, 120, 40, 5);
      bg.fill({ color: 0xaa2222 });
      bg.stroke({ width: 2, color: 0xff4444 });
    });
    
    button.on('pointerup', () => {
      this.sceneManager.switchScene('hub');
    });
    
    this.container.addChild(button);
  }

  private refreshUI(): void {
    if (!this.playerData) return;
    
    this.refreshEquippedSlots();
    this.refreshInventoryList();
    this.refreshStatsDisplay();
    
    if (this.selectedItemId) {
      this.refreshSelectedItemDetail();
    }
  }

  private refreshEquippedSlots(): void {
    if (!this.equippedPanel || !this.playerData) return;
    
    const slots = ['weapon', 'armor', 'accessory'];
    
    slots.forEach((slotId, index) => {
      const slotContainer = this.equippedPanel.getChildAt(index + 2) as Container; // Skip bg and title
      if (slotContainer) {
        const item = this.playerData.inventory.equipped[slotId as keyof EquippedItems];
        const itemNameText = slotContainer.getChildByName('itemName') as Text;
        
        if (item) {
          itemNameText.text = item.name;
          itemNameText.style = new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: this.getRarityColor(item.rarity) });
        } else {
          itemNameText.text = 'Empty';
          itemNameText.style = new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: 0x888888 });
        }
      }
    });
  }

  private refreshInventoryList(): void {
    if (!this.inventoryPanel || !this.playerData) return;
    
    const itemListContainer = this.inventoryPanel.getChildByName('itemList') as Container;
    if (!itemListContainer) return;
    
    // Clear existing items
    itemListContainer.removeChildren();
    
    const items = this.playerData.inventory.items;
    
    if (items.length === 0) {
      const emptyText = new Text({ 
        text: 'Inventory Empty\nVisit the Shop to buy items!', 
        style: new TextStyle({ 
          fontFamily: 'Arial', 
          fontSize: 14, 
          fill: 0x888888,
          align: 'center',
        }) 
      });
      emptyText.anchor.set(0.5);
      itemListContainer.addChild(emptyText);
      return;
    }
    
    items.forEach((item, index) => {
      const itemBtn = this.createInventoryItemButton(item, index);
      itemBtn.position.set(0, index * 55);
      itemListContainer.addChild(itemBtn);
    });
  }

  private createInventoryItemButton(item: Item, index: number): Container {
    const btn = new Container();
    btn.eventMode = 'static' as EventMode;
    btn.cursor = 'pointer';
    
    // Background
    const bg = new Graphics();
    bg.roundRect(-170, -22, 340, 44, 5);
    bg.fill({ color: 0x2a2a4e });
    bg.stroke({ width: 1, color: this.getRarityColor(item.rarity) });
    btn.addChild(bg);
    
    // Item name
    const nameStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 13,
      fill: this.getRarityColor(item.rarity),
      fontWeight: 'bold',
    });
    const nameText = new Text({ text: item.name, style: nameStyle });
    nameText.anchor.set(0, 0.5);
    nameText.position.set(-160, 0);
    btn.addChild(nameText);
    
    // Item type
    const typeStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 11,
      fill: 0x888888,
    });
    const typeText = new Text({ text: item.type.toUpperCase(), style: typeStyle });
    typeText.anchor.set(1, 0.5);
    typeText.position.set(160, 0);
    btn.addChild(typeText);
    
    // Hover effect
    btn.on('pointerenter', () => {
      bg.clear();
      bg.roundRect(-170, -22, 340, 44, 5);
      bg.fill({ color: 0x3a3a5e });
      bg.stroke({ width: 2, color: this.getRarityColor(item.rarity) });
    });
    
    btn.on('pointerleave', () => {
      bg.clear();
      bg.roundRect(-170, -22, 340, 44, 5);
      bg.fill({ color: 0x2a2a4e });
      bg.stroke({ width: 1, color: this.getRarityColor(item.rarity) });
    });
    
    // Click handler
    btn.on('pointerup', () => {
      this.selectItem(item, 'inventory');
    });
    
    return btn;
  }

  private selectItem(item: Item, slot: 'inventory' | 'weapon' | 'armor' | 'accessory'): void {
    this.selectedItemId = item.id;
    this.selectedItemSlot = slot;
    
    if (this.selectedItemDetail) {
      this.selectedItemDetail.visible = true;
      this.refreshSelectedItemDetail();
    }
  }

  private refreshSelectedItemDetail(): void {
    if (!this.selectedItemDetail || !this.playerData || !this.selectedItemId) return;
    
    let item: Item | null = null;
    let itemSlot: 'inventory' | 'weapon' | 'armor' | 'accessory' | null = null;
    
    // Find item in inventory
    const invItem = this.playerData.inventory.items.find(i => i.id === this.selectedItemId);
    if (invItem) {
      item = invItem;
      itemSlot = 'inventory';
    }
    
    // Check equipped items
    if (!item) {
      const equipped = this.playerData.inventory.equipped;
      if (equipped.weapon?.id === this.selectedItemId) {
        item = equipped.weapon;
        itemSlot = 'weapon';
      } else if (equipped.armor?.id === this.selectedItemId) {
        item = equipped.armor;
        itemSlot = 'armor';
      } else if (equipped.accessory?.id === this.selectedItemId) {
        item = equipped.accessory;
        itemSlot = 'accessory';
      }
    }
    
    if (!item) return;
    
    const nameText = this.selectedItemDetail.getChildByName('itemName') as Text;
    const statsText = this.selectedItemDetail.getChildByName('itemStats') as Text;
    const actionsContainer = this.selectedItemDetail.getChildByName('actions') as Container;
    
    nameText.text = item.name;
    
    // Build stats description
    const statLines: string[] = [];
    statLines.push(`${item.type.toUpperCase()} - ${item.rarity.toUpperCase()}`);
    statLines.push(item.description);
    
    if (item.modifiers.atk) statLines.push(`+${item.modifiers.atk} Attack`);
    if (item.modifiers.def) statLines.push(`+${item.modifiers.def} Defense`);
    if (item.modifiers.spd) statLines.push(`${item.modifiers.spd > 0 ? '+' : ''}${item.modifiers.spd} Speed`);
    if (item.modifiers.hp) statLines.push(`+${item.modifiers.hp} HP`);
    if (item.modifiers.critChance) statLines.push(`+${item.modifiers.critChance}% Crit Chance`);
    if (item.modifiers.luck) statLines.push(`+${item.modifiers.luck} Luck`);
    
    statsText.text = statLines.join('\n');
    
    // Clear and rebuild action buttons
    actionsContainer.removeChildren();
    
    if (itemSlot === 'inventory') {
      // Show equip button
      const equipBtn = this.createActionButton('EQUIP', 0x44aa44, () => {
        this.handleEquipClick(item!, item!.type as 'weapon' | 'armor' | 'accessory');
      });
      actionsContainer.addChild(equipBtn);
    } else if (itemSlot && itemSlot !== 'inventory') {
      // Show unequip button
      const unequipBtn = this.createActionButton('UNEQUIP', 0xaa4444, () => {
        this.handleUnequipClick(itemSlot as 'weapon' | 'armor' | 'accessory');
      });
      actionsContainer.addChild(unequipBtn);
    }
  }

  private createActionButton(label: string, color: number, onClick: () => void): Container {
    const btn = new Container();
    btn.eventMode = 'static' as EventMode;
    btn.cursor = 'pointer';
    
    const bg = new Graphics();
    bg.roundRect(-60, -15, 120, 30, 5);
    bg.fill({ color });
    bg.stroke({ width: 1, color: 0xffffff });
    btn.addChild(bg);
    
    const textStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 12,
      fontWeight: 'bold',
      fill: 0xffffff,
    });
    const text = new Text({ text: label, style: textStyle });
    text.anchor.set(0.5);
    btn.addChild(text);
    
    btn.on('pointerenter', () => {
      bg.clear();
      bg.roundRect(-60, -15, 120, 30, 5);
      bg.fill({ color: Math.min(0xffffff, color + 0x222222) });
    });
    
    btn.on('pointerleave', () => {
      bg.clear();
      bg.roundRect(-60, -15, 120, 30, 5);
      bg.fill({ color });
      bg.stroke({ width: 1, color: 0xffffff });
    });
    
    btn.on('pointerup', onClick);
    
    return btn;
  }

  private handleEquipClick(item: Item, slot: 'weapon' | 'armor' | 'accessory'): void {
    if (!this.playerData) return;
    
    const result = equipItem(this.playerData.inventory, item.id, slot);
    
    if (result.success) {
      this.refreshUI();
      this.selectedItemId = item.id;
      this.selectedItemSlot = slot;
    }
    
    savePlayerData(this.playerData);
  }

  private handleUnequipClick(slot: 'weapon' | 'armor' | 'accessory'): void {
    if (!this.playerData) return;
    
    const result = unequipItem(this.playerData.inventory, slot);
    
    if (result.success) {
      this.refreshUI();
      this.selectedItemId = null;
      this.selectedItemSlot = null;
      if (this.selectedItemDetail) {
        this.selectedItemDetail.visible = false;
      }
    }
    
    savePlayerData(this.playerData);
  }

  private refreshStatsDisplay(): void {
    if (!this.statsPanel || !this.playerData) return;
    
    const statsContainer = this.statsPanel.getChildByName('statsDisplay') as Container;
    if (!statsContainer) return;
    
    statsContainer.removeChildren();
    
    // Calculate derived stats from base stats and equipment
    // Base stats from character creation (simplified for MVP)
    const baseAtk = this.playerData.profile?.stats.strength || 10;
    const baseDef = this.playerData.profile?.stats.endurance || 5;
    const baseSpd = this.playerData.profile?.stats.agility || 10;
    const baseHp = 100 + (this.playerData.profile?.stats.endurance || 5) * 2;
    
    const derivedStats = calculateDerivedStats(
      baseAtk,
      baseDef,
      baseSpd,
      baseHp,
      0,
      0,
      this.playerData.inventory.equipped
    );
    
    const statLines = [
      `ATK: ${derivedStats.atk}`,
      `DEF: ${derivedStats.def}`,
      `SPD: ${derivedStats.spd}`,
      `HP: ${derivedStats.hp}`,
      `CRIT: ${derivedStats.critChance}%`,
      `LUCK: ${derivedStats.luck}`,
    ];
    
    const statStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 13,
      fill: 0xffffff,
    });
    
    statLines.forEach((line, index) => {
      const text = new Text({ text: line, style: statStyle });
      text.anchor.set(0, 0);
      text.position.set(-140, index * 18);
      statsContainer.addChild(text);
    });
  }

  private getRarityColor(rarity: string): number {
    switch (rarity) {
      case 'common': return 0xffffff;
      case 'rare': return 0x0088ff;
      case 'epic': return 0xaa00ff;
      case 'legendary': return 0xffaa00;
      default: return 0xcccccc;
    }
  }
}
