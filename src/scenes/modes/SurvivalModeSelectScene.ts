import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { SceneManager, IScene } from '../SceneManager';
import { SURVIVAL_DIFFICULTIES } from '../../../config/gameConfig';

export class SurvivalModeSelectScene implements IScene {
  container: Container;
  private sceneManager: SceneManager;

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.container = new Container();
  }

  onEnter(): void {
    this.createBackground();
    this.createTitle();
    this.createDifficultyButtons();
    this.createBackButton();
  }

  onExit(): void {}

  update(delta: number): void {}

  private createBackground(): void {
    const bg = new Graphics();
    bg.rect(0, 0, 1024, 768);
    bg.fill({ color: 0x0a1a0a });
    this.container.addChild(bg);

    // Add decorative border
    const border = new Graphics();
    border.stroke({ width: 4, color: 0x006644 });
    border.rect(10, 10, 1004, 748);
    this.container.addChild(border);
  }

  private createTitle(): void {
    const title = new Text({
      text: 'SURVIVAL MODE',
      style: new TextStyle({
        fontFamily: 'Arial Black',
        fontSize: 48,
        fontWeight: 'bold',
        fill: 0x00ff88,
        stroke: { color: 0x000000, width: 3 },
      })
    });
    title.anchor.set(0.5);
    title.position.set(512, 80);
    this.container.addChild(title);

    const subtitle = new Text({
      text: 'Endless Waves - How long can you survive?',
      style: new TextStyle({
        fontFamily: 'Arial',
        fontSize: 20,
        fill: 0xcccccc,
      })
    });
    subtitle.anchor.set(0.5);
    subtitle.position.set(512, 130);
    this.container.addChild(subtitle);
  }

  private createDifficultyButtons(): void {
    const startY = 220;
    const buttonWidth = 400;
    const buttonHeight = 90;
    const spacing = 25;

    SURVIVAL_DIFFICULTIES.forEach((difficulty, index) => {
      const y = startY + index * (buttonHeight + spacing);
      const x = 512;

      const buttonContainer = new Container();
      buttonContainer.position.set(x, y);
      buttonContainer.eventMode = 'static';
      buttonContainer.cursor = 'pointer';

      // Button background
      const bg = new Graphics();
      bg.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
      bg.fill({ color: 0x1a3a2a });
      bg.stroke({ width: 2, color: 0x006644 });
      buttonContainer.addChild(bg);

      // Difficulty name
      const nameText = new Text({
        text: difficulty.name.toUpperCase(),
        style: new TextStyle({
          fontFamily: 'Arial Black',
          fontSize: 28,
          fontWeight: 'bold',
          fill: 0x00ff88,
        })
      });
      nameText.anchor.set(0.5, 0.3);
      buttonContainer.addChild(nameText);

      // Wave count
      const waveText = new Text({
        text: `${difficulty.waves} Waves`,
        style: new TextStyle({
          fontFamily: 'Arial',
          fontSize: 18,
          fill: 0xffffff,
        })
      });
      waveText.anchor.set(0.5, 0.55);
      buttonContainer.addChild(waveText);

      // Description
      const descText = new Text({
        text: difficulty.description,
        style: new TextStyle({
          fontFamily: 'Arial',
          fontSize: 14,
          fill: 0xaaaaaa,
          align: 'center',
        })
      });
      descText.anchor.set(0.5, 0.8);
      buttonContainer.addChild(descText);

      // Hover effects
      buttonContainer.on('pointerenter', () => {
        bg.clear();
        bg.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
        bg.fill({ color: 0x2a5a3a });
        bg.stroke({ width: 3, color: 0x00ff88 });
        nameText.scale.set(1.05);
      });

      buttonContainer.on('pointerleave', () => {
        bg.clear();
        bg.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
        bg.fill({ color: 0x1a3a2a });
        bg.stroke({ width: 2, color: 0x006644 });
        nameText.scale.set(1);
      });

      buttonContainer.on('pointerup', () => {
        console.log(`Starting Survival Mode: ${difficulty.name}`);
        // TODO: Start the actual survival mode with this difficulty
        this.sceneManager.switchScene('hub');
      });

      this.container.addChild(buttonContainer);
    });
  }

  private createBackButton(): void {
    const backBtn = new Container();
    backBtn.position.set(80, 720);
    backBtn.eventMode = 'static';
    backBtn.cursor = 'pointer';

    const bg = new Graphics();
    bg.roundRect(-50, -20, 100, 40, 8);
    bg.fill({ color: 0x333333 });
    bg.stroke({ width: 2, color: 0x666666 });
    backBtn.addChild(bg);

    const text = new Text({
      text: '← BACK',
      style: new TextStyle({
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'bold',
        fill: 0xffffff,
      })
    });
    text.anchor.set(0.5);
    backBtn.addChild(text);

    backBtn.on('pointerenter', () => {
      bg.clear();
      bg.roundRect(-50, -20, 100, 40, 8);
      bg.fill({ color: 0x555555 });
      bg.stroke({ width: 2, color: 0x888888 });
    });

    backBtn.on('pointerleave', () => {
      bg.clear();
      bg.roundRect(-50, -20, 100, 40, 8);
      bg.fill({ color: 0x333333 });
      bg.stroke({ width: 2, color: 0x666666 });
    });

    backBtn.on('pointerup', () => {
      this.sceneManager.switchScene('hub');
    });

    this.container.addChild(backBtn);
  }
}
