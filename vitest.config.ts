import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'

// Separate from vite.config.ts on purpose: the app's Vite config wires up
// vite-plugin-electron, which spawns an actual Electron process on build —
// not something the test runner should ever trigger.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['electron/**/*.test.ts', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
