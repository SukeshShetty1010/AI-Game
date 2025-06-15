# AI LoreCrafter

AI LoreCrafter is a one-shot, portrait-mode, browser-based RPG generator. The user provides a 1–2 line prompt, and the system produces a full game play-through (avatar, world, NPCs, dialogue choices, a mini-game, and a conclusion) – all content is AI-generated (story, visuals, backgrounds, UI, enemy AI behaviors).

## Project Structure

- **Backend**: Python FastAPI application for game generation logic
- **Frontend**: TypeScript with Phaser 3 game engine for browser-based gameplay
- **AI Components**: 
  - Groq LLM for scene generation
  - AI image generation for assets
  - RL model for enemy AI behaviors

## Features

- End-to-end AI-generated RPG content (story, visuals, gameplay)
- Dynamic scene rendering from LLM-generated DSL (Domain Specific Language)
- AI-generated pixel art assets with consistent style (8-color palette, 2px outline)
- Reinforcement Learning-driven enemy behaviors
- Interactive dialogue with branching choices

## Setup Instructions

### Prerequisites

- Docker and Docker Compose
- Node.js and npm (for local frontend development)
- Python 3.9+ (for local backend development)
- Groq API key (for LLM integration)
- Image generation API key (if using external service)

### Environment Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in required API keys
3. Run `docker-compose up` to start both backend and frontend services

### Local Development

#### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd client
npm install
npm run dev
```

## Usage

1. Open the application in your browser (default: http://localhost:3000)
2. Enter a 1-2 line prompt describing your desired adventure
3. Click "Generate Game" and wait for the AI to create your unique RPG experience
4. Play through the generated game with dialogue choices and mini-games
5. Experience the conclusion based on your choices and performance

## License

[MIT License](LICENSE) 