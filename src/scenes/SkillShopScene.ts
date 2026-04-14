import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { IScene, SceneManager } from './SceneManager';
import { loadPlayerData, savePlayerData } from '../systems/PlayerDataManager';
import { SkillSystem } from '../systems/SkillSystem';
import { getSkillById } from '../data/skills';

export class SkillShopScene implements IScene {
  container: Container;
  private sceneManager: SceneManager;
  private skillListContainer!: Container;
  private characterInfoText!: Text;
  private backButton!: Text;
  private skills: any[] = [];

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.container = new Container();
  }

  onEnter(): void {
    this.create();
  }

  onExit(): void {
    this.container.removeChildren();
  }

  private create() {
    const width = 1024;
    const height = 768;

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, width, height);
    bg.fill(0x1a1a2e);
    this.container.addChild(bg);

    // Title
    const title = new Text('Skill Shop', {
      fontSize: 32,
      fontWeight: 'bold',
      fill: '#ffffff',
    });
    title.anchor.set(0.5, 0);
    title.position.set(width / 2, 40);
    this.container.addChild(title);

    // Load player data
    const playerData = loadPlayerData();
    if (!playerData || !playerData.character) {
      this.showErrorMessage('No character found');
      return;
    }

    const character = playerData.character;

    // Character info panel
    const infoPanel = new Graphics();
    infoPanel.rect(10, 60, 300, 80);
    infoPanel.fill(0x16213e);
    infoPanel.stroke({ width: 2, color: 0x4a90d9 });
    this.container.addChild(infoPanel);

    this.characterInfoText = new Text('', {
      fontSize: 14,
      fill: '#ffffff',
      align: 'center',
    });
    this.characterInfoText.anchor.set(0.5);
    this.characterInfoText.position.set(160, 100);
    this.container.addChild(this.characterInfoText);

    this.updateCharacterInfo(character);

    // Get skill shop items
    this.skills = SkillSystem.getSkillShopItems(character);

    // Scrollable skill list container
    const listX = width / 2;
    const listY = 220;
    const listWidth = 700;
    const listHeight = 450;

    // List background
    const listBg = new Graphics();
    listBg.rect(listX - listWidth / 2, listY - listHeight / 2, listWidth, listHeight);
    listBg.fill(0x0f0f23);
    listBg.stroke({ width: 2, color: 0x4a90d9 });
    this.container.addChild(listBg);

    // Create scrollable area mask
    const maskGraphics = new Graphics();
    maskGraphics.rect(listX - listWidth / 2, listY - listHeight / 2, listWidth, listHeight);
    maskGraphics.fill(0xffffff);
    this.container.addChild(maskGraphics);
    
    const mask = maskGraphics;

    this.skillListContainer = new Container();
    this.skillListContainer.position.set(listX, listY - listHeight / 2 + 20);
    this.skillListContainer.mask = mask;
    this.container.addChild(this.skillListContainer);

    // Render skill items
    this.renderSkillList();

    // Scroll buttons
    const scrollUpBtn = new Text('▲', {
      fontSize: 24,
      fill: '#4a90d9',
    });
    scrollUpBtn.anchor.set(0.5);
    scrollUpBtn.position.set(listX + listWidth / 2 - 60, listY - listHeight / 2 - 20);
    scrollUpBtn.eventMode = 'static';
    scrollUpBtn.cursor = 'pointer';
    this.container.addChild(scrollUpBtn);

    const scrollDownBtn = new Text('▼', {
      fontSize: 24,
      fill: '#4a90d9',
    });
    scrollDownBtn.anchor.set(0.5);
    scrollDownBtn.position.set(listX + listWidth / 2 - 20, listY - listHeight / 2 - 20);
    scrollDownBtn.eventMode = 'static';
    scrollDownBtn.cursor = 'pointer';
    this.container.addChild(scrollDownBtn);

    scrollUpBtn.on('pointerdown', () => {
      this.scrollList(100);
    });

    scrollDownBtn.on('pointerdown', () => {
      this.scrollList(-100);
    });

    // Back button
    this.backButton = new Text('← Back to Hub', {
      fontSize: 20,
      fill: '#4a90d9',
      fontWeight: 'bold',
    });
    this.backButton.anchor.set(0.5);
    this.backButton.position.set(width / 2, height - 50);
    this.backButton.eventMode = 'static';
    this.backButton.cursor = 'pointer';
    this.container.addChild(this.backButton);

    this.backButton.on('pointerdown', () => {
      this.sceneManager.switchScene('hub');
    });

    this.backButton.on('pointerover', () => {
      this.backButton.style.fill = '#ffffff';
    });

    this.backButton.on('pointerout', () => {
      this.backButton.style.fill = '#4a90d9';
    });
  }

  private updateCharacterInfo(character: any) {
    this.characterInfoText.setText(
      `${character.name} | Lv.${character.level}\n` +
      `Skill Points: ${character.skillPoints}\n` +
      `Class: ${character.class}`
    );
  }

  private renderSkillList() {
    // Clear existing items
    this.skillListContainer.removeChildren();

    const itemHeight = 90;
    const startY = 0;

    this.skills.forEach((skillItem, index) => {
      const y = startY + index * itemHeight;
      const skill = skillItem.skill;

      // Item background
      const bgColor = skillItem.locked ? 0x2a2a2a : skillItem.action === 'upgrade' ? 0x1a3a5c : 0x1a4a3c;
      const bg = new Graphics();
      bg.rect(-340, y - 40, 680, 80);
      bg.fill(bgColor);
      bg.stroke({ width: 2, color: skillItem.locked ? 0x555555 : 0x4a90d9 });
      this.skillListContainer.addChild(bg);

      // Skill name
      const nameText = new Text(skill.name, {
        fontSize: 18,
        fontWeight: 'bold',
        fill: skillItem.locked ? '#888888' : '#ffffff',
      });
      nameText.anchor.set(0, 0.5);
      nameText.position.set(-320, y - 25);
      this.skillListContainer.addChild(nameText);

      // Skill type
      const typeText = new Text(`[${skill.type.toUpperCase()}]`, {
        fontSize: 12,
        fill: '#aaaaaa',
      });
      typeText.position.set(-320, y - 5);
      this.skillListContainer.addChild(typeText);

      // Description
      const descText = new Text(skill.description, {
        fontSize: 12,
        fill: '#cccccc',
        wordWrap: { width: 400 },
      });
      descText.position.set(-320, y + 10);
      this.skillListContainer.addChild(descText);

      // Requirements or level info
      let reqText = '';
      if (skill.requiredLevel) {
        reqText += `Lv.${skill.requiredLevel} `;
      }
      if (skill.requiredClass) {
        reqText += `(${skill.requiredClass})`;
      }
      if (reqText) {
        const reqLabel = new Text(reqText, {
          fontSize: 12,
          fill: '#ffcc00',
        });
        reqLabel.position.set(180, y - 25);
        this.skillListContainer.addChild(reqLabel);
      }

      // Current level (if learned)
      if (!skillItem.locked && skillItem.action === 'upgrade') {
        const learnedSkill = this.getLearnedSkill(skill.id);
        const levelText = new Text(`Level: ${learnedSkill?.upgradeLevel || 0}/${skill.maxLevel}`, {
          fontSize: 12,
          fill: '#4a90d9',
        });
        levelText.position.set(180, y - 5);
        this.skillListContainer.addChild(levelText);
      }

      // Cost and action button
      if (skillItem.locked) {
        const lockText = new Text('🔒 Locked', {
          fontSize: 14,
          fill: '#ff6b6b',
          fontWeight: 'bold',
        });
        lockText.anchor.set(0.5);
        lockText.position.set(280, y);
        this.skillListContainer.addChild(lockText);

        if (skillItem.reason) {
          const reasonText = new Text(skillItem.reason, {
            fontSize: 11,
            fill: '#ff6b6b',
          });
          reasonText.anchor.set(0.5);
          reasonText.position.set(280, y + 20);
          this.skillListContainer.addChild(reasonText);
        }
      } else if (skillItem.action !== 'none') {
        const actionText = skillItem.action === 'learn' ? 'Learn' : 'Upgrade';
        const costText = `${skillItem.cost} SP`;

        const btnBg = new Graphics();
        btnBg.rect(220, y - 20, 120, 40);
        btnBg.fill(skillItem.action === 'learn' ? 0x2d6a4f : 0x1d4ed8);
        btnBg.stroke({ width: 2, color: 0xffffff });
        btnBg.eventMode = 'static';
        btnBg.cursor = 'pointer';
        this.skillListContainer.addChild(btnBg);

        const btnText = new Text(`${actionText}\n${costText}`, {
          fontSize: 12,
          fill: '#ffffff',
          align: 'center',
          fontWeight: 'bold',
        });
        btnText.anchor.set(0.5);
        btnText.position.set(280, y);
        this.skillListContainer.addChild(btnText);

        btnBg.on('pointerdown', () => {
          this.handleSkillAction(skill.id, skillItem.action);
        });

        btnBg.on('pointerover', () => {
          btnBg.clear();
          btnBg.rect(220, y - 20, 120, 40);
          btnBg.fill(skillItem.action === 'learn' ? 0x3d8a5f : 0x2d5ed8);
          btnBg.stroke({ width: 2, color: 0xffffff });
        });

        btnBg.on('pointerout', () => {
          btnBg.clear();
          btnBg.rect(220, y - 20, 120, 40);
          btnBg.fill(skillItem.action === 'learn' ? 0x2d6a4f : 0x1d4ed8);
          btnBg.stroke({ width: 2, color: 0xffffff });
        });
      } else {
        const maxedText = new Text('MAX LEVEL', {
          fontSize: 14,
          fill: '#ffd700',
          fontWeight: 'bold',
        });
        maxedText.anchor.set(0.5);
        maxedText.position.set(280, y);
        this.skillListContainer.addChild(maxedText);
      }
    });
  }

  private getLearnedSkill(skillId: string) {
    const playerData = loadPlayerData();
    if (!playerData || !playerData.character) return null;
    return playerData.character.learnedSkills.find((s: any) => s.skillId === skillId);
  }

  private handleSkillAction(skillId: string, action: 'learn' | 'upgrade') {
    const playerData = loadPlayerData();
    if (!playerData || !playerData.character) return;

    const character = playerData.character;
    const skill = getSkillById(skillId);
    if (!skill) return;

    let success = false;

    if (action === 'learn') {
      success = SkillSystem.learnSkill(character, skillId);
    } else if (action === 'upgrade') {
      success = SkillSystem.upgradeSkill(character, skillId);
    }

    if (success) {
      savePlayerData(playerData);
      this.updateCharacterInfo(character);
      this.skills = SkillSystem.getSkillShopItems(character);
      this.renderSkillList();

      // Show success message
      this.showNotification(`Successfully ${action === 'learn' ? 'learned' : 'upgraded'} ${skill.name}!`);
    } else {
      this.showNotification('Not enough skill points!', true);
    }
  }

  private scrollList(amount: number) {
    // Simple scroll implementation for Pixi.js
    const targetY = this.skillListContainer.y + amount;
    const minY = -((this.skills.length * 90) - 450);
    const maxY = 0;
    
    // Clamp scroll position
    const clampedY = Math.min(Math.max(targetY, minY), maxY);
    
    this.skillListContainer.y = clampedY;
  }

  private showNotification(message: string, isError = false) {
    const width = 1024;
    const height = 768;
    
    const notification = new Text(message, {
      fontSize: 20,
      fill: isError ? '#ff6b6b' : '#4ade80',
      fontWeight: 'bold',
    });
    notification.anchor.set(0.5);
    notification.position.set(width / 2, height / 2);
    notification.alpha = 0;
    this.container.addChild(notification);

    // Fade in
    let alpha = 0;
    const fadeIn = setInterval(() => {
      alpha += 0.1;
      notification.alpha = Math.min(alpha, 1);
      if (alpha >= 1) {
        clearInterval(fadeIn);
        // Hold then fade out
        setTimeout(() => {
          const fadeOut = setInterval(() => {
            alpha -= 0.1;
            notification.alpha = Math.max(alpha, 0);
            if (alpha <= 0) {
              clearInterval(fadeOut);
              this.container.removeChild(notification);
            }
          }, 50);
        }, 1500);
      }
    }, 50);
  }

  private showErrorMessage(message: string) {
    const width = 1024;
    const height = 768;
    
    const errorText = new Text(message, {
      fontSize: 24,
      fill: '#ff6b6b',
      fontWeight: 'bold',
    });
    errorText.anchor.set(0.5);
    errorText.position.set(width / 2, height / 2);
    this.container.addChild(errorText);

    // Add back button
    const backBtn = new Text('← Back to Main Menu', {
      fontSize: 20,
      fill: '#4a90d9',
      fontWeight: 'bold',
    });
    backBtn.anchor.set(0.5);
    backBtn.position.set(width / 2, height / 2 + 60);
    backBtn.eventMode = 'static';
    backBtn.cursor = 'pointer';
    this.container.addChild(backBtn);

    backBtn.on('pointerdown', () => {
      this.sceneManager.switchScene('mainMenu');
    });
  }
}
