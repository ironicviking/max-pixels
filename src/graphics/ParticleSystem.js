/**
 * Advanced Particle System for Max-Pixels
 * Creates dynamic particle effects for enhanced visual feedback
 */

import { PARTICLES, GRAPHICS } from '../constants.js';

// Particle system constants
const PARTICLE_DEFAULTS = {
    COUNT: 20,
    LIFE: 2000,
    EMISSION_RATE: 10,
    SPREAD: GRAPHICS.PI_TIMES_2,
    SIZE_MIN: 2,
    SIZE_MAX: 6,
    OPACITY_START: 1.0,
    OPACITY_END: 0.0,
    GRAVITY: { x: 0, y: 0 },
    WIND: { x: 0, y: 0 },
    VELOCITY_MIN: 50,
    VELOCITY_MAX: 100,
    OFFSET: 10
};

export class ParticleSystem {
    constructor(graphicsEngine) {
        this.graphics = graphicsEngine;
        this.particles = new Map();
        this.activeEmitters = new Map();
        this.idCounter = 0;
        this.updateInterval = null;
        
        this.startUpdateLoop();
    }
    
    /**
     * Create a particle emitter
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} config - Emitter configuration
     * @returns {string} Emitter ID
     */
    createEmitter(x, y, config = {}) {
        const emitterId = `emitter_${++this.idCounter}`;
        
        const defaultConfig = {
            particleCount: PARTICLE_DEFAULTS.COUNT,
            particleLife: PARTICLE_DEFAULTS.LIFE,
            emissionRate: PARTICLE_DEFAULTS.EMISSION_RATE, // particles per second
            spread: PARTICLE_DEFAULTS.SPREAD, // full circle
            velocity: { min: PARTICLE_DEFAULTS.VELOCITY_MIN, max: PARTICLE_DEFAULTS.VELOCITY_MAX },
            size: { min: PARTICLE_DEFAULTS.SIZE_MIN, max: PARTICLE_DEFAULTS.SIZE_MAX },
            color: '#ffffff',
            opacity: { start: PARTICLE_DEFAULTS.OPACITY_START, end: PARTICLE_DEFAULTS.OPACITY_END },
            gravity: PARTICLE_DEFAULTS.GRAVITY,
            wind: PARTICLE_DEFAULTS.WIND,
            fadeOut: true,
            shrink: false,
            burst: false, // if true, emit all particles at once
            duration: -1, // -1 for infinite, milliseconds for timed
            ...config
        };
        
        const emitter = {
            id: emitterId,
            x, y,
            config: defaultConfig,
            particles: [],
            lastEmission: 0,
            startTime: Date.now(),
            active: true
        };
        
        this.activeEmitters.set(emitterId, emitter);
        
        // If burst mode, emit all particles immediately
        if (defaultConfig.burst) {
            this.burstEmit(emitter);
        }
        
        return emitterId;
    }
    
    /**
     * Create explosion particle effect
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} options - Effect options
     */
    createExplosionEffect(x, y, options = {}) {
        // Use explosion colors from GraphicsEngine constants for consistency
        const explosionColors = options.colors || ['#ff4444', '#ff8800', '#ffff00', '#ffffff'];
        
        const config = {
            particleCount: PARTICLES.EXPLOSION_PARTICLE_COUNT,
            particleLife: PARTICLES.EXPLOSION_LIFE,
            spread: GRAPHICS.PI_TIMES_2,
            velocity: { min: PARTICLES.EXPLOSION_VELOCITY_MIN, max: PARTICLES.EXPLOSION_VELOCITY_MAX },
            size: { min: PARTICLES.EXPLOSION_SIZE_MIN, max: PARTICLES.EXPLOSION_SIZE_MAX },
            colors: explosionColors, // Use colors array instead of single color
            opacity: { start: PARTICLES.EXPLOSION_OPACITY_START, end: 0.0 },
            gravity: { x: 0, y: PARTICLES.EXPLOSION_GRAVITY_Y },
            fadeOut: true,
            shrink: true,
            burst: true,
            duration: 0,
            ...options
        };
        
        return this.createEmitter(x, y, config);
    }
    
    /**
     * Create thruster particle trail
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} angle - Thruster direction
     * @param {number} intensity - Effect intensity (0-1)
     */
    createThrusterTrail(x, y, angle, intensity = 1.0) {
        const config = {
            particleCount: Math.floor(PARTICLES.THRUSTER_BASE_PARTICLES * intensity),
            particleLife: PARTICLES.THRUSTER_LIFE,
            emissionRate: PARTICLES.THRUSTER_BASE_EMISSION_RATE * intensity,
            spread: Math.PI * PARTICLES.THRUSTER_SPREAD, // narrow cone
            velocity: { min: PARTICLES.THRUSTER_VELOCITY_BASE * intensity, max: PARTICLES.THRUSTER_VELOCITY_RANGE * intensity },
            size: { min: PARTICLES.THRUSTER_SIZE_MIN, max: PARTICLES.THRUSTER_SIZE_MAX },
            color: intensity > PARTICLES.THRUSTER_HIGH_INTENSITY ? '#00aaff' : '#0066ff',
            opacity: { start: PARTICLES.THRUSTER_OPACITY_START, end: 0.0 },
            direction: angle + Math.PI, // opposite to thruster direction
            fadeOut: true,
            shrink: true,
            burst: false,
            duration: PARTICLES.THRUSTER_DURATION
        };
        
        return this.createEmitter(x, y, config);
    }
    
