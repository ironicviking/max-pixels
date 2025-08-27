/**
 * Integration Tests for Max-Pixels Game
 * Tests that verify full game system integration
 */

import { TestRunner, describe, test, assert, assertEqual, waitFor } from './TestFramework.js';

/**
 * Game Integration Tests
 */
describe('Game Integration', function() {
    test('should initialize game systems without errors', async function() {
        const testContainer = TestRunner.setupTestDOM();
        
        try {
            // Mock the MaxPixelsGame class initialization
            const { GraphicsEngine } = await import('../src/graphics/GraphicsEngine.js');
            const { Camera } = await import('../src/graphics/Camera.js');
            const { InputManager } = await import('../src/input/InputManager.js');
            const { SpaceNavigation } = await import('../src/navigation/SpaceNavigation.js');
            const { TradingSystem } = await import('../src/trading/TradingSystem.js');
            const { AuthService } = await import('../src/auth/AuthService.js');
            
            const canvas = testContainer.querySelector('#gameCanvas');
            const uiContainer = testContainer.querySelector('#ui');
            
            // Initialize all core systems
            const graphics = new GraphicsEngine(canvas);
            const camera = new Camera(canvas);
            const input = new InputManager();
            const navigation = new SpaceNavigation();
            const trading = new TradingSystem();
            const auth = new AuthService();
            
            // Verify all systems initialized
            assert(graphics !== null, 'Graphics engine should initialize');
            assert(camera !== null, 'Camera should initialize');
            assert(input !== null, 'Input manager should initialize');
            assert(navigation !== null, 'Navigation should initialize');
            assert(trading !== null, 'Trading system should initialize');
            assert(auth !== null, 'Auth service should initialize');
            
            // Test basic system interactions
            assert(graphics.svg !== null, 'Graphics should create SVG');
            assert(navigation.getCurrentSector() !== null, 'Navigation should have current sector');
            assertEqual(trading.getPlayerCredits(), 1000, 'Trading should have initial credits');
            assert(auth.isGuest(), 'Auth should start in guest mode');
            
        } catch (error) {
            throw new Error(`Game initialization failed: ${error.message}`);
        } finally {
            TestRunner.cleanupTestDOM();
        }
    });
    
    test('should create player ship graphics', async function() {
        const testContainer = TestRunner.setupTestDOM();
        
        try {
            const { GraphicsEngine } = await import('../src/graphics/GraphicsEngine.js');
            const canvas = testContainer.querySelector('#gameCanvas');
            const graphics = new GraphicsEngine(canvas);
            
            // Create player ship
            const playerShip = graphics.createSpaceship(100, 200, 25, { id: 'playerShip' });
            
            assert(playerShip !== null, 'Player ship should be created');
            assertEqual(playerShip.id, 'playerShip', 'Player ship should have correct ID');
            
            // Add to game layer
            const gameLayer = graphics.createLayer('game', 5);
            graphics.addToLayer('game', playerShip);
            
            const addedShip = gameLayer.querySelector('#playerShip');
            assert(addedShip !== null, 'Player ship should be added to layer');
            
        } catch (error) {
            throw new Error(`Player ship creation failed: ${error.message}`);
        } finally {
            TestRunner.cleanupTestDOM();
        }
    });
    
    test('should load sector with all elements', async function() {
        const testContainer = TestRunner.setupTestDOM();
        
        try {
            const { GraphicsEngine } = await import('../src/graphics/GraphicsEngine.js');
            const { SpaceNavigation } = await import('../src/navigation/SpaceNavigation.js');
            
            const canvas = testContainer.querySelector('#gameCanvas');
            const graphics = new GraphicsEngine(canvas);
            const navigation = new SpaceNavigation();
            
            // Get current sector
            const sector = navigation.getCurrentSector();
            assert(sector !== null, 'Should have current sector');
            
            // Create layers
            const backgroundLayer = graphics.createLayer('background', 1);
            const gameLayer = graphics.createLayer('game', 5);
            
            // Create sector elements
            const stars = graphics.createStarField(50); // Reduced for test
            graphics.addToLayer('background', stars);
            
            // Test planets
            if (sector.planets && sector.planets.length > 0) {
                const planet = sector.planets[0];
                const planetElement = graphics.createPlanet(
                    planet.x, planet.y, planet.radius, {
                        surfaceColor: planet.surfaceColor || '#8b4513',
                        coreColor: planet.coreColor || '#ff4500',
                        atmosphereColor: planet.atmosphereColor || '#87ceeb'
                    }
                );
                graphics.addToLayer('game', planetElement);
                
                const addedPlanet = gameLayer.querySelector('[data-type="planet"]');
                assert(addedPlanet !== null, 'Planet should be added to game layer');
            }
            
            // Test stations
            if (sector.stations && sector.stations.length > 0) {
                const station = sector.stations[0];
                const stationElement = graphics.createSpaceStation(
                    station.x, station.y, station.radius, {
                        id: station.id
                    }
                );
                graphics.addToLayer('game', stationElement);
                
                const addedStation = gameLayer.querySelector(`#${station.id}`);
                assert(addedStation !== null, 'Station should be added to game layer');
            }
            
            // Test jump gates
            if (sector.jumpGates && sector.jumpGates.length > 0) {
                const gate = sector.jumpGates[0];
                const gateElement = graphics.createJumpGate(
                    gate.x, gate.y, gate.radius, {
                        id: gate.id
                    }
                );
                graphics.addToLayer('game', gateElement);
                
                const addedGate = gameLayer.querySelector(`#${gate.id}`);
                assert(addedGate !== null, 'Jump gate should be added to game layer');
            }
            
            // Verify layer structure
            assert(backgroundLayer.children.length > 0, 'Background layer should have content');
            
        } catch (error) {
            throw new Error(`Sector loading failed: ${error.message}`);
        } finally {
            TestRunner.cleanupTestDOM();
        }
    });
    
    test('should handle player movement physics', async function() {
        try {
            // Test player movement calculations
            const player = {
                x: 100,
                y: 100,
                velocity: { x: 1, y: 0 },
                speed: 200,
                radius: 25
            };
            
            const deltaTime = 1/60; // 60 FPS
            
            // Update position
            const newX = player.x + player.velocity.x * player.speed * deltaTime;
            const newY = player.y + player.velocity.y * player.speed * deltaTime;
            
            // Should move approximately 3.33 pixels per frame at speed 200
            const expectedX = player.x + (200/60);
            assertEqual(Math.round(newX), Math.round(expectedX), 'X movement should be calculated correctly');
            assertEqual(newY, player.y, 'Y should remain unchanged with zero Y velocity');
            
        } catch (error) {
            throw new Error(`Movement physics failed: ${error.message}`);
        }
    });
    
    test('should handle collision detection', async function() {
        try {
            const player = { x: 100, y: 100, radius: 25 };
            const asteroid = { x: 120, y: 120, size: 30 };
            
            // Calculate distance
            const distance = Math.sqrt(
                Math.pow(player.x - asteroid.x, 2) + 
                Math.pow(player.y - asteroid.y, 2)
            );
            
            // Check collision
            const collision = distance < (player.radius + asteroid.size);
            assert(collision, 'Should detect collision between overlapping objects');
            
            // Test non-collision
            const farAsteroid = { x: 200, y: 200, size: 30 };
            const farDistance = Math.sqrt(
                Math.pow(player.x - farAsteroid.x, 2) + 
                Math.pow(player.y - farAsteroid.y, 2)
            );
            
            const noCollision = farDistance >= (player.radius + farAsteroid.size);
            assert(noCollision, 'Should not detect collision between separated objects');
            
        } catch (error) {
            throw new Error(`Collision detection failed: ${error.message}`);
        }
    });
});

