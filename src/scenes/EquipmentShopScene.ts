// Equipment Shop Scene - Buy and upgrade equipment using Equipment Points

import { Container, Graphics, Text, TextStyle, EventMode } from 'pixi.js';
import { SceneManager, IScene } from './SceneManager';
import { loadPlayerData, savePlayerData, PlayerData } from '../systems/PlayerDataManager';
import { Character } from '../../shared/types/character';
import { 
  Equipment, 
  EquipmentSlot, 
  EquipmentTier,
  OwnedEquipment,
  EquippedGear,
  calculateEquipmentCost,
  canEquip,
  TIER_MULTIPLIERS,
  SLOT_BASE_VALUES,
} from '../../shared/types/equipment';

// Sample equipment database (would be loaded from backend in production)
const EQUIPMENT_DATABASE: Equipment[] = [
  // Weapons
  {
    id: 'iron_sword',
    name: 'Iron Sword',
    slot: 'weapon',
    tier: 'common',
    stats: { attack: 15, critChance: 2 },
    baseCost: 5,
    goldCost: 100,
    requirements: { minLevel: 1 },
    description: 'A basic iron sword for beginners.',
    tags: ['sword', 'melee'],
  },
  {
    id: 'steel_sword',
    name: 'Steel Sword',
    slot: 'weapon',
    tier: 'uncommon',
    stats: { attack: 25, critChance: 4 },
    baseCost: 12,
    goldCost: 250,
    requirements: { minLevel: 5 },
    description: 'A sturdy steel blade with improved edge.',
    tags: ['sword', 'melee'],
  },
  {
    id: 'magic_staff',
    name: 'Magic Staff',
    slot: 'weapon',
    tier: 'rare',
    stats: { attack: 30, critDamage: 20 },
    baseCost: 20,
    goldCost: 500,
    requirements: { minLevel: 10, classIds: ['mage', 'necromancer'] },
    description: 'A staff imbued with arcane power.',
    tags: ['staff', 'magic'],
  },
  {
    id: 'legendary_blade',
    name: 'Blade of Legends',
    slot: 'weapon',
    tier: 'legendary',
    stats: { attack: 80, critChance: 15, critDamage: 50 },
    baseCost: 100,
    goldCost: 5000,
    requirements: { minLevel: 50 },
    description: 'A mythical weapon wielded by heroes of old.',
    tags: ['sword', 'legendary'],
  },
  // Armor
  {
    id: 'leather_armor',
    name: 'Leather Armor',
    slot: 'armor',
    tier: 'common',
    stats: { defense: 10, hp: 50 },
    baseCost: 5,
    goldCost: 100,
    requirements: { minLevel: 1 },
    description: 'Basic leather protection.',
    tags: ['light', 'armor'],
  },
  {
    id: 'chain_mail',
    name: 'Chain Mail',
    slot: 'armor',
    tier: 'uncommon',
    stats: { defense: 20, hp: 100 },
    baseCost: 12,
    goldCost: 250,
    requirements: { minLevel: 5 },
    description: 'Interlocked metal rings provide solid defense.',
    tags: ['medium', 'armor'],
  },
  {
    id: 'plate_armor',
    name: 'Plate Armor',
    slot: 'armor',
    tier: 'rare',
    stats: { defense: 35, hp: 200 },
    baseCost: 25,
    goldCost: 600,
    requirements: { minLevel: 15, statRequirements: { strength: 20 } },
    description: 'Heavy plate armor for maximum protection.',
    tags: ['heavy', 'armor'],
  },
  {
    id: 'dragon_scale_armor',
    name: 'Dragon Scale Armor',
    slot: 'armor',
    tier: 'legendary',
    stats: { defense: 80, hp: 500, critDamage: 10 },
    baseCost: 100,
    goldCost: 5000,
    requirements: { minLevel: 50 },
    description: 'Forged from the scales of an ancient dragon.',
    tags: ['heavy', 'legendary'],
  },
  // Accessories
  {
    id: 'wooden_amulet',
    name: 'Wooden Amulet',
    slot: 'accessory',
    tier: 'common',
    stats: { speed: 3, critDamage: 5 },
    baseCost: 3,
    goldCost: 50,
    requirements: { minLevel: 1 },
    description: 'A simple carved amulet.',
    tags: ['amulet'],
  },
  {
    id: 'silver_ring',
    name: 'Silver Ring',
    slot: 'accessory',
    tier: 'uncommon',
    stats: { speed: 6, critDamage: 12, luck: 5 } as any,
    baseCost: 10,
    goldCost: 200,
    requirements: { minLevel: 5 },
    description: 'A polished silver ring with minor enchantments.',
    tags: ['ring'],
  },
  {
    id: 'phoenix_feather',
    name: 'Phoenix Feather',
    slot: 'accessory',
    tier: 'epic',
    stats: { speed: 15, critDamage: 30, lifesteal: 5 },
    baseCost: 40,
    goldCost: 1500,
    requirements: { minLevel: 25 },
    description: 'A feather from the legendary phoenix.',
    tags: ['special', 'epic'],
  },
  {
    id: 'time_crystal',
    name: 'Time Crystal',
    slot: 'accessory',
    tier: 'legendary',
    stats: { speed: 25, critDamage: 50, cooldownReduction: 20 },
    baseCost: 100,
    goldCost: 5000,
    requirements: { minLevel: 50 },
    description: 'A crystal that bends time itself.',
    tags: ['special', 'legendary'],
  },
];

