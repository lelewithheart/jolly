import { AI_DIFFICULTY, SUITS, SUIT_ORDER, CONFIG } from './config.js';
import { GameRules } from './rules.js';

export class AIPlayer {
    constructor(difficulty = 'medium') {
        this.setDifficulty(difficulty);
        this.hand = [];
        this.hasMelded = false;
    }

    setDifficulty(difficulty) {
        this.difficulty = AI_DIFFICULTY[difficulty.toUpperCase()] || AI_DIFFICULTY.MEDIUM;
    }

    /**
     * Decides whether to draw from deck or discard row
     */
    shouldDrawFromDiscardRow(discardCard, hasMelded) {
        // Cannot draw from discard row until first meld is laid
        if (!hasMelded) return false;
        if (!discardCard) return false;

        // Add randomness based on difficulty
        if (Math.random() > (1 - this.difficulty.errorRate)) {
            return Math.random() > 0.5;
        }

        // Check if discard card helps form melds
        const testHand = [...this.hand, discardCard];
        const currentMelds = GameRules.findMelds(this.hand);
        const newMelds = GameRules.findMelds(testHand);

        // Draw from discard if it improves melds
        return newMelds.length > currentMelds.length;
    }

    /**
     * Decides which card to discard
     */
    chooseDiscard(drewCard) {
        // Add the drawn card to hand temporarily
        const tempHand = [...this.hand, drewCard];

        // Introduce errors based on difficulty
        if (Math.random() < this.difficulty.errorRate) {
            // Make a random/poor choice
            const randomIndex = Math.floor(Math.random() * tempHand.length);
            return tempHand[randomIndex];
        }

        // Use strategic discard
        return GameRules.suggestDiscard(tempHand);
    }

    /**
     * Evaluates hand strength (0-100)
     */
    evaluateHandStrength() {
        const melds = GameRules.findMelds(this.hand);
        const meldCardCount = melds.reduce((sum, meld) => sum + meld.cards.length, 0);
        const strength = (meldCardCount / this.hand.length) * 100;
        return Math.min(100, strength);
    }

    /**
     * Tries to find melds that can be laid down
     */
    findMeldsToLay(hasMelded) {
        const melds = GameRules.findMelds(this.hand);
        
        if (melds.length === 0) return [];
        
        // If hasn't melded yet, need to meet 30 point requirement
        if (!hasMelded) {
            // Try to find combination of melds that meet the requirement
            for (let i = 1; i <= melds.length; i++) {
                const combinations = this.getMeldCombinations(melds, i);
                for (const combo of combinations) {
                    const totalPoints = combo.reduce((sum, m) => sum + GameRules.calculateMeldPoints(m), 0);
                    if (totalPoints >= CONFIG.FIRST_MELD_MIN_POINTS) {
                        return combo;
                    }
                }
            }
            return []; // Can't meet requirement
        }
        
        // If already melded, can lay any valid meld
        return melds;
    }

    /**
     * Helper: Get combinations of melds
     */
    getMeldCombinations(melds, size) {
        if (size === 1) return melds.map(m => [m]);
        if (size > melds.length) return [];
        
        const combinations = [];
        for (let i = 0; i <= melds.length - size; i++) {
            const head = melds[i];
            const tailCombinations = this.getMeldCombinations(melds.slice(i + 1), size - 1);
            for (const tail of tailCombinations) {
                combinations.push([head, ...tail]);
            }
        }
        return combinations;
    }

    /**
     * Checks if AI can end the round (zudrehen)
     */
    canZudrehen(tableMelds) {
        if (this.hand.length !== 1) return false;
        
        const lastCard = this.hand[0];
        
        // Jokers are always usable
        if (lastCard.isJoker) return false;
        
        // Check if card can extend any meld
        for (const meld of tableMelds) {
            if (GameRules.canExtendMeld(meld, lastCard)) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Analyzes which cards are needed
     */
    getNeededCards() {
        const needed = [];
        const handCopy = [...this.hand];

        // Look for near-sequences
        for (const card of handCopy) {
            if (card.isJoker) continue;

            // Cards that could extend sequences
            const lowerValue = card.value - 1;
            const upperValue = card.value + 1;

            if (lowerValue >= 1) {
                needed.push({ suit: card.suit, value: lowerValue });
            }
            if (upperValue <= 13) {
                needed.push({ suit: card.suit, value: upperValue });
            }

            // Cards that could form sets
            const otherSuits = Object.values(SUITS).filter(s => s !== card.suit);
            otherSuits.forEach(suit => {
                needed.push({ suit, value: card.value, rank: card.rank });
            });
        }

        return needed;
    }

    /**
     * Main AI turn logic
     */
    async takeTurn(deck, discardRow, tableMelds, hasMelded, onUpdate) {
        // Simulate thinking time
        await this.wait(this.difficulty.thinkTime);

        let drewCard;
        const topDiscard = discardRow[discardRow.length - 1];

        // Decide draw source
        if (this.shouldDrawFromDiscardRow(topDiscard, hasMelded)) {
            drewCard = discardRow.pop();
            if (onUpdate) onUpdate('AI drew from discard row');
        } else {
            drewCard = deck.draw();
            if (onUpdate) onUpdate('AI drew from deck');
        }

        this.hand.push(drewCard);

        // Wait a bit
        await this.wait(500);

        // Try to lay melds
        const meldsToLay = this.findMeldsToLay(hasMelded);
        const laidMelds = [];
        
        if (meldsToLay.length > 0 && (hasMelded || this.difficulty.strategyDepth >= 2)) {
            for (const meld of meldsToLay) {
                // Remove cards from hand
                for (const card of meld.cards) {
                    const index = this.hand.findIndex(c => c.id === card.id);
                    if (index !== -1) {
                        this.hand.splice(index, 1);
                    }
                }
                laidMelds.push(meld);
            }
            
            if (laidMelds.length > 0) {
                this.hasMelded = true;
                if (onUpdate) onUpdate(`AI laid ${laidMelds.length} meld(s)`);
            }
        }

        await this.wait(300);

        // Check if can zudrehen
        const allTableMelds = [...tableMelds, ...laidMelds];
        if (this.canZudrehen(allTableMelds)) {
            if (this.difficulty.strategyDepth >= 2) {
                if (onUpdate) onUpdate('AI is ending the round!');
                return { action: 'zudrehen', card: null, meldsLaid: laidMelds };
            }
        }

        // Choose card to discard
        const discardCard = this.chooseDiscard(drewCard);
        const index = this.hand.findIndex(c => c.id === discardCard.id);
        if (index !== -1) {
            this.hand.splice(index, 1);
        }

        if (onUpdate) onUpdate('AI discarded a card');

        return { action: 'discard', card: discardCard, meldsLaid: laidMelds };
    }

    /**
     * Helper: Wait/delay
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Sorts the AI's hand
     */
    sortHand() {
        this.hand.sort((a, b) => {
            if (a.isJoker && !b.isJoker) return 1;
            if (!a.isJoker && b.isJoker) return -1;
            if (a.isJoker && b.isJoker) return 0;

            const suitComparison = SUIT_ORDER.indexOf(a.suit) - SUIT_ORDER.indexOf(b.suit);
            
            if (suitComparison !== 0) {
                return suitComparison;
            }

            return a.value - b.value;
        });
    }
}
