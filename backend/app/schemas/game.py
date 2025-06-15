from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

class GamePrompt(BaseModel):
    """
    Schema for the game generation prompt.
    """
    prompt: str = Field(..., description="User prompt describing the desired game")

class NPC(BaseModel):
    """
    Schema for an NPC character.
    """
    name: str = Field(..., description="The name of the NPC")
    trait: str = Field(..., description="The trait of the NPC")

class GameImages(BaseModel):
    """
    Schema for generated game images.
    """
    avatar: Optional[str] = Field(None, description="Avatar/character image filename")
    background: Optional[str] = Field(None, description="Background/scene image filename")
    npc: Optional[str] = Field(None, description="NPC portrait image filename")

class GameData(BaseModel):
    """
    Schema for the game data returned by the LLM.
    """
    setting: str = Field(..., description="The game setting")
    protagonist_role: str = Field(..., description="The protagonist's role")
    objective: str = Field(..., description="The game objective")
    twist: str = Field(..., description="The game twist")
    npc: NPC = Field(..., description="The NPC character")
    hook: str = Field(..., description="The story hook")
    quest_offer: str = Field(..., description="The quest offer dialogue")
    choice_a: str = Field(..., description="First choice option")
    choice_b: str = Field(..., description="Second choice option")
    challenge_intro: str = Field(..., description="Challenge introduction")
    climax: str = Field(..., description="The story climax")
    ending_good: str = Field(..., description="Good ending text")
    ending_bad: str = Field(..., description="Bad ending text")
    epilogue: str = Field(..., description="Epilogue text")
    images: Optional[GameImages] = Field(None, description="Generated game images")

class GameResponse(BaseModel):
    """
    Schema for the game generation response.
    """
    game_data: GameData = Field(..., description="The generated game data")
    prompt: str = Field(..., description="The original prompt used to generate the game") 