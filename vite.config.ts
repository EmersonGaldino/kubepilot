import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import electron from 'vite-plugin-electron/simple'

const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8')) as { version: string }

// Loads `.env`/`.env.local` (gitignored) in addition to whatever's already
// in `process.env` — the latter is how the GitHub Actions release workflow
// supplies `OFFICIAL_BUILD_KEY` (a repo secret), the former is how a
// maintainer supplies the same value for `npm run dev`/`npm run build`
// locally. See the `OFFICIAL_BUILD_KEY` comment in `electron/main.ts`.
const env = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '')

// See `OFFICIAL_BUILD_KEY` in electron/main.ts. Declared once and spread
// into the main entry's own `vite.config` below — vite-plugin-electron
// builds each entry as its own separate Vite instance, so the root-level
// `define` further down does NOT reach it; only this entry-specific one does.
const buildKeyDefine = {
  __BUILD_KEY__: JSON.stringify(env.OFFICIAL_BUILD_KEY ?? process.env.OFFICIAL_BUILD_KEY ?? ''),
}

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
          define: buildKeyDefine,
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
