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
import { RESOURCES, WEAPONS, PLAYER, UI, GRAPHICS } from './constants.js';

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
            lastEnergyRegenTime: Date.now(),
            heat: 0,
            lastHeatDissipationTime: Date.now(),
            isOverheated: false,
            overheatEndTime: 0,
            health: PLAYER.MAX_HEALTH,
            lastHealthRegenTime: Date.now(),
            lastDamageTime: 0,
            isInvincible: false,
            invincibilityEndTime: 0,
            isDead: false,
            respawnTime: 0,
            shield: PLAYER.MAX_SHIELD,
            lastShieldRegenTime: Date.now(),
            lastShieldBreakTime: 0,
            shieldsActive: false,
            lastShieldRechargeSound: 0
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
        this.weaponChargeIndicator = null;
        this.weaponHeatIndicator = null;
        
        // Server synchronization
        this.lastServerUpdate = null;
        
        // Pause/Menu system
        this.isPaused = false;
        this.pauseMenuElement = null;
        
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
            
            // Automatically connect to multiplayer server
            await this.connectToMultiplayer();
            
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
        
        // Create weapon charge indicator
        const initialChargeLevel = this.player.energy / WEAPONS.MAX_ENERGY;
        this.weaponChargeIndicator = this.graphics.createWeaponChargeIndicator(
            this.player.x, this.player.y, initialChargeLevel, {
                id: 'weaponChargeIndicator'
            }
        );
        this.graphics.addToLayer('game', this.weaponChargeIndicator);
        
        // Create weapon heat indicator
        const initialHeatLevel = this.player.heat / WEAPONS.MAX_HEAT;
        this.weaponHeatIndicator = this.graphics.createWeaponHeatIndicator(
            this.player.x, this.player.y + WEAPONS.HEAT_INDICATOR_OFFSET, initialHeatLevel, {
                id: 'weaponHeatIndicator'
            }
        );
        this.graphics.addToLayer('game', this.weaponHeatIndicator);
        
        // Create shield effect (initially hidden)
        this.shieldEffect = this.graphics.createShieldEffect(
            this.player.x, this.player.y, this.player.radius + 10, {
                id: 'playerShield'
            }
        );
        this.shieldEffect.style.display = 'none'; // Start hidden
        this.graphics.addToLayer('game', this.shieldEffect);
        
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
        
        // Load nebula background if sector has nebula types
        if (sector.nebulaTypes && sector.nebulaTypes.length > 0) {
            const nebulaBackground = this.graphics.createNebulaBackground(
                sector.bounds.width, 
                sector.bounds.height, 
                sector.nebulaTypes
            );
            this.graphics.addToLayer('background', nebulaBackground);
        }
        
        // Load stars
        const stars = this.graphics.createStarField(200);
        this.graphics.addToLayer('background', stars);
        
        // Load cosmic dust field if sector has dust density
        if (sector.dustDensity && sector.dustDensity > 0) {
            const dustField = this.graphics.createCosmicDustField(
                sector.bounds.width, 
                sector.bounds.height, 
                {
                    density: sector.dustDensity,
                    particleCount: 120
                }
            );
            this.graphics.addToLayer('background', dustField);
        }
        
        // Load space debris field if sector has debris density
        if (sector.debrisDensity && sector.debrisDensity > 0) {
            const debrisField = this.graphics.createSpaceDebrisField(
                sector.bounds.width, 
                sector.bounds.height, 
                {
                    density: sector.debrisDensity,
                    debrisCount: 10 + Math.floor(sector.bounds.width * sector.bounds.height / 200000)
                }
            );
            this.graphics.addToLayer('background', debrisField);
        }
        
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
        // Take damage from asteroid collision
        const damageTaken = this.takeDamage(PLAYER.ASTEROID_COLLISION_DAMAGE, 'asteroid');
        
        if (!damageTaken) {
            return; // No damage due to invincibility
        }
        
        // Create explosion particle effect at collision point
        this.particles.createExplosionEffect(asteroid.x, asteroid.y, {
            particleCount: 30,
            colors: ['#ff4444', '#ff8800', '#ffff00', '#ffffff', '#ffaa44'],
            velocity: { min: 60, max: 120 }
        });
        
        // Create sparks effect at player position
        this.particles.createSparksEffect(this.player.x, this.player.y);
            
        console.log('Collision with asteroid detected!');
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
        
        // Skip game updates when paused (but still process input for menu control)
        if (this.isPaused) {
            return;
        }
        
        this.updatePlayer();
        this.updateEnergy();
        this.updateHeat();
        this.updateHealth();
        this.updateShield();
        this.updateThrusterEffects();
        this.updateCamera();
        this.checkCollisions();
        this.checkStationProximity();
        this.checkJumpGateProximity();
        this.input.update();
    }
    
    handleInput() {
        // Handle menu/pause toggle first
        if (this.input.justPressed('menu')) {
            this.togglePause();
            return; // Don't process other inputs when toggling pause
        }
        
        // Skip input processing if game is paused
        if (this.isPaused) {
            return;
        }
        
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
        
        // Shield activation toggle
        if (this.input.justPressed(PLAYER.SHIELD_ACTIVATION_KEY)) {
            this.toggleShields();
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
            
        // Update weapon charge indicator position
        if (this.weaponChargeIndicator) {
            this.weaponChargeIndicator.setAttribute('transform', 
                `translate(${this.player.x}, ${this.player.y})`);
        }
        
        // Update weapon heat indicator position
        if (this.weaponHeatIndicator) {
            this.weaponHeatIndicator.setAttribute('transform', 
                `translate(${this.player.x}, ${this.player.y + WEAPONS.HEAT_INDICATOR_OFFSET})`);
        }
        
        // Update shield effect position
        if (this.shieldEffect) {
            this.shieldEffect.setAttribute('transform', 
                `translate(${this.player.x}, ${this.player.y})`);
        }
            
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
        
        // Update weapon charge indicator
        if (this.weaponChargeIndicator) {
            const chargeLevel = this.player.energy / WEAPONS.MAX_ENERGY;
            this.graphics.updateWeaponChargeIndicator(this.weaponChargeIndicator, chargeLevel);
        }
    }
    
    updateHeat() {
        const currentTime = Date.now();
        const deltaTime = (currentTime - this.player.lastHeatDissipationTime) / 1000;
        
        // Handle overheat cooldown
        if (this.player.isOverheated && currentTime > this.player.overheatEndTime) {
            this.player.isOverheated = false;
            console.log('Weapon cooling system restored');
        }
        
        // Dissipate heat over time
        if (this.player.heat > 0) {
            this.player.heat = Math.max(
                0,
                this.player.heat - (WEAPONS.HEAT_DISSIPATION_RATE * deltaTime)
            );
        }
        
        this.player.lastHeatDissipationTime = currentTime;
        
        // Update weapon heat indicator
        if (this.weaponHeatIndicator) {
            const heatLevel = this.player.heat / WEAPONS.MAX_HEAT;
            this.graphics.updateWeaponHeatIndicator(this.weaponHeatIndicator, heatLevel);
        }
    }
    
    updateHealth() {
        const currentTime = Date.now();
        
        // Handle invincibility
        if (this.player.isInvincible && currentTime > this.player.invincibilityEndTime) {
            this.player.isInvincible = false;
            this.removeInvincibilityEffect();
        }
        
        // Handle respawn after death
        if (this.player.isDead && currentTime > this.player.respawnTime) {
            this.respawnPlayer();
            return;
        }
        
        // Skip health regen if player is dead or recently damaged
        if (this.player.isDead || (currentTime - this.player.lastDamageTime) < PLAYER.HEALTH_REGEN_DELAY) {
            return;
        }
        
        const deltaTime = (currentTime - this.player.lastHealthRegenTime) / 1000;
        const previousHealth = this.player.health;
        
        // Regenerate health over time
        if (this.player.health < PLAYER.MAX_HEALTH) {
            this.player.health = Math.min(
                PLAYER.MAX_HEALTH,
                this.player.health + (PLAYER.HEALTH_REGEN_RATE * deltaTime)
            );
            
            // Visual feedback when health is fully restored
            if (previousHealth < PLAYER.MAX_HEALTH && this.player.health >= PLAYER.MAX_HEALTH) {
                this.showHealthRegenEffect();
                console.log('Health fully restored!');
            }
        }
        
        this.player.lastHealthRegenTime = currentTime;
    }
    
    updateShield() {
        const currentTime = Date.now();
        
        // Skip shield regen if shields broken recently
        if ((currentTime - this.player.lastShieldBreakTime) < PLAYER.SHIELD_REGEN_DELAY) {
            return;
        }
        
        const deltaTime = (currentTime - this.player.lastShieldRegenTime) / 1000;
        const previousShield = this.player.shield;
        
        // Regenerate shield over time
        if (this.player.shield < PLAYER.MAX_SHIELD) {
            this.player.shield = Math.min(
                PLAYER.MAX_SHIELD,
                this.player.shield + (PLAYER.SHIELD_REGEN_RATE * deltaTime)
            );
            
            // Visual feedback when shield is recharged
            if (previousShield < PLAYER.SHIELD_RECHARGE_COMPLETE_THRESHOLD && 
                this.player.shield >= PLAYER.SHIELD_RECHARGE_COMPLETE_THRESHOLD &&
                currentTime - this.player.lastShieldRechargeSound > 2000) { // Minimum 2 second cooldown
                
                this.audio.playWeaponRecharge(); // Reuse weapon recharge sound for now
                this.player.lastShieldRechargeSound = currentTime;
                this.showShieldRechargeEffect();
                console.log('Shields recharged!');
            }
        }
        
        this.player.lastShieldRegenTime = currentTime;
        
        // Auto-hide shields when fully depleted
        if (this.player.shield <= 0 && this.player.shieldsActive) {
            this.player.shieldsActive = false;
            this.hideShields();
        }
    }
    
    toggleShields() {
        if (this.player.shield <= 0) {
            console.log('Cannot activate shields - no shield energy!');
            return;
        }
        
        this.player.shieldsActive = !this.player.shieldsActive;
        
        if (this.player.shieldsActive) {
            this.showShields();
            console.log('Shields activated');
        } else {
            this.hideShields();
            console.log('Shields deactivated');
        }
    }
    
    showShields() {
        if (this.shieldEffect) {
            this.shieldEffect.style.display = 'block';
        }
    }
    
    hideShields() {
        if (this.shieldEffect) {
            this.shieldEffect.style.display = 'none';
        }
    }
    
    showShieldRechargeEffect() {
        // Create shield recharge particle effect
        this.particles.createEnergyRechargeEffect(this.player.x, this.player.y, {
            colors: ['#00aaff', '#44ccff', '#88eeff', '#aaccff', '#ffffff'],
            particleCount: 15,
            particleLife: 1500,
            velocity: { min: 25, max: 50 },
            size: { min: 2, max: 6 }
        });
    }
    
    takeDamage(amount, source = 'unknown') {
        if (this.player.isInvincible || this.player.isDead) {
            return false; // No damage taken
        }
        
        let damageToHealth = amount;
        let shieldDamage = 0;
        
        // Auto-activate shields if enabled and player takes damage
        if (PLAYER.SHIELD_AUTO_ACTIVATE && this.player.shield > 0 && !this.player.shieldsActive) {
            this.player.shieldsActive = true;
            this.showShields();
            console.log('Shields auto-activated!');
        }
        
        // Apply shield damage reduction if shields are active and have energy
        if (this.player.shieldsActive && this.player.shield > 0) {
            const shieldAbsorption = amount * PLAYER.SHIELD_DAMAGE_REDUCTION;
            shieldDamage = Math.min(shieldAbsorption, this.player.shield);
            damageToHealth = amount - shieldDamage;
            
            this.player.shield = Math.max(0, this.player.shield - shieldDamage);
            
            // Check if shields are broken
            if (this.player.shield <= 0) {
                this.player.shieldsActive = false;
                this.player.lastShieldBreakTime = Date.now();
                this.hideShields();
                this.showShieldBreakEffect();
                console.log('Shields broken!');
            }
        }
        
        // Apply remaining damage to health
        this.player.health -= damageToHealth;
        this.player.lastDamageTime = Date.now();
        
        // Visual and audio feedback
        if (shieldDamage > 0 && damageToHealth > 0) {
            // Both shield and health damage
            this.showShieldDamageEffect();
            this.showDamageEffect();
            this.camera.shake(15, 400);
        } else if (shieldDamage > 0) {
            // Only shield damage
            this.showShieldDamageEffect();
            this.camera.shake(10, 300);
        } else {
            // Only health damage
            this.showDamageEffect();
            this.camera.shake(20, 600);
        }
        
        this.audio.playCollision(0.9);
        
        console.log(`Player took ${Math.round(amount)} damage from ${source}. Shield: ${Math.round(this.player.shield)}/${PLAYER.MAX_SHIELD}, Health: ${Math.round(this.player.health)}/${PLAYER.MAX_HEALTH}`);
        
        if (this.player.health <= 0) {
            this.playerDeath();
            return true; // Fatal damage
        }
        
        // Grant temporary invincibility
        this.player.isInvincible = true;
        this.player.invincibilityEndTime = Date.now() + PLAYER.INVINCIBILITY_DURATION;
        this.showInvincibilityEffect();
        
        return true; // Damage taken
    }
    
    showShieldDamageEffect() {
        // Flash the shield effect briefly when taking shield damage
        if (this.shieldEffect && this.player.shieldsActive) {
            const originalOpacity = this.shieldEffect.style.opacity || '1';
            this.shieldEffect.style.opacity = '0.3';
            setTimeout(() => {
                this.shieldEffect.style.opacity = originalOpacity;
            }, 150);
        }
    }
    
    showShieldBreakEffect() {
        // Create shield break particle effect
        this.particles.createExplosionEffect(this.player.x, this.player.y, {
            particleCount: 20,
            colors: ['#00aaff', '#44ccff', '#88eeff', '#ffffff'],
            velocity: { min: 60, max: 120 }
        });
    }
    
    playerDeath() {
        this.player.health = 0;
        this.player.isDead = true;
        this.player.respawnTime = Date.now() + PLAYER.DEATH_RESPAWN_DELAY;
        this.player.velocity.x = 0;
        this.player.velocity.y = 0;
        
        console.log('Player died! Respawning in', PLAYER.DEATH_RESPAWN_DELAY / 1000, 'seconds...');
        
        // Create death explosion effect
        this.particles.createExplosionEffect(this.player.x, this.player.y, {
            particleCount: 50,
            colors: ['#ff0000', '#ff4444', '#ffaa00', '#ffffff', '#ff8800'],
            velocity: { min: 100, max: 200 }
        });
        
        // Hide player ship temporarily
        this.playerShip.style.opacity = '0';
        
        // Show death screen overlay
        this.showDeathScreen();
    }
    
    respawnPlayer() {
        this.player.health = PLAYER.MAX_HEALTH;
        this.player.energy = WEAPONS.MAX_ENERGY;
        this.player.heat = 0;
        this.player.isOverheated = false;
        this.player.isDead = false;
        this.player.shield = PLAYER.MAX_SHIELD;
        this.player.shieldsActive = false;
        this.player.x = PLAYER.SPAWN_X;
        this.player.y = PLAYER.SPAWN_Y;
        this.player.velocity.x = 0;
        this.player.velocity.y = 0;
        this.player.rotation = 0;
        
        // Grant spawn invincibility
        this.player.isInvincible = true;
        this.player.invincibilityEndTime = Date.now() + PLAYER.INVINCIBILITY_DURATION;
        
        // Update visual position
        this.playerShip.setAttribute('transform', 
            `translate(${this.player.x}, ${this.player.y}) rotate(${this.player.rotation})`);
        this.playerShip.style.opacity = '1';
        
        // Center camera on player
        this.camera.centerOn(this.player.x, this.player.y);
        
        // Visual effects
        this.showRespawnEffect();
        this.showInvincibilityEffect();
        
        // Hide death screen
        this.hideDeathScreen();
        
        console.log('Player respawned!');
    }
    
    showDamageEffect() {
        // Flash the player ship red briefly
        const shipPath = this.playerShip.querySelector('path');
        if (shipPath) {
            const originalColor = shipPath.getAttribute('fill') || '#4a90e2';
            shipPath.setAttribute('fill', '#ff4444');
            setTimeout(() => {
                shipPath.setAttribute('fill', originalColor);
            }, 200);
        }
    }
    
    showInvincibilityEffect() {
        // Make player ship blink during invincibility
        let blinkInterval = setInterval(() => {
            if (!this.player.isInvincible) {
                clearInterval(blinkInterval);
                this.playerShip.style.opacity = '1';
                return;
            }
            
            this.playerShip.style.opacity = this.playerShip.style.opacity === '0.4' ? '1' : '0.4';
        }, 200);
    }
    
    removeInvincibilityEffect() {
        this.playerShip.style.opacity = '1';
    }
    
    showHealthRegenEffect() {
        // Create a brief visual flash to indicate full health
        this.particles.createSparksEffect(this.player.x, this.player.y, {
            colors: ['#00ff00', '#44ff44', '#88ff88'],
            particleCount: 8
        });
    }
    
    showRespawnEffect() {
        // Create spawn-in effect
        this.particles.createSparksEffect(this.player.x, this.player.y, {
            colors: ['#00ffff', '#44ffff', '#88ffff', '#ffffff'],
            particleCount: 20
        });
    }
    
    showDeathScreen() {
        let deathScreen = document.getElementById('death-screen');
        if (!deathScreen) {
            deathScreen = document.createElement('div');
            deathScreen.id = 'death-screen';
            deathScreen.innerHTML = `
                <div class="death-content">
                    <h2>SHIP DESTROYED</h2>
                    <p>Respawning...</p>
                </div>
            `;
            deathScreen.style.cssText = `
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: rgba(255, 0, 0, 0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                pointer-events: none;
            `;
            
            const style = document.createElement('style');
            style.textContent = `
                .death-content {
                    text-align: center;
                    color: #ffffff;
                    font-family: 'Courier New', monospace;
                    text-shadow: 0 0 10px #ff0000;
                }
                .death-content h2 {
                    font-size: 3em;
                    margin: 0 0 20px 0;
                    color: #ff4444;
                }
                .death-content p {
                    font-size: 1.5em;
                    margin: 0;
                }
            `;
            document.head.appendChild(style);
            document.body.appendChild(deathScreen);
        }
        
        deathScreen.style.display = 'flex';
    }
    
    hideDeathScreen() {
        const deathScreen = document.getElementById('death-screen');
        if (deathScreen) {
            deathScreen.style.display = 'none';
        }
    }
    
    showEnergyRechargeEffect() {
        // Create a brief visual flash on the energy bar to indicate recharge
        const energyFill = document.getElementById('energy-fill');
        if (energyFill) {
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
        
        // Create enhanced particle effect around the player ship
        this.particles.createEnergyRechargeEffect(this.player.x, this.player.y, {
            colors: ['#00ffff', '#44ffff', '#88ffff', '#aaccff', '#ffffff'],
            particleCount: 12,
            particleLife: 1200,
            velocity: { min: 30, max: 60 },
            size: { min: 2, max: 5 }
        });
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
                <div class="hud-section health">
                    <h3>Health</h3>
                    <div>HP: <span id="player-health">100</span>/100</div>
                    <div class="health-bar">
                        <div id="health-fill" class="health-fill"></div>
                    </div>
                </div>
                <div class="hud-section energy">
                    <h3>Energy</h3>
                    <div>Level: <span id="player-energy">100</span>/100</div>
                    <div class="energy-bar">
                        <div id="energy-fill" class="energy-fill"></div>
                    </div>
                </div>
                <div class="hud-section heat">
                    <h3>Heat</h3>
                    <div>Level: <span id="player-heat">0</span>/100</div>
                    <div class="heat-bar">
                        <div id="heat-fill" class="heat-fill"></div>
                    </div>
                </div>
                <div class="hud-section shield">
                    <h3>Shield</h3>
                    <div>Level: <span id="player-shield">50</span>/50</div>
                    <div class="shield-bar">
                        <div id="shield-fill" class="shield-fill"></div>
                    </div>
                </div>
                <div class="hud-section inventory">
                    <h3>Inventory</h3>
                    <div>Iron: <span id="inventory-iron">0</span></div>
                    <div>Copper: <span id="inventory-copper">0</span></div>
                </div>
                <div class="hud-section navigation">
                    <h3>Navigation</h3>
                    <div>Sector: <span id="current-sector">Unknown</span></div>
                </div>
                <div class="hud-section controls">
                    <h3>Controls</h3>
                    <div>WASD / Arrow Keys: Move</div>
                    <div>Shift: Boost</div>
                    <div>Space: Fire Laser</div>
                    <div>G: Toggle Shields</div>
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
                <div class="hud-section radar">
                    <h3>Local Radar</h3>
                    <div class="radar-container">
                        <svg id="radar-display" width="${GRAPHICS.RADAR_DEFAULT_SIZE}" height="${GRAPHICS.RADAR_DEFAULT_SIZE}"></svg>
                    </div>
                </div>
                <div class="hud-section interaction" id="interaction-prompt" style="display: none;">
                    <h3>Station Nearby</h3>
                    <div id="interaction-text">Press F to Dock</div>
                    <div id="station-name"></div>
                </div>
            </div>
        `;
        
        this.uiContainer.insertAdjacentHTML('beforeend', hudHTML);
        this.initializeRadar();
    }
    
    initializeRadar() {
        const radarSvg = document.getElementById('radar-display');
        if (!radarSvg) return;
        
        // Create RadarEngine instance for the HUD radar display
        this.radarEngine = new GraphicsEngine(radarSvg);
        
        // Create the radar display at center of the SVG
        const centerX = GRAPHICS.RADAR_DEFAULT_SIZE / 2;
        const centerY = GRAPHICS.RADAR_DEFAULT_SIZE / 2;
        const radius = (GRAPHICS.RADAR_DEFAULT_SIZE / 2) - 5; // Leave small margin
        
        this.radar = this.radarEngine.createRadar(centerX, centerY, radius, {
            id: 'hud-radar',
            backgroundColor: '#001122',
            borderColor: '#00ff88',
            gridColor: '#004466',
            scanlineColor: '#00ff88'
        });
        
        this.radarEngine.addToLayer('ui', this.radar);
    }
    
    updateRadar() {
        if (!this.radar) return;
        
        // Clear existing blips
        const blipsContainer = this.radar.querySelector('#hud-radar_blips');
        if (!blipsContainer) return;
        
        blipsContainer.innerHTML = '';
        
        const centerX = GRAPHICS.RADAR_DEFAULT_SIZE / 2;
        const centerY = GRAPHICS.RADAR_DEFAULT_SIZE / 2;
        const radarRadius = (GRAPHICS.RADAR_DEFAULT_SIZE / 2) - 5;
        const range = GRAPHICS.RADAR_RANGE;
        
        // Show player in center as a blip
        const playerBlip = this.radarEngine.createCircle(centerX, centerY, GRAPHICS.RADAR_PLAYER_BLIP_SIZE, {
            fill: '#00ff88',
            opacity: 1,
            id: 'player-blip'
        });
        blipsContainer.appendChild(playerBlip);
        
        // Show nearby asteroids
        this.asteroids.forEach(asteroid => {
            const distance = Math.sqrt(
                Math.pow(asteroid.x - this.player.x, 2) + 
                Math.pow(asteroid.y - this.player.y, 2)
            );
            
            if (distance <= range) {
                // Calculate relative position on radar
                const relativeX = (asteroid.x - this.player.x) / range * radarRadius;
                const relativeY = (asteroid.y - this.player.y) / range * radarRadius;
                
                const blipX = centerX + relativeX;
                const blipY = centerY + relativeY;
                
                const asteroidBlip = this.radarEngine.createCircle(blipX, blipY, GRAPHICS.RADAR_ASTEROID_BLIP_SIZE, {
                    fill: '#cc8800',
                    opacity: 0.8
                });
                blipsContainer.appendChild(asteroidBlip);
            }
        });
        
        // Show nearby stations
        this.stations.forEach(station => {
            const distance = Math.sqrt(
                Math.pow(station.x - this.player.x, 2) + 
                Math.pow(station.y - this.player.y, 2)
            );
            
            if (distance <= range) {
                const relativeX = (station.x - this.player.x) / range * radarRadius;
                const relativeY = (station.y - this.player.y) / range * radarRadius;
                
                const blipX = centerX + relativeX;
                const blipY = centerY + relativeY;
                
                const stationBlip = this.radarEngine.createCircle(blipX, blipY, GRAPHICS.RADAR_STATION_BLIP_SIZE, {
                    fill: '#00aaff',
                    opacity: 1
                });
                blipsContainer.appendChild(stationBlip);
            }
        });
        
        // Show other players
        this.otherPlayers.forEach((playerData, playerId) => {
            const distance = Math.sqrt(
                Math.pow(playerData.x - this.player.x, 2) + 
                Math.pow(playerData.y - this.player.y, 2)
            );
            
            if (distance <= range) {
                const relativeX = (playerData.x - this.player.x) / range * radarRadius;
                const relativeY = (playerData.y - this.player.y) / range * radarRadius;
                
                const blipX = centerX + relativeX;
                const blipY = centerY + relativeY;
                
                const otherPlayerBlip = this.radarEngine.createCircle(blipX, blipY, GRAPHICS.RADAR_PLAYER_BLIP_SIZE, {
                    fill: playerData.color || '#ff6b35',
                    opacity: 0.9
                });
                blipsContainer.appendChild(otherPlayerBlip);
            }
        });
    }
    
    updateHUD() {
        document.getElementById('player-x').textContent = Math.round(this.player.x);
        document.getElementById('player-y').textContent = Math.round(this.player.y);
        
        const speed = Math.sqrt(
            this.player.velocity.x ** 2 + this.player.velocity.y ** 2
        ) * this.player.speed;
        document.getElementById('player-speed').textContent = Math.round(speed);
        
        // Update health display
        const healthLevel = Math.round(this.player.health);
        const healthPercentage = (this.player.health / PLAYER.MAX_HEALTH) * 100;
        document.getElementById('player-health').textContent = healthLevel;
        
        const healthFill = document.getElementById('health-fill');
        if (healthFill) {
            healthFill.style.width = healthPercentage + '%';
            // Change color based on health level
            if (this.player.health <= PLAYER.CRITICAL_HEALTH_THRESHOLD) {
                healthFill.style.backgroundColor = '#ff0000';
                healthFill.style.boxShadow = '0 0 8px #ff0000'; // Critical health glow
            } else if (this.player.health <= PLAYER.LOW_HEALTH_THRESHOLD) {
                healthFill.style.backgroundColor = '#ff4444';
                healthFill.style.boxShadow = '0 0 4px #ff4444'; // Low health glow
            } else if (this.player.health < PLAYER.MAX_HEALTH * 0.5) {
                healthFill.style.backgroundColor = '#ffaa44';
                healthFill.style.boxShadow = '';
            } else {
                healthFill.style.backgroundColor = '#44ff44';
                healthFill.style.boxShadow = '';
            }
        }
        
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
        
        // Update heat display
        const heatLevel = Math.round(this.player.heat);
        const heatPercentage = (this.player.heat / WEAPONS.MAX_HEAT) * 100;
        document.getElementById('player-heat').textContent = heatLevel;
        
        const heatFill = document.getElementById('heat-fill');
        if (heatFill) {
            heatFill.style.width = heatPercentage + '%';
            // Change color based on heat level with smooth gradient
            if (this.player.heat < WEAPONS.MAX_HEAT * 0.5) {
                // Green to Yellow (0-50% heat)
                const t = (this.player.heat / WEAPONS.MAX_HEAT) * 2;
                const r = Math.floor(255 * t);
                heatFill.style.backgroundColor = `rgb(${r}, 255, 0)`;
                heatFill.style.boxShadow = '';
            } else if (this.player.heat < WEAPONS.HEAT_WARNING_THRESHOLD) {
                // Yellow to Orange (50-70% heat)
                const t = ((this.player.heat / WEAPONS.MAX_HEAT) - 0.5) * 2.5;
                const g = Math.floor(255 * (1 - t * 0.5));
                heatFill.style.backgroundColor = `rgb(255, ${g}, 0)`;
                heatFill.style.boxShadow = '';
            } else {
                // Red with warning glow (70%+ heat)
                heatFill.style.backgroundColor = '#ff0000';
                if (this.player.isOverheated) {
                    heatFill.style.boxShadow = '0 0 12px #ff0000';
                } else {
                    heatFill.style.boxShadow = '0 0 6px #ff4444';
                }
            }
        }
        
        // Update shield display
        const shieldLevel = Math.round(this.player.shield);
        const shieldPercentage = (this.player.shield / PLAYER.MAX_SHIELD) * 100;
        document.getElementById('player-shield').textContent = shieldLevel;
        
        const shieldFill = document.getElementById('shield-fill');
        if (shieldFill) {
            shieldFill.style.width = shieldPercentage + '%';
            // Change color based on shield level
            if (this.player.shield <= PLAYER.LOW_SHIELD_THRESHOLD) {
                shieldFill.style.backgroundColor = '#ff4444';
                shieldFill.style.boxShadow = '0 0 6px #ff4444';
            } else if (this.player.shield < PLAYER.MAX_SHIELD * 0.5) {
                shieldFill.style.backgroundColor = '#ffaa44';
                shieldFill.style.boxShadow = '';
            } else {
                shieldFill.style.backgroundColor = '#00aaff';
                shieldFill.style.boxShadow = this.player.shieldsActive ? '0 0 8px #00aaff' : '';
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
        
        // Update navigation display
        const currentSector = this.navigation.getCurrentSector();
        const sectorElement = document.getElementById('current-sector');
        if (sectorElement) {
            sectorElement.textContent = currentSector ? currentSector.name : 'Unknown';
        }
        
        // Update radar display
        this.updateRadar();
    }
    
    fireLaser() {
        const currentTime = Date.now();
        if (currentTime - this.lastFireTime < WEAPONS.LASER_FIRE_RATE) {
            return;
        }
        
        // Check if weapon is overheated
        if (this.player.isOverheated) {
            console.log('Weapon overheated! Cooling down...');
            return;
        }
        
        // Check if player has enough energy
        if (this.player.energy < WEAPONS.ENERGY_COST) {
            console.log('Insufficient energy to fire laser!');
            return;
        }
        
        // Consume energy and generate heat
        this.player.energy -= WEAPONS.ENERGY_COST;
        this.player.heat += WEAPONS.HEAT_PER_SHOT;
        
        // Check for overheat
        if (this.player.heat >= WEAPONS.OVERHEAT_THRESHOLD) {
            this.player.isOverheated = true;
            this.player.overheatEndTime = currentTime + WEAPONS.COOLDOWN_DURATION;
            console.log('Weapon overheated! Forced cooldown initiated.');
        }
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
        
        // Update weapon charge indicator immediately after energy consumption
        if (this.weaponChargeIndicator) {
            const chargeLevel = this.player.energy / WEAPONS.MAX_ENERGY;
            this.graphics.updateWeaponChargeIndicator(this.weaponChargeIndicator, chargeLevel);
        }
        
        // Update weapon heat indicator immediately after heat generation
        if (this.weaponHeatIndicator) {
            const heatLevel = this.player.heat / WEAPONS.MAX_HEAT;
            this.graphics.updateWeaponHeatIndicator(this.weaponHeatIndicator, heatLevel);
        }
        
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
                
                // Create damage indicator ring around asteroid
                const damageIndicator = this.graphics.createAsteroidDamageIndicator(asteroid.x, asteroid.y, asteroid.size, {
                    ringColor: '#ff6644',
                    ringOpacity: 0.9,
                    duration: '2.0s',
                    ringWidth: 2
                });
                this.graphics.addToLayer('game', damageIndicator);
                
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
        if (!data || typeof data !== 'object') {
            console.warn('Invalid game state data received:', data);
            return;
        }
        
        console.log('Received game state update:', data);
        
        // Update other players if provided
        if (data.players && typeof data.players === 'object') {
            this.updateOtherPlayersFromState(data.players);
        }
        
        // Update game objects (asteroids, stations, etc.) if provided
        if (data.gameObjects && Array.isArray(data.gameObjects)) {
            this.updateGameObjectsFromState(data.gameObjects);
        }
        
        // Track last server update time for synchronization
        if (data.lastUpdate) {
            this.lastServerUpdate = data.lastUpdate;
            console.log(`Game state synced with server (timestamp: ${data.lastUpdate})`);
        }
    }
    
    updateOtherPlayersFromState(serverPlayers) {
        // Convert server players object/map to usable format
        let players;
        if (serverPlayers instanceof Map) {
            players = serverPlayers;
        } else if (typeof serverPlayers === 'object') {
            // Handle plain object format
            players = new Map(Object.entries(serverPlayers));
        } else {
            console.warn('Invalid players data format:', serverPlayers);
            return;
        }
        
        // Remove players who are no longer on the server
        for (const [playerId, playerData] of this.otherPlayers.entries()) {
            if (!players.has(playerId)) {
                this.handlePlayerLeave({ playerId });
            }
        }
        
        // Add or update players from server state
        for (const [playerId, serverPlayer] of players.entries()) {
            // Skip our own player
            if (playerId === this.network.playerId) {
                continue;
            }
            
            const existingPlayer = this.otherPlayers.get(playerId);
            if (existingPlayer) {
                // Update existing player
                this.handlePlayerMove({
                    playerId,
                    position: serverPlayer.position || { x: serverPlayer.x, y: serverPlayer.y },
                    rotation: serverPlayer.rotation || 0
                });
            } else {
                // Add new player
                this.handlePlayerJoin({
                    playerId,
                    position: serverPlayer.position || { x: serverPlayer.x, y: serverPlayer.y },
                    rotation: serverPlayer.rotation || 0
                });
            }
        }
    }
    
    updateGameObjectsFromState(gameObjects) {
        console.log(`Received ${gameObjects.length} game objects from server:`, gameObjects);
        
        if (!Array.isArray(gameObjects)) {
            console.warn('Invalid gameObjects data received');
            return;
        }

        // Group received objects by type
        const receivedAsteroids = gameObjects.filter(obj => obj.type === 'asteroid');
        const receivedStations = gameObjects.filter(obj => obj.type === 'station');

        // Synchronize asteroids
        this.synchronizeAsteroids(receivedAsteroids);
        
        // Synchronize stations
        this.synchronizeStations(receivedStations);
    }

    synchronizeAsteroids(serverAsteroids) {
        const gameLayer = this.graphics.getLayer('background');
        if (!gameLayer) return;

        // Create a set of server asteroid IDs for quick lookup
        const serverAsteroidIds = new Set(serverAsteroids.map(ast => ast.id));
        
        // Remove local asteroids that don't exist on server
        this.asteroids = this.asteroids.filter(localAsteroid => {
            if (!serverAsteroidIds.has(localAsteroid.id)) {
                // Remove asteroid visual element
                const asteroidElement = gameLayer.querySelector(`#${localAsteroid.id}`);
                if (asteroidElement) {
                    gameLayer.removeChild(asteroidElement);
                }
                console.log(`Removed asteroid ${localAsteroid.id} (deleted on server)`);
                return false;
            }
            return true;
        });

        // Add or update asteroids from server
        serverAsteroids.forEach(serverAsteroid => {
            const existingIndex = this.asteroids.findIndex(ast => ast.id === serverAsteroid.id);
            
            if (existingIndex >= 0) {
                // Update existing asteroid position/size if changed
                const localAsteroid = this.asteroids[existingIndex];
                if (localAsteroid.x !== serverAsteroid.x || 
                    localAsteroid.y !== serverAsteroid.y || 
                    localAsteroid.size !== serverAsteroid.size) {
                    
                    // Update local data
                    this.asteroids[existingIndex] = { ...serverAsteroid };
                    
                    // Update visual element
                    const asteroidElement = gameLayer.querySelector(`#${serverAsteroid.id}`);
                    if (asteroidElement) {
                        asteroidElement.setAttribute('transform', `translate(${serverAsteroid.x}, ${serverAsteroid.y})`);
                        // Note: size changes would require recreating the element
                    }
                }
            } else {
                // Add new asteroid
                this.asteroids.push({ ...serverAsteroid });
                
                // Create visual element
                const asteroidElement = this.graphics.createAsteroid(
                    serverAsteroid.x, 
                    serverAsteroid.y, 
                    serverAsteroid.size, 
                    { id: serverAsteroid.id }
                );
                this.graphics.addToLayer('background', asteroidElement);
                console.log(`Added new asteroid ${serverAsteroid.id} from server`);
            }
        });
    }

    synchronizeStations(serverStations) {
        const gameLayer = this.graphics.getLayer('game');
        if (!gameLayer) return;

        // Create a set of server station IDs for quick lookup
        const serverStationIds = new Set(serverStations.map(station => station.id));
        
        // Remove local stations that don't exist on server
        this.stations = this.stations.filter(localStation => {
            if (!serverStationIds.has(localStation.id)) {
                // Remove station visual element
                const stationElement = gameLayer.querySelector(`#${localStation.id}`);
                if (stationElement) {
                    gameLayer.removeChild(stationElement);
                }
                console.log(`Removed station ${localStation.id} (deleted on server)`);
                return false;
            }
            return true;
        });

        // Add or update stations from server
        serverStations.forEach(serverStation => {
            const existingIndex = this.stations.findIndex(station => station.id === serverStation.id);
            
            if (existingIndex >= 0) {
                // Update existing station data if changed
                const localStation = this.stations[existingIndex];
                if (localStation.x !== serverStation.x || 
                    localStation.y !== serverStation.y) {
                    
                    // Update local data
                    this.stations[existingIndex] = { ...serverStation };
                    
                    // Update visual element position
                    const stationElement = gameLayer.querySelector(`#${serverStation.id}`);
                    if (stationElement) {
                        stationElement.setAttribute('transform', `translate(${serverStation.x}, ${serverStation.y})`);
                    }
                }
            } else {
                // Add new station
                this.stations.push({ ...serverStation });
                
                // Create visual element
                const stationElement = this.graphics.createSpaceStation(
                    serverStation.x, 
                    serverStation.y, 
                    serverStation.radius || 40, 
                    { id: serverStation.id }
                );
                this.graphics.addToLayer('game', stationElement);
                console.log(`Added new station ${serverStation.id} from server`);
            }
        });
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
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.showPauseMenu();
            console.log('Game paused');
        } else {
            this.hidePauseMenu();
            console.log('Game resumed');
        }
    }
    
    showPauseMenu() {
        if (this.pauseMenuElement) {
            this.pauseMenuElement.style.display = 'flex';
            return;
        }
        
        this.pauseMenuElement = document.createElement('div');
        this.pauseMenuElement.id = 'pause-menu';
        this.pauseMenuElement.innerHTML = `
            <div class="pause-menu-content">
                <h2>GAME PAUSED</h2>
                <div class="pause-menu-section">
                    <h3>Controls</h3>
                    <div class="controls-list">
                        <div><span class="key">WASD / Arrow Keys</span> Move</div>
                        <div><span class="key">Shift</span> Boost</div>
                        <div><span class="key">Space</span> Fire Laser</div>
                        <div><span class="key">F</span> Interact / Dock / Jump</div>
                        <div><span class="key">Q / E</span> Zoom Out / In</div>
                        <div><span class="key">Escape</span> Pause Menu</div>
                    </div>
                </div>
                <div class="pause-menu-section">
                    <h3>Options</h3>
                    <div class="options-list">
                        <button id="toggle-audio" class="menu-button">
                            Audio: ${this.audio && this.audio.enabled ? 'ON' : 'OFF'}
                        </button>
                        <button id="resume-game" class="menu-button primary">Resume Game</button>
                    </div>
                </div>
                <div class="pause-menu-section">
                    <h3>Status</h3>
                    <div class="status-info">
                        <div>Health: <span class="status-value">${Math.round(this.player.health)}/${PLAYER.MAX_HEALTH}</span></div>
                        <div>Energy: <span class="status-value">${Math.round(this.player.energy)}/${WEAPONS.MAX_ENERGY}</span></div>
                        <div>Heat: <span class="status-value">${Math.round(this.player.heat)}/${WEAPONS.MAX_HEAT}${this.player.isOverheated ? ' (OVERHEAT)' : ''}</span></div>
                        <div>Sector: <span class="status-value">${this.navigation.getCurrentSector()?.name || 'Unknown'}</span></div>
                        <div>Network: <span class="status-value">${this.network.isConnected ? 'Connected' : 'Offline'}</span></div>
                    </div>
                </div>
                <div class="pause-footer">
                    <p>Press <span class="key">Escape</span> to resume</p>
                </div>
            </div>
        `;
        
        this.pauseMenuElement.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0, 20, 40, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            font-family: 'Courier New', monospace;
            backdrop-filter: blur(10px);
        `;
        
        // Add CSS styles for the pause menu
        const style = document.createElement('style');
        style.textContent = `
            .pause-menu-content {
                background: rgba(0, 50, 100, 0.9);
                border: 2px solid #4488ff;
                border-radius: 12px;
                padding: 30px;
                max-width: 500px;
                width: 90%;
                max-height: 80%;
                overflow-y: auto;
                text-align: center;
                box-shadow: 0 0 30px rgba(68, 136, 255, 0.3);
            }
            
            .pause-menu-content h2 {
                color: #ffffff;
                font-size: 2.5em;
                margin: 0 0 30px 0;
                text-shadow: 0 0 10px #4488ff;
            }
            
            .pause-menu-section {
                margin-bottom: 25px;
                text-align: left;
            }
            
            .pause-menu-section h3 {
                color: #88ccff;
                font-size: 1.4em;
                margin: 0 0 15px 0;
                border-bottom: 1px solid #4488ff;
                padding-bottom: 5px;
            }
            
            .controls-list > div, .status-info > div {
                color: #ffffff;
                margin: 8px 0;
                padding: 5px 0;
                font-size: 1.1em;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .key {
                background: #4488ff;
                color: #ffffff;
                padding: 3px 8px;
                border-radius: 4px;
                font-weight: bold;
                min-width: 120px;
                text-align: center;
                display: inline-block;
                margin-right: 10px;
            }
            
            .status-value {
                color: #88ccff;
                font-weight: bold;
            }
            
            .menu-button {
                background: rgba(68, 136, 255, 0.3);
                border: 1px solid #4488ff;
                color: #ffffff;
                padding: 10px 20px;
                margin: 5px;
                border-radius: 6px;
                font-family: 'Courier New', monospace;
                font-size: 1em;
                cursor: pointer;
                transition: all 0.2s ease;
                min-width: 150px;
            }
            
            .menu-button:hover {
                background: rgba(68, 136, 255, 0.5);
                box-shadow: 0 0 8px rgba(68, 136, 255, 0.4);
            }
            
            .menu-button.primary {
                background: #4488ff;
            }
            
            .menu-button.primary:hover {
                background: #88ccff;
                color: #002244;
            }
            
            .options-list {
                text-align: center;
            }
            
            .pause-footer {
                margin-top: 20px;
                padding-top: 15px;
                border-top: 1px solid #4488ff;
                color: #88ccff;
                font-size: 0.9em;
            }
        `;
        
        if (!document.querySelector('#pause-menu-styles')) {
            style.id = 'pause-menu-styles';
            document.head.appendChild(style);
        }
        
        document.body.appendChild(this.pauseMenuElement);
        
        // Set up event listeners
        const resumeButton = this.pauseMenuElement.querySelector('#resume-game');
        const audioButton = this.pauseMenuElement.querySelector('#toggle-audio');
        
        resumeButton.addEventListener('click', () => {
            this.togglePause();
        });
        
        audioButton.addEventListener('click', () => {
            if (this.audio.enabled) {
                this.audio.disable();
                audioButton.textContent = 'Audio: OFF';
            } else {
                this.audio.enable();
                audioButton.textContent = 'Audio: ON';
            }
        });
    }
    
    hidePauseMenu() {
        if (this.pauseMenuElement) {
            this.pauseMenuElement.style.display = 'none';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.maxPixelsGame = new MaxPixelsGame();
});