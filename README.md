# jolly

🃏 **Jolly Card Game** - A browser-based rummy-style card game with AI opponent

## Features

- **HTML5 Canvas Graphics** - High-quality card rendering with smooth animations
- **AI Opponent** - Play against an intelligent AI with 3 difficulty levels (Easy, Medium, Hard)
- **Complete Rummy Rules** - Form sets and sequences following classic Jolly/Rummy gameplay
- **Drag-and-Drop Interface** - Intuitive card play with both drag-and-drop and click support
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **Multi-Round Scoring** - Track scores across multiple rounds with penalty point system
- **Modern JavaScript** - Built with ES6 modules for clean, maintainable code

## How to Play

### Game Objective
Form valid sets and sequences with your cards. Be the first to create at least 2 sequences (including 1 pure sequence) and declare to win the round.

### Card Combinations

**Set:** 3-4 cards of the same rank but different suits
- Example: 7♠ 7♥ 7♦

**Sequence:** 3+ consecutive cards of the same suit
- Example: 5♠ 6♠ 7♠ 8♠

**Jolly (Joker):** Wild cards that can substitute for any card in sets or sequences

### Winning
- Form at least **2 sequences** (one must be pure - no jokers)
- All remaining cards must be in valid sets or sequences
- Click "Declare" when ready

### Scoring
- Successfully declare with valid melds: Opponent gets 80 penalty points
- Invalid declaration: You get double the points of unmatched cards
- First player to reach 500 points loses the game

## Getting Started

### Play Locally

1. Clone this repository:
```bash
git clone https://github.com/lelewithheart/jolly.git
cd jolly
```

2. Start a local web server:
```bash
# Using Python 3
python3 -m http.server 8000

# Or using Python 2
python -m SimpleHTTPServer 8000

# Or using Node.js
npx http-server -p 8000
```

3. Open your browser and navigate to:
```
http://localhost:8000
```

### Play Online

Simply open `index.html` in any modern web browser. The game runs entirely client-side with no backend required.

## Game Controls

- **New Game** - Start a fresh game
- **Draw from Deck** - Draw a card from the deck
- **Draw from Discard** - Take the top card from the discard pile
- **Sort Hand** - Organize your cards by suit and rank
- **Declare** - Announce your win (only enabled after drawing and forming valid melds)

## Technical Details

### Architecture

The game is built with a modular ES6 JavaScript architecture:

- **`config.js`** - Game constants and configuration
- **`card.js`** - Card and Deck classes
- **`rules.js`** - Game rules validation and meld detection
- **`ai.js`** - AI player with strategic decision-making
- **`renderer.js`** - Canvas-based rendering engine
- **`game.js`** - Main game controller and state management
- **`main.js`** - Application entry point

### Browser Compatibility

Requires a modern browser with ES6 module support:
- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 16+

## Development

The codebase uses vanilla JavaScript with no external dependencies. All game logic, rendering, and AI are implemented from scratch.

### Code Structure
```
jolly/
├── index.html          # Main game page
├── styles.css          # Game styling
├── js/
│   ├── config.js       # Configuration and constants
│   ├── card.js         # Card and deck management
│   ├── rules.js        # Game rules engine
│   ├── ai.js           # AI opponent logic
│   ├── renderer.js     # Canvas rendering
│   ├── game.js         # Game controller
│   └── main.js         # Entry point
└── README.md
```

## License

This project is open source and available for personal and educational use.

## Screenshots

![Jolly Card Game Welcome Screen](https://github.com/user-attachments/assets/679016c7-4a2f-4240-b89b-4003093e47ac)
*Welcome screen with game instructions*

![Jolly Card Game Gameplay](https://github.com/user-attachments/assets/c008fcd9-20ff-4a8b-aa21-ce4a47f78ba6)
*Active gameplay showing player hand, AI hand (face down), deck and discard pile*

![Jolly Card Game Sorted Hand](https://github.com/user-attachments/assets/492878c1-b1a1-4373-b9e9-1e76b3955019)
*Cards sorted by suit for easier meld formation*

## Credits

Developed as a modern browser-based card game implementation with focus on clean code, smooth animations, and intelligent AI gameplay.
