# KubePilot

A fast, modern desktop manager for multiple Kubernetes clusters — Azure AKS, Google GKE, and local clusters (Minikube, Rancher Desktop, kind…), all treated as plain Kubernetes API servers. Built with Electron, React, TypeScript, and `@kubernetes/client-node`, reading directly from your existing `~/.kube/config`.

This is a desktop **kubectl map**: contexts, workloads, cluster mesh (nodes, namespaces, Ingress, HPA, PV/PVC), YAML apply, logs, and port-forward. No mocked data — every screen is backed by a real call through `@kubernetes/client-node` against whatever cluster is active in your kubeconfig.

> **Just want to use the app?** Jump to [Download & install](#download--install). Everything below "Running from source" is for people building/hacking on KubePilot itself.

---

## Download & install

Pick your platform below — each link always resolves to the latest published build, so it never goes stale:

| Platform | Download |
|---|---|
| 🍎 macOS — Apple Silicon (M1/M2/M3/M4) | **[KubePilot-mac-arm64.dmg](https://github.com/EmersonGaldino/kubepilot/releases/latest/download/KubePilot-mac-arm64.dmg)** |
| 🍎 macOS — Intel | **[KubePilot-mac-x64.dmg](https://github.com/EmersonGaldino/kubepilot/releases/latest/download/KubePilot-mac-x64.dmg)** |
| 🪟 Windows — 64-bit | **[KubePilot-win-x64.exe](https://github.com/EmersonGaldino/kubepilot/releases/latest/download/KubePilot-win-x64.exe)** |
| 🐧 Linux — x64 (AppImage) | **[KubePilot-linux-x86_64.AppImage](https://github.com/EmersonGaldino/kubepilot/releases/latest/download/KubePilot-linux-x86_64.AppImage)** |
| 🐧 Linux — arm64 (AppImage) | **[KubePilot-linux-arm64.AppImage](https://github.com/EmersonGaldino/kubepilot/releases/latest/download/KubePilot-linux-arm64.AppImage)** |
| 🐧 Linux — x64 (.deb) | **[KubePilot-linux-amd64.deb](https://github.com/EmersonGaldino/kubepilot/releases/latest/download/KubePilot-linux-amd64.deb)** |
| 🐧 Linux — arm64 (.deb) | **[KubePilot-linux-arm64.deb](https://github.com/EmersonGaldino/kubepilot/releases/latest/download/KubePilot-linux-arm64.deb)** |

Not sure which one you need, or want to see release notes / checksums first? Browse the **[Releases page](https://github.com/EmersonGaldino/kubepilot/releases/latest)** instead.

> These links only work once at least one `v*` tag has been pushed and its CI run has finished publishing (see [CI: multi-platform builds & releases](#ci-multi-platform-builds--releases)) — until then, `/releases/latest` has nothing to redirect to.
>
> The Linux filenames' arch suffix looks inconsistent (`x86_64` for the AppImage, `amd64` for the `.deb`) because each packaging format uses its own platform convention — that's not a typo, both mean the same 64-bit x86 architecture.

KubePilot is a **menu-bar-first** app: after opening it once, it lives in your system tray/menu bar. Closing the window doesn't quit it — use the tray menu's **Quit** (or right-click the dock/taskbar icon).

### macOS

1. Open the `.dmg` and drag **KubePilot** into `Applications`.
2. The app isn't signed with an Apple Developer ID yet, so the first launch is blocked by Gatekeeper ("KubePilot can't be opened because it is from an unidentified developer"). To open it:
   - **Right-click (or Control-click) the app → Open** → confirm "Open" in the dialog, **or**
   - Run once in Terminal: `xattr -cr /Applications/KubePilot.app`
3. Look for the KubePilot icon in the menu bar (top-right, near the clock).

### Windows

1. Run `KubePilot Setup <version>.exe`.
2. Because the installer isn't code-signed yet, Windows SmartScreen may show "Windows protected your PC". Click **More info → Run anyway**.
3. The installer lets you choose the install directory and adds Desktop/Start Menu shortcuts. KubePilot appears in the system tray after launch.

### Linux

- **AppImage** (no install needed):
  ```bash
  chmod +x KubePilot-<version>-x64.AppImage
  ./KubePilot-<version>-x64.AppImage
  ```
- **Debian/Ubuntu** (`.deb`):
  ```bash
  sudo apt install ./KubePilot-<version>-x64.deb
  ```
- Tray icon support depends on your desktop environment having a system-tray/AppIndicator extension installed (most GNOME setups need one, e.g. "AppIndicator and KStatusNotifierItem Support").

### Requirements

- A working kubeconfig at `~/.kube/config` (or wherever `$KUBECONFIG` points) — KubePilot reads it directly, the same way `kubectl` does. Anything `kubectl config get-contexts` lists shows up in KubePilot's cluster switcher.
- For clusters that authenticate via an `exec` plugin in your kubeconfig (AKS → `kubelogin`, GKE → `gke-gcloud-auth-plugin`, EKS → `aws`/`aws-iam-authenticator`), that CLI must be installed and on your `PATH`. KubePilot restores your login shell's `PATH` on launch, so if the plugin works in a terminal it should work in the app too.
- KubePilot never writes to your kubeconfig — switching clusters inside the app is purely in-memory and never runs `kubectl config use-context` for you.

### Updating

KubePilot checks for new releases automatically (on launch and every few hours) and shows a toast in the bottom-right corner when one is available. Updates are never installed silently: you choose **Download**, then **Restart & install** when you're ready. You can also always grab a newer installer manually from the [Releases page](https://github.com/EmersonGaldino/kubepilot/releases/latest).

### Troubleshooting

- **"No contexts found" / empty cluster list** — check `kubectl config get-contexts` in a terminal; if that's empty too, it's a kubeconfig problem, not a KubePilot one.
- **A cluster shows as disconnected/error but `kubectl` works fine** — usually a missing `PATH` for an `exec`-auth CLI (see Requirements above), or the current Google/Azure CLI login has expired (`az login` / `gcloud auth login`, then use the app's **Refresh**).
- **Permission-looking errors on a specific resource type** — you're likely missing an RBAC/IAM verb for that resource; other screens keep working, since each list call is independent.
- **macOS: "app is damaged and can't be opened"** — Gatekeeper quarantine flag; run `xattr -cr /Applications/KubePilot.app` and reopen.

---

## What's implemented

- **Menu bar app**: a Tray icon (🟢/🟡/⚪️/🔴 reflects connection status) with a native menu — connection status, active cluster, namespace/pod counts, a "Change Cluster" submenu, Refresh (reloads the current view), Settings, and Quit.
- **kubeconfig integration**: reads contexts via `KubeConfig.loadFromDefault()` (respects `$KUBECONFIG`), lists them in the sidebar, and switches the active context in-memory — it never writes to your kubeconfig file. Switching context invalidates resource stores so the UI never shows the previous cluster's objects.
- **Dashboard**: cluster name/provider/version/API server, node & namespace counts (links to `/nodes` and `/namespaces`), pod totals, pods-per-namespace, and a "pods with problems" list.
- **Cluster mesh**: Nodes (Ready, roles, allocatable, cordon/uncordon), Namespaces (create/delete), Ingress, HPA (degrades when metrics are missing), PVC / PV / StorageClass.
- **Workloads**: Pods, Deployments, StatefulSets, DaemonSets, ReplicaSets, Jobs, CronJobs — list + drawer, describe/apply YAML, delete; scale/restart where it applies.
- **Config & network**: Services (with port-forward), ConfigMaps, Secrets (masked in the table/drawer; YAML apply can reveal values), Events (All/Warning/Normal).
- **YAML apply**: Describe opens a Monaco editor (autocomplete, validation, Format). Apply (optional dry-run) and **New YAML** on every resource page. Any describable kind can be created/edited without a custom form.
- **Command palette (⌘K)**: live search across every resource type, deep-links straight to the matching drawer.
- **Logs**: one-shot fetch and streaming (follow), container picker, tail, timestamps, download.
- **Port-forward**: pod or Service → `127.0.0.1` from the detail drawer.
- **Exec**: line-based `/bin/sh` (not a full PTY/xterm session).
- **Auto-update**: silent background check, user-confirmed download/install (see [Updating](#updating)).
- **Security**: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, narrow `contextBridge`, CSP. Forbidden list calls surface as a permission error, not a fake empty cluster.

## Project structure

```text
kubepilot/
├── electron/                    # Main process — never imported by the renderer
│   ├── main.ts                  # App lifecycle, single-instance lock, window/tray wiring
│   ├── preload.ts               # contextBridge surface — the renderer's only door out
│   ├── window.ts                # BrowserWindow creation (hidden-not-destroyed on close)
│   ├── ipc/                     # ipcMain.handle() wiring, one file per domain
│   │   └── ipcResult.ts         #   toIpcResult() envelope + input assertions
│   ├── services/
│   │   ├── kubeconfig/KubeconfigService.ts       # reads + watches ~/.kube/config
│   │   ├── kubernetes/KubernetesClientFactory.ts # memoized client-node clients per context
│   │   ├── clusters/ClusterService.ts            # owns the active context, cluster info, RBAC-safe
│   │   ├── update/UpdateService.ts               # electron-updater wrapper (check/download/install)
│   │   └── .../                                  # one service per resource kind
│   ├── tray/index.ts            # Tray icon, native menu, status glyph
│   └── utils/k8s-format.ts      # pure formatting/classification helpers (unit-tested)
│
├── shared/                      # Zero-runtime-dependency types shared by main ⇄ renderer
│   ├── types.ts                 # Domain types (ClusterInfo, PodSummary, …)
│   └── ipc-contract.ts          # IPC channel names + the KubepilotApi interface
│
├── src/                         # Renderer — React, sandboxed, no Node/Electron access
│   ├── components/{common,layout,pods,logs,...}/
│   ├── pages/                   # One page per resource kind
│   ├── hooks/                   # useKubepilotBootstrap, useTrayNavigation, useAppUpdate, ...
│   ├── stores/                  # Zustand, one store per resource kind
│   ├── services/kubernetesApi.ts  # thin wrapper unwrapping the IpcResult envelope
│   ├── types/                   # global.d.ts (window.kubepilot), ui.ts
│   ├── router.tsx               # HashRouter (safe under file:// in production)
│   ├── App.tsx / main.tsx
│   └── index.css                # Tailwind v4 entry + theme tokens
│
├── build/                       # electron-builder resources: app icons, tray template PNGs
├── scripts/generate-icons.py    # Procedurally generates the app icon + tray icons (Pillow)
├── .github/workflows/build.yml  # CI: builds mac/win/linux on every push, publishes on v* tags
├── electron-builder.yml
├── vite.config.ts               # vite-plugin-electron wiring (main/preload/renderer)
├── vitest.config.ts             # separate from vite.config.ts on purpose (see below)
├── tsconfig.json / tsconfig.node.json
└── eslint.config.mjs
```

## Running from source

```bash
npm install

npm run dev       # Vite dev server + Electron, hot reload on main/preload/renderer
npm run lint       # ESLint (flat config)
npm run test       # Vitest — pure-logic unit tests (k8s-format, LineBuffer)
npm run build      # Typecheck (renderer + main) then production Vite build
npm run start       # Build, then launch the packaged app locally (no installer)
npm run package    # Bump patch version, build, then electron-builder → installer in release/
```

`npm run dev` opens the main window immediately and creates the Tray icon; the app expects a working kubeconfig at `~/.kube/config` (or `$KUBECONFIG`). Whatever `kubectl config get-contexts` shows is exactly what appears in the sidebar's Clusters section.

### Building installers locally

```bash
npm run package          # current OS/arch only
npm run package:minor    # same, but bumps the minor version
npm run package:major    # same, but bumps the major version
```

`electron-builder` cross-compiling from a single machine is unreliable for signed-looking installers (NSIS needs Wine on non-Windows hosts, etc.), so local `package` scripts only produce an installer for the OS you're running them on. To get all three platforms at once, use CI (below) instead of trying to cross-build locally.

The app icon is `build/icon.icns` / `build/icon.png` and the Tray icon is `build/trayTemplate*.png` — generated by `python3 scripts/generate-icons.py` (requires Pillow: `pip3 install pillow`) followed by `iconutil -c icns build/icon.iconset -o build/icon.icns`. They're committed to the repo, so you don't need to regenerate them to build.

The macOS build is currently **unsigned** (no Apple Developer ID configured, `identity: null`, `hardenedRuntime: false`) — hence the Gatekeeper workaround in [Download & install](#macos). Windows/Linux builds are likewise unsigned. This is safe to change later without restructuring: add a signing identity/certificate and flip `hardenedRuntime`/notarization on in `electron-builder.yml`.

### CI: multi-platform builds & releases

`.github/workflows/build.yml` runs on every push (`macos-latest`, `windows-latest`, `ubuntu-latest` in parallel) and uploads each platform's installer as a workflow artifact — useful for testing a branch without a full release.

To actually ship a version to users (and to the auto-updater, which polls GitHub Releases):

```bash
npm version <patch|minor|major> -m "Release v%s"
git push && git push --tags
```

Pushing a `v*` tag makes the same workflow additionally publish the built installers to a GitHub Release matching that tag — that release is what `UpdateService`/`electron-updater` finds when checking for updates, and what the [Releases page](https://github.com/EmersonGaldino/kubepilot/releases/latest) shows to end users.

## Dependencies

**Runtime**: `react`, `react-dom`, `react-router-dom` (v7, `createHashRouter`), `zustand`, `@kubernetes/client-node` (v2 — object-param API, e.g. `coreV1Api.listNamespacedPod({ namespace })`), `electron-updater`, `fix-path` (restores the login-shell `PATH` for GUI-launched apps), `@monaco-editor/react` + `monaco-yaml` (YAML editing), `js-yaml`, `lucide-react`, `clsx`.

**Tooling**: `electron`, `electron-builder`, `vite` + `vite-plugin-electron` (main/preload build + hot restart), `@vitejs/plugin-react`, `@tailwindcss/vite` (Tailwind v4 — no `tailwind.config.js`/PostCSS needed), `typescript` (strict mode, `noUncheckedIndexedAccess`), `eslint` (flat config, `typescript-eslint`, `eslint-plugin-react-hooks`), `vitest`.

## Architectural decisions

- **`electron/` vs `src/` boundary is real, not just folders.** The renderer only ever imports from `src/` and `shared/` (types only). Every Kubernetes call goes `React component → Zustand store/hook → src/services/kubernetesApi.ts → window.kubepilot (preload) → ipcMain handler → electron/services/*`. No component ever touches `@kubernetes/client-node` or Node built-ins.
- **`shared/ipc-contract.ts` is the single source of truth** for channel names and the `KubepilotApi` shape — `electron/preload.ts` implements it, `src/types/global.d.ts` declares it as `window.kubepilot`. Both sides fail to compile if they drift.
- **Every IPC call resolves to `{ ok, data } | { ok: false, error }`** (`toIpcResult`) instead of letting exceptions cross the process boundary — the renderer always has something to render (data or an `ErrorState`), never an unhandled rejection.
- **Switching clusters never writes to `~/.kube/config`.** `ClusterService` holds the "active context" purely in memory. A file watcher on the kubeconfig detects external changes (`kubectl config use-context …`) and *follows* them only if the user hasn't manually picked a different context inside KubePilot in the meantime — so KubePilot never fights you, in either direction.
- **RBAC/IAM-scoped users degrade gracefully, not into a false "disconnected".** This was found and fixed during live validation against a real GKE cluster where the account can reach the API server but lacks `list nodes`/`list namespaces` IAM permissions: `ClusterInfo.nodeCount`/`namespaceCount` are `number | null` — `null` means "couldn't be determined" (distinct from a genuine `0`), and `status: 'connected'` is decided by the version check alone, not by whether every secondary call succeeded. See [Validation notes](#validation-notes).
- **GUI launch restores the login-shell `PATH`.** Apps opened from Finder/Explorer/a `.desktop` file start with a minimal `PATH` from the OS launcher, not your shell's — invisible for plain HTTPS calls to the API server, but fatal for kubeconfig `exec`-auth plugins (`kubelogin`, `gke-gcloud-auth-plugin`, …) that `@kubernetes/client-node` spawns by bare command name. `fix-path` runs first thing in `electron/main.ts` to fix this before any service initializes.
- **Update checks are silent; installing never is.** `UpdateService` wraps `electron-updater` with `autoDownload`/`autoInstallOnAppQuit` both off — checking for a new release happens automatically in the background, but downloading and restarting-to-install are both actions the user explicitly clicks in the toast, never something that happens mid-session on its own.
- **`@kubernetes/client-node` is bundled straight into `dist-electron/main.js`** rather than externalized, so the packaged app doesn't depend on `electron-builder`'s `node_modules` resolution for a fairly deep dependency tree (`ws`, `isomorphic-ws`, generated API clients, …). Costs ~575 KB gzipped; buys a self-contained artifact.
- **`HashRouter`** (via `createHashRouter`), not browser history routing — the production build is loaded from `file://`, where history-based deep links can't resolve on reload.
- **Tray uses a native `Menu`**, not a custom popover `BrowserWindow`. The mockup's rich status panel maps cleanly onto disabled label `MenuItem`s plus actionable ones (Open/Change Cluster/Refresh/Settings/Quit) — simpler and more native-feeling than a second window to manage.
- **The window hides instead of closing** (`hideInsteadOfClose`) so the Tray can reopen the exact same React state instantly; `app.isQuitting`-style state is tracked as a plain closure flag, not a hack on the `BrowserWindow` instance.

## Validation notes

The service layer was exercised directly (bypassing the UI) against a real kubeconfig with contexts for AKS, GKE, Minikube, and Rancher Desktop. This surfaced and fixed the RBAC-degradation bug described above; after the fix, the GKE cluster correctly reports `status: 'connected'` with a real Kubernetes version despite the account's Google Cloud IAM lacking `container.{nodes,namespaces,pods}.list`. Context switching, namespace/pod listing, pod detail, and log fetching were all subsequently verified end-to-end against a live AKS cluster. The packaged app was also booted standalone to confirm the Tray, window, and IPC wiring initialize without throwing, and separately to diagnose and fix a packaged-only AKS connection failure caused by the GUI-launch `PATH` issue described above.

`npm run test` currently covers the pure logic that's cheapest and most valuable to keep regression-tested (`classifyProvider`, `formatAge`, pod status helpers, log-line buffering across chunk boundaries) — it doesn't hit a live cluster, so it's safe in CI. The live-cluster checks above were exploratory and intentionally not committed as automated tests.

## Next steps

1. Code signing + notarization for macOS/Windows, so installers stop tripping Gatekeeper/SmartScreen.
2. PTY/xterm exec (today's `exec` is line-based, not a full terminal session), notifications, configurable auto-refresh.
3. Node drain, CRD discovery, NetworkPolicy / PDB dedicated pages (YAML apply covers them today).
4. Virtualize very large tables if a cluster routinely exceeds ~2k pods in one list.
