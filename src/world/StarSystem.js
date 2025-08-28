/**
 * StarSystem - Procedural Star System Generation
 * Generates star systems with planets, asteroids, and space stations
 */

import { IDGenerator } from '../utils/IDGenerator.js';
import { WORLD_GEN } from '../constants.js';

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
        const starTypes = [
            { type: 'Red Dwarf', color: '#ff6b6b', size: 0.6, temperature: 3000 },
            { type: 'Yellow Dwarf', color: '#ffd93d', size: 1.0, temperature: 5800 },
            { type: 'White Dwarf', color: '#ffffff', size: 0.8, temperature: 8000 },
            { type: 'Blue Giant', color: '#74c0fc', size: 1.5, temperature: 12000 },
            { type: 'Red Giant', color: '#ff8787', size: 2.0, temperature: 4000 }
        ];
        
        const starType = starTypes[Math.floor(Math.random() * starTypes.length)];
        
        return {
            id: IDGenerator.generate(),
            type: starType.type,
            color: starType.color,
            size: starType.size,
            temperature: starType.temperature,
            x: 0, // Stars are at system center
            y: 0,
            luminosity: starType.size * starType.temperature / WORLD_GEN.STAR_TEMPERATURE_REFERENCE // Relative to Sun
        };
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
            moons: Math.floor(Math.random() * (WORLD_GEN.MAX_MOONS_PER_PLANET + 1)) // 0-2 moons
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
    
    generateAsteroidBelt() {
        const beltDistance = Math.random() * (WORLD_GEN.MAX_ASTEROID_BELT_DISTANCE - WORLD_GEN.MIN_ASTEROID_BELT_DISTANCE) + WORLD_GEN.MIN_ASTEROID_BELT_DISTANCE; // 300-1100 units from star
        const asteroidCount = Math.floor(Math.random() * (WORLD_GEN.MAX_ASTEROIDS_PER_BELT - WORLD_GEN.MIN_ASTEROIDS_PER_BELT)) + WORLD_GEN.MIN_ASTEROIDS_PER_BELT;
        const asteroids = [];
        
        for (let i = 0; i < asteroidCount; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const distance = beltDistance + (Math.random() - 0.5) * WORLD_GEN.BELT_SPREAD; // Spread within belt
            
            asteroids.push({
                id: IDGenerator.generate(),
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                size: Math.random() * (WORLD_GEN.MAX_ASTEROID_SIZE - WORLD_GEN.MIN_ASTEROID_SIZE) + WORLD_GEN.MIN_ASTEROID_SIZE, // 5-25 units
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 2,
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
            name: `${stationType.type} ${Math.floor(Math.random() * 999) + 1}`,
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
            name: `Gate ${Math.floor(Math.random() * 26) + 1}`,
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            destinationSystem: null, // To be connected by galaxy generator
            isActive: Math.random() < WORLD_GEN.GATE_ACTIVE_PROBABILITY, // 90% chance to be active
            energyCost: Math.floor(Math.random() * (WORLD_GEN.MAX_ENERGY_COST - WORLD_GEN.MIN_ENERGY_COST)) + WORLD_GEN.MIN_ENERGY_COST,
            size: Math.random() * (WORLD_GEN.MAX_JUMP_GATE_SIZE - WORLD_GEN.MIN_JUMP_GATE_SIZE) + WORLD_GEN.MIN_JUMP_GATE_SIZE // Visual size
        };
    }
    
    updateOrbits(deltaTime) {
        // Update planet positions
        this.planets.forEach(planet => {
            planet.orbitAngle += planet.orbitSpeed * deltaTime;
            planet.x = Math.cos(planet.orbitAngle) * planet.orbitDistance;
            planet.y = Math.sin(planet.orbitAngle) * planet.orbitDistance;
        });
        
        // Update asteroid belt positions
        this.asteroidBelts.forEach(belt => {
            belt.asteroids.forEach(asteroid => {
                const currentAngle = Math.atan2(asteroid.y, asteroid.x);
                const distance = Math.sqrt(asteroid.x * asteroid.x + asteroid.y * asteroid.y);
                const newAngle = currentAngle + asteroid.orbitSpeed * deltaTime;
                
                asteroid.x = Math.cos(newAngle) * distance;
                asteroid.y = Math.sin(newAngle) * distance;
                asteroid.rotation += asteroid.rotationSpeed * deltaTime;
            });
        });
    }
    
    getSystemInfo() {
        return {
            id: this.id,
            name: this.name,
            coordinates: this.coordinates,
            star: this.star,
            planetCount: this.planets.length,
            asteroidBeltCount: this.asteroidBelts.length,
            spaceStationCount: this.spaceStations.length,
            jumpGateCount: this.jumpGates.length
        };
    }
    
    getAllBodies() {
        return {
            star: this.star,
            planets: this.planets,
            asteroidBelts: this.asteroidBelts,
            spaceStations: this.spaceStations,
            jumpGates: this.jumpGates
        };
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
}