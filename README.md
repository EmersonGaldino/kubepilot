# KubePilot

A fast, modern desktop manager for multiple Kubernetes clusters — Azure AKS, Google GKE, and local clusters (Minikube, Rancher Desktop, kind…), all treated as plain Kubernetes API servers. Built with Electron, React, TypeScript, and `@kubernetes/client-node`, reading directly from your existing `~/.kube/config`.

This is a desktop **kubectl map**: contexts, workloads, cluster mesh (nodes, namespaces, Ingress, HPA, PV/PVC), YAML apply, logs, and port-forward. No mocked data — every screen is backed by a real call through `@kubernetes/client-node` against whatever cluster is active in your kubeconfig.

**Checkpoint for later sessions:** see [docs/CHECKPOINT.md](docs/CHECKPOINT.md) (architecture, implemented surface, UI/UX tokens and rules).

## What's implemented

- **Menu bar app**: a Tray icon (🟢/🟡/⚪️/🔴 reflects connection status) with a native menu — connection status, active cluster, namespace/pod counts, a "Change Cluster" submenu, Refresh (reloads the current view), Settings, and Quit.
- **kubeconfig integration**: reads contexts via `KubeConfig.loadFromDefault()` (respects `$KUBECONFIG`), lists them in the sidebar, and switches the active context in-memory — it never writes to your kubeconfig file. Switching context invalidates resource stores so the UI never shows the previous cluster's objects.
- **Dashboard**: cluster name/provider/version/API server, node & namespace counts (links to `/nodes` and `/namespaces`), pod totals, pods-per-namespace, and a "pods with problems" list.
- **Cluster mesh**: Nodes (Ready, roles, allocatable, cordon/uncordon), Namespaces (create/delete), Ingress, HPA (degrades when metrics are missing), PVC / PV / StorageClass.
- **Workloads**: Pods, Deployments, StatefulSets, DaemonSets, ReplicaSets, Jobs, CronJobs — list + drawer, describe/apply YAML, delete; scale/restart where it applies.
- **Config & network**: Services (with port-forward), ConfigMaps, Secrets (masked in the table/drawer; YAML apply can reveal values), Events (All/Warning/Normal).
- **YAML apply**: Describe abre um editor Monaco (autocomplete, validação, Format). Apply (dry-run opcional) e **New YAML** nas páginas de recurso. Qualquer kind descritível pode ser criado/editado sem um formulário custom.
- **Logs**: one-shot fetch and streaming (follow), container picker, tail, timestamps, download.
- **Port-forward**: pod or Service → `127.0.0.1` from the detail drawer.
- **Exec**: line-based `/bin/sh` (not a full PTY/xterm session).
- **Security**: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, narrow `contextBridge`, CSP. Forbidden list calls surface as a permission error, not a fake empty cluster.

## Project structure

