/**
 * Max-Pixels Game Entry Point
 * Space exploration and trading game built with SVG graphics
 */

import { GraphicsEngine } from './graphics/GraphicsEngine.js';
import { ParticleSystem } from './graphics/ParticleSystem.js';
import { InputManager } from './input/InputManager.js';
import { Camera } from './graphics/Camera.js';
import { AudioManager } from './audio/AudioManager.js';
import { AuthService } from './auth/AuthService.js';
import { AuthUI } from './ui/AuthUI.js';
import { TradingSystem } from './trading/TradingSystem.js';
import { TradingUI } from './ui/TradingUI.js';
import { SpaceNavigation } from './navigation/SpaceNavigation.js';
import { NetworkManager } from './network/NetworkManager.js';
import { RESOURCES, WEAPONS, PLAYER, UI } from './constants.js';

class MaxPixelsGame {
    constructor() {
        this.gameCanvas = document.getElementById('gameCanvas');
        this.uiContainer = document.getElementById('ui');
        this.graphics = new GraphicsEngine(this.gameCanvas);
        this.particles = new ParticleSystem(this.graphics);
        this.input = new InputManager();
        this.camera = new Camera(this.gameCanvas);
        this.audio = new AudioManager();
        this.auth = new AuthService();
        this.authUI = null;
        this.trading = new TradingSystem();
        this.tradingUI = new TradingUI(this.trading, this.auth);
        this.navigation = new SpaceNavigation();
        this.network = new NetworkManager();
        this.initializePlayerInventory();
        this.initializeNetworking();
        this.isInitialized = false;
        
        this.player = {
            x: 960,
            y: 540,
            velocity: { x: 0, y: 0 },
            speed: 200,
            radius: 25,
            rotation: 0,
            energy: WEAPONS.MAX_ENERGY,
            lastEnergyRegenTime: Date.now()
        };
        
        this.asteroids = [];
        
        this.stations = [];
        this.nearbyStation = null;
        this.nearbyJumpGate = null;
        this.interactionRange = 80;
        
        // Multiplayer player tracking
        this.otherPlayers = new Map();
        
        // Visual feedback tracking
        this.highlightedStation = null;
        this.highlightedJumpGate = null;
        
        this.activeThrusterSound = null;
        this.ambientSound = null;
        
        // Weapon system
        this.lastFireTime = 0;
        this.lastEnergyRechargeSound = 0;
        
        console.log('Max-Pixels initializing...');
        this.init();
    }
    
