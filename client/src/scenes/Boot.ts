import Phaser from 'phaser';
import { AssetLoader, AssetType } from '../utils/assetLoader';

/**
 * Boot scene for initial loading and setup
 */
export class BootScene extends Phaser.Scene {
  private assetLoader: AssetLoader | null = null;
  private gameData: any = null;
  
  constructor() {
    super({ key: 'BootScene' });
    console.log('[DEBUG] BootScene constructor called');
  }
  
  /**
   * Initialize scene with game data
   */
  init(data: { gameData?: any }): void {
    console.log('[DEBUG] BootScene init called with data:', data);
    
    // Store game data if provided
    if (data.gameData) {
      console.log('[DEBUG] Game data provided:', data.gameData);
      this.gameData = data.gameData;
      
      // Also store in localStorage as backup
      localStorage.setItem('gameData', JSON.stringify(data.gameData));
      console.log('[DEBUG] Game data stored in localStorage');
    } else {
      // Try to load from localStorage
      console.log('[DEBUG] No game data provided, trying localStorage');
      const storedData = localStorage.getItem('gameData');
      if (storedData) {
        try {
          this.gameData = JSON.parse(storedData);
          console.log('[DEBUG] Game data loaded from localStorage:', this.gameData);
        } catch (e) {
          console.error('[DEBUG] Failed to parse stored game data:', e);
        }
      } else {
        console.log('[DEBUG] No stored game data found');
      }
    }
    
    // Create asset loader
    console.log('[DEBUG] Creating asset loader');
    this.assetLoader = new AssetLoader(this);
  }
  
  /**
   * Preload essential assets
   */
  preload(): void {
    console.log('[DEBUG] BootScene preload called');
    
    // Create simple colored rectangles as UI assets instead of loading files
    this.load.image('ui-background', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    this.load.image('ui-button', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    
    console.log('[DEBUG] UI assets queued for loading');
    
    // Update loading progress in the DOM
    this.load.on('progress', (value: number) => {
      console.log('[DEBUG] Loading progress:', value);
      this.updateLoadingProgress(value * 100);
    });
  }
  
  /**
   * Create scene objects and start the game
   */
  async create(): Promise<void> {
    console.log('[DEBUG] BootScene create called');
    console.log('[DEBUG] Game data available:', !!this.gameData);
    console.log('[DEBUG] Asset loader available:', !!this.assetLoader);
    
    // If we have game data, queue assets for the first scene
    if (this.gameData && this.assetLoader) {
      try {
        console.log('[DEBUG] Processing game data for asset loading');
        const sceneDSL = this.gameData.scene_dsl;
        console.log('[DEBUG] Scene DSL:', sceneDSL);
        
        // Queue assets for the initial scene
        console.log('[DEBUG] Queueing assets for initial scene:', sceneDSL.initial_scene);
        this.queueAssetsForScene(sceneDSL.initial_scene, sceneDSL);
        
        // Start loading assets
        console.log('[DEBUG] Starting asset loading');
        await this.assetLoader.loadAll();
        console.log('[DEBUG] Asset loading completed');
        
        // Start the title scene with the game data
        console.log('[DEBUG] Starting TitleScene with game data');
        this.scene.start('TitleScene', { gameData: this.gameData });
      } catch (error) {
        console.error('[DEBUG] Error loading initial assets:', error);
        this.showError('Failed to load game assets. Please try again.');
      }
    } else {
      // If no game data, go to title screen
      console.log('[DEBUG] No game data available, starting TitleScene without data');
      this.scene.start('TitleScene');
    }
  }
  
  /**
   * Queue assets for a specific scene
   */
  private queueAssetsForScene(sceneId: string, sceneDSL: any): void {
    if (!this.assetLoader) return;
    
    console.log('[DEBUG] Queueing assets for scene:', sceneId);
    
    // Use the preserved game data images from the backend instead of prompts
    const preservedGameData = (this.gameData as any).game_data;
    const images = preservedGameData?.images;
    
    console.log('[DEBUG] Available images in preserved game data:', images);
    
    if (images) {
      // Queue avatar image if available
      if (images.avatar) {
        console.log('[DEBUG] Queueing avatar image:', images.avatar);
        this.assetLoader.queueAssetWithURL(
          'avatar',
          AssetType.IMAGE,
          images.avatar
        );
      }
      
      // Queue background image if available
      if (images.background) {
        console.log('[DEBUG] Queueing background image:', images.background);
        this.assetLoader.queueAssetWithURL(
          'background',
          AssetType.IMAGE,
          images.background
        );
      }
      
      // Queue NPC image if available
      if (images.npc) {
        console.log('[DEBUG] Queueing NPC image:', images.npc);
        this.assetLoader.queueAssetWithURL(
          'npc',
          AssetType.IMAGE,
          images.npc
        );
      }
    } else {
      console.warn('[DEBUG] No images found in preserved game data, skipping asset loading');
    }
  }
  
  /**
   * Update loading progress in the DOM
   */
  private updateLoadingProgress(progress: number): void {
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
      progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }
  }
  
  /**
   * Show error message in the DOM
   */
  private showError(message: string): void {
    // Show error in the DOM
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
      errorMessage.textContent = message;
      errorMessage.style.display = 'block';
    }
    
    // Show the prompt container again
    const promptContainer = document.getElementById('prompt-container');
    if (promptContainer) {
      promptContainer.style.display = 'flex';
    }
    
    // Hide the loading screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
    }
  }
} 