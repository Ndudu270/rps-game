import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { SceneManager, IScene } from './SceneManager';

export interface PlayerData {
  name: string;
  stats: {
    strength: number;
    agility: number;
    intelligence: number;
    charisma: number;
    endurance: number;
    perception: number;
    luck: number;
  };
  race: string;
  class: string;
  background: string;
  talents: string[];
}

const TOTAL_STAT_POINTS = 30;
const MIN_STAT_VALUE = 1;

const RACES = ['Humans', 'Elves', 'Dwarfs', 'Demons', 'Orc', 'Halfling', 'Gnome', 'Beastfolk'];
const CLASSES = ['Warrior', 'Mage', 'Rogue', 'Archer', 'Cleric', 'Paladin', 'Assassin', 'Druid', 'Bard', 'Necromancer'];
const BACKGROUNDS = ['Noble', 'Urchin', 'Scholar', 'Soldier', 'Merchant', 'Acolyte', 'Outlander', 'Artisan', 'Sailor', 'Herbalist'];
const TALENTS = ['Iron Will', 'Bloodlust', 'Lucky Break', 'Fast Hands', 'Arcane Memory', 'Second Wind', 'Eagle Eye', 'Silver Tongue', 'Survivor', 'Shadow Step'];

export class CharacterCreationScene implements IScene {
  container: Container;
  private sceneManager: SceneManager;
  private currentStep: number;
  private playerData: PlayerData;
  private stepContainers: Container[];
  private backgroundGraphics: Graphics;
  private errorText: Text | null;
  private selectionHighlight: Graphics | null;

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.container = new Container();
    this.currentStep = 0;
    this.stepContainers = [];
    this.backgroundGraphics = new Graphics();
    this.errorText = null;
    this.selectionHighlight = null;
    this.playerData = {
      name: '',
      stats: {
        strength: 1,
        agility: 1,
        intelligence: 1,
        charisma: 1,
        endurance: 1,
        perception: 1,
        luck: 1,
      },
      race: '',
      class: '',
      background: '',
      talents: [],
    };
  }

  onEnter(): void {
    this.createBackground();
    this.createAllSteps();
    this.showStep(0);
  }

  onExit(): void {}

  private createBackground(): void {
    const width = 1024;
    const height = 768;
    this.backgroundGraphics.clear();
    for (let i = 0; i < height; i += 4) {
      const ratio = i / height;
      const r = Math.floor(15 + ratio * 25);
      const g = Math.floor(10 + ratio * 15);
      const b = Math.floor(30 + ratio * 40);
      this.backgroundGraphics.rect(0, i, width, 4);
      this.backgroundGraphics.fill(`rgb(${r}, ${g}, ${b})`);
    }
    this.container.addChild(this.backgroundGraphics);
  }

  private createAllSteps(): void {
    this.createNameStep();
    this.createStatsStep();
    this.createRaceStep();
    this.createClassStep();
    this.createBackgroundStep();
    this.createTalentStep();
  }

  private showStep(stepIndex: number): void {
    // Hide all steps
    this.stepContainers.forEach((c) => (c.visible = false));
    
    // Show current step
    if (this.stepContainers[stepIndex]) {
      this.stepContainers[stepIndex].visible = true;
      this.currentStep = stepIndex;
    }

    // Clear error text
    if (this.errorText) {
      this.errorText.text = '';
    }
  }

  private showError(message: string): void {
    if (!this.errorText) {
      const style = new TextStyle({
        fontFamily: 'Arial',
        fontSize: 18,
        fill: 0xff4444,
        fontWeight: 'bold',
      });
      this.errorText = new Text({ text: '', style });
      this.errorText.anchor.set(0.5);
      this.errorText.position.set(512, 680);
      this.container.addChild(this.errorText);
    }
    this.errorText.text = message;
  }

  private createNameStep(): void {
    const stepContainer = new Container();
    stepContainer.visible = false;

    const titleStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 48,
      fontWeight: 'bold',
      fill: 0xffffff,
      stroke: { color: 0x4444ff, width: 3 },
    });
    const title = new Text({ text: 'Step 1: Enter Your Name', style: titleStyle });
    title.anchor.set(0.5);
    title.position.set(512, 100);
    stepContainer.addChild(title);

    // Input field background
    const inputBg = new Graphics();
    inputBg.roundRect(312, 200, 400, 60, 10);
    inputBg.fill({ color: 0x1a1a3e });
    inputBg.stroke({ width: 2, color: 0x4444ff });
    stepContainer.addChild(inputBg);

    let nameText = '';
    const inputTextStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 28,
      fill: 0xffffff,
    });
    const inputText = new Text({ text: '', style: inputTextStyle });
    inputText.anchor.set(0, 0.5);
    inputText.position.set(322, 230);
    stepContainer.addChild(inputText);

    // Virtual keyboard hint
    const hintStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0x888888,
    });
    const hint = new Text({ text: 'Click letters below to enter name', style: hintStyle });
    hint.anchor.set(0.5);
    hint.position.set(512, 290);
    stepContainer.addChild(hint);

    // Simple virtual keyboard
    const keyboardRows = [
      'QWERTYUIOP',
      'ASDFGHJKL',
      'ZXCVBNM',
    ];

    let keyY = 330;
    keyboardRows.forEach((row, rowIndex) => {
      const rowWidth = row.length * 35 + (row.length - 1) * 5;
      let keyX = 512 - rowWidth / 2 + 17.5;
      
      for (let i = 0; i < row.length; i++) {
        const letter = row[i];
        const keyBtn = this.createKeyButton(letter, () => {
          if (nameText.length < 20) {
            nameText += letter;
            inputText.text = nameText;
          }
        });
        keyBtn.position.set(keyX, keyY);
        stepContainer.addChild(keyBtn);
        keyX += 40;
      }
      keyY += 45;
    });

    // Backspace button
    const backspaceBtn = this.createKeyButton('⌫', () => {
      nameText = nameText.slice(0, -1);
      inputText.text = nameText;
    });
    backspaceBtn.position.set(512 + 180, 465);
    stepContainer.addChild(backspaceBtn);

    // Space button
    const spaceBtn = this.createKeyButton('Space', () => {
      if (nameText.length < 20 && !nameText.endsWith(' ')) {
        nameText += ' ';
        inputText.text = nameText;
      }
    }, 100);
    spaceBtn.position.set(512 - 50, 465);
    stepContainer.addChild(spaceBtn);

    // Continue button
    const continueBtn = this.createNavButton('Continue', 600, () => {
      const trimmedName = nameText.trim();
      if (trimmedName.length < 2) {
        this.showError('Name must be at least 2 characters');
        return;
      }
      if (trimmedName.length > 20) {
        this.showError('Name must be 20 characters or less');
        return;
      }
      this.playerData.name = trimmedName;
      this.showStep(1);
    });
    continueBtn.position.set(512, 560);
    stepContainer.addChild(continueBtn);

    this.stepContainers.push(stepContainer);
    this.container.addChild(stepContainer);
  }

  private createKeyButton(label: string, onClick: () => void, width: number = 35): Container {
    const buttonContainer = new Container();
    const bg = new Graphics();
    const height = 40;
    bg.roundRect(-width / 2, -height / 2, width, height, 5);
    bg.fill({ color: 0x2a2a4e });
    bg.stroke({ width: 1, color: 0x4444ff });
    
    const fontSize = label.length > 3 ? 14 : 20;
    const textStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize,
      fontWeight: 'bold',
      fill: 0xffffff,
    });
    const text = new Text({ text: label, style: textStyle });
    text.anchor.set(0.5);
    
    buttonContainer.addChild(bg);
    buttonContainer.addChild(text);
    (buttonContainer as any).bg = bg;
    buttonContainer.eventMode = 'static';
    buttonContainer.cursor = 'pointer';
    
    buttonContainer.on('pointerenter', () => {
      bg.clear();
      bg.roundRect(-width / 2, -height / 2, width, height, 5);
      bg.fill({ color: 0x4444aa });
      bg.stroke({ width: 2, color: 0x6666ff });
    });
    buttonContainer.on('pointerleave', () => {
      bg.clear();
      bg.roundRect(-width / 2, -height / 2, width, height, 5);
      bg.fill({ color: 0x2a2a4e });
      bg.stroke({ width: 1, color: 0x4444ff });
    });
    buttonContainer.on('pointerup', onClick);
    
    return buttonContainer;
  }

  private createStatsStep(): void {
    const stepContainer = new Container();
    stepContainer.visible = false;

    const titleStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 42,
      fontWeight: 'bold',
      fill: 0xffffff,
      stroke: { color: 0x4444ff, width: 3 },
    });
    const title = new Text({ text: 'Step 2: Allocate Stats', style: titleStyle });
    title.anchor.set(0.5);
    title.position.set(512, 80);
    stepContainer.addChild(title);

    const infoStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xcccccc,
    });
    const info = new Text({ text: `Total Points: ${TOTAL_STAT_POINTS} | Distribute carefully`, style: infoStyle });
    info.anchor.set(0.5);
    info.position.set(512, 120);
    stepContainer.addChild(info);

    const statNames = ['Strength', 'Agility', 'Intelligence', 'Charisma', 'Endurance', 'Perception', 'Luck'];
    const statKeys = ['strength', 'agility', 'intelligence', 'charisma', 'endurance', 'perception', 'luck'] as const;

    let yPos = 170;
    const statGraphics: Graphics[] = [];
    const statTexts: Text[] = [];

    statNames.forEach((name, index) => {
      const key = statKeys[index];
      const rowContainer = new Container();
      rowContainer.position.set(512, yPos);

      // Stat name
      const nameStyle = new TextStyle({
        fontFamily: 'Arial',
        fontSize: 18,
        fill: 0xffffff,
      });
      const nameText = new Text({ text: name, style: nameStyle });
      nameText.anchor.set(0, 0.5);
      nameText.position.set(-150, 0);
      rowContainer.addChild(nameText);

      // Decrease button
      const decBtn = this.createSmallStatButton('-', () => {
        if (this.playerData.stats[key] > MIN_STAT_VALUE) {
          this.playerData.stats[key]--;
          updateDisplay();
        }
      });
      decBtn.position.set(50, 0);
      rowContainer.addChild(decBtn);

      // Value display
      const valueStyle = new TextStyle({
        fontFamily: 'Arial Black',
        fontSize: 24,
        fill: 0xffff00,
      });
      const valueText = new Text({ text: `${this.playerData.stats[key]}`, style: valueStyle });
      valueText.anchor.set(0.5);
      valueText.position.set(90, 0);
      rowContainer.addChild(valueText);
      statTexts.push(valueText);

      // Increase button
      const incBtn = this.createSmallStatButton('+', () => {
        const currentTotal = Object.values(this.playerData.stats).reduce((a, b) => a + b, 0);
        if (currentTotal < TOTAL_STAT_POINTS) {
          this.playerData.stats[key]++;
          updateDisplay();
        } else {
          this.showError('No more points available!');
        }
      });
      incBtn.position.set(130, 0);
      rowContainer.addChild(incBtn);

      stepContainer.addChild(rowContainer);
      yPos += 50;
    });

    const updateDisplay = () => {
      const currentTotal = Object.values(this.playerData.stats).reduce((a, b) => a + b, 0);
      const remaining = TOTAL_STAT_POINTS - currentTotal;
      info.text = `Total Points: ${TOTAL_STAT_POINTS} | Remaining: ${remaining}`;
      
      statTexts.forEach((text, index) => {
        const key = statKeys[index];
        text.text = `${this.playerData.stats[key]}`;
      });
      
      if (remaining < 0) {
        this.showError('Cannot exceed total points!');
      } else {
        this.showError('');
      }
    };

    // Remaining points display
    const remainingStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 20,
      fill: 0x00ff00,
    });
    const remainingText = new Text({ text: '', style: remainingStyle });
    remainingText.anchor.set(0.5);
    remainingText.position.set(512, 540);
    stepContainer.addChild(remainingText);

    // Navigation buttons
    const backBtn = this.createNavButton('Back', 420, () => {
      this.showStep(0);
    });
    backBtn.position.set(380, 600);
    stepContainer.addChild(backBtn);

    const continueBtn = this.createNavButton('Continue', 600, () => {
      const currentTotal = Object.values(this.playerData.stats).reduce((a, b) => a + b, 0);
      if (currentTotal !== TOTAL_STAT_POINTS) {
        this.showError(`Must use all ${TOTAL_STAT_POINTS} points! (Remaining: ${TOTAL_STAT_POINTS - currentTotal})`);
        return;
      }
      this.showStep(2);
    });
    continueBtn.position.set(640, 600);
    stepContainer.addChild(continueBtn);

    this.stepContainers.push(stepContainer);
    this.container.addChild(stepContainer);
  }

  private createSmallStatButton(label: string, onClick: () => void): Container {
    const buttonContainer = new Container();
    const bg = new Graphics();
    const size = 36;
    bg.circle(0, 0, size / 2);
    bg.fill({ color: 0x3a3a5e });
    bg.stroke({ width: 2, color: 0x5555aa });
    
    const textStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 20,
      fontWeight: 'bold',
      fill: 0xffffff,
    });
    const text = new Text({ text: label, style: textStyle });
    text.anchor.set(0.5);
    
    buttonContainer.addChild(bg);
    buttonContainer.addChild(text);
    (buttonContainer as any).bg = bg;
    buttonContainer.eventMode = 'static';
    buttonContainer.cursor = 'pointer';
    
    buttonContainer.on('pointerenter', () => {
      bg.clear();
      bg.circle(0, 0, size / 2);
      bg.fill({ color: 0x5555aa });
      bg.stroke({ width: 2, color: 0x7777ff });
    });
    buttonContainer.on('pointerleave', () => {
      bg.clear();
      bg.circle(0, 0, size / 2);
      bg.fill({ color: 0x3a3a5e });
      bg.stroke({ width: 2, color: 0x5555aa });
    });
    buttonContainer.on('pointerup', onClick);
    
    return buttonContainer;
  }

  private createRaceStep(): void {
    const stepContainer = new Container();
    stepContainer.visible = false;

    const titleStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 42,
      fontWeight: 'bold',
      fill: 0xffffff,
      stroke: { color: 0x4444ff, width: 3 },
    });
    const title = new Text({ text: 'Step 3: Choose Your Race', style: titleStyle });
    title.anchor.set(0.5);
    title.position.set(512, 80);
    stepContainer.addChild(title);

    const raceButtons: Container[] = [];
    let idx = 0;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 4; col++) {
        if (idx >= RACES.length) break;
        const race = RACES[idx];
        const btn = this.createSelectionButton(race, this.playerData.race === race, () => {
          this.playerData.race = race;
          raceButtons.forEach((b, i) => {
            const isSelected = this.playerData.race === RACES[i];
            this.updateSelectionButton(b, isSelected);
          });
        });
        btn.position.set(200 + col * 160, 160 + row * 70);
        raceButtons.push(btn);
        stepContainer.addChild(btn);
        idx++;
      }
    }

    const backBtn = this.createNavButton('Back', 420, () => {
      this.showStep(1);
    });
    backBtn.position.set(380, 600);
    stepContainer.addChild(backBtn);

    const continueBtn = this.createNavButton('Continue', 600, () => {
      if (!this.playerData.race) {
        this.showError('Please select a race!');
        return;
      }
      this.showStep(3);
    });
    continueBtn.position.set(640, 600);
    stepContainer.addChild(continueBtn);

    this.stepContainers.push(stepContainer);
    this.container.addChild(stepContainer);
  }

  private createClassStep(): void {
    const stepContainer = new Container();
    stepContainer.visible = false;

    const titleStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 42,
      fontWeight: 'bold',
      fill: 0xffffff,
      stroke: { color: 0x4444ff, width: 3 },
    });
    const title = new Text({ text: 'Step 4: Choose Your Class', style: titleStyle });
    title.anchor.set(0.5);
    title.position.set(512, 80);
    stepContainer.addChild(title);

    const classButtons: Container[] = [];
    let idx = 0;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        if (idx >= CLASSES.length) break;
        const cls = CLASSES[idx];
        const btn = this.createSelectionButton(cls, this.playerData.class === cls, () => {
          this.playerData.class = cls;
          classButtons.forEach((b, i) => {
            const isSelected = this.playerData.class === CLASSES[i];
            this.updateSelectionButton(b, isSelected);
          });
        });
        btn.position.set(180 + col * 170, 150 + row * 65);
        classButtons.push(btn);
        stepContainer.addChild(btn);
        idx++;
      }
    }

    const backBtn = this.createNavButton('Back', 420, () => {
      this.showStep(2);
    });
    backBtn.position.set(380, 600);
    stepContainer.addChild(backBtn);

    const continueBtn = this.createNavButton('Continue', 600, () => {
      if (!this.playerData.class) {
        this.showError('Please select a class!');
        return;
      }
      this.showStep(4);
    });
    continueBtn.position.set(640, 600);
    stepContainer.addChild(continueBtn);

    this.stepContainers.push(stepContainer);
    this.container.addChild(stepContainer);
  }

  private createBackgroundStep(): void {
    const stepContainer = new Container();
    stepContainer.visible = false;

    const titleStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 42,
      fontWeight: 'bold',
      fill: 0xffffff,
      stroke: { color: 0x4444ff, width: 3 },
    });
    const title = new Text({ text: 'Step 5: Choose Your Background', style: titleStyle });
    title.anchor.set(0.5);
    title.position.set(512, 80);
    stepContainer.addChild(title);

    const bgButtons: Container[] = [];
    let idx = 0;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        if (idx >= BACKGROUNDS.length) break;
        const bg = BACKGROUNDS[idx];
        const btn = this.createSelectionButton(bg, this.playerData.background === bg, () => {
          this.playerData.background = bg;
          bgButtons.forEach((b, i) => {
            const isSelected = this.playerData.background === BACKGROUNDS[i];
            this.updateSelectionButton(b, isSelected);
          });
        });
        btn.position.set(180 + col * 170, 150 + row * 65);
        bgButtons.push(btn);
        stepContainer.addChild(btn);
        idx++;
      }
    }

    const backBtn = this.createNavButton('Back', 420, () => {
      this.showStep(3);
    });
    backBtn.position.set(380, 600);
    stepContainer.addChild(backBtn);

    const continueBtn = this.createNavButton('Continue', 600, () => {
      if (!this.playerData.background) {
        this.showError('Please select a background!');
        return;
      }
      this.showStep(5);
    });
    continueBtn.position.set(640, 600);
    stepContainer.addChild(continueBtn);

    this.stepContainers.push(stepContainer);
    this.container.addChild(stepContainer);
  }

  private createTalentStep(): void {
    const stepContainer = new Container();
    stepContainer.visible = false;

    const titleStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 42,
      fontWeight: 'bold',
      fill: 0xffffff,
      stroke: { color: 0x4444ff, width: 3 },
    });
    const title = new Text({ text: 'Step 6: Choose Talents', style: titleStyle });
    title.anchor.set(0.5);
    title.position.set(512, 70);
    stepContainer.addChild(title);

    const infoStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xcccccc,
    });
    const info = new Text({ text: 'Select up to 2 talents', style: infoStyle });
    info.anchor.set(0.5);
    info.position.set(512, 110);
    stepContainer.addChild(info);

    const talentButtons: Container[] = [];
    let idx = 0;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        if (idx >= TALENTS.length) break;
        const talent = TALENTS[idx];
        const isSelected = this.playerData.talents.includes(talent);
        const btn = this.createSelectionButton(talent, isSelected, () => {
          const talentIdx = this.playerData.talents.indexOf(talent);
          if (talentIdx >= 0) {
            this.playerData.talents.splice(talentIdx, 1);
          } else {
            if (this.playerData.talents.length < 2) {
              this.playerData.talents.push(talent);
            } else {
              this.showError('Maximum 2 talents allowed!');
              return;
            }
          }
          talentButtons.forEach((b, i) => {
            const isSel = this.playerData.talents.includes(TALENTS[i]);
            this.updateSelectionButton(b, isSel);
          });
          this.showError('');
        });
        btn.position.set(170 + col * 175, 150 + row * 65);
        talentButtons.push(btn);
        stepContainer.addChild(btn);
        idx++;
      }
    }

    const backBtn = this.createNavButton('Back', 420, () => {
      this.showStep(4);
    });
    backBtn.position.set(380, 600);
    stepContainer.addChild(backBtn);

    const finishBtn = this.createNavButton('Finish', 600, () => {
      // Talents are optional, can have 0, 1, or 2
      this.savePlayerData();
      this.sceneManager.switchTo('hub');
    });
    finishBtn.position.set(640, 600);
    stepContainer.addChild(finishBtn);

    this.stepContainers.push(stepContainer);
    this.container.addChild(stepContainer);
  }

  private createSelectionButton(label: string, isSelected: boolean, onClick: () => void): Container {
    const buttonContainer = new Container();
    const bg = new Graphics();
    const width = 150;
    const height = 50;
    
    const baseColor = isSelected ? 0x4444aa : 0x2a2a4e;
    const strokeColor = isSelected ? 0x8888ff : 0x4444ff;
    
    bg.roundRect(-width / 2, -height / 2, width, height, 8);
    bg.fill({ color: baseColor });
    bg.stroke({ width: isSelected ? 3 : 2, color: strokeColor });
    
    const fontSize = label.length > 12 ? 12 : 14;
    const textStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize,
      fontWeight: 'bold',
      fill: isSelected ? 0xffff00 : 0xffffff,
    });
    const text = new Text({ text: label, style: textStyle });
    text.anchor.set(0.5);
    
    buttonContainer.addChild(bg);
    buttonContainer.addChild(text);
    (buttonContainer as any).bg = bg;
    (buttonContainer as any).text = text;
    (buttonContainer as any).isSelected = isSelected;
    buttonContainer.eventMode = 'static';
    buttonContainer.cursor = 'pointer';
    
    buttonContainer.on('pointerenter', () => {
      bg.clear();
      bg.roundRect(-width / 2, -height / 2, width, height, 8);
      const hoverColor = isSelected ? 0x5555bb : 0x3a3a5e;
      bg.fill({ color: hoverColor });
      bg.stroke({ width: isSelected ? 3 : 2, color: strokeColor });
    });
    buttonContainer.on('pointerleave', () => {
      bg.clear();
      bg.roundRect(-width / 2, -height / 2, width, height, 8);
      bg.fill({ color: baseColor });
      bg.stroke({ width: isSelected ? 3 : 2, color: strokeColor });
    });
    buttonContainer.on('pointerup', onClick);
    
    return buttonContainer;
  }

  private updateSelectionButton(button: Container, isSelected: boolean): void {
    const bg = (button as any).bg as Graphics;
    const text = (button as any).text as Text;
    
    bg.clear();
    const width = 150;
    const height = 50;
    bg.roundRect(-width / 2, -height / 2, width, height, 8);
    
    const baseColor = isSelected ? 0x4444aa : 0x2a2a4e;
    const strokeColor = isSelected ? 0x8888ff : 0x4444ff;
    bg.fill({ color: baseColor });
    bg.stroke({ width: isSelected ? 3 : 2, color: strokeColor });
    
    text.style.fill = isSelected ? 0xffff00 : 0xffffff;
    (button as any).isSelected = isSelected;
  }

  private createNavButton(label: string, x: number, onClick: () => void): Container {
    const buttonContainer = new Container();
    const bg = new Graphics();
    const width = 160;
    const height = 50;
    bg.roundRect(-width / 2, -height / 2, width, height, 10);
    bg.fill({ color: 0x2a2a4e });
    bg.stroke({ width: 2, color: 0x4444ff });
    
    const textStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 20,
      fontWeight: 'bold',
      fill: 0xffffff,
    });
    const text = new Text({ text: label, style: textStyle });
    text.anchor.set(0.5);
    
    buttonContainer.addChild(bg);
    buttonContainer.addChild(text);
    (buttonContainer as any).bg = bg;
    buttonContainer.eventMode = 'static';
    buttonContainer.cursor = 'pointer';
    
    buttonContainer.on('pointerenter', () => {
      bg.clear();
      bg.roundRect(-width / 2, -height / 2, width, height, 10);
      bg.fill({ color: 0x4444aa });
      bg.stroke({ width: 3, color: 0x6666ff });
    });
    buttonContainer.on('pointerleave', () => {
      bg.clear();
      bg.roundRect(-width / 2, -height / 2, width, height, 10);
      bg.fill({ color: 0x2a2a4e });
      bg.stroke({ width: 2, color: 0x4444ff });
    });
    buttonContainer.on('pointerup', onClick);
    
    return buttonContainer;
  }

  private savePlayerData(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('playerData', JSON.stringify(this.playerData));
    }
    console.log('Player data saved:', this.playerData);
  }
}