    async init() {
        try {
            await this.initializeGraphics();
            await this.initializeUI();
            this.initializeAudio();
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
        
        this.loadCurrentSector();
        
        const playerShip = this.graphics.createSpaceship(this.player.x, this.player.y, 25, {
            id: 'playerShip'
        });
        this.graphics.addToLayer('game', playerShip);
        this.playerShip = playerShip;
        
        this.camera.centerOn(this.player.x, this.player.y);
    }
    
    async initializeUI() {
        console.log('Initializing UI system...');
        this.createHUD();
        this.authUI = new AuthUI(this.auth, this.uiContainer);
    }
    
    initializeAudio() {
        console.log('Initializing audio system...');
        this.ambientSound = this.audio.playAmbient();
        
        document.addEventListener('click', () => {
            this.audio.resumeAudioContext();
        }, { once: true });
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
    
    loadCurrentSector() {
        const sector = this.navigation.getCurrentSector();
        if (!sector) return;
        
        console.log(`Loading sector: ${sector.name}`);
        
        // Clear existing content
        this.clearSector();
        
        // Set background
        const backgroundLayer = this.graphics.getLayer('background');
        if (backgroundLayer) {
            backgroundLayer.style.backgroundColor = sector.backgroundColor;
        }
        
        // Load stars
        const stars = this.graphics.createStarField(200);
        this.graphics.addToLayer('background', stars);
        
        // Load asteroids
        this.createAsteroids(sector.asteroids, sector.bounds);
        
        // Load planets
        sector.planets.forEach(planet => {
            const planetElement = this.graphics.createPlanet(
                planet.x, planet.y, planet.radius, {
                    surfaceColor: planet.surfaceColor,
                    coreColor: planet.coreColor,
                    atmosphereColor: planet.atmosphereColor
                }
            );
            this.graphics.addToLayer('game', planetElement);
        });
        
        // Load stations
        this.stations = [];
        sector.stations.forEach(station => {
            const stationElement = this.graphics.createSpaceStation(
                station.x, station.y, station.radius, {
                    id: station.id
                }
            );
            this.graphics.addToLayer('game', stationElement);
            this.stations.push(station);
        });
        
        // Load jump gates
        sector.jumpGates.forEach(gate => {
            const gateElement = this.graphics.createJumpGate(
                gate.x, gate.y, gate.radius, {
                    id: gate.id
                }
            );
            this.graphics.addToLayer('game', gateElement);
        });
    }
    
    clearSector() {
        // Clear visual feedback tracking
        this.highlightedStation = null;
        this.highlightedJumpGate = null;
        this.nearbyStation = null;
        this.nearbyJumpGate = null;
        
        // Clear asteroids data
        this.asteroids = [];
        this.stations = [];
        
        // Clear visual elements
        const backgroundLayer = this.graphics.getLayer('background');
        const gameLayer = this.graphics.getLayer('game');
        
        if (backgroundLayer) {
            // Keep only the player ship
            backgroundLayer.innerHTML = '';
        }
        
        if (gameLayer) {
            // Keep only the player ship and other players
            const playerShip = gameLayer.querySelector('#playerShip');
            const otherPlayerShips = Array.from(gameLayer.querySelectorAll('[id^="otherPlayer_"]'));
            gameLayer.innerHTML = '';
            if (playerShip) {
                gameLayer.appendChild(playerShip);
            }
            // Re-add other player ships
            otherPlayerShips.forEach(ship => gameLayer.appendChild(ship));
        }
    }
    
    createAsteroids(count, bounds) {
        for (let i = 0; i < count; i++) {
            const x = Math.random() * bounds.width;
            const y = Math.random() * bounds.height;
            const size = Math.random() * 30 + 10;
            
            // Generate unique ID for asteroid tracking
            const asteroidId = `asteroid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Store asteroid data with unique ID
            const asteroidData = { id: asteroidId, x, y, size };
            this.asteroids.push(asteroidData);
            
            // Create visual asteroid with matching ID
            const asteroidElement = this.graphics.createAsteroid(x, y, size, { id: asteroidId });
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
                this.handleCollision(asteroid);
                break;
            }
        }
    }
    
    handleCollision(asteroid) {
        // Play collision sound
        this.audio.playCollision(0.8);
        
        // Create explosion particle effect at collision point
        this.particles.createExplosionEffect(asteroid.x, asteroid.y, {
            particleCount: 30,
            colors: ['#ff4444', '#ff8800', '#ffff00', '#ffffff', '#ffaa44'],
            velocity: { min: 60, max: 120 }
        });
        
        // Create sparks effect at player position
        this.particles.createSparksEffect(this.player.x, this.player.y);
        
        // Reset player position to center
        this.player.x = 960;
        this.player.y = 540;
        this.player.velocity.x = 0;
        this.player.velocity.y = 0;
        
        // Update player ship visual position
        this.playerShip.setAttribute('transform', 
            `translate(${this.player.x}, ${this.player.y}) rotate(${this.player.rotation})`);
            
        // Visual feedback - briefly flash red
        this.playerShip.querySelector('path').setAttribute('fill', '#ff4444');
        setTimeout(() => {
            this.playerShip.querySelector('path').setAttribute('fill', '#4a90e2');
        }, 200);
        
        this.camera.shake(15, 500);
            
        console.log('Collision detected! Player reset to center.');
    }
    
    checkStationProximity() {
        let closestStation = null;
        let closestDistance = Infinity;
        
        for (let station of this.stations) {
            const distance = Math.sqrt(
                Math.pow(this.player.x - station.x, 2) + 
                Math.pow(this.player.y - station.y, 2)
            );
            
            if (distance < this.interactionRange && distance < closestDistance) {
                closestDistance = distance;
                closestStation = station;
            }
        }
        
        // Update visual feedback for stations
        if (closestStation !== this.highlightedStation) {
            // Remove glow from previously highlighted station
            if (this.highlightedStation) {
                const prevStationElement = this.graphics.svg.querySelector(`#${this.highlightedStation.id}`);
                if (prevStationElement) {
                    this.graphics.removeProximityGlow(prevStationElement);
                }
            }
            
            // Add glow to newly highlighted station
            if (closestStation) {
                const stationElement = this.graphics.svg.querySelector(`#${closestStation.id}`);
                if (stationElement) {
                    this.graphics.addProximityGlow(stationElement, UI.PROXIMITY_GLOW_COLOR);
                }
            }
            
            this.highlightedStation = closestStation;
        }
        
        if (closestStation !== this.nearbyStation) {
            this.nearbyStation = closestStation;
            this.updateInteractionPrompt();
        }
    }
    
    interactWithStation(station) {
        console.log(`Interacting with ${station.name}!`);
        
        if (station.type === 'trading') {
            this.openTradingInterface(station);
        }
    }
    
    openTradingInterface(station) {
        console.log(`Opening trading interface for ${station.name}`);
        this.tradingUI.openTradingInterface(station);
    }
    
    checkJumpGateProximity() {
        const nearbyGate = this.navigation.checkJumpGateProximity(
            this.player.x, this.player.y, this.interactionRange
        );
        
        // Update visual feedback for jump gates
        if (nearbyGate !== this.highlightedJumpGate) {
            // Remove glow from previously highlighted gate
            if (this.highlightedJumpGate) {
                const prevGateElement = this.graphics.svg.querySelector(`#${this.highlightedJumpGate.id}`);
                if (prevGateElement) {
                    this.graphics.removeProximityGlow(prevGateElement);
                }
            }
            
            // Add glow to newly highlighted gate
            if (nearbyGate) {
                const gateElement = this.graphics.svg.querySelector(`#${nearbyGate.id}`);
                if (gateElement) {
                    this.graphics.addProximityGlow(gateElement, UI.PROXIMITY_GLOW_COLOR);
                }
            }
            
            this.highlightedJumpGate = nearbyGate;
        }
        
        if (nearbyGate !== this.nearbyJumpGate) {
            this.nearbyJumpGate = nearbyGate;
            this.updateInteractionPrompt();
        }
    }
    
    async jumpThroughGate(gate) {
        if (!this.navigation.canJump()) {
            console.log('Jump on cooldown');
            return;
        }
        
        console.log(`Jumping through ${gate.name} to ${gate.destination}`);
        
        // Jump animation and logic
        const success = await this.navigation.jumpToSector(
            gate.destination,
            (fromSector, toSector) => {
                // Jump start callback
                console.log(`Starting jump from ${fromSector} to ${toSector}`);
                this.showJumpAnimation();
            },
            (toSector, sectorData) => {
                // Jump complete callback
                console.log(`Jump complete to ${toSector}`);
                this.onSectorChanged(toSector, sectorData);
            }
        );
        
        if (!success) {
            console.error('Jump failed');
        }
    }
    
    showJumpAnimation() {
        // Simple screen flash effect
        const flashElement = document.createElement('div');
        flashElement.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: white;
            opacity: 0.8;
            z-index: 1000;
            pointer-events: none;
        `;
        
        document.body.appendChild(flashElement);
        
        setTimeout(() => {
            flashElement.style.transition = 'opacity 0.5s';
            flashElement.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(flashElement);
            }, 500);
        }, 100);
    }
    
    onSectorChanged(sectorId, sectorData) {
        // Update player position to spawn point
        const spawnPos = this.navigation.getPlayerSpawnPosition(sectorId);
        this.player.x = spawnPos.x;
        this.player.y = spawnPos.y;
        this.player.velocity.x = 0;
        this.player.velocity.y = 0;
        
        // Update player bounds for new sector
        this.updatePlayerBounds();
        
        // Reload sector graphics
        this.loadCurrentSector();
        
        // Re-add player ship to game layer
        this.graphics.addToLayer('game', this.playerShip);
        this.playerShip.setAttribute('transform', 
            `translate(${this.player.x}, ${this.player.y}) rotate(${this.player.rotation})`);
        
        // Update camera
        this.camera.centerOn(this.player.x, this.player.y);
        
        console.log(`Now in ${sectorData.name}`);
    }
    
    updateInteractionPrompt() {
        const promptElement = document.getElementById('interaction-prompt');
        const nameElement = document.getElementById('station-name');
        const actionElement = document.getElementById('interaction-text');
        
        if (this.nearbyStation) {
            promptElement.style.display = 'block';
            nameElement.textContent = this.nearbyStation.name;
            actionElement.textContent = 'Press F to Dock';
        } else if (this.nearbyJumpGate) {
            promptElement.style.display = 'block';
            nameElement.textContent = this.nearbyJumpGate.name;
            actionElement.textContent = 'Press F to Jump';
        } else {
            promptElement.style.display = 'none';
        }
    }

    update(timestamp) {
        this.handleInput();
        this.updatePlayer();
        this.updateEnergy();
        this.updateThrusterEffects();
        this.updateCamera();
        this.checkCollisions();
        this.checkStationProximity();
        this.checkJumpGateProximity();
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
        
        if (this.input.justPressed('KeyF')) {
            if (this.nearbyStation) {
                this.interactWithStation(this.nearbyStation);
            } else if (this.nearbyJumpGate) {
                this.jumpThroughGate(this.nearbyJumpGate);
            }
        }
        
        // Weapon firing
        if (this.input.isPressed('action')) {
            this.fireLaser();
        }
    }
    
    updatePlayer() {
        const deltaTime = PLAYER.DELTA_TIME;
        
        // Update rotation based on movement direction
        if (this.player.velocity.x !== 0 || this.player.velocity.y !== 0) {
            const targetRotation = Math.atan2(this.player.velocity.x, -this.player.velocity.y) * 180 / Math.PI;
            
            // Smooth rotation interpolation
            let angleDiff = targetRotation - this.player.rotation;
            
            // Handle angle wrapping (-180 to 180)
            if (angleDiff > 180) angleDiff -= 360;
            if (angleDiff < -180) angleDiff += 360;
            
            // Apply rotation smoothing
            this.player.rotation += angleDiff * PLAYER.ROTATION_SMOOTHING;
            
            // Keep rotation within -180 to 180 range
            if (this.player.rotation > 180) this.player.rotation -= 360;
            if (this.player.rotation < -180) this.player.rotation += 360;
        }
        
        this.player.x += this.player.velocity.x * this.player.speed * deltaTime;
        this.player.y += this.player.velocity.y * this.player.speed * deltaTime;
        
        // Use current sector bounds
        const bounds = this.navigation.getSectorBounds();
        this.player.x = Math.max(25, Math.min(bounds.width - 25, this.player.x));
        this.player.y = Math.max(25, Math.min(bounds.height - 25, this.player.y));
        
        this.playerShip.setAttribute('transform', 
            `translate(${this.player.x}, ${this.player.y}) rotate(${this.player.rotation})`);
            
        // Send position updates to multiplayer server
        this.sendPlayerUpdate();
    }
    
    updatePlayerBounds() {
        // Called when sector changes to update bounds
        const bounds = this.navigation.getSectorBounds();
        this.player.x = Math.max(25, Math.min(bounds.width - 25, this.player.x));
        this.player.y = Math.max(25, Math.min(bounds.height - 25, this.player.y));
    }
    
    updateEnergy() {
        const currentTime = Date.now();
        const deltaTime = (currentTime - this.player.lastEnergyRegenTime) / 1000; // Convert to seconds
        const previousEnergy = this.player.energy;
        
        // Regenerate energy over time
        if (this.player.energy < WEAPONS.MAX_ENERGY) {
            this.player.energy = Math.min(
                WEAPONS.MAX_ENERGY,
                this.player.energy + (WEAPONS.ENERGY_REGEN_RATE * deltaTime)
            );
            
            // Play recharge sound when energy crosses the recharge threshold
            if (previousEnergy < WEAPONS.ENERGY_RECHARGE_SOUND_THRESHOLD && 
                this.player.energy >= WEAPONS.ENERGY_RECHARGE_SOUND_THRESHOLD &&
                currentTime - this.lastEnergyRechargeSound > 2000) { // Minimum 2 second cooldown
                
                this.audio.playWeaponRecharge();
                this.lastEnergyRechargeSound = currentTime;
                this.showEnergyRechargeEffect();
                console.log('Weapon energy recharged!');
            }
        }
        
        this.player.lastEnergyRegenTime = currentTime;
    }
    
    showEnergyRechargeEffect() {
        // Create a brief visual flash on the energy bar to indicate recharge
        const energyFill = document.getElementById('energy-fill');
        if (!energyFill) return;
        
        // Save original styles
        const originalBackground = energyFill.style.backgroundColor;
        const originalBoxShadow = energyFill.style.boxShadow;
        
        // Apply recharge flash effect
        energyFill.style.backgroundColor = '#00ffff';
        energyFill.style.boxShadow = '0 0 8px #00ffff';
        energyFill.style.transition = 'all 0.1s ease-in-out';
        
        // Revert to normal after brief flash
        setTimeout(() => {
            energyFill.style.backgroundColor = originalBackground || '#44ff44';
            energyFill.style.boxShadow = originalBoxShadow || '';
            energyFill.style.transition = '';
        }, 150);
    }
    
    updateThrusterEffects() {
        const movement = this.input.getMovementVector();
        const boost = this.input.isPressed('boost');
        const isMoving = movement.x !== 0 || movement.y !== 0;
        
        // Update visual thruster effects
        this.graphics.updateSpaceshipThrusters(this.playerShip, movement, boost);
        
        // Create thruster particle trail effects
        if (isMoving) {
            const intensity = boost ? 1.0 : 0.6;
            
            // Main thruster (backward movement - forward thrust)
            if (movement.y > 0) {
                const thrusterX = this.player.x;
                const thrusterY = this.player.y + 30; // Behind the ship
                const thrusterAngle = this.player.rotation * Math.PI / 180;
                this.particles.createThrusterTrail(thrusterX, thrusterY, thrusterAngle, intensity);
            }
            
            // Side thrusters for lateral movement
            if (movement.x !== 0) {
                const sideIntensity = intensity * 0.7;
                const thrusterAngle = this.player.rotation * Math.PI / 180;
                
                if (movement.x > 0) { // Moving right, left thruster fires
                    const thrusterX = this.player.x - Math.cos(thrusterAngle + Math.PI/2) * 20;
                    const thrusterY = this.player.y - Math.sin(thrusterAngle + Math.PI/2) * 20;
                    this.particles.createThrusterTrail(thrusterX, thrusterY, thrusterAngle - Math.PI/2, sideIntensity);
                }
                if (movement.x < 0) { // Moving left, right thruster fires
                    const thrusterX = this.player.x + Math.cos(thrusterAngle + Math.PI/2) * 20;
                    const thrusterY = this.player.y + Math.sin(thrusterAngle + Math.PI/2) * 20;
                    this.particles.createThrusterTrail(thrusterX, thrusterY, thrusterAngle + Math.PI/2, sideIntensity);
                }
            }
        }
        
        // Manage thruster audio
        if (isMoving) {
            const intensity = boost ? 1.0 : 0.6;
            if (!this.activeThrusterSound) {
                this.activeThrusterSound = this.audio.playThruster(intensity);
            } else {
                this.activeThrusterSound.setVolume(intensity * 0.6);
            }
        } else {
            if (this.activeThrusterSound) {
                this.activeThrusterSound.fadeOut(0.3);
                this.activeThrusterSound = null;
            }
        }
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
                <div class="hud-section energy">
                    <h3>Energy</h3>
                    <div>Level: <span id="player-energy">100</span>/100</div>
                    <div class="energy-bar">
                        <div id="energy-fill" class="energy-fill"></div>
                    </div>
                </div>
                <div class="hud-section inventory">
                    <h3>Inventory</h3>
                    <div>Iron: <span id="inventory-iron">0</span></div>
                    <div>Copper: <span id="inventory-copper">0</span></div>
                </div>
                <div class="hud-section controls">
                    <h3>Controls</h3>
                    <div>WASD / Arrow Keys: Move</div>
                    <div>Shift: Boost</div>
                    <div>Space: Fire Laser</div>
                    <div>Q: Zoom Out | E: Zoom In</div>
                </div>
                <div class="hud-section camera">
                    <h3>Camera</h3>
                    <div>Zoom: <span id="camera-zoom">1.0</span>x</div>
                </div>
                <div class="hud-section particles">
                    <h3>Particles</h3>
                    <div>Active: <span id="particle-count">0</span></div>
                </div>
                <div class="hud-section interaction" id="interaction-prompt" style="display: none;">
                    <h3>Station Nearby</h3>
                    <div id="interaction-text">Press F to Dock</div>
                    <div id="station-name"></div>
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
        
        // Update energy display
        const energyLevel = Math.round(this.player.energy);
        const energyPercentage = (this.player.energy / WEAPONS.MAX_ENERGY) * 100;
        document.getElementById('player-energy').textContent = energyLevel;
        
        const energyFill = document.getElementById('energy-fill');
        if (energyFill) {
            energyFill.style.width = energyPercentage + '%';
            // Change color based on energy level
            if (this.player.energy < WEAPONS.LOW_ENERGY_THRESHOLD) {
                energyFill.style.backgroundColor = '#ff4444';
            } else if (this.player.energy < WEAPONS.MAX_ENERGY * 0.5) {
                energyFill.style.backgroundColor = '#ffaa44';
            } else {
                energyFill.style.backgroundColor = '#44ff44';
            }
        }
        
        document.getElementById('camera-zoom').textContent = this.camera.zoom.toFixed(1);
        
        // Update particle system debug info
        const particleDebug = this.particles.getDebugInfo();
        document.getElementById('particle-count').textContent = particleDebug.activeParticles;
        
        // Update inventory display
        const ironQuantity = this.trading.getPlayerItemQuantity('ore-iron');
        const copperQuantity = this.trading.getPlayerItemQuantity('ore-copper');
        document.getElementById('inventory-iron').textContent = ironQuantity;
        document.getElementById('inventory-copper').textContent = copperQuantity;
    }
    
    fireLaser() {
        const currentTime = Date.now();
        if (currentTime - this.lastFireTime < WEAPONS.LASER_FIRE_RATE) {
            return;
        }
        
        // Check if player has enough energy
        if (this.player.energy < WEAPONS.ENERGY_COST) {
            console.log('Insufficient energy to fire laser!');
            return;
        }
        
        // Consume energy
        this.player.energy -= WEAPONS.ENERGY_COST;
        this.lastFireTime = currentTime;
        
        // Convert rotation to radians (rotation is in degrees)
        const rotationRad = this.player.rotation * Math.PI / 180;
        
        // Calculate laser start position (tip of ship in facing direction)
        const laserStartX = this.player.x + Math.sin(rotationRad) * this.player.radius;
        const laserStartY = this.player.y - Math.cos(rotationRad) * this.player.radius;
        
        // Calculate laser end position (ahead of ship in facing direction)
        const laserEndX = this.player.x + Math.sin(rotationRad) * WEAPONS.LASER_RANGE;
        const laserEndY = this.player.y - Math.cos(rotationRad) * WEAPONS.LASER_RANGE;
        
        // Create laser beam using graphics engine
        const laser = this.graphics.createLaserBeam(
            laserStartX, laserStartY,
            laserEndX, laserEndY,
            {
                color: WEAPONS.LASER_COLOR,
                glowColor: WEAPONS.LASER_GLOW_COLOR,
                width: WEAPONS.LASER_WIDTH,
                duration: WEAPONS.LASER_DURATION
            }
        );
        
        // Add laser to game layer
        this.graphics.addToLayer('game', laser);
        
        // Check for laser hits on asteroids
        this.checkLaserHits(laserStartX, laserStartY, laserEndX, laserEndY);
        
        // Play laser sound
        this.audio.playLaser(0.4);
        
        // Send fire action to multiplayer server
        this.sendFireAction();
        
        console.log('Laser fired!');
    }
    
    checkLaserHits(startX, startY, endX, endY) {
        // Optimized line-circle intersection for asteroids
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            
            // Quick bounding box check for early elimination
            const minX = Math.min(startX, endX) - asteroid.size;
            const maxX = Math.max(startX, endX) + asteroid.size;
            const minY = Math.min(startY, endY) - asteroid.size;
            const maxY = Math.max(startY, endY) + asteroid.size;
            
            if (asteroid.x < minX || asteroid.x > maxX || 
                asteroid.y < minY || asteroid.y > maxY) {
                continue; // Skip this asteroid, it's too far away
            }
            
            // Optimized squared distance check to avoid sqrt
            const squaredDistance = this.squaredDistanceFromPointToLineSegment(
                asteroid.x, asteroid.y,
                startX, startY,
                endX, endY
            );
            
            const squaredRadius = asteroid.size * asteroid.size;
            
            if (squaredDistance < squaredRadius) {
                // Hit! Create impact effect
                const impact = this.graphics.createLaserImpact(asteroid.x, asteroid.y, {
                    size: WEAPONS.IMPACT_SIZE,
                    color: WEAPONS.IMPACT_COLOR,
                    ringColor: WEAPONS.IMPACT_RING_COLOR,
                    duration: WEAPONS.IMPACT_DURATION
                });
                this.graphics.addToLayer('game', impact);
                
                // Create explosion particle effect
                this.particles.createExplosionEffect(asteroid.x, asteroid.y, {
                    particleCount: WEAPONS.HIT_PARTICLE_COUNT,
                    colors: ['#ff8800', '#ffff00', '#ff4444', '#ffffff', '#ffcc00', '#ff6600'],
                    velocity: { min: WEAPONS.HIT_VELOCITY_MIN, max: WEAPONS.HIT_VELOCITY_MAX }
                });
                
                // Create debris field particle effect
                this.particles.createDebrisField(asteroid.x, asteroid.y, asteroid.size);
                
                // Generate resource drop before destroying asteroid
                this.dropAsteroidResources(asteroid);
                
                // Remove asteroid using ID-based tracking
                this.destroyAsteroid(asteroid.id);
                
                console.log('Asteroid destroyed!');
                break; // Only hit first asteroid in line
            }
        }
    }
    
    distanceFromPointToLine(px, py, x1, y1, x2, y2) {
        // Calculate distance from point (px, py) to line segment (x1, y1) to (x2, y2)
        const lineLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        
        if (lineLength === 0) {
            return Math.sqrt(Math.pow(px - x1, 2) + Math.pow(py - y1, 2));
        }
        
        const t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / (lineLength * lineLength)));
        const projectionX = x1 + t * (x2 - x1);
        const projectionY = y1 + t * (y2 - y1);
        
        return Math.sqrt(Math.pow(px - projectionX, 2) + Math.pow(py - projectionY, 2));
    }
    
    squaredDistanceFromPointToLineSegment(px, py, x1, y1, x2, y2) {
        // Optimized version that returns squared distance to avoid sqrt calculation
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lineLengthSquared = dx * dx + dy * dy;
        
        // If the line segment is actually a point
        if (lineLengthSquared === 0) {
            const dpx = px - x1;
            const dpy = py - y1;
            return dpx * dpx + dpy * dpy;
        }
        
        // Calculate the parameter t for the closest point on the line segment
        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lineLengthSquared));
        
        // Find the closest point on the line segment
        const projectionX = x1 + t * dx;
        const projectionY = y1 + t * dy;
        
        // Return squared distance
        const dpx = px - projectionX;
        const dpy = py - projectionY;
        return dpx * dpx + dpy * dpy;
    }
    
    destroyAsteroid(asteroidId) {
        // Remove from data array using ID
        const asteroidIndex = this.asteroids.findIndex(asteroid => asteroid.id === asteroidId);
        if (asteroidIndex !== -1) {
            this.asteroids.splice(asteroidIndex, 1);
        }
        
        // Find and remove visual element by ID
        const gameLayer = this.graphics.getLayer('background');
        if (gameLayer) {
            const asteroidElement = gameLayer.querySelector(`#${asteroidId}`);
            if (asteroidElement) {
                this.graphics.remove(asteroidElement);
            }
        }
    }
    
