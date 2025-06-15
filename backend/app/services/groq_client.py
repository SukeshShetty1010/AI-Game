import os
import json
import logging
from typing import Dict, Any
from groq import Groq
from fastapi import HTTPException

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variable for Groq API key
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "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")

# System prompt for game generation
SYSTEM_PROMPT = """
You are an 8-bit RPG storyteller. Produce concise text that fits inside a 320×180 canvas. Stay family-friendly.

USER SEED:
"{{user_seed}}"

TASK:
1. Populate / invent:
   • setting (1-3 words, vivid and immersive, e.g., "Glowing Shadowwood")
   • protagonist_role (1-3 words, heroic archetype)
   • npc {name, trait} (1 word each, trait reflects personality)
   • objective (≤6 words, includes personal stake, e.g., "Restore family honor")
   • twist (short clause, specific trap/obstacle, e.g., "Shadows hide enemies")
2. Write narrative beats **≤ 200 words total (soft limit)** with proper dialogues:
   • Hook ≤25 w (narrative, vivid setting description, no dialogue)
   • Quest Offer ≤35 w (NPC dialogue in quotes, e.g., "Name: Quest text")
   • choice_a / choice_b ≤12 w each (player-spoken options in quotes, lead to distinct challenges, e.g., ghost fight vs. puzzle)
   • Challenge intro ≤20 w (narrative, reflects choice and twist as trap/obstacle, soft limit)
   • Climax ≤35 w (NPC dialogue in quotes, includes backstory, reacts to choice and challenge)
   • ending_good / ending_bad ≤40 w each (narrative, reflects choice and twist outcome)
   • epilogue ≤18 w (narrative, hints at new quest, soft limit)
3. Return **only** this JSON:
{
  "setting": "str",
  "protagonist_role": "str",
  "objective": "str",
  "twist": "str",
  "npc": { "name": "str", "trait": "str" },
  "hook": "str",
  "quest_offer": "str",
  "choice_a": "str",
  "choice_b": "str",
  "challenge_intro": "str",
  "climax": "str",
  "ending_good": "str",
  "ending_bad": "str",
  "epilogue": "str"
}
4. Guardrails:
   • PG-10 language, no profanity / hate / politics / explicit content.
   • Use quotation marks for dialogues in quest_offer, choice_a, choice_b, climax.
   • Ensure choice_a and choice_b lead to distinct challenges (e.g., fight vs. puzzle).
   • Include protagonist's personal stake in objective or epilogue.
   • Include NPC backstory in climax dialogue.
   • Reflect twist as a trap/obstacle in challenge_intro (preferred, not mandatory).
   • Epilogue must hint at a new quest.
   • Reject disallowed seeds with { "error": "seed_not_allowed" }.
"""

def validate_output(output, max_words=200):
    """Validate the LLM output against schema and guardrails."""
    required_keys = [
        "setting", "protagonist_role", "objective", "twist", "npc",
        "hook", "quest_offer", "choice_a", "choice_b", "challenge_intro",
        "climax", "ending_good", "ending_bad", "epilogue"
    ]
    word_limits = {
        "hook": 25,
        "quest_offer": 35,
        "choice_a": 12,
        "choice_b": 12,
        "climax": 35,
        "ending_good": 40,
        "ending_bad": 40
    }

    # Check JSON structure
    if not isinstance(output, dict) or "error" in output:
        return False, output.get("error", "Invalid JSON structure")

    if not all(key in output for key in required_keys):
        return False, "Missing required JSON keys"

    if not isinstance(output["npc"], dict) or not all(k in output["npc"] for k in ["name", "trait"]):
        return False, "Invalid NPC structure"

    # Check word limits (log warnings instead of failing for challenge_intro and epilogue)
    total_words = 0
    for key, limit in word_limits.items():
        text = output.get(key, "")
        word_count = len(text.split())
        if word_count > limit:
            logger.warning(f"{key} exceeds {limit} words")
        total_words += word_count

    # Check challenge_intro and epilogue (soft limits)
    if output.get("challenge_intro", ""):
        word_count = len(output["challenge_intro"].split())
        if word_count > 20:
            logger.warning(f"challenge_intro exceeds 20 words")

    if output.get("epilogue", ""):
        word_count = len(output["epilogue"].split())
        if word_count > 18:
            logger.warning(f"epilogue exceeds 18 words")

    if total_words > max_words:
        logger.warning(f"Total word count exceeds {max_words}")

    # Check dialogue formatting
    dialogue_fields = ["quest_offer", "choice_a", "choice_b", "climax"]
    for key in dialogue_fields:
        text = output.get(key, "")
        if text and not ('"' in text or "'" in text):
            return False, f"{key} missing quotation marks for dialogue"

    return True, None

async def generate_game_content(prompt: str) -> Dict[str, Any]:
    """
    Generate game content using the Groq LLM API.
    
    Args:
        prompt: The user's prompt describing the desired game
        
    Returns:
        Dict containing the complete game data
        
    Raises:
        HTTPException: If the API request fails
    """
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY environment variable not set")
    
    # Initialize Groq client
    client = Groq(api_key=GROQ_API_KEY)
    
    # Prepare messages
    system_prompt = SYSTEM_PROMPT.replace("{{user_seed}}", prompt)
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt}
    ]
    
    max_attempts = 3
    best_output = None
    best_error = "No valid output"
    
    for attempt in range(max_attempts):
        logger.info(f"Attempt {attempt + 1}: Sending request to LLM")
        try:
            response = client.chat.completions.create(
                model="llama3-70b-8192",
                messages=messages,
                temperature=0.1,
                max_tokens=8000
            )
            
            content = response.choices[0].message.content
            output = json.loads(content)
            
            # Validate output
            is_valid, error = validate_output(output)
            if is_valid:
                logger.info("Generated valid game content")
                return {"game_data": output, "prompt": prompt}
            else:
                logger.warning(f"Validation failed: {error}")
                best_output = output
                best_error = error
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {str(e)}")
            best_error = f"JSON parsing error: {str(e)}"
        except Exception as e:
            logger.error(f"LLM request failed: {str(e)}")
            best_error = str(e)
    
    # Return the last output even if it failed validation
    if best_output:
        logger.info("Returning last output despite validation failures")
        return {"game_data": best_output, "prompt": prompt}
    
    raise HTTPException(status_code=500, detail=f"Game generation failed: {best_error}") 