/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// La app se publica en https://danuve3.github.io/bunker/ → base '/bunker/'.
export default defineConfig({
  base: '/bunker/',
  plugins: [preact()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    sourcemap: false,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
