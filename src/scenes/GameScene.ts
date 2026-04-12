import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { SceneManager, IScene } from './SceneManager';

export class GameScene implements IScene {
  container: Container;
  private sceneManager: SceneManager;

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.container = new Container();
  }

  onEnter(): void {
    this.createBackground();
    this.createLoadingText();
    this.createBackButton();
  }

  onExit(): void {}

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
    loadingText.position.set(512, 350);
    this.container.addChild(loadingText);
    const subtitle = new Text({ text: '(Placeholder - Game Scene)', style: new TextStyle({ fontFamily: 'Arial', fontSize: 18, fill: 0x888888 }) });
    subtitle.anchor.set(0.5);
    subtitle.position.set(512, 410);
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
  }
}
