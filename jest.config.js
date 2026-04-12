module.exports = {
  collectCoverageFrom: [
    '<rootDir>/src/**/*.js',
  ],
  moduleFileExtensions: ['js', 'vue'],
  moduleNameMapper: {
    '[@]/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '/node_modules/',
  ],
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.vue$': '<rootDir>/jest-vue-transformer.js',
  },
  verbose: false,
};
