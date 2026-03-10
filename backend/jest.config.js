module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.js', '!src/server.js'],
  coverageReporters: ['lcov', 'text', 'text-summary'],
  testMatch: ['**/tests/**/*.test.js', '**/*.test.js']
};
