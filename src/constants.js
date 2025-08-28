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
    LASER_VOLUME: 0.6,
    
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
    PLAYBACK_BASE: 0.7,
    
    // Laser sound parameters
    LASER_BEAM_DECAY: 8,
    LASER_ZAP_DECAY: 12,
    LASER_ENERGY_DECAY: 6,
    LASER_FREQUENCY_MULT: 2,
    LASER_ZAP_FREQUENCY_MULT: 4,
    
    // Weapon recharge sound parameters
    WEAPON_RECHARGE_VOLUME: 0.4,
    WEAPON_RECHARGE_DURATION: 0.6,
    WEAPON_RECHARGE_FREQUENCY_MULT: 2,
    WEAPON_RECHARGE_SPARKLE_MULT: 3,
    WEAPON_RECHARGE_SPARKLE_WIDTH: 8,
    WEAPON_RECHARGE_SPARKLE_DECAY: 0.2,
    WEAPON_RECHARGE_HUM_VOLUME: 0.3,
    WEAPON_RECHARGE_HUM_DECAY: 4,
    WEAPON_RECHARGE_FADEOUT_RATE: 4,
    
    // Playback rate variations
    PLAYBACK_VARIATION: 0.2
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
    BOUNDARY_MARGIN: 25,
    ROTATION_SMOOTHING: 0.15,
    ROTATION_SPEED: 3.0, // radians per second
    THRUST_POWER: 0.8, // 0-1 thrust level
    THRUST_SMOOTHING: 0.1, // Smoothing factor for thrust changes
    ROTATION_CONTROL_SMOOTHING: 0.2, // Smoothing factor for rotation control
    REVERSE_THRUST_MULTIPLIER: 0.6, // Reverse thrust power multiplier
    BOOST_CAPABILITY_CHECK_TIME: 0.1, // Time window for boost capability check
    
    // Health System
    MAX_HEALTH: 100,
    ASTEROID_COLLISION_DAMAGE: 25,
    HEALTH_REGEN_RATE: 5, // Health regenerated per second
    HEALTH_REGEN_DELAY: 3000, // Wait 3 seconds after damage before regen starts
    LOW_HEALTH_THRESHOLD: 30, // Below this, visual warning appears
    CRITICAL_HEALTH_THRESHOLD: 15, // Below this, critical warning
    DEATH_RESPAWN_DELAY: 2000, // 2 seconds before respawn
    INVINCIBILITY_DURATION: 2000, // 2 seconds of invincibility after respawn/damage
    
    // Shield System
    MAX_SHIELD: 50, // Maximum shield capacity
    SHIELD_REGEN_RATE: 10, // Shield regenerated per second
    SHIELD_REGEN_DELAY: 4000, // Wait 4 seconds after shield break before regen starts
    SHIELD_DAMAGE_REDUCTION: 0.5, // Shields absorb 50% of damage
    SHIELD_ACTIVATION_KEY: 'KeyG', // Key to manually toggle shields
    SHIELD_AUTO_ACTIVATE: true, // Auto-activate shields when taking damage
    SHIELD_RECHARGE_COMPLETE_THRESHOLD: 40, // Above this, play shield online sound
    LOW_SHIELD_THRESHOLD: 15, // Below this, visual warning appears
    
    // Ship Upgrade Multipliers
    ENGINE_EFFICIENCY_UPGRADE: 1.2,
    ENGINE_SPEED_UPGRADE: 1.1,
    WEAPON_DAMAGE_UPGRADE: 1.3,
    ARMOR_RATING_UPGRADE: 1.25,
    HEALTH_UPGRADE_MULTIPLIER: 1.15,
    SHIELD_UPGRADE_MULTIPLIER: 1.2,
    CARGO_UPGRADE_MULTIPLIER: 1.3,
    ENERGY_UPGRADE_MULTIPLIER: 1.15
};

