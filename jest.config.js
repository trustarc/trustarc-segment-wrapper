/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+.tsx?$": ["ts-jest",{}],
  },
  collectCoverage: true, // Enable coverage collection
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    '!src/**/*.d.ts', // Exclude .d.ts files
  ],
  globals: {
    "window": {}
  }
};