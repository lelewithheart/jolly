import { CONFIG, getCardPointValue, getMeldPointValue } from './config.js';

export class GameRules {
    /**
     * Validates if a group of cards forms a valid set
     * A set consists of 3+ cards of the same rank (suits don't matter in Jolly)
     * Jokers can substitute any card
     */
    static isValidSet(cards) {
        if (cards.length < CONFIG.MIN_SET_SIZE) {
            return false;
        }

        const nonJokerCards = cards.filter(c => !c.isJoker);
        
        if (nonJokerCards.length === 0) {
            return false; // Can't have a set of only jokers
        }

        // All non-joker cards must have the same rank
        const rank = nonJokerCards[0].rank;
        const allSameRank = nonJokerCards.every(c => c.rank === rank);

        return allSameRank;
    }

    /**
     * Validates if a group of cards forms a valid sequence
     * A sequence consists of 3+ consecutive cards of the same suit
     * Ace can be low (A-2-3) or high (Q-K-A)
     * Jokers can substitute any card
     */
    static isValidSequence(cards) {
        if (cards.length < CONFIG.MIN_SEQUENCE_SIZE) {
            return false;
        }

        // Separate jokers and regular cards
        const jokers = cards.filter(c => c.isJoker);
        const nonJokers = cards.filter(c => !c.isJoker);

        if (nonJokers.length === 0) {
            return false; // Can't have a sequence of only jokers
        }

        // All non-joker cards must be of the same suit
        const suit = nonJokers[0].suit;
        if (!nonJokers.every(c => c.suit === suit)) {
            return false;
        }

        // Try sequence with Ace as low (1)
        if (this.isValidSequenceWithAceValue(nonJokers, jokers.length, 1)) {
            return true;
        }

        // Try sequence with Ace as high (14)
        if (this.isValidSequenceWithAceValue(nonJokers, jokers.length, 14)) {
            return true;
        }

        return false;
    }

    /**
     * Helper: Check if sequence is valid with a specific Ace value
     * @param {Array} nonJokers - Array of non-joker cards in the sequence
     * @param {number} jokerCount - Number of jokers available to fill gaps
     * @param {number} aceValue - Value to use for Aces (1 for low, 14 for high)
     * @returns {boolean} - True if the sequence is valid with this Ace value
     */
    static isValidSequenceWithAceValue(nonJokers, jokerCount, aceValue) {
        // Map cards to their values (treating Ace as specified)
        const values = nonJokers.map(c => {
            if (c.rank === 'A') return aceValue;
            return c.value;
        });

        // Sort values
        const sortedValues = [...values].sort((a, b) => a - b);

        // Check for duplicates
        for (let i = 0; i < sortedValues.length - 1; i++) {
            if (sortedValues[i] === sortedValues[i + 1]) {
                return false;
            }
        }

        // Check if jokers can fill gaps
        let jokersNeeded = 0;
        for (let i = 0; i < sortedValues.length - 1; i++) {
            const gap = sortedValues[i + 1] - sortedValues[i] - 1;
            if (gap > 0) {
                jokersNeeded += gap;
            }
        }

        return jokersNeeded <= jokerCount;
    }

    /**
     * Checks if a sequence uses Ace as high (after King)
     */
    static isHighAceSequence(cards) {
        const nonJokers = cards.filter(c => !c.isJoker);
        const hasAce = nonJokers.some(c => c.rank === 'A');
        const hasKing = nonJokers.some(c => c.rank === 'K');
        const hasTwo = nonJokers.some(c => c.rank === '2');
        
        // If has Ace and King but no 2, it's likely a high ace sequence
        return hasAce && hasKing && !hasTwo;
    }

    /**
     * Checks if a sequence is pure (no jokers)
     */
    static isPureSequence(cards) {
        if (cards.some(c => c.isJoker)) {
            return false;
        }
        return this.isValidSequence(cards);
    }

    /**
     * Calculates the meld value for first meld requirement (min 30 points)
     */
    static calculateMeldPoints(meld) {
        let points = 0;
        const isHighAce = meld.type === 'sequence' && this.isHighAceSequence(meld.cards);
        
        // Check for three Aces set (special case: exactly 3 Aces = 25 points)
        const nonJokers = meld.cards.filter(c => !c.isJoker);
        const isThreeAcesSet = meld.type === 'set' && 
            nonJokers.every(c => c.rank === 'A') && 
            nonJokers.length === CONFIG.MIN_SET_SIZE;
        if (isThreeAcesSet) {
            return CONFIG.THREE_ACES_POINTS;
        }
        
        for (const card of meld.cards) {
            if (card.isJoker) {
                // Joker takes value of the card it replaces (estimate based on meld)
                points += this.estimateJokerValue(meld);
            } else {
                points += getMeldPointValue(card, isHighAce);
            }
        }
        
        return points;
    }

    /**
     * Estimates the value of a joker in a meld (average of other cards)
     */
    static estimateJokerValue(meld) {
        const nonJokers = meld.cards.filter(c => !c.isJoker);
        if (nonJokers.length === 0) return 5;
        
        const isHighAce = meld.type === 'sequence' && this.isHighAceSequence(meld.cards);
        const total = nonJokers.reduce((sum, c) => sum + getMeldPointValue(c, isHighAce), 0);
        return Math.round(total / nonJokers.length);
    }

