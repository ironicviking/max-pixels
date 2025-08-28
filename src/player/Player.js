/**
 * Player - Core player state and ship management
 * Handles player ship properties, position, inventory, and stats
 */

import { IDGenerator } from '../utils/IDGenerator.js';
import { PLAYER, WEAPONS } from '../constants.js';

export class Player {
    constructor(username, spawnPosition = { x: PLAYER.SPAWN_X, y: PLAYER.SPAWN_Y }) {
        // Player identity
        this.id = IDGenerator.generate();
        this.username = username;
        this.sessionToken = null;
        
        // Ship state
        this.position = { ...spawnPosition };
        this.velocity = { x: 0, y: 0 };
        this.rotation = 0; // Ship facing direction in radians
        this.rotationSpeed = 0;
        
        // Health and shields
        this.health = PLAYER.MAX_HEALTH;
        this.maxHealth = PLAYER.MAX_HEALTH;
        this.shield = PLAYER.MAX_SHIELD;
        this.maxShield = PLAYER.MAX_SHIELD;
        this.isAlive = true;
        this.lastDamageTime = 0;
        this.invincibilityEndTime = 0;
        
        // Energy and weapons
        this.energy = WEAPONS.MAX_ENERGY;
        this.maxEnergy = WEAPONS.MAX_ENERGY;
        this.weaponHeat = 0;
        this.maxWeaponHeat = WEAPONS.MAX_HEAT;
        this.weaponOverheated = false;
        this.lastShotTime = 0;
        
        // Movement and controls
        this.thrust = 0; // 0-1 thrust level
        this.boosting = false;
        this.shieldsActive = false;
        this.lastThrustTime = 0;
        
        // Trading and resources
        this.credits = 1000; // Starting credits
        this.inventory = new Map(); // resource_type -> quantity
        this.cargoCapacity = 100;
        this.currentCargo = 0;
        
        // Ship upgrades and properties
        this.shipType = 'basic_fighter';
        this.shipSize = PLAYER.RADIUS;
        this.speed = PLAYER.SPEED;
        this.thrusterEfficiency = 1.0;
        this.weaponDamage = 1.0;
        this.armorRating = 1.0;
        
        // Current system and location
        this.currentSystem = null;
        this.lastKnownPosition = { ...spawnPosition };
        this.nearestStation = null;
        this.nearestJumpGate = null;
        
        // Statistics
        this.stats = {
            totalDistanceTraveled: 0,
            systemsVisited: new Set(),
            successfulTrades: 0,
            totalCreditsEarned: 0,
            asteroidsDestroyed: 0,
            timePlayed: 0,
            deathCount: 0
        };
        
        // Multiplayer sync
        this.lastUpdateTime = Date.now();
        this.dirtyState = true; // Needs network sync
    }
    
    // === Movement and Physics ===
    
    update(deltaTime) {
        const now = Date.now();
        
        // Update ship physics
        this.updateMovement(deltaTime);
        
        // Regenerate health if not recently damaged
        this.regenerateHealth(deltaTime);
        
        // Regenerate shields
        this.regenerateShields(deltaTime);
        
        // Regenerate energy
        this.regenerateEnergy(deltaTime);
        
        // Cool down weapons
        this.cooldownWeapons(deltaTime);
        
        // Update statistics
        this.updateStatistics(deltaTime);
        
        // Check invincibility
        if (now > this.invincibilityEndTime) {
            this.invincibilityEndTime = 0;
        }
        
        // Check if weapon overheating should end
        if (this.weaponOverheated && now > this.lastShotTime + WEAPONS.COOLDOWN_DURATION) {
            this.weaponOverheated = false;
        }
        
        this.lastUpdateTime = now;
        this.dirtyState = true;
    }
    
