import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    globalSetup: ['test/global-setup.ts'],
    setupFiles: ['test/setup.ts'],
    // Los tests de integracion comparten la BD de pruebas: se ejecutan en serie
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
