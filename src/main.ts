// Main entry point for the Text-Based Stance Card Combat System
import { Application, Graphics, Text, TextStyle } from 'pixi.js';

// Initialize Pixi application
const app = new Application();

async function init() {
  // Create the application
  await app.init({ 
    width: 1024, 
    height: 768, 
    backgroundColor: 0x1a1a2e,
    resolution: window.devicePixelRatio || 1,
  });
  
  document.getElementById('app')!.appendChild(app.canvas);
  
  // Create main menu
  createMainMenu();
}

function createMainMenu() {
  const container = app.stage.addChild(new Graphics());
  
  // Title
  const titleStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 48,
    fontWeight: 'bold',
    fill: 0xffffff,
    dropShadow: true,
    dropShadowColor: 0x000000,
    dropShadowBlur: 4,
    dropShadowAngle: Math.PI / 6,
    dropShadowDistance: 6,
  });
  
  const title = new Text({ text: 'STANCE CARD COMBAT', style: titleStyle });
  title.anchor.set(0.5);
  title.position.set(app.screen.width / 2, 150);
  app.stage.addChild(title);
  
  // Subtitle
  const subtitleStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 24,
    fill: 0xaaaaaa,
  });
  
  const subtitle = new Text({ text: 'A Deterministic PvP Battle System', style: subtitleStyle });
  subtitle.anchor.set(0.5);
  subtitle.position.set(app.screen.width / 2, 210);
  app.stage.addChild(subtitle);
  
  console.log('Main menu created');
}

init().catch(console.error);
