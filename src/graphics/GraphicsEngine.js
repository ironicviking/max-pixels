/**
 * SVG Graphics Engine for Max-Pixels
 * Core utilities for creating and manipulating SVG graphics
 */

import { GRAPHICS } from '../constants.js';

export class GraphicsEngine {
    constructor(svgContainer) {
        this.svg = svgContainer;
        this.layers = new Map();
        this.defs = this.svg.querySelector('defs') || this.createDefs();
        this.idCounter = 0;
    }
    
    createDefs() {
        const defs = this.createElement('defs');
        this.svg.appendChild(defs);
        return defs;
    }
    
    createElement(type) {
        return document.createElementNS('http://www.w3.org/2000/svg', type);
    }
    
    generateId(prefix = 'element') {
        return `${prefix}_${++this.idCounter}`;
    }
    
    createLayer(name, zIndex = 0) {
        const layer = this.createElement('g');
        layer.setAttribute('id', `layer_${name}`);
        layer.setAttribute('data-layer', name);
        layer.style.zIndex = zIndex;
        this.layers.set(name, layer);
        this.svg.appendChild(layer);
        return layer;
    }
    
    getLayer(name) {
        if (this.layers.has(name)) {
            return this.layers.get(name);
        }
        return this.createLayer(name);
    }
    
    createCircle(cx, cy, r, attributes = {}) {
        const circle = this.createElement('circle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', r);
        
        Object.entries(attributes).forEach(([key, value]) => {
            circle.setAttribute(key, value);
        });
        
        return circle;
    }
    
