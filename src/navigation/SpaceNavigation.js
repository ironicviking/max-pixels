/**
 * Space Navigation System
 * Manages multiple star systems/sectors and travel between them
 */

import { NAVIGATION } from '../constants.js';
import { gameIDGenerator } from '../utils/IDGenerator.js';

export class SpaceNavigation {
    constructor() {
        this.currentSector = 'alpha-sector';
        this.sectors = new Map();
        this.jumpGates = new Map();
        this.isJumping = false;
        this.jumpCooldown = 2000; // 2 seconds
        this.lastJumpTime = 0;
        
        this.initializeSectors();
    }
    
    initializeSectors() {
        // Alpha Sector (starting area)
        this.sectors.set('alpha-sector', {
            id: 'alpha-sector',
            name: 'Alpha Sector',
            bounds: { width: 1920, height: 1080 },
            description: 'A peaceful trading hub with abundant resources',
            backgroundColor: '#000814',
            nebulaTypes: ['blue', 'purple'],
            dustDensity: 1.0,
            debrisDensity: 0.3, // Light debris in peaceful sector
            stations: [
                {
                    id: 'tradingStation',
                    x: 800,
                    y: 600,
                    radius: 40,
                    type: 'trading',
                    name: 'Trading Outpost Alpha'
                }
            ],
            planets: [
                {
                    x: 1200,
                    y: 300,
                    radius: 60,
                    surfaceColor: '#8b4513',
                    coreColor: '#654321',
                    atmosphereColor: '#4488ff'
                }
            ],
            asteroids: 15,
            jumpGates: [
                {
                    id: 'alpha-to-beta',
                    x: 1800,
                    y: 540,
                    radius: 50,
                    destination: 'beta-sector',
                    name: 'Beta Sector Gate'
                }
            ]
        });
        
        // Beta Sector (mining area)
        this.sectors.set('beta-sector', {
            id: 'beta-sector',
            name: 'Beta Sector',
            bounds: { width: 2400, height: 1400 },
            description: 'Rich mining sector with dangerous asteroid fields',
            backgroundColor: '#1a0e0e',
            nebulaTypes: ['red', 'purple'],
            dustDensity: 1.5,
            debrisDensity: 1.2, // Heavy debris in dangerous mining sector
            stations: [
                {
                    id: 'miningStation',
                    x: 400,
                    y: 700,
                    radius: 35,
                    type: 'mining',
                    name: 'Mining Outpost Beta'
                }
            ],
            planets: [
                {
                    x: 1800,
                    y: 400,
                    radius: 80,
                    surfaceColor: '#cc4125',
                    coreColor: '#8b1538',
                    atmosphereColor: '#ff6b35'
                }
            ],
            asteroids: 25,
            jumpGates: [
                {
                    id: 'beta-to-alpha',
                    x: 200,
                    y: 700,
                    radius: 50,
                    destination: 'alpha-sector',
                    name: 'Alpha Sector Gate'
                },
                {
                    id: 'beta-to-gamma',
                    x: 2200,
                    y: 200,
                    radius: 50,
                    destination: 'gamma-sector',
                    name: 'Gamma Sector Gate'
                }
            ]
        });
        
        // Gamma Sector (frontier area)
        this.sectors.set('gamma-sector', {
            id: 'gamma-sector',
            name: 'Gamma Sector',
            bounds: { width: 2800, height: 1600 },
            description: 'Frontier sector with unknown dangers and opportunities',
            backgroundColor: '#0e1a0e',
            nebulaTypes: ['green', 'blue'],
            dustDensity: 0.7,
            debrisDensity: 0.8, // Moderate debris in frontier sector
            stations: [
                {
                    id: 'researchStation',
                    x: 1400,
                    y: 800,
                    radius: 45,
                    type: 'research',
                    name: 'Research Station Gamma'
                }
            ],
            planets: [
                {
                    x: 600,
                    y: 300,
                    radius: 45,
                    surfaceColor: '#2d5016',
                    coreColor: '#1a2e0a',
                    atmosphereColor: '#4d8c2a'
                },
                {
                    x: 2200,
                    y: 1200,
                    radius: 70,
                    surfaceColor: '#4a4a4a',
                    coreColor: '#2a2a2a',
                    atmosphereColor: '#6a6a6a'
                }
            ],
            asteroids: 20,
            jumpGates: [
                {
                    id: 'gamma-to-beta',
                    x: 100,
                    y: 100,
                    radius: 50,
                    destination: 'beta-sector',
                    name: 'Beta Sector Gate'
                }
            ]
        });
        
        // Build jump gate lookup for quick access
        this.buildJumpGateMap();
        
        // Generate unique IDs for all objects in sectors
        this.assignObjectIds();
    }
    
