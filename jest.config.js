/** @type {import('jest').Config} */
export default {
  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Coverage settings
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/**',
    '!src/**/*.test.js',
    '!src/**/*.spec.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],

  // Module paths
  moduleDirectories: [
    'node_modules',
    'src'
  ],

  // Transform settings
  transform: {},
  globals: {
    'jest': {
      useESM: true
    }
  },

  // Test timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Error handling
  errorOnDeprecated: true,

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/logs/',
    '/uploads/',
    '/coverage/'
  ],

  // Watch ignore patterns
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/logs/',
    '/uploads/',
    '/coverage/'
  ],

  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1'
  },

  // Global setup and teardown
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',

  // Reporters
  reporters: ['default'],

  // Force exit
  forceExit: true,

  // Detect open handles
  detectOpenHandles: true,

  // Max workers
  maxWorkers: '50%',

  // Cache directory
  cacheDirectory: '<rootDir>/.jest-cache'
};