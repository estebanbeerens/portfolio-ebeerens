module.exports = {
  displayName: 'api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  moduleNameMapper: {
    '^.*generated/prisma(/.*)?$': '<rootDir>/src/testing/prisma-client.stub.ts',
  },
  coverageDirectory: '../../coverage/apps/api',
};
