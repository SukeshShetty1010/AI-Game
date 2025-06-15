"""
Ultra-Fast Image Generation Service

This service creates pixel art images using procedural generation and simple patterns
for ultra-fast performance. Perfect for browser-based games that need instant loading.
"""

import os
import logging
import uuid
import random
import math
from typing import Optional, Dict, Any, List, Tuple
from pathlib import Path
from PIL import Image, ImageDraw
import requests
from io import BytesIO

logger = logging.getLogger(__name__)

class UltraFastPixelArtGenerator:
    """Ultra-fast pixel art generator using procedural generation."""
    
    def __init__(self):
        # Pixel art color palettes
        self.palettes = {
            "fantasy": ["#8B4513", "#228B22", "#4169E1", "#FFD700", "#DC143C", "#9370DB", "#FF4500", "#000000"],
            "forest": ["#006400", "#228B22", "#32CD32", "#8B4513", "#A0522D", "#654321", "#2F4F2F", "#000000"],
            "dungeon": ["#2F2F2F", "#696969", "#8B4513", "#CD853F", "#B22222", "#4B0082", "#191970", "#000000"],
            "desert": ["#F4A460", "#DEB887", "#D2691E", "#CD853F", "#A0522D", "#8B4513", "#654321", "#000000"],
            "ice": ["#E0FFFF", "#B0E0E6", "#87CEEB", "#4682B4", "#191970", "#000080", "#483D8B", "#000000"]
        }
        
        self.character_templates = {
            "knight": {"colors": ["#C0C0C0", "#FFD700", "#8B0000", "#000000"], "pattern": "armor"},
            "wizard": {"colors": ["#4B0082", "#9370DB", "#FFD700", "#000000"], "pattern": "robe"},
            "archer": {"colors": ["#228B22", "#8B4513", "#FFD700", "#000000"], "pattern": "hood"},
            "warrior": {"colors": ["#8B4513", "#CD853F", "#B22222", "#000000"], "pattern": "simple"},
            "rogue": {"colors": ["#2F2F2F", "#696969", "#8B0000", "#000000"], "pattern": "cloak"}
        }
        
        logger.info("Ultra-Fast Pixel Art Generator initialized")
    
    def _get_palette_for_prompt(self, prompt: str) -> List[str]:
        """Get appropriate color palette based on prompt keywords."""
        prompt_lower = prompt.lower()
        
        if any(word in prompt_lower for word in ["forest", "tree", "nature", "green"]):
            return self.palettes["forest"]
        elif any(word in prompt_lower for word in ["dungeon", "cave", "dark", "underground"]):
            return self.palettes["dungeon"]
        elif any(word in prompt_lower for word in ["desert", "sand", "hot", "dry"]):
            return self.palettes["desert"]
        elif any(word in prompt_lower for word in ["ice", "snow", "cold", "frozen"]):
            return self.palettes["ice"]
        else:
            return self.palettes["fantasy"]
    
    def _create_pixel_pattern(self, width: int, height: int, colors: List[str], pattern_type: str = "random") -> Image.Image:
        """Create a pixel art pattern."""
        img = Image.new('RGB', (width, height), colors[0])
        draw = ImageDraw.Draw(img)
        
        if pattern_type == "checkerboard":
            block_size = 8
            for x in range(0, width, block_size):
                for y in range(0, height, block_size):
                    if (x // block_size + y // block_size) % 2 == 0:
                        color = colors[1] if len(colors) > 1 else colors[0]
                        draw.rectangle([x, y, x + block_size, y + block_size], fill=color)
        
        elif pattern_type == "stripes":
            stripe_height = 16
            for y in range(0, height, stripe_height):
                color_idx = (y // stripe_height) % len(colors)
                draw.rectangle([0, y, width, y + stripe_height], fill=colors[color_idx])
        
        elif pattern_type == "dots":
            dot_size = 4
            spacing = 16
            for x in range(spacing//2, width, spacing):
                for y in range(spacing//2, height, spacing):
                    color = random.choice(colors[1:] if len(colors) > 1 else colors)
                    draw.ellipse([x-dot_size, y-dot_size, x+dot_size, y+dot_size], fill=color)
        
        return img
    
    def _create_character_sprite(self, character_type: str, colors: List[str]) -> Image.Image:
        """Create a simple character sprite."""
        img = Image.new('RGB', (64, 64), colors[-1])  # Black background
        draw = ImageDraw.Draw(img)
        
        # Head
        head_color = colors[0] if len(colors) > 0 else "#FFDBAC"
        draw.ellipse([20, 8, 44, 32], fill=head_color, outline=colors[-1], width=2)
        
        # Eyes
        draw.ellipse([26, 16, 30, 20], fill=colors[-1])
        draw.ellipse([34, 16, 38, 20], fill=colors[-1])
        
        # Body
        body_color = colors[1] if len(colors) > 1 else colors[0]
        if character_type == "knight":
            # Armor
            draw.rectangle([24, 32, 40, 52], fill=body_color, outline=colors[-1], width=2)
            # Chest plate detail
            draw.rectangle([28, 36, 36, 44], fill=colors[2] if len(colors) > 2 else colors[0])
        elif character_type == "wizard":
            # Robe
            draw.polygon([(20, 32), (44, 32), (48, 56), (16, 56)], fill=body_color, outline=colors[-1])
            # Hat
            draw.polygon([(24, 8), (40, 8), (32, 0)], fill=colors[1])
        else:
            # Simple body
            draw.rectangle([24, 32, 40, 52], fill=body_color, outline=colors[-1], width=2)
        
        # Arms
        draw.rectangle([16, 36, 24, 48], fill=colors[0], outline=colors[-1], width=1)
        draw.rectangle([40, 36, 48, 48], fill=colors[0], outline=colors[-1], width=1)
        
        # Legs
        draw.rectangle([26, 52, 32, 64], fill=colors[0], outline=colors[-1], width=1)
        draw.rectangle([32, 52, 38, 64], fill=colors[0], outline=colors[-1], width=1)
        
        return img
    
    def _create_background_scene(self, scene_type: str, colors: List[str]) -> Image.Image:
        """Create a background scene."""
        img = Image.new('RGB', (512, 512), colors[0])
        draw = ImageDraw.Draw(img)
        
        if "forest" in scene_type.lower():
            # Sky
            draw.rectangle([0, 0, 512, 200], fill="#87CEEB")
            
            # Trees
            tree_positions = [100, 200, 350, 450]
            for x in tree_positions:
                # Trunk
                draw.rectangle([x-8, 200, x+8, 400], fill=colors[3] if len(colors) > 3 else "#8B4513")
                # Leaves
                draw.ellipse([x-40, 120, x+40, 240], fill=colors[1] if len(colors) > 1 else "#228B22")
            
            # Ground
            draw.rectangle([0, 400, 512, 512], fill=colors[2] if len(colors) > 2 else "#90EE90")
            
        elif "dungeon" in scene_type.lower() or "cave" in scene_type.lower():
            # Dark background
            draw.rectangle([0, 0, 512, 512], fill=colors[0])
            
            # Stone walls
            for i in range(0, 512, 64):
                for j in range(0, 512, 64):
                    if random.random() > 0.3:
                        stone_color = random.choice(colors[1:4] if len(colors) > 3 else colors)
                        draw.rectangle([i, j, i+64, j+64], fill=stone_color, outline=colors[-1], width=2)
            
            # Torches
            torch_positions = [(64, 128), (448, 128), (256, 384)]
            for x, y in torch_positions:
                draw.rectangle([x-4, y, x+4, y+32], fill="#8B4513")
                draw.ellipse([x-8, y-8, x+8, y+8], fill="#FF4500")
        
        else:
            # Generic landscape
            # Sky
            draw.rectangle([0, 0, 512, 256], fill="#87CEEB")
            
            # Mountains
            points = [(0, 256), (128, 128), (256, 200), (384, 100), (512, 180), (512, 256)]
            draw.polygon(points, fill=colors[1] if len(colors) > 1 else "#8B7355")
            
            # Ground
            draw.rectangle([0, 256, 512, 512], fill=colors[2] if len(colors) > 2 else "#90EE90")
        
        return img
    
    def _upscale_pixel_art(self, img: Image.Image, target_size: Tuple[int, int] = (512, 512)) -> Image.Image:
        """Upscale pixel art maintaining crisp pixels."""
        return img.resize(target_size, Image.NEAREST)
    
    def _save_image(self, image: Image.Image, filename: str) -> str:
        """Save image to the assets directory."""
        # Use the mounted client assets directory
        assets_dir = Path("/app/client_assets")
        assets_dir.mkdir(parents=True, exist_ok=True)
        
        # Save the image
        file_path = assets_dir / filename
        image.save(file_path, "PNG", optimize=True)
        
        logger.info(f"Image saved to: {file_path}")
        return f"assets/{filename}"
    
    def generate_avatar_image(self, prompt: str, seed: Optional[int] = None) -> str:
        """Generate an avatar/character image ultra-fast."""
        logger.info(f"Generating avatar image: {prompt}")
        
        if seed:
            random.seed(seed)
        
        # Determine character type from prompt
        prompt_lower = prompt.lower()
        character_type = "warrior"  # default
        
        for char_type in self.character_templates.keys():
            if char_type in prompt_lower:
                character_type = char_type
                break
        
        # Get colors
        colors = self.character_templates.get(character_type, self.character_templates["warrior"])["colors"]
        
        # Create character sprite
        sprite = self._create_character_sprite(character_type, colors)
        
        # Upscale to final size
        final_image = self._upscale_pixel_art(sprite, (512, 512))
        
        # Save and return path
        filename = f"avatar_{uuid.uuid4().hex[:8]}.png"
        return self._save_image(final_image, filename)
    
    def generate_background_image(self, prompt: str, seed: Optional[int] = None) -> str:
        """Generate a background/environment image ultra-fast."""
        logger.info(f"Generating background image: {prompt}")
        
        if seed:
            random.seed(seed)
        
        # Get appropriate colors
        colors = self._get_palette_for_prompt(prompt)
        
        # Create background scene
        background = self._create_background_scene(prompt, colors)
        
        # Save and return path
        filename = f"background_{uuid.uuid4().hex[:8]}.png"
        return self._save_image(background, filename)
    
    def generate_npc_image(self, prompt: str, seed: Optional[int] = None) -> str:
        """Generate an NPC character image ultra-fast."""
        logger.info(f"Generating NPC image: {prompt}")
        
        if seed:
            random.seed(seed)
        
        # Determine NPC type from prompt
        prompt_lower = prompt.lower()
        npc_type = "warrior"  # default
        
        # Look for NPC-specific keywords
        if any(word in prompt_lower for word in ["merchant", "trader", "shop"]):
            npc_type = "merchant"
        elif any(word in prompt_lower for word in ["guard", "soldier"]):
            npc_type = "knight"
        elif any(word in prompt_lower for word in ["mage", "wizard", "magic"]):
            npc_type = "wizard"
        elif any(word in prompt_lower for word in ["thief", "rogue", "assassin"]):
            npc_type = "rogue"
        
        # Get colors
        colors = self.character_templates.get(npc_type, self.character_templates["warrior"])["colors"]
        
        # Create NPC sprite
        sprite = self._create_character_sprite(npc_type, colors)
        
        # Upscale to final size
        final_image = self._upscale_pixel_art(sprite, (512, 512))
        
        # Save and return path
        filename = f"npc_{uuid.uuid4().hex[:8]}.png"
        return self._save_image(final_image, filename)


# Global instance
image_generator = UltraFastPixelArtGenerator()


def generate_game_images(game_data: Dict[str, Any]) -> Dict[str, str]:
    """
    Generate all images for a game based on the game data.
    
    Args:
        game_data: Dictionary containing game information
        
    Returns:
        Dictionary with image filenames for avatar, background, and npc
    """
    logger.info("Starting ultra-fast image generation for game...")
    
    try:
        # Extract relevant information from game data
        avatar_prompt = "brave knight warrior"
        background_prompt = "magical forest landscape"
        npc_prompt = "wise wizard merchant"
        
        # Try to extract better prompts from game data if available
        if "avatar" in game_data:
            avatar_data = game_data["avatar"]
            if isinstance(avatar_data, dict) and "description" in avatar_data:
                avatar_prompt = avatar_data["description"]
        
        if "scenes" in game_data:
            scenes = game_data["scenes"]
            if isinstance(scenes, list) and len(scenes) > 0:
                first_scene = scenes[0]
                if isinstance(first_scene, dict) and "description" in first_scene:
                    background_prompt = first_scene["description"]
        
        if "npcs" in game_data:
            npcs = game_data["npcs"]
            if isinstance(npcs, list) and len(npcs) > 0:
                first_npc = npcs[0]
                if isinstance(first_npc, dict) and "description" in first_npc:
                    npc_prompt = first_npc["description"]
        
        # Generate images ultra-fast
        avatar_path = image_generator.generate_avatar_image(avatar_prompt)
        background_path = image_generator.generate_background_image(background_prompt)
        npc_path = image_generator.generate_npc_image(npc_prompt)
        
        result = {
            "avatar": avatar_path,
            "background": background_path,
            "npc": npc_path
        }
        
        logger.info(f"Ultra-fast image generation completed: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Error in generate_game_images: {e}")
        # Return empty paths on error
        return {
            "avatar": None,
            "background": None,
            "npc": None
        }


class ImageGenerator:
    """Legacy wrapper for backward compatibility."""
    
    def __init__(self):
        self.generator = image_generator
    
    def generate_avatar_image(self, prompt: str, seed: Optional[int] = None) -> str:
        return self.generator.generate_avatar_image(prompt, seed)
    
    def generate_background_image(self, prompt: str, seed: Optional[int] = None) -> str:
        return self.generator.generate_background_image(prompt, seed)
    
    def generate_npc_image(self, prompt: str, seed: Optional[int] = None) -> str:
        return self.generator.generate_npc_image(prompt, seed) 