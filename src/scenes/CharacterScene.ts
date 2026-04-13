// Character Scene - Full management interface for player identity, stats, skills, inventory, and equipment

import { Container, Graphics, Text, TextStyle, EventMode } from 'pixi.js';
import { SceneManager, IScene } from './SceneManager';
import { loadPlayerData, PlayerData, savePlayerData } from '../systems/PlayerDataManager';
import { 
  Inventory, 
  EquippedItems, 
  Item, 
  calculateDerivedStats, 
  equipItem, 
  unequipItem,
  getStatChangePreview,
  ItemRarity,
  ItemType
} from '../../shared/types/inventory';
import { Ability } from '../../shared/types/ability';
import { CLASSES } from '../../engine/core/GameEngine';

// Rarity colors
const RARITY_COLORS: Record<ItemRarity, number> = {
  common: 0x888888,
  rare: 0x4488ff,
  epic: 0xaa44ff,
  legendary: 0xffaa00,
};

const RARITY_LABELS: Record<ItemRarity, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

type TabType = 'overview' | 'stats' | 'skills' | 'equipment' | 'inventory' | 'forge';

export class CharacterScene implements IScene {
  container: Container;
  private sceneManager: SceneManager;
  private playerData: PlayerData;
  
  // Panel containers
  private leftPanel: Container;
  private centerPanel: Container;
  private rightPanel: Container;
  
  // Tab system
  private activeTab: TabType = 'overview';
  private tabButtons: Map<TabType, Container> = new Map();
  private tabContents: Map<TabType, Container> = new Map();
  
  // Right panel displays
  private liveStatsText: Text | null = null;
  private itemPreviewText: Text | null = null;
  
  // Forge state
  private forgeSlotA: Item | null = null;
  private forgeSlotB: Item | null = null;
  
  // Inventory filter state
  private inventoryFilterType: ItemType | 'all' = 'all';
  private inventoryFilterRarity: ItemRarity | 'all' = 'all';

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.container = new Container();
    this.playerData = loadPlayerData();
    
