// Mock window object for browser environment
global.window = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    MessageEvent: MessageEvent
} as any;

// Mock console methods to avoid noise in test output
global.console = {
    ...console,
    debug: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
}; 