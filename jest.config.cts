module.exports = {
  displayName: 'brightdate',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.spec.json',
        useESM: true,
      },
    ],
  },
  testMatch: ['**/__tests__/**/*.ts', '**/*.spec.ts', '**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: './coverage',
  extensionsToTreatAsEsm: ['.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
