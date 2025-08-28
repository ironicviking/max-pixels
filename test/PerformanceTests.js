/**
 * Advanced Performance Tests for Max-Pixels Game
 * Tests using the enhanced performance monitoring capabilities
 */

import { 
    TestRunner, 
    describe, 
    test, 
    assert, 
    assertEqual,
    benchmark,
    assertPerformance,
    profileOperation
} from './TestFramework.js';

/**
 * Graphics Engine Performance Tests
 */
describe('Graphics Performance', function() {
    test('should benchmark SVG element creation', async function() {
        const testContainer = TestRunner.setupTestDOM();
        
        try {
            const { GraphicsEngine } = await import('../src/graphics/GraphicsEngine.js');
            const canvas = testContainer.querySelector('#gameCanvas');
            const graphics = new GraphicsEngine(canvas);
            
            // Benchmark asteroid creation
            const asteroidResults = await benchmark(
                'Asteroid Creation',
                () => graphics.createAsteroid(
                    Math.random() * 1920,
                    Math.random() * 1080,
                    Math.random() * 30 + 10
                ),
                { 
                    iterations: 500,
                    memoryTracking: true
                }
            );
            
            console.log(`Asteroid Creation Benchmark:
  Operations/sec: ${asteroidResults.operationsPerSecond.toFixed(0)}
  Average time: ${asteroidResults.averageTime.toFixed(3)}ms
  Min/Max: ${asteroidResults.minTime.toFixed(3)}ms / ${asteroidResults.maxTime.toFixed(3)}ms`);
            
            // Should create at least 1000 asteroids per second
            assert(asteroidResults.operationsPerSecond > 1000, 
                `Asteroid creation too slow: ${asteroidResults.operationsPerSecond.toFixed(0)} ops/sec`);
            
            // Benchmark spaceship creation
            const spaceshipResults = await benchmark(
                'Spaceship Creation',
                () => graphics.createSpaceship(
                    Math.random() * 1920,
                    Math.random() * 1080,
                    25
                ),
                { iterations: 200 }
            );
            
            console.log(`Spaceship Creation: ${spaceshipResults.operationsPerSecond.toFixed(0)} ops/sec`);
            
            // Should create at least 500 spaceships per second
            assert(spaceshipResults.operationsPerSecond > 500,
                `Spaceship creation too slow: ${spaceshipResults.operationsPerSecond.toFixed(0)} ops/sec`);
            
        } catch (error) {
            throw new Error(`Graphics performance test failed: ${error.message}`);
        } finally {
            TestRunner.cleanupTestDOM();
        }
    });
    
    test('should profile star field generation', async function() {
        const testContainer = TestRunner.setupTestDOM();
        
        try {
            const { GraphicsEngine } = await import('../src/graphics/GraphicsEngine.js');
            const canvas = testContainer.querySelector('#gameCanvas');
            const graphics = new GraphicsEngine(canvas);
            
            // Profile large star field creation
            const profile = await profileOperation(() => {
                return graphics.createStarField(1000); // Large star field
            });
            
            console.log(`Star Field Profile:
  Duration: ${profile.duration.toFixed(2)}ms
  Memory Delta: ${profile.memoryDelta ? `${(profile.memoryDelta / 1024).toFixed(2)}KB` : 'N/A'}`);
            
            // Star field with 1000 stars should generate in under 50ms
            assert(profile.duration < 50, 
                `Star field generation too slow: ${profile.duration.toFixed(2)}ms`);
            
        } catch (error) {
            throw new Error(`Star field profiling failed: ${error.message}`);
        } finally {
            TestRunner.cleanupTestDOM();
        }
    });
});

/**
 * Particle System Performance Tests
 */
