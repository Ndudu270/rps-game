import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export type SceneName = 'mainMenu' | 'settings' | 'game' | 'characterCreation';

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
}
