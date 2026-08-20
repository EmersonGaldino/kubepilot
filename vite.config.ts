import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'

const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8')) as { version: string }

export default defineConfig({
  // Bakes the app version into the renderer bundle at build time so the
  // About dialog can show it without an IPC round-trip — see
  // `src/types/global.d.ts` for the ambient declaration.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    tailwindcss(),
    electron({
      main: {
        // Electron main process entry. `@kubernetes/client-node` is bundled
        // straight into main.js (rather than externalized) so the packaged
        // app is self-contained and doesn't depend on electron-builder's
        // node_modules resolution for a fairly large, deep dependency tree.
        // `electron` and Node builtins are externalized automatically by
        // this plugin regardless.
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            minify: false,
            sourcemap: true,
          },
        },
      },
      preload: {
        // Preload script, built separately from main so it can be reloaded
        // independently and stays as small/auditable as possible.
        input: 'electron/preload.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            minify: false,
            sourcemap: true,
          },
        },
      },
      // No `renderer` entry on purpose: the renderer never gets Node/Electron
      // APIs injected. It only talks to main through the contextBridge
      // surface exposed by preload.
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    include: ['monaco-editor', 'monaco-yaml'],
  },
})