    updateMovement(deltaTime) {
        // Apply rotation
        this.rotation += this.rotationSpeed * deltaTime;
        
        // Apply thrust
        if (this.thrust > 0) {
            const thrustForce = this.thrust * this.speed * this.thrusterEfficiency * deltaTime;
            const thrustX = Math.cos(this.rotation) * thrustForce;
            const thrustY = Math.sin(this.rotation) * thrustForce;
            
            this.velocity.x += thrustX;
            this.velocity.y += thrustY;
            
            this.lastThrustTime = Date.now();
        }
        
        // Apply boost multiplier if boosting
        const speedMultiplier = this.boosting ? PLAYER.BOOST_MULTIPLIER : 1;
        
        // Update position
        this.lastKnownPosition = { ...this.position };
        this.position.x += this.velocity.x * speedMultiplier * deltaTime;
        this.position.y += this.velocity.y * speedMultiplier * deltaTime;
        
        // Calculate distance traveled
        const distance = Math.sqrt(
            Math.pow(this.position.x - this.lastKnownPosition.x, 2) +
            Math.pow(this.position.y - this.lastKnownPosition.y, 2)
        );
        this.stats.totalDistanceTraveled += distance;
        
        // Apply drag (space friction for gameplay)
        const drag = 0.98;
        this.velocity.x *= drag;
        this.velocity.y *= drag;
    }
    
    setThrust(level) {
        this.thrust = Math.max(0, Math.min(1, level));
        this.dirtyState = true;
    }
    
    setRotation(angularVelocity) {
        this.rotationSpeed = angularVelocity;
        this.dirtyState = true;
    }
    
    activateBoost(active) {
        this.boosting = active;
        this.dirtyState = true;
    }
    
    // === Combat and Health ===
    
    takeDamage(amount, ignoreShields = false) {
        if (!this.isAlive || this.isInvincible()) {
            return false;
        }
        
        let actualDamage = amount;
        
        // Shield absorption
        if (!ignoreShields && this.shield > 0) {
            const shieldAbsorption = actualDamage * PLAYER.SHIELD_DAMAGE_REDUCTION;
            const shieldDamage = Math.min(this.shield, shieldAbsorption);
            
            this.shield -= shieldDamage;
            actualDamage -= shieldDamage;
            
            if (this.shield <= 0) {
                this.shield = 0;
                this.shieldsActive = false;
            }
        }
        
        // Apply remaining damage to health
        if (actualDamage > 0) {
            actualDamage *= (1 / this.armorRating); // Armor reduces damage
            this.health -= actualDamage;
            this.lastDamageTime = Date.now();
            
            // Auto-activate shields if available
            if (PLAYER.SHIELD_AUTO_ACTIVATE && this.shield > 0) {
                this.shieldsActive = true;
            }
        }
        
        // Check for death
        if (this.health <= 0) {
            this.die();
        }
        
        this.dirtyState = true;
        return true;
    }
    
    die() {
        this.isAlive = false;
        this.health = 0;
        this.stats.deathCount++;
        
        // Schedule respawn
        setTimeout(() => {
            this.respawn();
        }, PLAYER.DEATH_RESPAWN_DELAY);
        
        this.dirtyState = true;
    }
    
    respawn() {
        this.isAlive = true;
        this.health = this.maxHealth;
        this.shield = this.maxShield;
        this.energy = this.maxEnergy;
        
        // Reset to spawn position (or nearest station)
        this.position = { x: PLAYER.SPAWN_X, y: PLAYER.SPAWN_Y };
        this.velocity = { x: 0, y: 0 };
        
        // Grant invincibility
        this.invincibilityEndTime = Date.now() + PLAYER.INVINCIBILITY_DURATION;
        
        this.dirtyState = true;
    }
    
    heal(amount) {
        if (!this.isAlive) return;
        
        this.health = Math.min(this.maxHealth, this.health + amount);
        this.dirtyState = true;
    }
    
    regenerateHealth(deltaTime) {
        if (!this.isAlive) return;
        
        const timeSinceLastDamage = Date.now() - this.lastDamageTime;
        if (timeSinceLastDamage >= PLAYER.HEALTH_REGEN_DELAY && this.health < this.maxHealth) {
            const regenAmount = PLAYER.HEALTH_REGEN_RATE * deltaTime;
            this.health = Math.min(this.maxHealth, this.health + regenAmount);
            this.dirtyState = true;
        }
    }
    
    regenerateShields(deltaTime) {
        if (!this.isAlive || this.shield >= this.maxShield) return;
        
        const timeSinceShieldBreak = Date.now() - this.lastDamageTime;
        if (timeSinceShieldBreak >= PLAYER.SHIELD_REGEN_DELAY) {
            const regenAmount = PLAYER.SHIELD_REGEN_RATE * deltaTime;
            this.shield = Math.min(this.maxShield, this.shield + regenAmount);
            this.dirtyState = true;
        }
    }
    
