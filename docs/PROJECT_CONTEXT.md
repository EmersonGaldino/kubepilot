# KubePilot — contexto completo do projeto

> Documento de handoff para continuidade. Atualizado em 20 de agosto de 2026, com base no estado de trabalho atual da branch `main`.
>
> **Versão em `package.json`:** `2.0.3`  
> **Estado do workspace no momento desta atualização:** há mudanças locais ainda não commitadas. Consulte `git status` antes de começar uma nova tarefa.

---

## 1. Produto e proposta

KubePilot é um gerenciador desktop para múltiplos clusters Kubernetes. Ele usa o kubeconfig existente do usuário (`~/.kube/config` ou `$KUBECONFIG`) e trata AKS, GKE, EKS e clusters locais como servidores Kubernetes comuns.

O produto é pensado como um console operacional dark-first: operadores precisam navegar rapidamente entre contextos, investigar recursos, ler logs, aplicar YAML e executar ações sem sair da aplicação.

Princípios que devem permanecer:

- A troca de cluster é em memória; a aplicação **não escreve** `kubectl config use-context` no kubeconfig.
- O renderer não recebe Node.js, Electron nem o client Kubernetes diretamente.
- Recursos reais são carregados da API Kubernetes; não há dados simulados.
- Operações destrutivas pedem confirmação.
- Erros de RBAC são apresentados como permissões insuficientes, não como uma lista vazia.

---

## 2. Stack e arquitetura

| Camada | Diretório | Responsabilidade |
|---|---|---|
| Main process | `electron/` | Node.js, lifecycle do app, IPC, filesystem, client Kubernetes e serviços |
| Preload | `electron/preload.ts` | Superfície `contextBridge` estrita para o renderer |
| Contrato IPC | `shared/ipc-contract.ts` | Nomes dos canais e interface `KubepilotApi` |
| Tipos de domínio | `shared/types.ts` | Tipos compartilhados entre main e renderer |
| Renderer | `src/` | React 19, Zustand, React Router e UI |
| Estilo | `src/index.css` | Tailwind v4, tokens semânticos e classes `kp-*` |

Fluxo padrão de uma chamada:

```text
React component
  → Zustand store / hook
  → src/services/kubernetesApi.ts
  → window.kubepilot (preload)
  → ipcMain handler
  → electron/services/*
  → Kubernetes API
```

O resultado de IPC segue o envelope `{ ok: true, data } | { ok: false, error }`, que é desempacotado pelo wrapper do renderer.

---

## 3. Funcionalidades atuais

### Shell e operação

- App Electron menu-bar-first: fechar a janela a esconde; o tray a reabre.
- Instância única, splash screen, about dialog, settings drawer e command palette (`⌘K` / `Ctrl+K`).
- Correção de `PATH` para plugins de autenticação por `exec` no kubeconfig (AKS/GKE/EKS).
- Atualização automática somente por consentimento do usuário: checa, baixa e instala em etapas separadas.
- Empacotamento para macOS, Windows e Linux, com CI de release no GitHub Actions.

### Kubernetes

- Contextos e namespace global.
- Dashboard, Pods, Deployments, StatefulSets, DaemonSets, ReplicaSets, Jobs, CronJobs.
- Services, Ingresses, HPA, Events, ConfigMaps, Secrets.
- Nodes, Namespaces, PV, PVC e StorageClass.
- Describe/YAML (Monaco), dry-run e Apply.
- Scale, restart, delete, cordon/uncordon onde aplicável.
- Port-forward em `127.0.0.1` e exec de shell em linha (não é PTY/xterm completo).
- Logs de um pod/container e logs simultâneos de pods pertencentes a um workload.

---

## 4. Segurança e limites relevantes

- `contextIsolation: true`, `nodeIntegration: false` e `sandbox: true` em `electron/window.ts`.
- Preload expõe apenas métodos definidos no contrato IPC.
- CSP reforçada em `index.html`; sem conteúdo remoto embutido.
- Abertura externa está limitada a URLs `http:` e `https:`; navegação do conteúdo local para sites remotos é bloqueada.
- A aplicação não é assinada/notarizada atualmente. macOS, Windows e Linux podem exibir avisos de confiança na instalação.
- O repositório usa um gate de `OFFICIAL_BUILD_KEY`; o código pode compilar, mas builds sem a chave correta recusam iniciar como aplicativo oficial.

