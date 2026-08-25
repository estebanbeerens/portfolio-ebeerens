module.exports = {
  displayName: 'api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  // `marked` ships ESM-only (no `require`-compatible build); let ts-jest transpile it too.
  transformIgnorePatterns: ['node_modules/(?!(marked)/)'],
  moduleFileExtensions: ['ts', 'js', 'html'],
  moduleNameMapper: {
    '^.*generated/prisma(/.*)?$': '<rootDir>/src/testing/prisma-client.stub.ts',
  },
  coverageDirectory: '../../coverage/apps/api',
};
