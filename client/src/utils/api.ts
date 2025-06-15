import axios from 'axios';

// API base URL - use relative path to leverage webpack proxy
const API_BASE_URL = '/api';

// Types for the new simplified API structure
export interface GamePrompt {
  prompt: string;
}

export interface NPC {
  name: string;
  trait: string;
}

export interface GameImages {
  avatar?: string;
  background?: string;
  npc?: string;
}

export interface GameData {
  setting: string;
  protagonist_role: string;
  objective: string;
  twist: string;
  npc: NPC;
  hook: string;
  quest_offer: string;
  choice_a: string;
  choice_b: string;
  challenge_intro: string;
  climax: string;
  ending_good: string;
  ending_bad: string;
  epilogue: string;
  images?: GameImages;
}

export interface GameResponse {
  game_data: GameData;
  prompt: string;
}

// Legacy types for scene-based structure (for compatibility)
export interface DialogueOption {
  text: string;
  next_scene: string;
}

export interface NPCLegacy {
  name: string;
  description: string;
  portrait_prompt: string;
}

export interface SceneBase {
  scene_id: string;
  scene_type: 'avatar' | 'dialogue' | 'obstacle_run' | 'conclusion';
  title: string;
  description: string;
}

export interface AvatarScene extends SceneBase {
  scene_type: 'avatar';
  avatar_prompt: string;
  next_scene: string;
}

export interface DialogueScene extends SceneBase {
  scene_type: 'dialogue';
  background_prompt: string;
  npc?: NPCLegacy;
  dialogue_text: string;
  options: DialogueOption[];
}

export interface ObstacleRunScene extends SceneBase {
  scene_type: 'obstacle_run';
  background_prompt: string;
  obstacle_prompt: string;
  difficulty: number;
  success_scene: string;
  failure_scene: string;
}

export interface ConclusionScene extends SceneBase {
  scene_type: 'conclusion';
  background_prompt: string;
  conclusion_text: string;
  is_good_ending: boolean;
  next_scene?: string;
}

export type Scene = AvatarScene | DialogueScene | ObstacleRunScene | ConclusionScene;

export interface SceneDSL {
  scenes: Record<string, Scene>;
  initial_scene: string;
  game_title: string;
  game_description: string;
}

export interface LegacyGameResponse {
  scene_dsl: SceneDSL;
  prompt: string;
}

/**
 * Convert simplified game data to scene-based structure
 */
