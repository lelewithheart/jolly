import { Game } from './game.js';

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    
    // Show welcome modal
    setTimeout(() => {
        game.showModal(
            '🃏 Welcome to Jolly!',
            'Click "New Game" to start playing.\n\nObjective: Form valid sets and sequences with your cards.\nDrag and drop or click cards to play.\n\nGood luck!'
        );
    }, 500);

    // Make game accessible for debugging
    window.jollyGame = game;
});
