// Shop Scene - Pixi.js UI for purchasing items

import { Container, Graphics, Text, TextStyle, EventMode } from 'pixi.js';
import { SceneManager, IScene } from './SceneManager';
import { ShopState, ShopItem, purchaseItem, canAffordItem, createDefaultShop } from '../../shared/types/shop';
import { Item } from '../../shared/types/inventory';
import { loadPlayerData, savePlayerData, PlayerData, addGoldToPlayer } from '../systems/PlayerDataManager';

export class ShopScene implements IScene {
  container: Container;
  private sceneManager: SceneManager;
  private playerData: PlayerData | null;
  private backgroundGraphics: Graphics;
  
  // UI Containers
  private goldDisplay: Text | null;
  private categoryButtons: Container[];
  private itemListContainer: Container | null;
  private itemDetailPanel: Container | null;
  private messageText: Text | null;
  
  // State
  private currentCategory: string | null;
  private selectedItem: ShopItem | null;
  
  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.container = new Container();
    this.playerData = null;
    this.backgroundGraphics = new Graphics();
    this.goldDisplay = null;
    this.categoryButtons = [];
    this.itemListContainer = null;
    this.itemDetailPanel = null;
    this.messageText = null;
    this.currentCategory = null;
    this.selectedItem = null;
  }

  onEnter(): void {
    this.playerData = loadPlayerData();
    this.createBackground();
    this.createGoldDisplay();
    this.createCategoryButtons();
    this.createItemListPanel();
    this.createItemDetailPanel();
    this.createBackButton();
    this.createMessageArea();
    this.selectCategory('weapons');
  }

  onExit(): void {
    if (this.playerData) {
      savePlayerData(this.playerData);
    }
  }

  update(delta: number): void {
    // No continuous updates needed
  }

  private createBackground(): void {
    const width = 1024;
    const height = 768;
    this.backgroundGraphics.clear();
    
    // Dark gradient background with gold accents
    for (let i = 0; i < height; i += 3) {
      const ratio = i / height;
      const r = Math.floor(15 + ratio * 25);
      const g = Math.floor(10 + ratio * 15);
      const b = Math.floor(25 + ratio * 40);
      this.backgroundGraphics.rect(0, i, width, 3);
      this.backgroundGraphics.fill(`rgb(${r}, ${g}, ${b})`);
    }
    
    this.container.addChild(this.backgroundGraphics);
  }

  private createGoldDisplay(): void {
    const display = new Container();
    display.position.set(850, 40);
    
    // Background
    const bg = new Graphics();
    bg.roundRect(-80, -20, 160, 40, 5);
    bg.fill({ color: 0x2a2a1a });
    bg.stroke({ width: 2, color: 0xffd700 });
    display.addChild(bg);
    
    // Gold icon
    const goldStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0xffd700,
      stroke: { color: 0x000000, width: 1 },
    });
    const goldText = new Text({ text: '💰 ', style: goldStyle });
    goldText.anchor.set(0, 0.5);
    goldText.position.set(-70, 0);
    display.addChild(goldText);
    
    // Gold amount
    const amountStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 20,
      fontWeight: 'bold',
      fill: 0xffff00,
      stroke: { color: 0x000000, width: 2 },
    });
    const amountText = new Text({ text: '0', style: amountStyle });
    amountText.anchor.set(0.5);
    amountText.position.set(20, 0);
    amountText.name = 'goldAmount';
    display.addChild(amountText);
    
    this.goldDisplay = amountText;
    this.container.addChild(display);
  }

  private createCategoryButtons(): void {
    const categories = [
      { id: 'weapons', label: 'WEAPONS', x: 100 },
      { id: 'armor', label: 'ARMOR', x: 280 },
      { id: 'accessories', label: 'ACCESSORIES', x: 460 },
    ];
    
    categories.forEach(cat => {
      const btn = this.createCategoryButton(cat.label, () => {
        this.selectCategory(cat.id);
      });
      btn.position.set(cat.x, 100);
      this.container.addChild(btn);
      this.categoryButtons.push(btn);
    });
  }

  private createCategoryButton(label: string, onClick: () => void): Container {
    const btn = new Container();
    btn.eventMode = 'static' as EventMode;
    btn.cursor = 'pointer';
    
    const bg = new Graphics();
    bg.roundRect(-80, -20, 160, 40, 5);
    bg.fill({ color: 0x2a2a4e });
    bg.stroke({ width: 2, color: 0x4444ff });
    btn.addChild(bg);
    
    const textStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 14,
      fontWeight: 'bold',
      fill: 0xffffff,
    });
    const text = new Text({ text: label, style: textStyle });
    text.anchor.set(0.5);
    btn.addChild(text);
    
    btn.on('pointerenter', () => {
      bg.clear();
      bg.roundRect(-80, -20, 160, 40, 5);
      bg.fill({ color: 0x4444aa });
      bg.stroke({ width: 2, color: 0x6666ff });
    });
    
    btn.on('pointerleave', () => {
      bg.clear();
      bg.roundRect(-80, -20, 160, 40, 5);
      bg.fill({ color: 0x2a2a4e });
      bg.stroke({ width: 2, color: 0x4444ff });
    });
    
    btn.on('pointerup', onClick);
    
    return btn;
  }

  private createItemListPanel(): void {
    const panel = new Container();
    panel.position.set(512, 400);
    
    // Panel background
    const bg = new Graphics();
    bg.roundRect(-350, -200, 700, 320, 10);
    bg.fill({ color: 0x1a1a3e });
    bg.stroke({ width: 2, color: 0x4444ff });
    panel.addChild(bg);
    
    // Scrollable item list container
    const itemListContainer = new Container();
    itemListContainer.position.set(0, -180);
    itemListContainer.name = 'itemList';
    panel.addChild(itemListContainer);
    
    this.itemListContainer = itemListContainer;
    this.container.addChild(panel);
  }

  private createItemDetailPanel(): void {
    const panel = new Container();
    panel.position.set(850, 384);
    panel.visible = false;
    
    // Panel background
    const bg = new Graphics();
    bg.roundRect(-150, -120, 300, 260, 10);
    bg.fill({ color: 0x2a2a5e });
    bg.stroke({ width: 2, color: 0xffd700 });
    panel.addChild(bg);
    
    // Item name
    const nameStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0xffd700,
      stroke: { color: 0x000000, width: 1 },
    });
    const nameText = new Text({ text: '', style: nameStyle });
    nameText.anchor.set(0.5, 0);
    nameText.position.set(0, -110);
    nameText.name = 'itemName';
    panel.addChild(nameText);
    
    // Item type and rarity
    const typeStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0x888888,
    });
    const typeText = new Text({ text: '', style: typeStyle });
    typeText.anchor.set(0.5, 0);
    typeText.position.set(0, -85);
    typeText.name = 'itemType';
    panel.addChild(typeText);
    
    // Item description
    const descStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 11,
      fill: 0xcccccc,
      wordWrap: true,
      wordWrapWidth: 260,
    });
    const descText = new Text({ text: '', style: descStyle });
    descText.anchor.set(0.5, 0);
    descText.position.set(0, -60);
    descText.name = 'itemDesc';
    panel.addChild(descText);
    
    // Item stats
    const statsStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0x00ff88,
    });
    const statsText = new Text({ text: '', style: statsStyle });
    statsText.anchor.set(0, 0);
    statsText.position.set(-130, -20);
    statsText.name = 'itemStats';
    panel.addChild(statsText);
    
    // Cost display
    const costStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0xffff00,
      stroke: { color: 0x000000, width: 2 },
    });
    const costText = new Text({ text: '', style: costStyle });
    costText.anchor.set(0.5, 0);
    costText.position.set(0, 50);
    costText.name = 'itemCost';
    panel.addChild(costText);
    
    // Buy button
    const buyBtn = new Container();
    buyBtn.position.set(0, 90);
    buyBtn.eventMode = 'static' as EventMode;
    buyBtn.cursor = 'pointer';
    buyBtn.name = 'buyBtn';
    
    const buyBg = new Graphics();
    buyBg.roundRect(-60, -20, 120, 40, 5);
    buyBg.fill({ color: 0x44aa44 });
    buyBg.stroke({ width: 2, color: 0x66ff66 });
    buyBtn.addChild(buyBg);
    
    const buyTextStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 14,
      fontWeight: 'bold',
      fill: 0xffffff,
    });
    const buyText = new Text({ text: 'BUY', style: buyTextStyle });
    buyText.anchor.set(0.5);
    buyBtn.addChild(buyText);
    
    buyBtn.on('pointerenter', () => {
      buyBg.clear();
      buyBg.roundRect(-60, -20, 120, 40, 5);
      buyBg.fill({ color: 0x55cc55 });
      buyBg.stroke({ width: 2, color: 0x88ff88 });
    });
    
    buyBtn.on('pointerleave', () => {
      buyBg.clear();
      buyBg.roundRect(-60, -20, 120, 40, 5);
      buyBg.fill({ color: 0x44aa44 });
      buyBg.stroke({ width: 2, color: 0x66ff66 });
    });
    
    buyBtn.on('pointerup', () => {
      this.handlePurchase();
    });
    
    panel.addChild(buyBtn);
    
    this.itemDetailPanel = panel;
    this.container.addChild(panel);
  }

  private createBackButton(): void {
    const button = new Container();
    button.position.set(50, 720);
    button.eventMode = 'static' as EventMode;
    button.cursor = 'pointer';
    
    const bg = new Graphics();
    bg.roundRect(-60, -20, 120, 40, 5);
    bg.fill({ color: 0xaa2222 });
    bg.stroke({ width: 2, color: 0xff4444 });
    button.addChild(bg);
    
    const textStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0xffffff,
    });
    const text = new Text({ text: 'BACK', style: textStyle });
    text.anchor.set(0.5);
    button.addChild(text);
    
    button.on('pointerenter', () => {
      bg.clear();
      bg.roundRect(-60, -20, 120, 40, 5);
      bg.fill({ color: 0xff4444 });
      bg.stroke({ width: 2, color: 0xff6666 });
    });
    
    button.on('pointerleave', () => {
      bg.clear();
      bg.roundRect(-60, -20, 120, 40, 5);
      bg.fill({ color: 0xaa2222 });
      bg.stroke({ width: 2, color: 0xff4444 });
    });
    
    button.on('pointerup', () => {
      this.sceneManager.switchScene('HubScene');
    });
    
    this.container.addChild(button);
  }

  private createMessageArea(): void {
    const msgText = new Text({ 
      text: '', 
      style: new TextStyle({ 
        fontFamily: 'Arial', 
        fontSize: 16, 
        fill: 0xffff00,
        stroke: { color: 0x000000, width: 2 },
      }) 
    });
    msgText.anchor.set(0.5);
    msgText.position.set(512, 700);
    msgText.visible = false;
    
    this.messageText = msgText;
    this.container.addChild(msgText);
  }

  private selectCategory(categoryId: string): void {
    this.currentCategory = categoryId;
    this.selectedItem = null;
    
    if (this.itemDetailPanel) {
      this.itemDetailPanel.visible = false;
    }
    
    // Update category button highlights
    this.categoryButtons.forEach((btn, index) => {
      const categories = ['weapons', 'armor', 'accessories'];
      const isSelected = categories[index] === categoryId;
      
      const bg = btn.getChildAt(0) as Graphics;
      if (bg) {
        bg.clear();
        bg.roundRect(-80, -20, 160, 40, 5);
        bg.fill({ color: isSelected ? 0x4444aa : 0x2a2a4e });
        bg.stroke({ width: 2, color: isSelected ? 0x6666ff : 0x4444ff });
      }
    });
    
    this.refreshItemList();
  }

  private refreshItemList(): void {
    if (!this.itemListContainer || !this.playerData || !this.currentCategory) return;
    
    this.itemListContainer.removeChildren();
    
    const category = this.playerData.shop.categories.find(c => c.id === this.currentCategory);
    if (!category) return;
    
    const items = category.items;
    
    items.forEach((item, index) => {
      const itemBtn = this.createShopItemButton(item, index);
      itemBtn.position.set(0, index * 55);
      this.itemListContainer?.addChild(itemBtn);
    });
  }

  private createShopItemButton(item: ShopItem, index: number): Container {
    const btn = new Container();
    btn.eventMode = 'static' as EventMode;
    btn.cursor = 'pointer';
    
    // Background
    const bg = new Graphics();
    bg.roundRect(-340, -22, 680, 44, 5);
    bg.fill({ color: 0x2a2a4e });
    bg.stroke({ width: 1, color: this.getRarityColor(item.rarity) });
    btn.addChild(bg);
    
    // Item name
    const nameStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 13,
      fill: this.getRarityColor(item.rarity),
      fontWeight: 'bold',
    });
    const nameText = new Text({ text: item.name, style: nameStyle });
    nameText.anchor.set(0, 0.5);
    nameText.position.set(-330, 0);
    btn.addChild(nameText);
    
    // Cost
    const costStyle = new TextStyle({
      fontFamily: 'Arial Black',
      fontSize: 14,
      fill: 0xffff00,
      stroke: { color: 0x000000, width: 1 },
    });
    const costText = new Text({ text: `${item.cost}g`, style: costStyle });
    costText.anchor.set(1, 0.5);
    costText.position.set(330, 0);
    btn.addChild(costText);
    
    // Hover effect
    btn.on('pointerenter', () => {
      bg.clear();
      bg.roundRect(-340, -22, 680, 44, 5);
      bg.fill({ color: 0x3a3a5e });
      bg.stroke({ width: 2, color: this.getRarityColor(item.rarity) });
    });
    
    btn.on('pointerleave', () => {
      bg.clear();
      bg.roundRect(-340, -22, 680, 44, 5);
      bg.fill({ color: 0x2a2a4e });
      bg.stroke({ width: 1, color: this.getRarityColor(item.rarity) });
    });
    
    // Click handler
    btn.on('pointerup', () => {
      this.selectItem(item);
    });
    
    return btn;
  }

  private selectItem(item: ShopItem): void {
    this.selectedItem = item;
    
    if (!this.itemDetailPanel) return;
    
    this.itemDetailPanel.visible = true;
    
    const nameText = this.itemDetailPanel.getChildByName('itemName') as Text;
    const typeText = this.itemDetailPanel.getChildByName('itemType') as Text;
    const descText = this.itemDetailPanel.getChildByName('itemDesc') as Text;
    const statsText = this.itemDetailPanel.getChildByName('itemStats') as Text;
    const costText = this.itemDetailPanel.getChildByName('itemCost') as Text;
    const buyBtn = this.itemDetailPanel.getChildByName('buyBtn') as Container;
    
    nameText.text = item.name;
    typeText.text = `${item.type.toUpperCase()} - ${item.rarity.toUpperCase()}`;
    descText.text = item.description;
    
    // Build stats list
    const statLines: string[] = [];
    if (item.modifiers.atk) statLines.push(`+${item.modifiers.atk} Attack`);
    if (item.modifiers.def) statLines.push(`+${item.modifiers.def} Defense`);
    if (item.modifiers.spd) statLines.push(`${item.modifiers.spd > 0 ? '+' : ''}${item.modifiers.spd} Speed`);
    if (item.modifiers.hp) statLines.push(`+${item.modifiers.hp} HP`);
    if (item.modifiers.critChance) statLines.push(`+${item.modifiers.critChance}% Crit`);
    if (item.modifiers.luck) statLines.push(`+${item.modifiers.luck} Luck`);
    
    statsText.text = statLines.join('\n');
    costText.text = `💰 ${item.cost} Gold`;
    
    // Update buy button state
    const canBuy = this.playerData && canAffordItem(this.playerData.shop.playerGold, item.cost);
    const buyBg = buyBtn.getChildAt(0) as Graphics;
    const buyText = buyBtn.getChildAt(1) as Text;
    
    if (canBuy) {
      buyBg.clear();
      buyBg.roundRect(-60, -20, 120, 40, 5);
      buyBg.fill({ color: 0x44aa44 });
      buyBg.stroke({ width: 2, color: 0x66ff66 });
      buyText.text = 'BUY';
      buyBtn.eventMode = 'static' as EventMode;
      buyBtn.cursor = 'pointer';
    } else {
      buyBg.clear();
      buyBg.roundRect(-60, -20, 120, 40, 5);
      buyBg.fill({ color: 0x555555 });
      buyBg.stroke({ width: 2, color: 0x777777 });
      buyText.text = "CAN'T AFFORD";
      buyBtn.eventMode = 'none' as EventMode;
      buyBtn.cursor = 'default';
    }
  }

  private handlePurchase(): void {
    if (!this.playerData || !this.selectedItem) return;
    
    const result = purchaseItem(this.playerData.shop, this.selectedItem.id);
    
    if (result.success && result.item) {
      // Add item to inventory
      this.playerData.inventory.items.push(result.item);
      
      // Update gold display
      this.updateGoldDisplay();
      
      // Show success message
      this.showMessage(`Purchased ${result.item.name}!`);
      
      // Refresh item list (stock may have changed)
      this.refreshItemList();
      
      // Save data
      savePlayerData(this.playerData);
    } else {
      // Show error message
      this.showMessage(result.message, 0xff4444);
    }
  }

  private updateGoldDisplay(): void {
    if (!this.goldDisplay || !this.playerData) return;
    this.goldDisplay.text = this.playerData.shop.playerGold.toString();
  }

  private showMessage(message: string, color: number = 0xffff00): void {
    if (!this.messageText) return;
    
    this.messageText.text = message;
    this.messageText.style = new TextStyle({ 
      fontFamily: 'Arial', 
      fontSize: 16, 
      fill: color,
      stroke: { color: 0x000000, width: 2 },
    });
    this.messageText.visible = true;
    
    // Hide after 2 seconds
    setTimeout(() => {
      if (this.messageText) {
        this.messageText.visible = false;
      }
    }, 2000);
  }

  private getRarityColor(rarity: string): number {
    switch (rarity) {
      case 'common': return 0xffffff;
      case 'rare': return 0x0088ff;
      case 'epic': return 0xaa00ff;
      case 'legendary': return 0xffaa00;
      default: return 0xcccccc;
    }
  }
}
