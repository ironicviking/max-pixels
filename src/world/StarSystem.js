/**
 * StarSystem - Procedural Star System Generation
 * Generates star systems with planets, asteroids, and space stations
 */

import { IDGenerator } from '../utils/IDGenerator.js';
import { WORLD_GEN, GRAPHICS } from '../constants.js';

export class StarSystem {
    constructor(systemId, coordinates = { x: 0, y: 0 }) {
        this.id = systemId;
        this.name = this.generateSystemName();
        this.coordinates = coordinates;
        this.star = this.generateStar();
        this.planets = [];
        this.asteroidBelts = [];
        this.spaceStations = [];
        this.jumpGates = [];
        this.wormholes = [];
        this.generated = false;
        
        this.generateSystem();
    }
    
    generateSystemName() {
        const prefixes = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];
        const suffixes = ['Centauri', 'Orionis', 'Draconis', 'Cygni', 'Lyrae', 'Vega', 'Rigel', 'Altair'];
        const numbers = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        const number = numbers[Math.floor(Math.random() * numbers.length)];
        
        return `${prefix} ${suffix} ${number}`;
    }
    
    generateStar() {
        // Realistic stellar classification based on Harvard spectral types
        // Frequency based on actual stellar population in the galaxy
        const stellarClasses = [
            { 
                spectralClass: 'O', 
                type: 'Blue Supergiant', 
                color: '#a8d8ff', 
                size: 15.0, 
                temperature: 35000, 
                mass: 20.0,
                frequency: 0.00003 // Extremely rare
            },
            { 
                spectralClass: 'B', 
                type: 'Blue Giant', 
                color: '#b8e0ff', 
                size: 7.0, 
                temperature: 18000, 
                mass: 8.0,
                frequency: 0.13 // Rare
            },
            { 
                spectralClass: 'A', 
                type: 'White Main Sequence', 
                color: '#ffffff', 
                size: 1.8, 
                temperature: 8500, 
                mass: 2.0,
                frequency: 0.6 // Uncommon
            },
            { 
                spectralClass: 'F', 
                type: 'Yellow-White Main Sequence', 
                color: '#fff2cc', 
                size: 1.3, 
                temperature: 6500, 
                mass: 1.4,
                frequency: 3.0 // Common
            },
            { 
                spectralClass: 'G', 
                type: 'Yellow Dwarf', 
                color: '#ffff99', 
                size: 1.0, 
                temperature: 5800, 
                mass: 1.0,
                frequency: 7.6 // Very common (like our Sun)
            },
            { 
                spectralClass: 'K', 
                type: 'Orange Dwarf', 
                color: '#ffcc66', 
                size: 0.8, 
                temperature: 4200, 
                mass: 0.7,
                frequency: 12.1 // Very common
            },
            { 
                spectralClass: 'M', 
                type: 'Red Dwarf', 
                color: '#ff9999', 
                size: 0.4, 
                temperature: 3000, 
                mass: 0.3,
                frequency: 76.45 // Most common stars in galaxy
            }
        ];
        
        // Weighted random selection based on actual stellar frequencies
        const totalFrequency = stellarClasses.reduce((sum, cls) => sum + cls.frequency, 0);
        let random = Math.random() * totalFrequency;
        
        let selectedClass = stellarClasses[stellarClasses.length - 1]; // Default to M-class
        for (const cls of stellarClasses) {
            random -= cls.frequency;
            if (random <= 0) {
                selectedClass = cls;
                break;
            }
        }
        
        // Add some variance to star properties within each class
        const sizeVariance = 0.1 + Math.random() * 0.2; // ±10-20% size variance
        const tempVariance = 0.05 + Math.random() * 0.1; // ±5-10% temperature variance
        const massVariance = 0.1 + Math.random() * 0.2; // ±10-20% mass variance
        
        return {
            id: IDGenerator.generate(),
            spectralClass: selectedClass.spectralClass,
            type: selectedClass.type,
            color: selectedClass.color,
            size: selectedClass.size * sizeVariance,
            temperature: selectedClass.temperature * tempVariance,
            mass: selectedClass.mass * massVariance,
            x: 0, // Stars are at system center
            y: 0,
            luminosity: Math.pow(selectedClass.size * sizeVariance, 2) * 
                       Math.pow(selectedClass.temperature * tempVariance / WORLD_GEN.STAR_TEMPERATURE_REFERENCE, 4), // Stefan-Boltzmann law approximation
            lifespan: this.calculateStellarLifespan(selectedClass.mass * massVariance),
            habitableZoneInner: this.calculateHabitableZone(selectedClass.size * sizeVariance, selectedClass.temperature * tempVariance, true),
            habitableZoneOuter: this.calculateHabitableZone(selectedClass.size * sizeVariance, selectedClass.temperature * tempVariance, false)
        };
    }
    
    calculateStellarLifespan(mass) {
        // Main sequence lifetime approximation: L ∝ M^-2.5 (in billions of years)
        // Sun's lifetime ≈ 10 billion years
        return 10 * Math.pow(mass, -2.5);
    }
    
    calculateHabitableZone(size, temperature, isInner) {
        // Habitable zone calculation based on stellar luminosity
        // Inner edge: runaway greenhouse effect
        // Outer edge: maximum greenhouse effect
        const luminosity = Math.pow(size, 2) * Math.pow(temperature / WORLD_GEN.STAR_TEMPERATURE_REFERENCE, 4);
        
        if (isInner) {
            return Math.sqrt(luminosity / 1.1); // Inner edge in AU
        } else {
            return Math.sqrt(luminosity / 0.53); // Outer edge in AU
        }
    }
    
    generateSystem() {
        if (this.generated) return;
        
        // Generate planets per system
        const planetCount = Math.floor(Math.random() * WORLD_GEN.MAX_PLANETS) + WORLD_GEN.MIN_PLANETS;
        let currentOrbitDistance = WORLD_GEN.STARTING_ORBIT_DISTANCE; // Starting orbit distance
        
        for (let i = 0; i < planetCount; i++) {
            const planet = this.generatePlanet(i, currentOrbitDistance);
            this.planets.push(planet);
            currentOrbitDistance += Math.random() * WORLD_GEN.MAX_ORBIT_SPACING + WORLD_GEN.MIN_ORBIT_SPACING; // Next orbit
        }
        
        // Generate asteroid belts per system
        const beltCount = Math.floor(Math.random() * (WORLD_GEN.MAX_ASTEROID_BELTS + 1));
        for (let i = 0; i < beltCount; i++) {
            const belt = this.generateAsteroidBelt();
            this.asteroidBelts.push(belt);
        }
        
        // Generate space stations per system
        const stationCount = Math.floor(Math.random() * WORLD_GEN.MAX_SPACE_STATIONS) + WORLD_GEN.MIN_SPACE_STATIONS;
        for (let i = 0; i < stationCount; i++) {
            const station = this.generateSpaceStation();
            this.spaceStations.push(station);
        }
        
        // Generate jump gates per system for connectivity
        const gateCount = Math.floor(Math.random() * WORLD_GEN.MAX_JUMP_GATES) + WORLD_GEN.MIN_JUMP_GATES;
        for (let i = 0; i < gateCount; i++) {
            const gate = this.generateJumpGate();
            this.jumpGates.push(gate);
        }
        
        // Generate wormholes per system (rare phenomena)
        const wormholeCount = Math.floor(Math.random() * (WORLD_GEN.MAX_WORMHOLES + 1));
        for (let i = 0; i < wormholeCount; i++) {
            if (Math.random() < WORLD_GEN.WORMHOLE_SPAWN_PROBABILITY) {
                const wormhole = this.generateWormhole();
                this.wormholes.push(wormhole);
            }
        }
        
        this.generated = true;
    }
    
    generatePlanet(index, orbitDistance) {
        const planetTypes = [
            { type: 'Rocky', color: '#8d6e63', size: 0.8, atmosphere: false },
            { type: 'Desert', color: '#ffb74d', size: 1.0, atmosphere: true },
            { type: 'Ocean', color: '#42a5f5', size: 1.2, atmosphere: true },
            { type: 'Forest', color: '#66bb6a', size: 1.1, atmosphere: true },
            { type: 'Ice', color: '#e1f5fe', size: 0.9, atmosphere: false },
            { type: 'Gas Giant', color: '#ab47bc', size: 2.5, atmosphere: true },
            { type: 'Volcanic', color: '#f44336', size: 1.0, atmosphere: true }
        ];
        
        const planetType = planetTypes[Math.floor(Math.random() * planetTypes.length)];
        const angle = Math.random() * 2 * Math.PI;
        
        return {
            id: IDGenerator.generate(),
            name: `${this.name.split(' ')[0]} ${index + 1}`,
            type: planetType.type,
            color: planetType.color,
            size: planetType.size,
            atmosphere: planetType.atmosphere,
            orbitDistance,
            orbitAngle: angle,
            x: Math.cos(angle) * orbitDistance,
            y: Math.sin(angle) * orbitDistance,
            orbitSpeed: WORLD_GEN.PLANET_BASE_ORBIT_SPEED / Math.sqrt(orbitDistance), // Kepler's laws approximation
            resources: this.generatePlanetResources(planetType),
            moons: this.generateMoons(index, planetType.size)
        };
    }
    
    generatePlanetResources(planetType) {
        const baseResources = ['iron', 'water', 'minerals'];
        const specialResources = {
            'Rocky': ['titanium', 'rare_metals'],
            'Desert': ['silicon', 'crystals'],
            'Ocean': ['hydrogen', 'organic_compounds'],
            'Forest': ['biomass', 'pharmaceuticals'],
            'Ice': ['water', 'frozen_gases'],
            'Gas Giant': ['helium', 'hydrogen', 'exotic_gases'],
            'Volcanic': ['sulfur', 'rare_minerals', 'thermal_energy']
        };
        
        const resources = [...baseResources];
        const special = specialResources[planetType.type] || [];
        
        // Add some special resources randomly
        special.forEach(resource => {
            if (Math.random() < WORLD_GEN.RESOURCE_SPAWN_PROBABILITY) {
                resources.push(resource);
            }
        });
        
        return resources.map(resource => ({
            type: resource,
            abundance: Math.random() * (WORLD_GEN.MAX_RESOURCE_ABUNDANCE - WORLD_GEN.MIN_RESOURCE_ABUNDANCE) + WORLD_GEN.MIN_RESOURCE_ABUNDANCE // 20-120% abundance
        }));
    }
    
    generateMoons(planetIndex, planetSize) {
        const moonCount = Math.floor(Math.random() * (WORLD_GEN.MAX_MOONS_PER_PLANET + 1));
        const moons = [];
        
        for (let i = 0; i < moonCount; i++) {
            const moonDistance = (planetSize * WORLD_GEN.MOON_BASE_DISTANCE_MULTIPLIER) + (i * WORLD_GEN.MOON_ORBIT_SPACING) + Math.random() * WORLD_GEN.MOON_ORBIT_RANDOMNESS; // Distance from planet
            const moonAngle = Math.random() * 2 * Math.PI;
            const moonSize = Math.random() * WORLD_GEN.MOON_MAX_SIZE_RATIO + WORLD_GEN.MOON_MIN_SIZE_RATIO; // 10-40% of planet size
            
            const moonTypes = [
                { type: 'Rocky Moon', color: '#9e9e9e', resources: ['iron', 'titanium'] },
                { type: 'Ice Moon', color: '#e3f2fd', resources: ['water', 'frozen_gases'] },
                { type: 'Volcanic Moon', color: '#ff7043', resources: ['sulfur', 'rare_minerals'] },
                { type: 'Dead Moon', color: '#757575', resources: ['dust', 'minerals'] }
            ];
            
            const moonType = moonTypes[Math.floor(Math.random() * moonTypes.length)];
            
            moons.push({
                id: IDGenerator.generate(),
                name: `${this.name.split(' ')[0]} ${planetIndex + 1}-${i + 1}`,
                type: moonType.type,
                color: moonType.color,
                size: moonSize,
                orbitDistance: moonDistance,
                orbitAngle: moonAngle,
                x: Math.cos(moonAngle) * moonDistance, // Relative to planet
                y: Math.sin(moonAngle) * moonDistance,
                orbitSpeed: WORLD_GEN.PLANET_BASE_ORBIT_SPEED * 2 / Math.sqrt(moonDistance), // Faster orbital speed
                resources: this.generateMoonResources(moonType),
                tidallyLocked: Math.random() < WORLD_GEN.MOON_TIDAL_LOCK_PROBABILITY // 70% chance of tidal locking
            });
        }
        
        return moons;
    }
    
    generateMoonResources(moonType) {
        const resources = [];
        
        moonType.resources.forEach(resource => {
            if (Math.random() < WORLD_GEN.RESOURCE_SPAWN_PROBABILITY * WORLD_GEN.MOON_RESOURCE_SPAWN_MULTIPLIER) { // Slightly lower spawn rate than planets
                resources.push({
                    type: resource,
                    abundance: Math.random() * (WORLD_GEN.MAX_RESOURCE_ABUNDANCE * WORLD_GEN.MOON_RESOURCE_ABUNDANCE_MULTIPLIER - WORLD_GEN.MIN_RESOURCE_ABUNDANCE * WORLD_GEN.MOON_RESOURCE_ABUNDANCE_MIN_MULTIPLIER) + WORLD_GEN.MIN_RESOURCE_ABUNDANCE * WORLD_GEN.MOON_RESOURCE_ABUNDANCE_MIN_MULTIPLIER // Lower abundance than planets
                });
            }
        });
        
        return resources;
    }
    
    generateAsteroidBelt() {
        const beltDistance = Math.random() * (WORLD_GEN.MAX_ASTEROID_BELT_DISTANCE - WORLD_GEN.MIN_ASTEROID_BELT_DISTANCE) + WORLD_GEN.MIN_ASTEROID_BELT_DISTANCE; // 300-1100 units from star
        const asteroidCount = Math.floor(Math.random() * (WORLD_GEN.MAX_ASTEROIDS_PER_BELT - WORLD_GEN.MIN_ASTEROIDS_PER_BELT)) + WORLD_GEN.MIN_ASTEROIDS_PER_BELT;
        const asteroids = [];
        
        for (let i = 0; i < asteroidCount; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const distance = beltDistance + (Math.random() - WORLD_GEN.BELT_CENTER_OFFSET) * WORLD_GEN.BELT_SPREAD; // Spread within belt
            
            asteroids.push({
                id: IDGenerator.generate(),
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                size: Math.random() * (WORLD_GEN.MAX_ASTEROID_SIZE - WORLD_GEN.MIN_ASTEROID_SIZE) + WORLD_GEN.MIN_ASTEROID_SIZE, // 5-25 units
                rotation: Math.random() * WORLD_GEN.FULL_CIRCLE_DEGREES,
                rotationSpeed: (Math.random() - WORLD_GEN.ROTATION_SPEED_VARIANCE) * 2,
                resources: this.generateAsteroidResources(),
                orbitSpeed: WORLD_GEN.ASTEROID_BASE_ORBIT_SPEED / Math.sqrt(distance)
            });
        }
        
        return {
            id: IDGenerator.generate(),
            centerDistance: beltDistance,
            asteroids,
            density: asteroidCount / WORLD_GEN.BELT_SPREAD // Asteroids per 100 square units
        };
    }
    
    generateAsteroidResources() {
        const resources = ['iron', 'nickel', 'rare_metals', 'crystals', 'ice'];
        const selected = [];
        
        resources.forEach(resource => {
            if (Math.random() < WORLD_GEN.ASTEROID_RESOURCE_PROBABILITY) { // 40% chance for each resource
                selected.push({
                    type: resource,
                    abundance: Math.random() * (WORLD_GEN.MAX_ASTEROID_ABUNDANCE - WORLD_GEN.MIN_ASTEROID_ABUNDANCE) + WORLD_GEN.MIN_ASTEROID_ABUNDANCE // 10-60% abundance
                });
            }
        });
        
        return selected;
    }
    
    generateSpaceStation() {
        const stationTypes = [
            { type: 'Trading Post', services: ['trading', 'refuel', 'repair'] },
            { type: 'Mining Station', services: ['trading', 'mining_equipment', 'ore_processing'] },
            { type: 'Research Station', services: ['technology', 'ship_upgrades', 'data'] },
            { type: 'Military Outpost', services: ['weapons', 'armor', 'security'] },
            { type: 'Refinery', services: ['fuel', 'materials_processing', 'trading'] }
        ];
        
        const stationType = stationTypes[Math.floor(Math.random() * stationTypes.length)];
        const distance = Math.random() * (WORLD_GEN.MAX_STATION_DISTANCE - WORLD_GEN.MIN_STATION_DISTANCE) + WORLD_GEN.MIN_STATION_DISTANCE; // 200-800 units from star
        const angle = Math.random() * 2 * Math.PI;
        
        return {
            id: IDGenerator.generate(),
            name: `${stationType.type} ${Math.floor(Math.random() * WORLD_GEN.STATION_NAME_MAX_NUMBER) + 1}`,
            type: stationType.type,
            services: stationType.services,
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            faction: this.generateFaction(),
            inventory: this.generateStationInventory(stationType),
            dockingBays: Math.floor(Math.random() * (WORLD_GEN.MAX_DOCKING_BAYS - WORLD_GEN.MIN_DOCKING_BAYS)) + WORLD_GEN.MIN_DOCKING_BAYS, // 2-7 docking bays
            population: Math.floor(Math.random() * (WORLD_GEN.MAX_STATION_POPULATION - WORLD_GEN.MIN_STATION_POPULATION)) + WORLD_GEN.MIN_STATION_POPULATION
        };
    }
    
    generateFaction() {
        const factions = [
            'Independent Traders',
            'Mining Consortium',
            'Research Coalition',
            'Security Forces',
            'Colonial Union',
            'Free Merchants'
        ];
        
        return factions[Math.floor(Math.random() * factions.length)];
    }
    
    generateStationInventory(stationType) {
        const inventoryTemplates = {
            'Trading Post': ['food', 'water', 'fuel', 'basic_materials', 'consumer_goods'],
            'Mining Station': ['mining_equipment', 'industrial_tools', 'raw_materials', 'fuel'],
            'Research Station': ['technology', 'data_cores', 'research_equipment', 'rare_materials'],
            'Military Outpost': ['weapons', 'armor', 'ammunition', 'military_supplies'],
            'Refinery': ['fuel', 'refined_materials', 'chemicals', 'processed_goods']
        };
        
        const items = inventoryTemplates[stationType.type] || inventoryTemplates['Trading Post'];
        const inventory = {};
        
        items.forEach(item => {
            inventory[item] = {
                stock: Math.floor(Math.random() * (WORLD_GEN.MAX_STATION_STOCK - WORLD_GEN.MIN_STATION_STOCK)) + WORLD_GEN.MIN_STATION_STOCK,
                buyPrice: Math.floor(Math.random() * (WORLD_GEN.MAX_BUY_PRICE - WORLD_GEN.MIN_BUY_PRICE)) + WORLD_GEN.MIN_BUY_PRICE,
                sellPrice: Math.floor(Math.random() * (WORLD_GEN.MAX_SELL_PRICE - WORLD_GEN.MIN_SELL_PRICE)) + WORLD_GEN.MIN_SELL_PRICE
            };
        });
        
        return inventory;
    }
    
    generateJumpGate() {
        const distance = Math.random() * (WORLD_GEN.MAX_JUMP_GATE_DISTANCE - WORLD_GEN.MIN_JUMP_GATE_DISTANCE) + WORLD_GEN.MIN_JUMP_GATE_DISTANCE; // 400-1400 units from star
        const angle = Math.random() * 2 * Math.PI;
        
        return {
            id: IDGenerator.generate(),
            name: `Gate ${Math.floor(Math.random() * WORLD_GEN.GATE_NAME_MAX_NUMBER) + 1}`,
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            destinationSystem: null, // To be connected by galaxy generator
            isActive: Math.random() < WORLD_GEN.GATE_ACTIVE_PROBABILITY, // 90% chance to be active
            energyCost: Math.floor(Math.random() * (WORLD_GEN.MAX_ENERGY_COST - WORLD_GEN.MIN_ENERGY_COST)) + WORLD_GEN.MIN_ENERGY_COST,
            size: Math.random() * (WORLD_GEN.MAX_JUMP_GATE_SIZE - WORLD_GEN.MIN_JUMP_GATE_SIZE) + WORLD_GEN.MIN_JUMP_GATE_SIZE // Visual size
        };
    }
    
    generateWormhole() {
        const distance = Math.random() * (WORLD_GEN.MAX_WORMHOLE_DISTANCE - WORLD_GEN.MIN_WORMHOLE_DISTANCE) + WORLD_GEN.MIN_WORMHOLE_DISTANCE;
        const angle = Math.random() * 2 * Math.PI;
        const size = Math.random() * (WORLD_GEN.MAX_WORMHOLE_SIZE - WORLD_GEN.MIN_WORMHOLE_SIZE) + WORLD_GEN.MIN_WORMHOLE_SIZE;
        const instability = Math.random() * (WORLD_GEN.WORMHOLE_INSTABILITY_MAX - WORLD_GEN.WORMHOLE_INSTABILITY_MIN) + WORLD_GEN.WORMHOLE_INSTABILITY_MIN;
        
        const wormholeTypes = [
            { type: 'Stable', color: '#8A2BE2', danger: 0.1 },
            { type: 'Unstable', color: '#FF4500', danger: 0.5 },
            { type: 'Collapsed', color: '#8B0000', danger: 0.9 }
        ];
        
        const wormholeType = wormholeTypes[Math.floor(Math.random() * wormholeTypes.length)];
        
        return {
            id: IDGenerator.generate(),
            name: `Wormhole ${String.fromCharCode(WORLD_GEN.WORMHOLE_NAME_LETTER_BASE + Math.floor(Math.random() * WORLD_GEN.WORMHOLE_NAME_LETTER_COUNT))}${Math.floor(Math.random() * WORLD_GEN.WORMHOLE_NAME_NUMBER_MAX) + 1}`,
            type: wormholeType.type,
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            size,
            instability,
            color: wormholeType.color,
            dangerLevel: wormholeType.danger,
            destinationSystem: null, // To be connected by galaxy generator
            isActive: instability < WORLD_GEN.WORMHOLE_INACTIVE_INSTABILITY_THRESHOLD,
            energyFluctuation: Math.random() * WORLD_GEN.WORMHOLE_ENERGY_FLUCTUATION_RANGE + WORLD_GEN.WORMHOLE_ENERGY_FLUCTUATION_BASE,
            temporalDistortion: Math.random() * WORLD_GEN.WORMHOLE_TEMPORAL_DISTORTION_MAX
        };
    }
    
    updateOrbits(deltaTime) {
        // Update planet positions
        this.planets.forEach(planet => {
            planet.orbitAngle += planet.orbitSpeed * deltaTime;
            planet.x = Math.cos(planet.orbitAngle) * planet.orbitDistance;
            planet.y = Math.sin(planet.orbitAngle) * planet.orbitDistance;
            
            // Update moon positions relative to their planet
            planet.moons.forEach(moon => {
                moon.orbitAngle += moon.orbitSpeed * deltaTime;
                // Calculate moon position relative to planet
                const moonRelativeX = Math.cos(moon.orbitAngle) * moon.orbitDistance;
                const moonRelativeY = Math.sin(moon.orbitAngle) * moon.orbitDistance;
                // Position moon in world space (planet position + relative position)
                moon.x = planet.x + moonRelativeX;
                moon.y = planet.y + moonRelativeY;
            });
        });
        
        // Update asteroid belt positions
        this.asteroidBelts.forEach(belt => {
            belt.asteroids.forEach(asteroid => {
                // Cache orbital distance if not already cached
                if (asteroid.cachedDistance === undefined) {
                    asteroid.cachedDistance = Math.sqrt(asteroid.x * asteroid.x + asteroid.y * asteroid.y);
                    asteroid.currentAngle = Math.atan2(asteroid.y, asteroid.x);
                }
                
                // Update angle more efficiently using cached values
                asteroid.currentAngle += asteroid.orbitSpeed * deltaTime;
                
                // Update position using cached distance
                asteroid.x = Math.cos(asteroid.currentAngle) * asteroid.cachedDistance;
                asteroid.y = Math.sin(asteroid.currentAngle) * asteroid.cachedDistance;
                asteroid.rotation += asteroid.rotationSpeed * deltaTime;
            });
        });
    }
    
    getSystemInfo() {
        const totalMoons = this.planets.reduce((count, planet) => count + planet.moons.length, 0);
        
        return {
            id: this.id,
            name: this.name,
            coordinates: this.coordinates,
            star: this.star,
            planetCount: this.planets.length,
            moonCount: totalMoons,
            asteroidBeltCount: this.asteroidBelts.length,
            spaceStationCount: this.spaceStations.length,
            jumpGateCount: this.jumpGates.length,
            wormholeCount: this.wormholes.length
        };
    }
    
    getAllBodies() {
        // Collect all moons from all planets
        const allMoons = [];
        this.planets.forEach(planet => {
            allMoons.push(...planet.moons);
        });
        
        return {
            star: this.star,
            planets: this.planets,
            moons: allMoons,
            asteroidBelts: this.asteroidBelts,
            spaceStations: this.spaceStations,
            jumpGates: this.jumpGates,
            wormholes: this.wormholes
        };
    }
    
    renderSystem(graphics) {
        const systemGroup = graphics.createElement('g');
        systemGroup.setAttribute('id', `star-system-${this.id}`);
        
        // Render star using enhanced graphics engine with spectral class
        const starElement = graphics.createStar(
            this.star.x, 
            this.star.y, 
            this.star.size, 
            this.star.color, 
            this.star.spectralClass
        );
        starElement.setAttribute('class', 'star');
        starElement.setAttribute('data-spectral-class', this.star.spectralClass);
        starElement.setAttribute('data-star-type', this.star.type);
        systemGroup.appendChild(starElement);
        
        // Render planets and their moons
        this.planets.forEach(planet => {
            const planetElement = graphics.createElement('circle');
            planetElement.setAttribute('cx', planet.x);
            planetElement.setAttribute('cy', planet.y);
            planetElement.setAttribute('r', planet.size);
            planetElement.setAttribute('fill', planet.color);
            planetElement.setAttribute('class', 'planet');
            systemGroup.appendChild(planetElement);
            
            // Render planet's moons
            planet.moons.forEach(moon => {
                const moonElement = graphics.createElement('circle');
                moonElement.setAttribute('cx', moon.x);
                moonElement.setAttribute('cy', moon.y);
                moonElement.setAttribute('r', moon.size * planet.size);
                moonElement.setAttribute('fill', moon.color);
                moonElement.setAttribute('class', 'moon');
                systemGroup.appendChild(moonElement);
            });
        });
        
        // Render asteroid belts
        this.asteroidBelts.forEach(belt => {
            belt.asteroids.forEach(asteroid => {
                const asteroidElement = graphics.createElement('circle');
                asteroidElement.setAttribute('cx', asteroid.x);
                asteroidElement.setAttribute('cy', asteroid.y);
                asteroidElement.setAttribute('r', asteroid.size);
                asteroidElement.setAttribute('fill', '#8d6e63');
                asteroidElement.setAttribute('class', 'asteroid');
                systemGroup.appendChild(asteroidElement);
            });
        });
        
        // Render space stations
        this.spaceStations.forEach(station => {
            const stationElement = graphics.createElement('rect');
            stationElement.setAttribute('x', station.x - GRAPHICS.STATION_RENDER_SIZE);
            stationElement.setAttribute('y', station.y - GRAPHICS.STATION_RENDER_SIZE);
            stationElement.setAttribute('width', GRAPHICS.STATION_RENDER_WIDTH);
            stationElement.setAttribute('height', GRAPHICS.STATION_RENDER_HEIGHT);
            stationElement.setAttribute('fill', '#2196f3');
            stationElement.setAttribute('class', 'space-station');
            systemGroup.appendChild(stationElement);
        });
        
        // Render jump gates
        this.jumpGates.forEach(gate => {
            const gateElement = graphics.createElement('circle');
            gateElement.setAttribute('cx', gate.x);
            gateElement.setAttribute('cy', gate.y);
            gateElement.setAttribute('r', GRAPHICS.JUMP_GATE_RENDER_RADIUS);
            gateElement.setAttribute('fill', 'none');
            gateElement.setAttribute('stroke', '#9c27b0');
            gateElement.setAttribute('stroke-width', '3');
            gateElement.setAttribute('class', 'jump-gate');
            systemGroup.appendChild(gateElement);
        });
        
        // Render wormholes using the graphics engine
        this.wormholes.forEach(wormhole => {
            const wormholeElement = graphics.createWormhole(wormhole.x, wormhole.y, wormhole.size, {
                id: wormhole.id,
                class: 'wormhole'
            });
            systemGroup.appendChild(wormholeElement);
        });
        
        return systemGroup;
    }
    
    findNearestStation(x, y, maxDistance = WORLD_GEN.DEFAULT_INTERACTION_RANGE) {
        let nearest = null;
        let nearestDistance = maxDistance;
        
        this.spaceStations.forEach(station => {
            const distance = Math.sqrt((station.x - x) ** 2 + (station.y - y) ** 2);
            if (distance < nearestDistance) {
                nearest = station;
                nearestDistance = distance;
            }
        });
        
        return nearest;
    }
    
    findNearestJumpGate(x, y, maxDistance = WORLD_GEN.DEFAULT_INTERACTION_RANGE) {
        let nearest = null;
        let nearestDistance = maxDistance;
        
        this.jumpGates.forEach(gate => {
            const distance = Math.sqrt((gate.x - x) ** 2 + (gate.y - y) ** 2);
            if (distance < nearestDistance && gate.isActive) {
                nearest = gate;
                nearestDistance = distance;
            }
        });
        
        return nearest;
    }
    
    findNearestWormhole(x, y, maxDistance = WORLD_GEN.DEFAULT_INTERACTION_RANGE) {
        let nearest = null;
        let nearestDistance = maxDistance;
        
        this.wormholes.forEach(wormhole => {
            const distance = Math.sqrt((wormhole.x - x) ** 2 + (wormhole.y - y) ** 2);
            if (distance < nearestDistance && wormhole.isActive) {
                nearest = wormhole;
                nearestDistance = distance;
            }
        });
        
        return nearest;
    }
}