import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { SceneManager, IScene } from './SceneManager';

export class MainMenuScene implements IScene {
  container: Container;
  private sceneManager: SceneManager;
  private titleText: Text;
  private buttons: Container[];
  private backgroundGraphics: Graphics;
  private particles: Graphics[];
  private particleFrame: number;

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.container = new Container();
    this.buttons = [];
    this.particles = [];
    this.particleFrame = 0;
    this.backgroundGraphics = new Graphics();
    this.titleText = new Text({ text: '', style: {} });
  }

  onEnter(): void {
    this.createBackground();
    this.createTitle();
    this.createButtons();
    this.startParticles();
  }

  onExit(): void {}

  update(delta: number): void {
    this.animateParticles(delta);
  }

  private createBackground(): void {
    const width = 1024;
    const height = 768;
    this.backgroundGraphics.clear();
    for (let i = 0; i < height; i += 4) {
      const ratio = i / height;
      const r = Math.floor(10 + ratio * 30);
      const g = Math.floor(10 + ratio * 10);
      const b = Math.floor(21 + ratio * 50);
      this.backgroundGraphics.rect(0, i, width, 4);
      this.backgroundGraphics.fill(`rgb(${r}, ${g}, ${b})`);
    }
    this.container.addChild(this.backgroundGraphics);
  }

  private startParticles(): void {
    for (let i = 0; i < 50; i++) {
      const particle = new Graphics();
      const size = Math.random() * 3 + 1;
      particle.circle(0, 0, size);
      particle.fill({ color: 0x6666ff, alpha: Math.random() * 0.5 + 0.2 });
      particle.x = Math.random() * 1024;
      particle.y = Math.random() * 768;
      particle.alpha = Math.random() * 0.5 + 0.2;
      this.particles.push(particle);
      this.container.addChild(particle);
    }
  }

  private animateParticles(delta: number): void {
    this.particleFrame += delta;
    this.particles.forEach((particle, index) => {
      particle.y -= 0.3 * delta;
      particle.x += Math.sin(this.particleFrame * 0.01 + index) * 0.2;
      if (particle.y < -10) {
        particle.y = 778;
        particle.x = Math.random() * 1024;
      }
    });
  }

  private createTitle(): void {
    const titleStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 72,
      fontWeight: 'bold',
      fill: 0xffffff,
      stroke: { color: 0x4444ff, width: 4 },
      dropShadow: { blur: 8, color: '#000000', angle: Math.PI / 6, distance: 6 },
    });
    this.titleText = new Text({ text: 'RPS WAR', style: titleStyle });
    this.titleText.anchor.set(0.5);
    this.titleText.position.set(512, 120);
    this.container.addChild(this.titleText);
  }

  private createButtons(): void {
    const buttonConfigs = [
      { label: 'Start Game', y: 320, action: () => this.handleStartGame() },
      { label: 'Settings', y: 400, action: () => this.handleSettings() },
      { label: 'Exit', y: 480, action: () => this.handleExit() },
    ];
    buttonConfigs.forEach(config => {
      const button = this.createButton(config.label, config.action);
      button.position.set(512, config.y);
      this.buttons.push(button);
      this.container.addChild(button);
    });
  }

  private createButton(label: string, onClick: () => void): Container {
    const buttonContainer = new Container();
    const bg = new Graphics();
    const width = 280;
    const height = 60;
    bg.roundRect(-width / 2, -height / 2, width, height, 10);
    bg.fill({ color: 0x2a2a4e });
    bg.stroke({ width: 2, color: 0x4444ff });
    const textStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 24, fontWeight: 'bold', fill: 0xffffff });
    const text = new Text({ text: label, style: textStyle });
    text.anchor.set(0.5);
    buttonContainer.addChild(bg);
    buttonContainer.addChild(text);
    (buttonContainer as any).bg = bg;
    (buttonContainer as any).text = text;
    buttonContainer.eventMode = 'static';
    buttonContainer.cursor = 'pointer';
    buttonContainer.on('pointerenter', () => {
      bg.clear();
      bg.roundRect(-width / 2, -height / 2, width, height, 10);
      bg.fill({ color: 0x4444aa });
      bg.stroke({ width: 3, color: 0x6666ff });
      text.style.fill = 0xffff00;
    });
    buttonContainer.on('pointerleave', () => {
      bg.clear();
      bg.roundRect(-width / 2, -height / 2, width, height, 10);
      bg.fill({ color: 0x2a2a4e });
      bg.stroke({ width: 2, color: 0x4444ff });
      text.style.fill = 0xffffff;
    });
    buttonContainer.on('pointerdown', () => {
      bg.clear();
      bg.roundRect(-width / 2, -height / 2, width, height, 10);
      bg.fill({ color: 0x333388 });
      bg.stroke({ width: 3, color: 0x8888ff });
    });
    buttonContainer.on('pointerup', onClick);
    buttonContainer.on('pointerupoutside', () => {
      bg.clear();
      bg.roundRect(-width / 2, -height / 2, width, height, 10);
      bg.fill({ color: 0x2a2a4e });
      bg.stroke({ width: 2, color: 0x4444ff });
      text.style.fill = 0xffffff;
    });
    return buttonContainer;
  }

  private handleStartGame(): void { this.sceneManager.switchTo('game'); }
  private handleSettings(): void { this.sceneManager.switchTo('settings'); }
  private handleExit(): void { this.showExitConfirmation(); }

  private showExitConfirmation(): void {
    const overlay = new Graphics();
    overlay.rect(0, 0, 1024, 768);
    overlay.fill({ color: 0x000000, alpha: 0.7 });
    overlay.eventMode = 'static';
    const dialogContainer = new Container();
    dialogContainer.position.set(512, 384);
    const dialogBg = new Graphics();
    dialogBg.roundRect(-250, -100, 500, 200, 15);
    dialogBg.fill({ color: 0x1a1a3e });
    dialogBg.stroke({ width: 3, color: 0x6666ff });
    dialogContainer.addChild(dialogBg);
    const textStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 20, fill: 0xffffff });
    const text = new Text({ text: 'Are you sure you want to exit?', style: textStyle });
    text.anchor.set(0.5);
    text.position.set(0, -30);
    dialogContainer.addChild(text);
    const yesBtn = this.createSmallButton('Yes', () => {
      this.confirmExit();
      this.container.removeChild(overlay);
      this.container.removeChild(dialogContainer);
    });
    yesBtn.position.set(-60, 50);
    dialogContainer.addChild(yesBtn);
    const noBtn = this.createSmallButton('No', () => {
      this.container.removeChild(overlay);
      this.container.removeChild(dialogContainer);
    });
    noBtn.position.set(60, 50);
    dialogContainer.addChild(noBtn);
    this.container.addChild(overlay);
    this.container.addChild(dialogContainer);
  }

  private createSmallButton(label: string, onClick: () => void): Container {
    const buttonContainer = new Container();
    const bg = new Graphics();
    const width = 80;
    const height = 40;
    bg.roundRect(-width / 2, -height / 2, width, height, 8);
    bg.fill({ color: 0x3a3a5e });
    bg.stroke({ width: 2, color: 0x5555aa });
    const textStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 16, fontWeight: 'bold', fill: 0xffffff });
    const text = new Text({ text: label, style: textStyle });
    text.anchor.set(0.5);
    buttonContainer.addChild(bg);
    buttonContainer.addChild(text);
    (buttonContainer as any).bg = bg;
    (buttonContainer as any).text = text;
    buttonContainer.eventMode = 'static';
    buttonContainer.cursor = 'pointer';
    buttonContainer.on('pointerenter', () => {
      bg.clear();
      bg.roundRect(-width / 2, -height / 2, width, height, 8);
      bg.fill({ color: 0x5555aa });
      bg.stroke({ width: 2, color: 0x7777ff });
    });
    buttonContainer.on('pointerleave', () => {
      bg.clear();
      bg.roundRect(-width / 2, -height / 2, width, height, 8);
      bg.fill({ color: 0x3a3a5e });
      bg.stroke({ width: 2, color: 0x5555aa });
    });
    buttonContainer.on('pointerup', onClick);
    return buttonContainer;
  }

  private confirmExit(): void {
    if (typeof window !== 'undefined') {
      window.close();
      window.location.href = 'about:blank';
    }
  }
}
