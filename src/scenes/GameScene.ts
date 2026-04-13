import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { SceneManager, IScene } from './SceneManager';
import { PlayerData } from './CharacterCreationScene';

export class GameScene implements IScene {
  container: Container;
  private sceneManager: SceneManager;
  private playerData: PlayerData | null;

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.container = new Container();
    this.playerData = null;
  }

  onEnter(): void {
    this.loadPlayerData();
    this.createBackground();
    this.createLoadingText();
    this.createBackButton();
    this.displayPlayerInfo();
  }

  onExit(): void {}

  private loadPlayerData(): void {
    if (typeof localStorage !== 'undefined') {
      const savedData = localStorage.getItem('playerData');
      if (savedData) {
        this.playerData = JSON.parse(savedData);
      }
    }
  }

  private displayPlayerInfo(): void {
    if (!this.playerData) {
      const noDataText = new Text({ 
        text: 'No character data found.\nGo back and create a character!', 
        style: new TextStyle({ fontFamily: 'Arial', fontSize: 20, fill: 0xff6666, align: 'center' }) 
      });
      noDataText.anchor.set(0.5);
      noDataText.position.set(512, 280);
      this.container.addChild(noDataText);
      return;
    }

    const infoStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xffffff,
      lineHeight: 24,
    });

    const infoLines = [
      `Character: ${this.playerData.name}`,
      `Race: ${this.playerData.race}`,
      `Class: ${this.playerData.class}`,
      `Background: ${this.playerData.background}`,
      `Talents: ${this.playerData.talents.length > 0 ? this.playerData.talents.join(', ') : 'None'}`,
      '',
      'Stats:',
      `  STR: ${this.playerData.stats.strength}  AGI: ${this.playerData.stats.agility}`,
      `  INT: ${this.playerData.stats.intelligence}  CHA: ${this.playerData.stats.charisma}`,
      `  END: ${this.playerData.stats.endurance}  PER: ${this.playerData.stats.perception}`,
      `  LCK: ${this.playerData.stats.luck}`,
    ];

    const infoText = new Text({ text: infoLines.join('\n'), style: infoStyle });
    infoText.anchor.set(0.5);
    infoText.position.set(512, 250);
    this.container.addChild(infoText);
  }

  private createBackground(): void {
    const bg = new Graphics();
    bg.rect(0, 0, 1024, 768);
    bg.fill({ color: 0x050510 });
    for (let i = 0; i < 1024; i += 50) {
      bg.moveTo(i, 0);
      bg.lineTo(i, 768);
      bg.stroke({ width: 1, color: 0x1a1a3e, alpha: 0.5 });
    }
    for (let i = 0; i < 768; i += 50) {
      bg.moveTo(0, i);
      bg.lineTo(1024, i);
      bg.stroke({ width: 1, color: 0x1a1a3e, alpha: 0.5 });
    }
    this.container.addChild(bg);
  }

  private createLoadingText(): void {
    const loadingStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 48,
      fontWeight: 'bold',
      fill: 0xffffff,
      stroke: { color: 0x4444ff, width: 3 },
      dropShadow: { blur: 6, color: '#000000', angle: Math.PI / 6, distance: 4 },
    });
    const loadingText = new Text({ text: 'Game Loading...', style: loadingStyle });
    loadingText.anchor.set(0.5);
    loadingText.position.set(512, 450);
    this.container.addChild(loadingText);
    const subtitle = new Text({ text: '(Placeholder - Game Scene)', style: new TextStyle({ fontFamily: 'Arial', fontSize: 18, fill: 0x888888 }) });
    subtitle.anchor.set(0.5);
    subtitle.position.set(512, 510);
    this.container.addChild(subtitle);
  }

  private createBackButton(): void {
    const buttonContainer = new Container();
    buttonContainer.position.set(512, 600);
    const bg = new Graphics();
    const width = 200, height = 50;
    bg.roundRect(-width / 2, -height / 2, width, height, 10);
    bg.fill({ color: 0x3a3a5e });
    bg.stroke({ width: 2, color: 0x5555aa });
    const text = new Text({ text: 'Back to Menu', style: new TextStyle({ fontFamily: 'Arial', fontSize: 18, fontWeight: 'bold', fill: 0xffffff }) });
    text.anchor.set(0.5);
    buttonContainer.addChild(bg);
    buttonContainer.addChild(text);
    (buttonContainer as any).bg = bg;
    buttonContainer.eventMode = 'static';
    buttonContainer.cursor = 'pointer';
    buttonContainer.on('pointerenter', () => { bg.clear(); bg.roundRect(-width / 2, -height / 2, width, height, 10); bg.fill({ color: 0x5555aa }); bg.stroke({ width: 2, color: 0x7777ff }); });
    buttonContainer.on('pointerleave', () => { bg.clear(); bg.roundRect(-width / 2, -height / 2, width, height, 10); bg.fill({ color: 0x3a3a5e }); bg.stroke({ width: 2, color: 0x5555aa }); });
    buttonContainer.on('pointerup', () => { this.sceneManager.switchTo('mainMenu'); });
    this.container.addChild(buttonContainer);
    
    // Character button
    const charBtnContainer = new Container();
    charBtnContainer.position.set(512, 670);
    const charBg = new Graphics();
    const charWidth = 180, charHeight = 45;
    charBg.roundRect(-charWidth / 2, -charHeight / 2, charWidth, charHeight, 10);
    charBg.fill({ color: 0x2a4a3e });
    charBg.stroke({ width: 2, color: 0x44aa88 });
    const charText = new Text({ text: 'Character', style: new TextStyle({ fontFamily: 'Arial', fontSize: 18, fontWeight: 'bold', fill: 0xffffff }) });
    charText.anchor.set(0.5);
    charBtnContainer.addChild(charBg);
    charBtnContainer.addChild(charText);
    (charBtnContainer as any).bg = charBg;
    charBtnContainer.eventMode = 'static';
    charBtnContainer.cursor = 'pointer';
    charBtnContainer.on('pointerenter', () => { charBg.clear(); charBg.roundRect(-charWidth / 2, -charHeight / 2, charWidth, charHeight, 10); charBg.fill({ color: 0x3a6a5e }); charBg.stroke({ width: 2, color: 0x66ccaa }); });
    charBtnContainer.on('pointerleave', () => { charBg.clear(); charBg.roundRect(-charWidth / 2, -charHeight / 2, charWidth, charHeight, 10); charBg.fill({ color: 0x2a4a3e }); charBg.stroke({ width: 2, color: 0x44aa88 }); });
    charBtnContainer.on('pointerup', () => { this.sceneManager.switchTo('character'); });
    this.container.addChild(charBtnContainer);
  }
}