// Graphics Constants
export const GRAPHICS = {
    // Star field generation
    STAR_COUNT: 200,
    STAR_SIZE_MIN: 1,
    STAR_SIZE_MAX: 3,
    STAR_OPACITY_MIN: 0.3,
    STAR_OPACITY_MAX: 0.9,
    
    // Star classification system (based on real stellar types - ordered by temperature)
    STAR_TYPES: {
        // Blue supergiants - hottest and rarest
        O: { color: '#9bb0ff', temperature: 30000, rarity: 0.00003, sizeMultiplier: 2.5 },
        // Blue-white stars  
        B: { color: '#aabfff', temperature: 10000, rarity: 0.13, sizeMultiplier: 2.0 },
        // White stars
        A: { color: '#cad7ff', temperature: 7500, rarity: 0.6, sizeMultiplier: 1.5 },
        // Yellow-white stars
        F: { color: '#f8f7ff', temperature: 6000, rarity: 3, sizeMultiplier: 1.3 },
        // Yellow stars (like our Sun)
        G: { color: '#fff4ea', temperature: 5200, rarity: 7.6, sizeMultiplier: 1.0 },
        // Orange stars
        K: { color: '#ffd2a1', temperature: 3700, rarity: 12.1, sizeMultiplier: 0.8 },
        // Red dwarfs - coolest and most common
        M: { color: '#ffad51', temperature: 2400, rarity: 76.45, sizeMultiplier: 0.5 }
    },
    
    // Star visual effects and animations
    STAR_TWINKLE_CHANCE: 0.3,
    STAR_TWINKLE_INTENSITY: 0.4,
    STAR_TWINKLE_MIN_DURATION: 2,
    STAR_TWINKLE_MAX_DURATION: 3,
    
    // Solar corona effects
    STAR_CORONA_MIN_SIZE_THRESHOLD: 2.5, // Minimum star size to show corona
    STAR_CORONA_SIZE_MULTIPLIER: 1.8, // Corona size relative to star
    STAR_CORONA_OPACITY_BASE: 0.1, // Base corona opacity
    STAR_CORONA_OPACITY_VARIATION: 0.05, // Random opacity variation
    STAR_CORONA_ANIMATION_DURATION_MIN: 4, // Minimum animation duration in seconds
    STAR_CORONA_ANIMATION_DURATION_MAX: 8, // Maximum animation duration in seconds
    STAR_CORONA_PULSE_INTENSITY: 0.3, // How much corona opacity varies during pulse
    STAR_CORONA_CHANCE: 0.7, // Chance for eligible stars to have corona effects
    STAR_CORONA_LAYER_COUNT: 3, // Number of corona layers
    STAR_CORONA_LAYER_SIZE_INCREMENT: 0.2, // Size increase per layer relative to star size
    STAR_CORONA_LAYER_OPACITY_DECAY: 0.3, // Opacity reduction per layer
    STAR_CORONA_STROKE_WIDTH_RATIO: 0.1, // Corona stroke width relative to star size
    STAR_CORONA_ANIMATION_DELAY: 0.3, // Animation delay offset per layer
    STAR_CORONA_DURATION_OFFSET: 0.5, // Duration variation per layer
    BLUR_BASE_RADIUS: 2, // Base blur radius for corona layers
    
    // Binary star systems
    STAR_BINARY_CHANCE: 0.05,
    STAR_BINARY_SEPARATION: 8,
    STAR_COMPANION_SIZE_RATIO: 0.7,
    
    // Star generation calculations
    STAR_CUMULATIVE_RARITY: 100,
    
    // Nebula effects
    NEBULA_BASE_SIZE: 200,
    NEBULA_BASE_OPACITY: 0.3,
    NEBULA_CLOUD_COUNT_MIN: 8,
    NEBULA_CLOUD_COUNT_MAX: 12,
    NEBULA_CLOUD_RX_MIN: 30,
    NEBULA_CLOUD_RX_MAX: 80,
    NEBULA_CLOUD_RY_MIN: 20,
    NEBULA_CLOUD_RY_MAX: 60,
    NEBULA_CLOUD_OPACITY_MIN: 0.3,
    NEBULA_CLOUD_OPACITY_MAX: 0.7,
    NEBULA_ROTATION_MAX: 360,
    NEBULA_COUNT_MIN: 2,
    NEBULA_COUNT_MAX: 3,
    NEBULA_PATTERN_SIZE_MIN: 150,
    NEBULA_PATTERN_SIZE_MAX: 200,
    NEBULA_REGION_WIDTH_MIN: 0.3,
    NEBULA_REGION_WIDTH_MAX: 0.4,
    NEBULA_REGION_HEIGHT_MIN: 0.2,
    NEBULA_REGION_HEIGHT_MAX: 0.3,
    NEBULA_REGION_OPACITY: 0.6,
    NEBULA_CHANCE: 0.6,
    
    // Cosmic dust field effects
    DUST_PARTICLE_COUNT_MIN: 100,
    DUST_PARTICLE_COUNT_MAX: 200,
    DUST_SIZE_MIN: 0.3,
    DUST_SIZE_MAX: 1.8,
    DUST_OPACITY_MIN: 0.08,
    DUST_OPACITY_MAX: 0.35,
    DUST_DENSITY_SPARSE: 0.5,
    DUST_DENSITY_NORMAL: 1.0,
    DUST_DENSITY_DENSE: 1.8,
    DUST_CLOUD_COUNT_MIN: 3,
    DUST_CLOUD_COUNT_MAX: 7,
    DUST_ANIMATION_CHANCE: 0.15,
    DUST_ANIMATION_DURATION_MIN: 6,
    DUST_ANIMATION_DURATION_MAX: 18,
    
    // Space debris field effects
    DEBRIS_FIELD_COUNT_MIN: 5,
    DEBRIS_FIELD_COUNT_MAX: 15,
    DEBRIS_SIZE_MIN: 3,
    DEBRIS_SIZE_MAX: 12,
    DEBRIS_OPACITY_MIN: 0.6,
    DEBRIS_OPACITY_MAX: 0.9,
    DEBRIS_ROTATION_MAX: 360,
    DEBRIS_TYPES: ['hull_fragment', 'engine_part', 'solar_panel', 'antenna', 'fuel_tank'],
    DEBRIS_DENSITY_SPARSE: 0.3,
    DEBRIS_DENSITY_NORMAL: 0.7,
    DEBRIS_DENSITY_DENSE: 1.2,
    DEBRIS_CLUSTER_COUNT_MIN: 2,
    DEBRIS_CLUSTER_COUNT_MAX: 5,
    DEBRIS_CLUSTER_SPREAD: 50,
    DEBRIS_DRIFT_CHANCE: 0.2,
    DEBRIS_DRIFT_DURATION_MIN: 8,
    DEBRIS_DRIFT_DURATION_MAX: 20,
    
    // Asteroid generation
    ASTEROID_SIZE_MIN: 10,
    ASTEROID_SIZE_MAX: 40,
    ASTEROID_SIZE_RANGE: 30,
    ASTEROID_VERTICES: 6,
    ASTEROID_ROUGHNESS: 4,
    ASTEROID_VERTEX_VARIANCE: 4,
    ASTEROID_RADIUS_MIN: 0.7,
    ASTEROID_RADIUS_MAX: 0.3,
    ASTEROID_STROKE_WIDTH: 1,
    ASTEROID_OPACITY: 0.9,
    ASTEROID_HIGHLIGHT_OPACITY: 0.6,
    ASTEROID_HIGHLIGHT_WIDTH: 0.5,
    ASTEROID_HIGHLIGHT_OFFSET: 0.1,
    
    // Asteroid belt generation
    ASTEROID_BELT_SIZE_REDUCTION: 0.3,
    ASTEROID_BELT_OPACITY_BASE: 0.8,
    ASTEROID_BELT_OPACITY_VARIATION: 0.2,
    
    // Spaceship
    SPACESHIP_DEFAULT_SIZE: 20,
    SPACESHIP_HULL_WING_RATIO: 0.3,
    SPACESHIP_HULL_BODY_RATIO: 0.7,
    SPACESHIP_ENGINE_RATIO: 0.5,
    SPACESHIP_ENGINE_SIZE_RATIO: 0.2,
    SPACESHIP_THRUSTER_OPACITY: 0.8,
    SPACESHIP_THRUSTER_MAIN_WIDTH: 0.1,
    SPACESHIP_THRUSTER_MAIN_HEIGHT: 1.5,
    SPACESHIP_THRUSTER_CORE_WIDTH: 0.06,
    SPACESHIP_THRUSTER_CORE_HEIGHT: 1.3,
    SPACESHIP_THRUSTER_INNER_WIDTH: 0.03,
    SPACESHIP_THRUSTER_INNER_HEIGHT: 1.15,
    SPACESHIP_THRUSTER_SIDE_WIDTH: 0.4,
    SPACESHIP_THRUSTER_SIDE_HEIGHT: 0.1,
    SPACESHIP_THRUSTER_SIDE_LENGTH: 0.8,
    SPACESHIP_THRUSTER_BASE_OPACITY: 0.7,
    SPACESHIP_THRUSTER_BOOST_OPACITY: 1.0,
    SPACESHIP_THRUSTER_FADE_SPEED: 0.1,
    SPACESHIP_THRUSTER_SIDE_OPACITY: 0.8,
    SPACESHIP_THRUSTER_FLAME_OPACITY: 0.9,
    SPACESHIP_THRUSTER_INNER_OPACITY: 0.8,
    SPACESHIP_THRUSTER_CORE_HEIGHT_OFFSET: 1.0,
    SPACESHIP_STROKE_WIDTH: 1,
    
    // Planet generation
    PLANET_SURFACE_OPACITY: 0.8,
    PLANET_CORE_OPACITY: 0.7,
    PLANET_ATMOSPHERE_OPACITY: 0.4,
    PLANET_GRADIENT_CORE: '30%',
    PLANET_GRADIENT_MIDDLE: '70%',
    PLANET_STROKE_WIDTH: 2,
    PLANET_CRATER_MIN: 3,
    PLANET_CRATER_MAX: 4,
    PLANET_CRATER_DISTANCE_MAX: 0.7,
    PLANET_CRATER_SIZE_MIN: 0.05,
    PLANET_CRATER_SIZE_MAX: 0.15,
    PLANET_CRATER_RIM_RATIO: 0.9,
    PLANET_CONTINENT_MIN: 2,
    PLANET_CONTINENT_MAX: 3,
    PLANET_CONTINENT_DISTANCE_MAX: 0.4,
    PLANET_CONTINENT_POINTS_MIN: 5,
    PLANET_CONTINENT_POINTS_MAX: 3,
    PLANET_CONTINENT_RADIUS_MIN: 0.2,
    PLANET_CONTINENT_RADIUS_MAX: 0.3,
    PLANET_CONTINENT_OPACITY: 0.4,
    PLANET_ATMOSPHERE_GLOW: 1.15,
    PLANET_ATMOSPHERE_INNER: '85%',
    PLANET_ATMOSPHERE_OUTER: '100%',
    PLANET_DARKEN_FACTOR: 0.4,
    PLANET_LIGHTEN_FACTOR: 0.3,
    
    // Space Station
    STATION_DEFAULT_SIZE: 30,
    STATION_HUB_RATIO: 0.4,
    STATION_RING_RATIO: 0.8,
    STATION_RING_WIDTH: 0.15,
    STATION_DOCKING_PORTS: 4,
    STATION_PORT_WIDTH: 0.1,
    STATION_PORT_HEIGHT: 0.05,
    STATION_PORT_LENGTH: 0.2,
    STATION_SOLAR_PANELS: 6,
    STATION_PANEL_WIDTH: 0.15,
    STATION_PANEL_HEIGHT: 0.05,
    STATION_PANEL_LENGTH: 0.3,
    STATION_PANEL_DISTANCE: 1.2,
    STATION_COMM_WIDTH: 0.05,
    STATION_COMM_HEIGHT: 1.4,
    STATION_COMM_LENGTH: 0.1,
    STATION_COMM_WIDTH_RATIO: 0.8,
    STATION_NAV_LIGHT_RATIO: 0.7,
    STATION_NAV_LIGHT_SIZE: 0.08,
    STATION_STROKE_WIDTH: 2,
    STATION_RING_OPACITY: 0.8,
    STATION_PANEL_OPACITY: 0.9,
    STATION_NAV_LIGHT_OPACITY: 0.8,
    
    // Jump Gate
    GATE_DEFAULT_SIZE: 40,
    GATE_INNER_RATIO: 0.7,
    GATE_CORE_RATIO: 0.5,
    GATE_OUTER_STROKE_RATIO: 0.08,
    GATE_INNER_STROKE_RATIO: 0.04,
    GATE_STRUT_COUNT: 4,
    GATE_STRUT_INNER_RATIO: 0.7,
    GATE_STRUT_OUTER_RATIO: 1.1,
    GATE_STRUT_WIDTH: 0.06,
    GATE_PARTICLES: 8,
    GATE_PARTICLE_DISTANCE: 0.85,
    GATE_PARTICLE_SIZE: 0.05,
    GATE_OUTER_OPACITY: 0.7,
    GATE_INNER_OPACITY: 0.9,
    GATE_CORE_OPACITY: 0.2,
    GATE_PARTICLE_OPACITY: 0.8,
    GATE_DASH_ARRAY_LONG: 0.3,
    GATE_DASH_ARRAY_SHORT: 0.1,
    GATE_ANIMATION_DURATION_ROTATE: '4s',
    GATE_ANIMATION_DURATION_PULSE: '2s',
    GATE_ANIMATION_DURATION_CORE: '3s',
    GATE_PULSE_MIN: '0.4',
    GATE_PULSE_MAX: '0.9',
    GATE_CORE_PULSE_MIN: '0.1',
    GATE_CORE_PULSE_MAX: '0.3',
    
    // Laser and Weapons
    LASER_DEFAULT_WIDTH: 3,
    LASER_GLOW_MULTIPLIER: 2,
    LASER_CORE_WIDTH: 1,
    LASER_BEAM_OPACITY: 0.9,
    LASER_GLOW_OPACITY: 0.3,
    LASER_CORE_OPACITY: 0.8,
    LASER_DEFAULT_DURATION: '0.3s',
    LASER_CLEANUP_DELAY: 100,
    
    // Impact Effects
    IMPACT_DEFAULT_SIZE: 8,
    IMPACT_RING_MULTIPLIER: 1.5,
    IMPACT_SPARKS: 6,
    IMPACT_SPARK_DISTANCE: 2,
    IMPACT_STROKE_WIDTH: 2,
    IMPACT_FLASH_OPACITY: 0.9,
    IMPACT_RING_OPACITY: 0.7,
    IMPACT_SPARK_OPACITY: 0.8,
    IMPACT_SPARK_WIDTH: 1,
    IMPACT_DEFAULT_DURATION: '0.4s',
    IMPACT_CLEANUP_DELAY: 100,
    
    // Projectiles
    PROJECTILE_PLASMA_CORE: 3,
    PROJECTILE_PLASMA_GLOW: 6,
    PROJECTILE_PLASMA_TRAIL: 8,
    PROJECTILE_PLASMA_CORE_OPACITY: 0.9,
    PROJECTILE_PLASMA_GLOW_OPACITY: 0.4,
    PROJECTILE_PLASMA_TRAIL_OPACITY: 0.2,
    PROJECTILE_PLASMA_TRAIL_WIDTH: 1,
    PROJECTILE_MISSILE_WIDTH: 8,
    PROJECTILE_MISSILE_TIP: 10,
    PROJECTILE_MISSILE_HEIGHT: 2,
    PROJECTILE_MISSILE_WARHEAD: 2,
    PROJECTILE_MISSILE_EXHAUST: 15,
    PROJECTILE_MISSILE_EXHAUST_WIDTH: 12,
    PROJECTILE_MISSILE_STROKE_WIDTH: 1,
    PROJECTILE_MISSILE_WARHEAD_OPACITY: 0.8,
    PROJECTILE_MISSILE_EXHAUST_OPACITY: 0.7,
    PROJECTILE_RAILGUN_WIDTH: 8,
    PROJECTILE_RAILGUN_HEIGHT: 2,
    PROJECTILE_RAILGUN_FIELD_WIDTH: 12,
    PROJECTILE_RAILGUN_FIELD_HEIGHT: 4,
    PROJECTILE_RAILGUN_SLUG_OPACITY: 0.9,
    PROJECTILE_RAILGUN_FIELD_OPACITY: 0.5,
    PROJECTILE_RAILGUN_FIELD_WIDTH_STROKE: 1,
    
    // Explosions
    EXPLOSION_DEFAULT_SIZE: 20,
    EXPLOSION_RINGS: 4,
    EXPLOSION_RING_BASE: 0.3,
    EXPLOSION_RING_INCREMENT: 0.3,
    EXPLOSION_STROKE_WIDTH: 0.1,
    EXPLOSION_FLASH_RATIO: 0.8,
    EXPLOSION_PARTICLES: 12,
    EXPLOSION_PARTICLE_DISTANCE: 1.2,
    EXPLOSION_PARTICLE_SIZE: 2,
    EXPLOSION_FLASH_OPACITY: 0.8,
    EXPLOSION_RING_OPACITY_BASE: 0.9,
    EXPLOSION_RING_OPACITY_DECREMENT: 0.2,
    EXPLOSION_PARTICLE_OPACITY: 0.7,
    EXPLOSION_DEFAULT_DURATION: '0.8s',
    EXPLOSION_CLEANUP_DELAY: 100,
    
    // Shield Effects
    SHIELD_DEFAULT_RADIUS: 30,
    SHIELD_HEX_RATIO: 0.5,
    SHIELD_HEX_RATIO_LONG: 0.866,
    SHIELD_FIELD_RATIO: 0.9,
    SHIELD_LINES: 6,
    SHIELD_LINE_LENGTH: 0.7,
    SHIELD_STROKE_WIDTH: 2,
    SHIELD_LINE_WIDTH: 1,
    SHIELD_HEX_OPACITY: 0.6,
    SHIELD_FIELD_OPACITY: 0.1,
    SHIELD_LINE_OPACITY: 0.3,
    SHIELD_PULSE_MIN: '0.3',
    SHIELD_PULSE_MAX: '0.8',
    SHIELD_PULSE_DURATION: '1.5s',
    
    // Colors (RGB values)
    COLOR_MAX: 255,
    HEX_RED_START: 0,
    HEX_RED_END: 2,
    HEX_GREEN_START: 2,
    HEX_GREEN_END: 4,
    HEX_BLUE_START: 4,
    HEX_BLUE_END: 6,
    COLOR_LIGHTEN_STEP: 4,
    
    // General geometry
    PI_TIMES_2: Math.PI * 2,
    ANGLE_180: 180,
    ANGLE_90: 90,
    ANGLE_60: 60,
    ANGLE_45: 45,
    ANGLE_30: 30,
    FULL_CIRCLE: 2,
    
    // Common ratios and values
    RATIO_BINARY_SEPARATION: 1.8,
    RATIO_OPACITY_HIGH: 0.9,
    RATIO_OPACITY_MID: 0.7,
    RATIO_OPACITY_LOW: 0.4,
    RATIO_SIZE_SMALL: 0.2,
    RATIO_SIZE_MID: 0.5,
    RATIO_SIZE_LARGE: 0.8,
    
    // Timing and cleanup
    ANIMATION_DELAY_MS: 100,
    CLEANUP_DELAY_MS: 1000,
    
    // Math constants
    MATH_PI_MULTIPLIER: 2.5,
    MATH_SQRT_3_HALF: 0.866,
    
    // Generic numeric constants
    COUNT_MINIMUM: 3,
    COUNT_MEDIUM: 6,
    COUNT_LARGE: 8,
    COUNT_MAXIMUM: 12,
    SIZE_DEFAULT: 20,
    SIZE_MEDIUM: 30,
    SIZE_LARGE: 40,
    
    // Player ship specific
    PLAYER_SHIP_DEFAULT_SIZE: 20,
    PLAYER_NAME_LABEL_OFFSET: 15,
    
    // Animation
    THRUSTER_OPACITY: 0.8,
    THRUSTER_FADE: 0.15,
    ROTATION_SPEED: 90, // degrees
    FULL_ROTATION: 180, // degrees
    GLOW_INTENSITY: 1.15,
    
    // Time conversions
    SECONDS_TO_MS: 1000,
    
    // Default canvas bounds
    DEFAULT_CANVAS_WIDTH: 1920,
    DEFAULT_CANVAS_HEIGHT: 1080,
    
    // Radar System
    RADAR_DEFAULT_SIZE: 80,
    RADAR_RANGE: 300,
    RADAR_BLIP_SIZE: 2,
    RADAR_PLAYER_BLIP_SIZE: 4,
    RADAR_STATION_BLIP_SIZE: 3,
    RADAR_ASTEROID_BLIP_SIZE: 1,
    RADAR_SWEEP_DURATION: '4s',
    RADAR_GRID_LINES: 4,
    RADAR_BORDER_WIDTH: 2,
    RADAR_BACKGROUND_OPACITY: 0.8,
    RADAR_GRID_OPACITY: 0.5,
    RADAR_TRAIL_OPACITY: 0.1,
    RADAR_TRAIL_ARC_DEGREES: 60,
    RADAR_TRAIL_ANIMATION_DELAY: 0.2,
    DEGREES_TO_RADIANS_FACTOR: Math.PI / 180,
    LARGE_ARC_THRESHOLD_DEGREES: 180,
    
    // Star System rendering
    STATION_RENDER_SIZE: 8,
    STATION_RENDER_WIDTH: 16,
    STATION_RENDER_HEIGHT: 16,
    JUMP_GATE_RENDER_RADIUS: 12,
    
    // Wormhole visual effects
    WORMHOLE_DEFAULT_SIZE: 60,
    WORMHOLE_EVENT_HORIZON_WIDTH_RATIO: 0.1,
    WORMHOLE_CORE_SIZE_RATIO: 0.8,
    WORMHOLE_SPIRAL_COUNT: 4,
    WORMHOLE_SPIRAL_BASE_RADIUS: 0.3,
    WORMHOLE_SPIRAL_RADIUS_INCREMENT: 0.15,
    WORMHOLE_SPIRAL_ROTATION_INCREMENT: 45,
    WORMHOLE_SPIRAL_ARC_FIRST: 0.7,
    WORMHOLE_SPIRAL_ARC_SECOND: 0.8,
    WORMHOLE_SPIRAL_END_RADIUS: 0.9,
    WORMHOLE_SPIRAL_HUE_BASE: 270,
    WORMHOLE_SPIRAL_HUE_INCREMENT: 20,
    WORMHOLE_SPIRAL_LIGHTNESS_BASE: 60,
    WORMHOLE_SPIRAL_LIGHTNESS_DECREMENT: 10,
    WORMHOLE_SPIRAL_STROKE_WIDTH: 0.03,
    WORMHOLE_SPIRAL_OPACITY_BASE: 0.7,
    WORMHOLE_SPIRAL_OPACITY_DECREMENT: 0.1,
    WORMHOLE_SPIRAL_ANIMATION_BASE_DURATION: 6,
    WORMHOLE_SPIRAL_ANIMATION_DURATION_INCREMENT: 2,
    WORMHOLE_PARTICLES_COUNT: 8,
    WORMHOLE_PARTICLE_DISTANCE_BASE: 0.6,
    WORMHOLE_PARTICLE_DISTANCE_VARIATION: 0.3,
    WORMHOLE_PARTICLE_SIZE: 0.02,
    WORMHOLE_PARTICLE_ORBIT_DURATION: 10,
    WORMHOLE_DISTORTION_RINGS_COUNT: 3,
    WORMHOLE_DISTORTION_RING_BASE_RADIUS: 1.1,
    WORMHOLE_DISTORTION_RING_RADIUS_INCREMENT: 0.2,
    WORMHOLE_DISTORTION_PULSE_BASE_DURATION: 3,
    WORMHOLE_DISTORTION_PULSE_DELAY: 0.5,
    WORMHOLE_GRADIENT_STOP_30: 30,
    WORMHOLE_GRADIENT_STOP_70: 70,
    WORMHOLE_FULL_ROTATION: 360,
    WORMHOLE_ANGLE_TO_RADIANS: 180
};

