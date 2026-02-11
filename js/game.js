import { Deck, Hand, createDOMCard } from './card.js';
import { GameRules } from './rules.js';
import { AIPlayer } from './ai.js';
import { Renderer } from './renderer.js';
import { CONFIG } from './config.js';

export class Game {
    constructor() {
        this.deck = null;
        this.playerHand = new Hand();
        this.aiPlayer = new AIPlayer('medium');
        this.discardPile = [];
        this.currentTurn = 'player';
        this.round = 1;
        this.playerScore = 0;
        this.aiScore = 0;
        this.gameState = 'waiting'; // waiting, playing, playerTurn, aiTurn, gameOver
        this.selectedCard = null;
        this.hasDrawn = false;
        
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
        this.drawDiscardBtn.addEventListener('click', () => this.drawFromDiscard());
        this.sortHandBtn.addEventListener('click', () => this.sortHand());
        this.declareBtn.addEventListener('click', () => this.declare());
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.modalCloseBtn.addEventListener('click', () => this.hideModal());

        // AI difficulty change
        this.aiDifficultySelect.addEventListener('change', (e) => {
            this.aiPlayer.setDifficulty(e.target.value);
            this.updateStatus(`AI difficulty set to ${e.target.value}`);
        });

        // Drag and drop for cards
        this.playerHandEl.addEventListener('dragstart', (e) => this.handleDragStart(e));
        this.playerHandEl.addEventListener('dragend', (e) => this.handleDragEnd(e));
        this.playerHandEl.addEventListener('click', (e) => this.handleCardClick(e));
    }

    startNewGame() {
        this.round = 1;
        this.playerScore = 0;
        this.aiScore = 0;
        this.updateScores();
        this.startNewRound();
    }

    startNewRound() {
        // Initialize deck
        this.deck = new Deck();
        
        // Clear hands
        this.playerHand.clear();
        this.aiPlayer.hand = [];
        this.discardPile = [];
        
        // Deal cards
        for (let i = 0; i < CONFIG.HAND_SIZE; i++) {
            this.playerHand.addCard(this.deck.draw());
            this.aiPlayer.hand.push(this.deck.draw());
        }

        // Place first card in discard pile
        this.discardPile.push(this.deck.draw());

        // Reset state
        this.currentTurn = 'player';
        this.hasDrawn = false;
        this.selectedCard = null;
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
            this.updateStatus('Deck is empty!');
            return;
        }

        const card = this.deck.draw();
        this.playerHand.addCard(card);
        this.hasDrawn = true;