    /**
     * Create debris field from destroyed asteroid
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} asteroidSize - Size of destroyed asteroid
     */
    createDebrisField(x, y, asteroidSize) {
        const config = {
            particleCount: Math.floor(asteroidSize / PARTICLES.DEBRIS_SIZE_DIVISOR),
            particleLife: PARTICLES.DEBRIS_LIFE,
            spread: GRAPHICS.PI_TIMES_2,
            velocity: { min: PARTICLES.DEBRIS_VELOCITY_MIN, max: PARTICLES.DEBRIS_VELOCITY_MAX },
            size: { min: PARTICLES.DEBRIS_SIZE_MIN, max: PARTICLES.DEBRIS_SIZE_MAX },
            color: '#8b7355',
            opacity: { start: PARTICLES.DEBRIS_OPACITY_START, end: 0.0 },
            gravity: { x: 0, y: PARTICLES.DEBRIS_GRAVITY_Y },
            fadeOut: true,
            burst: true,
            duration: 0
        };
        
        return this.createEmitter(x, y, config);
    }
    
    /**
     * Create sparks effect for impact
     * @param {number} x - X position  
     * @param {number} y - Y position
     * @param {number} direction - Impact direction
     */
    createSparksEffect(x, y, direction = 0) {
        const config = {
            particleCount: PARTICLES.SPARKS_COUNT,
            particleLife: PARTICLES.SPARKS_LIFE,
            spread: Math.PI * PARTICLES.SPARKS_SPREAD,
            velocity: { min: PARTICLES.SPARKS_VELOCITY_MIN, max: PARTICLES.SPARKS_VELOCITY_MAX },
            size: { min: PARTICLES.SPARKS_SIZE_MIN, max: PARTICLES.SPARKS_SIZE_MAX },
            color: '#ffff00',
            opacity: { start: 1.0, end: 0.0 },
            direction: direction,
            gravity: { x: 0, y: PARTICLES.SPARKS_GRAVITY_Y },
            fadeOut: true,
            burst: true,
            duration: 0
        };
        
        return this.createEmitter(x, y, config);
    }
    
    /**
     * Emit particles in a burst
     */
    burstEmit(emitter) {
        for (let i = 0; i < emitter.config.particleCount; i++) {
            this.createParticle(emitter);
        }
    }
    
    /**
     * Create a single particle
     */
    createParticle(emitter) {
        const config = emitter.config;
        const particleId = `particle_${++this.idCounter}`;
        
        // Calculate random direction within spread
        const baseDirection = config.direction || 0;
        const randomAngle = baseDirection + (Math.random() - PARTICLES.RANDOM_OFFSET_RANGE) * config.spread;
        
        // Calculate velocity
        const speed = config.velocity.min + Math.random() * (config.velocity.max - config.velocity.min);
        const velX = Math.cos(randomAngle) * speed;
        const velY = Math.sin(randomAngle) * speed;
        
        // Calculate size
        const size = config.size.min + Math.random() * (config.size.max - config.size.min);
        
        // Select random color from colors array, or use single color
        const particleColor = config.colors 
            ? config.colors[Math.floor(Math.random() * config.colors.length)]
            : config.color;
        
        const particle = {
            id: particleId,
            x: emitter.x + (Math.random() - PARTICLES.RANDOM_OFFSET_RANGE) * PARTICLES.POSITION_OFFSET, // small random offset
            y: emitter.y + (Math.random() - PARTICLES.RANDOM_OFFSET_RANGE) * PARTICLES.POSITION_OFFSET,
            velX: velX,
            velY: velY,
            size: size,
            originalSize: size,
            color: particleColor,
            opacity: config.opacity.start,
            life: config.particleLife,
            maxLife: config.particleLife,
            startTime: Date.now()
        };
        
        // Create visual element
        const visualElement = this.graphics.createCircle(particle.x, particle.y, particle.size, {
            id: particleId,
            fill: particle.color,
            opacity: particle.opacity
        });
        
        // Add to appropriate layer
        this.graphics.addToLayer('game', visualElement);
        
        // Store particle data
        particle.element = visualElement;
        this.particles.set(particleId, particle);
        emitter.particles.push(particle);
        
        return particle;
    }
    
