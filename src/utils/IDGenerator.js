/**
 * ID Generator Utility
 * Generates unique identifiers for game objects across sectors
 * Uses deterministic generation for multiplayer consistency
 */

// Constants for hash function and ID generation
const HASH_SHIFT = 5;
const BASE_36_RADIX = 36;
const MIN_ID_PARTS = 3;

export class IDGenerator {
    constructor(seed = 'max-pixels') {
        this.seed = seed;
        this.counter = 0;
        this.sectorCounters = new Map();
    }
    
    /**
     * Simple hash function for deterministic pseudo-random numbers
     * @param {string} str - String to hash
     * @returns {number} - Hash value
     */
    hash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << HASH_SHIFT) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    
    /**
     * Generate a unique ID for any game object
     * @param {string} prefix - Object type prefix (e.g., 'asteroid', 'station', 'planet')
     * @param {string} sectorId - Sector identifier
     * @param {number|string} index - Object index or identifier within sector
     * @returns {string} - Unique object ID
     */
    generateObjectId(prefix, sectorId, index) {
        // Create deterministic ID based on sector, prefix, and index
        const baseString = `${this.seed}-${sectorId}-${prefix}-${index}`;
        const hashValue = this.hash(baseString);
        return `${prefix}_${sectorId}_${hashValue.toString(BASE_36_RADIX)}_${index}`;
    }
    
    /**
     * Generate a sequential ID within a specific sector
     * @param {string} sectorId - Sector identifier
     * @param {string} prefix - Object type prefix
     * @returns {string} - Sequential sector-specific ID
     */
    generateSectorId(sectorId, prefix) {
        if (!this.sectorCounters.has(sectorId)) {
            this.sectorCounters.set(sectorId, new Map());
        }
        
        const sectorMap = this.sectorCounters.get(sectorId);
        const currentCount = sectorMap.get(prefix) || 0;
        const newCount = currentCount + 1;
        
        sectorMap.set(prefix, newCount);
        
        return this.generateObjectId(prefix, sectorId, newCount);
    }
    
    /**
     * Generate a global unique ID (not sector-specific)
     * @param {string} prefix - Object type prefix
     * @returns {string} - Global unique ID
     */
    generateGlobalId(prefix) {
        this.counter++;
        const timestamp = Date.now().toString(BASE_36_RADIX);
        const counterStr = this.counter.toString(BASE_36_RADIX);
        const hashValue = this.hash(`${this.seed}-global-${prefix}-${this.counter}`);
        
        return `${prefix}_${timestamp}_${hashValue.toString(BASE_36_RADIX)}_${counterStr}`;
    }
    
    /**
     * Generate deterministic asteroid IDs for a sector
     * @param {string} sectorId - Sector identifier
     * @param {number} asteroidCount - Number of asteroids in sector
     * @returns {string[]} - Array of asteroid IDs
     */
    generateAsteroidIds(sectorId, asteroidCount) {
        const ids = [];
        for (let i = 0; i < asteroidCount; i++) {
            ids.push(this.generateObjectId('asteroid', sectorId, i));
        }
        return ids;
    }
    
    /**
     * Generate station IDs with their data
     * @param {string} sectorId - Sector identifier
     * @param {Array} stations - Array of station data objects
     * @returns {Array} - Station objects with added IDs
     */
    generateStationIds(sectorId, stations) {
        return stations.map((station, index) => ({
            ...station,
            uniqueId: this.generateObjectId('station', sectorId, index),
            // Keep original id as stationType for backwards compatibility
            stationType: station.id,
            id: this.generateObjectId('station', sectorId, index)
        }));
    }
    
    /**
     * Generate planet IDs with their data
     * @param {string} sectorId - Sector identifier
     * @param {Array} planets - Array of planet data objects
     * @returns {Array} - Planet objects with added IDs
     */
    generatePlanetIds(sectorId, planets) {
        return planets.map((planet, index) => ({
            ...planet,
            id: this.generateObjectId('planet', sectorId, index)
        }));
    }
    
    /**
     * Generate jump gate IDs with their data
     * @param {string} sectorId - Sector identifier
     * @param {Array} jumpGates - Array of jump gate data objects
     * @returns {Array} - Jump gate objects with updated IDs
     */
    generateJumpGateIds(sectorId, jumpGates) {
        return jumpGates.map((gate, index) => ({
            ...gate,
            uniqueId: this.generateObjectId('jumpgate', sectorId, index),
            // Keep original id as gateType for backwards compatibility
            gateType: gate.id,
            id: this.generateObjectId('jumpgate', sectorId, index)
        }));
    }
    
    /**
     * Validate ID format
     * @param {string} id - ID to validate
     * @returns {boolean} - True if ID format is valid
     */
    isValidId(id) {
        if (typeof id !== 'string' || id.length === 0) return false;
        
        // Check for basic format: prefix_component_component_...
        const parts = id.split('_');
        return parts.length >= MIN_ID_PARTS && parts[0].length > 0;
    }
    
    /**
     * Extract object type from ID
     * @param {string} id - Object ID
     * @returns {string|null} - Object type prefix or null if invalid
     */
    getObjectType(id) {
        if (!this.isValidId(id)) return null;
        return id.split('_')[0];
    }
    
    /**
     * Reset counters (useful for testing or reinitializing)
     */
    reset() {
        this.counter = 0;
        this.sectorCounters.clear();
    }
}

// Export singleton instance for consistent ID generation
export const gameIDGenerator = new IDGenerator('max-pixels-v1');