// UI Constants
export const UI = {
    LOADING_FADE_DURATION: 1000,
    NOTIFICATION_DURATION: 3000,
    ANIMATION_DELAY: 300,
    HUD_UPDATE_INTERVAL: 16, // ~60fps
    
    // Proximity feedback effects
    PROXIMITY_GLOW_COLOR: '#00ffff',
    PROXIMITY_GLOW_OPACITY: 0.6,
    PROXIMITY_PULSE_MIN: 0.3,
    PROXIMITY_PULSE_MAX: 0.8,
    PROXIMITY_PULSE_DURATION: '1.5s',
    PROXIMITY_FILTER_ID: 'proximityGlow'
};

// Trading Constants
export const TRADING = {
    PRICE_VARIANCE_LOW: 0.1,
    PRICE_VARIANCE_HIGH: 0.8,
    DEMAND_MULTIPLIER: 0.5,
    SUPPLY_MULTIPLIER: 1.5,
    MARKET_VOLATILITY: 0.3,
    PRICE_BOUNDS_MIN_SELL: 0.5,
    PRICE_BOUNDS_MIN_BUY: 0.3,
    PRICE_BOUNDS_MAX_SELL: 2.0,
    PRICE_BOUNDS_MAX_BUY: 1.5,
    DEFAULT_PLAYER_CREDITS: 1000,
    MESSAGE_DURATION: 3000,
    FADE_OUT_DELAY: 300
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

// Particle System Constants
export const PARTICLES = {
    // Explosion effects
    EXPLOSION_PARTICLE_COUNT: 25,
    EXPLOSION_LIFE: 1500,
    EXPLOSION_VELOCITY_MIN: 80,
    EXPLOSION_VELOCITY_MAX: 150,
    EXPLOSION_SIZE_MIN: 3,
    EXPLOSION_SIZE_MAX: 8,
    EXPLOSION_GRAVITY_Y: 20,
    EXPLOSION_OPACITY_START: 0.9,
    
    // Thruster trails
    THRUSTER_BASE_PARTICLES: 15,
    THRUSTER_LIFE: 800,
    THRUSTER_BASE_EMISSION_RATE: 20,
    THRUSTER_SPREAD: 0.3, // fraction of PI
    THRUSTER_VELOCITY_BASE: 30,
    THRUSTER_VELOCITY_RANGE: 60,
    THRUSTER_SIZE_MIN: 2,
    THRUSTER_SIZE_MAX: 4,
    THRUSTER_OPACITY_START: 0.8,
    THRUSTER_DURATION: 500,
    THRUSTER_HIGH_INTENSITY: 0.8,
    
    // Debris fields
    DEBRIS_SIZE_DIVISOR: 2,
    DEBRIS_LIFE: 3000,
    DEBRIS_VELOCITY_MIN: 20,
    DEBRIS_VELOCITY_MAX: 80,
    DEBRIS_SIZE_MIN: 1,
    DEBRIS_SIZE_MAX: 4,
    DEBRIS_GRAVITY_Y: 10,
    DEBRIS_OPACITY_START: 0.8,
    
    // Spark effects
    SPARKS_COUNT: 15,
    SPARKS_LIFE: 800,
    SPARKS_SPREAD: 0.8, // fraction of PI
    SPARKS_VELOCITY_MIN: 100,
    SPARKS_VELOCITY_MAX: 200,
    SPARKS_SIZE_MIN: 1,
    SPARKS_SIZE_MAX: 3,
    SPARKS_GRAVITY_Y: 50,
    
    // Energy recharge effects
    ENERGY_RECHARGE_COUNT: 12,
    ENERGY_RECHARGE_LIFE: 1200,
    ENERGY_RECHARGE_VELOCITY_MIN: 30,
    ENERGY_RECHARGE_VELOCITY_MAX: 60,
    ENERGY_RECHARGE_SIZE_MIN: 2,
    ENERGY_RECHARGE_SIZE_MAX: 5,
    ENERGY_RECHARGE_GRAVITY_Y: -15, // Upward drift
    
    // General particle system
    POSITION_OFFSET: 10,
    SIZE_MIN_RENDER: 0.5,
    FRAME_TIME: 16, // ~60fps
    DELTA_TIME_60FPS: 1 / 60,
    EMISSION_TIME_MS: 1000,
    RANDOM_OFFSET_RANGE: 0.5
};

// Weapon System Constants
export const WEAPONS = {
    // Laser weapon
    LASER_FIRE_RATE: 300, // milliseconds between shots
    LASER_RANGE: 500,     // laser beam length in pixels
    LASER_COLOR: '#ff0000',
    LASER_GLOW_COLOR: '#ffaaaa',
    LASER_WIDTH: 3,
    LASER_DURATION: '0.2s',
    
    // Energy system
    MAX_ENERGY: 100,      // Maximum energy capacity
    ENERGY_COST: 20,      // Energy cost per laser shot
    ENERGY_REGEN_RATE: 15, // Energy regenerated per second
    LOW_ENERGY_THRESHOLD: 15, // Below this, visual warning appears
    ENERGY_RECHARGE_SOUND_THRESHOLD: 80, // Above this, play recharge complete sound
    BOOST_ENERGY_COST: 20, // Energy cost per second for boost
    
    // Laser projectiles
    LASER_SPEED: 800,     // pixels per second
    LASER_DAMAGE: 25,     // base damage per laser hit
    LASER_LIFETIME: 2000, // milliseconds before laser expires
    
    // Laser impact effects
    IMPACT_SIZE: 12,
    IMPACT_COLOR: '#ffff00',
    IMPACT_RING_COLOR: '#ff8800',
    IMPACT_DURATION: '0.5s',
    
    // Explosion effects on hit
    HIT_PARTICLE_COUNT: 20,
    HIT_COLOR: '#ff8800',
    HIT_VELOCITY_MIN: 40,
    HIT_VELOCITY_MAX: 100,
    
    // Weapon charge indicator
    CHARGE_INDICATOR_MAX_RADIUS: 15,
    CHARGE_INDICATOR_MIN_RADIUS: 2,
    CHARGE_INDICATOR_GLOW_OFFSET: 4,
    CHARGE_INDICATOR_MIN_OPACITY: 0.2,
    CHARGE_INDICATOR_GLOW_OPACITY: 0.5,
    CHARGE_INDICATOR_DASH_THRESHOLD: 0.3,
    CHARGE_CORE_THRESHOLD: 0.7,
    CHARGE_PULSE_THRESHOLD: 0.9,
    CHARGE_CORE_OPACITY_DIVISOR: 0.3,
    
    // Charge indicator color transition thresholds
    CHARGE_COLOR_LOW_THRESHOLD: 0.33,
    CHARGE_COLOR_MEDIUM_THRESHOLD: 0.66,
    
    // Low energy warning animation
    LOW_ENERGY_WARNING_THRESHOLD: 0.15, // 15% energy
    LOW_ENERGY_PULSE_DURATION: '0.8s',
    LOW_ENERGY_PULSE_OPACITY_MIN: 0.3,
    LOW_ENERGY_PULSE_OPACITY_MAX: 1.0,
    
    // Color component values for smooth transitions
    CHARGE_COLOR_RED_FULL: 255,
    CHARGE_COLOR_RED_DIM: 100,
    CHARGE_COLOR_GREEN_FULL: 255,
    CHARGE_COLOR_GREEN_DIM: 100,
    CHARGE_COLOR_BLUE_FULL: 255,
    CHARGE_COLOR_BLUE_DIM: 100,
    CHARGE_COLOR_RANGE: 155,
    CHARGE_COLOR_GLOW_DIM: 50,
    CHARGE_COLOR_GLOW_MED: 150,
    CHARGE_COLOR_GLOW_RANGE_SMALL: 50,
    CHARGE_COLOR_GLOW_RANGE_LARGE: 105,
    CHARGE_COLOR_HIGH_ENERGY_FRACTION: 0.34,
    
    // Weapon heating system
    MAX_HEAT: 100,           // Maximum heat capacity
    HEAT_PER_SHOT: 15,       // Heat generated per laser shot
    HEAT_DISSIPATION_RATE: 25, // Heat dissipated per second
    OVERHEAT_THRESHOLD: 85,  // Above this, weapon overheats
    COOLDOWN_DURATION: 2000, // Milliseconds weapon is disabled when overheated
    HEAT_WARNING_THRESHOLD: 70, // Above this, show heating warning
    
    // Heat indicator visual effects
    HEAT_INDICATOR_OFFSET: 20, // Distance from weapon charge indicator
    HEAT_BAR_WIDTH: 30,
    HEAT_BAR_HEIGHT: 4,
    HEAT_WARNING_PULSE_DURATION: '0.6s',
    HEAT_COLOR_TRANSITION_MID: 0.5,
    HEAT_COLOR_MAX: 255,
    HEAT_WARNING_BORDER_OFFSET: 2,
    HEAT_WARNING_BORDER_EXTRA: 4
};

// Resource Collection Constants
export const RESOURCES = {
    // Asteroid resource drops
    RESOURCE_SIZE_DIVIDER: 15,
    RESOURCE_BASE_QUANTITY: 1,
    
    // Resource pickup animation
    PICKUP_OPACITY_DECAY: 0.02,
    PICKUP_FLOAT_SPEED: 1,
    
    // Resource types available from asteroids
    ASTEROID_RESOURCE_TYPES: ['ore-iron', 'ore-copper']
};

// Asteroid Damage Indicator Constants
export const ASTEROID_DAMAGE = {
    // Damage ring appearance
    DEFAULT_RING_OPACITY: 0.8,
    DEFAULT_RING_WIDTH: 3,
    RING_RADIUS_OFFSET: 15,
    
    // Animation timing
    CLEANUP_DELAY_MS: 100,
    ANIMATION_DELAY_MULTIPLIER: 1000
};

// Social System Constants
export const SOCIAL = {
    // Player list timing
    RECENT_PLAYER_CUTOFF_MINUTES: 5,
    PLAYER_CLEANUP_CUTOFF_MINUTES: 30,
    
    // Time constants
    SECONDS_PER_MINUTE: 60,
    SECONDS_PER_HOUR: 3600,
    SECONDS_PER_DAY: 86400,
    MILLISECONDS_PER_SECOND: 1000,
    
    // Default max values for percentage calculations
    DEFAULT_MAX_HEALTH: 100,
    DEFAULT_MAX_SHIELD: 100
};

// Network and Multiplayer Constants
export const NETWORK = {
    // WebSocket connection settings
    DEFAULT_SERVER_URL: 'ws://localhost:8080',
    WEBSOCKET_NORMAL_CLOSE_CODE: 1000,
    MAX_RECONNECT_ATTEMPTS: 5,
    INITIAL_RECONNECT_DELAY: 1000, // 1 second
    MAX_RECONNECT_DELAY: 30000, // 30 seconds
    RECONNECT_BACKOFF_MULTIPLIER: 2,
    
    // Heartbeat and keep-alive
    HEARTBEAT_INTERVAL: 5000, // 5 seconds
    HEARTBEAT_TIMEOUT: 10000, // 10 seconds
    CONNECTION_TIMEOUT: 30000, // 30 seconds
    
    // Player identification
    PLAYER_ID_SUBSTR_START: 2,
    PLAYER_ID_SUBSTR_LENGTH: 9,
    PLAYER_ID_RADIX: 36, // Base36 encoding
    
    // Message rate limiting
    MESSAGE_RATE_LIMIT: 50, // messages per second
    MOVEMENT_UPDATE_RATE: 20, // updates per second
    POSITION_SYNC_INTERVAL: 100, // milliseconds
    
    // Latency compensation
    INTERPOLATION_DELAY: 100, // milliseconds
    PREDICTION_TIME: 50, // milliseconds
    LAG_COMPENSATION_THRESHOLD: 200, // milliseconds
    
    // Game state synchronization
    FULL_STATE_SYNC_INTERVAL: 5000, // 5 seconds
    DELTA_STATE_SYNC_INTERVAL: 100, // 100 milliseconds
    SNAPSHOT_BUFFER_SIZE: 64,
    
    // Chat and communication
    MAX_CHAT_MESSAGE_LENGTH: 256,
    CHAT_RATE_LIMIT: 5, // messages per second
    CHAT_HISTORY_SIZE: 100,
    
    // Server discovery and rooms
    MAX_ROOM_PLAYERS: 32,
    DEFAULT_ROOM_NAME: 'Sector-Alpha',
    ROOM_LIST_REFRESH_INTERVAL: 30000, // 30 seconds
    
    // Bandwidth optimization
    POSITION_PRECISION: 2, // decimal places for coordinates
    ROTATION_PRECISION: 1, // decimal places for rotation
    VELOCITY_PRECISION: 1, // decimal places for velocity
    
    // Message types
    MESSAGE_TYPES: {
        PLAYER_JOIN: 'player_join',
        PLAYER_LEAVE: 'player_leave',
        PLAYER_MOVE: 'player_move',
        PLAYER_FIRE: 'player_fire',
        PLAYER_DAMAGE: 'player_damage',
        GAME_STATE: 'game_state',
        CHAT_MESSAGE: 'chat_message',
        HEARTBEAT: 'heartbeat',
        PING: 'ping',
        PONG: 'pong',
        ROOM_JOIN: 'room_join',
        ROOM_LEAVE: 'room_leave',
        TRADE_REQUEST: 'trade_request',
        TRADE_RESPONSE: 'trade_response',
        ERROR: 'error'
    },
    
    // Connection states
    CONNECTION_STATES: {
        DISCONNECTED: 'disconnected',
        CONNECTING: 'connecting',
        CONNECTED: 'connected',
        RECONNECTING: 'reconnecting',
        ERROR: 'error'
    }
};

// World Generation Constants
export const WORLD_GEN = {
    // Star system generation
    MAX_PLANETS: 6,
    MIN_PLANETS: 1,
    STARTING_ORBIT_DISTANCE: 150,
    MIN_ORBIT_SPACING: 100,
    MAX_ORBIT_SPACING: 200,
    
    // Asteroid belts
    MAX_ASTEROID_BELTS: 2,
    MIN_ASTEROID_BELT_DISTANCE: 300,
    MAX_ASTEROID_BELT_DISTANCE: 800,
    BELT_SPREAD: 100,
    MIN_ASTEROIDS_PER_BELT: 20,
    MAX_ASTEROIDS_PER_BELT: 50,
    MIN_ASTEROID_SIZE: 5,
    MAX_ASTEROID_SIZE: 25,
    
    // Space stations
    MIN_SPACE_STATIONS: 1,
    MAX_SPACE_STATIONS: 3,
    MIN_STATION_DISTANCE: 200,
    MAX_STATION_DISTANCE: 600,
    MIN_DOCKING_BAYS: 2,
    MAX_DOCKING_BAYS: 7,
    MIN_STATION_POPULATION: 500,
    MAX_STATION_POPULATION: 10000,
    
    // Jump gates
    MIN_JUMP_GATES: 1,
    MAX_JUMP_GATES: 4,
    MIN_JUMP_GATE_DISTANCE: 400,
    MAX_JUMP_GATE_DISTANCE: 1000,
    MIN_JUMP_GATE_SIZE: 20,
    MAX_JUMP_GATE_SIZE: 30,
    MIN_ENERGY_COST: 50,
    MAX_ENERGY_COST: 100,
    GATE_ACTIVE_PROBABILITY: 0.9,
    
    // Orbital mechanics
    PLANET_BASE_ORBIT_SPEED: 0.01,
    ASTEROID_BASE_ORBIT_SPEED: 0.005,
    
    // Resource generation
    RESOURCE_SPAWN_PROBABILITY: 0.7,
    ASTEROID_RESOURCE_PROBABILITY: 0.4,
    MIN_RESOURCE_ABUNDANCE: 10,
    MAX_RESOURCE_ABUNDANCE: 120,
    MIN_ASTEROID_ABUNDANCE: 10,
    MAX_ASTEROID_ABUNDANCE: 60,
    
    // Station inventory
    MIN_STATION_STOCK: 20,
    MAX_STATION_STOCK: 100,
    MIN_BUY_PRICE: 50,
    MAX_BUY_PRICE: 500,
    MIN_SELL_PRICE: 30,
    MAX_SELL_PRICE: 300,
    
    // Star properties
    STAR_TEMPERATURE_REFERENCE: 5800, // Sun temperature for luminosity calculation
    
    // Moon generation
    MAX_MOONS_PER_PLANET: 3,
    MOON_BASE_DISTANCE_MULTIPLIER: 30,
    MOON_ORBIT_SPACING: 20,
    MOON_ORBIT_RANDOMNESS: 15,
    MOON_MIN_SIZE_RATIO: 0.1,
    MOON_MAX_SIZE_RATIO: 0.3,
    MOON_TIDAL_LOCK_PROBABILITY: 0.7,
    MOON_RESOURCE_SPAWN_MULTIPLIER: 0.8,
    MOON_RESOURCE_ABUNDANCE_MULTIPLIER: 0.6,
    MOON_RESOURCE_ABUNDANCE_MIN_MULTIPLIER: 0.5,
    FULL_CIRCLE_DEGREES: 360,
    ROTATION_SPEED_VARIANCE: 0.5,
    BELT_CENTER_OFFSET: 0.5,
    STATION_NAME_MAX_NUMBER: 999,
    GATE_NAME_MAX_NUMBER: 26,
    
    // Interaction distances
    DEFAULT_INTERACTION_RANGE: 100
};