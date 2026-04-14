import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { SceneManager, IScene } from '../SceneManager';

export class TowerModeSelectScene implements IScene {
  container: Container;
  private sceneManager: SceneManager;

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.container = new Container();
  }

  onEnter(): void {
    this.createBackground();
    this.createTitle();
    this.createFloorGrid();
    this.createBackButton();
  }

  onExit(): void {}

  update(delta: number): void {}

  private createBackground(): void {
    const bg = new Graphics();
    bg.rect(0, 0, 1024, 768);
    bg.fill({ color: 0x0a0a1a });
    this.container.addChild(bg);

    // Add decorative border
    const border = new Graphics();
    border.stroke({ width: 4, color: 0x6633aa });
    border.rect(10, 10, 1004, 748);
    this.container.addChild(border);
  }

  private createTitle(): void {
    const title = new Text({
      text: 'TOWER MODE',
      style: new TextStyle({
        fontFamily: 'Arial Black',
        fontSize: 48,
        fontWeight: 'bold',
        fill: 0xaa66ff,
        stroke: { color: 0x000000, width: 3 },
      })
    });
    title.anchor.set(0.5);
    title.position.set(512, 80);
    this.container.addChild(title);

    const subtitle = new Text({
      text: 'Climb 100 Floors - Increasing Difficulty',
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

  private createFloorGrid(): void {
    const startX = 100;
    const startY = 180;
    const buttonWidth = 60;
    const buttonHeight = 50;
    const columns = 10;
    const rows = 10;
    const hGap = 15;
    const vGap = 12;

    for (let floor = 1; floor <= 100; floor++) {
      const col = (floor - 1) % columns;
      const row = Math.floor((floor - 1) / columns);
      const x = startX + col * (buttonWidth + hGap);
      const y = startY + row * (buttonHeight + vGap);

      const buttonContainer = new Container();
      buttonContainer.position.set(x + buttonWidth / 2, y + buttonHeight / 2);
      buttonContainer.eventMode = 'static';
      buttonContainer.cursor = 'pointer';

      // Determine floor tier color
      let floorColor = 0x3a2a5a; // Normal floors
      let borderColor = 0x6633aa;
      if (floor % 10 === 0) {
        floorColor = 0x5a1a3a; // Boss floors
        borderColor = 0xff4444;
      } else if (floor % 5 === 0) {
        floorColor = 0x4a3a1a; // Elite floors
        borderColor = 0xffaa00;
      }

      // Button background
      const bg = new Graphics();
      bg.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 5);
      bg.fill({ color: floorColor });
      bg.stroke({ width: 2, color: borderColor });
      buttonContainer.addChild(bg);

      // Floor number
      const floorNum = new Text({
        text: `${floor}`,
        style: new TextStyle({
          fontFamily: 'Arial Black',
          fontSize: 18,
          fontWeight: 'bold',
          fill: 0xffffff,
        })
      });
      floorNum.anchor.set(0.5);
      buttonContainer.addChild(floorNum);

      // Hover effects
      buttonContainer.on('pointerenter', () => {
        bg.clear();
        bg.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 5);
        bg.fill({ color: floorColor * 1.3 });
        bg.stroke({ width: 3, color: borderColor });
        floorNum.scale.set(1.2);
      });

      buttonContainer.on('pointerleave', () => {
        bg.clear();
        bg.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 5);
        bg.fill({ color: floorColor });
        bg.stroke({ width: 2, color: borderColor });
        floorNum.scale.set(1);
      });

      buttonContainer.on('pointerup', () => {
        console.log(`Starting Tower Floor ${floor}`);
        // TODO: Start the actual tower mode with this floor
        this.sceneManager.switchScene('hub');
      });

      this.container.addChild(buttonContainer);
    }

    // Legend
    const legendY = 700;
    const legendItems = [
      { color: 0x3a2a5a, label: 'Normal' },
      { color: 0x4a3a1a, label: 'Elite (x5)' },
      { color: 0x5a1a3a, label: 'Boss (x10)' },
    ];

    let legendX = 300;
    legendItems.forEach(item => {
      const icon = new Graphics();
      icon.rect(0, 0, 20, 20);
      icon.fill({ color: item.color });
      icon.stroke({ width: 1, color: 0xffffff });
      icon.position.set(legendX, legendY);
      this.container.addChild(icon);

      const label = new Text({
        text: item.label,
        style: new TextStyle({
          fontFamily: 'Arial',
          fontSize: 14,
          fill: 0xcccccc,
        })
      });
      label.anchor.set(0, 0.5);
      label.position.set(legendX + 25, legendY + 10);
      this.container.addChild(label);

      legendX += 150;
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