    buildJumpGateMap() {
        this.sectors.forEach((sector) => {
            sector.jumpGates.forEach((gate) => {
                this.jumpGates.set(gate.id, {
                    ...gate,
                    currentSector: sector.id
                });
            });
        });
    }
    
    /**
     * Assign unique IDs to all objects in all sectors for multiplayer consistency
     */
    assignObjectIds() {
        this.sectors.forEach((sector, sectorId) => {
            // Generate unique IDs for stations
            if (sector.stations && sector.stations.length > 0) {
                sector.stations = gameIDGenerator.generateStationIds(sectorId, sector.stations);
            }
            
            // Generate unique IDs for planets
            if (sector.planets && sector.planets.length > 0) {
                sector.planets = gameIDGenerator.generatePlanetIds(sectorId, sector.planets);
            }
            
            // Generate unique IDs for jump gates
            if (sector.jumpGates && sector.jumpGates.length > 0) {
                sector.jumpGates = gameIDGenerator.generateJumpGateIds(sectorId, sector.jumpGates);
            }
            
            // Generate asteroid IDs and store them for later asteroid generation
            if (sector.asteroids && typeof sector.asteroids === 'number') {
                sector.asteroidIds = gameIDGenerator.generateAsteroidIds(sectorId, sector.asteroids);
            }
            
            // Add sector metadata
            sector.generatedAt = Date.now();
            sector.idVersion = 'v1';
        });
        
        // Rebuild jump gate map with new IDs
        this.jumpGates.clear();
        this.buildJumpGateMap();
    }
    
    getCurrentSector() {
        return this.sectors.get(this.currentSector);
    }
    
    getSectorData(sectorId) {
        return this.sectors.get(sectorId);
    }
    
    getAllSectors() {
        return Array.from(this.sectors.values());
    }
    
    canJump() {
        const now = Date.now();
        return !this.isJumping && (now - this.lastJumpTime) >= this.jumpCooldown;
    }
    
    checkJumpGateProximity(playerX, playerY, interactionRange = NAVIGATION.PROXIMITY_CHECK_RANGE) {
        const currentSector = this.getCurrentSector();
        if (!currentSector) return null;
        
        for (const gate of currentSector.jumpGates) {
            const distance = Math.sqrt(
                Math.pow(playerX - gate.x, 2) + 
                Math.pow(playerY - gate.y, 2)
            );
            
            if (distance < interactionRange) {
                return gate;
            }
        }
        return null;
    }
    
    async jumpToSector(destinationSectorId, onJumpStart = null, onJumpComplete = null) {
        if (!this.canJump()) {
            console.log('Jump on cooldown or already jumping');
            return false;
        }
        
        const destinationSector = this.sectors.get(destinationSectorId);
        if (!destinationSector) {
            console.error(`Sector ${destinationSectorId} not found`);
            return false;
        }
        
        this.isJumping = true;
        this.lastJumpTime = Date.now();
        
        console.log(`Jumping from ${this.currentSector} to ${destinationSectorId}`);
        
        if (onJumpStart) {
            onJumpStart(this.currentSector, destinationSectorId);
        }
        
        // Simulate jump animation delay
        await new Promise(resolve => setTimeout(resolve, NAVIGATION.JUMP_COOLDOWN));
        
        this.currentSector = destinationSectorId;
        this.isJumping = false;
        
        if (onJumpComplete) {
            onJumpComplete(destinationSectorId, destinationSector);
        }
        
        return true;
    }
    