    createRect(x, y, width, height, attributes = {}) {
        const rect = this.createElement('rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        
        Object.entries(attributes).forEach(([key, value]) => {
            rect.setAttribute(key, value);
        });
        
        return rect;
    }
    
    createPath(d, attributes = {}) {
        const path = this.createElement('path');
        path.setAttribute('d', d);
        
        Object.entries(attributes).forEach(([key, value]) => {
            path.setAttribute(key, value);
        });
        
        return path;
    }
    
    createGroup(attributes = {}) {
        const group = this.createElement('g');
        
        Object.entries(attributes).forEach(([key, value]) => {
            group.setAttribute(key, value);
        });
        
        return group;
    }
    
    createGradient(type, stops, attributes = {}) {
        const gradientId = this.generateId('gradient');
        const gradient = this.createElement(type === 'radial' ? 'radialGradient' : 'linearGradient');
        gradient.setAttribute('id', gradientId);
        
        Object.entries(attributes).forEach(([key, value]) => {
            gradient.setAttribute(key, value);
        });
        
        stops.forEach(stop => {
            const stopElement = this.createElement('stop');
            stopElement.setAttribute('offset', stop.offset);
            stopElement.setAttribute('stop-color', stop.color);
            if (stop.opacity !== undefined) {
                stopElement.setAttribute('stop-opacity', stop.opacity);
            }
            gradient.appendChild(stopElement);
        });
        
        this.defs.appendChild(gradient);
        return gradientId;
    }
    
    createStarField(count, bounds = { width: GRAPHICS.DEFAULT_CANVAS_WIDTH, height: GRAPHICS.DEFAULT_CANVAS_HEIGHT }) {
        const starField = this.createGroup({ id: 'starField' });
        
        for (let i = 0; i < count; i++) {
            const x = Math.random() * bounds.width;
            const y = Math.random() * bounds.height;
            
            // Select star type based on realistic stellar distribution
            const starType = this.selectStarType();
            const starData = GRAPHICS.STAR_TYPES[starType];
            
            // Calculate star size based on type and random variation
            const baseSize = Math.random() * (GRAPHICS.STAR_SIZE_MAX - GRAPHICS.STAR_SIZE_MIN) + GRAPHICS.STAR_SIZE_MIN;
            const starSize = baseSize * starData.sizeMultiplier;
            
            // Create main star
            const star = this.createStar(x, y, starSize, starData.color, starType);
            starField.appendChild(star);
            
            // Small chance to create binary star system
            if (Math.random() < GRAPHICS.STAR_BINARY_CHANCE) {
                const companionType = this.selectStarType();
                const companionData = GRAPHICS.STAR_TYPES[companionType];
                const companionSize = baseSize * GRAPHICS.STAR_COMPANION_SIZE_RATIO * companionData.sizeMultiplier;
                
                const angle = Math.random() * Math.PI * GRAPHICS.FULL_CIRCLE;
                const companionX = x + Math.cos(angle) * GRAPHICS.STAR_BINARY_SEPARATION;
                const companionY = y + Math.sin(angle) * GRAPHICS.STAR_BINARY_SEPARATION;
                
                const companionStar = this.createStar(companionX, companionY, companionSize, companionData.color, companionType);
                starField.appendChild(companionStar);
            }
        }
        
        return starField;
    }
    
    selectStarType() {
        // Use weighted random selection based on stellar rarity distribution
        const rand = Math.random() * GRAPHICS.STAR_CUMULATIVE_RARITY;
        let cumulative = 0;
        
        for (const [type, data] of Object.entries(GRAPHICS.STAR_TYPES)) {
            cumulative += data.rarity;
            if (rand <= cumulative) {
                return type;
            }
        }
        
        return 'M'; // Fallback to most common type
    }
    
    createStar(x, y, size, color, type) {
        const opacity = Math.random() * (GRAPHICS.STAR_OPACITY_MAX - GRAPHICS.STAR_OPACITY_MIN) + GRAPHICS.STAR_OPACITY_MIN;
        
        // Create star group for effects
        const starGroup = this.createGroup({
            transform: `translate(${x}, ${y})`
        });
        
        // Main star circle
        const star = this.createCircle(0, 0, size, {
            fill: color,
            opacity: opacity,
            'data-star-type': type
        });
        
        // Add subtle glow effect for larger/brighter stars
        if (size > GRAPHICS.MATH_PI_MULTIPLIER || type === 'O' || type === 'B') {
            const glow = this.createCircle(0, 0, size * GRAPHICS.RATIO_BINARY_SEPARATION, {
                fill: color,
                opacity: opacity * GRAPHICS.RATIO_SIZE_SMALL,
                filter: 'blur(1px)'
            });
            starGroup.appendChild(glow);
        }
        
        starGroup.appendChild(star);
        
        // Add twinkling animation to some stars
        if (Math.random() < GRAPHICS.STAR_TWINKLE_CHANCE) {
            this.addTwinkleAnimation(star);
        }
        
        return starGroup;
    }
    
    addTwinkleAnimation(star) {
        const animate = this.createElement('animate');
        animate.setAttribute('attributeName', 'opacity');
        animate.setAttribute('values', `${star.getAttribute('opacity')};${parseFloat(star.getAttribute('opacity')) * (1 - GRAPHICS.STAR_TWINKLE_INTENSITY)};${star.getAttribute('opacity')}`);
        animate.setAttribute('dur', `${GRAPHICS.STAR_TWINKLE_MIN_DURATION + Math.random() * GRAPHICS.STAR_TWINKLE_MAX_DURATION}s`);
        animate.setAttribute('repeatCount', 'indefinite');
        
        star.appendChild(animate);
    }
    
    createAsteroidField(count, bounds = { width: GRAPHICS.DEFAULT_CANVAS_WIDTH, height: GRAPHICS.DEFAULT_CANVAS_HEIGHT }) {
        const asteroidField = this.createGroup({ id: 'asteroidField' });
        
        for (let i = 0; i < count; i++) {
            const x = Math.random() * bounds.width;
            const y = Math.random() * bounds.height;
            const size = Math.random() * GRAPHICS.ASTEROID_SIZE_RANGE + GRAPHICS.ASTEROID_SIZE_MIN;
            
            const asteroid = this.createAsteroid(x, y, size);
            asteroidField.appendChild(asteroid);
        }
        
        return asteroidField;
    }
    
    createAsteroid(x, y, size, attributes = {}) {
        const asteroid = this.createGroup({
            transform: `translate(${x}, ${y})`,
            ...attributes
        });
        
        const points = GRAPHICS.ASTEROID_VERTICES + Math.floor(Math.random() * GRAPHICS.ASTEROID_VERTEX_VARIANCE);
        let pathData = '';
        
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * 2 * Math.PI;
            const radius = size * (GRAPHICS.ASTEROID_RADIUS_MIN + Math.random() * GRAPHICS.ASTEROID_RADIUS_MAX);
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;
            
            if (i === 0) {
                pathData += `M ${px} ${py}`;
            } else {
                pathData += ` L ${px} ${py}`;
            }
        }
        pathData += ' Z';
        
        const body = this.createPath(pathData, {
            fill: '#8b7355',
            stroke: '#654321',
            'stroke-width': GRAPHICS.ASTEROID_STROKE_WIDTH,
            opacity: GRAPHICS.ASTEROID_OPACITY
        });
        
        const highlight = this.createPath(pathData, {
            fill: 'none',
            stroke: '#a0926b',
            'stroke-width': GRAPHICS.ASTEROID_HIGHLIGHT_WIDTH,
            opacity: GRAPHICS.ASTEROID_HIGHLIGHT_OPACITY,
            transform: `translate(-${size * GRAPHICS.ASTEROID_HIGHLIGHT_OFFSET}, -${size * GRAPHICS.ASTEROID_HIGHLIGHT_OFFSET})`
        });
        
        asteroid.appendChild(body);
        asteroid.appendChild(highlight);
        
        return asteroid;
    }
    