    /**
     * Calculates total points for a group of melds (for first meld requirement)
     */
    static calculateTotalMeldPoints(melds) {
        return melds.reduce((sum, meld) => sum + this.calculateMeldPoints(meld), 0);
    }

    /**
     * Checks if melds meet the first meld requirement (min 30 points)
     */
    static meetsFirstMeldRequirement(melds) {
        return this.calculateTotalMeldPoints(melds) >= CONFIG.FIRST_MELD_MIN_POINTS;
    }

    /**
     * Analyzes a hand and finds all valid melds (sets and sequences)
     */
    static findMelds(cards) {
        const melds = [];
        const used = new Set();

        // Try to find sequences first (they're generally more valuable)
        for (let size = cards.length; size >= CONFIG.MIN_SEQUENCE_SIZE; size--) {
            const combinations = this.getCombinations(cards, size);
            for (const combo of combinations) {
                if (this.isValidSequence(combo) && !this.hasOverlap(combo, used)) {
                    melds.push({ type: 'sequence', cards: combo, pure: this.isPureSequence(combo) });
                    combo.forEach(c => used.add(c.id));
                }
            }
        }

        // Then find sets
        for (let size = cards.length; size >= CONFIG.MIN_SET_SIZE; size--) {
            const combinations = this.getCombinations(cards, size);
            for (const combo of combinations) {
                if (this.isValidSet(combo) && !this.hasOverlap(combo, used)) {
                    melds.push({ type: 'set', cards: combo });
                    combo.forEach(c => used.add(c.id));
                }
            }
        }

        return melds;
    }

    /**
     * Checks if a card can be added to an existing meld
     */
    static canExtendMeld(meld, card) {
        const extendedCards = [...meld.cards, card];
        if (meld.type === 'set') {
            return this.isValidSet(extendedCards);
        } else {
            return this.isValidSequence(extendedCards);
        }
    }

    /**
     * Checks if player can end the round (zudrehen)
     * Player must have exactly one card left that cannot be used anywhere
     */
    static canZudrehen(playerHand, tableMelds) {
        if (playerHand.length !== 1) {
            return false;
        }
        
        const lastCard = playerHand[0];
        
        // Check if the card can extend any meld on the table
        for (const meld of tableMelds) {
            if (this.canExtendMeld(meld, lastCard)) {
                return false; // Card is usable
            }
        }
        
        // Check if card is a joker (jokers are always usable to replace in melds)
        // For zudrehen, we check if the card truly cannot be used
        if (lastCard.isJoker) {
            // Joker can always replace a card in a meld, so it's usable
            return false;
        }
        
        return true;
    }

    /**
     * Calculates the penalty points for remaining cards in hand at round end
     */
    static calculateHandPoints(cards) {
        return cards.reduce((sum, card) => sum + getCardPointValue(card), 0);
    }

    /**
     * Legacy: Calculates the penalty points for unmatched cards
     */
    static calculatePoints(cards) {
        const melds = this.findMelds(cards);
        const meldCardIds = new Set();
        melds.forEach(m => m.cards.forEach(c => meldCardIds.add(c.id)));

        const unmatchedCards = cards.filter(c => !meldCardIds.has(c.id));
        
        return unmatchedCards.reduce((sum, card) => sum + getCardPointValue(card), 0);
    }

    /**
     * Helper: Generate all combinations of a given size
     */
    static getCombinations(arr, size) {
        if (size === 1) return arr.map(item => [item]);
        if (size > arr.length) return [];

        const combinations = [];
        for (let i = 0; i <= arr.length - size; i++) {
            const head = arr[i];
            const tailCombinations = this.getCombinations(arr.slice(i + 1), size - 1);
            for (const tail of tailCombinations) {
                combinations.push([head, ...tail]);
            }
        }
        return combinations;
    }

    /**
     * Helper: Check if cards overlap with used set
     */
    static hasOverlap(cards, usedSet) {
        return cards.some(c => usedSet.has(c.id));
    }

    /**
     * Suggests best card to discard
     */
    static suggestDiscard(cards) {
        const melds = this.findMelds(cards);
        const meldCardIds = new Set();
        melds.forEach(m => m.cards.forEach(c => meldCardIds.add(c.id)));

        // Find unmatched cards
        const unmatchedCards = cards.filter(c => !meldCardIds.has(c.id));
        
        if (unmatchedCards.length > 0) {
            // Discard highest value unmatched card (but not jokers if possible)
            const nonJokers = unmatchedCards.filter(c => !c.isJoker);
            if (nonJokers.length > 0) {
                return nonJokers.reduce((highest, card) => 
                    getCardPointValue(card) > getCardPointValue(highest) ? card : highest
                );
            }
            return unmatchedCards[0];
        }

        // If all cards are in melds, discard from smallest meld
        const smallestMeld = melds.reduce((smallest, meld) => 
            meld.cards.length < smallest.cards.length ? meld : smallest
        );
        
        return smallestMeld.cards[0];
    }
}
