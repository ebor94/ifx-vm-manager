module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  // Setea variables de entorno ANTES de cargar cualquier módulo
  // (config/env.js valida en el require, así que esto es obligatorio).
  setupFiles: ['<rootDir>/tests/setup/env.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/db/migrate.js',
    '!src/db/seed.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000,
  verbose: true,
  clearMocks: true
}
