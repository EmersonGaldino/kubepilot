
/**
 * The single source of truth for IPC channel names and the shape of the API
 * the preload script exposes on `window.kubepilot`. Both `electron/preload.ts`
 * (implementation) and the renderer (consumer, via `src/types/kubepilot-api.ts`)
 * are built against this contract so the two sides can never drift apart.
 */
import type {
  ApplyParams,
  ApplyResult,
  ClusterInfo,
  ConfigMapDetail,
  ConfigMapSummary,
  CordonParams,
  CronJobDetail,
  CronJobSummary,
  DaemonSetDetail,
  DaemonSetSummary,
  DeleteParams,
  DeploymentDetail,
  DeploymentSummary,
  DescribeParams,
  EventSummary,
  ExecStartParams,
  HpaDetail,
  HpaSummary,
  IngressDetail,
  IngressSummary,
  JobDetail,
  JobSummary,
  KubeContext,
  LogsFetchParams,
  NamespaceCreateParams,
  NamespaceDetail,
  NamespaceSummary,
  NodeDetail,
  NodeSummary,
  PodDetail,
  PodSummary,
  PortForwardSession,
  PortForwardStartParams,
  PvDetail,
  PvcDetail,
  PvcSummary,
  PvSummary,
  ReplicaSetDetail,
  ReplicaSetSummary,
  RestartParams,
  ScaleParams,
  SecretDetail,
  SecretSummary,
  ServiceDetail,
  ServiceSummary,
  StatefulSetDetail,
  StatefulSetSummary,
  StorageClassDetail,
  StorageClassSummary,
} from './types'

export const IPC_CHANNELS = {
  kubeconfig: {
    getContexts: 'kubeconfig:get-contexts',
    setContext: 'kubeconfig:set-context',
    changed: 'kubeconfig:changed',
  },
  cluster: {
    getInfo: 'cluster:get-info',
    refresh: 'cluster:refresh',
  },
  namespaces: {
    list: 'namespaces:list',
    get: 'namespaces:get',
    create: 'namespaces:create',
    delete: 'namespaces:delete',
  },
  pods: {
    list: 'pods:list',
    get: 'pods:get',
  },
  deployments: {
    list: 'deployments:list',
    get: 'deployments:get',
  },
  statefulsets: {
    list: 'statefulsets:list',
    get: 'statefulsets:get',
  },
  daemonsets: {
    list: 'daemonsets:list',
    get: 'daemonsets:get',
  },
  replicasets: {
    list: 'replicasets:list',
    get: 'replicasets:get',
  },
  jobs: {
    list: 'jobs:list',
    get: 'jobs:get',
  },
  cronjobs: {
    list: 'cronjobs:list',
    get: 'cronjobs:get',
  },
  services: {
    list: 'services:list',
    get: 'services:get',
  },
  configmaps: {
    list: 'configmaps:list',
    get: 'configmaps:get',
  },
  secrets: {
    list: 'secrets:list',
    get: 'secrets:get',
  },
  events: {
    list: 'events:list',
  },
  nodes: {
    list: 'nodes:list',
    get: 'nodes:get',
    cordon: 'nodes:cordon',
  },
  ingresses: {
    list: 'ingresses:list',
    get: 'ingresses:get',
  },
  hpa: {
    list: 'hpa:list',
    get: 'hpa:get',
  },
  pvcs: {
    list: 'pvcs:list',
    get: 'pvcs:get',
  },
  pvs: {
    list: 'pvs:list',
    get: 'pvs:get',
  },
  storageclasses: {
    list: 'storageclasses:list',
    get: 'storageclasses:get',
  },
  describe: {
    get: 'describe:get',
  },
  actions: {
    delete: 'actions:delete',
    scale: 'actions:scale',
    restart: 'actions:restart',
  },
  apply: {
    run: 'apply:run',
  },
  portforward: {
    start: 'portforward:start',
    stop: 'portforward:stop',
    list: 'portforward:list',
  },
  exec: {
    start: 'exec:start',
    write: 'exec:write',
    stop: 'exec:stop',
    data: 'exec:data',
    error: 'exec:error',
    end: 'exec:end',
  },
  logs: {
    fetch: 'logs:fetch',
    streamStart: 'logs:stream-start',
    streamStop: 'logs:stream-stop',
    streamData: 'logs:stream-data',
    streamError: 'logs:stream-error',
    streamEnd: 'logs:stream-end',
  },
  tray: {
    navigate: 'tray:navigate',
  },
  window: {
    splashDone: 'window:splash-done',
  },
  update: {
    check: 'update:check',
    download: 'update:download',
    install: 'update:install',
    available: 'update:available',
    notAvailable: 'update:not-available',
    progress: 'update:progress',
    downloaded: 'update:downloaded',
    error: 'update:error',
  },
} as const

