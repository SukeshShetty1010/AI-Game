from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import Optional
import logging

from app.schemas.game import GamePrompt, GameResponse, GameImages, GameData
from app.services.groq_client import generate_game_content
from app.services.cache import get_cached_response, cache_response
from app.services.image_generator import generate_game_images

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/generateGame", response_model=GameResponse)
async def generate_game(
    prompt: GamePrompt,
    background_tasks: BackgroundTasks,
):
    """
    Generate a complete RPG game based on the provided prompt.
    
    This endpoint:
    1. Takes a user prompt describing the desired game
    2. Checks if a cached response exists
    3. If not, generates new game content using the Groq LLM
    4. Generates AI images for the game assets
    5. Returns the complete game DSL (Domain Specific Language) with images
    """
    # Temporarily disable caching for testing
    # cached_response = get_cached_response(prompt.prompt)
    # if cached_response:
    #     return cached_response
    
    # Generate new game content
    try:
        logger.info(f"Generating game content for prompt: {prompt.prompt}")
        game_content_dict = await generate_game_content(prompt.prompt)
        
        # Extract game data from the dictionary
        game_data_raw = game_content_dict["game_data"]
        
        # Generate images for the game
        logger.info("Generating AI images for game assets...")
        try:
            image_filenames = generate_game_images(game_data_raw)
            
            # Create GameImages object
            game_images = GameImages(
                avatar=image_filenames.get("avatar"),
                background=image_filenames.get("background"),
                npc=image_filenames.get("npc")
            )
            
            logger.info(f"Successfully generated images: {image_filenames}")
            
        except Exception as img_error:
            logger.error(f"Image generation failed: {str(img_error)}")
            # Continue without images - the game can still work
            game_images = GameImages()
        
        # Create GameData object
        game_data = GameData(**game_data_raw, images=game_images)
        
        # Create the response
        game_response = GameResponse(
            game_data=game_data,
            prompt=prompt.prompt
        )
        
        # Cache the response in the background (disabled for testing)
        # background_tasks.add_task(cache_response, prompt.prompt, game_response)
        
        return game_response
        
    except Exception as e:
        logger.error(f"Game generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Game generation failed: {str(e)}") 