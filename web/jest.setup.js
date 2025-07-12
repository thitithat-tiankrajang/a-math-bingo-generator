// jest.setup.js
// Setup file for additional test configurations
global.console = {
    ...console,
    // Suppress console.log during tests but keep errors
    log: jest.fn(),
    warn: jest.fn(),
    error: console.error,
  };