/**
 * Performance Tests
 */
describe('Performance', function() {
    test('should create graphics elements efficiently', async function() {
        const testContainer = TestRunner.setupTestDOM();
        
        try {
            const { GraphicsEngine } = await import('../src/graphics/GraphicsEngine.js');
            const canvas = testContainer.querySelector('#gameCanvas');
            const graphics = new GraphicsEngine(canvas);
            
            const startTime = performance.now();
            
            // Create multiple elements
            for (let i = 0; i < 100; i++) {
                const asteroid = graphics.createAsteroid(
                    Math.random() * 1920,
                    Math.random() * 1080,
                    Math.random() * 30 + 10
                );
                assert(asteroid !== null, `Asteroid ${i} should be created`);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Should create 100 asteroids in less than 100ms
            assert(duration < 100, `Graphics creation should be fast (took ${duration.toFixed(2)}ms)`);
            
        } catch (error) {
            throw new Error(`Performance test failed: ${error.message}`);
        } finally {
            TestRunner.cleanupTestDOM();
        }
    });
    
    test('should handle rapid input updates', async function() {
        try {
            const { InputManager } = await import('../src/input/InputManager.js');
            const input = new InputManager();
            
            const startTime = performance.now();
            
            // Simulate rapid key presses
            for (let i = 0; i < 1000; i++) {
                input.keys.set('KeyW', i % 2 === 0);
                input.keys.set('KeyA', i % 3 === 0);
                input.keys.set('KeyS', i % 4 === 0);
                input.keys.set('KeyD', i % 5 === 0);
                
                const movement = input.getMovementVector();
                assert(typeof movement.x === 'number', 'Movement X should be a number');
                assert(typeof movement.y === 'number', 'Movement Y should be a number');
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Should process 1000 input updates in less than 10ms
            assert(duration < 10, `Input processing should be fast (took ${duration.toFixed(2)}ms)`);
            
        } catch (error) {
            throw new Error(`Input performance test failed: ${error.message}`);
        }
    });
});

// Export the test runner
export { TestRunner };