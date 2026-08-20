# KubePilot — checkpoint (19 ago 2026)

Documento de consulta para sessões futuras. Resume o produto, a arquitetura, o que já está no código e o sistema de UI/UX aplicado no renderer.

**Branch:** `main` (primeiro commit do repositório)  
**Versão:** `0.1.0`  
**Data:** 19 de agosto de 2026

---

## 1. O que é o produto

KubePilot é um gerenciador desktop de clusters Kubernetes (Electron + React + TypeScript). Lê `~/.kube/config` (ou `$KUBECONFIG`), trata AKS/GKE/EKS/local como API servers Kubernetes comuns e **nunca escreve** de volta no kubeconfig ao trocar de contexto.

Público: operador de cluster (densidade alta, dark-first, teclado, feedback rápido).

---

## 2. Stack e fronteiras

| Camada | Onde | Regra |
|---|---|---|
| Main process | `electron/` | Único lugar com Node, `@kubernetes/client-node`, filesystem |
| Preload | `electron/preload.ts` | `contextBridge` estreito; sem `ipcRenderer` cru no renderer |
| Contrato IPC | `shared/ipc-contract.ts` | Nomes de canal + `KubepilotApi`; `{ ok, data } \| { ok: false, error }` |
| Tipos de domínio | `shared/types.ts` | Tipos compartilhados + helpers puros (`isClusterScopedKind`) |
| Renderer | `src/` | React 19, Zustand, React Router (`HashRouter` por causa de `file://`) |
| UI | `src/index.css` + `src/components/` | Tailwind v4, Lucide, tokens semânticos |

Fluxo de uma chamada Kubernetes:

`componente → store/hook → src/services/kubernetesApi.ts → window.kubepilot → ipcMain → electron/services/*`

O renderer **não** importa `@kubernetes/client-node` nem APIs de Node.

---

## 3. O que já está implementado (produto)

### Shell da app

- Janela Electron com traffic lights do macOS na faixa de drag (`electron/window.ts` + `.drag-region` / `.no-drag`).
- Fecha esconde a janela (Tray reabre o mesmo estado).
- Tray nativo com status 🟢/🟡/⚪️/🔴, cluster ativo, Change Cluster, Refresh, Settings, Quit.
- Splash (~2,8s mínimo) com cubos 3D em CSS (`src/components/splash/SplashScreen.tsx`).
- About (ícone na title bar) e Settings (drawer, não rota).

### Clusters e namespace

- Lista de contexts do kubeconfig na sidebar; favoritos e alias (prefs locais).
- Troca de contexto **em memória**; watcher no kubeconfig segue mudanças externas só se o usuário não tiver escolhido outro context no app.
- `ClusterInfo.status: 'connected'` vem do version check. `nodeCount` / `namespaceCount` podem ser `null` (RBAC/IAM sem `list`) — isso **não** é “disconnected”.
- Namespace global no topbar (`NamespaceCombobox`); telas namespaced reagem sozinhas.

### Recursos (listas + drawer de detalhe)

Rotas em `src/router.tsx`:

| Rota | Recurso | Notas |
|---|---|---|
| `/` | Dashboard | Hero do cluster; cards Nodes/Namespaces são links |
| `/nodes` | Nodes | Ready, roles, kubelet, allocatable; drawer: conditions/taints/pods; Cordon |
| `/namespaces` | Namespaces | Página de gestão (além do combobox); create/delete |
| `/pods` | Pods | Logs, exec (linha a linha, não PTY), port-forward, describe/apply, delete |
| `/deployments` | Deployments | Scale, restart, logs do seletor, describe/apply, delete |
| `/statefulsets` `/daemonsets` `/replicasets` | Controllers | Mesmo `WorkloadStatus` |
| `/jobs` `/cronjobs` | Jobs | Status próprio no Job; CronJob tem schedule/suspended |
| `/services` `/ingresses` `/hpa` | Rede / escala | HPA não inventa CPU se métricas falharem (`null` + “Metrics unavailable”) |
| `/pvcs` `/pvs` `/storageclasses` | Storage | Delete de PVC com aviso de perda de dados |
| `/configmaps` `/secrets` `/events` | Config / feed | Events list-only. Secrets mascarados; YAML apply revela |
| `/logs` | Logs | Fetch + stream; follow; filtro de nível |

Ações destrutivas passam por `ConfirmDialog`. YAML via `DescribeModal` (Monaco + monaco-yaml: IntelliSense, validação e Format; Apply + dry-run). **New YAML** nas `ResourcePage`. Troca de context zera stores (`resetAllResourceStores`); Refresh/tray recarregam a rota atual (`refreshCurrentView`). Forbidden vira mensagem de RBAC no `ErrorState`.

### Segurança (já no app)

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- CSP em `index.html` (sem fontes de CDN — Inter cai no stack do sistema)
- Links externos pelo browser do OS

### Testes

`npm test` (Vitest): lógica pura — `k8s-format`, parser de log, `LineBuffer`. Não bate em cluster live.

---

## 4. UI/UX aplicado (19 ago 2026)

Passada de design no **renderer inteiro**, sem mudar o contrato IPC nem os services.

### Diagnóstico que motivou a passada

