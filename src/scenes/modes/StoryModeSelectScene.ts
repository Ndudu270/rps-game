import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { SceneManager, IScene } from '../SceneManager';
import { STORY_PARTS } from '../../../config/gameConfig';

export class StoryModeSelectScene implements IScene {
  container: Container;
  private sceneManager: SceneManager;

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.container = new Container();
  }

  onEnter(): void {
    this.createBackground();
    this.createTitle();
    this.createPartButtons();
    this.createBackButton();
  }

  onExit(): void {}

  update(delta: number): void {}

  private createBackground(): void {
    const bg = new Graphics();
    bg.rect(0, 0, 1024, 768);
    bg.fill({ color: 0x1a0a0a });
    this.container.addChild(bg);

    // Add decorative border
    const border = new Graphics();
    border.stroke({ width: 4, color: 0x8b0000 });
    border.rect(10, 10, 1004, 748);
    this.container.addChild(border);
  }

  private createTitle(): void {
    const title = new Text({
      text: 'STORY MODE',
      style: new TextStyle({
        fontFamily: 'Arial Black',
        fontSize: 48,
        fontWeight: 'bold',
        fill: 0xff4444,
        stroke: { color: 0x000000, width: 3 },
      })
    });
    title.anchor.set(0.5);
    title.position.set(512, 80);
    this.container.addChild(title);

    const subtitle = new Text({
      text: 'Choose a Part to begin your adventure',
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

  private createPartButtons(): void {
    const startX = 150;
    const startY = 200;
    const buttonWidth = 200;
    const buttonHeight = 100;
    const columns = 4;
    const rows = 3;
    const hGap = 40;
    const vGap = 30;

    STORY_PARTS.forEach((part, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = startX + col * (buttonWidth + hGap);
      const y = startY + row * (buttonHeight + vGap);

      const buttonContainer = new Container();
      buttonContainer.position.set(x + buttonWidth / 2, y + buttonHeight / 2);
      buttonContainer.eventMode = 'static';
      buttonContainer.cursor = 'pointer';

      // Button background
      const bg = new Graphics();
      bg.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
      bg.fill({ color: 0x4a1a1a });
      bg.stroke({ width: 2, color: 0x8b0000 });
      buttonContainer.addChild(bg);

      // Part number
      const partNum = new Text({
        text: `PART ${part.id}`,
        style: new TextStyle({
          fontFamily: 'Arial Black',
          fontSize: 24,
          fontWeight: 'bold',
          fill: 0xff6666,
        })
      });
      partNum.anchor.set(0.5, 0.3);
      buttonContainer.addChild(partNum);

      // Part name
      const partName = new Text({
        text: part.name,
        style: new TextStyle({
          fontFamily: 'Arial',
          fontSize: 14,
          fill: 0xffffff,
          align: 'center',
        })
      });
      partName.anchor.set(0.5, 0.5);
      buttonContainer.addChild(partName);

      // Level requirement
      const levelReq = new Text({
        text: `Lv.${part.minLevel}`,
        style: new TextStyle({
          fontFamily: 'Arial',
          fontSize: 12,
          fill: 0xaaaaaa,
        })
      });
      levelReq.anchor.set(0.5, 0.8);
      buttonContainer.addChild(levelReq);

      // Hover effects
      buttonContainer.on('pointerenter', () => {
        bg.clear();
        bg.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
        bg.fill({ color: 0x6a2a2a });
        bg.stroke({ width: 3, color: 0xff4444 });
        partNum.scale.set(1.1);
      });

      buttonContainer.on('pointerleave', () => {
        bg.clear();
        bg.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
        bg.fill({ color: 0x4a1a1a });
        bg.stroke({ width: 2, color: 0x8b0000 });
        partNum.scale.set(1);
      });

      buttonContainer.on('pointerup', () => {
        console.log(`Starting Story Part ${part.id}: ${part.name}`);
        // TODO: Start the actual story mode with this part
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