```text
kubepilot/
├── electron/                    # Main process — never imported by the renderer
│   ├── main.ts                  # App lifecycle, single-instance lock, window/tray wiring
│   ├── preload.ts               # contextBridge surface — the renderer's only door out
│   ├── window.ts                # BrowserWindow creation (hidden-not-destroyed on close)
│   ├── ipc/                     # ipcMain.handle() wiring, one file per domain
│   │   ├── ipcResult.ts         #   toIpcResult() envelope + input assertions
│   │   ├── kubeconfigHandlers.ts
│   │   ├── clusterHandlers.ts
│   │   ├── namespaceHandlers.ts
│   │   ├── podHandlers.ts
│   │   └── logsHandlers.ts
│   ├── services/
│   │   ├── kubeconfig/KubeconfigService.ts    # reads + watches ~/.kube/config
│   │   ├── kubernetes/KubernetesClientFactory.ts  # memoized client-node clients per context
│   │   ├── clusters/ClusterService.ts         # owns the active context, cluster info, RBAC-safe
│   │   ├── namespaces/NamespaceService.ts
│   │   ├── pods/PodService.ts
│   │   └── logs/LogsService.ts                # one-shot fetch + AbortController-backed streaming
│   ├── tray/index.ts            # Tray icon, native menu, status glyph
│   └── utils/k8s-format.ts      # pure formatting/classification helpers (unit-tested)
│
├── shared/                      # Zero-runtime-dependency types shared by main ⇄ renderer
│   ├── types.ts                 # Domain types (ClusterInfo, PodSummary, …)
│   └── ipc-contract.ts          # IPC channel names + the KubepilotApi interface
│
├── src/                         # Renderer — React, sandboxed, no Node/Electron access
│   ├── components/{common,layout,pods,logs}/
│   ├── pages/{Dashboard,Pods,Logs,Settings}.tsx
│   ├── hooks/                   # useKubepilotBootstrap, useTrayNavigation, useAllPods
│   ├── stores/                  # Zustand: useClusterStore, useNamespaceStore, usePodStore
│   ├── services/kubernetesApi.ts  # thin wrapper unwrapping the IpcResult envelope
│   ├── types/                   # global.d.ts (window.kubepilot), ui.ts
│   ├── router.tsx               # HashRouter (safe under file:// in production)
│   ├── App.tsx / main.tsx
│   └── index.css                # Tailwind v4 entry + theme tokens
│
├── build/                       # electron-builder resources: app icon, tray template PNGs
├── scripts/generate-icons.py    # Procedurally generates the app icon + tray icons (Pillow)
├── electron-builder.yml
├── vite.config.ts               # vite-plugin-electron wiring (main/preload/renderer)
├── vitest.config.ts             # separate from vite.config.ts on purpose (see below)
├── tsconfig.json / tsconfig.node.json
└── eslint.config.mjs
```

## Running it

```bash
npm install

npm run dev       # Vite dev server + Electron, hot reload on main/preload/renderer
npm run lint       # ESLint (flat config)
npm run test       # Vitest — pure-logic unit tests (k8s-format, LineBuffer)
npm run build      # Typecheck (renderer + main) then production Vite build
npm run start       # Build, then launch the packaged app locally (no installer)
npm run package    # Build, then electron-builder → .dmg in release/
```

`npm run dev` opens the main window immediately and creates the Tray icon; the app expects a working kubeconfig at `~/.kube/config` (or `$KUBECONFIG`). Whatever `kubectl config get-contexts` shows is exactly what appears in the sidebar's Clusters section.

### Building the `.dmg`

```bash
npm run package
```

This produces `release/KubePilot-<version>-<arch>.dmg` for both `arm64` (Apple Silicon) and `x64`, per `electron-builder.yml`. The app icon is `build/icon.icns` and the Tray icon is `build/trayTemplate*.png` — both generated by `python3 scripts/generate-icons.py` (requires Pillow: `pip3 install pillow`) followed by `iconutil -c icns build/icon.iconset -o build/icon.icns`. They're committed to the repo, so you don't need to regenerate them to build.

The build is currently **unsigned** (no Apple Developer ID configured) — `hardenedRuntime` is enabled in `electron-builder.yml` so notarization can be wired up later without restructuring.

## Dependencies

**Runtime**: `react`, `react-dom`, `react-router-dom` (v7, `createHashRouter`), `zustand`, `@kubernetes/client-node` (v2 — object-param API, e.g. `coreV1Api.listNamespacedPod({ namespace })`), `lucide-react`, `clsx`.

**Tooling**: `electron`, `electron-builder`, `vite` + `vite-plugin-electron` (main/preload build + hot restart), `@vitejs/plugin-react`, `@tailwindcss/vite` (Tailwind v4 — no `tailwind.config.js`/PostCSS needed), `typescript` (strict mode, `noUncheckedIndexedAccess`), `eslint` (flat config, `typescript-eslint`, `eslint-plugin-react-hooks`), `vitest`.

## Architectural decisions

