/**
 * SVG Graphics Engine for Max-Pixels
 * Core utilities for creating and manipulating SVG graphics
 */

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
        layer.style.zIndex = zIndex;
        this.layers.set(name, layer);
        this.svg.appendChild(layer);
        return layer;
    }
    
    getLayer(name) {
        return this.layers.get(name) || this.createLayer(name);
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
    
    createStarField(count, bounds = { width: 1920, height: 1080 }) {
        const starField = this.createGroup({ id: 'starField' });
        
        for (let i = 0; i < count; i++) {
            const star = this.createCircle(
                Math.random() * bounds.width,
                Math.random() * bounds.height,
                Math.random() * 1.5 + 0.5,
                {
                    fill: '#ffffff',
                    opacity: Math.random() * 0.8 + 0.2
                }
            );
            starField.appendChild(star);
        }
        
        return starField;
    }
    
    createAsteroidField(count, bounds = { width: 1920, height: 1080 }) {
        const asteroidField = this.createGroup({ id: 'asteroidField' });
        
        for (let i = 0; i < count; i++) {
            const x = Math.random() * bounds.width;
            const y = Math.random() * bounds.height;
            const size = Math.random() * 30 + 10;
            
            const asteroid = this.createAsteroid(x, y, size);
            asteroidField.appendChild(asteroid);
        }
        
        return asteroidField;
    }
    
    createAsteroid(x, y, size) {
        const asteroid = this.createGroup({
            transform: `translate(${x}, ${y})`
        });
        
        const points = 6 + Math.floor(Math.random() * 4);
        let pathData = '';
        
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * 2 * Math.PI;
            const radius = size * (0.7 + Math.random() * 0.3);
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
            'stroke-width': 1,
            opacity: 0.9
        });
        
        const highlight = this.createPath(pathData, {
            fill: 'none',
            stroke: '#a0926b',
            'stroke-width': 0.5,
            opacity: 0.6,
            transform: `translate(-${size * 0.1}, -${size * 0.1})`
        });
        
        asteroid.appendChild(body);
        asteroid.appendChild(highlight);
        
        return asteroid;
    }
    
    createSpaceship(x, y, size = 20, attributes = {}) {
        const ship = this.createGroup({
            transform: `translate(${x}, ${y})`,
            ...attributes
        });
        
        const hull = this.createPath(
            `M 0 -${size} L ${size * 0.3} ${size} L 0 ${size * 0.7} L -${size * 0.3} ${size} Z`,
            {
                fill: '#4a90e2',
                stroke: '#ffffff',
                'stroke-width': 1
            }
        );
        
        const engine = this.createCircle(0, size * 0.5, size * 0.2, {
            fill: '#ff4444',
            opacity: 0.8
        });
        
        ship.appendChild(hull);
        ship.appendChild(engine);
        
        return ship;
    }
    
    createPlanet(x, y, radius, attributes = {}) {
        const planet = this.createGroup({
            transform: `translate(${x}, ${y})`,
            ...attributes
        });
        
        const gradientId = this.createGradient('radial', [
            { offset: '0%', color: attributes.surfaceColor || '#8b4513' },
            { offset: '70%', color: attributes.coreColor || '#654321' },
            { offset: '100%', color: '#2c1810' }
        ], {
            cx: '30%',
            cy: '30%'
        });
        
        const body = this.createCircle(0, 0, radius, {
            fill: `url(#${gradientId})`,
            stroke: attributes.atmosphereColor || '#4444ff',
            'stroke-width': 2,
            opacity: 0.9
        });
        
        planet.appendChild(body);
        
        return planet;
    }
    
    createSpaceStation(x, y, size = 30, attributes = {}) {
        const station = this.createGroup({
            transform: `translate(${x}, ${y})`,
            ...attributes
        });
        
        // Central hub
        const hub = this.createCircle(0, 0, size * 0.4, {
            fill: '#666666',
            stroke: '#aaaaaa',
            'stroke-width': 2
        });
        
        // Rotating ring
        const ring = this.createCircle(0, 0, size * 0.8, {
            fill: 'none',
            stroke: '#888888',
            'stroke-width': size * 0.15,
            opacity: 0.8
        });
        
        // Docking ports (4 directions)
        for (let i = 0; i < 4; i++) {
            const angle = (i * 90) * Math.PI / 180;
            const portX = Math.cos(angle) * size;
            const portY = Math.sin(angle) * size;
            
            const port = this.createRect(
                portX - size * 0.1, 
                portY - size * 0.05, 
                size * 0.2, 
                size * 0.1, 
                {
                    fill: '#4a90e2',
                    stroke: '#ffffff',
                    'stroke-width': 1,
                    transform: `rotate(${i * 90}, ${portX}, ${portY})`
                }
            );
            
            station.appendChild(port);
        }
        
        // Solar panels
        for (let i = 0; i < 6; i++) {
            const angle = (i * 60) * Math.PI / 180;
            const panelX = Math.cos(angle) * size * 1.2;
            const panelY = Math.sin(angle) * size * 1.2;
            
            const panel = this.createRect(
                panelX - size * 0.15, 
                panelY - size * 0.05, 
                size * 0.3, 
                size * 0.1, 
                {
                    fill: '#1a1a3a',
                    stroke: '#4444ff',
                    'stroke-width': 1,
                    opacity: 0.9,
                    transform: `rotate(${i * 60}, ${panelX}, ${panelY})`
                }
            );
            
            station.appendChild(panel);
        }
        
        // Communications array
        const commArray = this.createRect(-size * 0.05, -size * 1.4, size * 0.1, size * 0.8, {
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
    
    animate(element, attributes, duration = 1000, easing = 'ease-in-out') {
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