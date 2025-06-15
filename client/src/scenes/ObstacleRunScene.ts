import Phaser from 'phaser';
import { LegacyGameResponse, ObstacleRunScene as ObstacleRunSceneType, Scene, isScene } from '../utils/api';
import { AssetLoader, AssetType } from '../utils/assetLoader';

/**
 * Obstacle Run mini-game scene
 */
export class ObstacleRunScene extends Phaser.Scene {
  private gameData: LegacyGameResponse | null = null;
  private currentSceneId: string = '';
  private assetLoader: AssetLoader | null = null;
  private isGameOver: boolean = false;
  private successSceneId: string = '';
  private failureSceneId: string = '';
  
  constructor() {
    super({ key: 'ObstacleRunScene' });
  }
  
  /**
   * Initialize scene with game data and scene ID
   */
  init(data: { sceneId: string; gameData: LegacyGameResponse }): void {
    console.log(`[DEBUG] ObstacleRunScene.init called with sceneId: ${data.sceneId}`);
    console.log(`[DEBUG] ObstacleRunScene game data:`, data.gameData);
    console.log(`[DEBUG] ObstacleRunScene preserved game data:`, (data.gameData as any).game_data);
    
    this.currentSceneId = data.sceneId;
    this.gameData = data.gameData;
    this.isGameOver = false;
    
    // Create asset loader
    this.assetLoader = new AssetLoader(this);
  }
  
  /**
   * Preload assets for the current scene
   */
  preload(): void {
    if (!this.gameData || !this.currentSceneId || !this.assetLoader) {
      return;
    }
    
    const sceneDSL = this.gameData.scene_dsl;
    const scene = sceneDSL.scenes[this.currentSceneId] as ObstacleRunSceneType;
    
    if (!scene || scene.scene_type !== 'obstacle_run') {
      console.error(`Scene ${this.currentSceneId} is not an obstacle run scene`);
      return;
    }
    
    // Store scene properties
    this.successSceneId = scene.success_scene;
    this.failureSceneId = scene.failure_scene;
    
    // Use the preserved game data images from the backend instead of prompts
    const preservedGameData = (this.gameData as any).game_data;
    const images = preservedGameData?.images;
    
    console.log(`[DEBUG] Available images in preserved game data:`, images);
    
    if (images) {
      // Queue background image if available
      if (images.background) {
        console.log(`[DEBUG] Queueing background image: ${images.background}`);
        this.assetLoader.queueAssetWithURL(
          `bg_${this.currentSceneId}`,
          AssetType.IMAGE,
          images.background
        );
      }
      
      // For obstacles, we can reuse the background or avatar image as placeholder
      // In a full implementation, we'd have separate obstacle images
      if (images.avatar) {
        console.log(`[DEBUG] Queueing obstacle image (using avatar): ${images.avatar}`);
        this.assetLoader.queueAssetWithURL(
          `obstacle_${this.currentSceneId}`,
          AssetType.IMAGE,
          images.avatar
        );
      }
    } else {
      console.warn(`[DEBUG] No images found in preserved game data, falling back to prompts`);
      // Fallback to prompt-based generation
      this.assetLoader.queueAsset(
        `bg_${this.currentSceneId}`,
        AssetType.IMAGE,
        scene.background_prompt
      );
      
      this.assetLoader.queueAsset(
        `obstacle_${this.currentSceneId}`,
        AssetType.IMAGE,
        scene.obstacle_prompt
      );
    }
  }
  
  /**
   * Create scene objects
   */
  async create(): Promise<void> {
    if (!this.gameData || !this.currentSceneId || !this.assetLoader) {
      this.scene.start('TitleScene');
      return;
    }
    
    const sceneDSL = this.gameData.scene_dsl;
    const scene = sceneDSL.scenes[this.currentSceneId] as ObstacleRunSceneType;
    
    if (!scene || scene.scene_type !== 'obstacle_run') {
      console.error(`Scene ${this.currentSceneId} is not an obstacle run scene`);
      this.scene.start('TitleScene');
      return;
    }
    
    // Load assets for the scene
    try {
      await this.assetLoader.loadAll();
    } catch (error) {
      console.error('Error loading scene assets:', error);
    }
    
    const { width, height } = this.cameras.main;
    
    // Create background
    if (this.textures.exists(`bg_${this.currentSceneId}`)) {
      const bg = this.add.image(width / 2, height / 2, `bg_${this.currentSceneId}`);
      bg.setDisplaySize(width, height);
    } else {
      // Fallback background
      this.add.rectangle(0, 0, width, height, 0x111111).setOrigin(0);
    }
    
    // Create title text
    this.add.text(width / 2, height * 0.1, scene.title, {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    
    // Create description text
    this.add.text(width / 2, height * 0.2, scene.description, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#cccccc',
      align: 'center',
      wordWrap: { width: width * 0.8 }
    }).setOrigin(0.5);
    
    // Create placeholder for the game
    const gameArea = this.add.rectangle(width / 2, height * 0.5, width * 0.8, height * 0.4, 0x333333);
    
    // Add obstacle image
    if (this.textures.exists(`obstacle_${this.currentSceneId}`)) {
      const obstacle = this.add.image(width / 2, height * 0.5, `obstacle_${this.currentSceneId}`);
      obstacle.setDisplaySize(width * 0.2, height * 0.2);
    }
    
    // Create success button (for demo purposes)
    this.createButton(width * 0.3, height * 0.8, 'Success', 0x4CAF50, () => {
      this.navigateToScene(this.successSceneId);
    });
    
    // Create failure button (for demo purposes)
    this.createButton(width * 0.7, height * 0.8, 'Failure', 0xf44336, () => {
      this.navigateToScene(this.failureSceneId);
    });
  }
  
  /**
   * Create a button
   */
  private createButton(x: number, y: number, text: string, color: number, callback: () => void): void {
    // Create button background
    const buttonBg = this.add.rectangle(0, 0, 150, 50, color, 1).setOrigin(0.5);
    
    // Create button text
    const buttonText = this.add.text(0, 0, text, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Create container
    const button = this.add.container(x, y, [buttonBg, buttonText]);
    
    // Make interactive
    buttonBg.setInteractive({ useHandCursor: true });
    
    // Add hover effects
    buttonBg.on('pointerover', () => {
      buttonBg.setScale(1.05);
    });
    
    buttonBg.on('pointerout', () => {
      buttonBg.setScale(1);
    });
    
    // Add click handler
    buttonBg.on('pointerdown', callback);
  }
  
  /**
   * Navigate to another scene
   */
  private navigateToScene(sceneId: string): void {
    if (!this.gameData) return;
    
    console.log(`[DEBUG] ObstacleRunScene navigating to scene: ${sceneId}`);
    
    // Navigate based on scene ID
    switch (sceneId) {
      case 'avatar_creation':
      case 'quest_start':
        this.scene.start('DynamicScene', { 
          sceneId: sceneId,
          gameData: this.gameData
        });
        break;
        
      case 'challenge_a':
      case 'challenge_b':
        this.scene.start('ObstacleRunScene', { 
          sceneId: sceneId,
          gameData: this.gameData
        });
        break;
        
      case 'good_ending':
      case 'bad_ending':
        this.scene.start('ConclusionScene', { 
          sceneId: sceneId,
          gameData: this.gameData
        });
        break;
        
      default:
        console.log(`[DEBUG] Unknown scene: ${sceneId}, going to DynamicScene`);
        this.scene.start('DynamicScene', { 
          sceneId: sceneId,
          gameData: this.gameData
        });
        break;
    }
  }
} 