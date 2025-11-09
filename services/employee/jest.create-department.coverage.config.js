module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/application/use-cases/create-department.use-case.ts',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  coverageReporters: ['text', 'lcov', 'text-summary', 'html'],
  moduleNameMapper: {
    '^@graduate-project/shared-common$': '<rootDir>/../shared-common/src',
  },
};