---

## 5. Convenções de UI

O visual é um console operacional dark-first, denso e calmo. Reutilize tokens e componentes existentes em vez de introduzir cores ou chrome localmente.

### Tokens e classes úteis

- Cores: `surface-0` a `surface-3`, `fg`, `fg-muted`, `fg-subtle`, `accent`, `success`, `warning`, `danger`.
- Classes compartilhadas: `.kp-card`, `.kp-hero`, `.kp-chip`, `.kp-control`, `.kp-table`, `.kp-table-wrap`, `.kp-row`, `.kp-drawer`, `.kp-scrim`.
- `Button`: variantes `primary`, `secondary`, `ghost`, `danger`.
- `IconButton`: exige `label` para acessibilidade.
- `ResourcePage`: chrome padrão de listagens, busca, loading, erro, empty state e criação via YAML.
- `Drawer`: padrão para detalhes de recursos.
- `SelectableRow`: seleção por clique, Enter e Espaço em tabelas.

### Acessibilidade

- `:focus-visible` é global.
- O hook `useFocusTrap` mantém Tab dentro de Command Palette, Describe e confirmações, restaurando o foco anterior ao fechar.
- Overlays devem fechar em Escape e usar papéis ARIA adequados (`dialog` ou `alertdialog`).
- Respeitar `prefers-reduced-motion` para animações.

---

## 6. Alterações feitas nesta sessão

As alterações abaixo estão no workspace e devem ser revisadas/commitadas como um conjunto coerente.

### 6.1 Confiabilidade, segurança e release

| Mudança | Arquivos principais | Motivo |
|---|---|---|
| Encerramento de port-forward | `electron/main.ts`, `PortForwardService.ts` | Ao sair, a aplicação chama `stopAll()`. Cada forward destrói conexões TCP locais antes de fechar o servidor para não travar em clientes ativos. |
| Apply seguro por padrão | `shared/types.ts`, `applyHandlers.ts`, `ApplyService.ts`, `DescribeModal.tsx` | Server-Side Apply não usa mais `force` por padrão. A tomada de ownership passa a ser opt-in explícito no modal. |
| Hardening de links/CSP | `electron/window.ts`, `electron/window-security.ts`, `index.html` | Links externos aceitam somente web URLs; CSP bloqueia base URL, objetos, frames e forms. |
| CI de qualidade | `.github/workflows/build.yml` | O workflow agora executa lint e testes antes de build/empacotamento. |
| Empacotamento previsível | `package.json`, `README.md` | `npm run package` não altera versão. Bumps explícitos são `package:patch`, `package:minor` e `package:major`. |

Testes criados:

- `electron/window-security.test.ts`
- `electron/ipc/applyHandlers.test.ts`
- `electron/services/portforward/PortForwardService.test.ts`

### 6.2 Evolução visual global

- `src/index.css`: cards com profundidade sutil, fundo com gradiente radial, seleção de texto, hero de dashboard e tokens preservados.
- `src/pages/Dashboard.tsx`: hero do cluster ganhou maior hierarquia, indicador “Cluster overview” e métricas em blocos.
- `src/components/ui/Button.tsx`: CTA primário tem contraste e feedback de hover mais claros.
- `src/components/common/ResourcePage.tsx`: contador virou chip, atualiza via `aria-live` e a ação New YAML ganhou ícone.
- `src/components/layout/Topbar.tsx`: topbar com backdrop blur.
- `src/hooks/useFocusTrap.ts`: novo utilitário de foco para overlays.
- `ConfirmDialog`, `DescribeModal` e `CommandPalette`: adotam o focus trap.

### 6.3 Redesign de Logs

O fluxo anterior começava em um `<select>` simples e o conteúdo se parecia com texto monocromático. O fluxo atual é:

1. Abrir Logs sem alvo carrega pods do namespace/cluster atual automaticamente.
2. O usuário vê `PodLogTargetPicker`, uma lista pesquisável por nome do pod, namespace ou node, com status e reinícios.
3. Ao selecionar um pod, o primeiro container é escolhido automaticamente; se houver mais de um, o seletor aparece na toolbar.
4. A toolbar mantém contexto de pod/namespace/container, botão **Change pod**, modo Follow, tail, timestamps, filtro de nível, busca, Clear e Download.
5. `LogViewer` organiza logs em colunas estáveis: timestamp, nível e mensagem. Propriedades JSON aparecem em chips abaixo da linha.
6. Logs possuem estilo inspirado no Serilog: informações discretas, warnings em âmbar, errors em vermelho e fatal com destaque forte no texto, trilho lateral e fundo.

