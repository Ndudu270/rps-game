import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { SceneManager, IScene } from './SceneManager';

export class HubScene implements IScene {
  container: Container;
  private sceneManager: SceneManager;
  private playerData: any | null;
  private backgroundGraphics: Graphics;
  private particles: Graphics[];
  private particleFrame: number;

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.container = new Container();
    this.playerData = null;
    this.backgroundGraphics = new Graphics();
    this.particles = [];
    this.particleFrame = 0;
  }

  onEnter(): void {
    this.loadPlayerData();
    this.createBackground();
    this.createParticles();
    this.createPlayerInfo();
    this.createModeButtons();
    this.createSideButtons();
    this.startParticleAnimation();
  }

  onExit(): void {
    this.stopParticleAnimation();
  }

  update(delta: number): void {
    this.particleFrame += delta;
    this.updateParticles();
  }

  private loadPlayerData(): void {
    if (typeof localStorage !== 'undefined') {
      const savedData = localStorage.getItem('playerData');
      if (savedData) {
        this.playerData = JSON.parse(savedData);
      }
    }
  }

  private createBackground(): void {
    const width = 1024;
    const height = 768;

    // Dark gradient background
    for (let i = 0; i < height; i += 3) {
      const ratio = i / height;
      const r = Math.floor(10 + ratio * 20);
      const g = Math.floor(5 + ratio * 10);
      const b = Math.floor(20 + ratio * 35);
      this.backgroundGraphics.rect(0, i, width, 3);
      this.backgroundGraphics.fill(`rgb(${r}, ${g}, ${b})`);
    }

    // Add background first so fog layers can be added at index 1
    this.container.addChildAt(this.backgroundGraphics, 0);

    // Add atmospheric fog layers
    this.createFogLayer(0.05, 0x2a2a4a, 100);
    this.createFogLayer(0.08, 0x1a1a3a, 150);
    this.createFogLayer(0.03, 0x3a3a5a, 80);
  }

  private createFogLayer(alpha: number, color: number, yOffset: number): void {
    const fog = new Graphics();
    fog.alpha = alpha;
    
    for (let i = 0; i < 15; i++) {
      const x = (i * 80) + (Math.sin(i * 0.5) * 20);
      const y = yOffset + (Math.cos(i * 0.3) * 30);
      const radius = 80 + Math.sin(i) * 40;
      
      fog.circle(x, y, radius);
      fog.fill({ color });
    }
    
    this.container.addChildAt(fog, 1);
  }

  private createParticles(): void {
    for (let i = 0; i < 50; i++) {
      const particle = new Graphics();
      const size = Math.random() * 3 + 1;
      particle.circle(0, 0, size);
      particle.fill({ color: 0x6666ff, alpha: Math.random() * 0.5 + 0.2 });
      particle.position.set(
        Math.random() * 1024,
        Math.random() * 768
      );
      (particle as any).speedY = Math.random() * 0.5 + 0.2;
      (particle as any).speedX = (Math.random() - 0.5) * 0.3;
      (particle as any).originalY = particle.position.y;
      this.particles.push(particle);
      this.container.addChild(particle);
    }
  }

  private updateParticles(): void {
    this.particles.forEach((particle) => {
      particle.position.y -= (particle as any).speedY;
      particle.position.x += (particle as any).speedX;
      
      if (particle.position.y < -10) {
        particle.position.y = 778;
        particle.position.x = Math.random() * 1024;
      }
      
      // Gentle sway
      particle.position.x += Math.sin(this.particleFrame * 0.02 + particle.position.y * 0.01) * 0.2;
    });
  }

  private startParticleAnimation(): void {
    // Animation handled in update loop
  }

  private stopParticleAnimation(): void {
    // Cleanup if needed
  }

  private createPlayerInfo(): void {
    if (!this.playerData) {
      return;
    }

    const infoContainer = new Container();
    infoContainer.position.set(20, 20);

    const nameStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 20,
      fontWeight: 'bold',
      fill: 0xffd700,
      stroke: { color: 0x000000, width: 2 },
    });
    const nameText = new Text({ text: `${this.playerData.name}`, style: nameStyle });
    infoContainer.addChild(nameText);

    const classStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xcccccc,
    });
    const classText = new Text({ 
      text: `Level 1 ${this.playerData.race} ${this.playerData.class}`, 
      style: classStyle 
    });
    classText.position.y = 25;
    infoContainer.addChild(classText);

    // Small stat preview
    const statsStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 11,
      fill: 0x888888,
    });
    const statsText = new Text({ 
      text: `STR:${this.playerData.stats.strength} AGI:${this.playerData.stats.agility} INT:${this.playerData.stats.intelligence}`, 
      style: statsStyle 
    });
    statsText.position.y = 45;
    infoContainer.addChild(statsText);

    this.container.addChild(infoContainer);
  }

  private createModeButtons(): void {
    // New RPG structure modes - matching the new game design
    const modes = [
      { name: 'Story Mode', desc: '10-Part Campaign', color: 0x8b0000, glow: 0xff4444, scene: 'storyModeSelect' },
      { name: 'Tower Mode', desc: 'Climb 100 Floors', color: 0x6633aa, glow: 0xaa66ff, scene: 'towerModeSelect' },
      { name: 'Survival', desc: 'Endless Waves', color: 0x006644, glow: 0x00ff88, scene: 'survivalModeSelect' },
      { name: 'Training', desc: 'Practice Combat', color: 0x446666, glow: 0x88cccc, scene: 'trainingModeSelect' },
      { name: 'Duels', desc: 'PvP Battles', color: 0x4444aa, glow: 0x6666ff, scene: 'duelModeSelect' },
    ];

    const startY = 180;
    const buttonWidth = 380;
    const buttonHeight = 70;
    const spacing = 15;

    modes.forEach((mode, index) => {
      const buttonContainer = new Container();
      buttonContainer.position.set(512, startY + index * (buttonHeight + spacing));
      buttonContainer.eventMode = 'static';
      buttonContainer.cursor = 'pointer';

      // Button background
      const bg = new Graphics();
      this.drawModeButtonBg(bg, buttonWidth, buttonHeight, mode.color, false);
      buttonContainer.addChild(bg);

      // Glow effect
      const glow = new Graphics();
      glow.alpha = 0;
      this.drawModeButtonBg(glow, buttonWidth + 4, buttonHeight + 4, mode.glow, true);
      buttonContainer.addChild(glow);

      // Title text
      const titleStyle = new TextStyle({
        fontFamily: 'Arial Black',
        fontSize: 22,
        fontWeight: 'bold',
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 2 },
      });
      const title = new Text({ text: mode.name, style: titleStyle });
      title.anchor.set(0.5, 0.3);
      buttonContainer.addChild(title);

      // Description text
      const descStyle = new TextStyle({
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0xcccccc,
      });
      const desc = new Text({ text: mode.desc, style: descStyle });
      desc.anchor.set(0.5, 0.8);
      buttonContainer.addChild(desc);

      // Hover effects
      buttonContainer.on('pointerenter', () => {
        bg.clear();
        this.drawModeButtonBg(bg, buttonWidth, buttonHeight, mode.color, true);
        glow.alpha = 0.6;
        title.scale.set(1.05);
      });

      buttonContainer.on('pointerleave', () => {
        bg.clear();
        this.drawModeButtonBg(bg, buttonWidth, buttonHeight, mode.color, false);
        glow.alpha = 0;
        title.scale.set(1);
      });

      // Click handler - navigate to mode selection scene
      buttonContainer.on('pointerup', () => {
        this.sceneManager.switchScene(mode.scene);
      });

      (buttonContainer as any).bg = bg;
      (buttonContainer as any).glow = glow;
      (buttonContainer as any).title = title;

      this.container.addChild(buttonContainer);
    });
  }

  private drawModeButtonBg(g: Graphics, w: number, h: number, color: number, highlighted: boolean): void {
    const radius = 8;
    
    // Main shape with beveled edges
    g.moveTo(-w/2 + radius, -h/2);
    g.lineTo(w/2 - radius, -h/2);
    g.quadraticCurveTo(w/2, -h/2, w/2, -h/2 + radius);
    g.lineTo(w/2, h/2 - radius);
    g.quadraticCurveTo(w/2, h/2, w/2 - radius, h/2);
    g.lineTo(-w/2 + radius, h/2);
    g.quadraticCurveTo(-w/2, h/2, -w/2, h/2 - radius);
    g.lineTo(-w/2, -h/2 + radius);
    g.quadraticCurveTo(-w/2, -h/2, -w/2 + radius, -h/2);
    
    if (highlighted) {
      g.fill({ color });
      g.stroke({ width: 3, color: 0xffffff, alpha: 0.5 });
    } else {
      g.fill({ color, alpha: 0.8 });
      g.stroke({ width: 2, color: color, alpha: 0.5 });
    }

    // Inner highlight
    if (highlighted) {
      const innerG = new Graphics();
      innerG.moveTo(-w/2 + 10, -h/2 + 5);
      innerG.lineTo(w/2 - 10, -h/2 + 5);
      innerG.stroke({ width: 1, color: 0xffffff, alpha: 0.3 });
    }
  }


  private createSideButtons(): void {
    const sideButtons = [
      { name: 'Character', y: 150, scene: 'character' as const },
      { name: 'Skill Shop', y: 230, scene: 'skillShop' as const },
      { name: 'Equipment', y: 310, scene: 'equipmentShop' as const },
      { name: 'Settings', y: 390, scene: 'settings' as const },
    ];

    const buttonWidth = 140;
    const buttonHeight = 50;

    sideButtons.forEach((btn) => {
      const buttonContainer = new Container();
      buttonContainer.position.set(920, btn.y);
      buttonContainer.eventMode = 'static';
      buttonContainer.cursor = 'pointer';

      const bg = new Graphics();
      bg.roundRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 8);
      bg.fill({ color: 0x2a2a4e });
      bg.stroke({ width: 2, color: 0x4444ff });
      buttonContainer.addChild(bg);

      const style = new TextStyle({
        fontFamily: 'Arial',
        fontSize: 14,
        fontWeight: 'bold',
        fill: 0xffffff,
      });
      const text = new Text({ text: btn.name, style });
      text.anchor.set(0.5);
      buttonContainer.addChild(text);

      // Hover effects
      buttonContainer.on('pointerenter', () => {
        bg.clear();
        bg.roundRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 8);
        bg.fill({ color: 0x4444aa });
        bg.stroke({ width: 2, color: 0x6666ff });
        text.scale.set(1.05);
      });

      buttonContainer.on('pointerleave', () => {
        bg.clear();
        bg.roundRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 8);
        bg.fill({ color: 0x2a2a4e });
        bg.stroke({ width: 2, color: 0x4444ff });
        text.scale.set(1);
      });

      // Click handler - navigate to dedicated scene
      buttonContainer.on('pointerup', () => {
        this.sceneManager.switchScene(btn.scene);
      });

      (buttonContainer as any).bg = bg;
      (buttonContainer as any).text = text;

      this.container.addChild(buttonContainer);
    });
  }

}
