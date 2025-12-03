# Chewatabingo - Bingo Game

## Overview
This is a web-based bingo game application called "Chewatabingo" with support for Telegram Web Apps. The game features a master grid displaying numbers 1-75 and a player bingo card with interactive gameplay.

## Project Type
Static web application (HTML, CSS, JavaScript)

## Project Structure
```
.
├── index.html    - Main HTML page with game layout
├── style.css     - Styling for the bingo game interface
├── game.js       - Game logic and interactivity
└── replit.md     - Project documentation
```

## Features
- **Master Grid**: Displays all numbers 1-75 in a 5x15 grid
- **Player Bingo Card**: Randomly generated 5x5 bingo card with B-I-N-G-O columns
- **Free Space**: Center cell marked as FREE and pre-selected
- **Interactive Gameplay**:
  - "አዲስ ካርድ" button: Generate new random bingo card
  - "Call" button: Randomly call numbers from the master grid
  - "Refresh" button: Reset the entire game
  - "BINGO" button: Check if player has won
- **Auto-marking**: Called numbers are automatically marked on both grids
- **Manual marking**: Players can click cells to mark/unmark them
- **Win Detection**: Checks for horizontal, vertical, and diagonal bingo

## Technologies
- Pure HTML5, CSS3, and vanilla JavaScript
- No external dependencies (except Telegram Web App API)
- Responsive design for mobile and desktop
- Dark theme with yellow accent colors

## Setup Notes
- The original repository had a corrupted `game.js` file containing HTML instead of JavaScript
- This has been fixed by creating proper game logic
- The game is configured as a static site deployment
- Server runs on port 5000 using Python's built-in HTTP server

## Deployment
- Deployment type: Static
- Public directory: `.` (root)
- The application can be published directly to Replit's hosting platform

## Recent Changes (December 3, 2025)
- Fixed corrupted game.js file by implementing proper game logic
- Configured Replit environment for static site hosting
- Set up Python HTTP server workflow on port 5000
- Configured static deployment settings
- Verified application functionality

## Language Support
- UI includes Amharic text (Ethiopian language)
- English buttons and interface elements