    toggleShields() {
        if (this.shield > 0) {
            this.shieldsActive = !this.shieldsActive;
            this.dirtyState = true;
        }
    }
    
    isInvincible() {
        return Date.now() < this.invincibilityEndTime;
    }
    
    // === Weapons and Energy ===
    
    canFireWeapon() {
        const now = Date.now();
        return this.isAlive && 
               !this.weaponOverheated && 
               this.energy >= WEAPONS.ENERGY_COST &&
               (now - this.lastShotTime) >= WEAPONS.LASER_FIRE_RATE;
    }
    
    fireWeapon() {
        if (!this.canFireWeapon()) {
            return false;
        }
        
        // Consume energy
        this.energy -= WEAPONS.ENERGY_COST;
        
        // Generate heat
        this.weaponHeat += WEAPONS.HEAT_PER_SHOT;
        if (this.weaponHeat >= WEAPONS.OVERHEAT_THRESHOLD) {
            this.weaponOverheated = true;
        }
        
        this.lastShotTime = Date.now();
        this.dirtyState = true;
        return true;
    }
    
    regenerateEnergy(deltaTime) {
        if (this.energy < this.maxEnergy) {
            const regenAmount = WEAPONS.ENERGY_REGEN_RATE * deltaTime;
            this.energy = Math.min(this.maxEnergy, this.energy + regenAmount);
            this.dirtyState = true;
        }
    }
    
    cooldownWeapons(deltaTime) {
        if (this.weaponHeat > 0) {
            const cooldownAmount = WEAPONS.HEAT_DISSIPATION_RATE * deltaTime;
            this.weaponHeat = Math.max(0, this.weaponHeat - cooldownAmount);
            
            if (this.weaponHeat < WEAPONS.OVERHEAT_THRESHOLD && this.weaponOverheated) {
                this.weaponOverheated = false;
            }
            
            this.dirtyState = true;
        }
    }
    
    // === Trading and Inventory ===
    
    addCredits(amount) {
        this.credits += amount;
        this.stats.totalCreditsEarned += Math.max(0, amount);
        this.dirtyState = true;
    }
    
    spendCredits(amount) {
        if (this.credits >= amount) {
            this.credits -= amount;
            this.dirtyState = true;
            return true;
        }
        return false;
    }
    
    addResource(resourceType, quantity) {
        if (this.getCurrentCargoUsed() + quantity > this.cargoCapacity) {
            return false; // Not enough cargo space
        }
        
        const current = this.inventory.get(resourceType) || 0;
        this.inventory.set(resourceType, current + quantity);
        this.currentCargo = this.getCurrentCargoUsed();
        this.dirtyState = true;
        return true;
    }
    
    removeResource(resourceType, quantity) {
        const current = this.inventory.get(resourceType) || 0;
        if (current >= quantity) {
            const newAmount = current - quantity;
            if (newAmount === 0) {
                this.inventory.delete(resourceType);
            } else {
                this.inventory.set(resourceType, newAmount);
            }
            this.currentCargo = this.getCurrentCargoUsed();
            this.dirtyState = true;
            return true;
        }
        return false;
    }
    
    getResource(resourceType) {
        return this.inventory.get(resourceType) || 0;
    }
    
    getCurrentCargoUsed() {
        let total = 0;
        for (const quantity of this.inventory.values()) {
            total += quantity;
        }
        return total;
    }
    
    getCargoSpaceRemaining() {
        return this.cargoCapacity - this.getCurrentCargoUsed();
    }
    
    // === System Navigation ===
    
    setCurrentSystem(starSystem) {
        if (this.currentSystem !== starSystem) {
            this.stats.systemsVisited.add(starSystem.id);
        }
        this.currentSystem = starSystem;
        this.dirtyState = true;
    }
    
    findNearbyObjects() {
        if (!this.currentSystem) return null;
        
        const range = PLAYER.INTERACTION_RANGE;
        
        // Find nearest station
        this.nearestStation = this.currentSystem.findNearestStation(
            this.position.x, 
            this.position.y, 
            range
        );
        
        // Find nearest jump gate
        this.nearestJumpGate = this.currentSystem.findNearestJumpGate(
            this.position.x, 
            this.position.y, 
            range
        );
        
        return {
            station: this.nearestStation,
            jumpGate: this.nearestJumpGate
        };
    }
    
