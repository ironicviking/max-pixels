/**
 * Core Game System Tests for Max-Pixels
 * Tests for graphics engine, physics, navigation, and game mechanics
 */

import { TestRunner, describe, test, assert, assertEqual, assertApproxEqual, waitFor } from './TestFramework.js';
import { GraphicsEngine } from '../src/graphics/GraphicsEngine.js';
import { Camera } from '../src/graphics/Camera.js';
import { InputManager } from '../src/input/InputManager.js';
import { SpaceNavigation } from '../src/navigation/SpaceNavigation.js';
import { TradingSystem } from '../src/trading/TradingSystem.js';
import { AuthService } from '../src/auth/AuthService.js';
import { AudioManager } from '../src/audio/AudioManager.js';

/**
 * Graphics Engine Tests
 */
describe('Graphics Engine', function() {
    test('should create SVG canvas', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        
        assert(graphics.svg !== null, 'SVG element should be created');
        assertEqual(graphics.svg.tagName, 'svg', 'Should create SVG element');
        
        TestRunner.cleanupTestDOM();
    });
    
    test('should create layers', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        
        const layer = graphics.createLayer('test-layer', 5);
        assert(layer !== null, 'Layer should be created');
        assertEqual(layer.getAttribute('data-layer'), 'test-layer', 'Layer should have correct name');
        
        TestRunner.cleanupTestDOM();
    });
    
    test('should create spaceship graphics', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        
        const ship = graphics.createSpaceship(100, 200, 25);
        assert(ship !== null, 'Spaceship should be created');
        assertEqual(ship.tagName, 'g', 'Spaceship should be a group element');
        
        const transform = ship.getAttribute('transform');
        assert(transform.includes('translate(100, 200)'), 'Spaceship should be positioned correctly');
        
        TestRunner.cleanupTestDOM();
    });
    
    test('should create asteroids', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        
        const asteroid = graphics.createAsteroid(50, 75, 30);
        assert(asteroid !== null, 'Asteroid should be created');
        
        const transform = asteroid.getAttribute('transform');
        assert(transform.includes('translate(50, 75)'), 'Asteroid should be positioned correctly');
        
        TestRunner.cleanupTestDOM();
    });
});

/**
 * Camera System Tests
 */
describe('Camera System', function() {
    test('should initialize with default values', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const camera = new Camera(canvas);
        
        assertEqual(camera.zoom, 1.0, 'Initial zoom should be 1.0');
        assertEqual(camera.x, 0, 'Initial X should be 0');
        assertEqual(camera.y, 0, 'Initial Y should be 0');
        
        TestRunner.cleanupTestDOM();
    });
    
    test('should center on coordinates', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const camera = new Camera(canvas);
        
        camera.centerOn(500, 300);
        
        // Camera centers by offsetting by half the viewport
        const expectedX = 500 - (1920 / 2);
        const expectedY = 300 - (1080 / 2);
        
        assertEqual(camera.x, expectedX, 'Camera X should center correctly');
        assertEqual(camera.y, expectedY, 'Camera Y should center correctly');
        
        TestRunner.cleanupTestDOM();
    });
    
    test('should zoom in and out', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const camera = new Camera(canvas);
        
        const initialZoom = camera.zoom;
        
        camera.zoomIn();
        assert(camera.zoom > initialZoom, 'Zoom should increase');
        
        camera.zoomOut();
        assertApproxEqual(camera.zoom, initialZoom, 0.01, 'Zoom should return to initial value');
        
        TestRunner.cleanupTestDOM();
    });
});

/**
 * Input Manager Tests
 */
