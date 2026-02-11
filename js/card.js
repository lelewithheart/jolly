import { SUITS, RANKS, COLORS, CONFIG } from './config.js';

export class Card {
    constructor(suit, rank, isJoker = false) {
        this.suit = suit;
        this.rank = rank;
        this.isJoker = isJoker;
        this.id = isJoker ? `JOKER-${Math.random()}` : `${suit}-${rank}`;
    }

    get color() {
        return this.isJoker ? 'joker' : COLORS[this.suit];
    }

    get value() {
        if (this.isJoker) return 0;
        if (this.rank === 'A') return 1;
        if (this.rank === 'J') return 11;
        if (this.rank === 'Q') return 12;
        if (this.rank === 'K') return 13;
        return parseInt(this.rank);
    }

    get displayRank() {
        return this.isJoker ? 'JOKER' : this.rank;
    }

    get displaySuit() {
        return this.isJoker ? '🃏' : this.suit;
    }

    equals(other) {
        return this.id === other.id;
    }

    toString() {
        return this.isJoker ? 'JOKER' : `${this.rank}${this.suit}`;
    }
}

export class Deck {
    constructor() {
        this.cards = [];
        this.initialize();
    }

    initialize() {
        this.cards = [];
        
        // Add regular cards
        for (const suit of Object.values(SUITS)) {
            for (const rank of RANKS) {
                this.cards.push(new Card(suit, rank));
            }
        }

        // Add jokers
        for (let i = 0; i < CONFIG.JOKER_COUNT; i++) {
            this.cards.push(new Card(null, null, true));
        }

        this.shuffle();
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw() {
        return this.cards.pop();
    }

    get count() {
        return this.cards.length;
    }

    isEmpty() {
        return this.cards.length === 0;
    }
}

export class Hand {
    constructor() {
        this.cards = [];
    }

    addCard(card) {
        this.cards.push(card);
    }

    removeCard(card) {
        const index = this.cards.findIndex(c => c.equals(card));
        if (index !== -1) {
            return this.cards.splice(index, 1)[0];
        }
        return null;
    }

    sort() {
        this.cards.sort((a, b) => {
            // Jokers at the end
            if (a.isJoker && !b.isJoker) return 1;
            if (!a.isJoker && b.isJoker) return -1;
            if (a.isJoker && b.isJoker) return 0;

            // Sort by suit first
            const suitOrder = [SUITS.SPADES, SUITS.HEARTS, SUITS.DIAMONDS, SUITS.CLUBS];
            const suitComparison = suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
            
            if (suitComparison !== 0) {
                return suitComparison;
            }

            // Then by value
            return a.value - b.value;
        });
    }

    get count() {
        return this.cards.length;
    }

    hasCard(card) {
        return this.cards.some(c => c.equals(card));
    }

    clear() {
        this.cards = [];
    }
}

export function createDOMCard(card, index = 0) {
    const cardEl = document.createElement('div');
    cardEl.className = `card ${card.color}`;
    cardEl.dataset.cardId = card.id;
    cardEl.draggable = true;
    
    if (card.isJoker) {
        cardEl.classList.add('joker');
        cardEl.innerHTML = `
            <div class="card-rank">JOKER</div>
            <div class="card-center">🃏</div>
        `;
    } else {
        cardEl.innerHTML = `
            <div class="card-rank">${card.rank}</div>
            <div class="card-center">${card.suit}</div>
            <div class="card-suit">${card.suit}</div>
        `;
    }

    // Add deal animation
    cardEl.style.animationDelay = `${index * 50}ms`;
    cardEl.classList.add('card-dealing');
    
    setTimeout(() => {
        cardEl.classList.remove('card-dealing');
    }, 500 + (index * 50));

    return cardEl;
}
