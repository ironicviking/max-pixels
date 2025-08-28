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
        this.createProximityGlowFilter();
        return defs;
    }
    
    createProximityGlowFilter() {
        const filter = this.createElement('filter');
        filter.setAttribute('id', 'proximityGlow');
        filter.setAttribute('x', '-50%');
        filter.setAttribute('y', '-50%');
        filter.setAttribute('width', '200%');
        filter.setAttribute('height', '200%');
        
        // Gaussian blur for glow effect
        const blur = this.createElement('feGaussianBlur');
        blur.setAttribute('stdDeviation', '4');
        blur.setAttribute('result', 'coloredBlur');
        
        // Merge original with blurred version
        const merge = this.createElement('feMerge');
        
        const mergeNode1 = this.createElement('feMergeNode');
        mergeNode1.setAttribute('in', 'coloredBlur');
        
        const mergeNode2 = this.createElement('feMergeNode');
        mergeNode2.setAttribute('in', 'SourceGraphic');
        
        merge.appendChild(mergeNode1);
        merge.appendChild(mergeNode2);
        
        filter.appendChild(blur);
        filter.appendChild(merge);
        
        this.defs.appendChild(filter);
    }
    
    createElement(type) {
        return document.createElementNS('http://www.w3.org/2000/svg', type);
    }
    
    generateId(prefix = 'element') {
        return `${prefix}_${++this.idCounter}`;
    }
    
    setAttributes(element, attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        return element;
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
        // Parameter validation
        if (typeof cx !== 'number' || !isFinite(cx)) {
            throw new Error('GraphicsEngine.createCircle: cx must be a finite number');
        }
        if (typeof cy !== 'number' || !isFinite(cy)) {
            throw new Error('GraphicsEngine.createCircle: cy must be a finite number');
        }
        if (typeof r !== 'number' || !isFinite(r) || r < 0) {
            throw new Error('GraphicsEngine.createCircle: r must be a non-negative finite number');
        }
        if (typeof attributes !== 'object' || attributes === null) {
            throw new Error('GraphicsEngine.createCircle: attributes must be an object');
        }
        
        const circle = this.createElement('circle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', r);
        
        return this.setAttributes(circle, attributes);
    }
    
    createRect(x, y, width, height, attributes = {}) {
        // Parameter validation
        if (typeof x !== 'number' || !isFinite(x)) {
            throw new Error('GraphicsEngine.createRect: x must be a finite number');
        }
        if (typeof y !== 'number' || !isFinite(y)) {
            throw new Error('GraphicsEngine.createRect: y must be a finite number');
        }
        if (typeof width !== 'number' || !isFinite(width) || width < 0) {
            throw new Error('GraphicsEngine.createRect: width must be a non-negative finite number');
        }
        if (typeof height !== 'number' || !isFinite(height) || height < 0) {
            throw new Error('GraphicsEngine.createRect: height must be a non-negative finite number');
        }
        if (typeof attributes !== 'object' || attributes === null) {
            throw new Error('GraphicsEngine.createRect: attributes must be an object');
        }
        
        const rect = this.createElement('rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        
        return this.setAttributes(rect, attributes);
    }
    
    createLine(x1, y1, x2, y2, attributes = {}) {
        // Parameter validation
        if (typeof x1 !== 'number' || !Number.isFinite(x1)) {
            throw new Error('Invalid x1 parameter: must be a finite number');
        }
        if (typeof y1 !== 'number' || !Number.isFinite(y1)) {
            throw new Error('Invalid y1 parameter: must be a finite number');
        }
        if (typeof x2 !== 'number' || !Number.isFinite(x2)) {
            throw new Error('Invalid x2 parameter: must be a finite number');
        }
        if (typeof y2 !== 'number' || !Number.isFinite(y2)) {
            throw new Error('Invalid y2 parameter: must be a finite number');
        }
        if (attributes !== null && (typeof attributes !== 'object' || Array.isArray(attributes))) {
            throw new Error('Invalid attributes parameter: must be an object');
        }
        
        const line = this.createElement('line');
        line.setAttribute('x1', x1.toString());
        line.setAttribute('y1', y1.toString());
        line.setAttribute('x2', x2.toString());
        line.setAttribute('y2', y2.toString());
        
        return this.setAttributes(line, attributes);
    }
    
    createPath(d, attributes = {}) {
        // Parameter validation
        if (typeof d !== 'string' || d.trim() === '') {
            throw new Error('Invalid d parameter: must be a non-empty string');
        }
        if (attributes !== null && (typeof attributes !== 'object' || Array.isArray(attributes))) {
            throw new Error('Invalid attributes parameter: must be an object');
        }
        
        const path = this.createElement('path');
        path.setAttribute('d', d);
        
        return this.setAttributes(path, attributes);
    }
    
    createGroup(attributes = {}) {
        const group = this.createElement('g');
        
        return this.setAttributes(group, attributes);
    }
    
    createGradient(type, stops, attributes = {}) {
        const gradientId = this.generateId('gradient');
        const gradient = this.createElement(type === 'radial' ? 'radialGradient' : 'linearGradient');
        gradient.setAttribute('id', gradientId);
        
        this.setAttributes(gradient, attributes);
        
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
        // Parameter validation
        if (typeof x !== 'number' || !isFinite(x)) {
            throw new Error('GraphicsEngine.createAsteroid: x must be a finite number');
        }
        if (typeof y !== 'number' || !isFinite(y)) {
            throw new Error('GraphicsEngine.createAsteroid: y must be a finite number');
        }
        if (typeof size !== 'number' || !isFinite(size) || size <= 0) {
            throw new Error('GraphicsEngine.createAsteroid: size must be a positive finite number');
        }
        if (typeof attributes !== 'object' || attributes === null) {
            throw new Error('GraphicsEngine.createAsteroid: attributes must be an object');
        }
        
        const asteroid = this.createGroup({
            transform: `translate(${x}, ${y})`,
            ...attributes
        });
        
        const points = GRAPHICS.ASTEROID_VERTICES + Math.floor(Math.random() * GRAPHICS.ASTEROID_VERTEX_VARIANCE);
        let pathData = '';
        
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * GRAPHICS.PI_TIMES_2;
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
        // Parameter validation
        if (typeof x !== 'number' || !isFinite(x)) {
            throw new Error('GraphicsEngine.createSpaceship: x must be a finite number');
        }
        if (typeof y !== 'number' || !isFinite(y)) {
            throw new Error('GraphicsEngine.createSpaceship: y must be a finite number');
        }
        if (typeof size !== 'number' || !isFinite(size) || size <= 0) {
            throw new Error('GraphicsEngine.createSpaceship: size must be a positive finite number');
        }
        if (typeof attributes !== 'object' || attributes === null) {
            throw new Error('GraphicsEngine.createSpaceship: attributes must be an object');
        }
        
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
                const pointAngle = (j / points) * GRAPHICS.PI_TIMES_2;
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
        const navLight1 = this.createCircle(-size * GRAPHICS.STATION_NAV_LIGHT_RATIO, 0, size * GRAPHICS.STATION_NAV_LIGHT_SIZE, {
            fill: '#ff4444',
            opacity: GRAPHICS.STATION_NAV_LIGHT_OPACITY
        });
        const navLight2 = this.createCircle(size * GRAPHICS.STATION_NAV_LIGHT_RATIO, 0, size * GRAPHICS.STATION_NAV_LIGHT_SIZE, {
            fill: '#44ff44',
            opacity: GRAPHICS.STATION_NAV_LIGHT_OPACITY
        });
        
        station.appendChild(navLight1);
        station.appendChild(navLight2);
        
        return station;
    }
    
    createJumpGate(x, y, size = GRAPHICS.GATE_DEFAULT_SIZE, attributes = {}) {
        const gate = this.createGroup({
            transform: `translate(${x}, ${y})`,
            ...attributes
        });
        
        // Outer ring - energy field
        const outerRing = this.createCircle(0, 0, size, {
            fill: 'none',
            stroke: '#00ffff',
            'stroke-width': size * GRAPHICS.GATE_OUTER_STROKE_RATIO,
            opacity: GRAPHICS.GATE_OUTER_OPACITY,
            'stroke-dasharray': `${size * GRAPHICS.GATE_DASH_ARRAY_LONG} ${size * GRAPHICS.GATE_DASH_ARRAY_SHORT}`
        });
        
        // Inner ring - stable structure
        const innerRing = this.createCircle(0, 0, size * GRAPHICS.GATE_INNER_RATIO, {
            fill: 'none',
            stroke: '#ffffff',
            'stroke-width': size * GRAPHICS.GATE_INNER_STROKE_RATIO,
            opacity: GRAPHICS.GATE_INNER_OPACITY
        });
        
        // Core energy field
        const core = this.createCircle(0, 0, size * GRAPHICS.GATE_CORE_RATIO, {
            fill: '#00ffff',
            opacity: GRAPHICS.GATE_CORE_OPACITY,
            'fill-rule': 'evenodd'
        });
        
        // Support struts (4 directions)
        for (let i = 0; i < GRAPHICS.GATE_STRUT_COUNT; i++) {
            const angle = (i * GRAPHICS.ANGLE_90) * Math.PI / GRAPHICS.ANGLE_180;
            const strutStartX = Math.cos(angle) * size * GRAPHICS.GATE_STRUT_INNER_RATIO;
            const strutStartY = Math.sin(angle) * size * GRAPHICS.GATE_STRUT_INNER_RATIO;
            const strutEndX = Math.cos(angle) * size * GRAPHICS.GATE_STRUT_OUTER_RATIO;
            const strutEndY = Math.sin(angle) * size * GRAPHICS.GATE_STRUT_OUTER_RATIO;
            
            const strut = this.createElement('line');
            strut.setAttribute('x1', strutStartX);
            strut.setAttribute('y1', strutStartY);
            strut.setAttribute('x2', strutEndX);
            strut.setAttribute('y2', strutEndY);
            strut.setAttribute('stroke', '#aaaaaa');
            strut.setAttribute('stroke-width', size * GRAPHICS.GATE_STRUT_WIDTH);
            
            gate.appendChild(strut);
        }
        
        // Energy particles (small circles that rotate around the gate)
        const particleGroup = this.createGroup({
            id: `particles_${this.generateId('gate')}`
        });
        
        for (let i = 0; i < GRAPHICS.GATE_PARTICLES; i++) {
            const angle = (i * GRAPHICS.ANGLE_45) * Math.PI / GRAPHICS.ANGLE_180;
            const particleX = Math.cos(angle) * size * GRAPHICS.GATE_PARTICLE_DISTANCE;
            const particleY = Math.sin(angle) * size * GRAPHICS.GATE_PARTICLE_DISTANCE;
            
            const particle = this.createCircle(particleX, particleY, size * GRAPHICS.GATE_PARTICLE_SIZE, {
                fill: '#00ffff',
                opacity: GRAPHICS.GATE_PARTICLE_OPACITY
            });
            
            particleGroup.appendChild(particle);
        }
        
        // Add rotation animation to particles
        const rotateParticles = this.createElement('animateTransform');
        rotateParticles.setAttribute('attributeName', 'transform');
        rotateParticles.setAttribute('type', 'rotate');
        rotateParticles.setAttribute('values', '0 0 0;360 0 0');
        rotateParticles.setAttribute('dur', GRAPHICS.GATE_ANIMATION_DURATION_ROTATE);
        rotateParticles.setAttribute('repeatCount', 'indefinite');
        
        particleGroup.appendChild(rotateParticles);
        gate.appendChild(particleGroup);
        
        gate.appendChild(core);
        gate.appendChild(innerRing);
        gate.appendChild(outerRing);
        
        // Add pulsing animation to outer ring
        const animateOpacity = this.createElement('animate');
        animateOpacity.setAttribute('attributeName', 'opacity');
        animateOpacity.setAttribute('values', `${GRAPHICS.GATE_PULSE_MIN};${GRAPHICS.GATE_PULSE_MAX};${GRAPHICS.GATE_PULSE_MIN}`);
        animateOpacity.setAttribute('dur', GRAPHICS.GATE_ANIMATION_DURATION_PULSE);
        animateOpacity.setAttribute('repeatCount', 'indefinite');
        
        outerRing.appendChild(animateOpacity);
        
        // Add pulsing animation to core energy field
        const coreAnimation = this.createElement('animate');
        coreAnimation.setAttribute('attributeName', 'opacity');
        coreAnimation.setAttribute('values', `${GRAPHICS.GATE_CORE_PULSE_MIN};${GRAPHICS.GATE_CORE_PULSE_MAX};${GRAPHICS.GATE_CORE_PULSE_MIN}`);
        coreAnimation.setAttribute('dur', GRAPHICS.GATE_ANIMATION_DURATION_CORE);
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
        beam.setAttribute('stroke-width', attributes.width || GRAPHICS.LASER_DEFAULT_WIDTH);
        beam.setAttribute('opacity', GRAPHICS.LASER_BEAM_OPACITY);
        beam.setAttribute('stroke-linecap', 'round');
        
        // Outer glow effect
        const glow = this.createElement('line');
        glow.setAttribute('x1', startX);
        glow.setAttribute('y1', startY);
        glow.setAttribute('x2', endX);
        glow.setAttribute('y2', endY);
        glow.setAttribute('stroke', attributes.glowColor || '#ffaaaa');
        glow.setAttribute('stroke-width', (attributes.width || GRAPHICS.LASER_DEFAULT_WIDTH) * GRAPHICS.LASER_GLOW_MULTIPLIER);
        glow.setAttribute('opacity', GRAPHICS.LASER_GLOW_OPACITY);
        glow.setAttribute('stroke-linecap', 'round');
        
        // Inner core
        const core = this.createElement('line');
        core.setAttribute('x1', startX);
        core.setAttribute('y1', startY);
        core.setAttribute('x2', endX);
        core.setAttribute('y2', endY);
        core.setAttribute('stroke', '#ffffff');
        core.setAttribute('stroke-width', 1);
        core.setAttribute('opacity', GRAPHICS.LASER_CORE_OPACITY);
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
        }, parseFloat(attributes.duration || GRAPHICS.LASER_DEFAULT_DURATION) * GRAPHICS.SECONDS_TO_MS + GRAPHICS.LASER_CLEANUP_DELAY);
        
        return laser;
    }
    
    createLaserImpact(x, y, attributes = {}) {
        const impact = this.createGroup({
            id: this.generateId('impact'),
            transform: `translate(${x}, ${y})`
        });
        
        // Central flash
        const flash = this.createCircle(0, 0, attributes.size || GRAPHICS.IMPACT_DEFAULT_SIZE, {
            fill: attributes.color || '#ffff00',
            opacity: GRAPHICS.RATIO_OPACITY_HIGH
        });
        
        // Outer ring
        const ring = this.createCircle(0, 0, (attributes.size || GRAPHICS.IMPACT_DEFAULT_SIZE) * GRAPHICS.IMPACT_RING_MULTIPLIER, {
            fill: 'none',
            stroke: attributes.ringColor || '#ff8800',
            'stroke-width': 2,
            opacity: 0.7
        });
        
        // Spark particles
        for (let i = 0; i < GRAPHICS.IMPACT_SPARKS; i++) {
            const angle = (i * GRAPHICS.ANGLE_60) * Math.PI / GRAPHICS.ANGLE_180;
            const sparkDistance = (attributes.size || GRAPHICS.IMPACT_DEFAULT_SIZE) * GRAPHICS.IMPACT_SPARK_DISTANCE;
            const sparkX = Math.cos(angle) * sparkDistance;
            const sparkY = Math.sin(angle) * sparkDistance;
            
            const spark = this.createElement('line');
            spark.setAttribute('x1', 0);
            spark.setAttribute('y1', 0);
            spark.setAttribute('x2', sparkX);
            spark.setAttribute('y2', sparkY);
            spark.setAttribute('stroke', '#ffffff');
            spark.setAttribute('stroke-width', 1);
            spark.setAttribute('opacity', GRAPHICS.IMPACT_SPARK_OPACITY);
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
        }, parseFloat(attributes.duration || GRAPHICS.IMPACT_DEFAULT_DURATION) * GRAPHICS.SECONDS_TO_MS + GRAPHICS.IMPACT_CLEANUP_DELAY);
        
        return impact;
    }
    
    createProjectile(x, y, type = 'plasma', attributes = {}) {
        const projectile = this.createGroup({
            id: this.generateId('projectile'),
            transform: `translate(${x}, ${y})`,
            ...attributes
        });
        
        if (type === 'plasma') {
            const core = this.createCircle(0, 0, GRAPHICS.PROJECTILE_PLASMA_CORE, {
                fill: '#00ffff',
                opacity: GRAPHICS.RATIO_OPACITY_HIGH
            });
            
            const glow = this.createCircle(0, 0, GRAPHICS.PROJECTILE_PLASMA_GLOW, {
                fill: '#00aaff',
                opacity: GRAPHICS.PROJECTILE_PLASMA_GLOW_OPACITY
            });
            
            const trail = this.createCircle(0, 0, GRAPHICS.PROJECTILE_PLASMA_TRAIL, {
                fill: 'none',
                stroke: '#0088ff',
                'stroke-width': GRAPHICS.PROJECTILE_PLASMA_TRAIL_WIDTH,
                opacity: GRAPHICS.PROJECTILE_PLASMA_TRAIL_OPACITY
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
                    'stroke-width': GRAPHICS.PROJECTILE_MISSILE_STROKE_WIDTH
                }
            );
            
            const warhead = this.createCircle(GRAPHICS.PROJECTILE_MISSILE_WIDTH, 0, GRAPHICS.PROJECTILE_MISSILE_WARHEAD, {
                fill: '#ff4444',
                opacity: GRAPHICS.PROJECTILE_MISSILE_WARHEAD_OPACITY
            });
            
            const exhaust = this.createPath(
                'M -8 0 L -15 -1 L -12 0 L -15 1 Z',
                {
                    fill: '#ff8800',
                    opacity: GRAPHICS.PROJECTILE_MISSILE_EXHAUST_OPACITY
                }
            );
            
            projectile.appendChild(exhaust);
            projectile.appendChild(body);
            projectile.appendChild(warhead);
            
        } else if (type === 'railgun') {
            const slug = this.createRect(-GRAPHICS.PROJECTILE_RAILGUN_WIDTH/2, -GRAPHICS.PROJECTILE_RAILGUN_HEIGHT/2, GRAPHICS.PROJECTILE_RAILGUN_WIDTH, GRAPHICS.PROJECTILE_RAILGUN_HEIGHT, {
                fill: '#ffff00',
                opacity: GRAPHICS.RATIO_OPACITY_HIGH
            });
            
            const field = this.createRect(-GRAPHICS.PROJECTILE_RAILGUN_FIELD_WIDTH/2, -GRAPHICS.PROJECTILE_RAILGUN_FIELD_HEIGHT/2, GRAPHICS.PROJECTILE_RAILGUN_FIELD_WIDTH, GRAPHICS.PROJECTILE_RAILGUN_FIELD_HEIGHT, {
                fill: 'none',
                stroke: '#ffff88',
                'stroke-width': GRAPHICS.PROJECTILE_RAILGUN_FIELD_WIDTH_STROKE,
                opacity: GRAPHICS.PROJECTILE_RAILGUN_FIELD_OPACITY
            });
            
            projectile.appendChild(field);
            projectile.appendChild(slug);
        }
        
        return projectile;
    }
    
    createExplosion(x, y, size = GRAPHICS.EXPLOSION_DEFAULT_SIZE, attributes = {}) {
        const explosion = this.createGroup({
            id: this.generateId('explosion'),
            transform: `translate(${x}, ${y})`
        });
        
        const colors = attributes.colors || ['#ff4444', '#ff8800', '#ffff00', '#ffffff'];
        const rings = GRAPHICS.EXPLOSION_RINGS;
        
        for (let i = 0; i < rings; i++) {
            const ring = this.createCircle(0, 0, size * (GRAPHICS.EXPLOSION_RING_BASE + i * GRAPHICS.EXPLOSION_RING_INCREMENT), {
                fill: 'none',
                stroke: colors[i] || colors[colors.length - 1],
                'stroke-width': size * GRAPHICS.EXPLOSION_STROKE_WIDTH,
                opacity: GRAPHICS.EXPLOSION_RING_OPACITY_BASE - i * GRAPHICS.EXPLOSION_RING_OPACITY_DECREMENT
            });
            
            explosion.appendChild(ring);
        }
        
        // Central flash
        const flash = this.createCircle(0, 0, size * GRAPHICS.EXPLOSION_FLASH_RATIO, {
            fill: '#ffffff',
            opacity: GRAPHICS.EXPLOSION_FLASH_OPACITY
        });
        
        // Debris particles
        for (let i = 0; i < GRAPHICS.EXPLOSION_PARTICLES; i++) {
            const angle = (i * GRAPHICS.ANGLE_30) * Math.PI / GRAPHICS.ANGLE_180;
            const distance = size * GRAPHICS.EXPLOSION_PARTICLE_DISTANCE;
            const particleX = Math.cos(angle) * distance;
            const particleY = Math.sin(angle) * distance;
            
            const particle = this.createCircle(particleX, particleY, GRAPHICS.EXPLOSION_PARTICLE_SIZE, {
                fill: '#ffaa00',
                opacity: GRAPHICS.EXPLOSION_PARTICLE_OPACITY
            });
            
            explosion.appendChild(particle);
        }
        
        explosion.appendChild(flash);
        
        // Animate explosion
        const scaleAnimation = this.createElement('animateTransform');
        scaleAnimation.setAttribute('attributeName', 'transform');
        scaleAnimation.setAttribute('type', 'scale');
        scaleAnimation.setAttribute('values', '0 0;2 2;1 1');
        scaleAnimation.setAttribute('dur', attributes.duration || GRAPHICS.EXPLOSION_DEFAULT_DURATION);
        scaleAnimation.setAttribute('fill', 'freeze');
        scaleAnimation.setAttribute('additive', 'sum');
        
        const opacityAnimation = this.createElement('animate');
        opacityAnimation.setAttribute('attributeName', 'opacity');
        opacityAnimation.setAttribute('values', '0;1;0');
        opacityAnimation.setAttribute('dur', attributes.duration || GRAPHICS.EXPLOSION_DEFAULT_DURATION);
        opacityAnimation.setAttribute('fill', 'freeze');
        
        explosion.appendChild(scaleAnimation);
        explosion.appendChild(opacityAnimation);
        
        // Auto-remove after animation
        setTimeout(() => {
            this.remove(explosion);
        }, parseFloat(attributes.duration || GRAPHICS.EXPLOSION_DEFAULT_DURATION) * GRAPHICS.SECONDS_TO_MS + GRAPHICS.EXPLOSION_CLEANUP_DELAY);
        
        return explosion;
    }
    
    createShieldEffect(x, y, radius = GRAPHICS.SHIELD_DEFAULT_RADIUS, attributes = {}) {
        const shield = this.createGroup({
            id: this.generateId('shield'),
            transform: `translate(${x}, ${y})`
        });
        
        const color = attributes.color || '#00aaff';
        
        // Hexagonal shield pattern
        const hexPath = this.createPath(
            `M ${radius} 0 L ${radius * GRAPHICS.SHIELD_HEX_RATIO} ${radius * GRAPHICS.SHIELD_HEX_RATIO_LONG} L ${-radius * GRAPHICS.SHIELD_HEX_RATIO} ${radius * GRAPHICS.SHIELD_HEX_RATIO_LONG} 
             L ${-radius} 0 L ${-radius * GRAPHICS.SHIELD_HEX_RATIO} ${-radius * GRAPHICS.SHIELD_HEX_RATIO_LONG} L ${radius * GRAPHICS.SHIELD_HEX_RATIO} ${-radius * GRAPHICS.SHIELD_HEX_RATIO_LONG} Z`,
            {
                fill: 'none',
                stroke: color,
                'stroke-width': GRAPHICS.SHIELD_STROKE_WIDTH,
                opacity: GRAPHICS.SHIELD_HEX_OPACITY
            }
        );
        
        // Shield energy field
        const field = this.createCircle(0, 0, radius * GRAPHICS.SHIELD_FIELD_RATIO, {
            fill: color,
            opacity: GRAPHICS.SHIELD_FIELD_OPACITY
        });
        
        // Inner energy pattern
        for (let i = 0; i < GRAPHICS.SHIELD_LINES; i++) {
            const angle = (i * GRAPHICS.ANGLE_60) * Math.PI / GRAPHICS.ANGLE_180;
            const lineX = Math.cos(angle) * radius * GRAPHICS.SHIELD_LINE_LENGTH;
            const lineY = Math.sin(angle) * radius * GRAPHICS.SHIELD_LINE_LENGTH;
            
            const line = this.createElement('line');
            line.setAttribute('x1', 0);
            line.setAttribute('y1', 0);
            line.setAttribute('x2', lineX);
            line.setAttribute('y2', lineY);
            line.setAttribute('stroke', color);
            line.setAttribute('stroke-width', GRAPHICS.SHIELD_LINE_WIDTH);
            line.setAttribute('opacity', GRAPHICS.SHIELD_LINE_OPACITY);
            
            shield.appendChild(line);
        }
        
        shield.appendChild(field);
        shield.appendChild(hexPath);
        
        // Pulse animation
        const pulseAnimation = this.createElement('animate');
        pulseAnimation.setAttribute('attributeName', 'opacity');
        pulseAnimation.setAttribute('values', `${GRAPHICS.SHIELD_PULSE_MIN};${GRAPHICS.SHIELD_PULSE_MAX};${GRAPHICS.SHIELD_PULSE_MIN}`);
        pulseAnimation.setAttribute('dur', GRAPHICS.SHIELD_PULSE_DURATION);
        pulseAnimation.setAttribute('repeatCount', 'indefinite');
        
        shield.appendChild(pulseAnimation);
        
        return shield;
    }
    
    animate(element, attributes, duration = GRAPHICS.CLEANUP_DELAY_MS, _easing = 'ease-in-out') {
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
    
    addProximityGlow(element, color = '#00ffff') {
        if (!element) return;
        
        // Apply glow filter
        element.style.filter = 'url(#proximityGlow)';
        element.setAttribute('data-proximity-glow', 'true');
        
        // Add pulsing animation
        const pulseAnimation = this.createElement('animate');
        pulseAnimation.setAttribute('attributeName', 'opacity');
        pulseAnimation.setAttribute('values', '0.4;0.8;0.4');
        pulseAnimation.setAttribute('dur', '1.5s');
        pulseAnimation.setAttribute('repeatCount', 'indefinite');
        pulseAnimation.setAttribute('id', 'proximityPulse');
        
        element.appendChild(pulseAnimation);
        
        // Add colored stroke for enhanced visibility
        if (element.tagName === 'g') {
            const children = element.querySelectorAll('circle, path, rect, line');
            children.forEach(child => {
                const originalStroke = child.getAttribute('stroke');
                child.setAttribute('data-original-stroke', originalStroke || 'none');
                child.setAttribute('stroke', color);
                child.setAttribute('stroke-width', '2');
            });
        }
    }
    
    removeProximityGlow(element) {
        if (!element) return;
        
        // Remove filter
        element.style.filter = '';
        element.removeAttribute('data-proximity-glow');
        
        // Remove pulsing animation
        const pulseAnimation = element.querySelector('#proximityPulse');
        if (pulseAnimation) {
            element.removeChild(pulseAnimation);
        }
        
        // Restore original strokes
        if (element.tagName === 'g') {
            const children = element.querySelectorAll('[data-original-stroke]');
            children.forEach(child => {
                const originalStroke = child.getAttribute('data-original-stroke');
                if (originalStroke === 'none') {
                    child.removeAttribute('stroke');
                } else {
                    child.setAttribute('stroke', originalStroke);
                }
                child.removeAttribute('data-original-stroke');
            });
        }
    }
}