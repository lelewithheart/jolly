import { CONFIG } from './config.js';

export class GameRules {
    /**
     * Validates if a group of cards forms a valid set
     * A set consists of 3-4 cards of the same rank
     */
    static isValidSet(cards, jollyCard = null) {
        if (cards.length < CONFIG.MIN_SET_SIZE || cards.length > 4) {
            return false;
        }

        const nonJokerCards = cards.filter(c => !c.isJoker);
        
        if (nonJokerCards.length === 0) {
            return false; // Can't have a set of only jokers
        }

        // All non-joker cards must have the same rank
        const rank = nonJokerCards[0].rank;
        const allSameRank = nonJokerCards.every(c => c.rank === rank);

        if (!allSameRank) {
            return false;
        }

        // Check that no two cards have the same suit
        const suits = nonJokerCards.map(c => c.suit);
        const uniqueSuits = new Set(suits);
        
        return suits.length === uniqueSuits.size;
    }

    /**
     * Validates if a group of cards forms a valid sequence
     * A sequence consists of 3+ consecutive cards of the same suit
     */
    static isValidSequence(cards, jollyCard = null) {
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

        // Sort non-joker cards by value
        const sortedCards = [...nonJokers].sort((a, b) => a.value - b.value);
        
        // Check if jokers can fill gaps
        let jokerCount = jokers.length;
        for (let i = 0; i < sortedCards.length - 1; i++) {
            const gap = sortedCards[i + 1].value - sortedCards[i].value - 1;
            
            if (gap > 0) {
                if (gap > jokerCount) {
                    return false; // Gap too large for available jokers
                }
                jokerCount -= gap;
            } else if (gap < 0) {
                return false; // Duplicate values
            }
        }

        return true;
    }

    /**
     * Checks if a sequence is pure (no jokers or wild cards)
     */
    static isPureSequence(cards) {
        if (cards.some(c => c.isJoker)) {
            return false;
        }
        return this.isValidSequence(cards);
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
        for (let size = 4; size >= CONFIG.MIN_SET_SIZE; size--) {
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
     * Validates if a hand can declare (win)
     */
    static canDeclare(cards) {
        const melds = this.findMelds(cards);
        
        // Count sequences and pure sequences
        const sequences = melds.filter(m => m.type === 'sequence');
        const pureSequences = sequences.filter(m => m.pure);

        // Need at least 2 sequences with at least 1 pure sequence
        if (sequences.length < CONFIG.MIN_SEQUENCES_REQUIRED || 
            pureSequences.length < CONFIG.MIN_PURE_SEQUENCES) {
            return false;
        }

        // Check if all or almost all cards are in melds
        const cardIds = new Set(cards.map(c => c.id));
        const meldCardIds = new Set();
        melds.forEach(m => m.cards.forEach(c => meldCardIds.add(c.id)));

        // Allow at most 1 unmatched card
        const unmatchedCount = cardIds.size - meldCardIds.size;
        return unmatchedCount <= 1;
    }

    /**
     * Calculates the penalty points for unmatched cards
     */
    static calculatePoints(cards) {
        const melds = this.findMelds(cards);
        const meldCardIds = new Set();
        melds.forEach(m => m.cards.forEach(c => meldCardIds.add(c.id)));

        const unmatchedCards = cards.filter(c => !meldCardIds.has(c.id));
        
        return unmatchedCards.reduce((sum, card) => {
            if (card.isJoker) return sum + 50;
            if (['J', 'Q', 'K'].includes(card.rank)) return sum + 10;
            if (card.rank === 'A') return sum + 10;
            return sum + parseInt(card.rank);
        }, 0);
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
                return nonJokers.reduce((highest, card) => {
                    const highestValue = ['J', 'Q', 'K'].includes(highest.rank) ? 10 : 
                                        highest.rank === 'A' ? 10 : parseInt(highest.rank);
                    const cardValue = ['J', 'Q', 'K'].includes(card.rank) ? 10 : 
                                     card.rank === 'A' ? 10 : parseInt(card.rank);
                    return cardValue > highestValue ? card : highest;
                });
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