describe('Input Manager', function() {
    test('should initialize key states', function() {
        const input = new InputManager();
        
        assertEqual(input.keys.size, 0, 'Should start with no keys pressed');
        assertEqual(input.previousKeys.size, 0, 'Should start with no previous keys');
    });
    
    test('should detect key presses', function() {
        const input = new InputManager();
        
        // Simulate key press
        const keyEvent = new KeyboardEvent('keydown', { code: 'KeyW' });
        document.dispatchEvent(keyEvent);
        
        assert(input.isPressed('KeyW'), 'Should detect key press');
        
        // Simulate key release
        const keyUpEvent = new KeyboardEvent('keyup', { code: 'KeyW' });
        document.dispatchEvent(keyUpEvent);
        
        assert(!input.isPressed('KeyW'), 'Should detect key release');
    });
    
    test('should calculate movement vector', function() {
        const input = new InputManager();
        
        // Simulate pressing W (up)
        input.keys.set('KeyW', true);
        const movement = input.getMovementVector();
        
        assertEqual(movement.x, 0, 'X movement should be 0');
        assertEqual(movement.y, -1, 'Y movement should be -1 (up)');
        
        input.keys.clear();
    });
});

/**
 * Space Navigation Tests
 */
describe('Space Navigation', function() {
    test('should initialize with default sector', function() {
        const navigation = new SpaceNavigation();
        
        assert(navigation.getCurrentSector() !== null, 'Should have a current sector');
        assertEqual(navigation.currentSectorId, 'sector-1', 'Should start in sector-1');
    });
    
    test('should get sector bounds', function() {
        const navigation = new SpaceNavigation();
        const bounds = navigation.getSectorBounds();
        
        assert(bounds.width > 0, 'Bounds width should be positive');
        assert(bounds.height > 0, 'Bounds height should be positive');
        assertEqual(typeof bounds.width, 'number', 'Width should be a number');
        assertEqual(typeof bounds.height, 'number', 'Height should be a number');
    });
    
    test('should detect jump gate proximity', function() {
        const navigation = new SpaceNavigation();
        
        // Get a jump gate position from current sector
        const sector = navigation.getCurrentSector();
        if (sector.jumpGates.length > 0) {
            const gate = sector.jumpGates[0];
            
            // Test proximity detection
            const nearbyGate = navigation.checkJumpGateProximity(gate.x, gate.y, 100);
            assert(nearbyGate !== null, 'Should detect nearby jump gate');
            assertEqual(nearbyGate.id, gate.id, 'Should return correct gate');
            
            // Test outside range
            const farGate = navigation.checkJumpGateProximity(gate.x + 200, gate.y + 200, 50);
            assertEqual(farGate, null, 'Should not detect distant gate');
        }
    });
});

/**
 * Trading System Tests
 */
describe('Trading System', function() {
    test('should initialize with empty inventory', function() {
        const trading = new TradingSystem();
        
        assertEqual(trading.getPlayerItems().length, 0, 'Player inventory should start empty');
        assertEqual(trading.getPlayerCredits(), 1000, 'Player should start with 1000 credits');
    });
    
    test('should add items to player inventory', function() {
        const trading = new TradingSystem();
        
        trading.addPlayerItem('ore-iron', 5);
        const items = trading.getPlayerItems();
        
        assertEqual(items.length, 1, 'Should have one item type');
        assertEqual(items[0].quantity, 5, 'Should have correct quantity');
        assertEqual(items[0].id, 'ore-iron', 'Should have correct item ID');
    });
    
    test('should handle buying items', function() {
        const trading = new TradingSystem();
        const initialCredits = trading.getPlayerCredits();
        
        // Mock station market data
        const station = {
            id: 'test-station',
            market: {
                'ore-copper': { sellPrice: 50, buyPrice: 45, supply: 100 }
            }
        };
        
        const result = trading.buyItem(station, 'ore-copper', 2);
        
        assert(result.success, 'Buy transaction should succeed');
        assertEqual(trading.getPlayerCredits(), initialCredits - 100, 'Credits should be deducted');
        
        const items = trading.getPlayerItems();
        const copperItem = items.find(item => item.id === 'ore-copper');
        assert(copperItem !== undefined, 'Player should have copper ore');
        assertEqual(copperItem.quantity, 2, 'Should have correct quantity');
    });
    
    test('should handle selling items', function() {
        const trading = new TradingSystem();
        
        // Add item to inventory first
        trading.addPlayerItem('food-rations', 3);
        const initialCredits = trading.getPlayerCredits();
        
        // Mock station market data
        const station = {
            id: 'test-station',
            market: {
                'food-rations': { sellPrice: 30, buyPrice: 25, demand: 50 }
            }
        };
        
        const result = trading.sellItem(station, 'food-rations', 2);
        
        assert(result.success, 'Sell transaction should succeed');
        assertEqual(trading.getPlayerCredits(), initialCredits + 50, 'Credits should be added');
        
        const items = trading.getPlayerItems();
        const rationItem = items.find(item => item.id === 'food-rations');
        assertEqual(rationItem.quantity, 1, 'Should have remaining quantity');
    });
});