    createSpaceship(x, y, size = GRAPHICS.SPACESHIP_DEFAULT_SIZE, attributes = {}) {
        const ship = this.createGroup({
            transform: `translate(${x}, ${y})`,
            ...attributes
        });
        
        const hull = this.createPath(
            `M 0 -${size} L ${size * GRAPHICS.SPACESHIP_HULL_WING_RATIO} ${size} L 0 ${size * GRAPHICS.SPACESHIP_HULL_BODY_RATIO} L -${size * GRAPHICS.SPACESHIP_HULL_WING_RATIO} ${size} Z`,
            {
                fill: '#4a90e2',
                stroke: '#ffffff',
                'stroke-width': GRAPHICS.SPACESHIP_STROKE_WIDTH
            }
        );
        
        const engine = this.createCircle(0, size * GRAPHICS.SPACESHIP_ENGINE_RATIO, size * GRAPHICS.SPACESHIP_ENGINE_SIZE_RATIO, {
            fill: '#ff4444',
            opacity: 0.8
        });
        
        // Main thruster flames
        const mainThruster = this.createGroup({
            id: 'mainThruster',
            opacity: 0
        });
        
        const thrusterFlame1 = this.createPath(
            `M -${size * GRAPHICS.SPACESHIP_THRUSTER_MAIN_WIDTH} ${size * GRAPHICS.SPACESHIP_THRUSTER_OPACITY} L 0 ${size * GRAPHICS.SPACESHIP_THRUSTER_MAIN_HEIGHT} L ${size * GRAPHICS.SPACESHIP_THRUSTER_MAIN_WIDTH} ${size * GRAPHICS.SPACESHIP_THRUSTER_OPACITY} Z`,
            {
                fill: '#ff6600',
                opacity: GRAPHICS.SPACESHIP_THRUSTER_FLAME_OPACITY
            }
        );
        
        const thrusterFlame2 = this.createPath(
            `M -${size * GRAPHICS.SPACESHIP_THRUSTER_CORE_WIDTH} ${size * GRAPHICS.SPACESHIP_THRUSTER_INNER_OPACITY} L 0 ${size * GRAPHICS.SPACESHIP_THRUSTER_CORE_HEIGHT} L ${size * GRAPHICS.SPACESHIP_THRUSTER_CORE_WIDTH} ${size * GRAPHICS.SPACESHIP_THRUSTER_INNER_OPACITY} Z`,
            {
                fill: '#ffaa00',
                opacity: GRAPHICS.SPACESHIP_THRUSTER_INNER_OPACITY
            }
        );
        
        const thrusterCore = this.createPath(
            `M -${Number(size) * GRAPHICS.SPACESHIP_THRUSTER_INNER_WIDTH} ${Number(size) * GRAPHICS.SPACESHIP_THRUSTER_CORE_HEIGHT_OFFSET} L 0 ${Number(size) * GRAPHICS.SPACESHIP_THRUSTER_INNER_HEIGHT} L ${Number(size) * GRAPHICS.SPACESHIP_THRUSTER_INNER_WIDTH} ${Number(size) * GRAPHICS.SPACESHIP_THRUSTER_CORE_HEIGHT_OFFSET} Z`,
            {
                fill: '#ffffff',
                opacity: GRAPHICS.SPACESHIP_THRUSTER_FLAME_OPACITY
            }
        );
        
        mainThruster.appendChild(thrusterFlame1);
        mainThruster.appendChild(thrusterFlame2);
        mainThruster.appendChild(thrusterCore);
        
        // Side thrusters for lateral movement
        const leftThruster = this.createGroup({
            id: 'leftThruster',
            opacity: 0
        });
        
        const leftThrusterFlame = this.createPath(
            `M -${size * GRAPHICS.SPACESHIP_THRUSTER_SIDE_WIDTH} -${size * GRAPHICS.SPACESHIP_THRUSTER_SIDE_HEIGHT} L -${size * GRAPHICS.SPACESHIP_THRUSTER_SIDE_LENGTH} 0 L -${size * GRAPHICS.SPACESHIP_THRUSTER_SIDE_WIDTH} ${size * GRAPHICS.SPACESHIP_THRUSTER_SIDE_HEIGHT} Z`,
            {
                fill: '#0088ff',
                opacity: GRAPHICS.SPACESHIP_THRUSTER_SIDE_OPACITY
            }
        );
        
        leftThruster.appendChild(leftThrusterFlame);
        
        const rightThruster = this.createGroup({
            id: 'rightThruster',
            opacity: 0
        });
        
        const rightThrusterFlame = this.createPath(
            `M ${size * GRAPHICS.SPACESHIP_THRUSTER_SIDE_WIDTH} -${size * GRAPHICS.SPACESHIP_THRUSTER_SIDE_HEIGHT} L ${size * GRAPHICS.SPACESHIP_THRUSTER_SIDE_LENGTH} 0 L ${size * GRAPHICS.SPACESHIP_THRUSTER_SIDE_WIDTH} ${size * GRAPHICS.SPACESHIP_THRUSTER_SIDE_HEIGHT} Z`,
            {
                fill: '#0088ff',
                opacity: GRAPHICS.SPACESHIP_THRUSTER_SIDE_OPACITY
            }
        );
        
        rightThruster.appendChild(rightThrusterFlame);
        
        ship.appendChild(hull);
        ship.appendChild(engine);
        ship.appendChild(mainThruster);
        ship.appendChild(leftThruster);
        ship.appendChild(rightThruster);
        
        return ship;
    }
    
    updateSpaceshipThrusters(shipElement, movement, boost = false) {
        const mainThruster = shipElement.querySelector('#mainThruster');
        const leftThruster = shipElement.querySelector('#leftThruster');
        const rightThruster = shipElement.querySelector('#rightThruster');
        
        if (!mainThruster || !leftThruster || !rightThruster) return;
        
        const baseOpacity = boost ? GRAPHICS.SPACESHIP_THRUSTER_BOOST_OPACITY : GRAPHICS.SPACESHIP_THRUSTER_BASE_OPACITY;
        const fadeSpeed = GRAPHICS.SPACESHIP_THRUSTER_FADE_SPEED;
        
        // Main thruster (forward/backward movement)
        if (movement.y > 0) {
            mainThruster.setAttribute('opacity', baseOpacity);
        } else {
            const currentOpacity = parseFloat(mainThruster.getAttribute('opacity')) || 0;
            const newOpacity = Math.max(0, currentOpacity - fadeSpeed);
            mainThruster.setAttribute('opacity', newOpacity);
        }
        
        // Left thruster (moving right)
        if (movement.x > 0) {
            leftThruster.setAttribute('opacity', baseOpacity * GRAPHICS.SPACESHIP_THRUSTER_SIDE_OPACITY);
        } else {
            const currentOpacity = parseFloat(leftThruster.getAttribute('opacity')) || 0;
            const newOpacity = Math.max(0, currentOpacity - fadeSpeed);
            leftThruster.setAttribute('opacity', newOpacity);
        }
        
        // Right thruster (moving left)
        if (movement.x < 0) {
            rightThruster.setAttribute('opacity', baseOpacity * GRAPHICS.SPACESHIP_THRUSTER_SIDE_OPACITY);
        } else {
            const currentOpacity = parseFloat(rightThruster.getAttribute('opacity')) || 0;
            const newOpacity = Math.max(0, currentOpacity - fadeSpeed);
            rightThruster.setAttribute('opacity', newOpacity);
        }
    }
    
