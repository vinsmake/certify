import { defineConfig } from 'tsup';

// Empaqueta el backend (incluido @certify/shared) en dist/index.js.
// Las dependencias de node_modules quedan externas.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node24',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  noExternal: ['@certify/shared'],
});