    dropAsteroidResources(asteroid) {
        // Determine resource type based on asteroid size
        const resourceType = RESOURCES.ASTEROID_RESOURCE_TYPES[
            Math.floor(Math.random() * RESOURCES.ASTEROID_RESOURCE_TYPES.length)
        ];
        
        // Calculate resource quantity based on asteroid size
        const resourceQuantity = Math.floor(asteroid.size / RESOURCES.RESOURCE_SIZE_DIVIDER) + RESOURCES.RESOURCE_BASE_QUANTITY;
        
        // Add resources to player inventory
        this.trading.addPlayerItem(resourceType, resourceQuantity);
        
        // Create visual resource pickup effect
        this.showResourcePickup(asteroid.x, asteroid.y, resourceType, resourceQuantity);
        
        console.log(`Collected ${resourceQuantity}x ${resourceType} from asteroid`);
    }
    
    showResourcePickup(x, y, resourceType, quantity) {
        // Create floating text showing the resource gained
        const resourceElement = document.createElement('div');
        resourceElement.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            color: #00ff00;
            font-family: monospace;
            font-size: 14px;
            font-weight: bold;
            pointer-events: none;
            z-index: 1000;
            text-shadow: 0 0 4px #000;
            transform: translate(-50%, -50%);
        `;
        
        const resourceName = resourceType === 'ore-iron' ? 'Iron' : 'Copper';
        resourceElement.textContent = `+${quantity} ${resourceName}`;
        
        document.body.appendChild(resourceElement);
        
        // Animate the text floating upward and fading out
        let opacity = 1;
        let yOffset = 0;
        
        const animateResource = () => {
            opacity -= RESOURCES.PICKUP_OPACITY_DECAY;
            yOffset -= RESOURCES.PICKUP_FLOAT_SPEED;
            
            resourceElement.style.opacity = opacity;
            resourceElement.style.transform = `translate(-50%, -50%) translateY(${yOffset}px)`;
            
            if (opacity > 0) {
                requestAnimationFrame(animateResource);
            } else {
                document.body.removeChild(resourceElement);
            }
        };
        
        requestAnimationFrame(animateResource);
    }
    
    initializePlayerInventory() {
        // Give the player some starting items for testing
        this.trading.addPlayerItem('ore-iron', 10);
        this.trading.addPlayerItem('food-rations', 5);
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
    
    initializeNetworking() {
        // Set up network event handlers
        this.network.onConnection('connected', () => {
            console.log('Connected to multiplayer server');
            this.showNetworkStatus('Connected', 'success');
        });
        
        this.network.onConnection('disconnected', () => {
            console.log('Disconnected from multiplayer server');
            this.showNetworkStatus('Disconnected', 'warning');
        });
        
        this.network.onConnection('error', (error) => {
            console.error('Network connection error:', error);
            this.showNetworkStatus('Connection Error', 'error');
        });
        
        this.network.onConnection('reconnectFailed', () => {
            console.error('Failed to reconnect to server');
            this.showNetworkStatus('Offline Mode', 'info');
        });
        
        // Handle incoming player messages
        this.network.on(this.network.MessageTypes.PLAYER_JOIN, (data) => {
            this.handlePlayerJoin(data);
        });
        
        this.network.on(this.network.MessageTypes.PLAYER_LEAVE, (data) => {
            this.handlePlayerLeave(data);
        });
        
        this.network.on(this.network.MessageTypes.PLAYER_MOVE, (data) => {
            this.handlePlayerMove(data);
        });
        
        this.network.on(this.network.MessageTypes.PLAYER_FIRE, (data) => {
            this.handlePlayerFire(data);
        });
        
        this.network.on(this.network.MessageTypes.CHAT_MESSAGE, (data) => {
            this.handleChatMessage(data);
        });
        
        this.network.on(this.network.MessageTypes.GAME_STATE, (data) => {
            this.handleGameState(data);
        });
    }
    
    async connectToMultiplayer(serverUrl = 'ws://localhost:8080') {
        try {
            const playerId = this.auth.getCurrentUser()?.username || null;
            await this.network.connect(serverUrl, playerId);
            return true;
        } catch (error) {
            console.error('Failed to connect to multiplayer server:', error);
            this.showNetworkStatus('Failed to Connect', 'error');
            return false;
        }
    }
    
    disconnectFromMultiplayer() {
        this.network.disconnect();
    }
    
    sendPlayerUpdate() {
        if (this.network.isConnected) {
            this.network.sendPlayerMovement(
                { x: this.player.x, y: this.player.y },
                this.player.velocity,
                this.player.rotation
            );
        }
    }
    
    sendFireAction() {
        if (this.network.isConnected) {
            this.network.sendPlayerFire(
                { x: this.player.x, y: this.player.y },
                this.player.rotation,
                'laser'
            );
        }
    }
    
    handlePlayerJoin(data) {
        console.log(`Player ${data.playerId} joined the game`);
        
        // Generate a unique color for this player
        const playerColors = ['#ff6b35', '#f7931e', '#ffd700', '#32cd32', '#00ced1', '#9370db', '#ff69b4'];
        const colorIndex = Array.from(this.otherPlayers.keys()).length % playerColors.length;
        const playerColor = playerColors[colorIndex];
        
        // Create player data
        const playerData = {
            id: data.playerId,
            x: data.position?.x || 500,
            y: data.position?.y || 500,
            rotation: data.rotation || 0,
            color: playerColor,
            lastUpdate: Date.now()
        };
        
        // Create visual representation
        const playerShip = this.graphics.createOtherPlayerShip(
            playerData.x, 
            playerData.y, 
            data.playerId, 
            playerColor
        );
        
        // Add to game layer
        this.graphics.addToLayer('game', playerShip);
        
        // Store player data
        this.otherPlayers.set(data.playerId, playerData);
        
        console.log(`Added visual representation for player ${data.playerId}`);
    }
    
    handlePlayerLeave(data) {
        console.log(`Player ${data.playerId} left the game`);
        
        // Remove visual representation
        const playerElement = this.graphics.svg.querySelector(`#otherPlayer_${data.playerId}`);
        if (playerElement) {
            this.graphics.remove(playerElement);
            console.log(`Removed visual representation for player ${data.playerId}`);
        }
        
        // Remove from tracking
        this.otherPlayers.delete(data.playerId);
    }
    