    createPlanet(x, y, radius, attributes = {}) {
        const planet = this.createGroup({
            transform: `translate(${x}, ${y})`,
            ...attributes
        });
        
        const surfaceColor = attributes.surfaceColor || '#8b4513';
        const coreColor = attributes.coreColor || '#654321';
        const atmosphereColor = attributes.atmosphereColor || '#4444ff';
        
        const gradientId = this.createGradient('radial', [
            { offset: '0%', color: surfaceColor },
            { offset: '70%', color: coreColor },
            { offset: '100%', color: '#2c1810' }
        ], {
            cx: '30%',
            cy: '30%'
        });
        
        const body = this.createCircle(0, 0, radius, {
            fill: `url(#${gradientId})`,
            stroke: atmosphereColor,
            'stroke-width': 2,
            opacity: GRAPHICS.RATIO_OPACITY_HIGH
        });
        
        planet.appendChild(body);
        
        // Generate surface features
        this.addPlanetCraters(planet, radius, surfaceColor);
        this.addPlanetContinents(planet, radius, surfaceColor);
        this.addPlanetAtmosphere(planet, radius, atmosphereColor);
        
        return planet;
    }
    
    addPlanetCraters(planet, radius, surfaceColor) {
        const craterCount = GRAPHICS.PLANET_CRATER_MIN + Math.floor(Math.random() * GRAPHICS.PLANET_CRATER_MAX);
        
        for (let i = 0; i < craterCount; i++) {
            const angle = Math.random() * Math.PI * GRAPHICS.FULL_CIRCLE;
            const distance = Math.random() * radius * GRAPHICS.PLANET_CRATER_DISTANCE_MAX;
            const craterX = Math.cos(angle) * distance;
            const craterY = Math.sin(angle) * distance;
            const craterRadius = Math.random() * radius * GRAPHICS.PLANET_CRATER_SIZE_MAX + radius * GRAPHICS.PLANET_CRATER_SIZE_MIN;
            
            // Darker crater base
            const craterBase = this.createCircle(craterX, craterY, craterRadius, {
                fill: this.darkenColor(surfaceColor, GRAPHICS.PLANET_DARKEN_FACTOR),
                opacity: 0.8
            });
            
            // Crater rim highlight
            const craterRim = this.createCircle(craterX, craterY, craterRadius * GRAPHICS.PLANET_CRATER_RIM_RATIO, {
                fill: 'none',
                stroke: this.lightenColor(surfaceColor, GRAPHICS.PLANET_LIGHTEN_FACTOR),
                'stroke-width': 1,
                opacity: 0.6
            });
            
            planet.appendChild(craterBase);
            planet.appendChild(craterRim);
        }
    }
    
    addPlanetContinents(planet, radius, surfaceColor) {
        const continentCount = GRAPHICS.PLANET_CONTINENT_MIN + Math.floor(Math.random() * GRAPHICS.PLANET_CONTINENT_MAX);
        
        for (let i = 0; i < continentCount; i++) {
            const angle = Math.random() * Math.PI * GRAPHICS.FULL_CIRCLE;
            const distance = Math.random() * radius * GRAPHICS.PLANET_CONTINENT_DISTANCE_MAX;
            const continentX = Math.cos(angle) * distance;
            const continentY = Math.sin(angle) * distance;
            
            // Create irregular continent shape
            const points = GRAPHICS.PLANET_CONTINENT_POINTS_MIN + Math.floor(Math.random() * GRAPHICS.PLANET_CONTINENT_POINTS_MAX);
            let pathData = '';
            
            for (let j = 0; j < points; j++) {
                const pointAngle = (j / points) * 2 * Math.PI;
                const pointRadius = radius * (GRAPHICS.PLANET_CONTINENT_RADIUS_MIN + Math.random() * GRAPHICS.PLANET_CONTINENT_RADIUS_MAX);
                const px = continentX + Math.cos(pointAngle) * pointRadius;
                const py = continentY + Math.sin(pointAngle) * pointRadius;
                
                if (j === 0) {
                    pathData += `M ${px} ${py}`;
                } else {
                    pathData += ` L ${px} ${py}`;
                }
            }
            pathData += ' Z';
            
            const continent = this.createPath(pathData, {
                fill: this.lightenColor(surfaceColor, GRAPHICS.PLANET_LIGHTEN_FACTOR),
                opacity: GRAPHICS.PLANET_CONTINENT_OPACITY,
                'clip-path': `circle(${radius}px at 0px 0px)`
            });
            
            planet.appendChild(continent);
        }
    }
    
    addPlanetAtmosphere(planet, radius, atmosphereColor) {
        // Atmospheric glow
        const atmosphereGradient = this.createGradient('radial', [
            { offset: '85%', color: atmosphereColor, opacity: 0 },
            { offset: '100%', color: atmosphereColor, opacity: 0.3 }
        ], {
            cx: '50%',
            cy: '50%'
        });
        
        const atmosphere = this.createCircle(0, 0, radius * GRAPHICS.GLOW_INTENSITY, {
            fill: `url(#${atmosphereGradient})`,
            opacity: 0.6
        });
        
        planet.appendChild(atmosphere);
    }
    
