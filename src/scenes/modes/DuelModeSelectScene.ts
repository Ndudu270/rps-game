import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { SceneManager, IScene } from '../SceneManager';

export class DuelModeSelectScene implements IScene {
  container: Container;
  private sceneManager: SceneManager;

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.container = new Container();
  }

  onEnter(): void {
    this.createBackground();
    this.createTitle();
    this.createDuelOptions();
    this.createBackButton();
  }

  onExit(): void {}

  update(delta: number): void {}

  private createBackground(): void {
    const bg = new Graphics();
    bg.rect(0, 0, 1024, 768);
    bg.fill({ color: 0x1a0a2a });
    this.container.addChild(bg);

    // Add decorative border
    const border = new Graphics();
    border.stroke({ width: 4, color: 0x4444aa });
    border.rect(10, 10, 1004, 748);
    this.container.addChild(border);
  }

  private createTitle(): void {
    const title = new Text({
      text: 'DUELS',
      style: new TextStyle({
        fontFamily: 'Arial Black',
        fontSize: 48,
        fontWeight: 'bold',
        fill: 0x6666ff,
        stroke: { color: 0x000000, width: 3 },
      })
    });
    title.anchor.set(0.5);
    title.position.set(512, 80);
    this.container.addChild(title);

    const subtitle = new Text({
      text: 'PvP Battles - Prove Your Worth',
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

  private createDuelOptions(): void {
    const startY = 250;
    const buttonWidth = 400;
    const buttonHeight = 110;
    const spacing = 35;

    const duelOptions = [
      {
        id: 'ranked',
        name: 'RANKED DUEL',
        description: 'Compete for ranking points and seasonal rewards',
        color: 0xaa4444,
        glow: 0xff6666,
      },
      {
        id: 'casual',
        name: 'CASUAL DUEL',
        description: 'Friendly matches without ranking consequences',
        color: 0x4466aa,
        glow: 0x6688ff,
      },
      {
        id: 'custom',
        name: 'CUSTOM DUEL',
        description: 'Create a private room to challenge friends',
        color: 0x44aa66,
        glow: 0x66ff88,
      },
    ];

    duelOptions.forEach((option, index) => {
      const y = startY + index * (buttonHeight + spacing);
      const x = 512;

      const buttonContainer = new Container();
      buttonContainer.position.set(x, y);
      buttonContainer.eventMode = 'static';
      buttonContainer.cursor = 'pointer';

      // Button background
      const bg = new Graphics();
      bg.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
      bg.fill({ color: 0x2a1a4a });
      bg.stroke({ width: 2, color: option.color });
      buttonContainer.addChild(bg);

      // Accent bar
      const accent = new Graphics();
      accent.roundRect(-buttonWidth / 2 + 5, -buttonHeight / 2 + 5, 10, buttonHeight - 10, 5);
      accent.fill({ color: option.color });
      buttonContainer.addChild(accent);

      // Option name
      const nameText = new Text({
        text: option.name,
        style: new TextStyle({
          fontFamily: 'Arial Black',
          fontSize: 26,
          fontWeight: 'bold',
          fill: option.glow,
        })
      });
      nameText.anchor.set(0, 0.3);
      nameText.position.set(-buttonWidth / 2 + 25, -buttonHeight / 2 + 15);
      buttonContainer.addChild(nameText);

      // Description
      const descText = new Text({
        text: option.description,
        style: new TextStyle({
          fontFamily: 'Arial',
          fontSize: 15,
          fill: 0xcccccc,
          wordWrap: true,
          wordWrapWidth: 320,
        })
      });
      descText.anchor.set(0, 0.5);
      descText.position.set(-buttonWidth / 2 + 25, 0);
      buttonContainer.addChild(descText);

      // Status indicator
      const statusText = new Text({
        text: 'ONLINE',
        style: new TextStyle({
          fontFamily: 'Arial',
          fontSize: 12,
          fontWeight: 'bold',
          fill: 0x00ff00,
        })
      });
      statusText.anchor.set(1, 0.8);
      statusText.position.set(buttonWidth / 2 - 10, buttonHeight / 2 - 10);
      buttonContainer.addChild(statusText);

      // Hover effects
      buttonContainer.on('pointerenter', () => {
        bg.clear();
        bg.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
        bg.fill({ color: 0x3a2a5a });
        bg.stroke({ width: 3, color: option.glow });
        nameText.scale.set(1.05);
      });

      buttonContainer.on('pointerleave', () => {
        bg.clear();
        bg.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
        bg.fill({ color: 0x2a1a4a });
        bg.stroke({ width: 2, color: option.color });
        nameText.scale.set(1);
      });

      buttonContainer.on('pointerup', () => {
        console.log(`Starting ${option.name}`);
        // TODO: Start the actual duel mode
        this.sceneManager.switchScene('hub');
      });

      this.container.addChild(buttonContainer);
    });

    // Info panel at bottom
    const infoPanel = new Graphics();
    infoPanel.roundRect(200, 580, 624, 100, 10);
    infoPanel.fill({ color: 0x1a1a3a });
    infoPanel.stroke({ width: 2, color: 0x4444aa });
    this.container.addChild(infoPanel);

    const infoTitle = new Text({
      text: 'DUEL INFO',
      style: new TextStyle({
        fontFamily: 'Arial Black',
        fontSize: 16,
        fontWeight: 'bold',
        fill: 0x6666ff,
      })
    });
    infoTitle.anchor.set(0.5, 0);
    infoTitle.position.set(512, 590);
    this.container.addChild(infoTitle);

    const infoText = new Text({
      text: '• Ranked duels affect your seasonal ranking\n• Casual duels are for practice and fun\n• Custom duels let you set custom rules',
      style: new TextStyle({
        fontFamily: 'Arial',
        fontSize: 13,
        fill: 0xaaaaaa,
        lineHeight: 22,
      })
    });
    infoText.anchor.set(0.5, 0);
    infoText.position.set(512, 615);
    this.container.addChild(infoText);
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
