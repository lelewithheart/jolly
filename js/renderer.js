import { ANIMATION_DURATION, CARD_DIMENSIONS } from './config.js';

// Renderer constants
const MELD_WRAP_MARGIN = 100;
const MELD_ROW_HEIGHT = 80;
const MELD_CARD_SPACING = 18;
const MELD_GAP = 30;

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.animations = [];
        this.setupCanvas();
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        
        this.width = rect.width;
        this.height = rect.height;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    drawCard(x, y, card, faceUp = true, scale = 1) {
        const width = CARD_DIMENSIONS.WIDTH * scale;
        const height = CARD_DIMENSIONS.HEIGHT * scale;
        const radius = CARD_DIMENSIONS.RADIUS * scale;

        this.ctx.save();

        // Card shadow
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 10 * scale;
        this.ctx.shadowOffsetX = 2 * scale;
        this.ctx.shadowOffsetY = 2 * scale;

        // Card background
        this.roundRect(x, y, width, height, radius);
        
        if (faceUp && card) {
            if (card.isJoker) {
                // Joker gradient
                const gradient = this.ctx.createLinearGradient(x, y, x + width, y + height);
                gradient.addColorStop(0, '#ff6b6b');
                gradient.addColorStop(0.5, '#ffd93d');
                gradient.addColorStop(1, '#6bcf7f');
                this.ctx.fillStyle = gradient;
            } else {
                this.ctx.fillStyle = '#ffffff';
            }
        } else {
            // Card back
            const gradient = this.ctx.createLinearGradient(x, y, x + width, y + height);
            gradient.addColorStop(0, '#8b4513');
            gradient.addColorStop(1, '#a0522d');
            this.ctx.fillStyle = gradient;
        }

        this.ctx.fill();
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2 * scale;
        this.ctx.stroke();

        this.ctx.shadowColor = 'transparent';

        // Draw card content
        if (faceUp && card) {
            this.ctx.fillStyle = card.color === 'red' ? '#dc3545' : '#000';
            this.ctx.font = `bold ${16 * scale}px Arial`;
            this.ctx.textAlign = 'left';
            this.ctx.fillText(card.displayRank, x + 8 * scale, y + 20 * scale);

            this.ctx.font = `${32 * scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(card.displaySuit, x + width / 2, y + height / 2 + 10 * scale);

            this.ctx.font = `${20 * scale}px Arial`;
            this.ctx.fillText(card.displaySuit, x + width / 2, y + height - 10 * scale);
        } else if (!faceUp) {
            // Draw pattern on card back
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.font = `${40 * scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🃏', x + width / 2, y + height / 2 + 10 * scale);
        }

        this.ctx.restore();
    }

    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    drawHand(cards, y, faceUp = false, spread = true) {
        if (cards.length === 0) return;

        const cardWidth = CARD_DIMENSIONS.WIDTH;
        const spacing = spread ? CARD_DIMENSIONS.SPACING : -50;
        const totalWidth = cardWidth + (cards.length - 1) * spacing;
        const startX = (this.width - totalWidth) / 2;

        cards.forEach((card, index) => {
            const x = startX + index * spacing;
            this.drawCard(x, y, card, faceUp);
        });
    }

    drawDiscardPile(cards, x, y) {
        // Now this is a "discard row" - display as a horizontal row
        if (cards.length === 0) {
            // Draw empty placeholder
            this.ctx.save();
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.roundRect(x, y, CARD_DIMENSIONS.WIDTH, CARD_DIMENSIONS.HEIGHT, CARD_DIMENSIONS.RADIUS);
            this.ctx.stroke();
            this.ctx.restore();
            return;
        }

        // Draw cards in a row (showing last few cards)
        const maxVisible = 5;
        const visibleCards = cards.slice(-maxVisible);
        const spacing = 25; // Overlap spacing
        
        visibleCards.forEach((card, index) => {
            this.drawCard(x + index * spacing, y, card, true, 1);
        });
    }

    drawTableMelds(melds, x, y) {
        if (!melds || melds.length === 0) return;

        let currentX = x;
        
        for (const meld of melds) {
            meld.cards.forEach((card, index) => {
                this.drawCard(currentX + index * MELD_CARD_SPACING, y, card, true, 0.7);
            });
            currentX += meld.cards.length * MELD_CARD_SPACING + MELD_GAP;
            
            // Wrap to next row if needed
            if (currentX > this.width - MELD_WRAP_MARGIN) {
                currentX = x;
                y += MELD_ROW_HEIGHT;
            }
        }
    }

    drawDeck(cardCount, x, y) {
        if (cardCount === 0) {
            // Draw empty placeholder
            this.ctx.save();
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.roundRect(x, y, CARD_DIMENSIONS.WIDTH, CARD_DIMENSIONS.HEIGHT, CARD_DIMENSIONS.RADIUS);
            this.ctx.stroke();
            this.ctx.restore();
            return;
        }

        // Draw stacked cards
        const stackDepth = Math.min(5, Math.ceil(cardCount / 10));
        for (let i = 0; i < stackDepth; i++) {
            this.drawCard(x + i * 2, y - i * 2, null, false, 1);
        }

        // Draw count
        this.ctx.save();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 4;
        this.ctx.fillText(cardCount.toString(), x + CARD_DIMENSIONS.WIDTH / 2, y + CARD_DIMENSIONS.HEIGHT / 2 + 5);
        this.ctx.restore();
    }

    drawText(text, x, y, options = {}) {
        this.ctx.save();
        this.ctx.fillStyle = options.color || '#ffffff';
        this.ctx.font = options.font || '20px Arial';
        this.ctx.textAlign = options.align || 'center';
        
        if (options.shadow) {
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 4;
        }
        
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    }

    drawGameBoard(gameState) {
        this.clear();

        // Draw AI hand (face down)
        this.drawHand(gameState.aiHand, 30, false, true);
        this.drawText(`AI Hand (${gameState.aiHand.length} cards)`, this.width / 2, 20, {
            font: 'bold 16px Arial',
            shadow: true
        });

        // Draw table melds (in the middle area)
        if (gameState.tableMelds && gameState.tableMelds.length > 0) {
            this.drawText('Table Melds', this.width / 2, this.height / 2 - 90, {
                font: 'bold 14px Arial',
                shadow: true
            });
            this.drawTableMelds(gameState.tableMelds, 30, this.height / 2 - 70);
        }

        // Draw deck
        const deckX = this.width / 2 - 150;
        const deckY = this.height / 2 + 20;
        this.drawDeck(gameState.deckCount, deckX, deckY);
        this.drawText('Deck', deckX + 35, deckY + 120, {
            font: '14px Arial',
            shadow: true
        });

        // Draw discard row
        const discardX = this.width / 2 + 20;
        const discardY = this.height / 2 + 20;
        const discardRowCards = gameState.discardRow || gameState.discardPile || [];
        this.drawDiscardPile(discardRowCards, discardX, discardY);
        this.drawText('Discard Row', discardX + 60, discardY + 120, {
            font: '14px Arial',
            shadow: true
        });

        // Draw current turn indicator
        const turnText = gameState.currentTurn === 'player' ? "Your Turn" : "AI's Turn";
        const turnColor = gameState.currentTurn === 'player' ? '#97cc04' : '#ff6b6b';
        this.drawText(turnText, this.width / 2, this.height - 30, {
            font: 'bold 24px Arial',
            color: turnColor,
            shadow: true
        });
    }

    animateCardMove(fromX, fromY, toX, toY, callback) {
        const startTime = Date.now();
        const duration = ANIMATION_DURATION.CARD_MOVE;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const eased = progress < 0.5 
                ? 2 * progress * progress 
                : -1 + (4 - 2 * progress) * progress;

            const currentX = fromX + (toX - fromX) * eased;
            const currentY = fromY + (toY - fromY) * eased;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else if (callback) {
                callback();
            }
        };

        animate();
    }

    resize() {
        this.setupCanvas();
    }
}
