/**
 * Max-Pixels Test Suite Entry Point
 * Imports and registers all test suites
 */

// Import core test framework
import { TestRunner } from './TestFramework.js';

// Import all test suites
import './GameTests.js';
import './IntegrationTests.js';
import './PerformanceTests.js';

// Export the configured test runner
export { TestRunner };

console.log('Max-Pixels Test Suite Loaded ✅');
console.log(`Total test suites registered: ${TestRunner.tests.length}`);