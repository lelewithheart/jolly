import { Deck, Hand, createDOMCard } from './card.js';
import { GameRules } from './rules.js';
import { AIPlayer } from './ai.js';
import { Renderer } from './renderer.js';
import { CONFIG, ANIMATION_DURATION, getCardPointValue } from './config.js';

export class Game {
    constructor() {
        this.deck = null;
        this.playerHand = new Hand();
        this.aiPlayer = new AIPlayer('medium');
        this.discardRow = [];           // Changed from discardPile to discardRow
        this.tableMelds = [];           // Melds laid out on the table
        this.currentTurn = 'player';
        this.round = 1;
        this.playerScore = 0;
        this.aiScore = 0;
        this.targetScore = CONFIG.WIN_THRESHOLD_LOW; // Default 500, can be 1000
        this.gameState = 'waiting'; // waiting, playing, playerTurn, aiTurn, gameOver
        this.selectedCard = null;
        this.selectedCards = [];        // For selecting multiple cards for melds
        this.hasDrawn = false;
        this.playerHasMelded = false;   // Track if player has laid out first meld
        this.aiHasMelded = false;       // Track if AI has laid out first meld
        this.isFirstTurn = true;        // Starting player draws on first turn
        
        this.renderer = null;
        this.initializeDOM();
        this.setupEventListeners();
    }

