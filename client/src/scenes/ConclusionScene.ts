import Phaser from 'phaser';
import { AssetLoader, AssetType } from '../utils/assetLoader';
import { LegacyGameResponse, ConclusionScene as ConclusionSceneType } from '../utils/api';

/**
 * Conclusion scene for rendering game endings
 */
export class ConclusionScene extends Phaser.Scene {
  private gameData: LegacyGameResponse | null = null;
  private currentSceneId: string = '';
  private assetLoader: AssetLoader | null = null;
  private backgroundImage: Phaser.GameObjects.Image | null = null;

  constructor() {
    super({ key: 'ConclusionScene' });
  }
  
  /**
   * Initialize scene with game data and scene ID
   */
  init(data: { sceneId: string; gameData: LegacyGameResponse }): void {
    console.log(`[DEBUG] ConclusionScene.init called with sceneId: ${data.sceneId}`);
    console.log(`[DEBUG] ConclusionScene game data:`, data.gameData);
    console.log(`[DEBUG] ConclusionScene preserved game data:`, (data.gameData as any).game_data);
    
    this.currentSceneId = data.sceneId;
    this.gameData = data.gameData;
    
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

    console.log(`[DEBUG] ConclusionScene.preload called for scene: ${this.currentSceneId}`);
    
    // Use the preserved game data images from the backend
    const preservedGameData = (this.gameData as any).game_data;
    const images = preservedGameData?.images;
    
    console.log(`[DEBUG] Available images in preserved game data:`, images);
    
    if (images) {
      // Queue background image if available
      if (images.background) {
        console.log(`[DEBUG] Queueing background image: ${images.background}`);
        this.assetLoader.queueAssetWithURL(
          'background',
          AssetType.IMAGE,
          images.background
        );
      }
      
      // Queue avatar image if available for victory scenes
      if (images.avatar) {
        console.log(`[DEBUG] Queueing avatar image: ${images.avatar}`);
        this.assetLoader.queueAssetWithURL(
          'avatar',
          AssetType.IMAGE,
          images.avatar
        );
      }
    } else {
      console.warn(`[DEBUG] No images found in preserved game data`);
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

    console.log(`[DEBUG] ConclusionScene.create called for scene: ${this.currentSceneId}`);

    // Load assets for the scene
    try {
      await this.assetLoader.loadAll();
      console.log(`[DEBUG] Assets loaded successfully`);
    } catch (error) {
      console.error('Error loading scene assets:', error);
    }

    this.renderConclusionScene();
  }
  
  /**
   * Render the conclusion scene
   */
  private renderConclusionScene(): void {
    const { width, height } = this.cameras.main;
    
    // Create background
    if (this.textures.exists('background')) {
      this.backgroundImage = this.add.image(width / 2, height / 2, 'background');
      this.backgroundImage.setDisplaySize(width, height);
      this.backgroundImage.setOrigin(0.5);
      
      // Add slight darkening overlay for better text contrast
      this.add.rectangle(0, 0, width, height, 0x000000, 0.4).setOrigin(0);
    } else {
      // Fallback background
      this.add.rectangle(0, 0, width, height, 0x111111).setOrigin(0);
    }
    
    // Get the preserved game data for conclusion text
    const preservedGameData = (this.gameData as any).game_data;
    const isGoodEnding = this.currentSceneId === 'good_ending';
    
    // Create title text
    const title = isGoodEnding ? 'Victory!' : 'Defeat';
    this.add.text(width / 2, height * 0.1, title, {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: isGoodEnding ? '#4CAF50' : '#f44336',
      align: 'center'
    }).setOrigin(0.5);
    
    // Display avatar image for good endings
    if (isGoodEnding && this.textures.exists('avatar')) {
      const avatarImage = this.add.image(width / 2, height * 0.3, 'avatar');
      avatarImage.setDisplaySize(width * 0.4, width * 0.4);
      avatarImage.setOrigin(0.5);
    }
    
    // Create conclusion text
    if (preservedGameData) {
      const conclusionText = isGoodEnding ? 
        `${preservedGameData.climax}\n\n${preservedGameData.ending_good}\n\n${preservedGameData.epilogue}` :
        `${preservedGameData.climax}\n\n${preservedGameData.ending_bad}`;
      
      this.add.text(width / 2, height * 0.6, conclusionText, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: width * 0.8 }
      }).setOrigin(0.5);
    }

    // Create restart button
    this.createRestartButton(width / 2, height * 0.9);
  }

  /**
   * Create a restart button
   */
  private createRestartButton(x: number, y: number): void {
    const button = this.add.rectangle(x, y, 200, 50, 0x4CAF50)
      .setInteractive()
      .on('pointerdown', () => {
        this.scene.start('TitleScene');
      })
      .on('pointerover', () => {
        button.setFillStyle(0x45a049);
      })
      .on('pointerout', () => {
        button.setFillStyle(0x4CAF50);
      });

    this.add.text(x, y, 'Play Again', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
  }
} 