/**
 * Max-Pixels Game Entry Point
 * Space exploration and trading game built with SVG graphics
 */

import { GraphicsEngine } from './graphics/GraphicsEngine.js';
import { InputManager } from './input/InputManager.js';
import { Camera } from './graphics/Camera.js';

class MaxPixelsGame {
    constructor() {
        this.gameCanvas = document.getElementById('gameCanvas');
        this.uiContainer = document.getElementById('ui');
        this.graphics = new GraphicsEngine(this.gameCanvas);
        this.input = new InputManager();
        this.camera = new Camera(this.gameCanvas);
        this.isInitialized = false;
        
        this.player = {
            x: 960,
            y: 540,
            velocity: { x: 0, y: 0 },
            speed: 200,
            radius: 25
        };
        
        this.asteroids = [];
        
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
        
        this.createAsteroids(15);
        const asteroidsGroup = this.graphics.getLayer('background').querySelector('#asteroidField');
        if (!asteroidsGroup) {
            const asteroidsGroup = this.graphics.createGroup({ id: 'asteroidField' });
            this.graphics.addToLayer('background', asteroidsGroup);
        }
        
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
        
        const tradingStation = this.graphics.createSpaceStation(800, 600, 40, {
            id: 'tradingStation'
        });
        this.graphics.addToLayer('game', tradingStation);
        
        this.camera.centerOn(this.player.x, this.player.y);
    }
    
    async initializeUI() {
        console.log('Initializing UI system...');
        this.createHUD();
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
    
    createAsteroids(count) {
        const bounds = { width: 1920, height: 1080 };
        
        for (let i = 0; i < count; i++) {
            const x = Math.random() * bounds.width;
            const y = Math.random() * bounds.height;
            const size = Math.random() * 30 + 10;
            
            // Store asteroid data
            const asteroidData = { x, y, size };
            this.asteroids.push(asteroidData);
            
            // Create visual asteroid
            const asteroidElement = this.graphics.createAsteroid(x, y, size);
            this.graphics.addToLayer('background', asteroidElement);
        }
    }
    
    checkCollisions() {
        for (let i = 0; i < this.asteroids.length; i++) {
            const asteroid = this.asteroids[i];
            const distance = Math.sqrt(
                Math.pow(this.player.x - asteroid.x, 2) + 
                Math.pow(this.player.y - asteroid.y, 2)
            );
            
            // Simple circular collision detection
            if (distance < this.player.radius + asteroid.size) {
                this.handleCollision(asteroid, i);
                break;
            }
        }
    }
    
    handleCollision(asteroid, index) {
        // Reset player position to center
        this.player.x = 960;
        this.player.y = 540;
        this.player.velocity.x = 0;
        this.player.velocity.y = 0;
        
        // Update player ship visual position
        this.playerShip.setAttribute('transform', 
            `translate(${this.player.x}, ${this.player.y})`);
            
        // Visual feedback - briefly flash red
        this.playerShip.querySelector('path').setAttribute('fill', '#ff4444');
        setTimeout(() => {
            this.playerShip.querySelector('path').setAttribute('fill', '#4a90e2');
        }, 200);
        
        this.camera.shake(15, 500);
            
        console.log('Collision detected! Player reset to center.');
    }

    update(timestamp) {
        this.handleInput();
        this.updatePlayer();
        this.updateCamera();
        this.checkCollisions();
        this.input.update();
    }
    
    handleInput() {
        const movement = this.input.getMovementVector();
        this.player.velocity.x = movement.x;
        this.player.velocity.y = movement.y;
        
        if (this.input.isPressed('boost')) {
            this.player.velocity.x *= 2;
            this.player.velocity.y *= 2;
        }
        
        if (this.input.justPressed('KeyQ')) {
            this.camera.zoomOut();
        }
        if (this.input.justPressed('KeyE')) {
            this.camera.zoomIn();
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
    
    updateCamera() {
        this.camera.follow(this.player.x, this.player.y);
        this.camera.update();
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
                    <div>Shift: Boost</div>
                    <div>Q: Zoom Out | E: Zoom In</div>
                </div>
                <div class="hud-section camera">
                    <h3>Camera</h3>
                    <div>Zoom: <span id="camera-zoom">1.0</span>x</div>
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
        
        document.getElementById('camera-zoom').textContent = this.camera.zoom.toFixed(1);
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