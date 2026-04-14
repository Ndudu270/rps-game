// Character Scene - RPG Character Progression Display
// Shows: name, class, race, level, XP, base stats, skill points, equipment points, build summary

import { Container, Graphics, Text, TextStyle, EventMode } from 'pixi.js';
import { SceneManager, IScene } from './SceneManager';
import { loadPlayerData, savePlayerData, PlayerData } from '../systems/PlayerDataManager';
import { Character } from '../../shared/types/character';

type TabType = 'overview' | 'stats' | 'skills' | 'equipment';

export class CharacterScene implements IScene {
  container: Container;
  private sceneManager: SceneManager;
  private playerData: PlayerData;
  
  private leftPanel: Container;
  private centerPanel: Container;
  private rightPanel: Container;
  
  private activeTab: TabType = 'overview';
  private tabButtons: Map<TabType, Container> = new Map();
  private tabContents: Map<TabType, Container> = new Map();

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.container = new Container();
    this.playerData = loadPlayerData();
    
    this.leftPanel = new Container();
    this.centerPanel = new Container();
    this.rightPanel = new Container();
  }

  onEnter(): void {
    this.playerData = loadPlayerData();
    
    if (!this.playerData.character) {
      console.log('No character, redirecting to creation');
      return;
    }
    
    this.createBackground();
    this.createLeftPanel();
    this.createCenterPanel();
    this.updateRightPanel();
    this.showTab('overview');
  }

  onExit(): void {
    savePlayerData(this.playerData);
  }

  private createBackground(): void {
    const bg = new Graphics();
    bg.rect(0, 0, 1024, 768);
    bg.fill({ color: 0x0a0a1a });
    this.container.addChild(bg);
    
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
    
    const bg = new Graphics();
    bg.rect(0, 0, 250, 768);
    bg.fill({ color: 0x12122a });
    bg.stroke({ width: 2, color: 0x3a3a6e });
    this.leftPanel.addChild(bg);
    
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
    
    const sep = new Graphics();
    sep.moveTo(20, 60);
    sep.lineTo(230, 60);
    sep.stroke({ width: 2, color: 0x3a3a6e });
    this.leftPanel.addChild(sep);
    
    const character = this.playerData.character;
    if (!character) return;
    
    const labelStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: 0x8888aa });
    const valueStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 14, fill: 0xffffff, fontWeight: 'bold' });
    
    let currentY = 80;
    const lineHeight = 28;
    
    this.addLabelValue(this.leftPanel, 'Name:', character.name, 20, currentY, labelStyle, valueStyle);
    currentY += lineHeight * 2;
    
    this.addLabelValue(this.leftPanel, 'Class:', character.class, 20, currentY, labelStyle, valueStyle);
    currentY += lineHeight;
    
    this.addLabelValue(this.leftPanel, 'Race:', character.race, 20, currentY, labelStyle, valueStyle);
    currentY += lineHeight;
    
    const levelLabel = new Text({ text: 'Level:', style: labelStyle });
    levelLabel.position.set(20, currentY);
    this.leftPanel.addChild(levelLabel);
    
    const levelValue = new Text({ 
      text: String(character.level), 
      style: new TextStyle({ fontFamily: 'Arial', fontSize: 16, fill: 0xffd700, fontWeight: 'bold' }) 
    });
    levelValue.position.set(20, currentY + 14);
    this.leftPanel.addChild(levelValue);
    currentY += lineHeight * 1.5;
    
    this.addLabelValue(this.leftPanel, 'XP:', character.xp + '/' + character.xpToNextLevel, 20, currentY, labelStyle, new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: 0xaaccff }));
    currentY += lineHeight * 1.5;
    
    const spLabel = new Text({ text: 'Skill Points:', style: labelStyle });
    spLabel.position.set(20, currentY);
    this.leftPanel.addChild(spLabel);
    
    const spValue = new Text({ 
      text: String(character.skillPoints), 
      style: new TextStyle({ fontFamily: 'Arial', fontSize: 14, fill: 0x00ff88, fontWeight: 'bold' }) 
    });
    spValue.position.set(20, currentY + 14);
    this.leftPanel.addChild(spValue);
    currentY += lineHeight;
    
    const epLabel = new Text({ text: 'Equip Points:', style: labelStyle });
    epLabel.position.set(20, currentY);
    this.leftPanel.addChild(epLabel);
    
    const epValue = new Text({ 
      text: String(character.equipmentPoints), 
      style: new TextStyle({ fontFamily: 'Arial', fontSize: 14, fill: 0xffaa00, fontWeight: 'bold' }) 
    });
    epValue.position.set(20, currentY + 14);
    this.leftPanel.addChild(epValue);
    currentY += lineHeight * 1.5;
    
    const goldLabel = new Text({ text: 'Gold:', style: labelStyle });
    goldLabel.position.set(20, currentY);
    this.leftPanel.addChild(goldLabel);
    
    const goldValue = new Text({ 
      text: String(this.playerData.gold), 
      style: new TextStyle({ fontFamily: 'Arial', fontSize: 16, fill: 0xffd700, fontWeight: 'bold' }) 
    });
    goldValue.position.set(20, currentY + 16);
    this.leftPanel.addChild(goldValue);
    
    this.container.addChild(this.leftPanel);
  }

  private addLabelValue(parent: Container, label: string, value: string, x: number, y: number, labelStyle: TextStyle, valueStyle: TextStyle): void {
    const lbl = new Text({ text: label, style: labelStyle });
    lbl.position.set(x, y);
    parent.addChild(lbl);
    
    const val = new Text({ text: value, style: valueStyle });
    val.position.set(x, y + 14);
    parent.addChild(val);
  }

  private createCenterPanel(): void {
    this.centerPanel.position.set(250, 0);
    
    const bg = new Graphics();
    bg.rect(0, 0, 524, 768);
    bg.fill({ color: 0x0f0f25 });
    bg.stroke({ width: 2, color: 0x3a3a6e });
    this.centerPanel.addChild(bg);
    
    this.createTabNavigation();
    this.createTabContentContainers();
    
    this.container.addChild(this.centerPanel);
  }

  private createTabNavigation(): void {
    const tabs = [
      { id: 'overview' as TabType, label: 'Overview' },
      { id: 'stats' as TabType, label: 'Stats' },
      { id: 'skills' as TabType, label: 'Skills' },
      { id: 'equipment' as TabType, label: 'Equipment' },
    ];
    
    const tabWidth = 100;
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
    const tabTypes: TabType[] = ['overview', 'stats', 'skills', 'equipment'];
    
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
    
    this.tabContents.forEach((container, type) => {
      container.visible = type === tabType;
    });
    
    this.tabButtons.forEach((btn, type) => {
      const bg = (btn as any).bg as Graphics;
      const text = (btn as any).text as Text;
      
      if (type === tabType) {
        bg.clear();
        bg.roundRect(0, 0, 100, 36, 6);
        bg.fill({ color: 0x4444aa });
        bg.stroke({ width: 2, color: 0x6666ff });
        text.style.fill = 0xffff00;
      } else {
        bg.clear();
        bg.roundRect(0, 0, 100, 36, 6);
        bg.fill({ color: 0x2a2a4e });
        bg.stroke({ width: 1, color: 0x4444aa });
        text.style.fill = 0xffffff;
      }
    });
    
    this.buildTabContent(tabType);
    this.updateRightPanel();
  }

  private buildTabContent(tabType: TabType): void {
    const container = this.tabContents.get(tabType);
    if (!container) return;
    
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
    }
  }

  private buildOverviewTab(container: Container): void {
    const character = this.playerData.character;
    if (!character) return;
    
    const textStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 14, fill: 0xcccccc, lineHeight: 22 });
    
    const lines: string[] = [];
    lines.push('=== CHARACTER SUMMARY ===');
    lines.push('');
    lines.push('Name: ' + character.name);
    lines.push('Class: ' + character.class);
    lines.push('Race: ' + character.race);
    lines.push('Level: ' + character.level);
    lines.push('XP: ' + character.xp + '/' + character.xpToNextLevel);
    lines.push('');
    lines.push('=== BASE STATS ===');
    lines.push('STR: ' + Math.round(character.baseStats.strength) + '  AGI: ' + Math.round(character.baseStats.agility) + '  INT: ' + Math.round(character.baseStats.intelligence));
    lines.push('CHA: ' + Math.round(character.baseStats.charisma) + '  END: ' + Math.round(character.baseStats.endurance) + '  PER: ' + Math.round(character.baseStats.perception) + '  LCK: ' + Math.round(character.baseStats.luck));
    lines.push('');
    lines.push('=== PROGRESSION ===');
    lines.push('Skill Points: ' + character.skillPoints);
    lines.push('Equipment Points: ' + character.equipmentPoints);
    lines.push('Skills Learned: ' + character.learnedSkills.length);
    lines.push('');
    lines.push(this.getClassDescription(character.class));
    
    const text = new Text({ text: lines.join('\n'), style: textStyle });
    text.position.set(10, 10);
    container.addChild(text);
  }

  private buildStatsTab(container: Container): void {
    const character = this.playerData.character;
    if (!character) return;
    
    const textStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 14, fill: 0xcccccc, lineHeight: 24 });
    
    const lines: string[] = [];
    lines.push('=== BASE STATS ===');
    lines.push('');
    lines.push('Strength:     ' + Math.round(character.baseStats.strength));
    lines.push('Agility:      ' + Math.round(character.baseStats.agility));
    lines.push('Intelligence: ' + Math.round(character.baseStats.intelligence));
    lines.push('Charisma:     ' + Math.round(character.baseStats.charisma));
    lines.push('Endurance:    ' + Math.round(character.baseStats.endurance));
    lines.push('Perception:   ' + Math.round(character.baseStats.perception));
    lines.push('Luck:         ' + Math.round(character.baseStats.luck));
    lines.push('');
    lines.push('=== DERIVED STATS ===');
    lines.push('');
    lines.push('HP:           ' + character.derivedStats.hp);
    lines.push('Attack:       ' + character.derivedStats.attack);
    lines.push('Defense:      ' + character.derivedStats.defense);
    lines.push('Speed:        ' + character.derivedStats.speed);
    lines.push('Crit Chance:  ' + character.derivedStats.critChance + '%');
    lines.push('Crit Damage:  ' + character.derivedStats.critDamage + '%');
    
    const text = new Text({ text: lines.join('\n'), style: textStyle });
    text.position.set(10, 10);
    container.addChild(text);
  }

  private buildSkillsTab(container: Container): void {
    const character = this.playerData.character;
    if (!character) return;
    
    const textStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 14, fill: 0xcccccc, lineHeight: 22 });
    
    const lines: string[] = [];
    lines.push('=== LEARNED SKILLS ===');
    lines.push('Skill Points Available: ' + character.skillPoints);
    lines.push('');
    
    if (character.learnedSkills.length === 0) {
      lines.push('No skills learned yet.');
      lines.push('Visit the Skill Shop to learn new skills!');
    } else {
      character.learnedSkills.forEach((skill, index) => {
        lines.push((index + 1) + '. ' + skill.skillId);
        lines.push('   Upgrade Level: ' + skill.upgradeLevel);
        lines.push('   Points Spent: ' + skill.spentPoints);
        lines.push('   Learned at: Level ' + skill.unlockLevel);
        lines.push('');
      });
    }
    
    const text = new Text({ text: lines.join('\n'), style: textStyle });
    text.position.set(10, 10);
    container.addChild(text);
  }

  private buildEquipmentTab(container: Container): void {
    const character = this.playerData.character;
    if (!character) return;
    
    const textStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 14, fill: 0xcccccc, lineHeight: 22 });
    
    const lines: string[] = [];
    lines.push('=== EQUIPMENT ===');
    lines.push('Equipment Points Available: ' + character.equipmentPoints);
    lines.push('');
    lines.push('Weapon: ' + (character.equippedGear.weapon ? 'Lv.' + character.equippedGear.weapon.upgradeLevel + ' (' + character.equippedGear.weapon.itemId + ')' : 'None'));
    lines.push('Armor: ' + (character.equippedGear.armor ? 'Lv.' + character.equippedGear.armor.upgradeLevel + ' (' + character.equippedGear.armor.itemId + ')' : 'None'));
    lines.push('Accessory: ' + (character.equippedGear.accessory ? 'Lv.' + character.equippedGear.accessory.upgradeLevel + ' (' + character.equippedGear.accessory.itemId + ')' : 'None'));
    lines.push('');
    lines.push('Visit the Equipment Shop to buy or upgrade gear!');
    
    const text = new Text({ text: lines.join('\n'), style: textStyle });
    text.position.set(10, 10);
    container.addChild(text);
  }

  private updateRightPanel(): void {
    this.rightPanel.removeChildren();
    this.rightPanel.position.set(774, 0);
    
    const bg = new Graphics();
    bg.rect(0, 0, 250, 768);
    bg.fill({ color: 0x12122a });
    bg.stroke({ width: 2, color: 0x3a3a6e });
    this.rightPanel.addChild(bg);
    
    const titleStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 20,
      fontWeight: 'bold',
      fill: 0xffffff,
      stroke: { color: 0x4444ff, width: 2 },
    });
    const title = new Text({ text: 'SUMMARY', style: titleStyle });
    title.anchor.set(0.5, 0);
    title.position.set(125, 20);
    this.rightPanel.addChild(title);
    
    const character = this.playerData.character;
    if (!character) return;
    
    const textStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: 0xaaccff, lineHeight: 20 });
    
    const summaryLines: string[] = [];
    summaryLines.push(character.name);
    summaryLines.push('Lv.' + character.level + ' ' + character.race + ' ' + character.class);
    summaryLines.push('');
    summaryLines.push('HP: ' + character.derivedStats.hp);
    summaryLines.push('ATK: ' + character.derivedStats.attack);
    summaryLines.push('DEF: ' + character.derivedStats.defense);
    summaryLines.push('SPD: ' + character.derivedStats.speed);
    summaryLines.push('');
    summaryLines.push('SP: ' + character.skillPoints);
    summaryLines.push('EP: ' + character.equipmentPoints);
    
    const summaryText = new Text({ text: summaryLines.join('\n'), style: textStyle });
    summaryText.position.set(20, 80);
    this.rightPanel.addChild(summaryText);
    
    this.container.addChild(this.rightPanel);
  }

  private getClassDescription(className: string): string {
    const descriptions: Record<string, string> = {
      'Warrior': 'Masters of melee combat with high strength and endurance.',
      'Mage': 'Wielders of arcane power with devastating magical attacks.',
      'Rogue': 'Swift assassins striking from shadows with high crit chance.',
      'Archer': 'Expert marksmen raining death from afar.',
      'Cleric': 'Holy healers supporting allies with divine power.',
    };
    return descriptions[className] || 'A versatile adventurer ready for any challenge.';
  }

  private getRaceDescription(raceName: string): string {
    const descriptions: Record<string, string> = {
      'Humans': 'Versatile and adaptable, excelling in any role.',
      'Elves': 'Graceful beings with superior agility and perception.',
      'Dwarfs': 'Sturdy warriors with exceptional endurance.',
      'Demons': 'Dark beings with innate magical power.',
    };
    return descriptions[raceName] || 'A unique being with untapped potential.';
  }
}
