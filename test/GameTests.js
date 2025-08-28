/**
 * Core Game System Tests for Max-Pixels
 * Tests for graphics engine, physics, navigation, and game mechanics
 */

import { TestRunner, describe, test, assert, assertEqual, assertApproxEqual, assertThrows, waitFor } from './TestFramework.js';
import { GraphicsEngine } from '../src/graphics/GraphicsEngine.js';
import { ParticleSystem } from '../src/graphics/ParticleSystem.js';
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
        assertEqual(graphics.svg.tagName, 'SVG', 'Should create SVG element');
        
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
        assertEqual(ship.tagName, 'G', 'Spaceship should be a group element');
        
        const transform = ship.getAttribute('transform');
        assert(transform.includes('translate(100, 200)'), 'Spaceship should be positioned correctly');
        
        TestRunner.cleanupTestDOM();
    });
    
    test('should validate createSpaceship parameters', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        
        // Test invalid x parameter
        assertThrows(() => graphics.createSpaceship('invalid', 100, 25), 'Should throw error for non-numeric x');
        assertThrows(() => graphics.createSpaceship(NaN, 100, 25), 'Should throw error for NaN x');
        assertThrows(() => graphics.createSpaceship(Infinity, 100, 25), 'Should throw error for infinite x');
        
        // Test invalid y parameter
        assertThrows(() => graphics.createSpaceship(100, 'invalid', 25), 'Should throw error for non-numeric y');
        assertThrows(() => graphics.createSpaceship(100, NaN, 25), 'Should throw error for NaN y');
        assertThrows(() => graphics.createSpaceship(100, Infinity, 25), 'Should throw error for infinite y');
        
        // Test invalid size parameter
        assertThrows(() => graphics.createSpaceship(100, 100, 'invalid'), 'Should throw error for non-numeric size');
        assertThrows(() => graphics.createSpaceship(100, 100, NaN), 'Should throw error for NaN size');
        assertThrows(() => graphics.createSpaceship(100, 100, Infinity), 'Should throw error for infinite size');
        assertThrows(() => graphics.createSpaceship(100, 100, 0), 'Should throw error for zero size');
        assertThrows(() => graphics.createSpaceship(100, 100, -10), 'Should throw error for negative size');
        
        // Test invalid attributes parameter
        assertThrows(() => graphics.createSpaceship(100, 100, 25, null), 'Should throw error for null attributes');
        assertThrows(() => graphics.createSpaceship(100, 100, 25, 'invalid'), 'Should throw error for non-object attributes');
        
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
    
    test('should validate createAsteroid parameters', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        
        // Test valid parameters
        const asteroid = graphics.createAsteroid(10, 20, 15);
        assert(asteroid !== null, 'Should create asteroid with valid parameters');
        assertEqual(asteroid.tagName, 'G', 'Should create group element');
        
        // Test invalid x parameter
        assertThrows(() => graphics.createAsteroid('invalid', 20, 15), 'Should throw for invalid x');
        assertThrows(() => graphics.createAsteroid(Infinity, 20, 15), 'Should throw for infinite x');
        assertThrows(() => graphics.createAsteroid(NaN, 20, 15), 'Should throw for NaN x');
        
        // Test invalid y parameter
        assertThrows(() => graphics.createAsteroid(10, 'invalid', 15), 'Should throw for invalid y');
        assertThrows(() => graphics.createAsteroid(10, Infinity, 15), 'Should throw for infinite y');
        assertThrows(() => graphics.createAsteroid(10, NaN, 15), 'Should throw for NaN y');
        
        // Test invalid size parameter
        assertThrows(() => graphics.createAsteroid(10, 20, 'invalid'), 'Should throw for invalid size');
        assertThrows(() => graphics.createAsteroid(10, 20, 0), 'Should throw for zero size');
        assertThrows(() => graphics.createAsteroid(10, 20, -5), 'Should throw for negative size');
        assertThrows(() => graphics.createAsteroid(10, 20, Infinity), 'Should throw for infinite size');
        assertThrows(() => graphics.createAsteroid(10, 20, NaN), 'Should throw for NaN size');
        
        // Test invalid attributes parameter
        assertThrows(() => graphics.createAsteroid(10, 20, 15, null), 'Should throw for null attributes');
        assertThrows(() => graphics.createAsteroid(10, 20, 15, 'invalid'), 'Should throw for non-object attributes');
        
        TestRunner.cleanupTestDOM();
    });
    
    test('should validate createCircle parameters', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        
        // Test valid parameters
        const circle = graphics.createCircle(10, 20, 5);
        assert(circle !== null, 'Should create circle with valid parameters');
        assertEqual(circle.tagName, 'CIRCLE', 'Should create circle element');
        assertEqual(circle.getAttribute('cx'), '10', 'Should set cx correctly');
        assertEqual(circle.getAttribute('cy'), '20', 'Should set cy correctly');
        assertEqual(circle.getAttribute('r'), '5', 'Should set r correctly');
        
        // Test invalid cx parameter
        assertThrows(() => graphics.createCircle('invalid', 20, 5), 'Should throw for invalid cx');
        assertThrows(() => graphics.createCircle(Infinity, 20, 5), 'Should throw for infinite cx');
        assertThrows(() => graphics.createCircle(NaN, 20, 5), 'Should throw for NaN cx');
        
        // Test invalid cy parameter
        assertThrows(() => graphics.createCircle(10, 'invalid', 5), 'Should throw for invalid cy');
        assertThrows(() => graphics.createCircle(10, Infinity, 5), 'Should throw for infinite cy');
        assertThrows(() => graphics.createCircle(10, NaN, 5), 'Should throw for NaN cy');
        
        // Test invalid r parameter
        assertThrows(() => graphics.createCircle(10, 20, 'invalid'), 'Should throw for invalid r');
        assertThrows(() => graphics.createCircle(10, 20, -1), 'Should throw for negative r');
        assertThrows(() => graphics.createCircle(10, 20, Infinity), 'Should throw for infinite r');
        assertThrows(() => graphics.createCircle(10, 20, NaN), 'Should throw for NaN r');
        
        // Test invalid attributes parameter
        assertThrows(() => graphics.createCircle(10, 20, 5, null), 'Should throw for null attributes');
        assertThrows(() => graphics.createCircle(10, 20, 5, 'invalid'), 'Should throw for non-object attributes');
        
        TestRunner.cleanupTestDOM();
    });
    
    test('should validate createRect parameters', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        
        // Test valid parameters
        const rect = graphics.createRect(10, 20, 100, 50);
        assert(rect !== null, 'Should create rect with valid parameters');
        assertEqual(rect.tagName, 'RECT', 'Should create rect element');
        assertEqual(rect.getAttribute('x'), '10', 'Should set x correctly');
        assertEqual(rect.getAttribute('y'), '20', 'Should set y correctly');
        assertEqual(rect.getAttribute('width'), '100', 'Should set width correctly');
        assertEqual(rect.getAttribute('height'), '50', 'Should set height correctly');
        
        // Test invalid x parameter
        assertThrows(() => graphics.createRect('invalid', 20, 100, 50), 'Should throw for invalid x');
        assertThrows(() => graphics.createRect(Infinity, 20, 100, 50), 'Should throw for infinite x');
        assertThrows(() => graphics.createRect(NaN, 20, 100, 50), 'Should throw for NaN x');
        
        // Test invalid y parameter
        assertThrows(() => graphics.createRect(10, 'invalid', 100, 50), 'Should throw for invalid y');
        assertThrows(() => graphics.createRect(10, Infinity, 100, 50), 'Should throw for infinite y');
        assertThrows(() => graphics.createRect(10, NaN, 100, 50), 'Should throw for NaN y');
        
        // Test invalid width parameter
        assertThrows(() => graphics.createRect(10, 20, 'invalid', 50), 'Should throw for invalid width');
        assertThrows(() => graphics.createRect(10, 20, -1, 50), 'Should throw for negative width');
        assertThrows(() => graphics.createRect(10, 20, Infinity, 50), 'Should throw for infinite width');
        assertThrows(() => graphics.createRect(10, 20, NaN, 50), 'Should throw for NaN width');
        
        // Test invalid height parameter
        assertThrows(() => graphics.createRect(10, 20, 100, 'invalid'), 'Should throw for invalid height');
        assertThrows(() => graphics.createRect(10, 20, 100, -1), 'Should throw for negative height');
        assertThrows(() => graphics.createRect(10, 20, 100, Infinity), 'Should throw for infinite height');
        assertThrows(() => graphics.createRect(10, 20, 100, NaN), 'Should throw for NaN height');
        
        // Test invalid attributes parameter
        assertThrows(() => graphics.createRect(10, 20, 100, 50, null), 'Should throw for null attributes');
        assertThrows(() => graphics.createRect(10, 20, 100, 50, 'invalid'), 'Should throw for non-object attributes');
        
        TestRunner.cleanupTestDOM();
    });
    
    test('should validate createLine parameters', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        
        // Test valid parameters
        const line = graphics.createLine(10, 20, 100, 80);
        assert(line !== null, 'Should create line with valid parameters');
        assertEqual(line.tagName, 'LINE', 'Should create line element');
        assertEqual(line.getAttribute('x1'), '10', 'Should set x1 correctly');
        assertEqual(line.getAttribute('y1'), '20', 'Should set y1 correctly');
        assertEqual(line.getAttribute('x2'), '100', 'Should set x2 correctly');
        assertEqual(line.getAttribute('y2'), '80', 'Should set y2 correctly');
        
        // Test invalid x1 parameter
        assertThrows(() => graphics.createLine('invalid', 20, 100, 80), 'Should throw for invalid x1');
        assertThrows(() => graphics.createLine(Infinity, 20, 100, 80), 'Should throw for infinite x1');
        assertThrows(() => graphics.createLine(NaN, 20, 100, 80), 'Should throw for NaN x1');
        
        // Test invalid y1 parameter
        assertThrows(() => graphics.createLine(10, 'invalid', 100, 80), 'Should throw for invalid y1');
        assertThrows(() => graphics.createLine(10, Infinity, 100, 80), 'Should throw for infinite y1');
        assertThrows(() => graphics.createLine(10, NaN, 100, 80), 'Should throw for NaN y1');
        
        // Test invalid x2 parameter
        assertThrows(() => graphics.createLine(10, 20, 'invalid', 80), 'Should throw for invalid x2');
        assertThrows(() => graphics.createLine(10, 20, Infinity, 80), 'Should throw for infinite x2');
        assertThrows(() => graphics.createLine(10, 20, NaN, 80), 'Should throw for NaN x2');
        
        // Test invalid y2 parameter
        assertThrows(() => graphics.createLine(10, 20, 100, 'invalid'), 'Should throw for invalid y2');
        assertThrows(() => graphics.createLine(10, 20, 100, Infinity), 'Should throw for infinite y2');
        assertThrows(() => graphics.createLine(10, 20, 100, NaN), 'Should throw for NaN y2');
        
        // Test invalid attributes parameter
        assertThrows(() => graphics.createLine(10, 20, 100, 80, null), 'Should throw for null attributes');
        assertThrows(() => graphics.createLine(10, 20, 100, 80, 'invalid'), 'Should throw for non-object attributes');
        
        TestRunner.cleanupTestDOM();
    });
    
    test('should validate createPath parameters', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        
        // Test valid parameters
        const path = graphics.createPath('M10,20 L30,40');
        assert(path !== null, 'Should create path with valid parameters');
        assertEqual(path.tagName, 'PATH', 'Should create path element');
        assertEqual(path.getAttribute('d'), 'M10,20 L30,40', 'Should set d attribute correctly');
        
        // Test invalid d parameter - non-string values
        assertThrows(() => graphics.createPath(null), 'Should throw for null d');
        assertThrows(() => graphics.createPath(undefined), 'Should throw for undefined d');
        assertThrows(() => graphics.createPath(123), 'Should throw for numeric d');
        assertThrows(() => graphics.createPath({}), 'Should throw for object d');
        assertThrows(() => graphics.createPath([]), 'Should throw for array d');
        assertThrows(() => graphics.createPath(true), 'Should throw for boolean d');
        
        // Test invalid d parameter - empty or whitespace-only strings
        assertThrows(() => graphics.createPath(''), 'Should throw for empty string d');
        assertThrows(() => graphics.createPath('   '), 'Should throw for whitespace-only d');
        assertThrows(() => graphics.createPath('\t\n'), 'Should throw for tab/newline only d');
        
        // Test invalid attributes parameter
        assertThrows(() => graphics.createPath('M10,20 L30,40', null), 'Should throw for null attributes');
        assertThrows(() => graphics.createPath('M10,20 L30,40', 'invalid'), 'Should throw for non-object attributes');
        assertThrows(() => graphics.createPath('M10,20 L30,40', []), 'Should throw for array attributes');
        
        TestRunner.cleanupTestDOM();
    });
    
    test('should validate createText parameters', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        
        // Test valid parameters
        const text = graphics.createText('Hello World', 50, 100);
        assert(text !== null, 'Should create text with valid parameters');
        assertEqual(text.tagName, 'TEXT', 'Should create text element');
        assertEqual(text.getAttribute('x'), '50', 'Should set x correctly');
        assertEqual(text.getAttribute('y'), '100', 'Should set y correctly');
        assertEqual(text.textContent, 'Hello World', 'Should set text content correctly');
        
        // Test with default coordinates
        const defaultText = graphics.createText('Test');
        assertEqual(defaultText.getAttribute('x'), '0', 'Should use default x=0');
        assertEqual(defaultText.getAttribute('y'), '0', 'Should use default y=0');
        
        // Test invalid content parameter
        assertThrows(() => graphics.createText(null), 'Should throw for null content');
        assertThrows(() => graphics.createText(undefined), 'Should throw for undefined content');
        assertThrows(() => graphics.createText(123), 'Should throw for numeric content');
        assertThrows(() => graphics.createText({}), 'Should throw for object content');
        assertThrows(() => graphics.createText([]), 'Should throw for array content');
        assertThrows(() => graphics.createText(true), 'Should throw for boolean content');
        
        // Test invalid x parameter
        assertThrows(() => graphics.createText('Test', 'invalid', 100), 'Should throw for invalid x');
        assertThrows(() => graphics.createText('Test', Infinity, 100), 'Should throw for infinite x');
        assertThrows(() => graphics.createText('Test', NaN, 100), 'Should throw for NaN x');
        
        // Test invalid y parameter
        assertThrows(() => graphics.createText('Test', 50, 'invalid'), 'Should throw for invalid y');
        assertThrows(() => graphics.createText('Test', 50, Infinity), 'Should throw for infinite y');
        assertThrows(() => graphics.createText('Test', 50, NaN), 'Should throw for NaN y');
        
        // Test invalid attributes parameter
        assertThrows(() => graphics.createText('Test', 50, 100, null), 'Should throw for null attributes');
        assertThrows(() => graphics.createText('Test', 50, 100, 'invalid'), 'Should throw for non-object attributes');
        
        TestRunner.cleanupTestDOM();
    });
    
    test('should validate createRadar parameters', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        
        // Test valid parameters
        const radar = graphics.createRadar(100, 150, 50);
        assert(radar !== null, 'Should create radar with valid parameters');
        assertEqual(radar.tagName, 'G', 'Should create group element');
        assert(radar.getAttribute('transform').includes('translate(100, 150)'), 'Should position radar correctly');
        
        // Test with default options
        const defaultRadar = graphics.createRadar(0, 0, 25);
        assert(defaultRadar !== null, 'Should create radar with minimal parameters');
        
        // Test with custom options
        const customRadar = graphics.createRadar(50, 75, 30, {
            backgroundColor: '#112233',
            borderColor: '#ff8800',
            gridColor: '#445566',
            sweepAnimation: false,
            id: 'test-radar'
        });
        assert(customRadar !== null, 'Should create radar with custom options');
        assertEqual(customRadar.getAttribute('id'), 'test-radar', 'Should use custom ID');
        
        // Test invalid cx parameter
        assertThrows(() => graphics.createRadar('invalid', 150, 50), 'Should throw for invalid cx');
        assertThrows(() => graphics.createRadar(Infinity, 150, 50), 'Should throw for infinite cx');
        assertThrows(() => graphics.createRadar(NaN, 150, 50), 'Should throw for NaN cx');
        
        // Test invalid cy parameter
        assertThrows(() => graphics.createRadar(100, 'invalid', 50), 'Should throw for invalid cy');
        assertThrows(() => graphics.createRadar(100, Infinity, 50), 'Should throw for infinite cy');
        assertThrows(() => graphics.createRadar(100, NaN, 50), 'Should throw for NaN cy');
        
        // Test invalid radius parameter
        assertThrows(() => graphics.createRadar(100, 150, 'invalid'), 'Should throw for invalid radius');
        assertThrows(() => graphics.createRadar(100, 150, 0), 'Should throw for zero radius');
        assertThrows(() => graphics.createRadar(100, 150, -10), 'Should throw for negative radius');
        assertThrows(() => graphics.createRadar(100, 150, Infinity), 'Should throw for infinite radius');
        assertThrows(() => graphics.createRadar(100, 150, NaN), 'Should throw for NaN radius');
        
        // Test invalid options parameter
        assertThrows(() => graphics.createRadar(100, 150, 50, null), 'Should throw for null options');
        assertThrows(() => graphics.createRadar(100, 150, 50, 'invalid'), 'Should throw for non-object options');
        
        TestRunner.cleanupTestDOM();
    });
    
    test('should create radar with correct structure', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        
        const radar = graphics.createRadar(0, 0, 60, { id: 'structured-radar' });
        
        // Check main structure
        assert(radar.querySelector('circle'), 'Should have background circle');
        
        // Check grid circles (default 4 lines means 4 concentric circles)
        // Total circles = 1 background + 4 grid circles = 5
        const allCircles = radar.querySelectorAll('circle');
        assertEqual(allCircles.length, 5, 'Should have 5 total circles (1 background + 4 grid)');
        
        // Check crosshair lines
        const lines = radar.querySelectorAll('line');
        assert(lines.length >= 2, 'Should have at least 2 crosshair lines');
        
        // Check blips container
        const blipsContainer = radar.querySelector('#structured-radar_blips');
        assert(blipsContainer !== null, 'Should have blips container');
        assertEqual(blipsContainer.tagName, 'G', 'Blips container should be a group element');
        
        TestRunner.cleanupTestDOM();
    });
    
    test('should create radar with sweep animation when enabled', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        
        // Test with animation enabled (default)
        const animatedRadar = graphics.createRadar(0, 0, 40);
        // Count total lines - should have 2 crosshair + 1 sweep = 3 lines
        const allLines = animatedRadar.querySelectorAll('line');
        assert(allLines.length >= 3, 'Should have at least 3 lines when animation enabled (2 crosshair + 1 sweep)');
        
        // Check for animation elements (sweep should have animateTransform)
        const animations = animatedRadar.querySelectorAll('animateTransform');
        assert(animations.length >= 1, 'Should have animation elements when sweep enabled');
        
        // Test with animation disabled
        const staticRadar = graphics.createRadar(0, 0, 40, { sweepAnimation: false });
        const staticLines = staticRadar.querySelectorAll('line');
        assertEqual(staticLines.length, 2, 'Should have only 2 lines when animation disabled (crosshairs only)');
        
        TestRunner.cleanupTestDOM();
    });
    
    test('should create weapon charge indicator with low energy warning', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        
        // Test low energy indicator (below warning threshold)
        const lowEnergyIndicator = graphics.createWeaponChargeIndicator(100, 150, 0.15); // 15% charge
        assert(lowEnergyIndicator !== null, 'Should create low energy weapon charge indicator');
        assertEqual(lowEnergyIndicator.tagName, 'G', 'Should create group element');
        
        // Check for warning animation elements when energy is low
        const warningRing = lowEnergyIndicator.querySelector('#warning-pulse-ring');
        assert(warningRing !== null, 'Should have warning pulse ring for low energy');
        assertEqual(warningRing.tagName, 'CIRCLE', 'Warning ring should be a circle');
        assertEqual(warningRing.getAttribute('stroke'), '#ff0000', 'Warning ring should be red');
        
        // Check for pulse animation
        const pulseAnimation = warningRing.querySelector('animate');
        assert(pulseAnimation !== null, 'Warning ring should have pulse animation');
        assertEqual(pulseAnimation.getAttribute('attributeName'), 'opacity', 'Animation should target opacity');
        assertEqual(pulseAnimation.getAttribute('repeatCount'), 'indefinite', 'Animation should repeat indefinitely');
        
        TestRunner.cleanupTestDOM();
    });
    
    test('should not show warning animation for high energy', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        
        // Test high energy indicator (above warning threshold)
        const highEnergyIndicator = graphics.createWeaponChargeIndicator(100, 150, 0.8); // 80% charge
        assert(highEnergyIndicator !== null, 'Should create high energy weapon charge indicator');
        
        // Should not have warning animation for high energy
        const warningRing = highEnergyIndicator.querySelector('#warning-pulse-ring');
        assertEqual(warningRing, null, 'Should not have warning pulse ring for high energy');
        
        TestRunner.cleanupTestDOM();
    });
    
    test('should update weapon charge indicator with warning animation', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        
        // Start with high energy
        const indicator = graphics.createWeaponChargeIndicator(100, 150, 0.8);
        assert(indicator.querySelector('#warning-pulse-ring') === null, 'Should not have warning initially');
        
        // Update to low energy - should add warning
        graphics.updateWeaponChargeIndicator(indicator, 0.15);
        const warningRingAfterUpdate = indicator.querySelector('#warning-pulse-ring');
        assert(warningRingAfterUpdate !== null, 'Should add warning pulse ring when energy drops');
        assert(warningRingAfterUpdate.querySelector('animate') !== null, 'Warning should have pulse animation');
        
        // Update back to high energy - should remove warning
        graphics.updateWeaponChargeIndicator(indicator, 0.8);
        const warningRingAfterRecharge = indicator.querySelector('#warning-pulse-ring');
        assertEqual(warningRingAfterRecharge, null, 'Should remove warning pulse ring when energy restored');
        
        TestRunner.cleanupTestDOM();
    });
    
    test('should have correct warning animation properties', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        
        const lowEnergyIndicator = graphics.createWeaponChargeIndicator(0, 0, 0.1); // 10% charge
        const warningRing = lowEnergyIndicator.querySelector('#warning-pulse-ring');
        const pulseAnimation = warningRing.querySelector('animate');
        
        // Check animation timing and values
        const animationDuration = pulseAnimation.getAttribute('dur');
        assert(typeof animationDuration === 'string', 'Animation should have duration');
        assert(animationDuration.length > 0, 'Duration should be specified');
        
        const animationValues = pulseAnimation.getAttribute('values');
        assert(typeof animationValues === 'string', 'Animation should have opacity values');
        assert(animationValues.includes(';'), 'Values should contain semicolon separators');
        
        // Check ring positioning and styling
        assertEqual(warningRing.getAttribute('fill'), 'none', 'Warning ring should have no fill');
        assertEqual(warningRing.getAttribute('stroke-width'), '2', 'Warning ring should have correct stroke width');
        
        TestRunner.cleanupTestDOM();
    });
    
    test('should handle updateLowEnergyWarning with null indicator', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        
        // Should not throw error when called with null indicator
        try {
            graphics.updateLowEnergyWarning(null, 0.1);
            assert(true, 'Should handle null indicator gracefully');
        } catch (error) {
            assert(false, 'Should not throw error with null indicator');
        }
        
        TestRunner.cleanupTestDOM();
    });
    
    test('should create asteroid damage indicator with correct structure', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        
        const damageIndicator = graphics.createAsteroidDamageIndicator(100, 150, 25);
        assert(damageIndicator !== null, 'Should create damage indicator');
        assertEqual(damageIndicator.tagName, 'G', 'Should create group element');
        
        // Check positioning
        const transform = damageIndicator.getAttribute('transform');
        assert(transform.includes('translate(100, 150)'), 'Should position indicator correctly');
        
        // Check for damage ring
        const damageRing = damageIndicator.querySelector('circle');
        assert(damageRing !== null, 'Should have damage ring circle');
        assertEqual(damageRing.getAttribute('fill'), 'none', 'Ring should have no fill');
        assertEqual(damageRing.getAttribute('stroke'), '#ff4444', 'Should have correct default color');
        assertEqual(damageRing.getAttribute('r'), '40', 'Should have correct radius (size + 15)');
        
        // Check for animations
        const pulseAnimation = damageRing.querySelector('animate');
        assert(pulseAnimation !== null, 'Should have pulse animation');
        assertEqual(pulseAnimation.getAttribute('attributeName'), 'opacity', 'Should animate opacity');
        
        const scaleAnimation = damageIndicator.querySelector('animateTransform');
        assert(scaleAnimation !== null, 'Should have scale animation');
        assertEqual(scaleAnimation.getAttribute('type'), 'scale', 'Should be scale animation');
        
        TestRunner.cleanupTestDOM();
    });
    
    test('should create damage indicator with custom attributes', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        
        const customIndicator = graphics.createAsteroidDamageIndicator(200, 300, 30, {
            ringColor: '#00ff00',
            ringOpacity: 0.5,
            duration: '3.0s',
            ringWidth: 5,
            id: 'custom-damage-ring'
        });
        
        assertEqual(customIndicator.getAttribute('id'), 'custom-damage-ring', 'Should use custom ID');
        
        const ring = customIndicator.querySelector('circle');
        assertEqual(ring.getAttribute('stroke'), '#00ff00', 'Should use custom color');
        assertEqual(ring.getAttribute('stroke-width'), '5', 'Should use custom width');
        assertEqual(ring.getAttribute('opacity'), '0.5', 'Should use custom opacity');
        assertEqual(ring.getAttribute('r'), '45', 'Should have correct radius (30 + 15)');
        
        const animation = ring.querySelector('animate');
        assertEqual(animation.getAttribute('dur'), '3.0s', 'Should use custom duration');
        
        TestRunner.cleanupTestDOM();
    });
});

