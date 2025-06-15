import Phaser from 'phaser';
import { AssetLoader, AssetType } from '../utils/assetLoader';
import { DialogueUI, DialogueUIConfig } from '../utils/dialogUI';
import { Scene, LegacyGameResponse, AvatarScene, DialogueScene, ObstacleRunScene, ConclusionScene, DialogueOption, isScene } from '../utils/api';

/**
 * Dynamic scene for rendering avatar and dialogue scenes
 */
export class DynamicScene extends Phaser.Scene {
  private gameData: LegacyGameResponse | null = null;
  private currentSceneId: string = '';
  private assetLoader: AssetLoader | null = null;
  private dialogueUI: DialogueUI | null = null;
  private backgroundImage: Phaser.GameObjects.Image | null = null;
  private avatarImage: Phaser.GameObjects.Image | null = null;
  private npcImage: Phaser.GameObjects.Image | null = null;
  private obstacleImage: Phaser.GameObjects.Image | null = null;
  constructor() {
    super({ key: 'DynamicScene' });
  }
  
  /**
   * Initialize scene with game data and scene ID
   */
  init(data: { sceneId: string; gameData: LegacyGameResponse }): void {
    console.log(`[DEBUG] DynamicScene.init called with sceneId: ${data.sceneId}`);
    console.log(`[DEBUG] DynamicScene game data:`, data.gameData);
    console.log(`[DEBUG] DynamicScene preserved game data:`, (data.gameData as any).game_data);
    console.log(`[DEBUG] DynamicScene game data images:`, (data.gameData as any).game_data?.images);
    
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

    console.log(`[DEBUG] DynamicScene.preload called for scene: ${this.currentSceneId}`);
    
    // Use the preserved game data images from the backend instead of prompts
    const preservedGameData = (this.gameData as any).game_data;
    const images = preservedGameData?.images;
    
    console.log(`[DEBUG] Available images in preserved game data:`, images);
    
    if (images) {
      // Queue avatar image if available
      if (images.avatar) {
        console.log(`[DEBUG] Queueing avatar image: ${images.avatar}`);
        this.assetLoader.queueAssetWithURL(
          'avatar',
          AssetType.IMAGE,
          images.avatar
        );
      }
      
      // Queue background image if available
      if (images.background) {
        console.log(`[DEBUG] Queueing background image: ${images.background}`);
        this.assetLoader.queueAssetWithURL(
          'background',
          AssetType.IMAGE,
          images.background
        );
      }
      
      // Queue NPC image if available
      if (images.npc) {
        console.log(`[DEBUG] Queueing NPC image: ${images.npc}`);
        this.assetLoader.queueAssetWithURL(
          'npc',
          AssetType.IMAGE,
          images.npc
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

    console.log(`[DEBUG] DynamicScene.create called for scene: ${this.currentSceneId}`);

    // Load assets for the scene
    try {
      await this.assetLoader.loadAll();
      console.log(`[DEBUG] Assets loaded successfully`);
    } catch (error) {
      console.error('Error loading scene assets:', error);
    }

    // Render based on the current scene ID
    switch (this.currentSceneId) {
      case 'avatar_creation':
        this.renderAvatarScene();
        break;
      case 'quest_start':
        this.renderDialogueScene();
        break;
      default:
        console.log(`[DEBUG] Rendering default scene for: ${this.currentSceneId}`);
        this.renderDefaultScene();
    }
  }
  
  /**
   * Render an avatar scene
   */
  private renderAvatarScene(): void {
    const { width, height } = this.cameras.main;
    
    // Create background
    if (this.textures.exists('background')) {
      this.backgroundImage = this.add.image(width / 2, height / 2, 'background');
      this.backgroundImage.setDisplaySize(width, height);
      this.backgroundImage.setOrigin(0.5);
    } else {
      // Fallback background
      this.add.rectangle(0, 0, width, height, 0x111111).setOrigin(0);
    }
    
    // Create title text
    this.add.text(width / 2, height * 0.1, 'Create Your Hero', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    
    // Create description text
    const preservedGameData = (this.gameData as any).game_data;
    if (preservedGameData) {
      const description = `You are a ${preservedGameData.protagonist_role} in ${preservedGameData.setting}`;
      this.add.text(width / 2, height * 0.2, description, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#cccccc',
        align: 'center',
        wordWrap: { width: width * 0.8 }
      }).setOrigin(0.5);
    }
    
    // Display avatar image
    if (this.textures.exists('avatar')) {
      this.avatarImage = this.add.image(width / 2, height * 0.5, 'avatar');
      this.avatarImage.setDisplaySize(width * 0.6, height * 0.4);
      this.avatarImage.setOrigin(0.5);
    }

    // Create continue button
    this.createContinueButton(width / 2, height * 0.85, 'quest_start');
  }
  
  /**
   * Render a dialogue scene
   */
  private renderDialogueScene(): void {
    const { width, height } = this.cameras.main;
    
    // Create background
    if (this.textures.exists('background')) {
      this.backgroundImage = this.add.image(width / 2, height / 2, 'background');
      this.backgroundImage.setDisplaySize(width, height);
      this.backgroundImage.setOrigin(0.5);
      
      // Add slight darkening overlay for better text contrast
      this.add.rectangle(0, 0, width, height, 0x000000, 0.3).setOrigin(0);
    } else {
      // Fallback background
      this.add.rectangle(0, 0, width, height, 0x111111).setOrigin(0);
    }
    
    // Create title text
    this.add.text(width / 2, height * 0.1, 'The Quest Begins', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    
    // Display NPC portrait if available
    const preservedGameData = (this.gameData as any).game_data;
    if (this.textures.exists('npc') && preservedGameData) {
      this.npcImage = this.add.image(width * 0.25, height * 0.3, 'npc');
      this.npcImage.setDisplaySize(width * 0.4, width * 0.4);
      this.npcImage.setOrigin(0.5);
      
      // Add NPC name
      this.add.text(width * 0.25, height * 0.3 + (width * 0.2) + 10, preservedGameData.npc.name, {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff',
        align: 'center'
      }).setOrigin(0.5);
    }
    
    // Create dialogue text
    if (preservedGameData) {
      this.add.text(width / 2, height * 0.6, preservedGameData.quest_offer, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: width * 0.8 }
      }).setOrigin(0.5);

      // Create choice buttons
      this.createChoiceButton(width * 0.25, height * 0.8, preservedGameData.choice_a, 'challenge_a');
      this.createChoiceButton(width * 0.75, height * 0.8, preservedGameData.choice_b, 'challenge_b');
    }
  }

  /**
   * Render a default scene
   */
  private renderDefaultScene(): void {
    const { width, height } = this.cameras.main;
    
    // Create background
    if (this.textures.exists('background')) {
      this.backgroundImage = this.add.image(width / 2, height / 2, 'background');
      this.backgroundImage.setDisplaySize(width, height);
      this.backgroundImage.setOrigin(0.5);
    } else {
      // Fallback background
      this.add.rectangle(0, 0, width, height, 0x111111).setOrigin(0);
    }
    
    // Create title text
    this.add.text(width / 2, height * 0.1, 'Adventure Continues', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    // Create continue button
    this.createContinueButton(width / 2, height * 0.85, 'quest_start');
  }

  /**
   * Create a choice button
   */
  private createChoiceButton(x: number, y: number, text: string, nextScene: string): void {
    const button = this.add.rectangle(x, y, 200, 50, 0x4CAF50)
      .setInteractive()
      .on('pointerdown', () => {
        this.navigateToScene(nextScene);
      })
      .on('pointerover', () => {
        button.setFillStyle(0x45a049);
      })
      .on('pointerout', () => {
        button.setFillStyle(0x4CAF50);
      });

    this.add.text(x, y, text, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 180 }
    }).setOrigin(0.5);
  }

  /**
   * Create a continue button
   */
  private createContinueButton(x: number, y: number, nextScene: string): void {
    const button = this.add.rectangle(x, y, 200, 50, 0x4CAF50)
      .setInteractive()
      .on('pointerdown', () => {
        this.navigateToScene(nextScene);
      })
      .on('pointerover', () => {
        button.setFillStyle(0x45a049);
      })
      .on('pointerout', () => {
        button.setFillStyle(0x4CAF50);
      });

    this.add.text(x, y, 'Continue', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
  }
  
  /**
   * Handle dialogue option selection
   */
  private handleDialogueOption(option: DialogueOption): void {
    this.navigateToScene(option.next_scene);
  }
  
  /**
   * Navigate to another scene
   */
  private navigateToScene(sceneId: string): void {
    if (!this.gameData) return;
    
    console.log(`[DEBUG] Navigating to scene: ${sceneId}`);
    
    // Clean up current scene
    if (this.dialogueUI) {
      this.dialogueUI.destroy();
      this.dialogueUI = null;
    }
    
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
        console.log(`[DEBUG] Unknown scene: ${sceneId}, staying in DynamicScene`);
        this.scene.start('DynamicScene', { 
          sceneId: sceneId,
          gameData: this.gameData
        });
    }
  }
} 