/**
 * Auth Service Tests
 */
describe('Authentication Service', function() {
    test('should initialize in guest mode', function() {
        const auth = new AuthService();
        
        assert(!auth.isLoggedIn(), 'Should start logged out');
        assert(auth.isGuest(), 'Should start in guest mode');
        assertEqual(auth.getCurrentUser(), null, 'Should have no current user');
    });
    
    test('should handle guest login', function() {
        const auth = new AuthService();
        
        const result = auth.loginAsGuest('TestPlayer');
        
        assert(result.success, 'Guest login should succeed');
        assert(auth.isGuest(), 'Should remain in guest mode');
        assert(auth.getCurrentUser() !== null, 'Should have current user');
        assertEqual(auth.getCurrentUser().username, 'TestPlayer', 'Should have correct username');
    });
    
    test('should handle logout', function() {
        const auth = new AuthService();
        
        // Login first
        auth.loginAsGuest('TestPlayer');
        assert(auth.isLoggedIn(), 'Should be logged in');
        
        // Logout
        auth.logout();
        assert(!auth.isLoggedIn(), 'Should be logged out');
        assertEqual(auth.getCurrentUser(), null, 'Should have no current user');
    });
});

/**
 * Audio Manager Tests
 */
describe('Audio Manager', function() {
    test('should initialize audio context', function() {
        const audio = new AudioManager();
        
        // Audio context should be created (or disabled if not supported)
        assert(audio.audioContext !== null || !audio.isEnabled, 'Should have audio context or be disabled');
        assert(typeof audio.isEnabled === 'boolean', 'isEnabled should be boolean');
        assert(typeof audio.masterVolume === 'number', 'masterVolume should be number');
    });
    
    test('should have default volume settings', function() {
        const audio = new AudioManager();
        
        assertApproxEqual(audio.masterVolume, 0.7, 0.01, 'Should have default master volume');
        assert(audio.masterVolume >= 0 && audio.masterVolume <= 1, 'Master volume should be in valid range');
    });
    
    test('should generate sound buffers', function() {
        const audio = new AudioManager();
        
        if (audio.isEnabled) {
            assert(audio.sounds.has('thruster'), 'Should have thruster sound');
            assert(audio.sounds.has('collision'), 'Should have collision sound');
            assert(audio.sounds.has('ambient'), 'Should have ambient sound');
            assert(audio.sounds.has('laser'), 'Should have laser sound');
            
            // Check that buffers are actual AudioBuffer objects
            const thrusterBuffer = audio.sounds.get('thruster');
            if (thrusterBuffer) {
                assert(thrusterBuffer instanceof AudioBuffer, 'Thruster should be AudioBuffer');
                assert(thrusterBuffer.length > 0, 'Buffer should have samples');
            }
        }
    });
    
    test('should control master volume', function() {
        const audio = new AudioManager();
        
        audio.setMasterVolume(0.5);
        assertApproxEqual(audio.masterVolume, 0.5, 0.01, 'Should set master volume');
        
        // Test boundary conditions
        audio.setMasterVolume(1.5);
        assertApproxEqual(audio.masterVolume, 1.0, 0.01, 'Should clamp volume to maximum');
        
        audio.setMasterVolume(-0.5);
        assertApproxEqual(audio.masterVolume, 0.0, 0.01, 'Should clamp volume to minimum');
    });
    
    test('should enable and disable audio', function() {
        const audio = new AudioManager();
        const initialState = audio.isEnabled;
        
        audio.disable();
        assert(!audio.isEnabled, 'Should be disabled');
        
        audio.enable();
        assert(audio.isEnabled, 'Should be enabled');
        
        // Reset to initial state
        if (!initialState) {
            audio.disable();
        }
    });
    
    test('should create noise buffer with wave function', function() {
        const audio = new AudioManager();
        
        if (audio.isEnabled && audio.audioContext) {
            const testBuffer = audio.createNoiseBuffer(0.1, (freq, time) => {
                return Math.sin(freq * 440 * time) * 0.5; // Simple sine wave
            });
            
            assert(testBuffer instanceof AudioBuffer, 'Should create AudioBuffer');
            assert(testBuffer.length > 0, 'Buffer should have samples');
            assertEqual(testBuffer.numberOfChannels, 1, 'Should be mono audio');
            
            // Check that the buffer contains actual data
            const data = testBuffer.getChannelData(0);
            assert(data.length > 0, 'Should have audio data');
        }
    });
    
    test('should handle play method safely when disabled', function() {
        const audio = new AudioManager();
        audio.disable();
        
        const result = audio.play('thruster');
        assertEqual(result, null, 'Should return null when audio is disabled');
    });
    
    test('should handle play method with unknown sound', function() {
        const audio = new AudioManager();
        
        const result = audio.play('unknown-sound');
        assertEqual(result, null, 'Should return null for unknown sound');
    });
    
    test('should provide convenience methods for game sounds', function() {
        const audio = new AudioManager();
        
        // These should not throw errors even if audio is disabled
        const thruster = audio.playThruster(0.5);
        const collision = audio.playCollision(0.8);
        const ambient = audio.playAmbient();
        const laser = audio.playLaser(0.7);
        
        // If audio is enabled, these should return sound objects or null
        if (audio.isEnabled) {
            if (thruster) {
                assert(typeof thruster.stop === 'function', 'Thruster should have stop method');
                assert(typeof thruster.setVolume === 'function', 'Thruster should have setVolume method');
                assert(typeof thruster.fadeOut === 'function', 'Thruster should have fadeOut method');
            }
        }
    });
    
    test('should handle audio context resume', function() {
        const audio = new AudioManager();
        
        // Should not throw error
        audio.resumeAudioContext().then(() => {
            // This should complete without error
        }).catch(() => {
            // Catch is fine, some environments may not support it
        });
    });
});