    this.leftPanel = new Container();
    this.centerPanel = new Container();
    this.rightPanel = new Container();
  }

  onEnter(): void {
    // Reload player data to get latest
    this.playerData = loadPlayerData();
    
    this.createBackground();
    this.createLeftPanel();
    this.createCenterPanel();
    this.createRightPanel();
    this.showTab('overview');
  }

  onExit(): void {
    // Save any changes
    savePlayerData(this.playerData);
  }

  private createBackground(): void {
    const bg = new Graphics();
    bg.rect(0, 0, 1024, 768);
    bg.fill({ color: 0x0a0a1a });
    this.container.addChild(bg);
    
    // Grid pattern
    for (let i = 0; i < 1024; i += 40) {
      bg.moveTo(i, 0);
      bg.lineTo(i, 768);
      bg.stroke({ width: 1, color: 0x1a1a3e, alpha: 0.3 });
    }
    for (let i = 0; i < 768; i += 40) {
      bg.moveTo(0, i);
      bg.lineTo(1024, i);
      bg.stroke({ width: 1, color: 0x1a1a3e, alpha: 0.3 });
    }
  }

  private createLeftPanel(): void {
    this.leftPanel.position.set(0, 0);
    
    // Panel background
    const bg = new Graphics();
    bg.rect(0, 0, 250, 768);
    bg.fill({ color: 0x12122a });
    bg.stroke({ width: 2, color: 0x3a3a6e });
    this.leftPanel.addChild(bg);
    
    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 24,
      fontWeight: 'bold',
      fill: 0xffffff,
      stroke: { color: 0x4444ff, width: 2 },
    });
    const title = new Text({ text: 'CHARACTER', style: titleStyle });
    title.anchor.set(0.5, 0);
    title.position.set(125, 20);
    this.leftPanel.addChild(title);
    
    // Separator
    const sep = new Graphics();
    sep.moveTo(20, 60);
    sep.lineTo(230, 60);
    sep.stroke({ width: 2, color: 0x3a3a6e });
    this.leftPanel.addChild(sep);
    
    // Character portrait placeholder
    const portraitBg = new Graphics();
    portraitBg.roundRect(50, 80, 150, 150, 10);
    portraitBg.fill({ color: 0x1a1a3e });
    portraitBg.stroke({ width: 2, color: 0x4444aa });
    this.leftPanel.addChild(portraitBg);
    
    const portraitText = new Text({ 
      text: '[Portrait]', 
      style: new TextStyle({ fontFamily: 'Arial', fontSize: 14, fill: 0x666688 }) 
    });
    portraitText.anchor.set(0.5);
    portraitText.position.set(125, 155);
    this.leftPanel.addChild(portraitText);
    
    // Identity info
    const profile = this.playerData.profile;
    const yPos = 260;
    const lineHeight = 28;
    
    const labelStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: 0x8888aa });
    const valueStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 14, fill: 0xffffff, fontWeight: 'bold' });
    
    let currentY = yPos;
    
    // Name
    const nameLabel = new Text({ text: 'Name:', style: labelStyle });
    nameLabel.position.set(20, currentY);
    this.leftPanel.addChild(nameLabel);
    
    const nameValue = new Text({ 
      text: profile?.name || 'Unknown', 
      style: valueStyle 
    });
    nameValue.position.set(20, currentY + 14);
    this.leftPanel.addChild(nameValue);
    
    currentY += lineHeight * 2;
    
    // Class
    const classLabel = new Text({ text: 'Class:', style: labelStyle });
    classLabel.position.set(20, currentY);
    this.leftPanel.addChild(classLabel);
    
    const classValue = new Text({ 
      text: profile?.class || 'None', 
      style: valueStyle 
    });
    classValue.position.set(20, currentY + 14);
    this.leftPanel.addChild(classValue);
    
    currentY += lineHeight;
    
    // Race
    const raceLabel = new Text({ text: 'Race:', style: labelStyle });
    raceLabel.position.set(20, currentY);
    this.leftPanel.addChild(raceLabel);
    
    const raceValue = new Text({ 
      text: profile?.race || 'None', 
      style: valueStyle 
    });
    raceValue.position.set(20, currentY + 14);
    this.leftPanel.addChild(raceValue);
    
    currentY += lineHeight;
    
    // Background
    const bgLabel = new Text({ text: 'Background:', style: labelStyle });
    bgLabel.position.set(20, currentY);
    this.leftPanel.addChild(bgLabel);
    
    const bgValue = new Text({ 
      text: profile?.background || 'None', 
      style: valueStyle 
    });
    bgValue.position.set(20, currentY + 14);
    this.leftPanel.addChild(bgValue);
    
    currentY += lineHeight * 1.5;
    
    // Talents
    const talentsLabel = new Text({ text: 'Talents:', style: labelStyle });
    talentsLabel.position.set(20, currentY);
    this.leftPanel.addChild(talentsLabel);
    
    currentY += 18;
    
    const talents = profile?.talents || [];
    if (talents.length > 0) {
      for (const talent of talents.slice(0, 4)) {
        const talentText = new Text({ 
          text: `• ${talent}`, 
          style: new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: 0xaaccff }) 
        });
        talentText.position.set(25, currentY);
        this.leftPanel.addChild(talentText);
        currentY += 18;
      }
    } else {
      const noTalents = new Text({ 
        text: 'None', 
        style: new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: 0x666688 }) 
      });
      noTalents.position.set(25, currentY);
      this.leftPanel.addChild(noTalents);
      currentY += 18;
    }
    
    currentY += 20;
    
    // Gold
    const goldLabel = new Text({ text: 'Gold:', style: labelStyle });
    goldLabel.position.set(20, currentY);
    this.leftPanel.addChild(goldLabel);
    
    const goldValue = new Text({ 
      text: `${this.playerData.shop.playerGold}`, 
      style: new TextStyle({ fontFamily: 'Arial', fontSize: 16, fill: 0xffd700, fontWeight: 'bold' }) 
    });
    goldValue.position.set(20, currentY + 16);
    this.leftPanel.addChild(goldValue);
    
    this.container.addChild(this.leftPanel);
  }

  private createCenterPanel(): void {
    this.centerPanel.position.set(250, 0);
    
    // Panel background
    const bg = new Graphics();
    bg.rect(0, 0, 524, 768);
    bg.fill({ color: 0x0f0f25 });
    bg.stroke({ width: 2, color: 0x3a3a6e });
    this.centerPanel.addChild(bg);
    
    // Tab navigation
    this.createTabNavigation();
    
    // Tab content containers
    this.createTabContentContainers();
    
    this.container.addChild(this.centerPanel);
  }

  private createTabNavigation(): void {
    const tabs: { id: TabType; label: string }[] = [
      { id: 'overview', label: 'Overview' },
      { id: 'stats', label: 'Stats' },
      { id: 'skills', label: 'Skills' },
      { id: 'equipment', label: 'Equipment' },
      { id: 'inventory', label: 'Inventory' },
      { id: 'forge', label: 'Forge' },
    ];
    
    const tabWidth = 85;
    const tabHeight = 36;
    const startY = 10;
    const startX = 10;
    
    tabs.forEach((tab, index) => {
      const x = startX + index * (tabWidth + 2);
      const btn = this.createTabButton(tab.label, x, startY, tabWidth, tabHeight, () => {
        this.showTab(tab.id);
      });
      
      this.tabButtons.set(tab.id, btn);
      this.centerPanel.addChild(btn);
    });
  }

  private createTabButton(label: string, x: number, y: number, width: number, height: number, onClick: () => void): Container {
    const container = new Container();
    container.position.set(x, y);
    
    const bg = new Graphics();
    bg.roundRect(0, 0, width, height, 6);
    bg.fill({ color: 0x2a2a4e });
    bg.stroke({ width: 1, color: 0x4444aa });
    
    const text = new Text({ 
      text: label, 
      style: new TextStyle({ fontFamily: 'Arial', fontSize: 12, fontWeight: 'bold', fill: 0xffffff }) 
    });
    text.anchor.set(0.5);
    text.position.set(width / 2, height / 2);
    
    container.addChild(bg);
    container.addChild(text);
    (container as any).bg = bg;
    (container as any).text = text;
    
    container.eventMode = 'static' as EventMode;
    container.cursor = 'pointer';
    
    container.on('pointerenter', () => {
      bg.clear();
      bg.roundRect(0, 0, width, height, 6);
      bg.fill({ color: 0x4444aa });
      bg.stroke({ width: 2, color: 0x6666ff });
    });
    
    container.on('pointerleave', () => {
      bg.clear();
      bg.roundRect(0, 0, width, height, 6);
      bg.fill({ color: 0x2a2a4e });
      bg.stroke({ width: 1, color: 0x4444aa });
    });
    
    container.on('pointerup', onClick);
    
    return container;
  }

  private createTabContentContainers(): void {
    const tabTypes: TabType[] = ['overview', 'stats', 'skills', 'equipment', 'inventory', 'forge'];
    
    tabTypes.forEach(tabType => {
      const container = new Container();
      container.position.set(10, 55);
      container.visible = false;
      this.tabContents.set(tabType, container);
      this.centerPanel.addChild(container);
    });
  }

  private showTab(tabType: TabType): void {
    this.activeTab = tabType;
    
    // Hide all tabs
    this.tabContents.forEach((container, type) => {
      container.visible = type === tabType;
    });
    
    // Update button states
    this.tabButtons.forEach((btn, type) => {
      const bg = (btn as any).bg as Graphics;
      const text = (btn as any).text as Text;
      
      if (type === tabType) {
        bg.clear();
        bg.roundRect(0, 0, 85, 36, 6);
        bg.fill({ color: 0x4444aa });
        bg.stroke({ width: 2, color: 0x6666ff });
        text.style.fill = 0xffff00;
      } else {
        bg.clear();
        bg.roundRect(0, 0, 85, 36, 6);
        bg.fill({ color: 0x2a2a4e });
        bg.stroke({ width: 1, color: 0x4444aa });
        text.style.fill = 0xffffff;
      }
    });
    
    // Build tab content
    this.buildTabContent(tabType);
    
    // Update right panel
    this.updateRightPanel();
  }

  private buildTabContent(tabType: TabType): void {
    const container = this.tabContents.get(tabType);
    if (!container) return;
    
    // Clear existing content
    container.removeChildren();
    
    switch (tabType) {
      case 'overview':
        this.buildOverviewTab(container);
        break;
      case 'stats':
        this.buildStatsTab(container);
        break;
      case 'skills':
        this.buildSkillsTab(container);
        break;
      case 'equipment':
        this.buildEquipmentTab(container);
        break;
      case 'inventory':
        this.buildInventoryTab(container);
        break;
      case 'forge':
        this.buildForgeTab(container);
        break;
    }
  }

  private buildOverviewTab(container: Container): void {
    const profile = this.playerData.profile;
    const textStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 14, fill: 0xcccccc, lineHeight: 22 });
    
    const lines: string[] = [];
    
    lines.push('=== CHARACTER SUMMARY ===');
    lines.push('');
    lines.push(`Name: ${profile?.name || 'Unknown'}`);
    lines.push(`Class: ${profile?.class || 'None'}`);
    lines.push(`Race: ${profile?.race || 'None'}`);
    lines.push(`Background: ${profile?.background || 'None'}`);
    lines.push('');
    lines.push('=== BASE STATS ===');
    lines.push(`STR: ${profile?.stats.strength}  AGI: ${profile?.stats.agility}  INT: ${profile?.stats.intelligence}`);
    lines.push(`CHA: ${profile?.stats.charisma}  END: ${profile?.stats.endurance}  PER: ${profile?.stats.perception}  LCK: ${profile?.stats.luck}`);
    lines.push('');
    lines.push('=== TALENTS ===');
    
    if (profile?.talents && profile.talents.length > 0) {
      profile.talents.forEach(talent => {
        lines.push(`• ${talent}`);
      });
    } else {
      lines.push('No talents selected');
    }
    
    lines.push('');
    lines.push('=== CLASS DESCRIPTION ===');
    lines.push(this.getClassDescription(profile?.class || ''));
    
    lines.push('');
    lines.push('=== RACE DESCRIPTION ===');
    lines.push(this.getRaceDescription(profile?.race || ''));
    
    const text = new Text({ text: lines.join('\n'), style: textStyle });
    text.position.set(10, 10);
    container.addChild(text);
  }

  private getClassDescription(className: string): string {
    const descriptions: Record<string, string> = {
      'Warrior': 'Masters of melee combat, warriors excel in close-quarters battle with high strength and endurance.',
      'Mage': 'Wielders of arcane power, mages command devastating magical attacks with high intelligence.',
      'Rogue': 'Swift and cunning, rogues strike from the shadows with high agility and critical chance.',
      'Archer': 'Expert marksmen who rain death from afar with precision and speed.',
      'Cleric': 'Holy healers who support allies and smite undead with divine power.',
      'Paladin': 'Holy warriors combining martial prowess with divine blessings.',
      'Assassin': 'Deadly killers specializing in swift, lethal strikes.',
      'Druid': 'Nature\'s guardians who can shapeshift and command natural forces.',
      'Bard': 'Inspiring performers who buff allies and debuff enemies with music.',
      'Necromancer': 'Dark arts practitioners who raise the dead and drain life.',
    };
    return descriptions[className] || 'A versatile adventurer ready for any challenge.';
  }

  private getRaceDescription(raceName: string): string {
    const descriptions: Record<string, string> = {
      'Humans': 'Versatile and adaptable, humans excel in any role they choose.',
      'Elves': 'Graceful and attuned to nature, elves have superior agility and perception.',
      'Dwarfs': 'Sturdy and resilient, dwarfs have exceptional endurance and defense.',
      'Demons': 'Born of darkness, demons possess innate magical power and strength.',
      'Orc': 'Fierce warriors with incredible strength and battle prowess.',
      'Halfling': 'Small but lucky, halflings have remarkable fortune and agility.',
      'Gnome': 'Inventive and clever, gnomes have high intelligence and perception.',
      'Beastfolk': 'Hybrid creatures with animalistic traits granting unique abilities.',
    };
    return descriptions[raceName] || 'A unique being with untapped potential.';
  }

  private buildStatsTab(container: Container): void {
    const profile = this.playerData.profile;
    if (!profile) return;
    
    // Calculate derived stats
    const baseAtk = Math.floor(profile.stats.strength * 1.5);
    const baseDef = Math.floor(profile.stats.endurance * 1.2);
    const baseSpd = Math.floor(profile.stats.agility * 1.3);
    const baseHp = Math.floor(profile.stats.endurance * 10 + profile.stats.strength * 5);
    
    const derivedStats = calculateDerivedStats(
      baseAtk,
      baseDef,
      baseSpd,
      baseHp,
      0,
      profile.stats.luck,
      this.playerData.inventory.equipped
    );
    
    const labelStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 14, fill: 0x8888aa });
    const valueStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 16, fill: 0xffffff, fontWeight: 'bold' });
    const sectionStyle = new TextStyle({ fontFamily: 'Arial Black', fontSize: 18, fill: 0xffd700 });
    
    let yPos = 10;
    
    // Base Stats Section
    const baseTitle = new Text({ text: 'BASE STATS', style: sectionStyle });
    baseTitle.position.set(10, yPos);
    container.addChild(baseTitle);
    yPos += 30;
    
    const stats = [
      { key: 'Strength', value: profile.stats.strength },
      { key: 'Agility', value: profile.stats.agility },
      { key: 'Intelligence', value: profile.stats.intelligence },
      { key: 'Charisma', value: profile.stats.charisma },
      { key: 'Endurance', value: profile.stats.endurance },
      { key: 'Perception', value: profile.stats.perception },
      { key: 'Luck', value: profile.stats.luck },
    ];
    
    stats.forEach(stat => {
      const label = new Text({ text: stat.key, style: labelStyle });
      label.position.set(20, yPos);
      container.addChild(label);
      
      const value = new Text({ text: String(stat.value), style: valueStyle });
      value.position.set(150, yPos);
      container.addChild(value);
      
      yPos += 24;
    });
    
    yPos += 15;
    
    // Derived Stats Section
    const derivedTitle = new Text({ text: 'DERIVED STATS', style: sectionStyle });
    derivedTitle.position.set(10, yPos);
    container.addChild(derivedTitle);
    yPos += 30;
    
    const derived = [
      { key: 'HP', value: Math.floor(derivedStats.hp) },
      { key: 'Attack', value: Math.floor(derivedStats.atk) },
      { key: 'Defense', value: Math.floor(derivedStats.def) },
      { key: 'Speed', value: Math.floor(derivedStats.spd) },
      { key: 'Crit Chance', value: `${derivedStats.critChance.toFixed(1)}%` },
      { key: 'Luck Bonus', value: Math.floor(derivedStats.luck) },
    ];
    
    derived.forEach(stat => {
      const label = new Text({ text: stat.key, style: labelStyle });
      label.position.set(20, yPos);
      container.addChild(label);
      
      const value = new Text({ text: String(stat.value), style: valueStyle });
      value.position.set(150, yPos);
      container.addChild(value);
      
      yPos += 24;
    });
    
    yPos += 20;
    
    // Stat Breakdown Section
    const breakdownTitle = new Text({ text: 'STAT BREAKDOWN', style: sectionStyle });
    breakdownTitle.position.set(10, yPos);
    container.addChild(breakdownTitle);
    yPos += 25;
    
    const breakdownStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: 0xaaccff });
    
    // Calculate bonuses
    const weaponBonus = this.playerData.inventory.equipped.weapon ? '+装备' : '';
    const armorBonus = this.playerData.inventory.equipped.armor ? '+装备' : '';
    const accBonus = this.playerData.inventory.equipped.accessory ? '+装备' : '';
    
    const breakdownLines = [
      `Class Bonus: Applied`,
      `Race Bonus: Applied`,
      `Equipment Bonus: ${weaponBonus} ${armorBonus} ${accBonus}`.trim(),
      `Talent Bonus: Variable`,
    ];
    
    breakdownLines.forEach((line, i) => {
      const text = new Text({ text: line, style: breakdownStyle });
      text.position.set(20, yPos + i * 20);
      container.addChild(text);
    });
  }

  private buildSkillsTab(container: Container): void {
    const profile = this.playerData.profile;
    const className = profile?.class || '';
    
    const titleStyle = new TextStyle({ fontFamily: 'Arial Black', fontSize: 16, fill: 0xffd700 });
    const skillStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: 0xcccccc, lineHeight: 18 });
    
    const title = new Text({ text: `=== ${className.toUpperCase()} SKILLS ===`, style: titleStyle });
    title.position.set(10, 10);
    container.addChild(title);
    
    // Get class abilities from engine
    const classDef = CLASSES[className];
    let yPos = 40;
    
    if (classDef && classDef.abilities && classDef.abilities.length > 0) {
      classDef.abilities.forEach((ability, index) => {
        const skillBox = this.createSkillBox(ability, 10, yPos);
        container.addChild(skillBox);
        yPos += 90;
      });
    } else {
      // Default skills for classes not defined in engine
      const defaultSkills = this.getDefaultSkillsForClass(className);
      defaultSkills.forEach((ability, index) => {
        const skillBox = this.createSkillBox(ability, 10, yPos);
        container.addChild(skillBox);
        yPos += 90;
      });
    }
  }

  private getDefaultSkillsForClass(className: string): Ability[] {
    const skills: Ability[] = [
      {
        id: 'basic_attack',
        name: 'Basic Attack',
        description: 'A standard attack dealing moderate damage.',
        type: 'attack',
        cost: 5,
        cooldown: 0,
        target: 'enemy',
        effects: [{ type: 'damage', value: 10 }],
      },
      {
        id: 'power_strike',
        name: 'Power Strike',
        description: 'A powerful attack that deals extra damage.',
        type: 'attack',
        cost: 15,
        cooldown: 2,
        target: 'enemy',
        effects: [{ type: 'damage', value: 25 }],
      },
      {
        id: 'defensive_stance',
        name: 'Defensive Stance',
        description: 'Increase defense for several turns.',
        type: 'defense',
        cost: 10,
        cooldown: 3,
        target: 'self',
        effects: [{ type: 'stat_mod', stat: 'def', modifier: 5, duration: 3 }],
      },
      {
        id: 'heal',
        name: 'Heal',
        description: 'Restore health over time.',
        type: 'heal',
        cost: 20,
        cooldown: 4,
        target: 'self',
        effects: [{ type: 'heal', value: 30 }],
      },
      {
        id: 'quick_strike',
        name: 'Quick Strike',
        description: 'A fast attack with reduced damage.',
        type: 'attack',
        cost: 8,
        cooldown: 1,
        target: 'enemy',
        effects: [{ type: 'damage', value: 15 }],
      },
    ];
    
    return skills;
  }

  private createSkillBox(ability: Ability, x: number, y: number): Container {
    const container = new Container();
    container.position.set(x, y);
    
    const bg = new Graphics();
    bg.roundRect(0, 0, 490, 80, 8);
    bg.fill({ color: 0x1a1a3e });
    bg.stroke({ width: 1, color: 0x4444aa });
    
    const nameStyle = new TextStyle({ fontFamily: 'Arial Black', fontSize: 14, fill: 0xffd700 });
    const descStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 11, fill: 0xaaccff });
    const metaStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 10, fill: 0x8888aa });
    
    const nameText = new Text({ text: ability.name, style: nameStyle });
    nameText.position.set(10, 8);
    
    const descText = new Text({ 
      text: ability.description, 
      style: descStyle
    });
    descText.position.set(10, 28);
    descText.width = 280;
    
    const costText = new Text({ text: `Cost: ${ability.cost} STA`, style: metaStyle });
    costText.position.set(300, 10);
    
    const cdText = new Text({ text: `Cooldown: ${ability.cooldown} turns`, style: metaStyle });
    cdText.position.set(300, 28);
    
    const typeText = new Text({ text: `Type: ${ability.type.toUpperCase()}`, style: metaStyle });
    typeText.position.set(300, 46);
    
    const targetText = new Text({ text: `Target: ${ability.target}`, style: metaStyle });
    targetText.position.set(300, 62);
    
    container.addChild(bg);
    container.addChild(nameText);
    container.addChild(descText);
    container.addChild(costText);
    container.addChild(cdText);
    container.addChild(typeText);
    container.addChild(targetText);
    
    return container;
  }

  private buildEquipmentTab(container: Container): void {
    const equipped = this.playerData.inventory.equipped;
    
    const slots: { key: keyof EquippedItems; label: string }[] = [
      { key: 'weapon', label: 'Weapon' },
      { key: 'armor', label: 'Armor' },
      { key: 'accessory', label: 'Accessory' },
    ];
    
    let yPos = 10;
    
    slots.forEach(slot => {
      const item = equipped[slot.key];
      const slotContainer = this.createEquipmentSlot(slot.key, slot.label, item, 10, yPos);
      container.addChild(slotContainer);
      yPos += 150;
    });
    
    // Instructions
    const instructions = new Text({ 
      text: 'Click "Equip" to select from inventory.\nClick "Unequip" to remove item.',
      style: new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: 0x8888aa, fontStyle: 'italic' })
    });
    instructions.position.set(10, yPos + 20);
    container.addChild(instructions);
  }

  private createEquipmentSlot(
    slotKey: keyof EquippedItems, 
    label: string, 
    item: Item | null, 
    x: number, 
    y: number
  ): Container {
    const container = new Container();
    container.position.set(x, y);
    
    const bg = new Graphics();
    bg.roundRect(0, 0, 490, 130, 10);
    bg.fill({ color: 0x1a1a3e });
    bg.stroke({ width: 2, color: item ? RARITY_COLORS[item.rarity] : 0x4444aa });
    
    const labelStyle = new TextStyle({ fontFamily: 'Arial Black', fontSize: 16, fill: 0xffd700 });
    const labelText = new Text({ text: `${label} Slot`, style: labelStyle });
    labelText.position.set(15, 10);
    
    if (item) {
      const nameStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 14, fill: 0xffffff, fontWeight: 'bold' });
      const nameText = new Text({ text: item.name, style: nameStyle });
      nameText.position.set(15, 35);
      
      const rarityStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: RARITY_COLORS[item.rarity] });
      const rarityText = new Text({ text: RARITY_LABELS[item.rarity], style: rarityStyle });
      rarityText.position.set(15, 55);
      
      const modsStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: 0xaaccff });
      const mods: string[] = [];
      if (item.modifiers.atk) mods.push(`ATK +${item.modifiers.atk}`);
      if (item.modifiers.def) mods.push(`DEF +${item.modifiers.def}`);
      if (item.modifiers.spd) mods.push(`SPD ${item.modifiers.spd >= 0 ? '+' : ''}${item.modifiers.spd}`);
      if (item.modifiers.hp) mods.push(`HP +${item.modifiers.hp}`);
      if (item.modifiers.critChance) mods.push(`Crit +${item.modifiers.critChance}%`);
      if (item.modifiers.luck) mods.push(`LCK +${item.modifiers.luck}`);
      
      const modsText = new Text({ text: mods.join('  |  '), style: modsStyle });
      modsText.position.set(15, 75);
      
      const descStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 11, fill: 0x8888aa });
      const descText = new Text({ text: item.description, style: descStyle });
      descText.position.set(15, 95);
      
      container.addChild(nameText);
      container.addChild(rarityText);
      container.addChild(modsText);
      container.addChild(descText);
    } else {
      const emptyText = new Text({ 
        text: 'Empty', 
        style: new TextStyle({ fontFamily: 'Arial', fontSize: 14, fill: 0x666688, fontStyle: 'italic' }) 
      });
      emptyText.position.set(15, 45);
      container.addChild(emptyText);
    }
    
    // Equip button
    const equipBtn = this.createActionButton('Equip', 350, 40, 60, 28, () => {
      this.openInventoryForEquip(slotKey);
    });
    container.addChild(equipBtn);
    
    // Unequip button
    const unequipBtn = this.createActionButton('Unequip', 420, 40, 60, 28, () => {
      this.unequipFromSlot(slotKey);
    }, !item);
    container.addChild(unequipBtn);
    
    container.addChild(bg);
    
    return container;
  }

  private createActionButton(label: string, x: number, y: number, width: number, height: number, onClick: () => void, disabled: boolean = false): Container {
    const container = new Container();
    container.position.set(x, y);
    
    const bgColor = disabled ? 0x3a3a3a : 0x4444aa;
    const strokeColor = disabled ? 0x555555 : 0x6666ff;
    
    const bg = new Graphics();
    bg.roundRect(0, 0, width, height, 5);
    bg.fill({ color: bgColor });
    bg.stroke({ width: 1, color: strokeColor });
    
    const textColor = disabled ? 0x666666 : 0xffffff;
    const text = new Text({ 
      text: label, 
      style: new TextStyle({ fontFamily: 'Arial', fontSize: 12, fontWeight: 'bold', fill: textColor }) 
    });
    text.anchor.set(0.5);
    text.position.set(width / 2, height / 2);
    
    container.addChild(bg);
    container.addChild(text);
    
    if (!disabled) {
      container.eventMode = 'static' as EventMode;
      container.cursor = 'pointer';
      
      container.on('pointerenter', () => {
        bg.clear();
        bg.roundRect(0, 0, width, height, 5);
        bg.fill({ color: 0x6666ff });
        bg.stroke({ width: 2, color: 0x8888ff });
      });
      
      container.on('pointerleave', () => {
        bg.clear();
        bg.roundRect(0, 0, width, height, 5);
        bg.fill({ color: bgColor });
        bg.stroke({ width: 1, color: strokeColor });
      });
      
      container.on('pointerup', onClick);
    }
    
    return container;
  }

  private openInventoryForEquip(slotKey: keyof EquippedItems): void {
    // Switch to inventory tab and set filter
    this.inventoryFilterType = slotKey === 'weapon' ? 'weapon' : slotKey === 'armor' ? 'armor' : 'accessory';
    this.showTab('inventory');
  }

  private unequipFromSlot(slotKey: keyof EquippedItems): void {
    const result = unequipItem(this.playerData.inventory, slotKey);
    if (result.success) {
      savePlayerData(this.playerData);
      this.refreshCurrentTab();
      this.updateRightPanel();
    }
  }

  private buildInventoryTab(container: Container): void {
    // Filter buttons
    this.createInventoryFilters(container);
    
    // Item list
    this.renderInventoryItems(container);
  }

  private createInventoryFilters(container: Container): void {
    const filterY = 5;
    
    // Type filter label
    const typeLabel = new Text({ 
      text: 'Type:', 
      style: new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: 0x8888aa }) 
    });
    typeLabel.position.set(10, filterY);
    container.addChild(typeLabel);
    
    const types: (ItemType | 'all')[] = ['all', 'weapon', 'armor', 'accessory'];
    let xPos = 55;
    
    types.forEach(type => {
      const isActive = this.inventoryFilterType === type;
      const btn = this.createFilterButton(
        type.charAt(0).toUpperCase() + type.slice(1), 
        xPos, 
        filterY, 
        70, 
        24, 
        () => {
          this.inventoryFilterType = type;
          this.refreshCurrentTab();
        },
        isActive
      );
      container.addChild(btn);
      xPos += 75;
    });
    
    // Rarity filter label
    const rarityLabel = new Text({ 
      text: 'Rarity:', 
      style: new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: 0x8888aa }) 
    });
    rarityLabel.position.set(360, filterY);
    container.addChild(rarityLabel);
    
    const rarities: (ItemRarity | 'all')[] = ['all', 'common', 'rare', 'epic', 'legendary'];
    xPos = 420;
    
    rarities.forEach(rarity => {
      const isActive = this.inventoryFilterRarity === rarity;
      const btn = this.createFilterButton(
        rarity.charAt(0).toUpperCase() + rarity.slice(1), 
        xPos, 
        filterY, 
        75, 
        24, 
        () => {
          this.inventoryFilterRarity = rarity;
          this.refreshCurrentTab();
        },
        isActive
      );
      container.addChild(btn);
      xPos += 80;
    });
  }

  private createFilterButton(label: string, x: number, y: number, width: number, height: number, onClick: () => void, isActive: boolean): Container {
    const container = new Container();
    container.position.set(x, y);
    
    const bgColor = isActive ? 0x4444aa : 0x2a2a4e;
    const strokeColor = isActive ? 0x6666ff : 0x4444aa;
    
    const bg = new Graphics();
    bg.roundRect(0, 0, width, height, 4);
    bg.fill({ color: bgColor });
    bg.stroke({ width: 1, color: strokeColor });
    
    const textColor = isActive ? 0xffff00 : 0xffffff;
    const text = new Text({ 
      text: label, 
      style: new TextStyle({ fontFamily: 'Arial', fontSize: 11, fontWeight: 'bold', fill: textColor }) 
    });
    text.anchor.set(0.5);
    text.position.set(width / 2, height / 2);
    
    container.addChild(bg);
    container.addChild(text);
    
    container.eventMode = 'static' as EventMode;
    container.cursor = 'pointer';
    
    container.on('pointerenter', () => {
      bg.clear();
      bg.roundRect(0, 0, width, height, 4);
      bg.fill({ color: isActive ? 0x5555bb : 0x3a3a5e });
      bg.stroke({ width: 2, color: 0x6666ff });
    });
    
    container.on('pointerleave', () => {
      bg.clear();
      bg.roundRect(0, 0, width, height, 4);
      bg.fill({ color: bgColor });
      bg.stroke({ width: 1, color: strokeColor });
    });
    
    container.on('pointerup', onClick);
    
    return container;
  }

  private renderInventoryItems(container: Container): void {
    const items = this.playerData.inventory.items.filter(item => {
      if (this.inventoryFilterType !== 'all' && item.type !== this.inventoryFilterType) return false;
      if (this.inventoryFilterRarity !== 'all' && item.rarity !== this.inventoryFilterRarity) return false;
      return true;
    });
    
    if (items.length === 0) {
      const emptyText = new Text({ 
        text: 'No items in inventory matching filters.',
        style: new TextStyle({ fontFamily: 'Arial', fontSize: 14, fill: 0x666688, fontStyle: 'italic' }) 
      });
      emptyText.position.set(10, 40);
      container.addChild(emptyText);
      return;
    }
    
    let yPos = 40;
    const itemsPerRow = 2;
    const itemWidth = 235;
    const itemHeight = 90;
    const gap = 10;
    
    items.forEach((item, index) => {
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      const x = 10 + col * (itemWidth + gap);
      const y = yPos + row * (itemHeight + gap);
      
      const itemCard = this.createInventoryItemCard(item, x, y, itemWidth, itemHeight);
      container.addChild(itemCard);
    });
  }

  private createInventoryItemCard(item: Item, x: number, y: number, width: number, height: number): Container {
    const container = new Container();
    container.position.set(x, y);
    
    const bg = new Graphics();
    bg.roundRect(0, 0, width, height, 8);
    bg.fill({ color: 0x1a1a3e });
    bg.stroke({ width: 2, color: RARITY_COLORS[item.rarity] });
    
    const nameStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 13, fill: 0xffffff, fontWeight: 'bold' });
    const nameText = new Text({ text: item.name, style: nameStyle });
    nameText.position.set(10, 8);
    
    const rarityStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 11, fill: RARITY_COLORS[item.rarity] });
    const rarityText = new Text({ text: RARITY_LABELS[item.rarity], style: rarityStyle });
    rarityText.position.set(10, 26);
    
    const typeStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 10, fill: 0x8888aa });
    const typeText = new Text({ text: item.type.toUpperCase(), style: typeStyle });
    typeText.position.set(width - 50, 8);
    
    const modsStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 11, fill: 0xaaccff });
    const mods: string[] = [];
    if (item.modifiers.atk) mods.push(`ATK +${item.modifiers.atk}`);
    if (item.modifiers.def) mods.push(`DEF +${item.modifiers.def}`);
    if (item.modifiers.spd) mods.push(`SPD ${item.modifiers.spd >= 0 ? '+' : ''}${item.modifiers.spd}`);
    if (item.modifiers.hp) mods.push(`HP +${item.modifiers.hp}`);
    if (item.modifiers.critChance) mods.push(`Crit +${item.modifiers.critChance}%`);
    if (item.modifiers.luck) mods.push(`LCK +${item.modifiers.luck}`);
    
    const modsText = new Text({ text: mods.join('  '), style: modsStyle });
    modsText.position.set(10, 46);
    
    // Equip button
    const equipBtn = this.createActionButton('Equip', width - 70, height - 32, 60, 24, () => {
      this.equipItemToAppropriateSlot(item);
    });
    
    // Inspect button (shows preview in right panel)
    const inspectBtn = this.createActionButton('Inspect', width - 135, height - 32, 60, 24, () => {
      this.showItemPreview(item);
    });
    
    container.addChild(bg);
    container.addChild(nameText);
    container.addChild(rarityText);
    container.addChild(typeText);
    container.addChild(modsText);
    container.addChild(equipBtn);
    container.addChild(inspectBtn);
    
    return container;
  }

  private equipItemToAppropriateSlot(item: Item): void {
    const slot: 'weapon' | 'armor' | 'accessory' = item.type;
    const result = equipItem(this.playerData.inventory, item.id, slot);
    if (result.success) {
      savePlayerData(this.playerData);
      this.refreshCurrentTab();
      this.updateRightPanel();
    }
  }

  private showItemPreview(item: Item): void {
    // Show item details in right panel
    this.itemPreviewText = this.createItemPreviewText(item);
    this.updateRightPanel();
  }

  private createItemPreviewText(item: Item): Text {
    return new Text({ 
      text: `Preview: ${item.name}\n${item.description}`,
      style: new TextStyle({ fontFamily: 'Arial', fontSize: 11, fill: 0xaaccff })
    });
  }

  private buildForgeTab(container: Container): void {
    const titleStyle = new TextStyle({ fontFamily: 'Arial Black', fontSize: 18, fill: 0xffd700 });
    const title = new Text({ text: 'EQUIPMENT FORGE', style: titleStyle });
    title.position.set(10, 10);
    container.addChild(title);
    
    const descStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: 0x8888aa });
    const desc = new Text({ 
      text: 'Combine two identical items to create a higher tier version.\nBoth items must be the same type and rarity.',
      style: descStyle
    });
    desc.position.set(10, 35);
    container.addChild(desc);
    
    // Forge slots
    const slotY = 80;
    
    const slotAContainer = this.createForgeSlot('Slot A', this.forgeSlotA, 10, slotY, () => {
      this.selectForgeItem('A');
    });
    container.addChild(slotAContainer);
    
    const slotBContainer = this.createForgeSlot('Slot B', this.forgeSlotB, 260, slotY, () => {
      this.selectForgeItem('B');
    });
    container.addChild(slotBContainer);
    
    // Output preview
    const outputContainer = this.createForgeOutput(380, slotY);
    container.addChild(outputContainer);
    
    // Merge button
    const canMerge = this.canMerge();
    const mergeBtn = this.createActionButton('MERGE', 200, 250, 100, 40, () => {
      this.performMerge();
    }, !canMerge);
    container.addChild(mergeBtn);
    
    // Cost display
    const costStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 14, fill: 0xffd700 });
    const costText = new Text({ text: 'Cost: 100 Gold', style: costStyle });
    costText.position.set(200, 300);
    container.addChild(costText);
    
    // Rarity progression info
    const progressionStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 11, fill: 0x8888aa });
    const progression = new Text({ 
      text: 'Progression: Common → Rare → Epic → Legendary',
      style: progressionStyle
    });
    progression.position.set(10, 340);
    container.addChild(progression);
  }

  private createForgeSlot(label: string, item: Item | null, x: number, y: number, onClick: () => void): Container {
    const container = new Container();
    container.position.set(x, y);
    
    const bg = new Graphics();
    bg.roundRect(0, 0, 140, 140, 10);
    bg.fill({ color: item ? 0x1a1a3e : 0x0f0f25 });
    bg.stroke({ width: 2, color: item ? RARITY_COLORS[item.rarity] : 0x4444aa });
    
    const labelStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: 0x8888aa });
    const labelText = new Text({ text: label, style: labelStyle });
    labelText.anchor.set(0.5, 0);
    labelText.position.set(70, 5);
    
    if (item) {
      const nameStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 11, fill: 0xffffff });
      const nameText = new Text({ text: item.name, style: nameStyle });
      nameText.anchor.set(0.5);
      nameText.position.set(70, 50);
      
      const rarityStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 10, fill: RARITY_COLORS[item.rarity] });
      const rarityText = new Text({ text: RARITY_LABELS[item.rarity], style: rarityStyle });
      rarityText.anchor.set(0.5);
      rarityText.position.set(70, 70);
      
      container.addChild(nameText);
      container.addChild(rarityText);
    } else {
      const emptyStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: 0x444466 });
      const emptyText = new Text({ text: 'Click to select', style: emptyStyle });
      emptyText.anchor.set(0.5);
      emptyText.position.set(70, 70);
      container.addChild(emptyText);
    }
    
    container.addChild(bg);
    container.addChild(labelText);
    
    container.eventMode = 'static' as EventMode;
    container.cursor = 'pointer';
    container.on('pointerup', onClick);
    
    return container;
  }

  private createForgeOutput(x: number, y: number): Container {
    const container = new Container();
    container.position.set(x, y);
    
    const bg = new Graphics();
    bg.roundRect(0, 0, 120, 140, 10);
    bg.fill({ color: 0x0f0f25 });
    bg.stroke({ width: 2, color: 0x666666 });
    
    const labelStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: 0x8888aa });
    const labelText = new Text({ text: 'Output', style: labelStyle });
    labelText.anchor.set(0.5, 0);
    labelText.position.set(60, 5);
    
    const preview = this.getForgeOutputPreview();
    
    if (preview) {
      const nameStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 11, fill: 0xffffff });
      const nameText = new Text({ text: preview.name, style: nameStyle });
      nameText.anchor.set(0.5);
      nameText.position.set(60, 50);
      
      const rarityStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 10, fill: RARITY_COLORS[preview.rarity] });
      const rarityText = new Text({ text: RARITY_LABELS[preview.rarity], style: rarityStyle });
      rarityText.anchor.set(0.5);
      rarityText.position.set(60, 70);
      
      container.addChild(nameText);
      container.addChild(rarityText);
    } else {
      const emptyStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: 0x444466 });
      const emptyText = new Text({ text: '?', style: emptyStyle });
      emptyText.anchor.set(0.5);
      emptyText.position.set(60, 70);
      container.addChild(emptyText);
    }
    
    container.addChild(bg);
    container.addChild(labelText);
    
    return container;
  }

  private getForgeOutputPreview(): Item | null {
    if (!this.forgeSlotA || !this.forgeSlotB) return null;
    if (this.forgeSlotA.id !== this.forgeSlotB.id) return null;
    
    const nextRarity = this.getNextRarity(this.forgeSlotA.rarity);
    if (!nextRarity) return null;
    
    return {
      ...this.forgeSlotA,
      rarity: nextRarity,
      name: `${this.forgeSlotA.name}+`,
      modifiers: {
        atk: this.forgeSlotA.modifiers.atk ? Math.floor(this.forgeSlotA.modifiers.atk * 1.5) : undefined,
        def: this.forgeSlotA.modifiers.def ? Math.floor(this.forgeSlotA.modifiers.def * 1.5) : undefined,
        spd: this.forgeSlotA.modifiers.spd ? Math.floor(this.forgeSlotA.modifiers.spd * 1.3) : undefined,
        hp: this.forgeSlotA.modifiers.hp ? Math.floor(this.forgeSlotA.modifiers.hp * 1.5) : undefined,
        critChance: this.forgeSlotA.modifiers.critChance ? Math.floor(this.forgeSlotA.modifiers.critChance * 1.3) : undefined,
        luck: this.forgeSlotA.modifiers.luck ? Math.floor(this.forgeSlotA.modifiers.luck * 1.5) : undefined,
      },
      cost: Math.floor(this.forgeSlotA.cost * 2),
    };
  }

  private getNextRarity(currentRarity: ItemRarity): ItemRarity | null {
    const progression: ItemRarity[] = ['common', 'rare', 'epic', 'legendary'];
    const currentIndex = progression.indexOf(currentRarity);
    if (currentIndex < 0 || currentIndex >= progression.length - 1) return null;
    return progression[currentIndex + 1];
  }

  private selectForgeItem(slot: 'A' | 'B'): void {
    // Open inventory to select item for forge
    // For simplicity, we'll just cycle through eligible items
    const eligibleItems = this.playerData.inventory.items.filter(item => {
      // Must be same type as other slot if filled
      if (slot === 'B' && this.forgeSlotA) {
        return item.type === this.forgeSlotA.type && 
               item.rarity === this.forgeSlotA.rarity && 
               item.id === this.forgeSlotA.id;
      }
      if (slot === 'A' && this.forgeSlotB) {
        return item.type === this.forgeSlotB.type && 
               item.rarity === this.forgeSlotB.rarity && 
               item.id === this.forgeSlotB.id;
      }
      return true;
    });
    
    if (eligibleItems.length === 0) {
      // No eligible items, clear slot
      if (slot === 'A') this.forgeSlotA = null;
      else this.forgeSlotB = null;
    } else {
      // Find next item that's not currently in the other slot
      const currentItem = slot === 'A' ? this.forgeSlotA : this.forgeSlotB;
      const currentIndex = eligibleItems.findIndex(i => i.id === currentItem?.id);
      const nextIndex = (currentIndex + 1) % eligibleItems.length;
      
      if (slot === 'A') {
        this.forgeSlotA = eligibleItems[nextIndex];
      } else {
        this.forgeSlotB = eligibleItems[nextIndex];
      }
    }
    
    this.refreshCurrentTab();
  }

  private canMerge(): boolean {
    if (!this.forgeSlotA || !this.forgeSlotB) return false;
    if (this.forgeSlotA.id !== this.forgeSlotB.id) return false;
    
    const nextRarity = this.getNextRarity(this.forgeSlotA.rarity);
    if (!nextRarity) return false;
    
    if (this.playerData.shop.playerGold < 100) return false;
    
    return true;
  }

  private performMerge(): void {
    if (!this.canMerge()) return;
    if (!this.forgeSlotA || !this.forgeSlotB) return;
    
    // Deduct gold
    this.playerData.shop.playerGold -= 100;
    
    // Remove both items from inventory
    const itemAIndex = this.playerData.inventory.items.findIndex(i => i.id === this.forgeSlotA!.id);
    const itemBIndex = this.playerData.inventory.items.findIndex(i => i.id === this.forgeSlotB!.id);
    
    if (itemAIndex >= 0) this.playerData.inventory.items.splice(itemAIndex, 1);
    if (itemBIndex >= 0 && itemBIndex !== itemAIndex) {
      this.playerData.inventory.items.splice(itemBIndex > itemAIndex ? itemBIndex - 1 : itemBIndex, 1);
    }
    
    // Create upgraded item
    const nextRarity = this.getNextRarity(this.forgeSlotA.rarity);
    if (nextRarity) {
      const upgradedItem: Item = {
        ...this.forgeSlotA,
        id: `${this.forgeSlotA.id}_upgraded_${Date.now()}`,
        rarity: nextRarity,
        name: `${this.forgeSlotA.name}+`,
        modifiers: {
          atk: this.forgeSlotA.modifiers.atk ? Math.floor(this.forgeSlotA.modifiers.atk * 1.5) : undefined,
          def: this.forgeSlotA.modifiers.def ? Math.floor(this.forgeSlotA.modifiers.def * 1.5) : undefined,
          spd: this.forgeSlotA.modifiers.spd ? Math.floor(this.forgeSlotA.modifiers.spd * 1.3) : undefined,
          hp: this.forgeSlotA.modifiers.hp ? Math.floor(this.forgeSlotA.modifiers.hp * 1.5) : undefined,
          critChance: this.forgeSlotA.modifiers.critChance ? Math.floor(this.forgeSlotA.modifiers.critChance * 1.3) : undefined,
          luck: this.forgeSlotA.modifiers.luck ? Math.floor(this.forgeSlotA.modifiers.luck * 1.5) : undefined,
        },
        cost: Math.floor(this.forgeSlotA.cost * 2),
        description: `Upgraded version of ${this.forgeSlotA.name}. Enhanced stats.`,
      };
      
      this.playerData.inventory.items.push(upgradedItem);
    }
    
    // Clear forge slots
    this.forgeSlotA = null;
    this.forgeSlotB = null;
    
    // Save and refresh
    savePlayerData(this.playerData);
    this.refreshCurrentTab();
    this.updateRightPanel();
  }

  private refreshCurrentTab(): void {
    this.buildTabContent(this.activeTab);
  }

  private createRightPanel(): void {
    this.rightPanel.position.set(774, 0);
    
    // Panel background
    const bg = new Graphics();
    bg.rect(0, 0, 250, 768);
    bg.fill({ color: 0x12122a });
    bg.stroke({ width: 2, color: 0x3a3a6e });
    this.rightPanel.addChild(bg);
    
    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 20,
      fontWeight: 'bold',
      fill: 0xffffff,
      stroke: { color: 0x4444ff, width: 2 },
    });
    const title = new Text({ text: 'LIVE STATS', style: titleStyle });
    title.anchor.set(0.5, 0);
    title.position.set(125, 20);
    this.rightPanel.addChild(title);
    
    // Separator
    const sep = new Graphics();
    sep.moveTo(20, 55);
    sep.lineTo(230, 55);
    sep.stroke({ width: 2, color: 0x3a3a6e });
    this.rightPanel.addChild(sep);
    
    // Live stats container
    const statsContainer = new Container();
    statsContainer.position.set(20, 70);
    this.rightPanel.addChild(statsContainer);
    
    this.liveStatsText = this.createLiveStatsText();
    statsContainer.addChild(this.liveStatsText);
    
    // Item preview container
    const previewContainer = new Container();
    previewContainer.position.set(20, 300);
    this.rightPanel.addChild(previewContainer);
    
    const previewTitle = new Text({ 
      text: 'ITEM PREVIEW', 
      style: new TextStyle({ fontFamily: 'Arial Black', fontSize: 14, fill: 0xffd700 }) 
    });
    previewContainer.addChild(previewTitle);
    
    this.itemPreviewText = new Text({ 
      text: 'Select an item to see details',
      style: new TextStyle({ fontFamily: 'Arial', fontSize: 11, fill: 0x8888aa }) 
    });
    this.itemPreviewText.position.set(0, 25);
    previewContainer.addChild(this.itemPreviewText);
    
    this.container.addChild(this.rightPanel);
  }

  private createLiveStatsText(): Text {
    const profile = this.playerData.profile;
    const baseAtk = profile ? Math.floor(profile.stats.strength * 1.5) : 0;
    const baseDef = profile ? Math.floor(profile.stats.endurance * 1.2) : 0;
    const baseSpd = profile ? Math.floor(profile.stats.agility * 1.3) : 0;
    const baseHp = profile ? Math.floor(profile.stats.endurance * 10 + profile.stats.strength * 5) : 0;
    
    const derivedStats = calculateDerivedStats(
      baseAtk,
      baseDef,
      baseSpd,
      baseHp,
      0,
      profile?.stats.luck || 0,
      this.playerData.inventory.equipped
    );
    
    const lines: string[] = [
      `HP: ${Math.floor(derivedStats.hp)}`,
      `Attack: ${Math.floor(derivedStats.atk)}`,
      `Defense: ${Math.floor(derivedStats.def)}`,
      `Speed: ${Math.floor(derivedStats.spd)}`,
      `Crit: ${derivedStats.critChance.toFixed(1)}%`,
      `Luck: ${Math.floor(derivedStats.luck)}`,
      '',
      '=== EQUIPMENT ===',
      `Weapon: ${this.playerData.inventory.equipped.weapon?.name || 'None'}`,
      `Armor: ${this.playerData.inventory.equipped.armor?.name || 'None'}`,
      `Accessory: ${this.playerData.inventory.equipped.accessory?.name || 'None'}`,
    ];
    
    return new Text({ 
      text: lines.join('\n'),
      style: new TextStyle({ fontFamily: 'Arial', fontSize: 13, fill: 0xffffff, lineHeight: 22 })
    });
  }

  private updateRightPanel(): void {
    if (this.liveStatsText) {
      this.liveStatsText.text = this.createLiveStatsText().text;
    }
    
    if (this.itemPreviewText) {
      // Keep the preview text updated
    }
  }
}