        this.renderPlayerHand();
        this.updateCounts();
        this.updateButtons();
        this.updateStatus('You drew a card. Select a card to discard.');
        this.render();
    }

    drawFromDiscard() {
        if (this.gameState !== 'playerTurn' || this.hasDrawn) {
            return;
        }

        if (this.discardPile.length === 0) {
            this.updateStatus('Discard pile is empty!');
            return;
        }

        const card = this.discardPile.pop();
        this.playerHand.addCard(card);
        this.hasDrawn = true;

        this.renderPlayerHand();
        this.updateCounts();
        this.updateButtons();
        this.updateStatus('You drew from discard. Select a card to discard.');
        this.render();
    }

    handleCardClick(e) {
        const cardEl = e.target.closest('.card');
        if (!cardEl) return;

        const cardId = cardEl.dataset.cardId;
        const card = this.playerHand.cards.find(c => c.id === cardId);

        if (!card) return;

        // If haven't drawn, just select/deselect
        if (!this.hasDrawn) {
            if (this.selectedCard?.id === cardId) {
                this.selectedCard = null;
                cardEl.classList.remove('selected');
            } else {
                // Deselect previous
                document.querySelectorAll('.card.selected').forEach(el => {
                    el.classList.remove('selected');
                });
                this.selectedCard = card;
                cardEl.classList.add('selected');
            }
            return;
        }

        // If has drawn, discard the clicked card
        this.discardCard(card);
    }

    discardCard(card) {
        if (!this.hasDrawn) {
            this.updateStatus('Draw a card first!');
            return;
        }

        this.playerHand.removeCard(card);
        this.discardPile.push(card);
        this.hasDrawn = false;
        this.selectedCard = null;

        this.renderPlayerHand();
        this.updateCounts();
        this.updateButtons();
        this.render();

        // Switch to AI turn
        this.currentTurn = 'ai';
        this.gameState = 'aiTurn';
        this.updateStatus("AI's turn...");
        
        setTimeout(() => this.aiTurn(), 1000);
    }

    async aiTurn() {
        this.updateStatus("AI is thinking...");
        
        const result = await this.aiPlayer.takeTurn(
            this.deck,
            this.discardPile,
            (message) => this.updateStatus(message)
        );

        if (result.action === 'declare') {
            this.handleAIDeclaration();
            return;
        }

        if (result.card) {
            this.discardPile.push(result.card);
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

    declare() {
        if (!GameRules.canDeclare(this.playerHand.cards)) {
            this.showModal(
                'Invalid Declaration',
                'You cannot declare yet. You need at least 2 sequences (including 1 pure sequence) and all cards must be in valid melds.'
            );
            return;
        }

        this.handlePlayerDeclaration();
    }

    handlePlayerDeclaration() {
        const points = GameRules.calculatePoints(this.playerHand.cards);
        
        if (points === 0) {
            // Perfect declaration
            this.aiScore += 80;
            this.updateScores();
            this.showModal(
                '🎉 You Won!',
                `Perfect declaration! AI gets 80 penalty points.\n\nYour Score: ${this.playerScore}\nAI Score: ${this.aiScore}`
            );
        } else {
            // Invalid declaration
            this.playerScore += points * 2;
            this.updateScores();
            this.showModal(
                '❌ Invalid Declaration',
                `You had ${points} unmatched points. You get ${points * 2} penalty points.\n\nYour Score: ${this.playerScore}\nAI Score: ${this.aiScore}`
            );
        }

        this.checkGameOver();
    }

    handleAIDeclaration() {
        const points = GameRules.calculatePoints(this.aiPlayer.hand);
        
        if (points === 0) {
            // AI wins
            this.playerScore += 80;
            this.updateScores();
            this.showModal(
                '😔 AI Won!',
                `AI made a perfect declaration! You get 80 penalty points.\n\nYour Score: ${this.playerScore}\nAI Score: ${this.aiScore}`
            );
        } else {
            // AI invalid declaration (rare)
            this.aiScore += points * 2;
            this.updateScores();
            this.showModal(
                '🎉 AI Failed!',
                `AI's declaration was invalid! AI gets ${points * 2} penalty points.\n\nYour Score: ${this.playerScore}\nAI Score: ${this.aiScore}`
            );
        }

        this.checkGameOver();
    }

    checkGameOver() {
        if (this.playerScore >= CONFIG.WIN_THRESHOLD || this.aiScore >= CONFIG.WIN_THRESHOLD) {
            const winner = this.playerScore < this.aiScore ? 'You' : 'AI';
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
            this.playerHandEl.appendChild(cardEl);
        });
    }

    updateCounts() {
        this.deckCountEl.textContent = this.deck.count;
        this.discardCountEl.textContent = this.discardPile.length;
    }

    updateScores() {
        this.playerScoreEl.textContent = this.playerScore;
        this.aiScoreEl.textContent = this.aiScore;
    }

    updateButtons() {
        const isPlayerTurn = this.gameState === 'playerTurn';
        
        this.drawDeckBtn.disabled = !isPlayerTurn || this.hasDrawn;
        this.drawDiscardBtn.disabled = !isPlayerTurn || this.hasDrawn || this.discardPile.length === 0;
        this.declareBtn.disabled = !isPlayerTurn || !this.hasDrawn;
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
        const gameState = {
            aiHand: this.aiPlayer.hand,
            deckCount: this.deck.count,
            discardPile: this.discardPile,
            currentTurn: this.currentTurn
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