Arquivos envolvidos:

- `src/pages/Logs.tsx`
- `src/components/logs/PodLogTargetPicker.tsx`
- `src/components/logs/LogViewer.tsx`
- `src/components/logs/DeploymentLogsView.tsx`
- `src/lib/logLineParser.ts`

Notas de implementação:

- `LogViewer` só aplica cores completas se o parser reconhecer o nível. Logs sem nível conhecido permanecem neutros, para não inventar semântica.
- O parser reconhece padrões Serilog e JSON, além de aliases como `INFO`, `WARNING`, `ERROR`, `FATAL` e seus códigos curtos.
- O viewer preserva auto-scroll enquanto o usuário está no fim; ao rolar para cima, exibe **Jump to bottom**.

---

## 7. Arquivos de navegação rápida

```text
electron/main.ts                         lifecycle, single instance, tray e cleanup
electron/window.ts                       BrowserWindow e segurança de navegação
electron/services/                       domínio Kubernetes por recurso
electron/ipc/                            validação e registro de IPC
shared/ipc-contract.ts                   contrato main ↔ renderer
shared/types.ts                          modelos do domínio
src/index.css                            tokens e componentes visuais globais
src/components/common/ResourcePage.tsx   padrão de páginas de recursos
src/components/ui/                       Button, Drawer, IconButton, SearchInput
src/components/layout/                   App shell, Sidebar, Topbar e Command Palette
src/components/logs/                     seleção, stream e visualização de logs
src/pages/                               rotas e composição de cada recurso
src/stores/                              estado Zustand por recurso
```

---

## 8. Como validar e rodar

```bash
npm install
npm run lint
npm test
npm run build
npm run dev
```

Estado validado após as mudanças desta sessão:

- `npm run lint` passou sem avisos.
- `npm test` passou: 7 arquivos e 31 testes.
- `npm run build` passou.

Há um aviso conhecido do Vite/Vitest: `vite.config.ts` e `vitest.config.ts` usam sintaxe ESM enquanto o package está configurado como CommonJS. Não impede build/teste hoje, mas deve ser resolvido antes de uma atualização maior do Vite.

Para executar com dados reais é necessário kubeconfig funcional e os plugins de autenticação correspondentes no `PATH` (`kubelogin`, `gke-gcloud-auth-plugin`, `aws`, etc.).

---

## 9. Próximos passos recomendados

1. **Commitar as mudanças locais** em commits temáticos: segurança/CI, refinamento de UI e redesign de logs.
2. **Testes de renderer**: introduzir testes de componentes para logs, focus trap e fluxo de Apply; hoje a cobertura é predominantemente de lógica pura.
3. **Teste visual em Electron real** com kubeconfig de desenvolvimento, sobretudo Logs com payloads Serilog/JSON/stack trace e múltiplos containers.
4. **Padronizar ações nos drawers**: alguns detalhes ainda usam `<button>` com classes locais em vez de `Button`/`IconButton`.
5. **Code splitting do Monaco**: o bundle principal ainda ultrapassa o aviso de 500 kB do Vite.
6. **Migrar configurações para ESM** para remover o aviso de carregamento futuro do Vite/Vitest.
7. **Assinatura e notarização** de macOS/Windows antes de ampliar distribuição pública.
8. **Escala de dados**: avaliar virtualização para tabelas e logs muito extensos.

---

## 10. Cuidados ao continuar

- Não coloque chamadas Kubernetes no renderer.
- Não afrouxe o `contextBridge` para expor `ipcRenderer` ou Node.
- Não reative `force` no Apply como padrão.
- Preserve `127.0.0.1` nos port-forwards; não expor em todas as interfaces por padrão.
- Não trate falta de permissão como “zero recursos”.
- Em UI, use tokens e primitivos existentes; evite retornar a cores `zinc-*` soltas em fundo escuro.
- Antes de fazer `git commit`, revisar o conjunto de modificações atuais pois este documento descreve trabalho ainda não commitado.