    getPlayerSpawnPosition(sectorId) {
        const sector = this.sectors.get(sectorId);
        if (!sector) return { x: NAVIGATION.SPAWN_OFFSET, y: NAVIGATION.SPAWN_OFFSET };
        
        // Find the jump gate that leads back to previous sector
        // and spawn player near it
        const jumpGate = sector.jumpGates.find(gate => 
            gate.destination !== sectorId
        );
        
        if (jumpGate) {
            return {
                x: jumpGate.x + NAVIGATION.SPAWN_OFFSET,
                y: jumpGate.y
            };
        }
        
        // Default spawn in safe area
        return {
            x: Math.min(NAVIGATION.GATE_SPAWN_X, sector.bounds.width * NAVIGATION.GATE_SPAWN_MARGIN),
            y: Math.min(NAVIGATION.GATE_SPAWN_Y, sector.bounds.height * NAVIGATION.GATE_SPAWN_MARGIN)
        };
    }
    
    getJumpGateInfo(gateId) {
        return this.jumpGates.get(gateId);
    }
    
    isValidSector(sectorId) {
        return this.sectors.has(sectorId);
    }
    
    getSectorBounds(sectorId = null) {
        const sector = sectorId ? this.sectors.get(sectorId) : this.getCurrentSector();
        return sector ? sector.bounds : { width: 1920, height: 1080 };
    }
    
    getSectorDescription(sectorId = null) {
        const sector = sectorId ? this.sectors.get(sectorId) : this.getCurrentSector();
        return sector ? `${sector.name}: ${sector.description}` : 'Unknown sector';
    }
    
    /**
     * Find a game object by its unique ID across all sectors
     * @param {string} objectId - Unique object ID
     * @returns {Object|null} - Object data with sector info or null if not found
     */
    findObjectById(objectId) {
        if (!gameIDGenerator.isValidId(objectId)) return null;
        
        const objectType = gameIDGenerator.getObjectType(objectId);
        
        for (const [sectorId, sector] of this.sectors) {
            let foundObject = null;
            
            switch (objectType) {
            case 'station':
                foundObject = sector.stations?.find(obj => obj.id === objectId || obj.uniqueId === objectId);
                break;
            case 'planet':
                foundObject = sector.planets?.find(obj => obj.id === objectId);
                break;
            case 'jumpgate':
                foundObject = sector.jumpGates?.find(obj => obj.id === objectId || obj.uniqueId === objectId);
                break;
            case 'asteroid':
                // For asteroids, we only have IDs stored, not full objects yet
                if (sector.asteroidIds?.includes(objectId)) {
                    foundObject = { 
                        id: objectId, 
                        type: 'asteroid',
                        index: sector.asteroidIds.indexOf(objectId)
                    };
                }
                break;
            }
            
            if (foundObject) {
                return {
                    ...foundObject,
                    sectorId,
                    sectorName: sector.name
                };
            }
        }
        
        return null;
    }
    
    /**
     * Get all objects of a specific type from a sector
     * @param {string} sectorId - Sector identifier
     * @param {string} objectType - Object type ('station', 'planet', 'jumpgate', 'asteroid')
     * @returns {Array} - Array of objects of the specified type
     */
    getSectorObjects(sectorId, objectType) {
        const sector = this.sectors.get(sectorId);
        if (!sector) return [];
        
        switch (objectType) {
        case 'station':
            return sector.stations || [];
        case 'planet':
            return sector.planets || [];
        case 'jumpgate':
            return sector.jumpGates || [];
        case 'asteroid':
            return sector.asteroidIds?.map((id, index) => ({
                id,
                type: 'asteroid',
                index
            })) || [];
        default:
            return [];
        }
    }
    
    /**
     * Get the total count of objects in a sector
     * @param {string} sectorId - Sector identifier
     * @returns {Object} - Object counts by type
     */
    getSectorObjectCounts(sectorId) {
        const sector = this.sectors.get(sectorId);
        if (!sector) return {};
        
        return {
            stations: sector.stations?.length || 0,
            planets: sector.planets?.length || 0,
            jumpGates: sector.jumpGates?.length || 0,
            asteroids: sector.asteroidIds?.length || sector.asteroids || 0
        };
    }
}