/**
 * Max-Pixels Game Entry Point
 * Space exploration and trading game built with SVG graphics
 */

import { GraphicsEngine } from './graphics/GraphicsEngine.js';

class MaxPixelsGame {
    constructor() {
        this.gameCanvas = document.getElementById('gameCanvas');
        this.uiContainer = document.getElementById('ui');
        this.graphics = new GraphicsEngine(this.gameCanvas);
        this.isInitialized = false;
        
        console.log('Max-Pixels initializing...');
        this.init();
    }
    
    async init() {
        try {
            await this.initializeGraphics();
            await this.initializeUI();
            this.startGameLoop();
            
            this.isInitialized = true;
            console.log('Max-Pixels initialized successfully');
            
            this.hideLoadingScreen();
        } catch (error) {
            console.error('Failed to initialize Max-Pixels:', error);
        }
    }
    
    async initializeGraphics() {
        console.log('Initializing graphics system...');
        
        const backgroundLayer = this.graphics.createLayer('background', 1);
        const gameLayer = this.graphics.createLayer('game', 5);
        
        const stars = this.graphics.createStarField(200);
        this.graphics.addToLayer('background', stars);
        
        const playerShip = this.graphics.createSpaceship(960, 540, 25, {
            id: 'playerShip'
        });
        this.graphics.addToLayer('game', playerShip);
        
        const testPlanet = this.graphics.createPlanet(1200, 300, 60, {
            surfaceColor: '#8b4513',
            coreColor: '#654321',
            atmosphereColor: '#4488ff'
        });
        this.graphics.addToLayer('game', testPlanet);
    }
    
    async initializeUI() {
        console.log('Initializing UI system...');
    }
    
    
    startGameLoop() {
        console.log('Starting game loop...');
        
        const gameLoop = (timestamp) => {
            this.update(timestamp);
            this.render(timestamp);
            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
    }
    
    update(timestamp) {
    }
    
    render(timestamp) {
    }
    
    hideLoadingScreen() {
        const loading = this.uiContainer.querySelector('.loading');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => {
                loading.style.display = 'none';
            }, 1000);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.maxPixelsGame = new MaxPixelsGame();
});