/** Every IPC call resolves to a result envelope instead of throwing across
 * the process boundary, so the renderer can render error states uniformly. */
export type IpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export interface KubeconfigContextsPayload {
  contexts: KubeContext[]
  currentContext: string | null
}

export interface PodsListParams {
  namespace: string | 'all'
  /** Restricts the list to pods matching this label selector (e.g.
   * `"app=foo,tier=web"`) — used to find every pod owned by a given
   * Deployment/StatefulSet/DaemonSet via its selector. */
  labelSelector?: string
}

export interface PodGetParams {
  namespace: string
  name: string
}

export interface DeploymentsListParams {
  namespace: string | 'all'
}

export interface DeploymentGetParams {
  namespace: string
  name: string
}

/** Shared shape for every newer resource's `list`/`get` params — Pods and
 * Deployments keep their own named interfaces above since they predate this
 * generalization and plenty of code already imports them by name. */
export interface NamespacedListParams {
  namespace: string | 'all'
}

export interface NamespacedGetParams {
  namespace: string
  name: string
}

export interface NamedGetParams {
  name: string
}

export interface ExecStreamHandle {
  execId: string
}

export interface ExecDataEvent {
  execId: string
  chunk: string
}

export interface ExecErrorEvent {
  execId: string
  error: string
}

export interface ExecEndEvent {
  execId: string
}

export interface LogsStreamHandle {
  streamId: string
}

export interface LogsStreamDataEvent {
  streamId: string
  lines: string[]
}

export interface LogsStreamErrorEvent {
  streamId: string
  error: string
}

export interface LogsStreamEndEvent {
  streamId: string
}

