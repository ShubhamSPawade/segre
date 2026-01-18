module.exports = {
    testEnvironment: 'node',
    verbose: true,
    testTimeout: 30000,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    coverageThreshold: {
        global: {
            branches: 95,
            functions: 70,
            lines: 90,
            statements: 90
        }
    },
    coveragePathIgnorePatterns: ['/node_modules/'],
    testPathIgnorePatterns: ['/node_modules/'],
    moduleFileExtensions: ['js', 'json'],
    collectCoverageFrom: [
        'src/**/*.js',
        'bin/**/*.js',
        '!src/**/*.test.js',
        '!**/node_modules/**',
        '!**/coverage/**'
    ]
};
