import { Container, Graphics, Text, TextStyle } from 'pixi.js';

/**
 * Scene names for the new RPG structure
 * 
 * Core Scenes:
 * - mainMenu: Main menu with Start/Settings/Exit
 * - characterCreation: Character building (name, stats, race, class, background, talents)
 * - hub: Central hub for mode selection and navigation
 * - character: Character screen showing stats, skills, equipment
 * - inventory: Equipment and item management
 * - shop: Skill shop and equipment shop
 * - settings: Game settings
 * - game: Combat/gameplay scene
 * 
 * Game Mode Selection Screens:
 * - storyModeSelect: Select Story Part (1-10)
 * - towerModeSelect: Select Tower Floor (1-100)
 * - survivalModeSelect: Select Survival Difficulty
 * - trainingModeSelect: Select Training Dummy
 * - duelModeSelect: Select Duel Type (Ranked/Casual/Custom)
 * 
 * Game Modes (actual gameplay):
 * - storyMode: Story campaign gameplay
 * - towerMode: Tower climb gameplay
 * - survivalMode: Survival wave gameplay
 * - trainingMode: Training combat gameplay
 * - duelMode: PvP gameplay
 */
export type SceneName = 
  | 'mainMenu'
  | 'settings'
  | 'game'
  | 'characterCreation'
  | 'hub'
  | 'inventory'
  | 'skillShop'
  | 'equipmentShop'
  | 'character'
  | 'storyModeSelect'
  | 'towerModeSelect'
  | 'survivalModeSelect'
  | 'trainingModeSelect'
  | 'duelModeSelect'
  | 'storyMode'
  | 'towerMode'
  | 'survivalMode'
  | 'trainingMode'
  | 'duelMode';

export interface IScene {
  container: Container;
  onEnter(): void;
  onExit(): void;
  update?(delta: number): void;
}

export class SceneManager {
  private stage: Container;
  private scenes: Map<string, () => IScene>;
  private currentScene: IScene | null;
  private currentSceneName: string | null;

  constructor(stage: Container) {
    this.stage = stage;
    this.scenes = new Map();
    this.currentScene = null;
    this.currentSceneName = null;
  }

  register(name: string, factory: () => IScene): void {
    this.scenes.set(name, factory);
  }

  switchTo(name: string): void {
    // Exit current scene
    if (this.currentScene) {
      this.currentScene.onExit();
      this.stage.removeChild(this.currentScene.container);
    }

    // Create and enter new scene
    const factory = this.scenes.get(name);
    if (!factory) {
      console.error(`Scene "${name}" not found`);
      return;
    }

    this.currentScene = factory();
    this.currentSceneName = name;
    this.stage.addChild(this.currentScene.container);
    this.currentScene.onEnter();
  }

  getCurrentScene(): IScene | null {
    return this.currentScene;
  }

  getCurrentSceneName(): string | null {
    return this.currentSceneName;
  }
  
  /**
   * Switch scene by name - used by scenes to navigate
   */
  switchScene(name: SceneName): void {
    this.switchTo(name);
  }
}