export interface UpdateProgressPayload {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

export interface UpdateCheckPayload {
  updateAvailable: boolean
  version: string | null
}

/** Renderer-facing view of the preload bridge. Kept in `shared/` (rather
 * than `src/types`) so main, preload and renderer all compile against the
 * exact same function signatures. */
export interface KubepilotApi {
  kubeconfig: {
    getContexts: () => Promise<IpcResult<KubeconfigContextsPayload>>
    setContext: (contextName: string) => Promise<IpcResult<KubeconfigContextsPayload>>
    onChanged: (listener: (payload: KubeconfigContextsPayload) => void) => () => void
  }
  cluster: {
    getInfo: () => Promise<IpcResult<ClusterInfo>>
    /** Forces the active context's Kubernetes client to be rebuilt (dropping
     * any cached auth token/exec-plugin state) before re-fetching cluster
     * info — needed to recover after switching the active `gcloud`/`az` CLI
     * account, which doesn't rewrite the kubeconfig file on its own. */
    refresh: () => Promise<IpcResult<ClusterInfo>>
  }
  namespaces: {
    list: () => Promise<IpcResult<NamespaceSummary[]>>
    get: (params: NamedGetParams) => Promise<IpcResult<NamespaceDetail>>
    create: (params: NamespaceCreateParams) => Promise<IpcResult<void>>
    delete: (params: NamedGetParams) => Promise<IpcResult<void>>
  }
  pods: {
    list: (params: PodsListParams) => Promise<IpcResult<PodSummary[]>>
    get: (params: PodGetParams) => Promise<IpcResult<PodDetail>>
  }
  deployments: {
    list: (params: DeploymentsListParams) => Promise<IpcResult<DeploymentSummary[]>>
    get: (params: DeploymentGetParams) => Promise<IpcResult<DeploymentDetail>>
  }
  statefulsets: {
    list: (params: NamespacedListParams) => Promise<IpcResult<StatefulSetSummary[]>>
    get: (params: NamespacedGetParams) => Promise<IpcResult<StatefulSetDetail>>
  }
  daemonsets: {
    list: (params: NamespacedListParams) => Promise<IpcResult<DaemonSetSummary[]>>
    get: (params: NamespacedGetParams) => Promise<IpcResult<DaemonSetDetail>>
  }
  replicasets: {
    list: (params: NamespacedListParams) => Promise<IpcResult<ReplicaSetSummary[]>>
    get: (params: NamespacedGetParams) => Promise<IpcResult<ReplicaSetDetail>>
  }
  jobs: {
    list: (params: NamespacedListParams) => Promise<IpcResult<JobSummary[]>>
    get: (params: NamespacedGetParams) => Promise<IpcResult<JobDetail>>
  }
  cronjobs: {
    list: (params: NamespacedListParams) => Promise<IpcResult<CronJobSummary[]>>
    get: (params: NamespacedGetParams) => Promise<IpcResult<CronJobDetail>>
  }
  services: {
    list: (params: NamespacedListParams) => Promise<IpcResult<ServiceSummary[]>>
    get: (params: NamespacedGetParams) => Promise<IpcResult<ServiceDetail>>
  }
  configmaps: {
    list: (params: NamespacedListParams) => Promise<IpcResult<ConfigMapSummary[]>>
    get: (params: NamespacedGetParams) => Promise<IpcResult<ConfigMapDetail>>
  }
  secrets: {
    list: (params: NamespacedListParams) => Promise<IpcResult<SecretSummary[]>>
    get: (params: NamespacedGetParams) => Promise<IpcResult<SecretDetail>>
  }
  events: {
    list: (params: NamespacedListParams) => Promise<IpcResult<EventSummary[]>>
  }
  nodes: {
    list: () => Promise<IpcResult<NodeSummary[]>>
    get: (params: NamedGetParams) => Promise<IpcResult<NodeDetail>>
    cordon: (params: CordonParams) => Promise<IpcResult<void>>
  }
  ingresses: {
    list: (params: NamespacedListParams) => Promise<IpcResult<IngressSummary[]>>
    get: (params: NamespacedGetParams) => Promise<IpcResult<IngressDetail>>
  }
  hpa: {
    list: (params: NamespacedListParams) => Promise<IpcResult<HpaSummary[]>>
    get: (params: NamespacedGetParams) => Promise<IpcResult<HpaDetail>>
  }
  pvcs: {
    list: (params: NamespacedListParams) => Promise<IpcResult<PvcSummary[]>>
    get: (params: NamespacedGetParams) => Promise<IpcResult<PvcDetail>>
  }
  pvs: {
    list: () => Promise<IpcResult<PvSummary[]>>
    get: (params: NamedGetParams) => Promise<IpcResult<PvDetail>>
  }
  storageclasses: {
    list: () => Promise<IpcResult<StorageClassSummary[]>>
    get: (params: NamedGetParams) => Promise<IpcResult<StorageClassDetail>>
  }
  /** Backs the "Describe" action shown on every resource drawer — returns
   * the raw object as YAML (`kubectl get <kind> <name> -o yaml` equivalent)
   * instead of each resource type growing its own describe endpoint. */
  describe: {
    get: (params: DescribeParams) => Promise<IpcResult<string>>
  }
  /** Generic mutating actions, dispatched by resource kind, shared across
   * every drawer's Delete/Scale/Restart buttons. */
  actions: {
    delete: (params: DeleteParams) => Promise<IpcResult<void>>
    scale: (params: ScaleParams) => Promise<IpcResult<void>>
    restart: (params: RestartParams) => Promise<IpcResult<void>>
  }
  apply: {
    run: (params: ApplyParams) => Promise<IpcResult<ApplyResult>>
  }
  portforward: {
    start: (params: PortForwardStartParams) => Promise<IpcResult<PortForwardSession>>
    stop: (id: string) => Promise<IpcResult<void>>
    list: () => Promise<IpcResult<PortForwardSession[]>>
  }
  exec: {
    start: (params: ExecStartParams) => Promise<IpcResult<ExecStreamHandle>>
    write: (execId: string, data: string) => Promise<IpcResult<void>>
    stop: (execId: string) => Promise<IpcResult<void>>
    subscribe: (
      execId: string,
      handlers: {
        onData: (chunk: string) => void
        onError: (error: string) => void
        onEnd: () => void
      },
    ) => () => void
  }
  logs: {
    fetch: (params: LogsFetchParams) => Promise<IpcResult<string[]>>
    streamStart: (params: LogsFetchParams) => Promise<IpcResult<LogsStreamHandle>>
    streamStop: (streamId: string) => Promise<IpcResult<void>>
    subscribe: (
      streamId: string,
      handlers: {
        onData: (lines: string[]) => void
        onError: (error: string) => void
        onEnd: () => void
      },
    ) => () => void
  }
  tray: {
    onNavigate: (listener: (route: string) => void) => () => void
  }
  window: {
    /** Fire-and-forget: tells main the splash screen has finished fading
     * out, so it's safe to reveal the (macOS-only) traffic lights that were
     * hidden while it covered them. */
    notifySplashDone: () => void
  }
  /** App-update flow: an explicit check kicked off from main on launch
   * (and periodically) surfaces a prompt in the renderer; downloading and
   * installing both stay user-initiated so nothing installs silently
   * mid-session. */
  update: {
    check: () => Promise<IpcResult<UpdateCheckPayload>>
    download: () => Promise<IpcResult<void>>
    install: () => Promise<IpcResult<void>>
    onAvailable: (listener: (version: string) => void) => () => void
    onNotAvailable: (listener: () => void) => () => void
    onProgress: (listener: (progress: UpdateProgressPayload) => void) => () => void
    onDownloaded: (listener: (version: string) => void) => () => void
    onError: (listener: (error: string) => void) => () => void
  }
}
