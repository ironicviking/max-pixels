/**
 * Game Constants
 * Centralized definitions for all magic numbers used throughout the game
 */

// Audio Constants
export const AUDIO = {
    // Volume levels
    VOLUME_LOW: 0.1,
    VOLUME_MEDIUM: 0.3,
    VOLUME_HIGH: 0.6,
    VOLUME_FULL: 1.0,
    
    // Frequencies and timing
    FREQUENCY_LOW: 40,
    FREQUENCY_MID: 60,
    FREQUENCY_HIGH: 200,
    FADE_DURATION: 0.5,
    AMBIENT_VOLUME: 0.3,
    THRUSTER_VOLUME: 0.8,
    COLLISION_VOLUME: 0.8,
    
    // Audio context timing
    RAMP_TIME: 0.01,
    SUSTAIN_TIME: 1000,
    
    // Audio effect parameters
    ENVELOPE_DECAY: 2,
    IMPACT_DECAY: 8,
    RUMBLE_DECAY: 3,
    NOISE_DECAY: 6,
    IMPACT_MIX: 0.7,
    NOISE_MIX: 0.4,
    SOUND_MIX: 0.9,
    HUM_FREQUENCY: 43,
    HUM_MIX: 0.2,
    PLAYBACK_MIN: 0.4,
    PLAYBACK_BASE: 0.7
};

// Camera Constants
export const CAMERA = {
    ZOOM_FACTOR: 1.2,
    FOLLOW_LERP: 0.08,
    FOLLOW_THRESHOLD: 0.01,
    ZOOM_SMOOTHNESS: 0.1,
    MIN_ZOOM: 0.5,
    MAX_ZOOM: 3.0,
    SHAKE_INTENSITY: 10,
    SHAKE_DURATION: 300,
    VIEWPORT_CENTER: 0.5
};

// Player Constants
export const PLAYER = {
    RADIUS: 25,
    SPEED: 200,
    BOOST_MULTIPLIER: 2,
    SPAWN_X: 960,
    SPAWN_Y: 540,
    COLLISION_RESET_DELAY: 200,
    INTERACTION_RANGE: 80,
    
    // Movement
    DELTA_TIME: 1/60,
    BOUNDARY_MARGIN: 25
};

// Graphics Constants
export const GRAPHICS = {
    // Star field
    STAR_COUNT: 200,
    STAR_SIZE_MIN: 1,
    STAR_SIZE_MAX: 3,
    STAR_OPACITY_MIN: 0.3,
    STAR_OPACITY_MAX: 0.9,
    
    // Asteroid generation
    ASTEROID_SIZE_MIN: 10,
    ASTEROID_SIZE_MAX: 40,
    ASTEROID_VERTICES: 6,
    ASTEROID_ROUGHNESS: 4,
    
    // Planet generation
    PLANET_SURFACE_OPACITY: 0.8,
    PLANET_CORE_OPACITY: 0.7,
    PLANET_ATMOSPHERE_OPACITY: 0.4,
    
    // Colors (RGB values)
    COLOR_MAX: 255,
    HUE_SHIFT: 4,
    HUE_RANGE: 6,
    
    // Animation
    THRUSTER_OPACITY: 0.8,
    THRUSTER_FADE: 0.15,
    ROTATION_SPEED: 90, // degrees
    FULL_ROTATION: 180, // degrees
    GLOW_INTENSITY: 1.15
};

// UI Constants
export const UI = {
    LOADING_FADE_DURATION: 1000,
    NOTIFICATION_DURATION: 3000,
    ANIMATION_DELAY: 300,
    HUD_UPDATE_INTERVAL: 16 // ~60fps
};

// Trading Constants
export const TRADING = {
    PRICE_VARIANCE_LOW: 0.1,
    PRICE_VARIANCE_HIGH: 0.8,
    DEMAND_MULTIPLIER: 0.5,
    SUPPLY_MULTIPLIER: 1.5,
    MARKET_VOLATILITY: 0.3
};

// Navigation Constants
export const NAVIGATION = {
    JUMP_COOLDOWN: 1000,
    PROXIMITY_CHECK_RANGE: 80,
    SECTOR_BOUNDS_DEFAULT: 2000,
    SPAWN_OFFSET: 100,
    GATE_SPAWN_X: 200,
    GATE_SPAWN_Y: 200,
    GATE_SPAWN_MARGIN: 0.1
};

// Authentication Constants
export const AUTH = {
    MIN_USERNAME_LENGTH: 3,
    MAX_USERNAME_LENGTH: 20,
    MIN_PASSWORD_LENGTH: 6,
    TOKEN_LENGTH: 36,
    TOKEN_CHARSET_LENGTH: 9,
    SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    MAX_LOGIN_ATTEMPTS: 5
};

// Animation Constants
export const ANIMATION = {
    FLASH_DURATION: 100,
    FLASH_FADE: 500,
    SMOOTH_TRANSITION: 0.3,
    QUICK_FADE: 0.1,
    PARTICLE_LIFE: 2000
};