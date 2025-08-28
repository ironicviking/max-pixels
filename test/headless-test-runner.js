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
                _children: [],
                setAttribute: function(name, value) { 
                    this[name] = String(value); 
                    if (name === 'id') this.id = value;
                },
                getAttribute: function(name) { return this[name]; },
                appendChild: function(child) { 
                    this._children.push(child);
                    // Register element by ID for querySelector
                    if (child.id) {
                        this._elementsById = this._elementsById || {};
                        this._elementsById[child.id] = child;
                    }
                    return child; 
                },
                querySelector: function(selector) { 
                    // Handle ID selectors
                    if (selector.startsWith('#')) {
                        const id = selector.substring(1);
                        if (this._elementsById && this._elementsById[id]) {
                            return this._elementsById[id];
                        }
                        // Check innerHTML-created elements
                        if (this.innerHTML.includes(`id="${id}"`)) {
                            if (id === 'gameCanvas') {
                                // Cache and return properly enhanced SVG element
                                if (!this._cachedGameCanvas) {
                                    this._cachedGameCanvas = global.document.createElement('svg');
                                    this._cachedGameCanvas.id = 'gameCanvas';
                                    this._cachedGameCanvas.setAttribute('width', '1920');
                                    this._cachedGameCanvas.setAttribute('height', '1080');
                                }
                                return this._cachedGameCanvas;
                            }
                            if (id === 'ui') {
                                return global.document.getElementById('ui');
                            }
                        }
                    }
                    return null; 
                },
                querySelectorAll: function() { return []; },
                addEventListener: function() {},
                removeEventListener: function() {},
                dispatchEvent: function() { return true; }
            };
            
            // Special handling for SVG elements
            if (tag.toLowerCase() === 'svg') {
                element.createSVGElement = (svgTag) => ({
                    tagName: svgTag.toUpperCase(),
                    setAttribute: function(name, value) { this[name] = String(value); },
                    getAttribute: function(name) { return this[name]; },
                    appendChild: function(child) { return child; },
                    _children: []
                });
                
                // Enhance SVG elements with proper querySelector support
                element._childrenByTag = new Map();
                element.appendChild = function(child) { 
                    this._children = this._children || [];
                    this._children.push(child);
                    // Set parent-child relationship
                    child.parentNode = this;
                    // Register child elements with tagName for querySelector
                    if (child && child.tagName) {
                        if (!this._childrenByTag) {
                            this._childrenByTag = new Map();
                        }
                        const tagName = child.tagName.toLowerCase();
                        if (!this._childrenByTag.has(tagName)) {
                            this._childrenByTag.set(tagName, []);
                        }
                        this._childrenByTag.get(tagName).push(child);
                    }
                    // Also register by ID
                    if (child && child.id) {
                        this._elementsById = this._elementsById || {};
                        this._elementsById[child.id] = child;
                    }
                    return child; 
                };
                
                // Add removeChild method for SVG elements
                element.removeChild = function(child) {
                    if (!this._children) return null;
                    const index = this._children.indexOf(child);
                    if (index > -1) {
                        this._children.splice(index, 1);
                        child.parentNode = null;
                    }
                    // Remove from tagName lookup
                    if (child && child.tagName && this._childrenByTag) {
                        const tagName = child.tagName.toLowerCase();
                        const children = this._childrenByTag.get(tagName);
                        if (children) {
                            const tagIndex = children.indexOf(child);
                            if (tagIndex > -1) {
                                children.splice(tagIndex, 1);
                            }
                        }
                    }
                    // Remove from ID lookup
                    if (child && child.id && this._elementsById) {
                        delete this._elementsById[child.id];
                    }
                    return child;
                };
                element.querySelector = function(selector) { 
                    // Handle ID selectors
                    if (selector.startsWith('#')) {
                        const id = selector.substring(1);
                        if (this._elementsById && this._elementsById[id]) {
                            return this._elementsById[id];
                        }
                    }
                    // Handle tag selectors  
                    if (this._childrenByTag && this._childrenByTag.has(selector)) {
                        const children = this._childrenByTag.get(selector);
                        return children.length > 0 ? children[0] : null;
                    }
                    return null; 
                };
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
                    tagName: 'SVG',
                    setAttribute: function(name, value) { this[name] = String(value); },
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
                        tagName: 'SVG',
                        _children: [],
                        setAttribute: function(name, value) { this[name] = String(value); },
                        getAttribute: function(name) { return this[name]; },
                        appendChild: function(child) { 
                            this._children = this._children || [];
                            this._children.push(child);
                            // Set parent-child relationship
                            child.parentNode = this;
                            // Register child elements with tagName for querySelector
                            if (child.tagName && !this._childrenByTag) {
                                this._childrenByTag = new Map();
                            }
                            if (child.tagName && this._childrenByTag) {
                                const tagName = child.tagName.toLowerCase();
                                if (!this._childrenByTag.has(tagName)) {
                                    this._childrenByTag.set(tagName, []);
                                }
                                this._childrenByTag.get(tagName).push(child);
                            }
                            // Also register by ID
                            if (child && child.id) {
                                this._elementsById = this._elementsById || {};
                                this._elementsById[child.id] = child;
                            }
                            return child; 
                        },
                        
                        // Add removeChild method for gameCanvas
                        removeChild: function(child) {
                            if (!this._children) return null;
                            const index = this._children.indexOf(child);
                            if (index > -1) {
                                this._children.splice(index, 1);
                                child.parentNode = null;
                            }
                            // Remove from tagName lookup
                            if (child && child.tagName && this._childrenByTag) {
                                const tagName = child.tagName.toLowerCase();
                                const children = this._childrenByTag.get(tagName);
                                if (children) {
                                    const tagIndex = children.indexOf(child);
                                    if (tagIndex > -1) {
                                        children.splice(tagIndex, 1);
                                    }
                                }
                            }
                            // Remove from ID lookup
                            if (child && child.id && this._elementsById) {
                                delete this._elementsById[child.id];
                            }
                            return child;
                        },
                        querySelector: function(selector) { 
                            // Handle ID selectors
                            if (selector.startsWith('#')) {
                                const id = selector.substring(1);
                                if (this._elementsById && this._elementsById[id]) {
                                    return this._elementsById[id];
                                }
                            }
                            // Support basic tag name queries for GraphicsEngine
                            if (selector === 'defs') {
                                return this._children.find(child => child.tagName === 'DEFS') || null;
                            }
                            if (this._childrenByTag) {
                                const children = this._childrenByTag.get(selector);
                                if (children && children.length > 0) {
                                    return children[0];
                                }
                            }
                            return null; 
                        },
                        querySelectorAll: function(selector) { 
                            if (this._childrenByTag) {
                                return this._childrenByTag.get(selector) || [];
                            }
                            return []; 
                        },
                        style: {},
                        _childrenByTag: new Map()
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
                setAttribute: function(name, value) { this[name] = String(value); },
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
        },
        
        // Add createElementNS for SVG support in headless testing
        createElementNS: function(namespace, tagName) {
            const element = {
                tagName: tagName.toUpperCase(),
                namespaceURI: namespace,
                id: '',
                className: '',
                style: {},
                innerHTML: '',
                textContent: '',
                _children: [],
                _childrenByTag: new Map(),
                setAttribute: function(name, value) { 
                    this[name] = String(value);
                    if (name === 'id') this.id = value;
                },
                getAttribute: function(name) { return this[name]; },
                appendChild: function(child) { 
                    this._children = this._children || [];
                    this._children.push(child);
                    // Set parent-child relationship
                    child.parentNode = this;
                    // Register child elements with tagName for querySelector
                    if (child && child.tagName) {
                        if (!this._childrenByTag) {
                            this._childrenByTag = new Map();
                        }
                        // Keep SVG tag names in their original case for proper querySelector support
                        const tagName = child.tagName.toLowerCase();
                        const originalTagName = child.tagName === 'ANIMATETRANSFORM' ? 'animateTransform' : tagName;
                        
                        // Store both lowercase and original case for SVG compatibility
                        if (!this._childrenByTag.has(tagName)) {
                            this._childrenByTag.set(tagName, []);
                        }
                        this._childrenByTag.get(tagName).push(child);
                        
                        if (originalTagName !== tagName) {
                            if (!this._childrenByTag.has(originalTagName)) {
                                this._childrenByTag.set(originalTagName, []);
                            }
                            this._childrenByTag.get(originalTagName).push(child);
                        }
                    }
                    // Also register by ID
                    if (child && child.id) {
                        this._elementsById = this._elementsById || {};
                        this._elementsById[child.id] = child;
                    }
                    return child; 
                },
                querySelector: function(selector) { 
                    // Handle ID selectors
                    if (selector.startsWith('#')) {
                        const id = selector.substring(1);
                        // Check ID lookup table first (faster)
                        if (this._elementsById && this._elementsById[id]) {
                            return this._elementsById[id];
                        }
                        // Fallback to recursive search if not in table
                        if (this._children) {
                            for (let child of this._children) {
                                if (child.id === id) {
                                    return child;
                                }
                                // Recursively search in child elements
                                if (child.querySelector) {
                                    const found = child.querySelector(selector);
                                    if (found) return found;
                                }
                            }
                        }
                        return null;
                    }
                    // Handle tag selectors
                    if (this._childrenByTag && this._childrenByTag.has(selector)) {
                        const children = this._childrenByTag.get(selector);
                        return children.length > 0 ? children[0] : null;
                    }
                    return null; 
                },
                querySelectorAll: function(selector) { 
                    let results = [];
                    
                    // Handle ID selectors
                    if (selector.startsWith('#')) {
                        const id = selector.substring(1);
                        if (this._children) {
                            for (let child of this._children) {
                                if (child.id === id) {
                                    results.push(child);
                                }
                                // Recursively search in child elements
                                if (child.querySelectorAll) {
                                    const childResults = child.querySelectorAll(selector);
                                    results = results.concat(Array.from(childResults));
                                }
                            }
                        }
                        return results;
                    }
                    
                    // Handle tag selectors - search recursively
                    if (this._childrenByTag && this._childrenByTag.has(selector)) {
                        results = results.concat(this._childrenByTag.get(selector) || []);
                    }
                    
                    // Also search recursively in all children for tag selectors
                    if (this._children) {
                        for (let child of this._children) {
                            if (child.querySelectorAll) {
                                const childResults = child.querySelectorAll(selector);
                                results = results.concat(Array.from(childResults));
                            }
                        }
                    }
                    
                    return results; 
                },
                
                // Add removeChild method
                removeChild: function(child) {
                    if (!this._children) return null;
                    const index = this._children.indexOf(child);
                    if (index > -1) {
                        this._children.splice(index, 1);
                        child.parentNode = null;
                    }
                    // Remove from tagName lookup
                    if (child && child.tagName && this._childrenByTag) {
                        const tagName = child.tagName.toLowerCase();
                        const children = this._childrenByTag.get(tagName);
                        if (children) {
                            const tagIndex = children.indexOf(child);
                            if (tagIndex > -1) {
                                children.splice(tagIndex, 1);
                            }
                        }
                        // Also remove from original case if different
                        const originalTagName = child.tagName === 'ANIMATETRANSFORM' ? 'animateTransform' : tagName;
                        if (originalTagName !== tagName) {
                            const originalChildren = this._childrenByTag.get(originalTagName);
                            if (originalChildren) {
                                const originalIndex = originalChildren.indexOf(child);
                                if (originalIndex > -1) {
                                    originalChildren.splice(originalIndex, 1);
                                }
                            }
                        }
                    }
                    // Remove from ID lookup
                    if (child && child.id && this._elementsById) {
                        delete this._elementsById[child.id];
                    }
                    return child;
                },
                
                addEventListener: function() {},
                removeEventListener: function() {},
                dispatchEvent: function() { return true; }
            };
            return element;
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