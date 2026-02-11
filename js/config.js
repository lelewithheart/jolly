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
    HAND_SIZE: 13,
    MIN_SEQUENCES_REQUIRED: 2,
    MIN_PURE_SEQUENCES: 1,
    MIN_SET_SIZE: 3,
    MIN_SEQUENCE_SIZE: 3,
    JOKER_COUNT: 2,
    POINTS_PER_UNMATCHED_CARD: 10,
    WIN_THRESHOLD: 500
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

export function getCardPointValue(card) {
    if (card.isJoker) return 50;
    if (['J', 'Q', 'K'].includes(card.rank)) return 10;
    if (card.rank === 'A') return 10;
    return parseInt(card.rank);
}