/**
 * Game Physics Tests
 */
describe('Game Physics', function() {
    test('should calculate distance correctly', function() {
        const distance = Math.sqrt(Math.pow(100 - 0, 2) + Math.pow(100 - 0, 2));
        const expected = Math.sqrt(20000); // approximately 141.42
        
        assertApproxEqual(distance, expected, 0.01, 'Distance calculation should be accurate');
    });
    
    test('should detect circular collision', function() {
        const player = { x: 100, y: 100, radius: 25 };
        const asteroid = { x: 120, y: 120, size: 30 };
        
        const distance = Math.sqrt(
            Math.pow(player.x - asteroid.x, 2) + 
            Math.pow(player.y - asteroid.y, 2)
        );
        
        const collision = distance < (player.radius + asteroid.size);
        assert(collision, 'Should detect collision when objects overlap');
    });
    
    test('should not detect collision when objects are apart', function() {
        const player = { x: 100, y: 100, radius: 25 };
        const asteroid = { x: 200, y: 200, size: 30 };
        
        const distance = Math.sqrt(
            Math.pow(player.x - asteroid.x, 2) + 
            Math.pow(player.y - asteroid.y, 2)
        );
        
        const collision = distance < (player.radius + asteroid.size);
        assert(!collision, 'Should not detect collision when objects are separated');
    });
});

// Export the test runner for use in browser
export { TestRunner };