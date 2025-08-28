/**
 * Browser-based Testing Framework for Max-Pixels Game
 * Simple test framework designed for browser-based game testing
 */

export class TestFramework {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
        this.output = [];
    }

    /**
     * Register a test case
     * @param {string} name - Test name
     * @param {Function} testFunc - Test function (can be async)
     */
    test(name, testFunc) {
        this.tests.push({
            name,
            func: testFunc,
            type: 'test'
        });
    }

    /**
     * Register a test suite
     * @param {string} name - Suite name  
     * @param {Function} suiteFunc - Function containing multiple tests
     */
    describe(name, suiteFunc) {
        this.tests.push({
            name,
            func: suiteFunc,
            type: 'suite'
        });
    }

    /**
     * Assert that condition is true
     * @param {boolean} condition - Condition to test
     * @param {string} message - Error message if assertion fails
     */
    assert(condition, message = 'Assertion failed') {
        if (!condition) {
            throw new Error(message);
        }
    }

    /**
     * Assert that two values are equal
     * @param {*} actual - Actual value
     * @param {*} expected - Expected value
     * @param {string} message - Error message if assertion fails
     */
    assertEqual(actual, expected, message = `Expected ${expected}, got ${actual}`) {
        if (actual !== expected) {
            throw new Error(message);
        }
    }

    /**
     * Assert that value is approximately equal (useful for floating point)
     * @param {number} actual - Actual value
     * @param {number} expected - Expected value
     * @param {number} tolerance - Allowed difference
     * @param {string} message - Error message if assertion fails
     */
    assertApproxEqual(actual, expected, tolerance = 0.001, message) {
        const diff = Math.abs(actual - expected);
        if (diff > tolerance) {
            throw new Error(message || `Expected ${expected} ± ${tolerance}, got ${actual}`);
        }
    }

    /**
     * Assert that function throws an error
     * @param {Function} func - Function to test
     * @param {string} message - Error message if assertion fails
     */
    assertThrows(func, message = 'Expected function to throw') {
        try {
            func();
            throw new Error(message);
        } catch (error) {
            // Expected behavior
        }
    }

    /**
     * Wait for a condition to become true (useful for async game testing)
     * @param {Function} condition - Function that returns boolean
     * @param {number} timeout - Maximum time to wait in ms
     * @param {number} interval - Check interval in ms
     */
    async waitFor(condition, timeout = 5000, interval = 100) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            if (await condition()) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        
        throw new Error(`Timeout: condition not met within ${timeout}ms`);
    }

    /**
     * Performance benchmark utility for measuring operation speed
     * @param {string} testName - Name of the performance test
     * @param {Function} operation - Function to benchmark
     * @param {Object} options - Benchmark options
     * @returns {Object} Performance results
     */
    async benchmark(testName, operation, options = {}) {
        const {
            iterations = 1000,
            warmupIterations = 100,
            maxDuration = 5000,
            memoryTracking = false
        } = options;

        // Warmup phase to eliminate JIT compilation effects
        for (let i = 0; i < warmupIterations; i++) {
            if (typeof operation === 'function') {
                await operation();
            }
        }

        const results = {
            testName,
            iterations: 0,
            totalTime: 0,
            averageTime: 0,
            minTime: Infinity,
            maxTime: 0,
            operationsPerSecond: 0,
            memoryUsage: null
        };

        const startMemory = memoryTracking && performance.memory ? 
            performance.memory.usedJSHeapSize : null;
        
        const benchmarkStart = performance.now();
        let iterationCount = 0;

        // Run benchmark iterations
        for (let i = 0; i < iterations; i++) {
            const iterStart = performance.now();
            
            if (typeof operation === 'function') {
                await operation();
            }
            
            const iterEnd = performance.now();
            const iterDuration = iterEnd - iterStart;
            
            results.totalTime += iterDuration;
            results.minTime = Math.min(results.minTime, iterDuration);
            results.maxTime = Math.max(results.maxTime, iterDuration);
            iterationCount++;

            // Stop if max duration exceeded
            if (performance.now() - benchmarkStart > maxDuration) {
                break;
            }
        }

        results.iterations = iterationCount;
        results.averageTime = results.totalTime / iterationCount;
        results.operationsPerSecond = 1000 / results.averageTime;

        if (memoryTracking && performance.memory) {
            const endMemory = performance.memory.usedJSHeapSize;
            results.memoryUsage = {
                start: startMemory,
                end: endMemory,
                delta: endMemory - startMemory
            };
        }

        return results;
    }

    /**
     * Assert that operation completes within time threshold
     * @param {Function} operation - Operation to test
     * @param {number} maxTime - Maximum allowed time in ms
     * @param {string} message - Error message if assertion fails
     */
    async assertPerformance(operation, maxTime, message) {
        const startTime = performance.now();
        
        if (typeof operation === 'function') {
            await operation();
        }
        
        const duration = performance.now() - startTime;
        
        if (duration > maxTime) {
            throw new Error(message || 
                `Performance assertion failed: operation took ${duration.toFixed(2)}ms, expected < ${maxTime}ms`);
        }
        
        return duration;
    }

    /**
     * Memory usage snapshot utility
     * @returns {Object|null} Memory usage information
     */
    getMemorySnapshot() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                timestamp: Date.now()
            };
        }
        return null;
    }

    /**
     * Performance profiler for measuring multiple metrics
     * @param {Function} operation - Operation to profile
     * @returns {Object} Comprehensive performance metrics
     */
    async profileOperation(operation) {
        const profile = {
            startTime: performance.now(),
            startMemory: this.getMemorySnapshot()
        };

        // Measure operation
        if (typeof operation === 'function') {
            await operation();
        }

        profile.endTime = performance.now();
        profile.endMemory = this.getMemorySnapshot();
        profile.duration = profile.endTime - profile.startTime;
        
        if (profile.startMemory && profile.endMemory) {
            profile.memoryDelta = profile.endMemory.used - profile.startMemory.used;
        }

        return profile;
    }

    /**
     * Create a mock DOM element for testing
     * @param {string} tagName - Element tag name
     * @param {Object} attributes - Element attributes
     * @returns {HTMLElement} Created element
     */
    createElement(tagName, attributes = {}) {
        const element = document.createElement(tagName);
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'id') {
                element.id = value;
            } else {
                element.setAttribute(key, value);
            }
        });
        return element;
    }

    /**
     * Run all registered tests
     * @returns {Promise<Object>} Test results
     */
    async runTests() {
        console.log('🚀 Running Max-Pixels Tests...\n');
        this.results = { passed: 0, failed: 0, total: 0 };
        this.output = [];

        for (const testCase of this.tests) {
            if (testCase.type === 'suite') {
                await this.runTestSuite(testCase);
            } else {
                await this.runSingleTest(testCase);
            }
        }

        this.printResults();
        return this.results;
    }

    /**
     * Run a test suite
     */
    async runTestSuite(suite) {
        console.log(`\n📁 ${suite.name}`);
        
        // Create nested test framework for suite
        const suiteFramework = new TestFramework();
        
        // Execute suite function with suite framework context
        suite.func.call(suiteFramework);
        
        // Run suite tests
        for (const test of suiteFramework.tests) {
            await this.runSingleTest(test, true);
        }
    }

    /**
     * Run a single test
     */
    async runSingleTest(test, isNested = false) {
        const indent = isNested ? '  ' : '';
        
        try {
            this.results.total++;
            
            // Run test function
            await test.func.call(this);
            
            this.results.passed++;
            console.log(`${indent}✅ ${test.name}`);
            this.output.push(`PASS: ${test.name}`);
            
        } catch (error) {
            this.results.failed++;
            console.log(`${indent}❌ ${test.name}`);
            console.log(`${indent}   Error: ${error.message}`);
            this.output.push(`FAIL: ${test.name} - ${error.message}`);
        }
    }

    /**
     * Print final test results
     */
    printResults() {
        console.log('\n' + '='.repeat(50));
        console.log('🏁 Test Results:');
        console.log(`   Total: ${this.results.total}`);
        console.log(`   Passed: ${this.results.passed} ✅`);
        console.log(`   Failed: ${this.results.failed} ❌`);
        
        const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
        console.log(`   Success Rate: ${successRate}%`);
        
        if (this.results.failed === 0) {
            console.log('\n🎉 All tests passed!');
        } else {
            console.log('\n⚠️  Some tests failed. Check the output above.');
        }
        console.log('='.repeat(50));
    }

    /**
     * Create a test DOM environment
     */
    setupTestDOM() {
        // Create test container
        const testContainer = document.createElement('div');
        testContainer.id = 'test-container';
        testContainer.style.cssText = `
            position: absolute;
            top: -9999px;
            left: -9999px;
            width: 1920px;
            height: 1080px;
        `;
        
        // Add game canvas and UI container
        testContainer.innerHTML = `
            <svg id="gameCanvas" width="1920" height="1080"></svg>
            <div id="ui"></div>
        `;
        
        document.body.appendChild(testContainer);
        return testContainer;
    }

    /**
     * Clean up test DOM environment
     */
    cleanupTestDOM() {
        const testContainer = document.getElementById('test-container');
        if (testContainer) {
            document.body.removeChild(testContainer);
        }
    }
}

// Export singleton instance for easy use
export const TestRunner = new TestFramework();

// Global test functions for convenience
export const test = (name, func) => TestRunner.test(name, func);
export const describe = (name, func) => TestRunner.describe(name, func);
export const assert = (condition, message) => TestRunner.assert(condition, message);
export const assertEqual = (actual, expected, message) => TestRunner.assertEqual(actual, expected, message);
export const assertApproxEqual = (actual, expected, tolerance, message) => TestRunner.assertApproxEqual(actual, expected, tolerance, message);
export const assertThrows = (func, message) => TestRunner.assertThrows(func, message);
export const waitFor = (condition, timeout, interval) => TestRunner.waitFor(condition, timeout, interval);
export const benchmark = (name, operation, options) => TestRunner.benchmark(name, operation, options);
export const assertPerformance = (operation, maxTime, message) => TestRunner.assertPerformance(operation, maxTime, message);
export const profileOperation = (operation) => TestRunner.profileOperation(operation);