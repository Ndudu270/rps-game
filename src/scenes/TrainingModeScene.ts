import { Container, Graphics, Text, TextStyle, Assets } from 'pixi.js';
import { SceneManager, IScene } from './SceneManager';
import { Stats, applyStatModifiers, StatModifiers } from '../../shared/types/stats';
import { StanceBonus, StancePenalty } from '../../shared/types/stance';
import { calculateDamage, DamageCalculationInput } from '../../engine/core/CombatCalculator';
import { SeededRNG } from '../../engine/core/RNG';

// Training Mode specific types
interface CombatLogEntry {
  turn: number;
  message: string;
  playerAction?: string;
  dummyAction?: string;
  damageDealt?: number;
  damageTaken?: number;
}

interface TrainingEntity {
  name: string;
  maxHp: number;
  currentHp: number;
  stats: Stats;
  stance: StanceData;
  isDefending: boolean;
}

interface StanceData {
  id: string;
  name: string;
  description: string;
  bonus: StanceBonus;
  penalty?: StancePenalty;
}

// Predefined stances for training mode
const TRAINING_STANCES: StanceData[] = [
  {
    id: 'aggressive',
    name: 'Aggressive',
    description: '+20% damage, -10% defense',
    bonus: { damageMod: 1.2, defenseMod: 0.9 },
    penalty: { damageReduction: 0 }
  },
  {
    id: 'defensive',
    name: 'Defensive',
    description: '+30% defense, -10% damage',
    bonus: { defenseMod: 1.3 },
    penalty: { damageReduction: 0.1 }
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'No modifiers',
    bonus: {}
  },
  {
    id: 'swift',
    name: 'Swift',
    description: '+15% crit chance',
    bonus: { critChance: 0.15 }
  }
];

export class TrainingModeScene implements IScene {
  container: Container;
  private sceneManager: SceneManager;
  private playerData: any | null;
  
  // UI Containers
  private leftPanel: Container;
  private centerPanel: Container;
  private rightPanel: Container;
  private bottomPanel: Container;
  
  // Player display elements
  private playerNameText: Text | null;
  private playerHpBar: Graphics | null;
  private playerStatsText: Text | null;
  private playerStanceText: Text | null;
  
  // Dummy display elements
  private dummyContainer: Container;
  private dummyNameText: Text | null;
  private dummyHpBar: Graphics | null;
  private dummyStatusText: Text | null;
  private dummyVisual: Graphics | null;
  
  // Combat log
  private combatLogContainer: Container;
  private combatLogEntries: CombatLogEntry[];
  private combatLogTexts: Text[];
  
  // Action buttons
  private actionButtons: Map<string, Container>;
  
  // Stance selector
  private stanceButtons: Map<string, Container>;
  private currentStanceIndex: number;
  
  // Game state
  private player: TrainingEntity | null;
  private dummy: TrainingEntity | null;
  private currentTurn: number;
  private isPlayerTurn: boolean;
  private battleActive: boolean;
  private rng: SeededRNG;
  
  // Animation state
  private shakeTarget: 'player' | 'dummy' | null;
  private shakeFrames: number;
  private flashTarget: 'player' | 'dummy' | null;
  private flashFrames: number;

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.container = new Container();
    this.playerData = null;
    
    this.leftPanel = new Container();
    this.centerPanel = new Container();
    this.rightPanel = new Container();
    this.bottomPanel = new Container();
    
    this.playerNameText = null;
    this.playerHpBar = null;
    this.playerStatsText = null;
    this.playerStanceText = null;
    
    this.dummyContainer = new Container();
    this.dummyNameText = null;
    this.dummyHpBar = null;
    this.dummyStatusText = null;
    this.dummyVisual = null;
    
    this.combatLogContainer = new Container();
    this.combatLogEntries = [];
    this.combatLogTexts = [];
    
    this.actionButtons = new Map();
    this.stanceButtons = new Map();
    this.currentStanceIndex = 0;
    
    this.player = null;
    this.dummy = null;
    this.currentTurn = 0;
    this.isPlayerTurn = true;
    this.battleActive = false;
    // Convert string to number seed using hash
    const seed = Math.floor(Math.random() * 1000000);
    this.rng = new SeededRNG(seed);
    