    darkenColor(color, factor) {
        // Simple color darkening (works for hex colors)
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            const r = Math.floor(parseInt(hex.slice(GRAPHICS.HEX_RED_START, GRAPHICS.HEX_RED_END), 16) * (1 - factor));
            const g = Math.floor(parseInt(hex.slice(GRAPHICS.HEX_GREEN_START, GRAPHICS.HEX_GREEN_END), 16) * (1 - factor));
            const b = Math.floor(parseInt(hex.slice(GRAPHICS.HEX_BLUE_START, GRAPHICS.HEX_BLUE_END), 16) * (1 - factor));
            return `rgb(${r}, ${g}, ${b})`;
        }
        return color;
    }
    
    lightenColor(color, factor) {
        // Simple color lightening (works for hex colors)
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            const r = Math.min(GRAPHICS.COLOR_MAX, Math.floor(parseInt(hex.slice(GRAPHICS.HEX_RED_START, GRAPHICS.HEX_RED_END), 16) * (1 + factor)));
            const g = Math.min(GRAPHICS.COLOR_MAX, Math.floor(parseInt(hex.slice(GRAPHICS.HEX_GREEN_START, GRAPHICS.HEX_GREEN_END), 16) * (1 + factor)));
            const b = Math.min(GRAPHICS.COLOR_MAX, Math.floor(parseInt(hex.slice(GRAPHICS.HEX_BLUE_START, GRAPHICS.HEX_BLUE_END), 16) * (1 + factor)));
            return `rgb(${r}, ${g}, ${b})`;
        }
        return color;
    }
    
    createSpaceStation(x, y, size = GRAPHICS.STATION_DEFAULT_SIZE, attributes = {}) {
        const station = this.createGroup({
            transform: `translate(${x}, ${y})`,
            ...attributes
        });
        
        // Central hub
        const hub = this.createCircle(0, 0, size * GRAPHICS.STATION_HUB_RATIO, {
            fill: '#666666',
            stroke: '#aaaaaa',
            'stroke-width': 2
        });
        
        // Rotating ring
        const ring = this.createCircle(0, 0, size * GRAPHICS.STATION_RING_RATIO, {
            fill: 'none',
            stroke: '#888888',
            'stroke-width': size * GRAPHICS.STATION_RING_WIDTH,
            opacity: GRAPHICS.STATION_RING_OPACITY
        });
        
        // Docking ports (4 directions)
        for (let i = 0; i < GRAPHICS.STATION_DOCKING_PORTS; i++) {
            const angle = (i * GRAPHICS.ANGLE_90) * Math.PI / GRAPHICS.ANGLE_180;
            const portX = Math.cos(angle) * size;
            const portY = Math.sin(angle) * size;
            
            const port = this.createRect(
                portX - size * GRAPHICS.STATION_PORT_WIDTH, 
                portY - size * GRAPHICS.STATION_PORT_HEIGHT, 
                size * GRAPHICS.STATION_PORT_LENGTH, 
                size * GRAPHICS.STATION_PORT_WIDTH, 
                {
                    fill: '#4a90e2',
                    stroke: '#ffffff',
                    'stroke-width': 1,
                    transform: `rotate(${i * GRAPHICS.ANGLE_90}, ${portX}, ${portY})`
                }
            );
            
            station.appendChild(port);
        }
        
        // Solar panels
        for (let i = 0; i < GRAPHICS.STATION_SOLAR_PANELS; i++) {
            const angle = (i * GRAPHICS.ANGLE_60) * Math.PI / GRAPHICS.ANGLE_180;
            const panelX = Math.cos(angle) * size * GRAPHICS.STATION_PANEL_DISTANCE;
            const panelY = Math.sin(angle) * size * GRAPHICS.STATION_PANEL_DISTANCE;
            
            const panel = this.createRect(
                panelX - size * GRAPHICS.STATION_PANEL_WIDTH, 
                panelY - size * GRAPHICS.STATION_PANEL_HEIGHT, 
                size * GRAPHICS.STATION_PANEL_LENGTH, 
                size * GRAPHICS.STATION_PANEL_WIDTH, 
                {
                    fill: '#1a1a3a',
                    stroke: '#4444ff',
                    'stroke-width': 1,
                    opacity: GRAPHICS.STATION_PANEL_OPACITY,
                    transform: `rotate(${i * GRAPHICS.ANGLE_60}, ${panelX}, ${panelY})`
                }
            );
            
            station.appendChild(panel);
        }
        
        // Communications array
        const commArray = this.createRect(-size * GRAPHICS.STATION_COMM_WIDTH, -size * GRAPHICS.STATION_COMM_HEIGHT, size * GRAPHICS.STATION_COMM_LENGTH, size * GRAPHICS.STATION_COMM_WIDTH_RATIO, {
            fill: '#cccccc',
            stroke: '#ffffff',
            'stroke-width': 1
        });
        
        station.appendChild(hub);
        station.appendChild(ring);
        station.appendChild(commArray);
        
        // Navigation lights
        const navLight1 = this.createCircle(-size * 0.7, 0, size * 0.08, {
            fill: '#ff4444',
            opacity: 0.8
        });
        const navLight2 = this.createCircle(size * 0.7, 0, size * 0.08, {
            fill: '#44ff44',
            opacity: 0.8
        });
        
        station.appendChild(navLight1);
        station.appendChild(navLight2);
        
        return station;
    }
    
    createJumpGate(x, y, size = 40, attributes = {}) {
        const gate = this.createGroup({
            transform: `translate(${x}, ${y})`,
            ...attributes
        });
        
        // Outer ring - energy field
        const outerRing = this.createCircle(0, 0, size, {
            fill: 'none',
            stroke: '#00ffff',
            'stroke-width': size * 0.08,
            opacity: 0.7,
            'stroke-dasharray': `${size * 0.3} ${size * 0.1}`
        });
        
        // Inner ring - stable structure
        const innerRing = this.createCircle(0, 0, size * 0.7, {
            fill: 'none',
            stroke: '#ffffff',
            'stroke-width': size * 0.04,
            opacity: GRAPHICS.RATIO_OPACITY_HIGH
        });
        
        // Core energy field
        const core = this.createCircle(0, 0, size * 0.5, {
            fill: '#00ffff',
            opacity: 0.2,
            'fill-rule': 'evenodd'
        });
        
        // Support struts (4 directions)
        for (let i = 0; i < 4; i++) {
            const angle = (i * GRAPHICS.ANGLE_90) * Math.PI / GRAPHICS.ANGLE_180;
            const strutStartX = Math.cos(angle) * size * 0.7;
            const strutStartY = Math.sin(angle) * size * 0.7;
            const strutEndX = Math.cos(angle) * size * 1.1;
            const strutEndY = Math.sin(angle) * size * 1.1;
            
            const strut = this.createElement('line');
            strut.setAttribute('x1', strutStartX);
            strut.setAttribute('y1', strutStartY);
            strut.setAttribute('x2', strutEndX);
            strut.setAttribute('y2', strutEndY);
            strut.setAttribute('stroke', '#aaaaaa');
            strut.setAttribute('stroke-width', size * 0.06);
            
            gate.appendChild(strut);
        }
        
        // Energy particles (small circles that rotate around the gate)
        const particleGroup = this.createGroup({
            id: `particles_${this.generateId('gate')}`
        });
        
        for (let i = 0; i < 8; i++) {
            const angle = (i * GRAPHICS.ANGLE_45) * Math.PI / GRAPHICS.ANGLE_180;
            const particleX = Math.cos(angle) * size * 0.85;
            const particleY = Math.sin(angle) * size * 0.85;
            
            const particle = this.createCircle(particleX, particleY, size * 0.05, {
                fill: '#00ffff',
                opacity: 0.8
            });
            
            particleGroup.appendChild(particle);
        }
        
        // Add rotation animation to particles
        const rotateParticles = this.createElement('animateTransform');
        rotateParticles.setAttribute('attributeName', 'transform');
        rotateParticles.setAttribute('type', 'rotate');
        rotateParticles.setAttribute('values', '0 0 0;360 0 0');
        rotateParticles.setAttribute('dur', '4s');
        rotateParticles.setAttribute('repeatCount', 'indefinite');
        
        particleGroup.appendChild(rotateParticles);
        gate.appendChild(particleGroup);
        
        gate.appendChild(core);
        gate.appendChild(innerRing);
        gate.appendChild(outerRing);
        
        // Add pulsing animation to outer ring
        const animateOpacity = this.createElement('animate');
        animateOpacity.setAttribute('attributeName', 'opacity');
        animateOpacity.setAttribute('values', '0.4;0.9;0.4');
        animateOpacity.setAttribute('dur', '2s');
        animateOpacity.setAttribute('repeatCount', 'indefinite');
        
        outerRing.appendChild(animateOpacity);
        
        // Add pulsing animation to core energy field
        const coreAnimation = this.createElement('animate');
        coreAnimation.setAttribute('attributeName', 'opacity');
        coreAnimation.setAttribute('values', '0.1;0.3;0.1');
        coreAnimation.setAttribute('dur', '3s');
        coreAnimation.setAttribute('repeatCount', 'indefinite');
        
        core.appendChild(coreAnimation);
        
        return gate;
    }
    
    addToLayer(layerName, element) {
        const layer = this.getLayer(layerName);
        layer.appendChild(element);
        return element;
    }
    
    clear() {
        this.svg.innerHTML = '';
        this.layers.clear();
        this.defs = this.createDefs();
        this.idCounter = 0;
    }
    
    remove(element) {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }
    
    createLaserBeam(startX, startY, endX, endY, attributes = {}) {
        const laser = this.createGroup({
            id: this.generateId('laser'),
            ...attributes
        });
        
        // Main laser beam
        const beam = this.createElement('line');
        beam.setAttribute('x1', startX);
        beam.setAttribute('y1', startY);
        beam.setAttribute('x2', endX);
        beam.setAttribute('y2', endY);
        beam.setAttribute('stroke', attributes.color || '#ff0000');
        beam.setAttribute('stroke-width', attributes.width || 3);
        beam.setAttribute('opacity', 0.9);
        beam.setAttribute('stroke-linecap', 'round');
        
        // Outer glow effect
        const glow = this.createElement('line');
        glow.setAttribute('x1', startX);
        glow.setAttribute('y1', startY);
        glow.setAttribute('x2', endX);
        glow.setAttribute('y2', endY);
        glow.setAttribute('stroke', attributes.glowColor || '#ffaaaa');
        glow.setAttribute('stroke-width', (attributes.width || 3) * 2);
        glow.setAttribute('opacity', 0.3);
        glow.setAttribute('stroke-linecap', 'round');
        
        // Inner core
        const core = this.createElement('line');
        core.setAttribute('x1', startX);
        core.setAttribute('y1', startY);
        core.setAttribute('x2', endX);
        core.setAttribute('y2', endY);
        core.setAttribute('stroke', '#ffffff');
        core.setAttribute('stroke-width', 1);
        core.setAttribute('opacity', 0.8);
        core.setAttribute('stroke-linecap', 'round');
        
        laser.appendChild(glow);
        laser.appendChild(beam);
        laser.appendChild(core);
        
        // Animate the laser - fade in quickly, then fade out
        const fadeAnimation = this.createElement('animate');
        fadeAnimation.setAttribute('attributeName', 'opacity');
        fadeAnimation.setAttribute('values', '0;1;1;0');
        fadeAnimation.setAttribute('dur', attributes.duration || '0.3s');
        fadeAnimation.setAttribute('fill', 'freeze');
        
        laser.appendChild(fadeAnimation);
        
        // Auto-remove after animation
        setTimeout(() => {
            this.remove(laser);
        }, parseFloat(attributes.duration || '0.3') * 1000 + 100);
        
        return laser;
    }
    
    createLaserImpact(x, y, attributes = {}) {
        const impact = this.createGroup({
            id: this.generateId('impact'),
            transform: `translate(${x}, ${y})`
        });
        
        // Central flash
        const flash = this.createCircle(0, 0, attributes.size || 8, {
            fill: attributes.color || '#ffff00',
            opacity: GRAPHICS.RATIO_OPACITY_HIGH
        });
        
        // Outer ring
        const ring = this.createCircle(0, 0, (attributes.size || 8) * 1.5, {
            fill: 'none',
            stroke: attributes.ringColor || '#ff8800',
            'stroke-width': 2,
            opacity: 0.7
        });
        
        // Spark particles
        for (let i = 0; i < 6; i++) {
            const angle = (i * GRAPHICS.ANGLE_60) * Math.PI / GRAPHICS.ANGLE_180;
            const sparkDistance = (attributes.size || 8) * 2;
            const sparkX = Math.cos(angle) * sparkDistance;
            const sparkY = Math.sin(angle) * sparkDistance;
            
            const spark = this.createElement('line');
            spark.setAttribute('x1', 0);
            spark.setAttribute('y1', 0);
            spark.setAttribute('x2', sparkX);
            spark.setAttribute('y2', sparkY);
            spark.setAttribute('stroke', '#ffffff');
            spark.setAttribute('stroke-width', 1);
            spark.setAttribute('opacity', 0.8);
            spark.setAttribute('stroke-linecap', 'round');
            
            impact.appendChild(spark);
        }
        
        impact.appendChild(ring);
        impact.appendChild(flash);
        
        // Animate the impact - quick flash and expansion
        const scaleAnimation = this.createElement('animateTransform');
        scaleAnimation.setAttribute('attributeName', 'transform');
        scaleAnimation.setAttribute('type', 'scale');
        scaleAnimation.setAttribute('values', '0 0;1.5 1.5;0.5 0.5');
        scaleAnimation.setAttribute('dur', attributes.duration || '0.4s');
        scaleAnimation.setAttribute('fill', 'freeze');
        scaleAnimation.setAttribute('additive', 'sum');
        
        const opacityAnimation = this.createElement('animate');
        opacityAnimation.setAttribute('attributeName', 'opacity');
        opacityAnimation.setAttribute('values', '0;1;0');
        opacityAnimation.setAttribute('dur', attributes.duration || '0.4s');
        opacityAnimation.setAttribute('fill', 'freeze');
        
        impact.appendChild(scaleAnimation);
        impact.appendChild(opacityAnimation);
        
        // Auto-remove after animation
        setTimeout(() => {
            this.remove(impact);
        }, parseFloat(attributes.duration || '0.4') * 1000 + 100);
        
        return impact;
    }
    
    createProjectile(x, y, type = 'plasma', attributes = {}) {
        const projectile = this.createGroup({
            id: this.generateId('projectile'),
            transform: `translate(${x}, ${y})`,
            ...attributes
        });
        
        if (type === 'plasma') {
            const core = this.createCircle(0, 0, 3, {
                fill: '#00ffff',
                opacity: GRAPHICS.RATIO_OPACITY_HIGH
            });
            
            const glow = this.createCircle(0, 0, 6, {
                fill: '#00aaff',
                opacity: 0.4
            });
            
            const trail = this.createCircle(0, 0, 8, {
                fill: 'none',
                stroke: '#0088ff',
                'stroke-width': 1,
                opacity: 0.2
            });
            
            projectile.appendChild(trail);
            projectile.appendChild(glow);
            projectile.appendChild(core);
            
        } else if (type === 'missile') {
            const body = this.createPath(
                'M -8 0 L 8 -2 L 10 0 L 8 2 Z',
                {
                    fill: '#666666',
                    stroke: '#aaaaaa',
                    'stroke-width': 1
                }
            );
            
            const warhead = this.createCircle(8, 0, 2, {
                fill: '#ff4444',
                opacity: 0.8
            });
            
            const exhaust = this.createPath(
                'M -8 0 L -15 -1 L -12 0 L -15 1 Z',
                {
                    fill: '#ff8800',
                    opacity: 0.7
                }
            );
            
            projectile.appendChild(exhaust);
            projectile.appendChild(body);
            projectile.appendChild(warhead);
            
        } else if (type === 'railgun') {
            const slug = this.createRect(-4, -1, 8, 2, {
                fill: '#ffff00',
                opacity: GRAPHICS.RATIO_OPACITY_HIGH
            });
            
            const field = this.createRect(-6, -2, 12, 4, {
                fill: 'none',
                stroke: '#ffff88',
                'stroke-width': 1,
                opacity: 0.5
            });
            
            projectile.appendChild(field);
            projectile.appendChild(slug);
        }
        
        return projectile;
    }
    
    createExplosion(x, y, size = 20, attributes = {}) {
        const explosion = this.createGroup({
            id: this.generateId('explosion'),
            transform: `translate(${x}, ${y})`
        });
        
        const colors = attributes.colors || ['#ff4444', '#ff8800', '#ffff00', '#ffffff'];
        const rings = 4;
        
        for (let i = 0; i < rings; i++) {
            const ring = this.createCircle(0, 0, size * (0.3 + i * 0.3), {
                fill: 'none',
                stroke: colors[i] || colors[colors.length - 1],
                'stroke-width': size * 0.1,
                opacity: GRAPHICS.RATIO_OPACITY_HIGH - i * 0.2
            });
            
            explosion.appendChild(ring);
        }
        
        // Central flash
        const flash = this.createCircle(0, 0, size * 0.8, {
            fill: '#ffffff',
            opacity: 0.8
        });
        
        // Debris particles
        for (let i = 0; i < 12; i++) {
            const angle = (i * GRAPHICS.ANGLE_30) * Math.PI / GRAPHICS.ANGLE_180;
            const distance = size * 1.2;
            const particleX = Math.cos(angle) * distance;
            const particleY = Math.sin(angle) * distance;
            
            const particle = this.createCircle(particleX, particleY, 2, {
                fill: '#ffaa00',
                opacity: 0.7
            });
            
            explosion.appendChild(particle);
        }
        
        explosion.appendChild(flash);
        
        // Animate explosion
        const scaleAnimation = this.createElement('animateTransform');
        scaleAnimation.setAttribute('attributeName', 'transform');
        scaleAnimation.setAttribute('type', 'scale');
        scaleAnimation.setAttribute('values', '0 0;2 2;1 1');
        scaleAnimation.setAttribute('dur', attributes.duration || '0.8s');
        scaleAnimation.setAttribute('fill', 'freeze');
        scaleAnimation.setAttribute('additive', 'sum');
        
        const opacityAnimation = this.createElement('animate');
        opacityAnimation.setAttribute('attributeName', 'opacity');
        opacityAnimation.setAttribute('values', '0;1;0');
        opacityAnimation.setAttribute('dur', attributes.duration || '0.8s');
        opacityAnimation.setAttribute('fill', 'freeze');
        
        explosion.appendChild(scaleAnimation);
        explosion.appendChild(opacityAnimation);
        
        // Auto-remove after animation
        setTimeout(() => {
            this.remove(explosion);
        }, parseFloat(attributes.duration || '0.8') * 1000 + 100);
        
        return explosion;
    }
    
    createShieldEffect(x, y, radius = 30, attributes = {}) {
        const shield = this.createGroup({
            id: this.generateId('shield'),
            transform: `translate(${x}, ${y})`
        });
        
        const color = attributes.color || '#00aaff';
        
        // Hexagonal shield pattern
        const hexPath = this.createPath(
            `M ${radius} 0 L ${radius * 0.5} ${radius * 0.866} L ${-radius * 0.5} ${radius * 0.866} 
             L ${-radius} 0 L ${-radius * 0.5} ${-radius * 0.866} L ${radius * 0.5} ${-radius * 0.866} Z`,
            {
                fill: 'none',
                stroke: color,
                'stroke-width': 2,
                opacity: 0.6
            }
        );
        
        // Shield energy field
        const field = this.createCircle(0, 0, radius * 0.9, {
            fill: color,
            opacity: 0.1
        });
        
        // Inner energy pattern
        for (let i = 0; i < 6; i++) {
            const angle = (i * GRAPHICS.ANGLE_60) * Math.PI / GRAPHICS.ANGLE_180;
            const lineX = Math.cos(angle) * radius * 0.7;
            const lineY = Math.sin(angle) * radius * 0.7;
            
            const line = this.createElement('line');
            line.setAttribute('x1', 0);
            line.setAttribute('y1', 0);
            line.setAttribute('x2', lineX);
            line.setAttribute('y2', lineY);
            line.setAttribute('stroke', color);
            line.setAttribute('stroke-width', 1);
            line.setAttribute('opacity', 0.3);
            
            shield.appendChild(line);
        }
        
        shield.appendChild(field);
        shield.appendChild(hexPath);
        
        // Pulse animation
        const pulseAnimation = this.createElement('animate');
        pulseAnimation.setAttribute('attributeName', 'opacity');
        pulseAnimation.setAttribute('values', '0.3;0.8;0.3');
        pulseAnimation.setAttribute('dur', '1.5s');
        pulseAnimation.setAttribute('repeatCount', 'indefinite');
        
        shield.appendChild(pulseAnimation);
        
        return shield;
    }
    
    animate(element, attributes, duration = 1000, _easing = 'ease-in-out') {
        const animation = this.createElement('animateTransform');
        animation.setAttribute('attributeName', 'transform');
        animation.setAttribute('dur', `${duration}ms`);
        animation.setAttribute('fill', 'freeze');
        
        if (attributes.transform) {
            animation.setAttribute('type', attributes.transform.type || 'translate');
            animation.setAttribute('values', attributes.transform.values);
        }
        
        element.appendChild(animation);
        
        return new Promise(resolve => {
            setTimeout(resolve, duration);
        });
    }
}