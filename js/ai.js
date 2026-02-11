import { AI_DIFFICULTY } from './config.js';
import { GameRules } from './rules.js';

export class AIPlayer {
    constructor(difficulty = 'medium') {
        this.setDifficulty(difficulty);
        this.hand = [];
    }

    setDifficulty(difficulty) {
        this.difficulty = AI_DIFFICULTY[difficulty.toUpperCase()] || AI_DIFFICULTY.MEDIUM;
    }

    /**
     * Decides whether to draw from deck or discard pile
     */
    shouldDrawFromDiscard(discardCard) {
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
     * Decides whether to declare
     */
    shouldDeclare() {
        // Only attempt to declare if difficulty allows
        if (this.difficulty.strategyDepth < 2) {
            // Easy AI rarely declares
            if (Math.random() > 0.3) return false;
        }

        // Check if can legally declare
        if (!GameRules.canDeclare(this.hand)) {
            return false;
        }

        // Higher difficulty = more aggressive declaring
        const handStrength = this.evaluateHandStrength();
        const threshold = 100 - (this.difficulty.strategyDepth * 10);
        
        return handStrength >= threshold;
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
            const otherSuits = ['♠', '♥', '♦', '♣'].filter(s => s !== card.suit);
            otherSuits.forEach(suit => {
                needed.push({ suit, value: card.value, rank: card.rank });
            });
        }

        return needed;
    }

    /**
     * Main AI turn logic
     */
    async takeTurn(deck, discardPile, onUpdate) {
        // Simulate thinking time
        await this.wait(this.difficulty.thinkTime);

        let drewCard;
        const topDiscard = discardPile[discardPile.length - 1];

        // Decide draw source
        if (this.shouldDrawFromDiscard(topDiscard)) {
            drewCard = discardPile.pop();
            if (onUpdate) onUpdate('AI drew from discard pile');
        } else {
            drewCard = deck.draw();
            if (onUpdate) onUpdate('AI drew from deck');
        }

        this.hand.push(drewCard);

        // Wait a bit
        await this.wait(500);

        // Check if should declare
        if (this.shouldDeclare()) {
            if (onUpdate) onUpdate('AI is declaring!');
            return { action: 'declare', card: null };
        }

        // Choose card to discard
        const discardCard = this.chooseDiscard(drewCard);
        const index = this.hand.findIndex(c => c.id === discardCard.id);
        if (index !== -1) {
            this.hand.splice(index, 1);
        }

        if (onUpdate) onUpdate('AI discarded a card');

        return { action: 'discard', card: discardCard };
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

            const suitOrder = ['♠', '♥', '♦', '♣'];
            const suitComparison = suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
            
            if (suitComparison !== 0) {
                return suitComparison;
            }

            return a.value - b.value;
        });
    }
}