    handlePlayerMove(data) {
        const player = this.otherPlayers.get(data.playerId);
        if (!player) return; // Player not tracked yet
        
        // Update player data
        player.x = data.position.x;
        player.y = data.position.y;
        player.rotation = data.rotation || player.rotation;
        player.lastUpdate = Date.now();
        
        // Update visual position
        const playerElement = this.graphics.svg.querySelector(`#otherPlayer_${data.playerId}`);
        if (playerElement) {
            playerElement.setAttribute('transform', 
                `translate(${player.x}, ${player.y}) rotate(${player.rotation})`);
        }
        
        console.log(`Updated player ${data.playerId} position to (${player.x}, ${player.y})`);
    }
    
    handlePlayerFire(data) {
        const player = this.otherPlayers.get(data.playerId);
        if (!player) return; // Player not tracked yet
        
        console.log(`Player ${data.playerId} fired weapon`);
        
        // Calculate laser position and direction for other player
        const rotationRad = player.rotation * Math.PI / 180;
        const laserStartX = player.x + Math.sin(rotationRad) * 20;
        const laserStartY = player.y - Math.cos(rotationRad) * 20;
        const laserEndX = player.x + Math.sin(rotationRad) * 400;
        const laserEndY = player.y - Math.cos(rotationRad) * 400;
        
        // Create laser beam for other player with different color
        const laser = this.graphics.createLaserBeam(
            laserStartX, laserStartY,
            laserEndX, laserEndY,
            {
                color: '#00ff88',
                glowColor: '#88ffaa',
                width: 3,
                duration: 300
            }
        );
        
        // Add laser to game layer
        this.graphics.addToLayer('game', laser);
        
        // Play distant laser sound (quieter)
        this.audio.playLaser(0.2);
    }
    
