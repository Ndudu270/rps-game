import { Container, Graphics, Text, TextStyle, Assets } from 'pixi.js';
import { SceneManager, IScene } from './SceneManager';

export class HubScene implements IScene {
  container: Container;
  private sceneManager: SceneManager;
  private playerData: any | null;
  private overlays: Map<string, Container>;
  private currentOverlay: string | null;
  private backgroundGraphics: Graphics;
  private particles: Graphics[];
  private particleFrame: number;

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.container = new Container();
    this.playerData = null;
    this.overlays = new Map();
    this.currentOverlay = null;
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
    this.createOverlays();
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
    const modes = [
      { name: 'Story Mode', desc: 'Main Campaign', color: 0x8b0000, glow: 0xff4444 },
      { name: 'Duels', desc: 'PvP Matchmaking', color: 0x4444aa, glow: 0x6666ff },
      { name: 'Tournaments', desc: 'Bracket Battles', color: 0xaa8800, glow: 0xffcc00 },
      { name: 'Underworld', desc: 'Boss Raids', color: 0x440044, glow: 0xff00ff },
      { name: 'Survival', desc: 'Endless Waves', color: 0x006644, glow: 0x00ff88 },
      { name: 'Training', desc: 'Practice Mode', color: 0x446666, glow: 0x88cccc },
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

      // Click handler
      buttonContainer.on('pointerup', () => {
        this.handleModeClick(mode.name);
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

  private handleModeClick(modeName: string): void {
    // Show loading overlay briefly then switch to placeholder
    const loadingMessages: Record<string, string> = {
      'Story Mode': 'Story Loading...',
      'Duels': 'Matchmaking...',
      'Tournaments': 'Tournament Lobby...',
      'Underworld': 'Summoning Boss...',
      'Survival': 'Preparing Arena...',
      'Training': 'Training Ground...',
    };

    // For now, just log and show a temporary message
    console.log(`Loading ${modeName}: ${loadingMessages[modeName]}`);
    
    // Create temporary loading overlay
    this.showTemporaryLoading(loadingMessages[modeName]);
  }

  private showTemporaryLoading(message: string): void {
    const overlay = new Container();
    overlay.position.set(512, 384);
    
    // Semi-transparent background
    const bg = new Graphics();
    bg.rect(-300, -100, 600, 200);
    bg.fill({ color: 0x000000, alpha: 0.8 });
    overlay.addChild(bg);

    const style = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 32,
      fontWeight: 'bold',
      fill: 0xffffff,
      stroke: { color: 0x4444ff, width: 2 },
    });
    const text = new Text({ text: message, style });
    text.anchor.set(0.5);
    overlay.addChild(text);

    this.container.addChild(overlay);

    // Remove after 1.5 seconds
    setTimeout(() => {
      this.container.removeChild(overlay);
    }, 1500);
  }

  private createSideButtons(): void {
    const sideButtons = [
      { name: 'Character', y: 150 },
      { name: 'Shop', y: 230 },
      { name: 'Inventory', y: 310 },
      { name: 'Achievements', y: 390 },
      { name: 'Settings', y: 470 },
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

      // Click handler
      buttonContainer.on('pointerup', () => {
        this.openOverlay(btn.name);
      });

      (buttonContainer as any).bg = bg;
      (buttonContainer as any).text = text;

      this.container.addChild(buttonContainer);
    });
  }

  private createOverlays(): void {
    this.createCharacterOverlay();
    this.createShopOverlay();
    this.createInventoryOverlay();
    this.createAchievementsOverlay();
    this.createSettingsOverlay();
  }