- **`electron/` vs `src/` boundary is real, not just folders.** The renderer only ever imports from `src/` and `shared/` (types only). Every Kubernetes call goes `React component → Zustand store/hook → src/services/kubernetesApi.ts → window.kubepilot (preload) → ipcMain handler → electron/services/*`. No component ever touches `@kubernetes/client-node` or Node built-ins.
- **`shared/ipc-contract.ts` is the single source of truth** for channel names and the `KubepilotApi` shape — `electron/preload.ts` implements it, `src/types/global.d.ts` declares it as `window.kubepilot`. Both sides fail to compile if they drift.
- **Every IPC call resolves to `{ ok, data } | { ok: false, error }`** (`toIpcResult`) instead of letting exceptions cross the process boundary — the renderer always has something to render (data or an `ErrorState`), never an unhandled rejection.
- **Switching clusters never writes to `~/.kube/config`.** `ClusterService` holds the "active context" purely in memory. A file watcher on the kubeconfig detects external changes (`kubectl config use-context …`) and *follows* them only if the user hasn't manually picked a different context inside KubePilot in the meantime — so KubePilot never fights you, in either direction.
- **RBAC/IAM-scoped users degrade gracefully, not into a false "disconnected".** This was found and fixed during live validation against a real GKE cluster where the account can reach the API server but lacks `list nodes`/`list namespaces` IAM permissions: `ClusterInfo.nodeCount`/`namespaceCount` are `number | null` — `null` means "couldn't be determined" (distinct from a genuine `0`), and `status: 'connected'` is decided by the version check alone, not by whether every secondary call succeeded. See [Validation notes](#validation-notes).
- **`@kubernetes/client-node` is bundled straight into `dist-electron/main.js`** rather than externalized, so the packaged app doesn't depend on `electron-builder`'s `node_modules` resolution for a fairly deep dependency tree (`ws`, `isomorphic-ws`, generated API clients, …). Costs ~575 KB gzipped; buys a self-contained artifact.
- **`HashRouter`** (via `createHashRouter`), not browser history routing — the production build is loaded from `file://`, where history-based deep links can't resolve on reload.
- **Tray uses a native `Menu`**, not a custom popover `BrowserWindow`. The mockup's rich status panel maps cleanly onto disabled label `MenuItem`s plus actionable ones (Open/Change Cluster/Refresh/Settings/Quit) — simpler and more native-feeling than a second window to manage.
- **The window hides instead of closing** (`hideInsteadOfClose`) so the Tray can reopen the exact same React state instantly; `app.isQuitting`-style state is tracked as a plain closure flag, not a hack on the `BrowserWindow` instance.

## Validation notes

The service layer was exercised directly (bypassing the UI) against the real kubeconfig on this machine — five real contexts (`aks-priv-anchieta-prod`, `aks-priv-dev`, the active `gke_sistemas-leo-n_...` context, `minikube`, `rancher-desktop`). This surfaced and fixed the RBAC-degradation bug described above; after the fix, the GKE cluster correctly reports `status: 'connected'` with a real Kubernetes version despite the account's Google Cloud IAM lacking `container.{nodes,namespaces,pods}.list`. Context switching, namespace/pod listing, pod detail, and log fetching were all subsequently verified end-to-end against the `aks-priv-dev` cluster. The packaged app was also booted standalone to confirm the Tray, window, and IPC wiring initialize without throwing.

`npm run test` currently covers the pure logic that's cheapest and most valuable to keep regression-tested (`classifyProvider`, `formatAge`, pod status helpers, log-line buffering across chunk boundaries) — it doesn't hit a live cluster, so it's safe in CI. The live-cluster checks above were exploratory and intentionally not committed as automated tests.

## Next steps

1. Command palette (⌘K), PTY/xterm exec, notifications, configurable auto-refresh.
2. Node drain, CRD discovery, NetworkPolicy / PDB dedicated pages (YAML apply covers them today).
3. Code signing + notarization for distributable `.dmg`s.
4. Virtualize very large tables if a cluster routinely exceeds ~2k pods in one list.