    initializeDOM() {
        // Get DOM elements
        this.canvas = document.getElementById('game-canvas');
        this.playerHandEl = document.getElementById('player-hand');
        this.gameStatusEl = document.getElementById('game-status');
        this.roundNumberEl = document.getElementById('round-number');
        this.playerScoreEl = document.getElementById('player-score');
        this.aiScoreEl = document.getElementById('ai-score');
        this.deckCountEl = document.getElementById('deck-count');
        this.discardCountEl = document.getElementById('discard-count');

        // Buttons
        this.drawDeckBtn = document.getElementById('draw-deck-btn');
        this.drawDiscardBtn = document.getElementById('draw-discard-btn');
        this.sortHandBtn = document.getElementById('sort-hand-btn');
        this.declareBtn = document.getElementById('declare-btn');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.aiDifficultySelect = document.getElementById('ai-difficulty');
        this.targetScoreSelect = document.getElementById('target-score');
        
        // Meld buttons (may not exist in HTML yet)
        this.meldBtn = document.getElementById('meld-btn');
        this.zudrehenBtn = document.getElementById('zudrehen-btn');

        // Modal
        this.modal = document.getElementById('modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalMessage = document.getElementById('modal-message');
        this.modalCloseBtn = document.getElementById('modal-close-btn');

        // Initialize renderer
        this.renderer = new Renderer(this.canvas);
        
        // Handle resize
        window.addEventListener('resize', () => {
            this.renderer.resize();
            this.render();
        });
    }

    setupEventListeners() {
        // Game controls
        this.drawDeckBtn.addEventListener('click', () => this.drawFromDeck());
        this.drawDiscardBtn.addEventListener('click', () => this.drawFromDiscardRow());
        this.sortHandBtn.addEventListener('click', () => this.sortHand());
        if (this.declareBtn) {
            this.declareBtn.addEventListener('click', () => this.zudrehen());
        }
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.modalCloseBtn.addEventListener('click', () => this.hideModal());

        // AI difficulty change
        this.aiDifficultySelect.addEventListener('change', (e) => {
            this.aiPlayer.setDifficulty(e.target.value);
            this.updateStatus(`AI difficulty set to ${e.target.value}`);
        });

        // Target score change
        if (this.targetScoreSelect) {
            this.targetScoreSelect.addEventListener('change', (e) => {
                this.targetScore = parseInt(e.target.value);
                this.updateStatus(`Target score set to ${this.targetScore}`);
            });
        }

        // Meld button
        if (this.meldBtn) {
            this.meldBtn.addEventListener('click', () => this.layMeld());
        }

        // Zudrehen button
        if (this.zudrehenBtn) {
            this.zudrehenBtn.addEventListener('click', () => this.zudrehen());
        }

        // Drag and drop for cards
        this.playerHandEl.addEventListener('dragstart', (e) => this.handleDragStart(e));
        this.playerHandEl.addEventListener('dragend', (e) => this.handleDragEnd(e));
        this.playerHandEl.addEventListener('click', (e) => this.handleCardClick(e));
    }

    startNewGame() {
        this.round = 1;
        this.playerScore = 0;
        this.aiScore = 0;
        
        // Get target score from select if available
        if (this.targetScoreSelect) {
            this.targetScore = parseInt(this.targetScoreSelect.value);
        }
        
        this.updateScores();
        this.startNewRound();
    }

    startNewRound() {
        // Initialize deck
        this.deck = new Deck();
        
        // Clear hands and table
        this.playerHand.clear();
        this.aiPlayer.hand = [];
        this.discardRow = [];
        this.tableMelds = [];
        
        // Reset meld status for new round
        this.playerHasMelded = false;
        this.aiHasMelded = false;
        this.isFirstTurn = true;
        
        // Deal cards: starting player gets 13, others get 12
        // Player starts, so player gets 13 cards, AI gets 12
        for (let i = 0; i < CONFIG.STARTING_HAND_SIZE; i++) {
            this.playerHand.addCard(this.deck.draw());
        }
        for (let i = 0; i < CONFIG.OTHER_HAND_SIZE; i++) {
            this.aiPlayer.hand.push(this.deck.draw());
        }

        // Reset state - starting player must draw on first turn
        this.currentTurn = 'player';
        this.hasDrawn = false;
        this.selectedCard = null;
        this.selectedCards = [];
        this.gameState = 'playerTurn';

        // Update UI
        this.renderPlayerHand();
        this.updateCounts();
        this.updateButtons();
        this.updateStatus('Your turn! Draw a card to begin.');
        this.roundNumberEl.textContent = this.round;
        this.render();
    }

    drawFromDeck() {
        if (this.gameState !== 'playerTurn' || this.hasDrawn) {
            return;
        }

        if (this.deck.isEmpty()) {
            // Reshuffle discard row except top card
            if (this.discardRow.length > 1) {
                const topCard = this.discardRow.pop();
                const cardsToReshuffle = [];
                while (this.discardRow.length > 0) {
                    cardsToReshuffle.push(this.discardRow.pop());
                }
                this.deck.addCards(cardsToReshuffle);
                this.deck.shuffle();
                this.discardRow.push(topCard);
            } else {
                this.updateStatus('No cards left to draw!');
                return;
            }
        }

        const card = this.deck.draw();
        this.playerHand.addCard(card);
        this.hasDrawn = true;
        this.isFirstTurn = false;

        this.renderPlayerHand();
        this.updateCounts();
        this.updateButtons();
        this.updateStatus('You drew a card. Lay melds or select a card to discard.');
        this.render();
    }

    drawFromDiscardRow() {
        if (this.gameState !== 'playerTurn' || this.hasDrawn) {
            return;
        }

        if (this.discardRow.length === 0) {
            this.updateStatus('Discard row is empty!');
            return;
        }

        // Can only draw from discard row after having melded once
        if (!this.playerHasMelded) {
            this.updateStatus('You must lay out your first meld before drawing from the discard row!');
            return;
        }

        // For now, take only the top card. 
        // Full implementation would allow taking multiple cards down to a usable one
        const card = this.discardRow.pop();
        this.playerHand.addCard(card);
        this.hasDrawn = true;
        this.isFirstTurn = false;

        this.renderPlayerHand();
        this.updateCounts();
        this.updateButtons();
        this.updateStatus('You drew from discard row. Lay melds or select a card to discard.');
        this.render();
    }

    handleCardClick(e) {
        const cardEl = e.target.closest('.card');
        if (!cardEl) return;

        const cardId = cardEl.dataset.cardId;
        const card = this.playerHand.cards.find(c => c.id === cardId);

        if (!card) return;

        // If haven't drawn, just select/deselect for potential meld
        if (!this.hasDrawn) {
            this.toggleCardSelection(cardEl, card);
            return;
        }

        // If has drawn, clicking a card discards it (ends turn)
        this.discardCard(card);
    }

    toggleCardSelection(cardEl, card) {
        if (cardEl.classList.contains('selected')) {
            cardEl.classList.remove('selected');
            this.selectedCards = this.selectedCards.filter(c => c.id !== card.id);
        } else {
            cardEl.classList.add('selected');
            this.selectedCards.push(card);
        }
        this.updateButtons();
    }

    /**
     * Lay down selected cards as a meld
     */
    layMeld() {
        if (this.selectedCards.length < CONFIG.MIN_SET_SIZE) {
            this.updateStatus('Select at least 3 cards to form a meld!');
            return;
        }

        // Check if it's a valid meld
        const isSet = GameRules.isValidSet(this.selectedCards);
        const isSequence = GameRules.isValidSequence(this.selectedCards);

        if (!isSet && !isSequence) {
            this.updateStatus('Invalid meld! Must be a valid set or sequence.');
            return;
        }

        const meldType = isSequence ? 'sequence' : 'set';
        const newMeld = { type: meldType, cards: [...this.selectedCards] };

        // If this is first meld, check point requirement
        if (!this.playerHasMelded) {
            const meldPoints = GameRules.calculateMeldPoints(newMeld);
            if (meldPoints < CONFIG.FIRST_MELD_MIN_POINTS) {
                this.updateStatus(`Need at least ${CONFIG.FIRST_MELD_MIN_POINTS} points for first meld! This meld is worth ${meldPoints} points.`);
                return;
            }
        }

        // Remove cards from hand and add meld to table
        for (const card of this.selectedCards) {
            this.playerHand.removeCard(card);
        }
        
        newMeld.owner = 'player';
        this.tableMelds.push(newMeld);
        this.playerHasMelded = true;
        this.selectedCards = [];

        this.renderPlayerHand();
        this.updateButtons();
        this.updateStatus(`Meld laid down! ${meldType === 'sequence' ? 'Sequence' : 'Set'} of ${newMeld.cards.length} cards.`);
        this.render();
    }

    /**
     * Extend an existing meld on the table with a card from hand
     */
    extendMeld(meldIndex, card) {
        if (meldIndex < 0 || meldIndex >= this.tableMelds.length) {
            return false;
        }

        const meld = this.tableMelds[meldIndex];
        
        if (!GameRules.canExtendMeld(meld, card)) {
            return false;
        }

        this.playerHand.removeCard(card);
        meld.cards.push(card);
        
        this.renderPlayerHand();
        this.render();
        return true;
    }

    discardCard(card) {
        if (!this.hasDrawn) {
            this.updateStatus('Draw a card first!');
            return;
        }

        this.playerHand.removeCard(card);
        this.discardRow.push(card);
        this.hasDrawn = false;
        this.selectedCard = null;
        this.selectedCards = [];

        this.renderPlayerHand();
        this.updateCounts();
        this.updateButtons();
        this.render();

        // Switch to AI turn
        this.currentTurn = 'ai';
        this.gameState = 'aiTurn';
        this.updateStatus("AI's turn...");
        
        setTimeout(() => this.aiTurn(), ANIMATION_DURATION.AI_THINKING);
    }

    /**
     * End the round by "zudrehen" (turning down)
     * Player must have exactly one card that cannot be used anywhere
     */
    zudrehen() {
        if (!this.hasDrawn) {
            this.updateStatus('Draw a card first!');
            return;
        }

        if (this.playerHand.count !== 1) {
            this.updateStatus('You must have exactly one card left to end the round!');
            return;
        }

        const lastCard = this.playerHand.cards[0];
        
        // Check if the card can be used anywhere
        for (const meld of this.tableMelds) {
            if (GameRules.canExtendMeld(meld, lastCard)) {
                this.updateStatus('Your last card can still be used to extend a meld!');
                return;
            }
        }

        // Cannot zudrehen with a joker (jokers are always usable)
        if (lastCard.isJoker) {
            this.updateStatus('Cannot end with a Joker - Jokers can always be used!');
            return;
        }

        // Successful zudrehen
        this.handleZudrehen('player');
    }

    handleZudrehen(winner) {
        const zudrehenBonus = CONFIG.ZUDREHEN_BONUS;
        
        // Calculate opponent hand points
        let opponentPoints = 0;
        if (winner === 'player') {
            opponentPoints = GameRules.calculateHandPoints(this.aiPlayer.hand);
            this.playerScore += opponentPoints + zudrehenBonus;
            
            this.showModal(
                '🎉 Round Won!',
                `You ended the round!\n\nBonus: +${zudrehenBonus} points\nAI's remaining cards: +${opponentPoints} points\nTotal gained: +${opponentPoints + zudrehenBonus} points\n\nYour Score: ${this.playerScore}\nAI Score: ${this.aiScore}`
            );
        } else {
            opponentPoints = GameRules.calculateHandPoints(this.playerHand.cards);
            this.aiScore += opponentPoints + zudrehenBonus;
            
            this.showModal(
                '😔 AI Won Round!',
                `AI ended the round!\n\nAI Bonus: +${zudrehenBonus} points\nYour remaining cards: +${opponentPoints} points\nAI gained: +${opponentPoints + zudrehenBonus} points\n\nYour Score: ${this.playerScore}\nAI Score: ${this.aiScore}`
            );
        }

        this.updateScores();
        this.checkGameOver();
    }

    async aiTurn() {
        this.updateStatus("AI is thinking...");
        
        const result = await this.aiPlayer.takeTurn(
            this.deck,
            this.discardRow,
            this.tableMelds,
            this.aiHasMelded,
            (message) => this.updateStatus(message)
        );

        if (result.meldsLaid && result.meldsLaid.length > 0) {
            for (const meld of result.meldsLaid) {
                meld.owner = 'ai';
                this.tableMelds.push(meld);
            }
            this.aiHasMelded = true;
        }

        if (result.action === 'zudrehen') {
            this.handleZudrehen('ai');
            return;
        }

        if (result.card) {
            this.discardRow.push(result.card);
        }

        this.updateCounts();
        this.render();

        // Switch back to player
        this.currentTurn = 'player';
        this.gameState = 'playerTurn';
        this.updateStatus('Your turn! Draw a card.');
        this.updateButtons();
    }

    sortHand() {
        this.playerHand.sort();
        this.renderPlayerHand();
        this.updateStatus('Hand sorted!');
    }

    checkGameOver() {
        if (this.playerScore >= this.targetScore || this.aiScore >= this.targetScore) {
            const winner = this.playerScore >= this.targetScore ? 'You' : 'AI';
            this.gameState = 'gameOver';
            
            setTimeout(() => {
                this.showModal(
                    'Game Over',
                    `${winner} won the game!\n\nFinal Scores:\nYour Score: ${this.playerScore}\nAI Score: ${this.aiScore}\n\nClick OK to start a new game.`
                );
            }, 2000);
        } else {
            setTimeout(() => {
                this.round++;
                this.startNewRound();
            }, 3000);
        }
    }

    renderPlayerHand() {
        this.playerHandEl.innerHTML = '';
        
        this.playerHand.cards.forEach((card, index) => {
            const cardEl = createDOMCard(card, index);
            
            // Check if card is in selected cards
            if (this.selectedCards.some(c => c.id === card.id)) {
                cardEl.classList.add('selected');
            }
            
            this.playerHandEl.appendChild(cardEl);
        });
    }

    updateCounts() {
        this.deckCountEl.textContent = this.deck ? this.deck.count : 0;
        this.discardCountEl.textContent = this.discardRow.length;
    }

    updateScores() {
        this.playerScoreEl.textContent = this.playerScore;
        this.aiScoreEl.textContent = this.aiScore;
    }

    updateButtons() {
        const isPlayerTurn = this.gameState === 'playerTurn';
        
        this.drawDeckBtn.disabled = !isPlayerTurn || this.hasDrawn;
        this.drawDiscardBtn.disabled = !isPlayerTurn || this.hasDrawn || this.discardRow.length === 0 || !this.playerHasMelded;
        
        // Declare button now serves as zudrehen
        if (this.declareBtn) {
            this.declareBtn.disabled = !isPlayerTurn || !this.hasDrawn || this.playerHand.count !== 1;
            this.declareBtn.textContent = 'End Round';
        }
        
        // Meld button
        if (this.meldBtn) {
            this.meldBtn.disabled = !isPlayerTurn || this.selectedCards.length < CONFIG.MIN_SET_SIZE;
        }
    }

    updateStatus(message) {
        this.gameStatusEl.textContent = message;
    }

    showModal(title, message) {
        this.modalTitle.textContent = title;
        this.modalMessage.textContent = message;
        this.modal.classList.remove('hidden');
    }

    hideModal() {
        this.modal.classList.add('hidden');
        
        if (this.gameState === 'gameOver') {
            this.startNewGame();
        }
    }

    render() {
        if (!this.deck) return; // Don't render if game hasn't started
        
        const gameState = {
            aiHand: this.aiPlayer.hand,
            deckCount: this.deck.count,
            discardRow: this.discardRow,
            tableMelds: this.tableMelds,
            currentTurn: this.currentTurn,
            playerHasMelded: this.playerHasMelded,
            aiHasMelded: this.aiHasMelded
        };

        this.renderer.drawGameBoard(gameState);
    }

    handleDragStart(e) {
        if (!e.target.classList.contains('card')) return;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.innerHTML);
    }

    handleDragEnd(e) {
        if (!e.target.classList.contains('card')) return;
        e.target.classList.remove('dragging');
    }
}
