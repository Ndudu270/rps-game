import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { SceneManager, IScene } from './SceneManager';

export class SettingsScene implements IScene {
  container: Container;
  private sceneManager: SceneManager;
  private volumeValue: number;
  private qualityIndex: number;
  private qualityText: Text;
  private qualityOptions: string[];

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.container = new Container();
    this.volumeValue = 0.7;
    this.qualityIndex = 1;
    this.qualityOptions = ['Low', 'Medium', 'High'];
    this.qualityText = new Text({ text: '', style: {} });
  }

  onEnter(): void {
    this.createBackground();
    this.createTitle();
    this.createVolumeSlider();
    this.createQualityToggle();
    this.createBackButton();
  }

  onExit(): void {}

  private createBackground(): void {
    const bg = new Graphics();
    bg.rect(0, 0, 1024, 768);
    bg.fill({ color: 0x0a0a15 });
    for (let i = 0; i < 768; i += 4) {
      const ratio = i / 768;
      const r = Math.floor(10 + ratio * 20);
      const g = Math.floor(10 + ratio * 5);
      const b = Math.floor(21 + ratio * 30);
      bg.rect(0, i, 1024, 4);
      bg.fill({ color: `rgb(${r}, ${g}, ${b})`, alpha: 0.5 });
    }
    this.container.addChild(bg);
  }

  private createTitle(): void {
    const titleStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 48,
      fontWeight: 'bold',
      fill: 0xffffff,
      stroke: { color: 0x4444ff, width: 3 },
      dropShadow: { blur: 6, color: '#000000', angle: Math.PI / 6, distance: 4 },
    });
    const title = new Text({ text: 'SETTINGS', style: titleStyle });
    title.anchor.set(0.5);
    title.position.set(512, 100);
    this.container.addChild(title);
  }

  private createVolumeSlider(): void {
    const sliderX = 512, sliderY = 250, trackWidth = 300, trackHeight = 20;
    const label = new Text({ text: 'Volume', style: new TextStyle({ fontFamily: 'Arial', fontSize: 20, fill: 0xffffff }) });
    label.anchor.set(0.5, 1);
    label.position.set(sliderX, sliderY - 30);
    this.container.addChild(label);
    const track = new Graphics();
    track.roundRect(-trackWidth / 2, -trackHeight / 2, trackWidth, trackHeight, 10);
    track.fill({ color: 0x2a2a4e });
    track.stroke({ width: 2, color: 0x4444ff });
    track.position.set(sliderX, sliderY);
    this.container.addChild(track);
    const fill = new Graphics();
    fill.roundRect(-trackWidth / 2 + 2, -trackHeight / 2 + 2, (trackWidth - 4) * this.volumeValue, trackHeight - 4, 8);
    fill.fill({ color: 0x4444aa });
    fill.position.set(sliderX, sliderY);
    this.container.addChild(fill);
    const handle = new Graphics();
    handle.circle(0, 0, 15);
    handle.fill({ color: 0x6666ff });
    handle.stroke({ width: 3, color: 0xffffff });
    handle.position.set(sliderX - trackWidth / 2 + trackWidth * this.volumeValue, sliderY);
    handle.eventMode = 'static';
    handle.cursor = 'pointer';
    this.container.addChild(handle);
    const valueText = new Text({ text: `${Math.round(this.volumeValue * 100)}%`, style: new TextStyle({ fontFamily: 'Arial', fontSize: 16, fill: 0xaaaaaa }) });
    valueText.anchor.set(0.5, 0);
    valueText.position.set(sliderX, sliderY + 35);
    this.container.addChild(valueText);
    let isDragging = false;
    handle.on('pointerdown', () => { isDragging = true; });
    this.container.eventMode = 'static';
    this.container.on('pointermove', (e) => {
      if (!isDragging) return;
      const newX = Math.max(sliderX - trackWidth / 2, Math.min(sliderX + trackWidth / 2, e.global.x));
      this.volumeValue = (newX - (sliderX - trackWidth / 2)) / trackWidth;
      handle.position.x = newX;
      fill.clear();
      fill.roundRect(-trackWidth / 2 + 2, -trackHeight / 2 + 2, (trackWidth - 4) * this.volumeValue, trackHeight - 4, 8);
      fill.fill({ color: 0x4444aa });
      fill.position.set(sliderX, sliderY);
      valueText.text = `${Math.round(this.volumeValue * 100)}%`;
    });
    this.container.on('pointerup', () => { isDragging = false; });
    this.container.on('pointerupoutside', () => { isDragging = false; });
  }

  private createQualityToggle(): void {
    const toggleX = 512, toggleY = 380;
    const label = new Text({ text: 'Graphics Quality', style: new TextStyle({ fontFamily: 'Arial', fontSize: 20, fill: 0xffffff }) });
    label.anchor.set(0.5, 1);
    label.position.set(toggleX, toggleY - 30);
    this.container.addChild(label);
    const toggleContainer = new Container();
    toggleContainer.position.set(toggleX, toggleY);
    const bg = new Graphics();
    bg.roundRect(-150, -25, 300, 50, 10);
    bg.fill({ color: 0x2a2a4e });
    bg.stroke({ width: 2, color: 0x4444ff });
    toggleContainer.addChild(bg);
    this.qualityText = new Text({ text: this.qualityOptions[this.qualityIndex], style: new TextStyle({ fontFamily: 'Arial', fontSize: 20, fontWeight: 'bold', fill: 0xffffff }) });
    this.qualityText.anchor.set(0.5);
    toggleContainer.addChild(this.qualityText);
    const leftArrow = new Text({ text: '<', style: new TextStyle({ fontSize: 24, fill: 0xffffff }) });
    leftArrow.anchor.set(0.5);
    leftArrow.position.set(-120, 0);
    leftArrow.eventMode = 'static';
    leftArrow.cursor = 'pointer';
    leftArrow.on('pointerenter', () => leftArrow.style.fill = 0xffff00);
    leftArrow.on('pointerleave', () => leftArrow.style.fill = 0xffffff);
    leftArrow.on('pointerup', () => this.cycleQuality(-1));
    toggleContainer.addChild(leftArrow);
    const rightArrow = new Text({ text: '>', style: new TextStyle({ fontSize: 24, fill: 0xffffff }) });
    rightArrow.anchor.set(0.5);
    rightArrow.position.set(120, 0);
    rightArrow.eventMode = 'static';
    rightArrow.cursor = 'pointer';
    rightArrow.on('pointerenter', () => rightArrow.style.fill = 0xffff00);
    rightArrow.on('pointerleave', () => rightArrow.style.fill = 0xffffff);
    rightArrow.on('pointerup', () => this.cycleQuality(1));
    toggleContainer.addChild(rightArrow);
    this.container.addChild(toggleContainer);
  }

  private cycleQuality(direction: number): void {
    this.qualityIndex += direction;
    if (this.qualityIndex < 0) this.qualityIndex = this.qualityOptions.length - 1;
    if (this.qualityIndex >= this.qualityOptions.length) this.qualityIndex = 0;
    this.qualityText.text = this.qualityOptions[this.qualityIndex];
  }

  private createBackButton(): void {
    const buttonContainer = new Container();
    buttonContainer.position.set(512, 550);
    const bg = new Graphics();
    const width = 200, height = 50;
    bg.roundRect(-width / 2, -height / 2, width, height, 10);
    bg.fill({ color: 0x3a3a5e });
    bg.stroke({ width: 2, color: 0x5555aa });
    const text = new Text({ text: 'Back', style: new TextStyle({ fontFamily: 'Arial', fontSize: 20, fontWeight: 'bold', fill: 0xffffff }) });
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
