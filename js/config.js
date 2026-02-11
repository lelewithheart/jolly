// Game configuration and constants
export const SUITS = {
    HEARTS: '♥',
    DIAMONDS: '♦',
    CLUBS: '♣',
    SPADES: '♠'
};

export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const CARD_VALUES = {
    'A': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    'J': 11,
    'Q': 12,
    'K': 13
};

export const COLORS = {
    [SUITS.HEARTS]: 'red',
    [SUITS.DIAMONDS]: 'red',
    [SUITS.CLUBS]: 'black',
    [SUITS.SPADES]: 'black'
};

export const CONFIG = {
    STARTING_HAND_SIZE: 13,      // Starting player gets 13 cards
    OTHER_HAND_SIZE: 12,         // Other players get 12 cards
    MIN_SET_SIZE: 3,
    MIN_SEQUENCE_SIZE: 3,
    JOKER_COUNT: 8,              // 8 Jokers (Jollys)
    FIRST_MELD_MIN_POINTS: 30,   // Minimum 30 points for first meld
    ZUDREHEN_BONUS: 30,          // Bonus for ending round
    WIN_THRESHOLD_LOW: 500,      // Low target score option
    WIN_THRESHOLD_HIGH: 1000,    // High target score option
    THREE_ACES_POINTS: 25        // Special value for three Aces set
};

export const AI_DIFFICULTY = {
    EASY: {
        name: 'Easy',
        thinkTime: 1000,
        errorRate: 0.3,
        strategyDepth: 1
    },
    MEDIUM: {
        name: 'Medium',
        thinkTime: 1500,
        errorRate: 0.15,
        strategyDepth: 2
    },
    HARD: {
        name: 'Hard',
        thinkTime: 2000,
        errorRate: 0.05,
        strategyDepth: 3
    }
};

export const ANIMATION_DURATION = {
    CARD_DEAL: 500,
    CARD_MOVE: 300,
    CARD_FLIP: 200,
    AI_THINKING: 1000
};

export const SUIT_ORDER = [SUITS.SPADES, SUITS.HEARTS, SUITS.DIAMONDS, SUITS.CLUBS];

export const CARD_DIMENSIONS = {
    WIDTH: 70,
    HEIGHT: 100,
    RADIUS: 8,
    SPACING: 20
};

// Discard row display constants
export const DISCARD_ROW = {
    MAX_VISIBLE: 5,        // Maximum number of visible cards in discard row
    CARD_SPACING: 25,      // Overlap spacing between cards in discard row
    OFFSET_X: 20,          // X offset from center of canvas
    OFFSET_Y: 20           // Y offset from center of canvas
};

/**
 * Get card point value for penalty/hand scoring at round end
 * 2-9: 5 points, 10/J/Q/K: 10 points, Ace: 25 points, Joker: 50 points
 */
export function getCardPointValue(card) {
    if (card.isJoker) return 50;
    if (['10', 'J', 'Q', 'K'].includes(card.rank)) return 10;
    if (card.rank === 'A') return 25;
    // All other cards (2-9) are worth 5 points
    return 5;
}

/**
 * Get card meld value for first meld scoring
 * 2-9: 5 points, 10/J/Q/K: 10 points
 * Ace as 1 (low): 5 points, Ace after King (high): 10 points
 * Three Aces (A-A-A): 25 points total
 * Joker: value of the card it replaces
 */
export function getMeldPointValue(card, isHighAce = false) {
    if (card.isJoker) return 0; // Joker value handled separately based on replaced card
    if (['10', 'J', 'Q', 'K'].includes(card.rank)) return 10;
    if (card.rank === 'A') return isHighAce ? 10 : 5;
    // All other cards (2-9) are worth 5 points
    return 5;
}