    /**
     * Update all particles and emitters
     */
    update() {
        const currentTime = Date.now();
        const deltaTime = PARTICLES.DELTA_TIME_60FPS; // Assume 60fps
        
        // Update emitters
        for (const [, emitter] of this.activeEmitters) {
            if (!emitter.active) continue;
            
            // Check if emitter should expire
            if (emitter.config.duration > 0) {
                if (currentTime - emitter.startTime > emitter.config.duration) {
                    emitter.active = false;
                    continue;
                }
            }
            
            // Emit new particles for continuous emitters
            if (!emitter.config.burst && emitter.active) {
                const timeSinceLastEmission = currentTime - emitter.lastEmission;
                const emissionInterval = PARTICLES.EMISSION_TIME_MS / emitter.config.emissionRate;
                
                if (timeSinceLastEmission >= emissionInterval) {
                    this.createParticle(emitter);
                    emitter.lastEmission = currentTime;
                }
            }
        }
        
        // Update particles
        for (const [particleId, particle] of this.particles) {
            // Update physics
            particle.x += particle.velX * deltaTime;
            particle.y += particle.velY * deltaTime;
            
            // Apply gravity
            const emitter = this.getParticleEmitter(particle);
            if (emitter) {
                particle.velX += emitter.config.gravity.x * deltaTime;
                particle.velY += emitter.config.gravity.y * deltaTime;
                
                // Apply wind
                particle.velX += emitter.config.wind.x * deltaTime;
                particle.velY += emitter.config.wind.y * deltaTime;
            }
            
            // Update life
            particle.life -= PARTICLES.FRAME_TIME; // Approximately 60fps
            const lifeRatio = particle.life / particle.maxLife;
            
            // Update opacity
            if (emitter && emitter.config.fadeOut) {
                const opacityRange = emitter.config.opacity.start - emitter.config.opacity.end;
                particle.opacity = emitter.config.opacity.end + (lifeRatio * opacityRange);
            }
            
            // Update size
            if (emitter && emitter.config.shrink) {
                particle.size = particle.originalSize * lifeRatio;
            }
            
            // Update visual element
            if (particle.element) {
                particle.element.setAttribute('cx', particle.x);
                particle.element.setAttribute('cy', particle.y);
                particle.element.setAttribute('r', Math.max(PARTICLES.SIZE_MIN_RENDER, particle.size));
                particle.element.setAttribute('opacity', Math.max(0, particle.opacity));
            }
            
            // Remove dead particles
            if (particle.life <= 0) {
                this.removeParticle(particleId);
            }
        }
        
        // Clean up inactive emitters with no particles
        for (const [emitterId, emitter] of this.activeEmitters) {
            if (!emitter.active && emitter.particles.length === 0) {
                this.activeEmitters.delete(emitterId);
            }
        }
    }
    
    /**
     * Get the emitter that owns a particle
     */
    getParticleEmitter(particle) {
        for (const emitter of this.activeEmitters.values()) {
            if (emitter.particles.includes(particle)) {
                return emitter;
            }
        }
        return null;
    }
    
    /**
     * Remove a particle
     */
    removeParticle(particleId) {
        const particle = this.particles.get(particleId);
        if (!particle) return;
        
        // Remove visual element
        if (particle.element) {
            this.graphics.remove(particle.element);
        }
        
        // Remove from emitter's particle list
        const emitter = this.getParticleEmitter(particle);
        if (emitter) {
            const index = emitter.particles.indexOf(particle);
            if (index > -1) {
                emitter.particles.splice(index, 1);
            }
        }
        
        // Remove from particles map
        this.particles.delete(particleId);
    }
    
    /**
     * Remove an emitter and all its particles
     */
    removeEmitter(emitterId) {
        const emitter = this.activeEmitters.get(emitterId);
        if (!emitter) return;
        
        // Remove all particles from this emitter
        for (const particle of [...emitter.particles]) {
            this.removeParticle(particle.id);
        }
        
        // Remove emitter
        this.activeEmitters.delete(emitterId);
    }
    
    /**
     * Start the update loop
     */
    startUpdateLoop() {
        if (this.updateInterval) return;
        
        this.updateInterval = setInterval(() => {
            this.update();
        }, PARTICLES.FRAME_TIME); // ~60fps
    }
    
    /**
     * Stop the update loop
     */
    stopUpdateLoop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    
    /**
     * Clear all particles and emitters
     */
    clear() {
        // Remove all particles
        for (const particleId of this.particles.keys()) {
            this.removeParticle(particleId);
        }
        
        // Clear emitters
        this.activeEmitters.clear();
        this.idCounter = 0;
    }
    
    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            activeEmitters: this.activeEmitters.size,
            activeParticles: this.particles.size,
            totalCreatedParticles: this.idCounter
        };
    }
}