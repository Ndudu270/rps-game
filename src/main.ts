// Main entry point for RPS WAR
import { Application } from 'pixi.js';
import { SceneManager } from './scenes/SceneManager';
import { MainMenuScene } from './scenes/MainMenuScene';
import { SettingsScene } from './scenes/SettingsScene';
import { GameScene } from './scenes/GameScene';

// Initialize Pixi application
const app = new Application();
let sceneManager: SceneManager;

async function init() {
  // Create the application
  await app.init({
    width: 1024,
    height: 768,
    backgroundColor: 0x0a0a15,
    resolution: window.devicePixelRatio || 1,
  });

  document.getElementById('app')!.appendChild(app.canvas);

  // Initialize scene manager
  sceneManager = new SceneManager(app.stage);
  
  // Register scenes
  sceneManager.register('mainMenu', () => new MainMenuScene(sceneManager));
  sceneManager.register('settings', () => new SettingsScene(sceneManager));
  sceneManager.register('game', () => new GameScene(sceneManager));
  
  // Start with main menu
  sceneManager.switchTo('mainMenu');
}

init().catch(console.error);
