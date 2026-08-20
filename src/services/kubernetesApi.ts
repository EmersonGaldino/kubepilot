import type { IpcResult } from '@shared/ipc-contract'
import type {
  ApplyParams,
  DeleteParams,
  DescribeParams,
  ExecStartParams,
  LogsFetchParams,
  NamespaceCreateParams,
  PortForwardStartParams,
  RestartParams,
  ScaleParams,
} from '@shared/types'

/** Unwraps the `{ ok, data | error }` envelope every IPC call resolves to,
 * so the rest of the renderer can just `await` and `catch` like any other
 * async call. */
function unwrap<T>(result: IpcResult<T>): T {
  if (!result.ok) throw new Error(result.error)
  return result.data
}

/**
 * The renderer's only door into Kubernetes data. Every call goes through
 * `window.kubepilot` (the preload bridge) — nothing here touches Node.js or
 * `@kubernetes/client-node` directly, since this code runs in the sandboxed
 * renderer.
 */
export const kubernetesApi = {
  kubeconfig: {
    getContexts: () => window.kubepilot.kubeconfig.getContexts().then(unwrap),
    setContext: (contextName: string) => window.kubepilot.kubeconfig.setContext(contextName).then(unwrap),
    onChanged: window.kubepilot.kubeconfig.onChanged,
  },
  cluster: {
    getInfo: () => window.kubepilot.cluster.getInfo().then(unwrap),
    refresh: () => window.kubepilot.cluster.refresh().then(unwrap),
  },
  namespaces: {
    list: () => window.kubepilot.namespaces.list().then(unwrap),
    get: (name: string) => window.kubepilot.namespaces.get({ name }).then(unwrap),
    create: (params: NamespaceCreateParams) => window.kubepilot.namespaces.create(params).then(unwrap),
    delete: (name: string) => window.kubepilot.namespaces.delete({ name }).then(unwrap),
  },
  pods: {
    list: (namespace: string, labelSelector?: string) => window.kubepilot.pods.list({ namespace, labelSelector }).then(unwrap),
    get: (namespace: string, name: string) => window.kubepilot.pods.get({ namespace, name }).then(unwrap),
  },
  deployments: {
    list: (namespace: string) => window.kubepilot.deployments.list({ namespace }).then(unwrap),
    get: (namespace: string, name: string) => window.kubepilot.deployments.get({ namespace, name }).then(unwrap),
  },
  statefulsets: {
    list: (namespace: string) => window.kubepilot.statefulsets.list({ namespace }).then(unwrap),
    get: (namespace: string, name: string) => window.kubepilot.statefulsets.get({ namespace, name }).then(unwrap),
  },
  daemonsets: {
    list: (namespace: string) => window.kubepilot.daemonsets.list({ namespace }).then(unwrap),
    get: (namespace: string, name: string) => window.kubepilot.daemonsets.get({ namespace, name }).then(unwrap),
  },
  replicasets: {
    list: (namespace: string) => window.kubepilot.replicasets.list({ namespace }).then(unwrap),
    get: (namespace: string, name: string) => window.kubepilot.replicasets.get({ namespace, name }).then(unwrap),
  },
  jobs: {
    list: (namespace: string) => window.kubepilot.jobs.list({ namespace }).then(unwrap),
    get: (namespace: string, name: string) => window.kubepilot.jobs.get({ namespace, name }).then(unwrap),
  },
  cronjobs: {
    list: (namespace: string) => window.kubepilot.cronjobs.list({ namespace }).then(unwrap),
    get: (namespace: string, name: string) => window.kubepilot.cronjobs.get({ namespace, name }).then(unwrap),
  },
  services: {
    list: (namespace: string) => window.kubepilot.services.list({ namespace }).then(unwrap),
    get: (namespace: string, name: string) => window.kubepilot.services.get({ namespace, name }).then(unwrap),
  },
  configmaps: {
    list: (namespace: string) => window.kubepilot.configmaps.list({ namespace }).then(unwrap),
    get: (namespace: string, name: string) => window.kubepilot.configmaps.get({ namespace, name }).then(unwrap),
  },
  secrets: {
    list: (namespace: string) => window.kubepilot.secrets.list({ namespace }).then(unwrap),
    get: (namespace: string, name: string) => window.kubepilot.secrets.get({ namespace, name }).then(unwrap),
  },
  events: {
    list: (namespace: string) => window.kubepilot.events.list({ namespace }).then(unwrap),
  },
  nodes: {
    list: () => window.kubepilot.nodes.list().then(unwrap),
    get: (name: string) => window.kubepilot.nodes.get({ name }).then(unwrap),
    cordon: (name: string, unschedulable: boolean) => window.kubepilot.nodes.cordon({ name, unschedulable }).then(unwrap),
  },
  ingresses: {
    list: (namespace: string) => window.kubepilot.ingresses.list({ namespace }).then(unwrap),
    get: (namespace: string, name: string) => window.kubepilot.ingresses.get({ namespace, name }).then(unwrap),
  },
  hpa: {
    list: (namespace: string) => window.kubepilot.hpa.list({ namespace }).then(unwrap),
    get: (namespace: string, name: string) => window.kubepilot.hpa.get({ namespace, name }).then(unwrap),
  },
  pvcs: {
    list: (namespace: string) => window.kubepilot.pvcs.list({ namespace }).then(unwrap),
    get: (namespace: string, name: string) => window.kubepilot.pvcs.get({ namespace, name }).then(unwrap),
  },
  pvs: {
    list: () => window.kubepilot.pvs.list().then(unwrap),
    get: (name: string) => window.kubepilot.pvs.get({ name }).then(unwrap),
  },
  storageclasses: {
    list: () => window.kubepilot.storageclasses.list().then(unwrap),
    get: (name: string) => window.kubepilot.storageclasses.get({ name }).then(unwrap),
  },
  describe: {
    get: (params: DescribeParams) => window.kubepilot.describe.get(params).then(unwrap),
  },
  actions: {
    delete: (params: DeleteParams) => window.kubepilot.actions.delete(params).then(unwrap),
    scale: (params: ScaleParams) => window.kubepilot.actions.scale(params).then(unwrap),
    restart: (params: RestartParams) => window.kubepilot.actions.restart(params).then(unwrap),
  },
  apply: {
    run: (params: ApplyParams) => window.kubepilot.apply.run(params).then(unwrap),
  },
  portforward: {
    start: (params: PortForwardStartParams) => window.kubepilot.portforward.start(params).then(unwrap),
    stop: (id: string) => window.kubepilot.portforward.stop(id).then(unwrap),
    list: () => window.kubepilot.portforward.list().then(unwrap),
  },
  exec: {
    start: (params: ExecStartParams) => window.kubepilot.exec.start(params).then(unwrap),
    write: (execId: string, data: string) => window.kubepilot.exec.write(execId, data).then(unwrap),
    stop: (execId: string) => window.kubepilot.exec.stop(execId).then(unwrap),
    subscribe: window.kubepilot.exec.subscribe,
  },
  logs: {
    fetch: (params: LogsFetchParams) => window.kubepilot.logs.fetch(params).then(unwrap),
    streamStart: (params: LogsFetchParams) => window.kubepilot.logs.streamStart(params).then(unwrap),
    streamStop: (streamId: string) => window.kubepilot.logs.streamStop(streamId).then(unwrap),
    subscribe: window.kubepilot.logs.subscribe,
  },
  tray: {
    onNavigate: window.kubepilot.tray.onNavigate,
  },
}
