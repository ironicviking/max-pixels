/**
 * Ship Movement System for Max-Pixels
 * Handles player ship movement controls and physics integration
 */

import { PLAYER, WEAPONS } from '../constants.js';

export class ShipMovement {
    constructor(player, inputManager) {
        this.player = player;
        this.input = inputManager;
        
        // Movement configuration
        this.rotationSpeed = PLAYER.ROTATION_SPEED;
        this.thrustPower = PLAYER.THRUST_POWER;
        this.boostCostPerSecond = WEAPONS.BOOST_ENERGY_COST;
        
        // Control states
        this.isThrusting = false;
        this.isBoosting = false;
        this.rotationDirection = 0; // -1 for left, 1 for right, 0 for none
        
        // Smooth control values for better gameplay feel
        this.thrustLevel = 0;
        this.thrustSmoothing = PLAYER.THRUST_SMOOTHING;
        this.rotationSmoothing = PLAYER.ROTATION_CONTROL_SMOOTHING;
    }
    
    /**
     * Update ship movement based on current input state
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        if (!this.player.isAlive) {
            this.resetControls();
            return;
        }
        
        this.handleRotationInput(deltaTime);
        this.handleThrustInput(deltaTime);
        this.handleBoostInput(deltaTime);
        this.handleSpecialActions();
        
        this.applyMovementToPlayer(deltaTime);
    }
    
    /**
     * Handle ship rotation controls (A/D or Left/Right arrows)
     */
    handleRotationInput(_deltaTime) {
        let targetRotation = 0;
        
        if (this.input.isPressed('move_left')) {
            targetRotation = -1;
        }
        if (this.input.isPressed('move_right')) {
            targetRotation = 1;
        }
        
        // Smooth rotation for better feel
        this.rotationDirection += (targetRotation - this.rotationDirection) * this.rotationSmoothing;
        
        // Apply rotation to player
        const rotationVelocity = this.rotationDirection * this.rotationSpeed;
        this.player.setRotation(rotationVelocity);
    }
    
    /**
     * Handle thrust controls (W/S or Up/Down arrows)
     */
    handleThrustInput(_deltaTime) {
        let targetThrust = 0;
        
        if (this.input.isPressed('move_up')) {
            targetThrust = this.thrustPower;
            this.isThrusting = true;
        } else if (this.input.isPressed('move_down')) {
            // Reverse thrust at reduced power
            targetThrust = -this.thrustPower * PLAYER.REVERSE_THRUST_MULTIPLIER;
            this.isThrusting = true;
        } else {
            this.isThrusting = false;
        }
        
        // Smooth thrust changes for better control
        this.thrustLevel += (targetThrust - this.thrustLevel) * this.thrustSmoothing;
        
        // Apply thrust to player
        this.player.setThrust(Math.abs(this.thrustLevel));
    }
    
    /**
     * Handle boost controls (Shift)
     */
    handleBoostInput(deltaTime) {
        const wantsToBoost = this.input.isPressed('boost') && this.isThrusting;
        
        // Check if player can afford boost
        const boostCost = this.boostCostPerSecond * deltaTime;
        const canBoost = this.player.energy >= boostCost;
        
        if (wantsToBoost && canBoost) {
            // Consume energy for boost
            this.player.energy -= boostCost;
            this.player.activateBoost(true);
            this.isBoosting = true;
        } else {
            this.player.activateBoost(false);
            this.isBoosting = false;
        }
    }
    
    /**
     * Handle special actions (weapons, shields, etc.)
     */
    handleSpecialActions() {
        // Fire weapon with spacebar
        if (this.input.justPressed('action')) {
            this.fireWeapon();
        }
        
        // Toggle shields (could add a key binding for this)
        if (this.input.justPressed('KeyR')) {
            this.player.toggleShields();
        }
    }
    
    /**
     * Apply calculated movement values to the player
     */
    applyMovementToPlayer(_deltaTime) {
        // The Player class handles the actual physics in its update method
        // We just need to make sure it gets updated with our control inputs
        this.player.update(_deltaTime);
    }
    
    /**
     * Attempt to fire the player's weapon
     */
    fireWeapon() {
        if (this.player.canFireWeapon()) {
            const success = this.player.fireWeapon();
            if (success) {
                // Could trigger weapon visual/audio effects here
                return this.createProjectile();
            }
        }
        return null;
    }
    
    /**
     * Create a projectile object for weapon firing
     * @returns {Object} Projectile data
     */
    createProjectile() {
        const projectile = {
            x: this.player.position.x,
            y: this.player.position.y,
            velocity: {
                x: Math.cos(this.player.rotation) * WEAPONS.LASER_SPEED,
                y: Math.sin(this.player.rotation) * WEAPONS.LASER_SPEED
            },
            rotation: this.player.rotation,
            damage: WEAPONS.LASER_DAMAGE * this.player.weaponDamage,
            lifetime: WEAPONS.LASER_LIFETIME,
            owner: this.player.id,
            type: 'laser'
        };
        
        return projectile;
    }
    
    /**
     * Reset all control states (called when player dies, etc.)
     */
    resetControls() {
        this.isThrusting = false;
        this.isBoosting = false;
        this.rotationDirection = 0;
        this.thrustLevel = 0;
        
        this.player.setThrust(0);
        this.player.setRotation(0);
        this.player.activateBoost(false);
    }
    
    /**
     * Get current movement status for UI/debugging
     */
    getMovementStatus() {
        return {
            isThrusting: this.isThrusting,
            isBoosting: this.isBoosting,
            thrustLevel: this.thrustLevel,
            rotationDirection: this.rotationDirection,
            canBoost: this.player.energy >= this.boostCostPerSecond * PLAYER.BOOST_CAPABILITY_CHECK_TIME,
            energy: this.player.energy,
            maxEnergy: this.player.maxEnergy
        };
    }
    
    /**
     * Configure movement parameters
     */
    setMovementConfig(config) {
        if (config.rotationSpeed !== undefined) {
            this.rotationSpeed = config.rotationSpeed;
        }
        if (config.thrustPower !== undefined) {
            this.thrustPower = Math.max(0, Math.min(1, config.thrustPower));
        }
        if (config.boostCostPerSecond !== undefined) {
            this.boostCostPerSecond = config.boostCostPerSecond;
        }
    }
    
    /**
     * Enable or disable movement controls
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.resetControls();
        }
    }
}