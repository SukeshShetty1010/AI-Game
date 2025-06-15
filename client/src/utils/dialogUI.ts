import { Scene } from 'phaser';
import { DialogueScene, DialogueOption } from './api';

/**
 * Configuration options for the dialogue UI
 */
export interface DialogueUIConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  padding: number;
  textStyle?: Phaser.Types.GameObjects.Text.TextStyle;
  optionTextStyle?: Phaser.Types.GameObjects.Text.TextStyle;
  backgroundAlpha?: number;
  backgroundColor?: number;
}

/**
 * Class to handle dialogue UI rendering and interaction
 */
export class DialogueUI {
  private scene: Scene;
  private config: DialogueUIConfig;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Rectangle;
  private dialogueText: Phaser.GameObjects.Text;
  private options: Phaser.GameObjects.Container[] = [];
  private currentDialogue: DialogueScene | null = null;
  private onOptionSelected: ((option: DialogueOption) => void) | null = null;
  
  /**
   * Create a new DialogueUI
   * @param scene The Phaser scene to render in
   * @param config Configuration options
   */
  constructor(scene: Scene, config: DialogueUIConfig) {
    this.scene = scene;
    this.config = {
      ...config,
      backgroundAlpha: config.backgroundAlpha ?? 0.8,
      backgroundColor: config.backgroundColor ?? 0x000000,
      textStyle: {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff',
        wordWrap: { width: config.width - (config.padding * 2) },
        ...(config.textStyle || {})
      },
      optionTextStyle: {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#aaffaa',
        wordWrap: { width: config.width - (config.padding * 4) },
        ...(config.optionTextStyle || {})
      }
    };
    
    // Create container
    this.container = this.scene.add.container(config.x, config.y);
    this.container.setVisible(false);
    
    // Create background
    this.background = this.scene.add.rectangle(
      0,
      0,
      config.width,
      config.height,
      this.config.backgroundColor,
      this.config.backgroundAlpha
    );
    this.background.setOrigin(0);
    this.container.add(this.background);
    
    // Create dialogue text
    this.dialogueText = this.scene.add.text(
      config.padding,
      config.padding,
      '',
      this.config.textStyle
    );
    this.dialogueText.setOrigin(0);
    this.container.add(this.dialogueText);
  }
  
  /**
   * Show a dialogue scene
   * @param dialogue The dialogue scene to show
   * @param callback Function to call when an option is selected
   */
  public showDialogue(
    dialogue: DialogueScene,
    callback: (option: DialogueOption) => void
  ): void {
    this.currentDialogue = dialogue;
    this.onOptionSelected = callback;
    
    // Set dialogue text
    this.dialogueText.setText(dialogue.dialogue_text);
    
    // Clear existing options
    this.clearOptions();
    
    // Create options
    const optionsStartY = this.dialogueText.y + this.dialogueText.height + this.config.padding;
    
    dialogue.options.forEach((option, index) => {
      const optionContainer = this.createOption(
        option,
        this.config.padding * 2,
        optionsStartY + (index * 40)
      );
      
      this.options.push(optionContainer);
      this.container.add(optionContainer);
    });
    
    // Show the container
    this.container.setVisible(true);
  }
  
  /**
   * Hide the dialogue UI
   */
  public hideDialogue(): void {
    this.container.setVisible(false);
    this.currentDialogue = null;
    this.onOptionSelected = null;
    this.clearOptions();
  }
  
  /**
   * Clear all dialogue options
   */
  private clearOptions(): void {
    this.options.forEach(option => {
      option.destroy();
    });
    this.options = [];
  }
  
  /**
   * Create a dialogue option
   * @param option The dialogue option data
   * @param x X position
   * @param y Y position
   * @returns Container with the option
   */
  private createOption(
    option: DialogueOption,
    x: number,
    y: number
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    // Create option text
    const text = this.scene.add.text(0, 0, option.text, this.config.optionTextStyle as Phaser.Types.GameObjects.Text.TextStyle);
    text.setOrigin(0);
    
    // Create invisible button
    const hitArea = this.scene.add.rectangle(
      0,
      0,
      text.width + this.config.padding,
      text.height + this.config.padding,
      0xffffff,
      0
    );
    hitArea.setOrigin(0);
    hitArea.setPosition(-this.config.padding / 2, -this.config.padding / 2);
    hitArea.setInteractive({ useHandCursor: true });
    
    // Add hover effects
    hitArea.on('pointerover', () => {
      text.setStyle({ ...this.config.optionTextStyle as Phaser.Types.GameObjects.Text.TextStyle, color: '#ffffff' });
    });
    
    hitArea.on('pointerout', () => {
      text.setStyle(this.config.optionTextStyle as Phaser.Types.GameObjects.Text.TextStyle);
    });
    
    // Add click handler
    hitArea.on('pointerdown', () => {
      if (this.onOptionSelected) {
        this.onOptionSelected(option);
      }
    });
    
    // Add to container
    container.add([hitArea, text]);
    
    return container;
  }
  
  /**
   * Get the current dialogue
   * @returns The current dialogue scene
   */
  public getCurrentDialogue(): DialogueScene | null {
    return this.currentDialogue;
  }
  
  /**
   * Destroy the dialogue UI
   */
  public destroy(): void {
    this.clearOptions();
    this.container.destroy();
  }
} 