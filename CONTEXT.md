# Jolly Card Game - Technical Context

This document provides detailed technical information about the Jolly card game implementation for AI assistants and developers working on the codebase.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [File Structure](#file-structure)
- [Module Details](#module-details)
- [Game State Management](#game-state-management)
- [Game Rules Implementation](#game-rules-implementation)
- [AI System](#ai-system)
- [Rendering System](#rendering-system)
- [User Interaction Patterns](#user-interaction-patterns)
- [Constants and Configuration](#constants-and-configuration)
- [Common Patterns and Conventions](#common-patterns-and-conventions)

---

## Architecture Overview

The Jolly card game is a client-side browser application built with vanilla ES6 JavaScript modules. There is **no backend** - all game logic, AI, and rendering runs entirely in the browser.

### Tech Stack
- **HTML5** - Page structure
- **CSS3** - Styling with CSS variables and responsive design
- **JavaScript ES6+** - Modules, classes, async/await
- **HTML5 Canvas** - Game board rendering (AI hand, deck, discard row, melds)
- **DOM Elements** - Player hand cards (for interactivity)

### Design Patterns
- **Module Pattern** - Each file exports classes/functions
- **MVC-like Separation** - Game (controller), Renderer (view), Rules (model)
- **Observer Pattern** - Event listeners for user interactions
- **Strategy Pattern** - AI difficulty levels

---

## File Structure

```
jolly/
├── index.html          # Main HTML page with game layout
├── styles.css          # All CSS styling (438 lines)
├── README.md           # User-facing documentation
├── CONTEXT.md          # This technical context file
└── js/
    ├── main.js         # Entry point, initializes Game
    ├── game.js         # Main game controller (~693 lines)
    ├── card.js         # Card, Deck, Hand classes (~173 lines)
    ├── rules.js        # GameRules static class (~324 lines)
    ├── ai.js           # AIPlayer class (~257 lines)
    ├── renderer.js     # Canvas Renderer class (~291 lines)
    └── config.js       # Constants and configuration (~118 lines)
```

---

## Module Details

### `config.js` - Configuration and Constants

Exports game configuration constants used throughout the codebase.

#### Key Exports

| Export | Type | Description |
|--------|------|-------------|
| `SUITS` | Object | Card suits: `♥`, `♦`, `♣`, `♠` |
| `RANKS` | Array | `['A', '2', ..., 'K']` |
| `CARD_VALUES` | Object | Maps rank to numeric value (A=1, K=13) |
| `COLORS` | Object | Maps suits to `'red'` or `'black'` |
| `CONFIG` | Object | Game configuration (see below) |
| `AI_DIFFICULTY` | Object | Three difficulty presets |
| `ANIMATION_DURATION` | Object | Timing for animations |
| `CARD_DIMENSIONS` | Object | Card sizes for rendering |
| `DISCARD_ROW` | Object | Discard row display constants |
| `SUIT_ORDER` | Array | Order for sorting: ♠, ♥, ♦, ♣ |
| `getCardPointValue(card)` | Function | Penalty points for hand at round end |
| `getMeldPointValue(card, isHighAce)` | Function | Meld points for first meld requirement |

#### CONFIG Object
```javascript
{
    STARTING_HAND_SIZE: 13,      // Starting player gets 13 cards
    OTHER_HAND_SIZE: 12,         // Other players get 12 cards
    MIN_SET_SIZE: 3,             // Minimum cards in set/sequence
    MIN_SEQUENCE_SIZE: 3,
    JOKER_COUNT: 8,              // 8 Jokers in deck
    FIRST_MELD_MIN_POINTS: 30,   // First meld requirement
    ZUDREHEN_BONUS: 30,          // Bonus for ending round
    WIN_THRESHOLD_LOW: 500,
    WIN_THRESHOLD_HIGH: 1000,
    THREE_ACES_POINTS: 25        // Special scoring for A-A-A
}
```

#### Point Values

**Penalty Points (hand at round end):**
| Card | Points |
|------|--------|
| 2-9 | 5 |
| 10, J, Q, K | 10 |
| Ace | 25 |
| Joker | 50 |

**Meld Points (first meld requirement):**
| Card | Points |
|------|--------|
| 2-9 | 5 |
| 10, J, Q, K | 10 |
| Ace as low (A-2-3) | 5 |
| Ace as high (Q-K-A) | 10 |
| Three Aces set | 25 total |
| Joker | Value of replaced card |

---

### `card.js` - Card, Deck, Hand Classes

#### `Card` Class

Represents a single playing card.

```javascript
class Card {
    constructor(suit, rank, isJoker = false)
    
    // Properties
    suit       // '♥', '♦', '♣', '♠', or null for Joker
    rank       // 'A', '2'-'10', 'J', 'Q', 'K', or null for Joker
    isJoker    // boolean
    id         // Unique identifier (e.g., "♥-A" or "JOKER-0")
    
    // Getters
    color         // 'red', 'black', or 'joker'
    value         // Numeric: A=1, 2-10, J=11, Q=12, K=13
    displayRank   // String for display
    displaySuit   // String for display
    
    // Methods
    equals(other) // Compare by id
    toString()    // e.g., "A♥" or "JOKER"
}
```

#### `Deck` Class

Manages the draw pile.

```javascript
class Deck {
    constructor()  // Creates and shuffles 60-card deck
    
    // Properties
    cards     // Array of Card objects
    count     // Number of cards remaining
    
    // Methods
    initialize()        // Reset deck to full 60 cards
    shuffle()           // Fisher-Yates shuffle
    draw()              // Pop and return top card
    addCards(cards)     // Add cards back (for reshuffling)
    isEmpty()           // Check if empty
}
```

#### `Hand` Class

Manages a player's hand.

```javascript
class Hand {
    constructor()
    
    // Properties
    cards     // Array of Card objects
    count     // Number of cards
    
    // Methods
    addCard(card)       // Add to hand
    removeCard(card)    // Remove by equality
    sort()              // Sort by suit then rank
    hasCard(card)       // Check if card in hand
    clear()             // Remove all cards
}
```

#### `createDOMCard(card, index)` Function

Creates an HTML element for a card in the player's hand.

```javascript
// Returns <div class="card red|black|joker" data-card-id="...">
//   with card-rank, card-center, card-suit child elements
```

---

### `rules.js` - GameRules Static Class

All methods are static. Handles meld validation, scoring, and game logic.

#### Meld Validation

```javascript
GameRules.isValidSet(cards)
// Returns true if cards form a valid set (3+ same rank)
// Jokers can substitute, but can't be all jokers

GameRules.isValidSequence(cards)
// Returns true if cards form a valid sequence (3+ consecutive same suit)
// Ace can be low (A-2-3) or high (Q-K-A)
// Jokers can fill gaps

GameRules.isPureSequence(cards)
// True if sequence with no jokers

GameRules.isHighAceSequence(cards)
// True if Ace is used as high (after King)
```

#### Meld Finding and Scoring

```javascript
GameRules.findMelds(cards)
// Returns array of { type: 'set'|'sequence', cards: [...], pure?: boolean }
// Finds all non-overlapping melds in a hand

GameRules.calculateMeldPoints(meld)
// Returns point value for a single meld

GameRules.calculateTotalMeldPoints(melds)
// Sum of all meld points

GameRules.meetsFirstMeldRequirement(melds)
// True if total >= 30 points
```

#### Game Actions

```javascript
GameRules.canExtendMeld(meld, card)
// True if card can be added to existing meld

GameRules.canZudrehen(playerHand, tableMelds)
// True if player has exactly 1 unusable card (not joker)

GameRules.calculateHandPoints(cards)
// Penalty points for remaining hand at round end

GameRules.suggestDiscard(cards)
// AI helper: suggests best card to discard
```

#### Internal Helpers

```javascript
GameRules.isValidSequenceWithAceValue(nonJokers, jokerCount, aceValue)
// Check sequence validity with specific ace value (1 or 14)

GameRules.estimateJokerValue(meld)
// Estimate joker point value based on meld context

GameRules.getCombinations(arr, size)
// Generate all combinations of given size

GameRules.hasOverlap(cards, usedSet)
// Check if any card id is in used set
```

---

### `game.js` - Game Controller

The main `Game` class manages all game state and orchestrates gameplay.

#### State Properties

```javascript
// Core game state
deck                // Deck instance
playerHand          // Hand instance
aiPlayer            // AIPlayer instance
discardRow          // Array of discarded cards
tableMelds          // Array of { type, cards, owner } on table
currentTurn         // 'player' | 'ai'
gameState           // 'waiting' | 'playing' | 'playerTurn' | 'aiTurn' | 'gameOver'

// Scoring
round               // Current round number
playerScore         // Cumulative player score
aiScore             // Cumulative AI score
targetScore         // 500 or 1000

// Turn state
hasDrawn            // Has player drawn this turn?
playerHasMelded     // Has player laid first meld?
aiHasMelded         // Has AI laid first meld?
isFirstTurn         // Starting player must draw first

// Selection state
selectedCard        // Single selected card (deprecated)
selectedCards       // Array of selected cards for meld

// DOM references
canvas, playerHandEl, gameStatusEl, etc.
renderer            // Renderer instance
```

#### Key Methods

**Game Flow:**
```javascript
startNewGame()      // Reset scores, start round 1
startNewRound()     // Deal cards, reset turn state

drawFromDeck()      // Player draws from deck
drawFromDiscardRow()           // Player draws from discard row (button)
drawFromDiscardRowAtIndex(i)   // Player draws from specific discard position (canvas click)

layMeld()           // Lay selected cards as meld
extendMeld(meldIndex, card)    // Add card to existing meld
discardCard(card)   // Discard to end turn
zudrehen()          // End round with last card

aiTurn()            // Execute AI turn (async)
handleZudrehen(winner)         // Process round end
checkGameOver()     // Check if game ended
```

**UI Methods:**
```javascript
renderPlayerHand()  // Rebuild player hand DOM
updateCounts()      // Update deck/discard counts
updateScores()      // Update score display
updateButtons()     // Enable/disable buttons based on state
updateStatus(msg)   // Update status message
showModal(title, msg)
hideModal()
render()            // Redraw canvas
```

**Event Handlers:**
```javascript
handleCardClick(e)           // Click on player's card
handleCanvasClick(e)         // Click on canvas (discard row)
handleCanvasMouseMove(e)     // Cursor change on discard row
handleDragStart(e)           // Card drag start
handleDragEnd(e)             // Card drag end
toggleCardSelection(cardEl, card)  // Select/deselect card
getCanvasCoordinates(e)      // Mouse event to canvas coords
getDiscardRowCardIndex(x, y) // Canvas coords to discard card index
```

---

### `ai.js` - AI Player

The `AIPlayer` class implements the computer opponent.

#### Properties

```javascript
difficulty   // AI_DIFFICULTY preset object
hand         // Array of Card objects
hasMelded    // Has AI laid first meld?
```

#### Difficulty Settings

```javascript
AI_DIFFICULTY = {
    EASY: { thinkTime: 1000, errorRate: 0.3, strategyDepth: 1 },
    MEDIUM: { thinkTime: 1500, errorRate: 0.15, strategyDepth: 2 },
    HARD: { thinkTime: 2000, errorRate: 0.05, strategyDepth: 3 }
}
```

- **errorRate**: Chance of making random/suboptimal choices
- **strategyDepth**: Enables more advanced strategies at higher levels
- **thinkTime**: Artificial delay for realism

#### Key Methods

```javascript
setDifficulty(difficulty)
// Set 'easy', 'medium', or 'hard'

shouldDrawFromDiscardRow(discardCard, hasMelded)
// Decide draw source (considers if improves melds)

chooseDiscard(drewCard)
// Choose card to discard (uses GameRules.suggestDiscard)

findMeldsToLay(hasMelded)
// Find valid melds to lay (respects 30-point requirement)

canZudrehen(tableMelds)
// Check if can end round

async takeTurn(deck, discardRow, tableMelds, hasMelded, onUpdate)
// Execute full turn, returns { action, card, meldsLaid }
```

#### AI Turn Flow

1. Wait for `thinkTime`
2. Decide draw source (deck vs discard row)
3. Draw card and add to hand
4. Find and lay melds if possible
5. Check if can zudrehen
6. Choose and discard card
7. Return action result

---

### `renderer.js` - Canvas Renderer

The `Renderer` class handles all canvas drawing.

#### Properties

```javascript
canvas      // Canvas element
ctx         // 2D context
width       // Canvas width (CSS pixels)
height      // Canvas height (CSS pixels)
```

#### Key Methods

```javascript
setupCanvas()      // Handle DPR scaling
clear()            // Clear canvas
resize()           // Recalculate dimensions

drawCard(x, y, card, faceUp, scale)
// Draw single card (face up or back)

drawHand(cards, y, faceUp, spread)
// Draw horizontal row of cards (AI hand)

drawDeck(cardCount, x, y)
// Draw deck stack with count

drawDiscardPile(cards, x, y)
// Draw discard row (last 5 cards visible)

drawTableMelds(melds, x, y)
// Draw melds on table (with wrapping)

drawText(text, x, y, options)
// Draw text with styling

drawGameBoard(gameState)
// Main render method - draws entire game board

roundRect(x, y, w, h, r)
// Helper for rounded rectangle path
```

#### Game Board Layout

```
┌──────────────────────────────────────────────────────────────────┐
│                     AI Hand (face down cards)                     │  y=30
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                        Table Melds                               │  y=height/2-70
│                                                                  │
├────────────────────┬─────────────────────────────────────────────┤
│        Deck        │           Discard Row                       │  y=height/2+20
│     (stacked)      │     (last 5 cards overlapping)              │
│    x=width/2-150   │     x=width/2+20                            │
├────────────────────┴─────────────────────────────────────────────┤
│                     Turn Indicator                               │  y=height-30
└──────────────────────────────────────────────────────────────────┘
```

---

## Game State Management

### Turn Flow

```
Player Turn:
1. gameState = 'playerTurn'
2. hasDrawn = false
3. Player draws (deck or discard row)
4. hasDrawn = true
5. Player optionally lays melds
6. Player discards OR zudrehen
7. hasDrawn = false, switch to AI

AI Turn:
1. gameState = 'aiTurn'
2. AI executes takeTurn()
3. AI may lay melds, discard, or zudrehen
4. Switch to player
```

### Round Flow

```
1. startNewRound()
   - Create new deck
   - Clear hands, melds, discard row
   - Deal 13 cards to player, 12 to AI
   - Player goes first (must draw)

2. Play continues until zudrehen

3. handleZudrehen(winner)
   - Calculate penalty points from loser's hand
   - Winner gets penalty points + 30 bonus
   - Update scores

4. checkGameOver()
   - If score >= target: game over
   - Else: start next round
```

### Meld State

```javascript
// tableMelds array structure
[
    {
        type: 'set' | 'sequence',
        cards: [Card, Card, Card, ...],
        owner: 'player' | 'ai',
        pure: boolean  // Only for sequences
    },
    ...
]
```

---

## User Interaction Patterns

### Card Selection

**Before drawing:**
- Click toggles card selection
- Selected cards shown with `.selected` class

**After drawing:**
- Click unselected card: select it
- Click already-selected card: **discard it**
- This enables: Draw → Select → Click again to discard

### Discard Row Interaction

**Prerequisites:** Player has melded first, hasn't drawn this turn

**Button:** Takes only top card

**Canvas Click:** 
1. `handleCanvasClick()` detects click position
2. `getDiscardRowCardIndex()` finds which card was clicked
3. `drawFromDiscardRowAtIndex()` takes that card + all cards after it

**Hover:** Pointer cursor when over clickable discard cards

### Meld Creation

1. Select 3+ cards (click to toggle)
2. "Lay Meld" button enables when 3+ selected
3. Click button to validate and lay meld
4. Cards removed from hand, added to tableMelds

---

## Constants and Configuration

### Card Dimensions

```javascript
CARD_DIMENSIONS = {
    WIDTH: 70,
    HEIGHT: 100,
    RADIUS: 8,
    SPACING: 20
}
```

### Discard Row

```javascript
DISCARD_ROW = {
    MAX_VISIBLE: 5,       // Max cards shown
    CARD_SPACING: 25,     // Overlap between cards
    OFFSET_X: 20,         // X from center
    OFFSET_Y: 20          // Y from center
}
```

### Animation Timing

```javascript
ANIMATION_DURATION = {
    CARD_DEAL: 500,
    CARD_MOVE: 300,
    CARD_FLIP: 200,
    AI_THINKING: 1000
}
```

---

## Common Patterns and Conventions

### Card Identification

Cards are identified by `card.id`:
- Regular cards: `"♥-A"`, `"♠-10"`, `"♦-K"`
- Jokers: `"JOKER-0"`, `"JOKER-1"`, ... `"JOKER-7"`

### Equality Comparison

Always use `card.equals(other)` or compare `card.id`:
```javascript
// Correct
cards.find(c => c.equals(targetCard))
cards.filter(c => c.id !== card.id)

// Incorrect (object reference)
cards.includes(card)
```

### State Checks

```javascript
// Player can draw
if (this.gameState === 'playerTurn' && !this.hasDrawn)

// Player can draw from discard row
if (this.playerHasMelded && !this.hasDrawn && this.discardRow.length > 0)

// Player can lay meld
if (this.selectedCards.length >= CONFIG.MIN_SET_SIZE)

// Player can end round
if (this.hasDrawn && this.playerHand.count === 1)
```

### Error Handling

User actions are validated with status messages:
```javascript
if (!condition) {
    this.updateStatus('Error message explaining what went wrong');
    return;
}
```

### Async Operations

AI turn uses async/await with artificial delays:
```javascript
async takeTurn(...) {
    await this.wait(this.difficulty.thinkTime);
    // ... perform actions with intermediate waits
    await this.wait(300);
}
```

---

## Development Tips

### Debugging

The game instance is exposed globally:
```javascript
window.jollyGame  // Access in browser console
```

Useful debug checks:
```javascript
jollyGame.playerHand.cards       // View player's cards
jollyGame.aiPlayer.hand          // View AI's cards
jollyGame.discardRow             // View discard row
jollyGame.tableMelds             // View melds on table
jollyGame.hasDrawn               // Check turn state
```

### Common Issues

1. **Card not found in hand**: Ensure using `card.equals()` or matching by `id`
2. **Discard row not clickable**: Check `playerHasMelded` and `hasDrawn` state
3. **Meld validation fails**: Check joker limits and sequence/set rules
4. **Canvas coordinates wrong**: Account for DPR scaling

### Adding Features

When adding new features:
1. Update `config.js` for new constants
2. Update `rules.js` for game logic
3. Update `game.js` for state management
4. Update `renderer.js` for visual changes
5. Update `ai.js` if AI behavior needed

---

## Version History

- Initial implementation: Core game with AI opponent
- Bug fixes: Card click behavior, discard row selection
- Refactoring: Extract constants, helper methods

---

*Last updated: February 2026*