- Contraste baixo (`zinc-600` em fundo `#0d1117`).
- Tokens misturados (`var(--color-surface-*)` + `zinc-*`).
- Páginas de recurso duplicadas, sem busca.
- Tabelas sem header sticky nem teclado.
- Drawers sem Escape; ações da sidebar só no hover.
- Dashboard informativo mas não navegável.
- Settings parecia tela vazia.

### Direção

Console de operações: dark, denso, Soft UI (profundidade sutil), um CTA primário por superfície, Lucide (não emoji), motion 150–220ms, `prefers-reduced-motion`.

### Tokens (`src/index.css` `@theme`)

| Token | Uso |
|---|---|
| `--color-surface-0/1/2/3` | Fundo app / sidebar / cards / hover |
| `--color-border-subtle` / `--color-border-strong` | Divisores |
| `--color-accent` `#3b82f6` | Ação primária, nav ativa, barras |
| `--color-success` / `--color-warning` / `--color-danger` | Status |
| `--color-fg` / `--color-fg-muted` / `--color-fg-subtle` | Texto (muted ≥ contraste AA em dark) |

Classes de layout: `.kp-table`, `.kp-table-wrap`, `.kp-row`, `.kp-scrim`, `.kp-drawer`, `.kp-card`, `.kp-chip`, `.kp-control`.  
Utilitários Tailwind: `bg-surface-0`, `text-fg`, `text-fg-muted`, `border-border-subtle`, `shadow-panel`.

Focus visível global (`:focus-visible`). `button` tem `cursor: pointer`.

### Primitivos novos (reusar, não reinventar)

| Arquivo | Função |
|---|---|
| `src/components/ui/Button.tsx` | `primary` / `secondary` / `ghost` / `danger` |
| `src/components/ui/IconButton.tsx` | Ícone com `aria-label` obrigatório |
| `src/components/ui/SearchInput.tsx` | Busca com clear |
| `src/components/ui/Drawer.tsx` | Shell de detalhe: overlay, Escape, `role="dialog"` |
| `src/components/common/ResourcePage.tsx` | Header + busca + empty/error/skeleton + tabela |
| `src/components/common/SelectableRow.tsx` | Linha de tabela clicável e teclado (Enter/Espaço) |
| `src/hooks/useEscapeKey.ts` | Escape; diálogos aninhados usam `capture: true` para não fechar o drawer por baixo |

### Comportamentos de UX que devem se manter

1. **Listas** usam `ResourcePage` + `getSearchText` estável (função no módulo, não inline).
2. **Tabelas** usam `className="kp-table"` e `SelectableRow` (Events é só leitura, sem row select).
3. **Drawers** usam `<Drawer title onClose>`. Confirmação/Describe/Exec/About fecham no Escape **antes** do drawer.
4. **Dashboard:** cards Pods / Nodes / Namespaces / Deployments / Services são links. Pod com problema navega para `/logs` com `LogsPageTarget`.
5. **Sidebar:** busca de clusters só aparece com **mais de 4** contexts. Rename/favorito visíveis em `:hover` **e** `:focus-within`.
6. **Events:** chips All / Warning / Normal no toolbar do `ResourcePage`.
7. **Main** é `overflow-hidden`; quem rola é a página (`Dashboard` / `Logs`) ou `.kp-table-wrap`. Coluna central precisa de `min-h-0`.

### O que esta passada **não** fez (de propósito)

- Light mode (app é dark-first; CSP não carrega Google Fonts).
- Command palette (⌘K) — Phase 4.
- Auto-refresh configurável e notificações nativas — ainda “coming next” no Settings.
- Extrair o footer de ações dos drawers para o slot `footer` do `Drawer` (ações continuam no corpo).
- Virtualização de tabelas grandes.
- Testes visuais / screenshot.

---

## 5. Mapa rápido para o próximo agente

```
src/index.css                          ← tokens + .kp-*
src/components/ui/                     ← Button, IconButton, SearchInput, Drawer
src/components/common/ResourcePage.tsx ← chrome de toda lista
src/components/layout/{AppLayout,Sidebar,Topbar,ClusterCard,SettingsDrawer}
src/pages/*                            ← uma página por recurso; padrão ResourcePage
src/components/{pods,deployments,…}    ← Table + DetailsDrawer
electron/services/*                    ← Kubernetes real
shared/{types,ipc-contract}.ts         ← contrato
```

Ao mudar UI: preferir tokens e primitivos acima. Não voltar `text-zinc-600` em fundo escuro. Não copiar o chrome de lista na mão — estender `ResourcePage`.

---

## 6. Como rodar

```bash
npm install
npm run dev      # Vite + Electron
npm run lint
npm run test
npm run build
npm run package  # .dmg em release/ (unsigned)
```

Exige kubeconfig válido. O que `kubectl config get-contexts` lista é o que a sidebar mostra.

---

## 7. Próximos passos de produto

1. Settings reais (intervalos, atalhos).
2. Command palette (⌘K), PTY/xterm, notificações, auto-refresh.
3. Drain de node, CRDs genéricos, NetworkPolicy/PDB dedicados (hoje via YAML apply).
4. Code signing / notarization.
5. Virtualizar tabelas grandes se um list passar de ~2k linhas.