describe('Particle System Performance', function() {
    test('should benchmark particle emitter creation', async function() {
        const testContainer = TestRunner.setupTestDOM();
        
        try {
            const { GraphicsEngine } = await import('../src/graphics/GraphicsEngine.js');
            const { ParticleSystem } = await import('../src/graphics/ParticleSystem.js');
            
            const canvas = testContainer.querySelector('#gameCanvas');
            const graphics = new GraphicsEngine(canvas);
            const particles = new ParticleSystem(graphics);
            
            // Benchmark explosion effect creation
            const explosionResults = await benchmark(
                'Explosion Effect Creation',
                () => particles.createExplosionEffect(
                    Math.random() * 1920,
                    Math.random() * 1080,
                    { particleCount: 20 }
                ),
                { iterations: 100 }
            );
            
            console.log(`Explosion Effects: ${explosionResults.operationsPerSecond.toFixed(0)} ops/sec`);
            
            // Should create at least 100 explosion effects per second
            assert(explosionResults.operationsPerSecond > 100,
                `Explosion creation too slow: ${explosionResults.operationsPerSecond.toFixed(0)} ops/sec`);
            
            // Benchmark thruster trail creation
            const thrusterResults = await benchmark(
                'Thruster Trail Creation',
                () => particles.createThrusterTrail(
                    Math.random() * 1920,
                    Math.random() * 1080,
                    Math.random() * Math.PI * 2,
                    0.8
                ),
                { iterations: 200 }
            );
            
            console.log(`Thruster Trails: ${thrusterResults.operationsPerSecond.toFixed(0)} ops/sec`);
            
            // Should create at least 200 thruster trails per second
            assert(thrusterResults.operationsPerSecond > 200,
                `Thruster trail creation too slow: ${thrusterResults.operationsPerSecond.toFixed(0)} ops/sec`);
            
            particles.stopUpdateLoop();
        } catch (error) {
            throw new Error(`Particle performance test failed: ${error.message}`);
        } finally {
            TestRunner.cleanupTestDOM();
        }
    });
    
    test('should test particle system update performance', async function() {
        const testContainer = TestRunner.setupTestDOM();
        
        try {
            const { GraphicsEngine } = await import('../src/graphics/GraphicsEngine.js');
            const { ParticleSystem } = await import('../src/graphics/ParticleSystem.js');
            
            const canvas = testContainer.querySelector('#gameCanvas');
            const graphics = new GraphicsEngine(canvas);
            const particles = new ParticleSystem(graphics);
            
            // Create many particle emitters
            for (let i = 0; i < 10; i++) {
                particles.createExplosionEffect(
                    Math.random() * 1920,
                    Math.random() * 1080,
                    { particleCount: 30 }
                );
            }
            
            // Profile particle system update cycle
            const updateProfile = await profileOperation(() => {
                particles.update(); // Simulate one update cycle
            });
            
            console.log(`Particle Update: ${updateProfile.duration.toFixed(2)}ms`);
            
            // Update cycle should complete in under 5ms even with many particles
            assert(updateProfile.duration < 5,
                `Particle update too slow: ${updateProfile.duration.toFixed(2)}ms`);
            
            particles.stopUpdateLoop();
        } catch (error) {
            throw new Error(`Particle update performance test failed: ${error.message}`);
        } finally {
            TestRunner.cleanupTestDOM();
        }
    });
});

/**
 * Input System Performance Tests
 */
describe('Input Performance', function() {
    test('should benchmark input processing speed', async function() {
        try {
            const { InputManager } = await import('../src/input/InputManager.js');
            const input = new InputManager();
            
            // Benchmark movement vector calculation
            const movementResults = await benchmark(
                'Movement Vector Calculation',
                () => {
                    // Simulate random key states
                    input.keys.set('KeyW', Math.random() > 0.5);
                    input.keys.set('KeyA', Math.random() > 0.5);
                    input.keys.set('KeyS', Math.random() > 0.5);
                    input.keys.set('KeyD', Math.random() > 0.5);
                    
                    const movement = input.getMovementVector();
                    assert(typeof movement.x === 'number', 'Movement X should be number');
                    assert(typeof movement.y === 'number', 'Movement Y should be number');
                },
                { iterations: 5000 }
            );
            
            console.log(`Movement Processing: ${movementResults.operationsPerSecond.toFixed(0)} ops/sec`);
            
            // Should process at least 10,000 movement calculations per second
            assert(movementResults.operationsPerSecond > 10000,
                `Movement processing too slow: ${movementResults.operationsPerSecond.toFixed(0)} ops/sec`);
            
        } catch (error) {
            throw new Error(`Input performance test failed: ${error.message}`);
        }
    });
});

/**
 * Trading System Performance Tests
 */
