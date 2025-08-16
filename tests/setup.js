// Test setup file
const dotenv = require('dotenv');

// Load environment variables for testing
dotenv.config({ path: '.env' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Global test timeout
// jest.setTimeout(10000); // Will be set in jest.config.js

// Mock console methods to reduce noise in tests
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: () => {},
    debug: () => {},
    info: () => {},
    warn: console.warn,
    error: console.error,
  };
}

// Setup global test utilities
global.testUtils = {
  // Add any global test utilities here
};