/**
 * Particle System Tests
 */
describe('Particle System', function() {
    test('should initialize with empty particle collections', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        const particles = new ParticleSystem(graphics);
        
        assertEqual(particles.particles.size, 0, 'Should start with no particles');
        assertEqual(particles.activeEmitters.size, 0, 'Should start with no emitters');
        assertEqual(particles.idCounter, 0, 'Should start with zero ID counter');
        
        particles.stopUpdateLoop();
        TestRunner.cleanupTestDOM();
    });
    
    test('should create particle emitters', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        const particles = new ParticleSystem(graphics);
        
        const emitterId = particles.createEmitter(100, 200, {
            particleCount: 10,
            particleLife: 1000,
            color: '#ff0000'
        });
        
        assert(emitterId !== null, 'Should return emitter ID');
        assert(emitterId.startsWith('emitter_'), 'Should have correct ID format');
        assertEqual(particles.activeEmitters.size, 1, 'Should have one active emitter');
        
        const emitter = particles.activeEmitters.get(emitterId);
        assertEqual(emitter.x, 100, 'Should have correct X position');
        assertEqual(emitter.y, 200, 'Should have correct Y position');
        assertEqual(emitter.config.color, '#ff0000', 'Should have correct color');
        
        particles.stopUpdateLoop();
        TestRunner.cleanupTestDOM();
    });
    
    test('should create explosion effects', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        const particles = new ParticleSystem(graphics);
        
        const emitterId = particles.createExplosionEffect(150, 250, {
            particleCount: 20,
            color: '#ff6600'
        });
        
        assert(emitterId !== null, 'Should return emitter ID');
        
        const emitter = particles.activeEmitters.get(emitterId);
        assertEqual(emitter.config.burst, true, 'Explosion should be burst type');
        assertEqual(emitter.config.color, '#ff6600', 'Should have explosion color');
        assert(emitter.config.particleCount >= 20, 'Should have correct particle count');
        
        particles.stopUpdateLoop();
        TestRunner.cleanupTestDOM();
    });
    
    test('should create thruster trails', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        const particles = new ParticleSystem(graphics);
        
        const angle = Math.PI / 2; // 90 degrees
        const intensity = 0.8;
        const emitterId = particles.createThrusterTrail(300, 400, angle, intensity);
        
        assert(emitterId !== null, 'Should return emitter ID');
        
        const emitter = particles.activeEmitters.get(emitterId);
        assertEqual(emitter.config.burst, false, 'Thruster should be continuous');
        assert(emitter.config.direction !== undefined, 'Should have direction set');
        assert(emitter.config.particleCount > 0, 'Should have particles based on intensity');
        
        particles.stopUpdateLoop();
        TestRunner.cleanupTestDOM();
    });
    
    test('should create debris fields', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        const particles = new ParticleSystem(graphics);
        
        const asteroidSize = 30;
        const emitterId = particles.createDebrisField(500, 600, asteroidSize);
        
        assert(emitterId !== null, 'Should return emitter ID');
        
        const emitter = particles.activeEmitters.get(emitterId);
        assertEqual(emitter.config.burst, true, 'Debris should be burst type');
        assertEqual(emitter.config.color, '#8b7355', 'Should have debris color');
        assert(emitter.config.particleCount > 0, 'Should scale particle count with asteroid size');
        
        particles.stopUpdateLoop();
        TestRunner.cleanupTestDOM();
    });
    
    test('should create sparks effects', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        const particles = new ParticleSystem(graphics);
        
        const direction = Math.PI;
        const emitterId = particles.createSparksEffect(700, 800, direction);
        
        assert(emitterId !== null, 'Should return emitter ID');
        
        const emitter = particles.activeEmitters.get(emitterId);
        assertEqual(emitter.config.burst, true, 'Sparks should be burst type');
        assertEqual(emitter.config.color, '#ffff00', 'Should have sparks color');
        assertEqual(emitter.config.direction, direction, 'Should have correct direction');
        
        particles.stopUpdateLoop();
        TestRunner.cleanupTestDOM();
    });
    
    test('should create and manage particles', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        const particles = new ParticleSystem(graphics);
        
        const emitterId = particles.createEmitter(100, 200, {
            particleCount: 5,
            burst: true
        });
        
        const emitter = particles.activeEmitters.get(emitterId);
        assert(emitter.particles.length > 0, 'Should have created particles');
        assert(particles.particles.size > 0, 'Should have particles in main collection');
        
        // Check particle properties
        const particle = emitter.particles[0];
        assert(particle.id !== undefined, 'Particle should have ID');
        assert(typeof particle.x === 'number', 'Particle should have X position');
        assert(typeof particle.y === 'number', 'Particle should have Y position');
        assert(typeof particle.velX === 'number', 'Particle should have X velocity');
        assert(typeof particle.velY === 'number', 'Particle should have Y velocity');
        assert(particle.element !== undefined, 'Particle should have visual element');
        
        particles.stopUpdateLoop();
        TestRunner.cleanupTestDOM();
    });
    
    test('should remove particles correctly', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        const particles = new ParticleSystem(graphics);
        
        const emitterId = particles.createEmitter(100, 200, {
            particleCount: 3,
            burst: true
        });
        
        const emitter = particles.activeEmitters.get(emitterId);
        const initialCount = emitter.particles.length;
        const particleToRemove = emitter.particles[0];
        const particleId = particleToRemove.id;
        
        particles.removeParticle(particleId);
        
        assertEqual(emitter.particles.length, initialCount - 1, 'Should remove particle from emitter');
        assert(!particles.particles.has(particleId), 'Should remove particle from main collection');
        
        particles.stopUpdateLoop();
        TestRunner.cleanupTestDOM();
    });
    
    test('should remove emitters and their particles', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        const particles = new ParticleSystem(graphics);
        
        const emitterId = particles.createEmitter(100, 200, {
            particleCount: 5,
            burst: true
        });
        
        assert(particles.activeEmitters.has(emitterId), 'Should have emitter');
        assert(particles.particles.size > 0, 'Should have particles');
        
        particles.removeEmitter(emitterId);
        
        assert(!particles.activeEmitters.has(emitterId), 'Should remove emitter');
        assertEqual(particles.particles.size, 0, 'Should remove all particles from emitter');
        
        particles.stopUpdateLoop();
        TestRunner.cleanupTestDOM();
    });
    
    test('should clear all particles and emitters', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        const particles = new ParticleSystem(graphics);
        
        // Create multiple emitters
        particles.createEmitter(100, 200, { particleCount: 3, burst: true });
        particles.createEmitter(300, 400, { particleCount: 2, burst: true });
        
        assert(particles.activeEmitters.size > 0, 'Should have emitters');
        assert(particles.particles.size > 0, 'Should have particles');
        
        particles.clear();
        
        assertEqual(particles.activeEmitters.size, 0, 'Should clear all emitters');
        assertEqual(particles.particles.size, 0, 'Should clear all particles');
        assertEqual(particles.idCounter, 0, 'Should reset ID counter');
        
        particles.stopUpdateLoop();
        TestRunner.cleanupTestDOM();
    });
    
    test('should provide debug information', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        const particles = new ParticleSystem(graphics);
        
        particles.createEmitter(100, 200, { particleCount: 3, burst: true });
        particles.createEmitter(300, 400, { particleCount: 2, burst: true });
        
        const debugInfo = particles.getDebugInfo();
        
        assertEqual(typeof debugInfo.activeEmitters, 'number', 'Should return active emitter count');
        assertEqual(typeof debugInfo.activeParticles, 'number', 'Should return active particle count');
        assertEqual(typeof debugInfo.totalCreatedParticles, 'number', 'Should return total created particles');
        
        assert(debugInfo.activeEmitters > 0, 'Should have active emitters');
        assert(debugInfo.activeParticles > 0, 'Should have active particles');
        assert(debugInfo.totalCreatedParticles > 0, 'Should have created particles');
        
        particles.stopUpdateLoop();
        TestRunner.cleanupTestDOM();
    });
    
    test('should handle update loop control', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        const particles = new ParticleSystem(graphics);
        
        assert(particles.updateInterval !== null, 'Should start with update loop running');
        
        particles.stopUpdateLoop();
        assertEqual(particles.updateInterval, null, 'Should stop update loop');
        
        particles.startUpdateLoop();
        assert(particles.updateInterval !== null, 'Should restart update loop');
        
        particles.stopUpdateLoop();
        TestRunner.cleanupTestDOM();
    });
    
    test('should find particle emitter correctly', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const graphics = new GraphicsEngine(canvas);
        const particles = new ParticleSystem(graphics);
        
        const emitterId = particles.createEmitter(100, 200, {
            particleCount: 2,
            burst: true
        });
        
        const emitter = particles.activeEmitters.get(emitterId);
        const particle = emitter.particles[0];
        
        const foundEmitter = particles.getParticleEmitter(particle);
        
        assertEqual(foundEmitter.id, emitterId, 'Should find correct emitter for particle');
        
        particles.stopUpdateLoop();
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
        
        // Camera centers on the given coordinates
        assertEqual(camera.x, 500, 'Camera X should center correctly');
        assertEqual(camera.y, 300, 'Camera Y should center correctly');
        
        TestRunner.cleanupTestDOM();
    });
    
    test('should zoom in and out', function() {
        const testContainer = TestRunner.setupTestDOM();
        const canvas = testContainer.querySelector('#gameCanvas');
        const camera = new Camera(canvas);
        
        const initialZoom = camera.zoom;
        
        camera.zoomIn();
        // Multiple updates to apply zoom changes due to smoothing
        for (let i = 0; i < 20; i++) camera.update();
        assert(camera.zoom > initialZoom, 'Zoom should increase');
        
        camera.zoomOut();
        // Multiple updates to apply zoom changes due to smoothing
        for (let i = 0; i < 20; i++) camera.update();
        assertApproxEqual(camera.zoom, initialZoom, 0.1, 'Zoom should return to initial value');
        
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
        
        // Simulate pressing W (up) - use correct key state structure
        input.keys.set('KeyW', {
            isPressed: true,
            justPressed: false,
            justReleased: false,
            timestamp: Date.now()
        });
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
        assertEqual(navigation.currentSector, 'alpha-sector', 'Should start in alpha-sector');
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
            
            // Test exact position match
            const exactGate = navigation.checkJumpGateProximity(gate.x, gate.y, 100);
            assert(exactGate !== null, 'Should detect gate at exact position');
            assertEqual(exactGate.id, gate.id, 'Should return correct gate');
            
            // Test boundary condition - just within range
            const withinRangeGate = navigation.checkJumpGateProximity(gate.x + 79, gate.y, 80);
            assert(withinRangeGate !== null, 'Should detect gate just within range');
            assertEqual(withinRangeGate.id, gate.id, 'Should return correct gate at boundary');
            
            // Test boundary condition - just outside range
            const justOutsideGate = navigation.checkJumpGateProximity(gate.x + 81, gate.y, 80);
            assertEqual(justOutsideGate, null, 'Should not detect gate just outside range');
            
            // Test far distance
            const farGate = navigation.checkJumpGateProximity(gate.x + 200, gate.y + 200, 50);
            assertEqual(farGate, null, 'Should not detect distant gate');
            
            // Test with default range parameter
            const defaultRangeGate = navigation.checkJumpGateProximity(gate.x + 75, gate.y);
            assert(defaultRangeGate !== null, 'Should use default range when not specified');
            
            // Test diagonal proximity
            const diagonalDistance = Math.sqrt(50 * 50 + 50 * 50); // ~70.7
            const diagonalGate = navigation.checkJumpGateProximity(gate.x + 50, gate.y + 50, 80);
            assert(diagonalGate !== null, 'Should detect gate at diagonal distance within range');
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
    
    test('should check if player can buy from station', function() {
        const trading = new TradingSystem();
        
        const canBuy = trading.canBuyFromStation('tradingStation', 'ore-iron', 5);
        
        assert(canBuy.success, 'Should be able to buy available item');
        assertEqual(typeof canBuy.cost, 'number', 'Should return cost');
        assert(canBuy.cost > 0, 'Cost should be positive');
    });
    
    test('should reject buy when station not found', function() {
        const trading = new TradingSystem();
        
        const canBuy = trading.canBuyFromStation('nonexistent-station', 'ore-iron', 1);
        
        assert(!canBuy.success, 'Should fail for nonexistent station');
        assertEqual(canBuy.error, 'Station not found', 'Should return correct error');
    });
    
    test('should reject buy when item not available', function() {
        const trading = new TradingSystem();
        
        const canBuy = trading.canBuyFromStation('tradingStation', 'nonexistent-item', 1);
        
        assert(!canBuy.success, 'Should fail for unavailable item');
        assertEqual(canBuy.error, 'Item not available', 'Should return correct error');
    });
    
    test('should reject buy when insufficient stock', function() {
        const trading = new TradingSystem();
        
        const canBuy = trading.canBuyFromStation('tradingStation', 'ore-iron', 1000);
        
        assert(!canBuy.success, 'Should fail for excessive quantity');
        assertEqual(canBuy.error, 'Insufficient stock', 'Should return correct error');
    });
    
    test('should buy from station successfully', function() {
        const trading = new TradingSystem();
        const playerCredits = 500;
        
        const result = trading.buyFromStation('tradingStation', 'ore-iron', 2, playerCredits);
        
        assert(result.success, 'Buy should succeed');
        assertEqual(typeof result.cost, 'number', 'Should return cost');
        assertEqual(typeof result.newPlayerQuantity, 'number', 'Should return new player quantity');
        assertEqual(typeof result.newStationQuantity, 'number', 'Should return new station quantity');
        
        // Check player inventory updated
        const playerQuantity = trading.getPlayerItemQuantity('ore-iron');
        assertEqual(playerQuantity, 2, 'Player should have bought items');
    });
    
    test('should reject buy with insufficient credits', function() {
        const trading = new TradingSystem();
        const playerCredits = 1; // Very low credits
        
        const result = trading.buyFromStation('tradingStation', 'ore-iron', 10, playerCredits);
        
        assert(!result.success, 'Should fail with insufficient credits');
        assertEqual(result.error, 'Insufficient credits', 'Should return correct error');
    });
    
    test('should check if player can sell to station', function() {
        const trading = new TradingSystem();
        trading.addPlayerItem('ore-iron', 5);
        
        const canSell = trading.canSellToStation('tradingStation', 'ore-iron', 3, 0);
        
        assert(canSell.success, 'Should be able to sell owned item');
        assertEqual(typeof canSell.value, 'number', 'Should return value');
        assert(canSell.value > 0, 'Value should be positive');
    });
    
    test('should reject sell when player lacks inventory', function() {
        const trading = new TradingSystem();
        
        const canSell = trading.canSellToStation('tradingStation', 'ore-iron', 5, 0);
        
        assert(!canSell.success, 'Should fail when player has no items');
        assertEqual(canSell.error, 'Insufficient inventory', 'Should return correct error');
    });
    
    test('should sell to station successfully', function() {
        const trading = new TradingSystem();
        trading.addPlayerItem('ore-iron', 10);
        
        const result = trading.sellToStation('tradingStation', 'ore-iron', 3);
        
        assert(result.success, 'Sell should succeed');
        assertEqual(typeof result.value, 'number', 'Should return value');
        assertEqual(typeof result.newPlayerQuantity, 'number', 'Should return new player quantity');
        assertEqual(typeof result.newStationQuantity, 'number', 'Should return new station quantity');
        
        // Check player inventory updated
        const playerQuantity = trading.getPlayerItemQuantity('ore-iron');
        assertEqual(playerQuantity, 7, 'Player should have remaining items');
    });
    
    test('should get station inventory', function() {
        const trading = new TradingSystem();
        
        const inventory = trading.getStationInventory('tradingStation');
        
        assert(inventory !== null, 'Should return inventory data');
        assertEqual(typeof inventory.credits, 'number', 'Should have credits');
        assert(Array.isArray(inventory.items), 'Should have items array');
        assert(inventory.items.length > 0, 'Should have items');
        
        // Check item structure
        const item = inventory.items[0];
        assert(item.item !== undefined, 'Should have item data');
        assertEqual(typeof item.quantity, 'number', 'Should have quantity');
        assertEqual(typeof item.buyPrice, 'number', 'Should have buy price');
        assertEqual(typeof item.sellPrice, 'number', 'Should have sell price');
    });
    
    test('should return null for nonexistent station inventory', function() {
        const trading = new TradingSystem();
        
        const inventory = trading.getStationInventory('nonexistent');
        
        assertEqual(inventory, null, 'Should return null for nonexistent station');
    });
    
    test('should update prices based on trading activity', function() {
        const trading = new TradingSystem();
        const stationInventory = trading.getStationInventory('tradingStation');
        const ironItem = stationInventory.items.find(item => item.item.id === 'ore-iron');
        const originalSellPrice = ironItem.sellPrice;
        
        // Buy some items (should increase price)
        trading.buyFromStation('tradingStation', 'ore-iron', 5, 1000);
        
        const updatedInventory = trading.getStationInventory('tradingStation');
        const updatedIronItem = updatedInventory.items.find(item => item.item.id === 'ore-iron');
        
        assert(updatedIronItem.sellPrice > originalSellPrice, 'Sell price should increase after buying');
    });
    
    test('should calculate total inventory value', function() {
        const trading = new TradingSystem();
        trading.addPlayerItem('ore-iron', 5);
        trading.addPlayerItem('ore-copper', 3);
        
        const totalValue = trading.getTotalInventoryValue();
        
        assert(totalValue > 0, 'Total value should be positive');
        assertEqual(typeof totalValue, 'number', 'Should return number');
        
        // Value should be quantity * base price for each item
        const ironItem = trading.getItem('ore-iron');
        const copperItem = trading.getItem('ore-copper');
        const expectedValue = (ironItem.basePrice * 5) + (copperItem.basePrice * 3);
        
        assertEqual(totalValue, expectedValue, 'Should calculate correct total value');
    });
    
    test('should validate updatePrices parameters - invalid stationId', function() {
        const trading = new TradingSystem();
        
        // Test invalid stationId types and values
        const invalidStationIds = [null, undefined, '', '   ', 123, {}, [], true];
        
        invalidStationIds.forEach(invalidId => {
            let errorThrown = false;
            try {
                trading.updatePrices(invalidId, 'ore-iron', 'buy', 1);
            } catch (error) {
                errorThrown = true;
                assert(error.message.includes('Invalid stationId'), 'Should throw stationId validation error');
            }
            assert(errorThrown, `Should throw error for invalid stationId: ${invalidId}`);
        });
    });
    
    test('should validate updatePrices parameters - invalid itemId', function() {
        const trading = new TradingSystem();
        
        // Test invalid itemId types and values
        const invalidItemIds = [null, undefined, '', '   ', 123, {}, [], true];
        
        invalidItemIds.forEach(invalidId => {
            let errorThrown = false;
            try {
                trading.updatePrices('tradingStation', invalidId, 'buy', 1);
            } catch (error) {
                errorThrown = true;
                assert(error.message.includes('Invalid itemId'), 'Should throw itemId validation error');
            }
            assert(errorThrown, `Should throw error for invalid itemId: ${invalidId}`);
        });
    });
    
    test('should validate updatePrices parameters - invalid action', function() {
        const trading = new TradingSystem();
        
        // Test invalid action types and values
        const invalidActions = [null, undefined, '', 'BUY', 'SELL', 'purchase', 'trade', 123, {}, [], true];
        
        invalidActions.forEach(invalidAction => {
            let errorThrown = false;
            try {
                trading.updatePrices('tradingStation', 'ore-iron', invalidAction, 1);
            } catch (error) {
                errorThrown = true;
                assert(error.message.includes('Invalid action'), 'Should throw action validation error');
            }
            assert(errorThrown, `Should throw error for invalid action: ${invalidAction}`);
        });
    });
    
    test('should validate updatePrices parameters - invalid quantity', function() {
        const trading = new TradingSystem();
        
        // Test invalid quantity types and values
        const invalidQuantities = [null, undefined, '', '5', 0, -1, -10, NaN, Infinity, -Infinity, {}, [], true];
        
        invalidQuantities.forEach(invalidQuantity => {
            let errorThrown = false;
            try {
                trading.updatePrices('tradingStation', 'ore-iron', 'buy', invalidQuantity);
            } catch (error) {
                errorThrown = true;
                assert(error.message.includes('Invalid quantity'), 'Should throw quantity validation error');
            }
            assert(errorThrown, `Should throw error for invalid quantity: ${invalidQuantity}`);
        });
    });
    
    test('should validate updatePrices parameters - valid inputs', function() {
        const trading = new TradingSystem();
        
        // These should not throw errors
        try {
            trading.updatePrices('tradingStation', 'ore-iron', 'buy', 1);
            trading.updatePrices('tradingStation', 'ore-copper', 'sell', 5.5);
            trading.updatePrices('tradingStation', 'fuel-hydrogen', 'buy', 0.1);
        } catch (error) {
            assert(false, `Valid parameters should not throw errors: ${error.message}`);
        }
    });
});

