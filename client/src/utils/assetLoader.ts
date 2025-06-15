import { Scene } from 'phaser';
import { generateImage } from './api';

/**
 * Asset types that can be loaded
 */
export enum AssetType {
  IMAGE = 'image',
  AUDIO = 'audio',
  SPRITESHEET = 'spritesheet'
}

/**
 * Interface for asset metadata
 */
export interface AssetInfo {
  key: string;
  type: AssetType;
  url?: string;
  prompt?: string;
  frameConfig?: Phaser.Types.Loader.FileTypes.ImageFrameConfig;
  loaded: boolean;
}

/**
 * Class to manage loading and caching of game assets
 */
export class AssetLoader {
  private scene: Scene;
  private assets: Map<string, AssetInfo>;
  private generatedAssets: Map<string, string>;
  
  /**
   * Create a new AssetLoader
   * @param scene The Phaser scene to use for loading
   */
  constructor(scene: Scene) {
    this.scene = scene;
    this.assets = new Map();
    this.generatedAssets = new Map();
    
    // Listen for load complete events
    this.scene.load.on('complete', this.onLoadComplete, this);
  }
  
  /**
   * Queue an asset for loading with a prompt (will generate URL)
   * @param key Unique key for the asset
   * @param type Type of asset
   * @param prompt Prompt for asset generation
   * @param frameConfig Optional frame configuration for spritesheets
   */
  public queueAsset(
    key: string,
    type: AssetType,
    prompt: string,
    frameConfig?: Phaser.Types.Loader.FileTypes.ImageFrameConfig
  ): void {
    console.log(`[DEBUG] AssetLoader.queueAsset called with key: ${key}, type: ${type}, prompt: ${prompt}`);
    this.assets.set(key, {
      key,
      type,
      prompt,
      frameConfig,
      loaded: false
    });
  }
  
  /**
   * Queue an asset for loading with a direct URL
   * @param key Unique key for the asset
   * @param type Type of asset
   * @param url Direct URL to the asset
   * @param frameConfig Optional frame configuration for spritesheets
   */
  public queueAssetWithURL(
    key: string,
    type: AssetType,
    url: string,
    frameConfig?: Phaser.Types.Loader.FileTypes.ImageFrameConfig
  ): void {
    console.log(`[DEBUG] AssetLoader.queueAssetWithURL called with key: ${key}, type: ${type}, url: ${url}`);
    this.assets.set(key, {
      key,
      type,
      url,
      frameConfig,
      loaded: false
    });
  }
  
  /**
   * Start loading all queued assets
   * @returns Promise that resolves when all assets are loaded
   */
  public async loadAll(): Promise<void> {
    // First, generate any assets that need generation
    const generationPromises: Promise<void>[] = [];
    
    for (const [key, asset] of this.assets.entries()) {
      if (asset.prompt && !asset.loaded) {
        const promise = this.generateAsset(key, asset.prompt);
        generationPromises.push(promise);
      }
    }
    
    // Wait for all asset generation to complete
    if (generationPromises.length > 0) {
      await Promise.all(generationPromises);
    }
    
    // Now load all assets with URLs
    return new Promise((resolve) => {
      // Set up a one-time complete listener
      const completeListener = () => {
        this.scene.load.off('complete', completeListener);
        resolve();
      };
      
      this.scene.load.on('complete', completeListener);
      
      // Queue all assets in the Phaser loader
      let assetsToLoad = 0;
      
      for (const [key, asset] of this.assets.entries()) {
        if (!asset.loaded) {
          const url = asset.url || this.generatedAssets.get(key);
          
          if (url) {
            switch (asset.type) {
              case AssetType.IMAGE:
                this.scene.load.image(key, url);
                assetsToLoad++;
                break;
                
              case AssetType.AUDIO:
                this.scene.load.audio(key, url);
                assetsToLoad++;
                break;
                
              case AssetType.SPRITESHEET:
                if (asset.frameConfig) {
                  this.scene.load.spritesheet(key, url, asset.frameConfig);
                  assetsToLoad++;
                }
                break;
            }
          }
        }
      }
      
      // If no assets to load, resolve immediately
      if (assetsToLoad === 0) {
        this.scene.load.off('complete', completeListener);
        resolve();
        return;
      }
      
      // Start loading
      this.scene.load.start();
    });
  }
  
  /**
   * Generate an asset from a prompt
   * @param key The asset key
   * @param prompt The generation prompt
   */
  private async generateAsset(key: string, prompt: string): Promise<void> {
    console.log(`[DEBUG] AssetLoader.generateAsset called for key: ${key}, prompt: ${prompt}`);
    try {
      // Call the image generation API
      const url = await generateImage(prompt);
      console.log(`[DEBUG] Generated URL for ${key}: ${url}`);
      
      // Store the generated URL
      this.generatedAssets.set(key, url);
    } catch (error) {
      console.error(`Failed to generate asset ${key}:`, error);
      
      // Use a placeholder image as fallback
      const fallbackUrl = `https://via.placeholder.com/400x400?text=Failed+to+generate+${key}`;
      console.log(`[DEBUG] Using fallback URL for ${key}: ${fallbackUrl}`);
      this.generatedAssets.set(key, fallbackUrl);
    }
  }
  
  /**
   * Handler for when the Phaser loader completes
   */
  private onLoadComplete(): void {
    // Mark all assets as loaded
    for (const [key, asset] of this.assets.entries()) {
      if (this.scene.textures.exists(key) || this.scene.cache.audio.exists(key)) {
        this.assets.set(key, { ...asset, loaded: true });
      }
    }
  }
  
  /**
   * Check if an asset is loaded
   * @param key The asset key
   * @returns True if the asset is loaded
   */
  public isLoaded(key: string): boolean {
    const asset = this.assets.get(key);
    return asset ? asset.loaded : false;
  }
  
  /**
   * Get the progress of asset loading (0-1)
   * @returns The loading progress
   */
  public getProgress(): number {
    let total = this.assets.size;
    let loaded = 0;
    
    for (const asset of this.assets.values()) {
      if (asset.loaded) {
        loaded++;
      }
    }
    
    return total > 0 ? loaded / total : 1;
  }
} 