    canInteractWithStation() {
        return this.nearestStation !== null && this.isAlive;
    }
    
    canUseJumpGate() {
        return this.nearestJumpGate !== null && 
               this.nearestJumpGate.isActive && 
               this.isAlive &&
               this.energy >= this.nearestJumpGate.energyCost;
    }
    
    // === Ship Upgrades ===
    
    upgradeShip(upgradeType, cost) {
        if (!this.spendCredits(cost)) {
            return false;
        }
        
        switch (upgradeType) {
        case 'engine':
            this.thrusterEfficiency *= PLAYER.ENGINE_EFFICIENCY_UPGRADE;
            this.speed *= PLAYER.ENGINE_SPEED_UPGRADE;
            break;
        case 'weapons':
            this.weaponDamage *= PLAYER.WEAPON_DAMAGE_UPGRADE;
            break;
        case 'armor':
            this.armorRating *= PLAYER.ARMOR_RATING_UPGRADE;
            this.maxHealth = Math.floor(this.maxHealth * PLAYER.HEALTH_UPGRADE_MULTIPLIER);
            break;
        case 'shields':
            this.maxShield = Math.floor(this.maxShield * PLAYER.SHIELD_UPGRADE_MULTIPLIER);
            break;
        case 'cargo':
            this.cargoCapacity = Math.floor(this.cargoCapacity * PLAYER.CARGO_UPGRADE_MULTIPLIER);
            break;
        case 'energy':
            this.maxEnergy = Math.floor(this.maxEnergy * PLAYER.ENERGY_UPGRADE_MULTIPLIER);
            break;
        default:
            this.addCredits(cost); // Refund for unknown upgrade
            return false;
        }
        
        this.dirtyState = true;
        return true;
    }
    
    // === Statistics and Info ===
    
    updateStatistics(deltaTime) {
        this.stats.timePlayed += deltaTime;
    }
    
    getPlayerInfo() {
        return {
            id: this.id,
            username: this.username,
            position: this.position,
            rotation: this.rotation,
            health: this.health,
            maxHealth: this.maxHealth,
            shield: this.shield,
            maxShield: this.maxShield,
            energy: this.energy,
            maxEnergy: this.maxEnergy,
            credits: this.credits,
            isAlive: this.isAlive,
            shipType: this.shipType,
            currentSystem: this.currentSystem?.id || null
        };
    }
    
    getDetailedStats() {
        return {
            ...this.getPlayerInfo(),
            inventory: Object.fromEntries(this.inventory),
            cargoUsed: this.getCurrentCargoUsed(),
            cargoCapacity: this.cargoCapacity,
            stats: {
                ...this.stats,
                systemsVisited: this.stats.systemsVisited.size,
                systemsList: Array.from(this.stats.systemsVisited)
            },
            upgrades: {
                thrusterEfficiency: this.thrusterEfficiency,
                weaponDamage: this.weaponDamage,
                armorRating: this.armorRating
            }
        };
    }
    
    // === Serialization for Network Sync ===
    
    toNetworkData() {
        return {
            id: this.id,
            username: this.username,
            position: this.position,
            velocity: this.velocity,
            rotation: this.rotation,
            health: this.health,
            shield: this.shield,
            energy: this.energy,
            thrust: this.thrust,
            boosting: this.boosting,
            shieldsActive: this.shieldsActive,
            isAlive: this.isAlive,
            currentSystem: this.currentSystem?.id || null,
            lastUpdateTime: this.lastUpdateTime
        };
    }
    
    fromNetworkData(data) {
        // Only update if the data is newer
        if (data.lastUpdateTime > this.lastUpdateTime) {
            this.position = data.position;
            this.velocity = data.velocity;
            this.rotation = data.rotation;
            this.health = data.health;
            this.shield = data.shield;
            this.energy = data.energy;
            this.thrust = data.thrust;
            this.boosting = data.boosting;
            this.shieldsActive = data.shieldsActive;
            this.isAlive = data.isAlive;
            this.lastUpdateTime = data.lastUpdateTime;
            this.dirtyState = false;
        }
    }
    
    needsNetworkSync() {
        return this.dirtyState;
    }
    
    markSynced() {
        this.dirtyState = false;
    }
}