/**
 * Weapon System Tests
 */
describe('Weapon System', function() {
    test('should have weapon recharge constants defined', async function() {
        const { WEAPONS, AUDIO } = await import('../src/constants.js');
        
        assert(typeof WEAPONS.ENERGY_RECHARGE_SOUND_THRESHOLD === 'number', 'Should have recharge sound threshold');
        assert(WEAPONS.ENERGY_RECHARGE_SOUND_THRESHOLD > 0, 'Recharge threshold should be positive');
        assert(WEAPONS.ENERGY_RECHARGE_SOUND_THRESHOLD < WEAPONS.MAX_ENERGY, 'Threshold should be less than max energy');
        
        assert(typeof AUDIO.WEAPON_RECHARGE_VOLUME === 'number', 'Should have recharge volume constant');
        assert(typeof AUDIO.WEAPON_RECHARGE_DURATION === 'number', 'Should have recharge duration constant');
    });
});

/**
 * Auth Service Tests
 */
describe('Authentication Service', function() {
    test('should initialize in guest mode', function() {
        const auth = new AuthService();
        
        assert(!auth.isLoggedIn(), 'Should start logged out');
        assert(!auth.isGuest(), 'Should not start in guest mode until explicitly set');
        assertEqual(auth.getCurrentUser(), null, 'Should have no current user');
    });
    
    test('should handle guest login', async function() {
        const auth = new AuthService();
        
        const result = await auth.loginAsGuest('TestPlayer');
        
        assert(result.success, 'Guest login should succeed');
        assert(auth.isGuest(), 'Should be in guest mode after guest login');
        assert(auth.getCurrentUser() !== null, 'Should have current user');
        assertEqual(auth.getCurrentUser().username, 'TestPlayer', 'Should have correct username');
    });
    
    test('should handle logout', async function() {
        const auth = new AuthService();
        
        // Login first
        await auth.loginAsGuest('TestPlayer');
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
        
        // Should not throw error even when called multiple times
        const promise1 = audio.resumeAudioContext();
        const promise2 = audio.resumeAudioContext();
        
        // Both promises should resolve or reject gracefully
        Promise.all([promise1, promise2]).then(() => {
            // This should complete without error
        }).catch(() => {
            // Catch is fine, some environments may not support it
        });
    });
    
    test('should handle resume in play method', function() {
        const audio = new AudioManager();
        
        if (audio.isEnabled && audio.audioContext) {
            // Mock suspended state
            const originalState = audio.audioContext.state;
            
            // Simulate suspended context
            Object.defineProperty(audio.audioContext, 'state', {
                value: 'suspended',
                configurable: true
            });
            
            // Play method should handle suspended context gracefully
            const result = audio.play('thruster');
            
            // Should not crash even with suspended context
            if (result) {
                assert(typeof result.stop === 'function', 'Should return valid sound object');
            }
            
            // Restore original state
            Object.defineProperty(audio.audioContext, 'state', {
                value: originalState,
                configurable: true
            });
        }
    });
    
    test('should handle resume with null audio context', function() {
        const audio = new AudioManager();
        const originalContext = audio.audioContext;
        
        // Temporarily set null context
        audio.audioContext = null;
        
        // Should handle gracefully
        const promise = audio.resumeAudioContext();
        assert(promise instanceof Promise, 'Should return Promise even with null context');
        
        promise.then(() => {
            // Should complete without error
        }).catch(() => {
            // Expected for null context
        });
        
        // Restore original context
        audio.audioContext = originalContext;
    });
    
    test('should generate weapon recharge sound', function() {
        const audio = new AudioManager();
        
        if (audio.isEnabled) {
            assert(audio.sounds.has('weaponRecharge'), 'Should have weapon recharge sound');
            
            const rechargeBuffer = audio.sounds.get('weaponRecharge');
            if (rechargeBuffer) {
                assert(rechargeBuffer instanceof AudioBuffer, 'Recharge should be AudioBuffer');
                assert(rechargeBuffer.length > 0, 'Recharge buffer should have samples');
                assert(rechargeBuffer.duration > 0.5, 'Recharge sound should be at least 0.5 seconds');
            }
        }
    });
    
    test('should play weapon recharge sound', function() {
        const audio = new AudioManager();
        
        const result = audio.playWeaponRecharge();
        
        if (audio.isEnabled) {
            if (result) {
                assert(typeof result.stop === 'function', 'Should return valid sound object with stop method');
                assert(typeof result.setVolume === 'function', 'Should return sound object with setVolume method');
            }
        } else {
            assertEqual(result, null, 'Should return null when audio is disabled');
        }
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