function convertToSceneStructure(gameData: GameData, prompt: string): LegacyGameResponse {
  const scenes: Record<string, Scene> = {};
  
  // Create avatar scene
  const avatarScene: AvatarScene = {
    scene_id: 'avatar_creation',
    scene_type: 'avatar',
    title: 'Create Your Hero',
    description: `You are a ${gameData.protagonist_role} in ${gameData.setting}`,
    avatar_prompt: `A ${gameData.protagonist_role} character in ${gameData.setting}, pixel art style, 8-color palette, 2px outline, flat shading`,
    next_scene: 'quest_start'
  };
  scenes['avatar_creation'] = avatarScene;
  
  // Create initial dialogue scene
  const questScene: DialogueScene = {
    scene_id: 'quest_start',
    scene_type: 'dialogue',
    title: 'The Quest Begins',
    description: gameData.hook,
    background_prompt: `${gameData.setting} background scene, pixel art style, 8-color palette, 2px outline, flat shading`,
    npc: {
      name: gameData.npc.name,
      description: `A ${gameData.npc.trait} character`,
      portrait_prompt: `${gameData.npc.name}, a ${gameData.npc.trait} character, pixel art portrait, 8-color palette, 2px outline, flat shading`
    },
    dialogue_text: gameData.quest_offer,
    options: [
      {
        text: gameData.choice_a,
        next_scene: 'challenge_a'
      },
      {
        text: gameData.choice_b,
        next_scene: 'challenge_b'
      }
    ]
  };
  scenes['quest_start'] = questScene;
  
  // Create challenge scene (obstacle run)
  const challengeScene: ObstacleRunScene = {
    scene_id: 'challenge_a',
    scene_type: 'obstacle_run',
    title: 'The Challenge',
    description: gameData.challenge_intro,
    background_prompt: `${gameData.setting} challenge area, pixel art style, 8-color palette, 2px outline, flat shading`,
    obstacle_prompt: `Obstacles in ${gameData.setting}, pixel art style, 8-color palette, 2px outline, flat shading`,
    difficulty: 3,
    success_scene: 'good_ending',
    failure_scene: 'bad_ending'
  };
  scenes['challenge_a'] = challengeScene;
  
  // Alternative challenge scene
  const challengeSceneB: ObstacleRunScene = {
    scene_id: 'challenge_b',
    scene_type: 'obstacle_run',
    title: 'The Alternative Path',
    description: gameData.challenge_intro,
    background_prompt: `${gameData.setting} alternative path, pixel art style, 8-color palette, 2px outline, flat shading`,
    obstacle_prompt: `Different obstacles in ${gameData.setting}, pixel art style, 8-color palette, 2px outline, flat shading`,
    difficulty: 2,
    success_scene: 'good_ending',
    failure_scene: 'bad_ending'
  };
  scenes['challenge_b'] = challengeSceneB;
  
  // Create good ending
  const goodEnding: ConclusionScene = {
    scene_id: 'good_ending',
    scene_type: 'conclusion',
    title: 'Victory!',
    description: gameData.ending_good,
    background_prompt: `Victory scene in ${gameData.setting}, pixel art style, 8-color palette, 2px outline, flat shading`,
    conclusion_text: `${gameData.climax}\n\n${gameData.ending_good}\n\n${gameData.epilogue}`,
    is_good_ending: true
  };
  scenes['good_ending'] = goodEnding;
  
  // Create bad ending
  const badEnding: ConclusionScene = {
    scene_id: 'bad_ending',
    scene_type: 'conclusion',
    title: 'Defeat',
    description: gameData.ending_bad,
    background_prompt: `Defeat scene in ${gameData.setting}, pixel art style, 8-color palette, 2px outline, flat shading`,
    conclusion_text: `${gameData.climax}\n\n${gameData.ending_bad}`,
    is_good_ending: false
  };
  scenes['bad_ending'] = badEnding;

  const legacyResponse: LegacyGameResponse = {
    scene_dsl: {
      scenes,
      initial_scene: 'avatar_creation',
      game_title: `${gameData.protagonist_role} of ${gameData.setting}`,
      game_description: `${gameData.objective} - ${gameData.hook}`
    },
    prompt
  };

  // Preserve the original game data and images in the legacy response
  (legacyResponse as any).game_data = gameData;

  return legacyResponse;
}

/**
 * Type guard to check if an object is a Scene
 */
export function isScene(obj: any): obj is Scene {
  return obj && 
    typeof obj === 'object' && 
    'scene_type' in obj && 
    (obj.scene_type === 'avatar' || 
     obj.scene_type === 'dialogue' || 
     obj.scene_type === 'obstacle_run' || 
     obj.scene_type === 'conclusion');
}

/**
 * Generate a game based on the provided prompt
 * @param prompt The user's prompt for game generation
 * @returns The generated game data in legacy format
 */
export async function generateGame(prompt: string): Promise<LegacyGameResponse> {
  try {
    console.log('[DEBUG] Starting game generation with prompt:', prompt);
    console.log('[DEBUG] API URL:', `${API_BASE_URL}/generateGame`);
    
    const response = await axios.post<GameResponse>(`${API_BASE_URL}/generateGame`, {
      prompt
    });
    
    console.log('[DEBUG] Raw API response:', response);
    console.log('[DEBUG] Response data:', response.data);
    
    // Convert the simplified structure to the legacy scene structure
    const convertedData = convertToSceneStructure(response.data.game_data, response.data.prompt);
    console.log('[DEBUG] Converted scene structure:', convertedData);
    
    return convertedData;
  } catch (error) {
    console.error('[DEBUG] Error generating game:', error);
    if (axios.isAxiosError(error)) {
      console.error('[DEBUG] Axios error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        }
      });
    }
    throw new Error('Failed to generate game. Please try again.');
  }
}

/**
 * Get an image URL for a given prompt
 * @param prompt The prompt for image generation
 * @returns The URL of the generated image
 */
export async function generateImage(prompt: string): Promise<string> {
  console.log(`[DEBUG] generateImage called with prompt: ${prompt}`);
  // In a real implementation, this would call an image generation API
  // For now, we'll return a placeholder
  const placeholderUrl = `https://via.placeholder.com/400x400?text=${encodeURIComponent(prompt)}`;
  console.log(`[DEBUG] generateImage returning placeholder URL: ${placeholderUrl}`);
  return placeholderUrl;
} 