    this.shakeTarget = null;
    this.shakeFrames = 0;
    this.flashTarget = null;
    this.flashFrames = 0;
  }

  onEnter(): void {
    this.loadPlayerData();
    this.createBackground();
    this.createLeftPanel();
    this.createCenterPanel();
    this.createRightPanel();
    this.createBottomPanel();
    this.initializeTrainingState();
  }

  onExit(): void {
    // Cleanup - no persistent changes
    this.player = null;
    this.dummy = null;
    this.battleActive = false;
  }

  update(delta: number): void {
    // Handle shake animations
    if (this.shakeFrames > 0 && this.dummyVisual) {
      this.shakeFrames -= delta;
      if (this.shakeTarget === 'dummy') {
        this.dummyVisual.x = (Math.random() - 0.5) * 10;
        this.dummyVisual.y = (Math.random() - 0.5) * 10;
      }
      if (this.shakeFrames <= 0) {
        this.dummyVisual.x = 0;
        this.dummyVisual.y = 0;
        this.shakeTarget = null;
      }
    }
    
    // Handle flash animations
    if (this.flashFrames > 0 && this.dummyVisual) {
      this.flashFrames -= delta;
      this.dummyVisual.alpha = 0.5 + Math.sin(this.flashFrames * 0.5) * 0.5;
      if (this.flashFrames <= 0) {
        this.dummyVisual.alpha = 1;
        this.flashTarget = null;
      }
    }
  }

  private loadPlayerData(): void {
    if (typeof localStorage !== 'undefined') {
      const savedData = localStorage.getItem('playerData');
      if (savedData) {
        this.playerData = JSON.parse(savedData);
      }
    }
  }

  private initializeTrainingState(): void {
    // Create player entity from saved data or defaults
    const baseStats: Stats = {
      hp: 100,
      atk: 15,
      def: 8,
      spd: 10,
      int: 10,
      res: 10,
      sta: 100
    };
    
    // Apply player data stats if available
    if (this.playerData?.stats) {
      // Convert character creation stats to combat stats
      baseStats.atk = Math.floor((this.playerData.stats.strength || 10) * 1.5);
      baseStats.def = Math.floor((this.playerData.stats.endurance || 10) * 1.2);
      baseStats.spd = Math.floor((this.playerData.stats.agility || 10) * 1.3);
      baseStats.int = Math.floor((this.playerData.stats.intelligence || 10) * 1.4);
      baseStats.hp = 100 + (this.playerData.stats.endurance || 10) * 5;
    }
    
    this.player = {
      name: this.playerData?.name || 'Player',
      maxHp: baseStats.hp,
      currentHp: baseStats.hp,
      stats: baseStats,
      stance: TRAINING_STANCES[0],
      isDefending: false
    };
    
    // Create dummy opponent
    this.dummy = {
      name: 'Training Dummy',
      maxHp: 200,
      currentHp: 200,
      stats: {
        hp: 200,
        atk: 12,
        def: 5,
        spd: 8,
        int: 5,
        res: 5,
        sta: 100
      },
      stance: TRAINING_STANCES[2], // Balanced
      isDefending: false
    };
    
    this.currentTurn = 0;
    this.isPlayerTurn = true;
    this.battleActive = true;
    this.combatLogEntries = [];
    
    this.updatePlayerDisplay();
    this.updateDummyDisplay();
    this.addCombatLogEntry(0, 'Training started! Select an action to begin.');
    this.updateStanceButtons();
  }

  private createBackground(): void {
    const width = 1024;
    const height = 768;
    
    // Arena-style dark background
    const bg = new Graphics();
    
    // Gradient background
    for (let i = 0; i < height; i += 4) {
      const ratio = i / height;
      const r = Math.floor(15 + ratio * 10);
      const g = Math.floor(10 + ratio * 8);
      const b = Math.floor(25 + ratio * 15);
      bg.rect(0, i, width, 4);
      bg.fill(`rgb(${r}, ${g}, ${b})`);
    }
    
    // Arena floor
    const floor = new Graphics();
    floor.rect(0, 550, width, 218);
    floor.fill({ color: 0x1a1a2e });
    floor.stroke({ width: 2, color: 0x333355 });
    
    // Grid pattern on floor
    for (let x = 0; x < width; x += 50) {
      const line = new Graphics();
      line.moveTo(x, 550);
      line.lineTo(x - 100, 768);
      line.stroke({ width: 1, color: 0x2a2a4a, alpha: 0.5 });
      this.container.addChild(line);
    }
    
    this.container.addChildAt(bg, 0);
    this.container.addChild(floor);
  }

  private createLeftPanel(): void {
    this.leftPanel.position.set(20, 20);
    
    // Panel background
    const panelBg = new Graphics();
    panelBg.roundRect(0, 0, 280, 500, 10);
    panelBg.fill({ color: 0x1a1a3e, alpha: 0.9 });
    panelBg.stroke({ width: 2, color: 0x4444aa });
    this.leftPanel.addChild(panelBg);
    
    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0xffd700,
      stroke: { color: 0x000000, width: 2 }
    });
    const title = new Text({ text: 'PLAYER', style: titleStyle });
    title.anchor.set(0.5, 0);
    title.position.set(140, 15);
    this.leftPanel.addChild(title);
    
    // Player name
    const nameStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0xffffff
    });
    this.playerNameText = new Text({ text: 'Player', style: nameStyle });
    this.playerNameText.position.set(20, 50);
    this.leftPanel.addChild(this.playerNameText);
    
    // HP Bar
    const hpLabel = new Text({ 
      text: 'HP', 
      style: new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: 0xcccccc }) 
    });
    hpLabel.position.set(20, 80);
    this.leftPanel.addChild(hpLabel);
    
    this.playerHpBar = new Graphics();
    this.playerHpBar.position.set(50, 80);
    this.leftPanel.addChild(this.playerHpBar);
    
    // Stats display
    const statsLabel = new Text({ 
      text: 'Stats:', 
      style: new TextStyle({ fontFamily: 'Arial Black', fontSize: 14, fill: 0x88ccff }) 
    });
    statsLabel.position.set(20, 120);
    this.leftPanel.addChild(statsLabel);
    
    this.playerStatsText = new Text({ 
      text: '', 
      style: new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: 0xaaccff, leading: 4 }) 
    });
    this.playerStatsText.position.set(20, 145);
    this.leftPanel.addChild(this.playerStatsText);
    
    // Current stance
    const stanceLabel = new Text({ 
      text: 'Current Stance:', 
      style: new TextStyle({ fontFamily: 'Arial Black', fontSize: 14, fill: 0xffaa00 }) 
    });
    stanceLabel.position.set(20, 220);
    this.leftPanel.addChild(stanceLabel);
    
    this.playerStanceText = new Text({ 
      text: '', 
      style: new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: 0xffdd88, leading: 4 }) 
    });
    this.playerStanceText.position.set(20, 245);
    this.leftPanel.addChild(this.playerStanceText);
    
    // Stance selector
    const stanceSelectLabel = new Text({ 
      text: 'Select Stance:', 
      style: new TextStyle({ fontFamily: 'Arial Black', fontSize: 14, fill: 0x88ff88 }) 
    });
    stanceSelectLabel.position.set(20, 310);
    this.leftPanel.addChild(stanceSelectLabel);
    
    this.createStanceButtons();
    
    // Action buttons
    const actionLabel = new Text({ 
      text: 'Actions:', 
      style: new TextStyle({ fontFamily: 'Arial Black', fontSize: 14, fill: 0xff8888 }) 
    });
    actionLabel.position.set(20, 420);
    this.leftPanel.addChild(actionLabel);
    
    this.createActionButtons();
    
    this.container.addChild(this.leftPanel);
  }

  private createStanceButtons(): void {
    const startY = 340;
    const buttonWidth = 110;
    const buttonHeight = 28;
    const spacing = 5;
    
    TRAINING_STANCES.forEach((stance, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      
      const btnContainer = new Container();
      btnContainer.position.set(20 + col * (buttonWidth + spacing), startY + row * (buttonHeight + spacing));
      btnContainer.eventMode = 'static';
      btnContainer.cursor = 'pointer';
      
      const bg = new Graphics();
      bg.roundRect(0, 0, buttonWidth, buttonHeight, 5);
      bg.fill({ color: 0x2a2a5e });
      bg.stroke({ width: 1, color: 0x4444aa });
      btnContainer.addChild(bg);
      
      const label = new Text({ 
        text: stance.name, 
        style: new TextStyle({ fontFamily: 'Arial', fontSize: 11, fontWeight: 'bold', fill: 0xffffff }) 
      });
      label.anchor.set(0.5);
      label.position.set(buttonWidth / 2, buttonHeight / 2);
      btnContainer.addChild(label);
      
      btnContainer.on('pointerenter', () => {
        if (this.currentStanceIndex !== index) {
          bg.clear();
          bg.roundRect(0, 0, buttonWidth, buttonHeight, 5);
          bg.fill({ color: 0x3a3a7e });
          bg.stroke({ width: 2, color: 0x6666ff });
        }
      });
      
      btnContainer.on('pointerleave', () => {
        if (this.currentStanceIndex !== index) {
          bg.clear();
          bg.roundRect(0, 0, buttonWidth, buttonHeight, 5);
          bg.fill({ color: 0x2a2a5e });
          bg.stroke({ width: 1, color: 0x4444aa });
        }
      });
      
      btnContainer.on('pointerup', () => {
        this.selectStance(index);
      });
      
      this.stanceButtons.set(stance.id, btnContainer);
      this.leftPanel.addChild(btnContainer);
    });
  }

  private createActionButtons(): void {
    const actions = [
      { id: 'attack', name: '⚔️ Attack', color: 0xaa3333 },
      { id: 'defend', name: '🛡️ Defend', color: 0x3366aa },
      { id: 'skill', name: '✨ Skill', color: 0xaa66aa }
    ];
    
    const startY = 450;
    const buttonWidth = 80;
    const buttonHeight = 35;
    const spacing = 10;
    
    actions.forEach((action, index) => {
      const btnContainer = new Container();
      btnContainer.position.set(20 + index * (buttonWidth + spacing), startY);
      btnContainer.eventMode = 'static';
      btnContainer.cursor = 'pointer';
      
      const bg = new Graphics();
      bg.roundRect(0, 0, buttonWidth, buttonHeight, 6);
      bg.fill({ color: action.color });
      bg.stroke({ width: 2, color: 0xffffff, alpha: 0.5 });
      btnContainer.addChild(bg);
      
      const label = new Text({ 
        text: action.name, 
        style: new TextStyle({ fontFamily: 'Arial', fontSize: 12, fontWeight: 'bold', fill: 0xffffff }) 
      });
      label.anchor.set(0.5);
      label.position.set(buttonWidth / 2, buttonHeight / 2);
      btnContainer.addChild(label);
      
      btnContainer.on('pointerenter', () => {
        if (this.battleActive && this.isPlayerTurn) {
          bg.clear();
          bg.roundRect(0, 0, buttonWidth, buttonHeight, 6);
          bg.fill({ color: action.color });
          bg.stroke({ width: 3, color: 0xffff00 });
          label.scale.set(1.1);
        }
      });
      
      btnContainer.on('pointerleave', () => {
        bg.clear();
        bg.roundRect(0, 0, buttonWidth, buttonHeight, 6);
        bg.fill({ color: action.color });
        bg.stroke({ width: 2, color: 0xffffff, alpha: 0.5 });
        label.scale.set(1);
      });
      
      btnContainer.on('pointerup', () => {
        if (this.battleActive && this.isPlayerTurn) {
          this.performPlayerAction(action.id);
        }
      });
      
      this.actionButtons.set(action.id, btnContainer);
      this.leftPanel.addChild(btnContainer);
    });
  }

  private createCenterPanel(): void {
    this.centerPanel.position.set(320, 150);
    
    // Arena background
    const arenaBg = new Graphics();
    arenaBg.roundRect(0, 0, 380, 450, 15);
    arenaBg.fill({ color: 0x0f0f1f, alpha: 0.8 });
    arenaBg.stroke({ width: 3, color: 0x333366 });
    this.centerPanel.addChild(arenaBg);
    
    // VS indicator
    const vsStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 48,
      fontWeight: 'bold',
      fill: 0xff4444,
      stroke: { color: 0x000000, width: 3 }
    });
    const vsText = new Text({ text: 'VS', style: vsStyle });
    vsText.anchor.set(0.5);
    vsText.position.set(190, 200);
    this.centerPanel.addChild(vsText);
    
    // Turn indicator
    const turnContainer = new Container();
    turnContainer.position.set(190, 50);
    
    const turnBg = new Graphics();
    turnBg.roundRect(-80, -20, 160, 40, 8);
    turnBg.fill({ color: 0x2a2a4e });
    turnBg.stroke({ width: 2, color: 0x6666ff });
    turnContainer.addChild(turnBg);
    
    this.updateTurnIndicator(turnContainer);
    
    this.centerPanel.addChild(turnContainer);
    
    // Training Dummy visual
    this.dummyContainer.position.set(190, 320);
    this.createDummyVisual();
    this.centerPanel.addChild(this.dummyContainer);
    
    this.container.addChild(this.centerPanel);
  }

  private createDummyVisual(): void {
    this.dummyVisual = new Graphics();
    
    // Dummy body (simple mannequin shape)
    const bodyColor = 0x8b4513;
    const highlightColor = 0xcd853f;
    
    // Base
    this.dummyVisual.rect(-40, 40, 80, 15);
    this.dummyVisual.fill({ color: 0x4a3020 });
    
    // Stand pole
    this.dummyVisual.rect(-5, -20, 10, 60);
    this.dummyVisual.fill({ color: 0x654321 });
    
    // Torso
    this.dummyVisual.ellipse(0, -10, 35, 45);
    this.dummyVisual.fill({ color: bodyColor });
    this.dummyVisual.stroke({ width: 2, color: highlightColor });
    
    // Head
    this.dummyVisual.circle(0, -55, 20);
    this.dummyVisual.fill({ color: bodyColor });
    this.dummyVisual.stroke({ width: 2, color: highlightColor });
    
    // Arms
    this.dummyVisual.ellipse(-45, -10, 12, 30);
    this.dummyVisual.fill({ color: bodyColor });
    this.dummyVisual.stroke({ width: 2, color: highlightColor });
    
    this.dummyVisual.ellipse(45, -10, 12, 30);
    this.dummyVisual.fill({ color: bodyColor });
    this.dummyVisual.stroke({ width: 2, color: highlightColor });
    
    // Target marks
    const targetColors = [0xff0000, 0x00ff00, 0x0000ff];
    for (let i = 0; i < 3; i++) {
      const target = new Graphics();
      target.circle(-15 + i * 15, -15, 8);
      target.fill({ color: targetColors[i], alpha: 0.6 });
      target.stroke({ width: 1, color: 0xffffff });
      this.dummyVisual.addChild(target);
    }
    
    this.dummyContainer.addChild(this.dummyVisual);
  }

  private createRightPanel(): void {
    this.rightPanel.position.set(720, 20);
    
    // Panel background
    const panelBg = new Graphics();
    panelBg.roundRect(0, 0, 280, 500, 10);
    panelBg.fill({ color: 0x1a1a3e, alpha: 0.9 });
    panelBg.stroke({ width: 2, color: 0x4444aa });
    this.rightPanel.addChild(panelBg);
    
    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0xffd700,
      stroke: { color: 0x000000, width: 2 }
    });
    const title = new Text({ text: 'COMBAT LOG', style: titleStyle });
    title.anchor.set(0.5, 0);
    title.position.set(140, 15);
    this.rightPanel.addChild(title);
    
    // Combat log container with scroll area
    const logBg = new Graphics();
    logBg.roundRect(10, 50, 260, 300, 5);
    logBg.fill({ color: 0x0a0a1e });
    logBg.stroke({ width: 1, color: 0x333355 });
    this.rightPanel.addChild(logBg);
    
    this.combatLogContainer.position.set(20, 60);
    this.rightPanel.addChild(this.combatLogContainer);
    
    // Damage breakdown section
    const breakdownLabel = new Text({ 
      text: 'Damage Breakdown:', 
      style: new TextStyle({ fontFamily: 'Arial Black', fontSize: 14, fill: 0xff8844 }) 
    });
    breakdownLabel.position.set(10, 370);
    this.rightPanel.addChild(breakdownLabel);
    
    const breakdownBg = new Graphics();
    breakdownBg.roundRect(10, 395, 260, 90, 5);
    breakdownBg.fill({ color: 0x0a0a1e });
    breakdownBg.stroke({ width: 1, color: 0x333355 });
    this.rightPanel.addChild(breakdownBg);
    
    this.dummyNameText = new Text({ 
      text: 'Training Dummy', 
      style: new TextStyle({ fontFamily: 'Arial Black', fontSize: 14, fill: 0xff6666 }) 
    });
    this.dummyNameText.position.set(140, 100);
    this.dummyNameText.anchor.set(0.5, 0);
    this.centerPanel.addChild(this.dummyNameText);
    
    this.dummyHpBar = new Graphics();
    this.dummyHpBar.position.set(140, 125);
    this.centerPanel.addChild(this.dummyHpBar);
    
    this.dummyStatusText = new Text({ 
      text: '', 
      style: new TextStyle({ fontFamily: 'Arial', fontSize: 11, fill: 0xaaffaa }) 
    });
    this.dummyStatusText.position.set(140, 150);
    this.dummyStatusText.anchor.set(0.5, 0);
    this.centerPanel.addChild(this.dummyStatusText);
    
    this.container.addChild(this.rightPanel);
  }

  private createBottomPanel(): void {
    this.bottomPanel.position.set(512, 700);
    
    // Panel background
    const panelBg = new Graphics();
    panelBg.roundRect(-400, -40, 800, 60, 10);
    panelBg.fill({ color: 0x1a1a3e, alpha: 0.95 });
    panelBg.stroke({ width: 2, color: 0x4444aa });
    this.bottomPanel.addChild(panelBg);
    
    // Buttons
    const buttons = [
      { id: 'start', text: '▶ Start Training', color: 0x22aa44, x: -250 },
      { id: 'reset', text: '🔄 Reset', color: 0xaa8822, x: 0 },
      { id: 'exit', text: '← Exit to Hub', color: 0xaa3333, x: 250 }
    ];
    
    buttons.forEach(btn => {
      const btnContainer = new Container();
      btnContainer.position.set(btn.x, 0);
      btnContainer.eventMode = 'static';
      btnContainer.cursor = 'pointer';
      
      const bg = new Graphics();
      bg.roundRect(-100, -25, 200, 50, 8);
      bg.fill({ color: btn.color });
      bg.stroke({ width: 2, color: 0xffffff, alpha: 0.5 });
      btnContainer.addChild(bg);
      
      const label = new Text({ 
        text: btn.text, 
        style: new TextStyle({ fontFamily: 'Arial Black', fontSize: 14, fontWeight: 'bold', fill: 0xffffff }) 
      });
      label.anchor.set(0.5);
      btnContainer.addChild(label);
      
      btnContainer.on('pointerenter', () => {
        bg.clear();
        bg.roundRect(-100, -25, 200, 50, 8);
        bg.fill({ color: btn.color });
        bg.stroke({ width: 3, color: 0xffff00 });
        label.scale.set(1.05);
      });
      
      btnContainer.on('pointerleave', () => {
        bg.clear();
        bg.roundRect(-100, -25, 200, 50, 8);
        bg.fill({ color: btn.color });
        bg.stroke({ width: 2, color: 0xffffff, alpha: 0.5 });
        label.scale.set(1);
      });
      
      btnContainer.on('pointerup', () => {
        this.handleBottomButtonClick(btn.id);
      });
      
      this.bottomPanel.addChild(btnContainer);
    });
    
    this.container.addChild(this.bottomPanel);
  }

  private selectStance(index: number): void {
    if (!this.player || !this.battleActive) return;
    
    this.currentStanceIndex = index;
    this.player.stance = TRAINING_STANCES[index];
    
    this.updateStanceButtons();
    this.updatePlayerDisplay();
    
    this.addCombatLogEntry(this.currentTurn, `Player switched to ${this.player.stance.name} stance.`);
  }

  private performPlayerAction(actionId: string): void {
    if (!this.player || !this.dummy || !this.battleActive || !this.isPlayerTurn) return;
    
    this.player.isDefending = actionId === 'defend';
    
    let actionName = '';
    let damageDealt = 0;
    let logMessage = '';
    
    switch (actionId) {
      case 'attack':
        actionName = 'Strike';
        damageDealt = this.calculateDamage(this.player, this.dummy, 1.0);
        this.dummy.currentHp = Math.max(0, this.dummy.currentHp - damageDealt);
        logMessage = `Player used ${actionName} (${damageDealt} damage)`;
        this.triggerHitEffect('dummy');
        break;
        
      case 'defend':
        actionName = 'Guard';
        logMessage = `Player took a defensive stance`;
        break;
        
      case 'skill':
        actionName = 'Power Strike';
        damageDealt = this.calculateDamage(this.player, this.dummy, 1.5);
        this.dummy.currentHp = Math.max(0, this.dummy.currentHp - damageDealt);
        logMessage = `Player used ${actionName} (${damageDealt} damage)`;
        this.triggerHitEffect('dummy');
        break;
    }
    
    this.addCombatLogEntry(this.currentTurn, logMessage);
    this.updateDummyDisplay();
    this.checkBattleEnd();
    
    if (this.battleActive) {
      this.isPlayerTurn = false;
      this.updateTurnIndicator(this.centerPanel.getChildAt(2) as Container);
      setTimeout(() => this.performDummyAction(), 800);
    }
  }

  private performDummyAction(): void {
    if (!this.player || !this.dummy || !this.battleActive) return;
    
    // Simple AI: random action with bias
    const roll = this.rng.next();
    let actionName = '';
    let damageDealt = 0;
    let logMessage = '';
    
    // Dummy stance selection (random)
    const stanceRoll = this.rng.next();
    if (stanceRoll < 0.3) {
      this.dummy.stance = TRAINING_STANCES[0]; // Aggressive
    } else if (stanceRoll < 0.5) {
      this.dummy.stance = TRAINING_STANCES[1]; // Defensive
    } else {
      this.dummy.stance = TRAINING_STANCES[2]; // Balanced
    }
    
    this.dummy.isDefending = false;
    
    if (roll < 0.6) {
      // Attack
      actionName = 'Basic Attack';
      damageDealt = this.calculateDamage(this.dummy, this.player, 1.0);
      if (this.player.isDefending) {
        damageDealt = Math.floor(damageDealt * 0.5);
      }
      this.player.currentHp = Math.max(0, this.player.currentHp - damageDealt);
      logMessage = `Dummy used ${actionName} (${damageDealt} damage to player)`;
    } else if (roll < 0.8) {
      // Defend
      actionName = 'Brace';
      this.dummy.isDefending = true;
      logMessage = `Dummy took a defensive stance`;
    } else {
      // Heavy attack
      actionName = 'Heavy Slam';
      damageDealt = this.calculateDamage(this.dummy, this.player, 1.3);
      if (this.player.isDefending) {
        damageDealt = Math.floor(damageDealt * 0.5);
      }
      this.player.currentHp = Math.max(0, this.player.currentHp - damageDealt);
      logMessage = `Dummy used ${actionName} (${damageDealt} damage to player)`;
    }
    
    this.currentTurn++;
    this.isPlayerTurn = true;
    
    this.addCombatLogEntry(this.currentTurn, logMessage);
    this.updatePlayerDisplay();
    this.updateDummyDisplay();
    this.checkBattleEnd();
    
    if (this.battleActive) {
      this.updateTurnIndicator(this.centerPanel.getChildAt(2) as Container);
    }
  }

  private calculateDamage(attacker: TrainingEntity, defender: TrainingEntity, multiplier: number): number {
    const input: DamageCalculationInput = {
      attackerStats: attacker.stats,
      defenderStats: defender.stats,
      abilityMultiplier: multiplier,
      attackerStanceBonus: attacker.stance.bonus,
      attackerStancePenalty: attacker.stance.penalty,
      defenderStanceBonus: defender.stance.bonus,
      defenderStancePenalty: defender.stance.penalty,
      critChance: attacker.stance.bonus.critChance || 0,
      critMultiplier: 2.0
    };
    
    const result = calculateDamage(input, this.rng);
    
    // If defender is defending, reduce damage
    if (defender.isDefending) {
      return Math.floor(result.finalDamage * 0.5);
    }
    
    return result.finalDamage;
  }

  private triggerHitEffect(target: 'player' | 'dummy'): void {
    if (target === 'dummy') {
      this.shakeTarget = 'dummy';
      this.shakeFrames = 10;
      this.flashTarget = 'dummy';
      this.flashFrames = 8;
    }
  }

  private checkBattleEnd(): void {
    if (!this.player || !this.dummy) return;
    
    if (this.dummy.currentHp <= 0) {
      this.battleActive = false;
      this.addCombatLogEntry(this.currentTurn, '🎉 Training Dummy defeated! Press Reset to try again.');
      this.disableActionButtons();
    } else if (this.player.currentHp <= 0) {
      this.battleActive = false;
      this.addCombatLogEntry(this.currentTurn, '💀 Player defeated! Press Reset to try again.');
      this.disableActionButtons();
    }
  }

  private handleBottomButtonClick(buttonId: string): void {
    switch (buttonId) {
      case 'start':
        if (!this.battleActive) {
          this.initializeTrainingState();
        }
        break;
      case 'reset':
        this.initializeTrainingState();
        break;
      case 'exit':
        this.sceneManager.switchTo('hub');
        break;
    }
  }

  private updatePlayerDisplay(): void {
    if (!this.player) return;
    
    if (this.playerNameText) {
      this.playerNameText.text = this.player.name;
    }
    
    if (this.playerHpBar) {
      this.playerHpBar.clear();
      const barWidth = 200;
      const barHeight = 20;
      const hpPercent = this.player.currentHp / this.player.maxHp;
      
      // Background
      this.playerHpBar.rect(0, 0, barWidth, barHeight);
      this.playerHpBar.fill({ color: 0x333333 });
      
      // HP fill
      const hpColor = hpPercent > 0.5 ? 0x22aa44 : hpPercent > 0.25 ? 0xaa8822 : 0xaa3333;
      this.playerHpBar.rect(0, 0, barWidth * hpPercent, barHeight);
      this.playerHpBar.fill({ color: hpColor });
      this.playerHpBar.stroke({ width: 1, color: 0xffffff });
      
      // HP text
      const hpText = new Text({ 
        text: `${this.player.currentHp}/${this.player.maxHp}`, 
        style: new TextStyle({ fontFamily: 'Arial', fontSize: 12, fontWeight: 'bold', fill: 0xffffff }) 
      });
      hpText.anchor.set(0.5, 0.5);
      hpText.position.set(barWidth / 2, barHeight / 2);
      this.playerHpBar.addChild(hpText);
    }
    
    if (this.playerStatsText) {
      this.playerStatsText.text = 
        `ATK: ${this.player.stats.atk}\n` +
        `DEF: ${this.player.stats.def}\n` +
        `SPD: ${this.player.stats.spd}\n` +
        `INT: ${this.player.stats.int}`;
    }
    
    if (this.playerStanceText) {
      this.playerStanceText.text = 
        `${this.player.stance.name}\n${this.player.stance.description}`;
    }
  }

  private updateDummyDisplay(): void {
    if (!this.dummy) return;
    
    if (this.dummyHpBar) {
      this.dummyHpBar.clear();
      const barWidth = 250;
      const barHeight = 25;
      const hpPercent = this.dummy.currentHp / this.dummy.maxHp;
      
      // Background
      this.dummyHpBar.rect(-barWidth/2, 0, barWidth, barHeight);
      this.dummyHpBar.fill({ color: 0x333333 });
      
      // HP fill
      const hpColor = hpPercent > 0.5 ? 0xaa3333 : hpPercent > 0.25 ? 0xaa8822 : 0x555555;
      this.dummyHpBar.rect(-barWidth/2, 0, barWidth * hpPercent, barHeight);
      this.dummyHpBar.fill({ color: hpColor });
      this.dummyHpBar.stroke({ width: 2, color: 0xffffff });
      
      // HP text
      const hpText = new Text({ 
        text: `${this.dummy.currentHp}/${this.dummy.maxHp}`, 
        style: new TextStyle({ fontFamily: 'Arial Black', fontSize: 14, fontWeight: 'bold', fill: 0xffffff }) 
      });
      hpText.anchor.set(0.5, 0.5);
      hpText.position.set(0, barHeight / 2);
      this.dummyHpBar.addChild(hpText);
    }
    
    if (this.dummyStatusText) {
      const statusParts: string[] = [];
      if (this.dummy.isDefending) statusParts.push('🛡️ Defending');
      statusParts.push(`Stance: ${this.dummy.stance.name}`);
      this.dummyStatusText.text = statusParts.join(' | ');
    }
  }

  private updateStanceButtons(): void {
    this.stanceButtons.forEach((btn, id) => {
      const index = TRAINING_STANCES.findIndex(s => s.id === id);
      const bg = btn.getChildAt(0) as Graphics;
      
      bg.clear();
      bg.roundRect(0, 0, 110, 28, 5);
      
      if (index === this.currentStanceIndex) {
        bg.fill({ color: 0x44aa44 });
        bg.stroke({ width: 2, color: 0x88ff88 });
      } else {
        bg.fill({ color: 0x2a2a5e });
        bg.stroke({ width: 1, color: 0x4444aa });
      }
    });
  }

  private disableActionButtons(): void {
    this.actionButtons.forEach(btn => {
      btn.eventMode = 'none';
      btn.alpha = 0.5;
    });
  }

  private addCombatLogEntry(turn: number, message: string): void {
    this.combatLogEntries.push({ turn, message });
    
    // Limit log entries
    if (this.combatLogEntries.length > 8) {
      this.combatLogEntries.shift();
    }
    
    // Update display
    while (this.combatLogTexts.length > 0) {
      this.combatLogContainer.removeChild(this.combatLogTexts.pop()!);
    }
    
    const entryStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 11,
      fill: 0xcccccc,
      leading: 3
    });
    
    this.combatLogEntries.forEach((entry, index) => {
      const text = new Text({ 
        text: entry.message, 
        style: entryStyle 
      });
      text.position.set(0, index * 32);
      this.combatLogContainer.addChild(text);
      this.combatLogTexts.push(text);
    });
  }

  private updateTurnIndicator(container: Container): void {
    // Remove old children except background
    while (container.children.length > 1) {
      container.removeChildAt(1);
    }
    
    const turnText = this.isPlayerTurn ? "YOUR TURN" : "ENEMY TURN";
    const turnColor = this.isPlayerTurn ? 0x44ff44 : 0xff4444;
    
    const textStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 18,
      fontWeight: 'bold',
      fill: turnColor
    });
    const text = new Text({ text: `Turn ${this.currentTurn} - ${turnText}`, style: textStyle });
    text.anchor.set(0.5);
    container.addChild(text);
  }
}
