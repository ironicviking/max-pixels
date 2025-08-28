#!/usr/bin/env node

/**
 * Headless Test Runner for Max-Pixels
 * Runs tests programmatically using JSDOM for CI/CD automation
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

/**
 * Create a minimal DOM environment for testing
 */
function setupTestEnvironment() {
    // Mock localStorage for auth tests
    global.localStorage = {
        setItem: function(key, value) { this[key] = value; },
        getItem: function(key) { return this[key] || null; },
        removeItem: function(key) { delete this[key]; },
        clear: function() { 
            Object.keys(this).forEach(key => {
                if (typeof this[key] === 'string') delete this[key];
            });
        }
    };

    // Basic DOM globals that our tests expect
    global.document = {
        createElement: (tag) => {
            const element = {
                tagName: tag.toUpperCase(),
                id: '',
                className: '',
                style: {},
                innerHTML: '',
                textContent: '',
                setAttribute: function(name, value) { this[name] = value; },
                getAttribute: function(name) { return this[name]; },
                appendChild: function(child) { return child; },
                querySelector: function() { return null; },
                querySelectorAll: function() { return []; },
                addEventListener: function() {},
                removeEventListener: function() {},
                dispatchEvent: function() { return true; }
            };
            
            // Special handling for SVG elements
            if (tag.toLowerCase() === 'svg') {
                element.createSVGElement = (svgTag) => ({
                    tagName: svgTag.toUpperCase(),
                    setAttribute: function(name, value) { this[name] = value; },
                    getAttribute: function(name) { return this[name]; },
                    appendChild: function(child) { return child; }
                });
            }
            
            return element;
        },
        
        getElementById: function(id) {
            // Check dynamically added elements first
            if (this._elementsById && this._elementsById[id]) {
                return this._elementsById[id];
            }
            
            // Return mock elements for common game elements
            const mockElements = {
                'gameCanvas': {
                    tagName: 'svg',
                    setAttribute: function(name, value) { this[name] = value; },
                    getAttribute: function(name) { return this[name]; },
                    querySelector: function() { return null; },
                    appendChild: function(child) { return child; }
                },
                'ui': {
                    tagName: 'div',
                    insertAdjacentHTML: function() {},
                    appendChild: function(child) { return child; },
                    querySelector: function() { return null; }
                },
                'test-container': {
                    tagName: 'div',
                    innerHTML: '<svg id="gameCanvas" width="1920" height="1080"></svg><div id="ui"></div>',
                    querySelector: function(selector) {
                        if (selector === '#gameCanvas') return this.gameCanvas;
                        if (selector === '#ui') return this.ui;
                        return null;
                    },
                    gameCanvas: {
                        tagName: 'svg',
                        setAttribute: function(name, value) { this[name] = value; },
                        getAttribute: function(name) { return this[name]; },
                        querySelector: function(selector) { return null; },
                        querySelectorAll: function() { return []; },
                        style: {}
                    },
                    ui: {
                        tagName: 'div',
                        insertAdjacentHTML: function() {},
                        appendChild: function(child) { return child; },
                        querySelector: function(selector) { return null; },
                        querySelectorAll: function() { return []; }
                    }
                }
            };
            return mockElements[id] || {
                tagName: 'div',
                style: {},
                textContent: '',
                innerHTML: '',
                setAttribute: function(name, value) { this[name] = value; },
                getAttribute: function(name) { return this[name]; }
            };
        },
        
        addEventListener: function(event, handler) {
            this._listeners = this._listeners || {};
            this._listeners[event] = this._listeners[event] || [];
            this._listeners[event].push(handler);
        },
        removeEventListener: function(event, handler) {
            if (this._listeners && this._listeners[event]) {
                const index = this._listeners[event].indexOf(handler);
                if (index > -1) {
                    this._listeners[event].splice(index, 1);
                }
            }
        },
        dispatchEvent: function(event) {
            if (this._listeners && this._listeners[event.type]) {
                this._listeners[event.type].forEach(handler => {
                    try {
                        handler(event);
                    } catch (e) {
                        // Handle event errors gracefully
                    }
                });
            }
            return true;
        },
        body: {
            _children: [],
            appendChild: function(child) { 
                this._children.push(child);
                // Register element by ID for getElementById lookup
                if (child.id) {
                    this.parentNode._elementsById = this.parentNode._elementsById || {};
                    this.parentNode._elementsById[child.id] = child;
                }
                return child; 
            },
            removeChild: function(child) { 
                const index = this._children.indexOf(child);
                if (index > -1) {
                    this._children.splice(index, 1);
                }
                // Unregister from getElementById lookup
                if (child.id && this.parentNode._elementsById) {
                    delete this.parentNode._elementsById[child.id];
                }
                return child; 
            },
            style: {},
            parentNode: null // Will be set to document below
        },
        head: {
            appendChild: function(child) { return child; }
        }
    };
    
    // Set up document relationships
    global.document.body.parentNode = global.document;

    global.window = {
        addEventListener: function() {},
        removeEventListener: function() {},
        AudioContext: null, // Disable audio in headless mode
        webkitAudioContext: null,
        requestAnimationFrame: function(callback) {
            return setTimeout(callback, 16); // ~60fps
        },
        cancelAnimationFrame: function(id) {
            clearTimeout(id);
        }
    };

    global.performance = {
        now: function() { return Date.now(); },
        memory: {
            usedJSHeapSize: 1000000,
            totalJSHeapSize: 2000000,
            jsHeapSizeLimit: 100000000
        }
    };

    // Mock SVG creation for graphics engine
    global.SVGElement = class SVGElement {
        constructor() {
            this.tagName = 'svg';
            this.style = {};
        }
        setAttribute(name, value) { this[name] = value; }
        getAttribute(name) { return this[name]; }
        appendChild(child) { return child; }
        querySelector() { return null; }
        querySelectorAll() { return []; }
    };

    // Mock keyboard events
    global.KeyboardEvent = class KeyboardEvent {
        constructor(type, options = {}) {
            this.type = type;
            this.code = options.code || '';
            this.key = options.key || '';
        }
    };
}

/**
 * Import and run all tests
 */
async function runHeadlessTests() {
    console.log('🚀 Starting Max-Pixels Headless Test Runner...\n');
    
    // Setup test environment
    setupTestEnvironment();

    try {
        // Import test modules dynamically
        const testModulePath = join(projectRoot, 'test', 'GameTests.js');
        const testUrl = `file://${testModulePath}`;
        
        console.log('📂 Loading test modules...');
        
        // Import the test framework and tests
        const { TestRunner } = await import(testUrl);
        
        console.log('✅ Test modules loaded successfully\n');
        
        // Run all tests
        const results = await TestRunner.runTests();
        
        // Print final summary
        console.log('\n' + '='.repeat(60));
        console.log('🏁 HEADLESS TEST RUNNER SUMMARY');
        console.log('='.repeat(60));
        
        if (results.failed === 0) {
            console.log('✅ ALL TESTS PASSED');
            process.exit(0);
        } else {
            console.log('❌ SOME TESTS FAILED');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('💥 Fatal error running tests:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run the tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runHeadlessTests();
}

export { runHeadlessTests, setupTestEnvironment };