describe('Trading Performance', function() {
    test('should benchmark market calculations', async function() {
        try {
            const { TradingSystem } = await import('../src/trading/TradingSystem.js');
            const trading = new TradingSystem();
            
            // Add inventory items for trading
            trading.addPlayerItem('ore-iron', 1000);
            trading.addPlayerItem('ore-copper', 500);
            trading.addPlayerItem('food-rations', 200);
            
            // Benchmark buy operations
            const buyResults = await benchmark(
                'Market Buy Operations',
                () => trading.canBuyFromStation('tradingStation', 'ore-iron', 1),
                { iterations: 2000 }
            );
            
            console.log(`Market Buy Checks: ${buyResults.operationsPerSecond.toFixed(0)} ops/sec`);
            
            // Should process at least 5,000 buy calculations per second
            assert(buyResults.operationsPerSecond > 5000,
                `Buy calculations too slow: ${buyResults.operationsPerSecond.toFixed(0)} ops/sec`);
            
            // Benchmark inventory value calculation
            const valueResults = await benchmark(
                'Inventory Value Calculation',
                () => trading.getTotalInventoryValue(),
                { iterations: 1000 }
            );
            
            console.log(`Inventory Valuation: ${valueResults.operationsPerSecond.toFixed(0)} ops/sec`);
            
            // Should calculate inventory value at least 1,000 times per second
            assert(valueResults.operationsPerSecond > 1000,
                `Inventory calculations too slow: ${valueResults.operationsPerSecond.toFixed(0)} ops/sec`);
            
        } catch (error) {
            throw new Error(`Trading performance test failed: ${error.message}`);
        }
    });
});

/**
 * Collision Detection Performance Tests
 */
describe('Collision Performance', function() {
    test('should benchmark collision detection algorithms', async function() {
        try {
            // Create test objects
            const player = { x: 500, y: 500, radius: 25 };
            const asteroids = [];
            
            // Generate many asteroids
            for (let i = 0; i < 1000; i++) {
                asteroids.push({
                    x: Math.random() * 1920,
                    y: Math.random() * 1080,
                    size: Math.random() * 30 + 10
                });
            }
            
            // Benchmark collision detection
            const collisionResults = await benchmark(
                'Collision Detection',
                () => {
                    let collisions = 0;
                    for (const asteroid of asteroids) {
                        const distance = Math.sqrt(
                            Math.pow(player.x - asteroid.x, 2) + 
                            Math.pow(player.y - asteroid.y, 2)
                        );
                        if (distance < player.radius + asteroid.size) {
                            collisions++;
                        }
                    }
                    return collisions;
                },
                { iterations: 100 }
            );
            
            console.log(`Collision Detection: ${collisionResults.operationsPerSecond.toFixed(0)} ops/sec`);
            
            // Should check 1000 asteroids at least 50 times per second
            assert(collisionResults.operationsPerSecond > 50,
                `Collision detection too slow: ${collisionResults.operationsPerSecond.toFixed(0)} ops/sec`);
            
        } catch (error) {
            throw new Error(`Collision performance test failed: ${error.message}`);
        }
    });
    
    test('should use assertPerformance for critical operations', async function() {
        const testContainer = TestRunner.setupTestDOM();
        
        try {
            const { GraphicsEngine } = await import('../src/graphics/GraphicsEngine.js');
            const canvas = testContainer.querySelector('#gameCanvas');
            const graphics = new GraphicsEngine(canvas);
            
            // Assert that creating a complex scene is fast enough
            const duration = await assertPerformance(
                async () => {
                    // Create a complete game scene
                    graphics.createLayer('background', 1);
                    graphics.createLayer('game', 5);
                    
                    // Add background elements
                    const stars = graphics.createStarField(200);
                    graphics.addToLayer('background', stars);
                    
                    // Add game objects
                    for (let i = 0; i < 20; i++) {
                        const asteroid = graphics.createAsteroid(
                            Math.random() * 1920,
                            Math.random() * 1080,
                            Math.random() * 30 + 10
                        );
                        graphics.addToLayer('game', asteroid);
                    }
                    
                    // Add player ship
                    const player = graphics.createSpaceship(960, 540, 25);
                    graphics.addToLayer('game', player);
                },
                100, // Should complete in under 100ms
                'Scene creation exceeded performance threshold'
            );
            
            console.log(`Scene Creation: ${duration.toFixed(2)}ms`);
            
        } catch (error) {
            throw new Error(`Performance assertion failed: ${error.message}`);
        } finally {
            TestRunner.cleanupTestDOM();
        }
    });
});

// Export the test runner
export { TestRunner };