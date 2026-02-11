# jolly

🃏 **Jolly Card Game** - A browser-based rummy-style card game with AI opponent

## Features

- **HTML5 Canvas Graphics** - High-quality card rendering with smooth animations
- **AI Opponent** - Play against an intelligent AI with 3 difficulty levels (Easy, Medium, Hard)
- **Complete Jolly Rules** - Form sets and sequences following the official Jolly ruleset
- **Drag-and-Drop Interface** - Intuitive card play with both drag-and-drop and click support
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **Multi-Round Scoring** - Track scores across multiple rounds with point-based system
- **Modern JavaScript** - Built with ES6 modules for clean, maintainable code

## Game Rules

### Cards & Players
- **60-card deck**: 52 standard cards + 8 Jokers (Jollys)
- 1-8 players supported
- Starting player receives **13 cards** and begins the game
- All other players receive **12 cards**

### Game Objective
Lay down all your cards in valid melds (sets and sequences) and end the round by "zudrehen" (turning down) with an unusable last card.

### Card Combinations

**Set:** 3+ cards of the same rank (suits don't matter)
- Example: 7♠ 7♥ 7♦

**Sequence:** 3+ consecutive cards of the same suit
- Example: 5♠ 6♠ 7♠ 8♠
- Ace can be low (A-2-3) or high (Q-K-A)

**Jolly (Joker):** Wild cards that can substitute for any card in sets or sequences

### First Meld Requirement
Your first meld must be worth at least **30 points**:

| Card | Value |
|------|------|
| 2-9 | 5 points |
| 10/J/Q/K | 10 points |
| Ace as 1 (low) | 5 points |
| Ace after King (high) | 10 points |
| Three Aces (A-A-A) | 25 points |
| Joker | Value of the card it replaces |

### Discard Row
- Instead of a discard pile, there's an open **discard row**
- You can only draw from the row **after laying your first meld**
- You may take multiple cards from the row (up to a card you can use in that turn)

### Turn Structure
1. **Draw**: Either from the deck OR from the discard row (after first meld)
2. **Lay Melds** (optional): Place valid sets/sequences on the table
3. **Extend Melds** (optional): Add cards to existing melds (yours or opponent's)
4. **End Turn**: Either discard a card OR end the round

### Ending the Round (Zudrehen)
A round ends when a player:
- Has exactly **one card left** that cannot be used anywhere
- The card is not a Joker (Jokers can always be used)

**Bonus**: The player who ends the round receives **+30 points**

### Scoring at Round End

Remaining cards in hand count as penalty points:

| Card | Value |
|------|------|
| 2-9 | 5 points |
| 10/J/Q/K | 10 points |
| Ace | 25 points |
| Joker | 50 points |

The player who ends the round receives:
- All opponent's penalty points
- +30 bonus for ending the round

### Game End
First player to reach the **target score** (500 or 1000 points, selectable) wins the game!

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
- **Draw from Row** - Take cards from the discard row (available after first meld)
- **Lay Meld** - Place selected cards as a meld on the table
- **Sort Hand** - Organize your cards by suit and rank
- **End Round** - End the round with your last unusable card

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