  private createBaseOverlay(title: string, contentCallback: (container: Container) => void): Container {
    const overlay = new Container();
    overlay.visible = false;

    // Dimmed background
    const dimBg = new Graphics();
    dimBg.rect(0, 0, 1024, 768);
    dimBg.fill({ color: 0x000000, alpha: 0.7 });
    overlay.addChild(dimBg);

    // Main panel
    const panel = new Graphics();
    panel.position.set(512, 384);
    panel.roundRect(-350, -250, 700, 500, 15);
    panel.fill({ color: 0x1a1a3e });
    panel.stroke({ width: 3, color: 0x4444ff });
    overlay.addChild(panel);

    // Title bar
    const titleBar = new Graphics();
    titleBar.position.set(512, 150);
    titleBar.roundRect(-350, -30, 700, 60, 10);
    titleBar.fill({ color: 0x2a2a5e });
    overlay.addChild(titleBar);

    const titleStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 28,
      fontWeight: 'bold',
      fill: 0xffd700,
      stroke: { color: 0x000000, width: 2 },
    });
    const titleText = new Text({ text: title, style: titleStyle });
    titleText.anchor.set(0.5);
    titleText.position.set(512, 150);
    overlay.addChild(titleText);

    // Close button
    const closeBtn = new Container();
    closeBtn.position.set(820, 130);
    closeBtn.eventMode = 'static';
    closeBtn.cursor = 'pointer';

    const closeBg = new Graphics();
    closeBg.circle(0, 0, 20);
    closeBg.fill({ color: 0xaa2222 });
    closeBtn.addChild(closeBg);

    const closeText = new Text({ 
      text: '✕', 
      style: new TextStyle({ fontFamily: 'Arial', fontSize: 20, fontWeight: 'bold', fill: 0xffffff }) 
    });
    closeText.anchor.set(0.5);
    closeBtn.addChild(closeText);

    closeBtn.on('pointerenter', () => {
      closeBg.clear();
      closeBg.circle(0, 0, 20);
      closeBg.fill({ color: 0xff4444 });
    });
    closeBtn.on('pointerleave', () => {
      closeBg.clear();
      closeBg.circle(0, 0, 20);
      closeBg.fill({ color: 0xaa2222 });
    });
    closeBtn.on('pointerup', () => {
      this.closeOverlay();
    });

    overlay.addChild(closeBtn);

    // Content area
    const contentContainer = new Container();
    contentContainer.position.set(512, 384);
    contentCallback(contentContainer);
    overlay.addChild(contentContainer);

    return overlay;
  }

  private createCharacterOverlay(): void {
    const overlay = this.createBaseOverlay('Character', (content) => {
      if (!this.playerData) {
        const noDataStyle = new TextStyle({
          fontFamily: 'Arial',
          fontSize: 18,
          fill: 0xff6666,
        });
        const noData = new Text({ text: 'No character data found.', style: noDataStyle });
        noData.anchor.set(0.5);
        content.addChild(noData);
        return;
      }

      const lines = [
        `Name: ${this.playerData.name}`,
        `Race: ${this.playerData.race}`,
        `Class: ${this.playerData.class}`,
        `Background: ${this.playerData.background}`,
        '',
        'Stats:',
        `  Strength: ${this.playerData.stats.strength}`,
        `  Agility: ${this.playerData.stats.agility}`,
        `  Intelligence: ${this.playerData.stats.intelligence}`,
        `  Charisma: ${this.playerData.stats.charisma}`,
        `  Endurance: ${this.playerData.stats.endurance}`,
        `  Perception: ${this.playerData.stats.perception}`,
        `  Luck: ${this.playerData.stats.luck}`,
        '',
        `Talents: ${this.playerData.talents.length > 0 ? this.playerData.talents.join(', ') : 'None'}`,
      ];

      const style = new TextStyle({
        fontFamily: 'Arial',
        fontSize: 16,
        fill: 0xffffff,
        lineHeight: 26,
      });
      const text = new Text({ text: lines.join('\n'), style });
      text.anchor.set(0.5, 0);
      text.position.y = -150;
      content.addChild(text);
    });

    this.overlays.set('Character', overlay);
    this.container.addChild(overlay);
  }

  private createShopOverlay(): void {
    const overlay = this.createBaseOverlay('Shop', (content) => {
      const style = new TextStyle({
        fontFamily: 'Arial',
        fontSize: 18,
        fill: 0xcccccc,
        align: 'center',
      });
      const text = new Text({ 
        text: 'Coming Soon!\n\nWeapons, gear, and upgrades will be available here.', 
        style,
      });
      text.anchor.set(0.5);
      content.addChild(text);
    });

    this.overlays.set('Shop', overlay);
    this.container.addChild(overlay);
  }

  private createInventoryOverlay(): void {
    const overlay = this.createBaseOverlay('Inventory', (content) => {
      const style = new TextStyle({
        fontFamily: 'Arial',
        fontSize: 18,
        fill: 0xcccccc,
        align: 'center',
      });
      const text = new Text({ 
        text: 'Coming Soon!\n\nYour items and equipment will be displayed here.', 
        style,
      });
      text.anchor.set(0.5);
      content.addChild(text);
    });

    this.overlays.set('Inventory', overlay);
    this.container.addChild(overlay);
  }

  private createAchievementsOverlay(): void {
    const overlay = this.createBaseOverlay('Achievements', (content) => {
      const style = new TextStyle({
        fontFamily: 'Arial',
        fontSize: 18,
        fill: 0xcccccc,
        align: 'center',
      });
      const text = new Text({ 
        text: 'Coming Soon!\n\nTrack your progress and milestones here.', 
        style,
      });
      text.anchor.set(0.5);
      content.addChild(text);
    });

    this.overlays.set('Achievements', overlay);
    this.container.addChild(overlay);
  }

  private createSettingsOverlay(): void {
    const overlay = this.createBaseOverlay('Settings', (content) => {
      let yPos = -100;

      // Volume slider
      const volumeLabel = new Text({ 
        text: 'Volume', 
        style: new TextStyle({ fontFamily: 'Arial', fontSize: 18, fill: 0xffffff }) 
      });
      volumeLabel.anchor.set(0, 0.5);
      volumeLabel.position.set(-200, yPos);
      content.addChild(volumeLabel);

      const volumeSliderBg = new Graphics();
      volumeSliderBg.roundRect(-50, yPos - 15, 200, 30, 5);
      volumeSliderBg.fill({ color: 0x3a3a5e });
      content.addChild(volumeSliderBg);

      const volumeFill = new Graphics();
      volumeFill.roundRect(-50, yPos - 15, 100, 30, 5);
      volumeFill.fill({ color: 0x4444ff });
      content.addChild(volumeFill);

      yPos += 80;

      // Graphics quality toggle
      const graphicsLabel = new Text({ 
        text: 'Graphics Quality', 
        style: new TextStyle({ fontFamily: 'Arial', fontSize: 18, fill: 0xffffff }) 
      });
      graphicsLabel.anchor.set(0, 0.5);
      graphicsLabel.position.set(-200, yPos);
      content.addChild(graphicsLabel);

      const qualityOptions = ['Low', 'Medium', 'High'];
      let selectedQuality = 1;

      qualityOptions.forEach((opt, idx) => {
        const btn = new Container();
        btn.position.set(-50 + idx * 120, yPos);
        btn.eventMode = 'static';
        btn.cursor = 'pointer';

        const bg = new Graphics();
        bg.roundRect(-50, -15, 100, 30, 5);
        bg.fill({ color: idx === selectedQuality ? 0x4444ff : 0x3a3a5e });
        btn.addChild(bg);

        const txt = new Text({ 
          text: opt, 
          style: new TextStyle({ fontFamily: 'Arial', fontSize: 14, fill: 0xffffff }) 
        });
        txt.anchor.set(0.5);
        btn.addChild(txt);

        btn.on('pointerenter', () => {
          if (idx !== selectedQuality) {
            bg.clear();
            bg.roundRect(-50, -15, 100, 30, 5);
            bg.fill({ color: 0x5555aa });
          }
        });

        btn.on('pointerleave', () => {
          if (idx !== selectedQuality) {
            bg.clear();
            bg.roundRect(-50, -15, 100, 30, 5);
            bg.fill({ color: 0x3a3a5e });
          }
        });

        btn.on('pointerup', () => {
          selectedQuality = idx;
          // Update all buttons
          qualityOptions.forEach((_, optIdx) => {
            const child = content.children[content.children.length - (qualityOptions.length - optIdx)];
            if (child instanceof Container) {
              const bgChild = child.children[0] as Graphics;
              const isSel = optIdx === selectedQuality;
              bgChild.clear();
              bgChild.roundRect(-50, -15, 100, 30, 5);
              bgChild.fill({ color: isSel ? 0x4444ff : 0x3a3a5e });
            }
          });
        });

        content.addChild(btn);
      });

      yPos += 100;

      const infoStyle = new TextStyle({
        fontFamily: 'Arial',
        fontSize: 14,
        fill: 0x888888,
      });
      const info = new Text({ 
        text: '(Visual only - settings not saved)', 
        style: infoStyle 
      });
      info.anchor.set(0.5);
      info.position.y = yPos;
      content.addChild(info);
    });

    this.overlays.set('Settings', overlay);
    this.container.addChild(overlay);
  }

  private openOverlay(name: string): void {
    // Check if opening Inventory or Shop - use dedicated scenes instead
    if (name === 'Inventory') {
      this.sceneManager.switchScene('inventory');
      return;
    }
    if (name === 'Shop') {
      this.sceneManager.switchScene('shop');
      return;
    }
    
    this.closeOverlay();
    const overlay = this.overlays.get(name);
    if (overlay) {
      overlay.visible = true;
      this.currentOverlay = name;
    }
  }

  private closeOverlay(): void {
    this.overlays.forEach((overlay) => {
      overlay.visible = false;
    });
    this.currentOverlay = null;
  }
}