    handleChatMessage(data) {
        console.log(`Chat from ${data.playerId}: ${data.message}`);
        this.displayChatMessage(data.playerId, data.message);
    }
    
    displayChatMessage(playerId, message) {
        let chatContainer = document.getElementById('chat-container');
        if (!chatContainer) {
            chatContainer = this.createChatContainer();
        }
        
        const chatMessage = document.createElement('div');
        chatMessage.className = 'chat-message';
        chatMessage.innerHTML = `<span class="chat-player">${playerId}:</span> <span class="chat-text">${message}</span>`;
        
        chatContainer.appendChild(chatMessage);
        
        // Auto-scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        // Remove old messages if too many (keep last 50)
        const messages = chatContainer.querySelectorAll('.chat-message');
        if (messages.length > 50) {
            messages[0].remove();
        }
        
        // Fade out message after 10 seconds
        setTimeout(() => {
            chatMessage.classList.add('fade-out');
            setTimeout(() => {
                if (chatMessage.parentNode) {
                    chatMessage.remove();
                }
            }, 1000);
        }, 10000);
    }
    
    createChatContainer() {
        const chatContainer = document.createElement('div');
        chatContainer.id = 'chat-container';
        chatContainer.className = 'chat-container';
        
        // Add CSS styles for chat container
        const style = document.createElement('style');
        style.textContent = `
            .chat-container {
                position: absolute;
                bottom: 20px;
                left: 20px;
                width: 350px;
                height: 200px;
                background: rgba(0, 50, 100, 0.9);
                border: 1px solid #4488ff;
                border-radius: 8px;
                padding: 10px;
                overflow-y: auto;
                backdrop-filter: blur(5px);
                z-index: 100;
                font-family: 'Courier New', monospace;
                font-size: 13px;
            }
            
            .chat-message {
                margin-bottom: 8px;
                padding: 4px 8px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 4px;
                border-left: 3px solid #4488ff;
                opacity: 1;
                transition: opacity 1s ease-out;
            }
            
            .chat-message.fade-out {
                opacity: 0;
            }
            
            .chat-player {
                color: #88ccff;
                font-weight: bold;
            }
            
            .chat-text {
                color: #ffffff;
                word-wrap: break-word;
            }
            
            .chat-container::-webkit-scrollbar {
                width: 6px;
            }
            
            .chat-container::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
            }
            
            .chat-container::-webkit-scrollbar-thumb {
                background: #4488ff;
                border-radius: 3px;
            }
            
            .chat-container::-webkit-scrollbar-thumb:hover {
                background: #88ccff;
            }
        `;
        document.head.appendChild(style);
        
        document.getElementById('ui').appendChild(chatContainer);
        return chatContainer;
    }
    
    handleGameState(data) {
        // TODO: Update game state with server data
        console.log('Received game state update:', data);
    }
    
    showNetworkStatus(message, type = 'info') {
        // Create or update network status indicator
        let statusElement = document.getElementById('network-status');
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.id = 'network-status';
            statusElement.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 12px;
                font-family: monospace;
                z-index: 1000;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(statusElement);
        }
        
        // Set color based on status type
        const colors = {
            success: { bg: '#4CAF50', text: '#ffffff' },
            warning: { bg: '#FF9800', text: '#ffffff' },
            error: { bg: '#F44336', text: '#ffffff' },
            info: { bg: '#2196F3', text: '#ffffff' }
        };
        
        const color = colors[type] || colors.info;
        statusElement.style.backgroundColor = color.bg;
        statusElement.style.color = color.text;
        statusElement.textContent = message;
        statusElement.style.opacity = '1';
        
        // Auto-hide after 3 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                statusElement.style.opacity = '0.7';
            }, 3000);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.maxPixelsGame = new MaxPixelsGame();
});