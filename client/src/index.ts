import Phaser from 'phaser';
import { BootScene } from './scenes/Boot';
import { TitleScene } from './scenes/Title';
import { DynamicScene } from './scenes/DynamicScene';
import { ObstacleRunScene } from './scenes/ObstacleRunScene';
import { ConclusionScene } from './scenes/ConclusionScene';
import { generateGame } from './utils/api';

// Game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 480,
  height: 800,
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 300 },
      debug: false
    }
  },
  scene: [
    BootScene,
    TitleScene,
    DynamicScene,
    ObstacleRunScene,
    ConclusionScene
  ]
};

// Initialize the game when the window loads
window.addEventListener('load', () => {
  console.log('[DEBUG] Window loaded, initializing Phaser game...');
  console.log('[DEBUG] Game config:', config);
  
  try {
    const game = new Phaser.Game(config);
    console.log('[DEBUG] Phaser game created successfully:', game);
    
    // Make game instance available globally for debugging
    (window as any).game = game;
    console.log('[DEBUG] Game instance made available globally');
  } catch (error) {
    console.error('[DEBUG] Error creating Phaser game:', error);
  }
});

// Function to start game generation with a prompt
(window as any).startGameGeneration = async (prompt: string) => {
  try {
    console.log('[DEBUG] startGameGeneration called with prompt:', prompt);
    
    // Update progress bar to show activity
    updateProgress(10);
    console.log('[DEBUG] Progress updated to 10%');
    
    // Generate the game content
    console.log('[DEBUG] Calling generateGame...');
    const gameData = await generateGame(prompt);
    console.log('[DEBUG] Game data received:', gameData);
    updateProgress(50);
    
    // Store the game data in localStorage for use by the game scenes
    localStorage.setItem('gameData', JSON.stringify(gameData));
    console.log('[DEBUG] Game data stored in localStorage');
    updateProgress(90);
    
    // Start the game
    setTimeout(() => {
      console.log('[DEBUG] Starting game initialization...');
      // Hide loading screen
      document.getElementById('loading-screen')!.style.display = 'none';
      
      // Start the game if it hasn't been initialized yet
      if (!(window as any).game) {
        console.log('[DEBUG] Creating new Phaser game instance');
        (window as any).game = new Phaser.Game(config);
      } else {
        console.log('[DEBUG] Restarting existing game from BootScene');
        // If game is already initialized, restart from boot scene
        (window as any).game.scene.start('BootScene', { gameData });
      }
    }, 500);
  } catch (error) {
    console.error('[DEBUG] Error in startGameGeneration:', error);
    
    // Show error message and reset UI
    const errorMessage = document.getElementById('error-message')!;
    errorMessage.textContent = 'Failed to generate game. Please try again.';
    errorMessage.style.display = 'block';
    
    document.getElementById('loading-screen')!.style.display = 'none';
    document.getElementById('prompt-container')!.style.display = 'flex';
  }
};

// Function to update loading progress
function updateProgress(progress: number): void {
  const progressBar = document.getElementById('progress-bar');
  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }
} 