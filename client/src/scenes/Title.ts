import Phaser from 'phaser';
import { LegacyGameResponse, Scene, isScene } from '../utils/api';

/**
 * Title scene for displaying the game title and starting the adventure
 */
export class TitleScene extends Phaser.Scene {
  private gameData: LegacyGameResponse | null = null;
  private titleText!: Phaser.GameObjects.Text;
  private startButton!: Phaser.GameObjects.Container;
  private descriptionText!: Phaser.GameObjects.Text;
  
  constructor() {
    super({ key: 'TitleScene' });
  }
  
  /**
   * Initialize scene with game data
   */
  init(data: { gameData?: LegacyGameResponse }): void {
    // Store game data if provided
    if (data.gameData) {
      this.gameData = data.gameData;
    } else {
      // Try to load from localStorage
      const storedData = localStorage.getItem('gameData');
      if (storedData) {
        try {
          this.gameData = JSON.parse(storedData);
        } catch (e) {
          console.error('Failed to parse stored game data:', e);
        }
      }
    }
  }
  
  /**
   * Create scene objects
   */
  create(): void {
    const { width, height } = this.cameras.main;
    
    // Create background
    this.add.rectangle(0, 0, width, height, 0x111111).setOrigin(0);
    
    // Create title text
    const title = this.gameData?.scene_dsl.game_title || 'AI LoreCrafter';
    this.titleText = this.add.text(width / 2, height * 0.2, title, {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    
    // Create description text
    const description = this.gameData?.scene_dsl.game_description || 'An AI-generated RPG adventure';
    this.descriptionText = this.add.text(width / 2, height * 0.3, description, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#cccccc',
      align: 'center',
      wordWrap: { width: width * 0.8 }
    }).setOrigin(0.5);
    
    // Create start button
    this.createStartButton(width / 2, height * 0.7);
    
    // Add prompt text if available
    if (this.gameData?.prompt) {
      const promptText = this.add.text(width / 2, height * 0.85, `Based on: "${this.gameData.prompt}"`, {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#999999',
        align: 'center',
        wordWrap: { width: width * 0.8 }
      }).setOrigin(0.5);
    }
    
    // Add restart button (to generate a new game)
    this.createRestartButton(width * 0.9, height * 0.05);
  }
  
  /**
   * Create the start button
   */
  private createStartButton(x: number, y: number): void {
    // Create container
    this.startButton = this.add.container(x, y);
    
    // Create button background
    const buttonBg = this.add.rectangle(0, 0, 200, 60, 0x4CAF50, 1).setOrigin(0.5);
    
    // Create button text
    const buttonText = this.add.text(0, 0, 'Begin Adventure', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Add to container
    this.startButton.add([buttonBg, buttonText]);
    
    // Make interactive
    buttonBg.setInteractive({ useHandCursor: true });
    
    // Add hover effects
    buttonBg.on('pointerover', () => {
      buttonBg.setFillStyle(0x45a049);
    });
    
    buttonBg.on('pointerout', () => {
      buttonBg.setFillStyle(0x4CAF50);
    });
    
    // Add click handler
    buttonBg.on('pointerdown', () => {
      this.startAdventure();
    });
  }
  
  /**
   * Create the restart button
   */
  private createRestartButton(x: number, y: number): void {
    // Create button background
    const buttonBg = this.add.circle(0, 0, 25, 0x333333, 1).setOrigin(0.5);
    
    // Create button text
    const buttonText = this.add.text(0, 0, '↻', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Create container and position
    const restartButton = this.add.container(x, y, [buttonBg, buttonText]);
    
    // Make interactive
    buttonBg.setInteractive({ useHandCursor: true });
    
    // Add hover effects
    buttonBg.on('pointerover', () => {
      buttonBg.setFillStyle(0x444444);
    });
    
    buttonBg.on('pointerout', () => {
      buttonBg.setFillStyle(0x333333);
    });
    
    // Add click handler
    buttonBg.on('pointerdown', () => {
      this.restartGame();
    });
  }
  
  /**
   * Start the adventure
   */
  private startAdventure(): void {
    if (this.gameData) {
      const initialSceneId = this.gameData.scene_dsl.initial_scene;
      
      // Start with the initial scene - typically 'avatar_creation'
      this.scene.start('DynamicScene', { 
        sceneId: initialSceneId,
        gameData: this.gameData
      });
    } else {
      // If no game data, show prompt screen
      this.showPromptScreen();
    }
  }
  
  /**
   * Restart the game (show prompt screen)
   */
  private restartGame(): void {
    this.showPromptScreen();
  }
  
  /**
   * Show the prompt screen in the DOM
   */
  private showPromptScreen(): void {
    // Show the prompt container
    const promptContainer = document.getElementById('prompt-container');
    if (promptContainer) {
      promptContainer.style.display = 'flex';
    }
    
    // Clear any previous error
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
      errorMessage.textContent = '';
      errorMessage.style.display = 'none';
    }
    
    // Clear stored game data
    localStorage.removeItem('gameData');
    this.gameData = null;
  }
} 