// Main entry point for RPS WAR - New RPG Structure
import { Application } from 'pixi.js';
import { SceneManager } from './scenes/SceneManager';
import { MainMenuScene } from './scenes/MainMenuScene';
import { SettingsScene } from './scenes/SettingsScene';
import { GameScene } from './scenes/GameScene';
import { CharacterCreationScene } from './scenes/CharacterCreationScene';
import { HubScene } from './scenes/HubScene';
import { SkillShopScene } from './scenes/SkillShopScene';
import { EquipmentShopScene } from './scenes/EquipmentShopScene';
import { CharacterScene } from './scenes/CharacterScene';

// Mode selection scenes
import { StoryModeSelectScene } from './scenes/modes/StoryModeSelectScene';
import { TowerModeSelectScene } from './scenes/modes/TowerModeSelectScene';
import { SurvivalModeSelectScene } from './scenes/modes/SurvivalModeSelectScene';
import { TrainingModeSelectScene } from './scenes/modes/TrainingModeSelectScene';
import { DuelModeSelectScene } from './scenes/modes/DuelModeSelectScene';

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
  
  // Register scenes - Core scenes
  sceneManager.register('mainMenu', () => new MainMenuScene(sceneManager));
  sceneManager.register('settings', () => new SettingsScene(sceneManager));
  sceneManager.register('game', () => new GameScene(sceneManager));
  sceneManager.register('characterCreation', () => new CharacterCreationScene(sceneManager));
  sceneManager.register('hub', () => new HubScene(sceneManager));
  sceneManager.register('skillShop', () => new SkillShopScene(sceneManager));
  sceneManager.register('equipmentShop', () => new EquipmentShopScene(sceneManager));
  sceneManager.register('character', () => new CharacterScene(sceneManager));
  
  // Register mode selection scenes
  sceneManager.register('storyModeSelect', () => new StoryModeSelectScene(sceneManager));
  sceneManager.register('towerModeSelect', () => new TowerModeSelectScene(sceneManager));
  sceneManager.register('survivalModeSelect', () => new SurvivalModeSelectScene(sceneManager));
  sceneManager.register('trainingModeSelect', () => new TrainingModeSelectScene(sceneManager));
  sceneManager.register('duelModeSelect', () => new DuelModeSelectScene(sceneManager));
  
  // Note: Actual gameplay mode scenes (storyMode, towerMode, survivalMode, trainingMode, duelMode)
  // will be implemented with combat mechanics
  
  // Determine starting scene based on saved player data
  const playerData = localStorage.getItem('playerData');
  const startScene = playerData ? 'hub' : 'mainMenu';
  
  // Start with appropriate scene (no flicker, deterministic)
  sceneManager.switchTo(startScene);
}

init().catch(console.error);
