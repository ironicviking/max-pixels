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
        
        this.player = {
            x: 960,
            y: 540,
            velocity: { x: 0, y: 0 },
            speed: 200
        };
        
        this.keys = {};
        
        console.log('Max-Pixels initializing...');
        this.init();
    }
    
    async init() {
        try {
            await this.initializeGraphics();
            await this.initializeUI();
            this.initializeInput();
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
        
        const asteroids = this.graphics.createAsteroidField(15);
        this.graphics.addToLayer('background', asteroids);
        
        const playerShip = this.graphics.createSpaceship(this.player.x, this.player.y, 25, {
            id: 'playerShip'
        });
        this.graphics.addToLayer('game', playerShip);
        this.playerShip = playerShip;
        
        const testPlanet = this.graphics.createPlanet(1200, 300, 60, {
            surfaceColor: '#8b4513',
            coreColor: '#654321',
            atmosphereColor: '#4488ff'
        });
        this.graphics.addToLayer('game', testPlanet);
    }
    
    async initializeUI() {
        console.log('Initializing UI system...');
        this.createHUD();
    }
    
    initializeInput() {
        console.log('Initializing input system...');
        
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            e.preventDefault();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            e.preventDefault();
        });
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
        this.handleInput();
        this.updatePlayer();
    }
    
    handleInput() {
        this.player.velocity.x = 0;
        this.player.velocity.y = 0;
        
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.player.velocity.y = -1;
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            this.player.velocity.y = 1;
        }
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            this.player.velocity.x = -1;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            this.player.velocity.x = 1;
        }
        
        const magnitude = Math.sqrt(
            this.player.velocity.x ** 2 + this.player.velocity.y ** 2
        );
        if (magnitude > 0) {
            this.player.velocity.x /= magnitude;
            this.player.velocity.y /= magnitude;
        }
    }
    
    updatePlayer() {
        const deltaTime = 1/60;
        
        this.player.x += this.player.velocity.x * this.player.speed * deltaTime;
        this.player.y += this.player.velocity.y * this.player.speed * deltaTime;
        
        this.player.x = Math.max(25, Math.min(1895, this.player.x));
        this.player.y = Math.max(25, Math.min(1055, this.player.y));
        
        this.playerShip.setAttribute('transform', 
            `translate(${this.player.x}, ${this.player.y})`);
    }
    
    render(timestamp) {
        this.updateHUD();
    }
    
    createHUD() {
        const hudHTML = `
            <div class="hud">
                <div class="hud-section position">
                    <h3>Position</h3>
                    <div>X: <span id="player-x">0</span></div>
                    <div>Y: <span id="player-y">0</span></div>
                </div>
                <div class="hud-section speed">
                    <h3>Speed</h3>
                    <div>Velocity: <span id="player-speed">0</span></div>
                </div>
                <div class="hud-section controls">
                    <h3>Controls</h3>
                    <div>WASD / Arrow Keys: Move</div>
                </div>
            </div>
        `;
        
        this.uiContainer.insertAdjacentHTML('beforeend', hudHTML);
    }
    
    updateHUD() {
        document.getElementById('player-x').textContent = Math.round(this.player.x);
        document.getElementById('player-y').textContent = Math.round(this.player.y);
        
        const speed = Math.sqrt(
            this.player.velocity.x ** 2 + this.player.velocity.y ** 2
        ) * this.player.speed;
        document.getElementById('player-speed').textContent = Math.round(speed);
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