export class EquipmentShopScene implements IScene {
  container: Container;
  private sceneManager: SceneManager;
  private playerData: PlayerData | null;
  private backgroundGraphics: Graphics;
  
  // UI Containers
  private equipmentListPanel: Container | null;
  private ownedPanel: Container | null;
  private detailPanel: Container | null;
  private infoPanel: Container | null;
  
  // State
  private selectedEquipmentId: string | null;
  private viewMode: 'shop' | 'owned';
  
  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.container = new Container();
    this.playerData = null;
    this.backgroundGraphics = new Graphics();
    this.equipmentListPanel = null;
    this.ownedPanel = null;
    this.detailPanel = null;
    this.infoPanel = null;
    this.selectedEquipmentId = null;
    this.viewMode = 'shop';
  }

  onEnter(): void {
    this.playerData = loadPlayerData();
    this.createBackground();
    this.createInfoPanel();
    this.createTabButtons();
    this.createEquipmentListPanel();
    this.createOwnedPanel();
    this.createDetailPanel();
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

  private createInfoPanel(): void {
    const panel = new Container();
    panel.position.set(512, 40);
    
    // Background
    const bg = new Graphics();
    bg.roundRect(-200, -25, 400, 50, 10);
    bg.fill({ color: 0x1a1a3e });
    bg.stroke({ width: 2, color: 0xffd700 });
    panel.addChild(bg);
    
    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 20,
      fontWeight: 'bold',
      fill: 0xffd700,
      stroke: { color: 0x000000, width: 1 },
    });
    const title = new Text({ text: 'EQUIPMENT SHOP', style: titleStyle });
    title.anchor.set(0.5);
    panel.addChild(title);
    
    this.infoPanel = panel;
    this.container.addChild(panel);
  }

  private createTabButtons(): void {
    const tabContainer = new Container();
    tabContainer.position.set(512, 90);
    
    // Shop tab
    const shopTab = this.createTabButton('SHOP', 0, () => {
      this.viewMode = 'shop';
      this.refreshUI();
    });
    shopTab.position.set(-60, 0);
    tabContainer.addChild(shopTab);
    
    // Owned tab
    const ownedTab = this.createTabButton('OWNED', 0, () => {
      this.viewMode = 'owned';
      this.refreshUI();
    });
    ownedTab.position.set(60, 0);
    ownedTab.name = 'ownedTab';
    tabContainer.addChild(ownedTab);
    
    this.container.addChild(tabContainer);
  }

  private createTabButton(label: string, x: number, onClick: () => void): Container {
    const btn = new Container();
    btn.position.set(x, 0);
    btn.eventMode = 'static' as EventMode;
    btn.cursor = 'pointer';
    
    const bg = new Graphics();
    bg.roundRect(-50, -15, 100, 30, 5);
    bg.fill({ color: 0x2a2a4e });
    bg.stroke({ width: 1, color: 0x6666ff });
    btn.addChild(bg);
    
    const textStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 14,
      fontWeight: 'bold',
      fill: 0xcccccc,
    });
    const text = new Text({ text: label, style: textStyle });
    text.anchor.set(0.5);
    btn.addChild(text);
    
    btn.on('pointerenter', () => {
      bg.clear();
      bg.roundRect(-50, -15, 100, 30, 5);
      bg.fill({ color: 0x3a3a5e });
      bg.stroke({ width: 2, color: 0xffd700 });
    });
    
    btn.on('pointerleave', () => {
      bg.clear();
      bg.roundRect(-50, -15, 100, 30, 5);
      bg.fill({ color: 0x2a2a4e });
      bg.stroke({ width: 1, color: 0x6666ff });
    });
    
    btn.on('pointerup', () => {
      onClick();
    });
    
    return btn;
  }

  private createEquipmentListPanel(): void {
    const panel = new Container();
    panel.position.set(200, 200);
    
    // Background
    const bg = new Graphics();
    bg.roundRect(-150, -80, 300, 400, 10);
    bg.fill({ color: 0x1a1a3e });
    bg.stroke({ width: 2, color: 0x4444ff });
    panel.addChild(bg);
    
    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0xffd700,
      stroke: { color: 0x000000, width: 1 },
    });
    const title = new Text({ text: 'AVAILABLE', style: titleStyle });
    title.anchor.set(0.5, 0);
    title.position.set(0, -70);
    panel.addChild(title);
    
    // List container
    const listContainer = new Container();
    listContainer.position.set(0, -40);
    listContainer.name = 'equipmentList';
    panel.addChild(listContainer);
    
    this.equipmentListPanel = panel;
    this.container.addChild(panel);
  }

  private createOwnedPanel(): void {
    const panel = new Container();
    panel.position.set(824, 350);
    panel.visible = false;
    
    // Background
    const bg = new Graphics();
    bg.roundRect(-150, -150, 300, 320, 10);
    bg.fill({ color: 0x1a1a3e });
    bg.stroke({ width: 2, color: 0x00ff88 });
    panel.addChild(bg);
    
    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0x00ff88,
      stroke: { color: 0x000000, width: 1 },
    });
    const title = new Text({ text: 'OWNED EQUIPMENT', style: titleStyle });
    title.anchor.set(0.5, 0);
    title.position.set(0, -140);
    panel.addChild(title);
    
    // List container
    const listContainer = new Container();
    listContainer.position.set(0, -110);
    listContainer.name = 'ownedList';
    panel.addChild(listContainer);
    
    this.ownedPanel = panel;
    this.container.addChild(panel);
  }

  private createDetailPanel(): void {
    const panel = new Container();
    panel.position.set(512, 550);
    panel.visible = false;
    
    // Background
    const bg = new Graphics();
    bg.roundRect(-250, -80, 500, 180, 10);
    bg.fill({ color: 0x2a2a5e });
    bg.stroke({ width: 2, color: 0xffd700 });
    panel.addChild(bg);
    
    // Equipment name
    const nameStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0xffd700,
      stroke: { color: 0x000000, width: 1 },
    });
    const nameText = new Text({ text: '', style: nameStyle });
    nameText.anchor.set(0.5, 0);
    nameText.position.set(0, -70);
    nameText.name = 'equipName';
    panel.addChild(nameText);
    
    // Details
    const detailStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0xcccccc,
    });
    const detailText = new Text({ text: '', style: detailStyle });
    detailText.anchor.set(0.5, 0);
    detailText.position.set(0, -40);
    detailText.name = 'equipDetails';
    panel.addChild(detailText);
    
    // Stats
    const statsStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 11,
      fill: 0x88ff88,
    });
    const statsText = new Text({ text: '', style: statsStyle });
    statsText.anchor.set(0.5, 0);
    statsText.position.set(0, -10);
    statsText.name = 'equipStats';
    panel.addChild(statsText);
    
    // Action buttons
    const actionsContainer = new Container();
    actionsContainer.position.set(0, 30);
    actionsContainer.name = 'actions';
    panel.addChild(actionsContainer);
    
    this.detailPanel = panel;
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
    
    // Update info panel with player's equipment points
    if (this.infoPanel) {
      let infoText = this.infoPanel.getChildByName('infoText') as Text;
      if (!infoText) {
        const style = new TextStyle({
          fontFamily: 'Arial',
          fontSize: 14,
          fill: 0x00ff88,
        });
        infoText = new Text({ text: '', style });
        infoText.anchor.set(0.5);
        infoText.position.set(0, 35);
        infoText.name = 'infoText';
        this.infoPanel.addChild(infoText);
      }
      
      const character = this.playerData!.character;
      infoText.text = `Equipment Points: ${character.equipmentPoints} | Gold: ${this.playerData!.gold}`;
    }
    
    // Toggle panels based on view mode
    if (this.equipmentListPanel) {
      this.equipmentListPanel.visible = this.viewMode === 'shop';
    }
    if (this.ownedPanel) {
      this.ownedPanel.visible = this.viewMode === 'owned';
    }
    
    // Refresh lists
    if (this.viewMode === 'shop') {
      this.refreshEquipmentList();
    } else {
      this.refreshOwnedList();
    }
    
    // Refresh detail panel if something is selected
    if (this.selectedEquipmentId && this.detailPanel) {
      this.detailPanel.visible = true;
      this.refreshDetailPanel();
    } else if (this.detailPanel) {
      this.detailPanel.visible = false;
    }
  }

  private refreshEquipmentList(): void {
    if (!this.equipmentListPanel || !this.playerData) return;
    
    const listContainer = this.equipmentListPanel.getChildByName('equipmentList') as Container;
    if (!listContainer) return;
    
    listContainer.removeChildren();
    
    // Filter equipment based on character level
    const character = this.playerData!.character;
    const availableEquipment = EQUIPMENT_DATABASE.filter(eq => {
      const meetsLevel = !eq.requirements.minLevel || character.level >= eq.requirements.minLevel;
      const meetsClass = !eq.requirements.classIds || eq.requirements.classIds.includes(character.class);
      return meetsLevel && meetsClass;
    });
    
    if (availableEquipment.length === 0) {
      const emptyText = new Text({
        text: 'No equipment available\nfor your level/class',
        style: new TextStyle({
          fontFamily: 'Arial',
          fontSize: 14,
          fill: 0x888888,
          align: 'center',
        }),
      });
      emptyText.anchor.set(0.5);
      listContainer.addChild(emptyText);
      return;
    }
    
    availableEquipment.forEach((eq, index) => {
      const itemBtn = this.createEquipmentButton(eq);
      itemBtn.position.set(0, index * 50);
      listContainer.addChild(itemBtn);
    });
  }

  private createEquipmentButton(equipment: Equipment): Container {
    const btn = new Container();
    btn.eventMode = 'static' as EventMode;
    btn.cursor = 'pointer';
    
    const bgColor = this.getTierColor(equipment.tier);
    
    // Background
    const bg = new Graphics();
    bg.roundRect(-140, -20, 280, 40, 5);
    bg.fill({ color: 0x2a2a4e });
    bg.stroke({ width: 2, color: bgColor });
    btn.addChild(bg);
    
    // Name
    const nameStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 13,
      fill: bgColor,
      fontWeight: 'bold',
    });
    const nameText = new Text({ text: equipment.name, style: nameStyle });
    nameText.anchor.set(0, 0.5);
    nameText.position.set(-130, 0);
    btn.addChild(nameText);
    
    // Cost
    const costStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 11,
      fill: 0xffd700,
    });
    const costText = new Text({ text: `${equipment.baseCost} EP`, style: costStyle });
    costText.anchor.set(1, 0.5);
    costText.position.set(130, 0);
    btn.addChild(costText);
    
    // Hover effect
    btn.on('pointerenter', () => {
      bg.clear();
      bg.roundRect(-140, -20, 280, 40, 5);
      bg.fill({ color: 0x3a3a5e });
      bg.stroke({ width: 3, color: bgColor });
    });
    
    btn.on('pointerleave', () => {
      bg.clear();
      bg.roundRect(-140, -20, 280, 40, 5);
      bg.fill({ color: 0x2a2a4e });
      bg.stroke({ width: 2, color: bgColor });
    });
    
    btn.on('pointerup', () => {
      this.selectEquipment(equipment.id);
    });
    
    return btn;
  }

  private refreshOwnedList(): void {
    if (!this.ownedPanel || !this.playerData) return;
    
    const listContainer = this.ownedPanel.getChildByName('ownedList') as Container;
    if (!listContainer) return;
    
    listContainer.removeChildren();
    
    // Get owned equipment from player data
    // Note: This assumes playerData has an equipment array - may need adjustment
    const ownedEquipment: OwnedEquipment[] = [];
    
    if (ownedEquipment.length === 0) {
      const emptyText = new Text({
        text: 'No equipment owned\nVisit the shop to buy!',
        style: new TextStyle({
          fontFamily: 'Arial',
          fontSize: 14,
          fill: 0x888888,
          align: 'center',
        }),
      });
      emptyText.anchor.set(0.5);
      listContainer.addChild(emptyText);
      return;
    }
    
    ownedEquipment.forEach((owned, index) => {
      const equipment = EQUIPMENT_DATABASE.find(eq => eq.id === owned.equipmentId);
      if (!equipment) return;
      
      const itemBtn = this.createOwnedEquipmentButton(equipment, owned);
      itemBtn.position.set(0, index * 50);
      listContainer.addChild(itemBtn);
    });
  }

  private createOwnedEquipmentButton(equipment: Equipment, owned: OwnedEquipment): Container {
    const btn = new Container();
    btn.eventMode = 'static' as EventMode;
    btn.cursor = 'pointer';
    
    const bgColor = this.getTierColor(equipment.tier);
    
    // Background
    const bg = new Graphics();
    bg.roundRect(-140, -20, 280, 40, 5);
    bg.fill({ color: 0x2a2a4e });
    bg.stroke({ width: 2, color: bgColor });
    btn.addChild(bg);
    
    // Name + Level
    const nameStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 13,
      fill: bgColor,
      fontWeight: 'bold',
    });
    const nameText = new Text({ 
      text: `${equipment.name} (+${owned.upgradeLevel})`, 
      style: nameStyle 
    });
    nameText.anchor.set(0, 0.5);
    nameText.position.set(-130, 0);
    btn.addChild(nameText);
    
    // Hover effect
    btn.on('pointerenter', () => {
      bg.clear();
      bg.roundRect(-140, -20, 280, 40, 5);
      bg.fill({ color: 0x3a3a5e });
      bg.stroke({ width: 3, color: bgColor });
    });
    
    btn.on('pointerleave', () => {
      bg.clear();
      bg.roundRect(-140, -20, 280, 40, 5);
      bg.fill({ color: 0x2a2a4e });
      bg.stroke({ width: 2, color: bgColor });
    });
    
    btn.on('pointerup', () => {
      this.selectEquipment(equipment.id, owned);
    });
    
    return btn;
  }

  private selectEquipment(equipmentId: string, owned?: OwnedEquipment): void {
    this.selectedEquipmentId = equipmentId;
    
    if (this.detailPanel) {
      this.detailPanel.visible = true;
      this.refreshDetailPanel(owned);
    }
  }

  private refreshDetailPanel(owned?: OwnedEquipment): void {
    if (!this.detailPanel || !this.selectedEquipmentId || !this.playerData) return;
    
    const equipment = EQUIPMENT_DATABASE.find(eq => eq.id === this.selectedEquipmentId);
    if (!equipment) return;
    
    const character = this.playerData!.character;
    
    const nameText = this.detailPanel.getChildByName('equipName') as Text;
    const detailText = this.detailPanel.getChildByName('equipDetails') as Text;
    const statsText = this.detailPanel.getChildByName('equipStats') as Text;
    const actionsContainer = this.detailPanel.getChildByName('actions') as Container;
    
    nameText.text = equipment.name;
    
    // Details
    const detailLines: string[] = [];
    detailLines.push(`${equipment.slot.toUpperCase()} - ${equipment.tier.toUpperCase()}`);
    detailLines.push(equipment.description);
    if (equipment.requirements.minLevel) {
      detailLines.push(`Requires: Level ${equipment.requirements.minLevel}`);
    }
    if (owned) {
      detailLines.push(`Upgrade Level: +${owned.upgradeLevel}`);
    }
    detailText.text = detailLines.join('\n');
    
    // Stats at current level
    const currentStats = owned 
      ? this.calculateStatsAtLevel(equipment, owned.upgradeLevel)
      : equipment.stats;
    
    const statLines: string[] = [];
    if (currentStats.attack) statLines.push(`Attack: ${currentStats.attack}`);
    if (currentStats.defense) statLines.push(`Defense: ${currentStats.defense}`);
    if (currentStats.hp) statLines.push(`HP: ${currentStats.hp}`);
    if (currentStats.speed) statLines.push(`Speed: ${currentStats.speed}`);
    if (currentStats.critChance) statLines.push(`Crit Chance: ${currentStats.critChance}%`);
    if (currentStats.critDamage) statLines.push(`Crit Damage: ${currentStats.critDamage}%`);
    if (currentStats.lifesteal) statLines.push(`Lifesteal: ${currentStats.lifesteal}%`);
    if (currentStats.cooldownReduction) statLines.push(`CDR: ${currentStats.cooldownReduction}%`);
    statsText.text = statLines.join('\n');
    
    // Action buttons
    actionsContainer.removeChildren();
    
    if (owned) {
      // Upgrade button
      const upgradeCost = calculateEquipmentCost(equipment.baseCost, owned.upgradeLevel);
      const canUpgrade = character.equipmentPoints >= upgradeCost;
      
      const upgradeBtn = this.createActionButton(
        `UPGRADE (+${owned.upgradeLevel + 1}) - ${upgradeCost} EP`,
        canUpgrade ? 0x44aa44 : 0x666666,
        () => {
          if (canUpgrade) {
            this.upgradeEquipment(equipment, owned!);
          }
        }
      );
      actionsContainer.addChild(upgradeBtn);
      
      // Equip button (if not already equipped)
      const equipBtn = this.createActionButton('EQUIP', 0x4488ff, () => {
        this.equipEquipment(equipment, owned!);
      });
      equipBtn.position.set(150, 0);
      actionsContainer.addChild(equipBtn);
    } else {
      // Buy button
      const canBuy = character.equipmentPoints >= equipment.baseCost;
      
      const buyBtn = this.createActionButton(
        `BUY - ${equipment.baseCost} EP`,
        canBuy ? 0x44aa44 : 0x666666,
        () => {
          if (canBuy) {
            this.buyEquipment(equipment);
          }
        }
      );
      actionsContainer.addChild(buyBtn);
    }
  }

  private calculateStatsAtLevel(equipment: Equipment, level: number): any {
    const tierMult = TIER_MULTIPLIERS[equipment.tier];
    const levelMult = 1 + (level * 0.2);
    const totalMult = tierMult * levelMult;
    
    const result: any = {};
    if (equipment.stats.attack) result.attack = Math.floor(equipment.stats.attack * totalMult);
    if (equipment.stats.defense) result.defense = Math.floor(equipment.stats.defense * totalMult);
    if (equipment.stats.hp) result.hp = Math.floor(equipment.stats.hp * totalMult);
    if (equipment.stats.speed) result.speed = Math.floor(equipment.stats.speed * totalMult);
    if (equipment.stats.critChance) result.critChance = Math.min(equipment.stats.critChance * levelMult, 50);
    if (equipment.stats.critDamage) result.critDamage = Math.floor(equipment.stats.critDamage * levelMult);
    if (equipment.stats.lifesteal) result.lifesteal = Math.min(equipment.stats.lifesteal * levelMult, 30);
    if (equipment.stats.cooldownReduction) result.cooldownReduction = Math.min(equipment.stats.cooldownReduction * levelMult, 50);
    
    return result;
  }

  private createActionButton(label: string, color: number, onClick: () => void): Container {
    const btn = new Container();
    btn.eventMode = 'static' as EventMode;
    btn.cursor = 'pointer';
    
    const bg = new Graphics();
    bg.roundRect(-100, -15, 200, 30, 5);
    bg.fill({ color });
    bg.stroke({ width: 2, color: 0xffffff });
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
    
    btn.on('pointerup', () => {
      onClick();
    });
    
    return btn;
  }

  private buyEquipment(equipment: Equipment): void {
    if (!this.playerData) return;
    
    const character = this.playerData!.character;
    if (character.equipmentPoints < equipment.baseCost) {
      alert('Not enough Equipment Points!');
      return;
    }
    
    // Deduct equipment points
    character.equipmentPoints -= equipment.baseCost;
    
    // Add owned equipment
    const ownedEquipment: OwnedEquipment = {
      equipmentId: equipment.id,
      upgradeLevel: 0,
      equipmentPointsSpent: equipment.baseCost,
      acquiredAt: Date.now(),
    };
    
    // Store in player data (simplified - would need proper storage structure)
    console.log('Bought equipment:', ownedEquipment);
    alert(`Purchased ${equipment.name}!`);
    
    this.refreshUI();
  }

  private upgradeEquipment(equipment: Equipment, owned: OwnedEquipment): void {
    if (!this.playerData) return;
    
    const character = this.playerData!.character;
    const upgradeCost = calculateEquipmentCost(equipment.baseCost, owned.upgradeLevel);
    
    if (character.equipmentPoints < upgradeCost) {
      alert('Not enough Equipment Points!');
      return;
    }
    
    // Deduct equipment points
    character.equipmentPoints -= upgradeCost;
    
    // Increase upgrade level
    owned.upgradeLevel++;
    owned.equipmentPointsSpent += upgradeCost;
    
    console.log(`Upgraded ${equipment.name} to +${owned.upgradeLevel}`);
    alert(`${equipment.name} upgraded to +${owned.upgradeLevel}!`);
    
    this.refreshUI();
  }

  private equipEquipment(equipment: Equipment, owned: OwnedEquipment): void {
    // Implementation for equipping
    console.log(`Equipped ${equipment.name}`);
    alert(`${equipment.name} equipped!`);
  }

  private getTierColor(tier: EquipmentTier): number {
    switch (tier) {
      case 'common': return 0xcccccc;
      case 'uncommon': return 0x00ff00;
      case 'rare': return 0x0088ff;
      case 'epic': return 0xaa00ff;
      case 'legendary': return 0xffaa00;
      default: return 0xffffff;
    }
  }
}
