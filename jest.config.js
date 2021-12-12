module.exports = {
  collectCoverageFrom: [
    '<rootDir>/src/**/*.js',
  ],
  moduleFileExtensions: ['js'],
  moduleNameMapper: {
    '[@]/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '/node_modules/',
  ],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  verbose: false,
};
