/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+.tsx?$": ["ts-jest",{}],
  },
  collectCoverage: true, // Enable coverage collection
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    '!src/**/*.d.ts', 
    '!src/lib/dist/*', 
    '!src/tests/*',
    '!src/tests/dist/*',
  ],
  testPathIgnorePatterns: [
    'src/lib/dist/',      // Exclude the tests directory from test execution
    '<rootDir>/src/tests/dist/',
    '<rootDir>/dist/',    // Exclude compiled output from test execution
  ],
  globals: {
    "window": {}
  }
};