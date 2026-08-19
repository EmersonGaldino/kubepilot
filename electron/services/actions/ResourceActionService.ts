import type { DeleteParams, RestartParams, ScaleParams } from '../../../shared/types'
import type { ClusterService } from '../clusters/ClusterService'

/** Generic mutating actions (Delete/Scale/Restart), dispatched by resource
 * kind, shared across every drawer's action buttons instead of each
 * resource-specific service growing its own copy of the same three
 * operations. */
export class ResourceActionService {
  constructor(private readonly clusterService: ClusterService) {}

  async delete({ kind, namespace, name }: DeleteParams): Promise<void> {
    const { coreV1Api, appsV1Api, batchV1Api } = this.clusterService.getActiveBundle()

    switch (kind) {
      case 'pod':
        await coreV1Api.deleteNamespacedPod({ name, namespace })
        return
      case 'deployment':
        await appsV1Api.deleteNamespacedDeployment({ name, namespace })
        return
      case 'statefulset':
        await appsV1Api.deleteNamespacedStatefulSet({ name, namespace })
        return
      case 'daemonset':
        await appsV1Api.deleteNamespacedDaemonSet({ name, namespace })
        return
      case 'replicaset':
        await appsV1Api.deleteNamespacedReplicaSet({ name, namespace })
        return
      case 'job':
        await batchV1Api.deleteNamespacedJob({ name, namespace })
        return
      case 'cronjob':
        await batchV1Api.deleteNamespacedCronJob({ name, namespace })
        return
      case 'service':
        await coreV1Api.deleteNamespacedService({ name, namespace })
        return
      case 'configmap':
        await coreV1Api.deleteNamespacedConfigMap({ name, namespace })
        return
      case 'secret':
        await coreV1Api.deleteNamespacedSecret({ name, namespace })
        return
      default:
        throw new Error(`Unsupported kind for delete: ${kind as string}`)
    }
  }

  /** Scales a Deployment/StatefulSet/ReplicaSet by reading the current
   * object, changing `spec.replicas`, and writing it back with a plain PUT
   * — sidesteps the content-type negotiation ambiguity of PATCHing the
   * `/scale` subresource for what's otherwise a one-field change. */
  async scale({ kind, namespace, name, replicas }: ScaleParams): Promise<void> {
    const { appsV1Api } = this.clusterService.getActiveBundle()

    switch (kind) {
      case 'deployment': {
        const current = await appsV1Api.readNamespacedDeployment({ name, namespace })
        if (current.spec) current.spec.replicas = replicas
        await appsV1Api.replaceNamespacedDeployment({ name, namespace, body: current })
        return
      }
      case 'statefulset': {
        const current = await appsV1Api.readNamespacedStatefulSet({ name, namespace })
        if (current.spec) current.spec.replicas = replicas
        await appsV1Api.replaceNamespacedStatefulSet({ name, namespace, body: current })
        return
      }
      case 'replicaset': {
        const current = await appsV1Api.readNamespacedReplicaSet({ name, namespace })
        if (current.spec) current.spec.replicas = replicas
        await appsV1Api.replaceNamespacedReplicaSet({ name, namespace, body: current })
        return
      }
    }
  }

  /** Equivalent to `kubectl rollout restart` — stamps a timestamp annotation
   * onto the pod template so the controller rolls every pod even though no
   * functional spec field changed. DaemonSets have no replica count to scale
   * but support this same restart mechanism. */
  async restart({ kind, namespace, name }: RestartParams): Promise<void> {
    const { appsV1Api } = this.clusterService.getActiveBundle()
    const restartedAt = new Date().toISOString()

    switch (kind) {
      case 'deployment': {
        const current = await appsV1Api.readNamespacedDeployment({ name, namespace })
        if (current.spec?.template) {
          current.spec.template.metadata = current.spec.template.metadata ?? {}
          current.spec.template.metadata.annotations = { ...current.spec.template.metadata.annotations, 'kubepilot.dev/restartedAt': restartedAt }
        }
        await appsV1Api.replaceNamespacedDeployment({ name, namespace, body: current })
        return
      }
      case 'statefulset': {
        const current = await appsV1Api.readNamespacedStatefulSet({ name, namespace })
        if (current.spec?.template) {
          current.spec.template.metadata = current.spec.template.metadata ?? {}
          current.spec.template.metadata.annotations = { ...current.spec.template.metadata.annotations, 'kubepilot.dev/restartedAt': restartedAt }
        }
        await appsV1Api.replaceNamespacedStatefulSet({ name, namespace, body: current })
        return
      }
      case 'daemonset': {
        const current = await appsV1Api.readNamespacedDaemonSet({ name, namespace })
        if (current.spec?.template) {
          current.spec.template.metadata = current.spec.template.metadata ?? {}
          current.spec.template.metadata.annotations = { ...current.spec.template.metadata.annotations, 'kubepilot.dev/restartedAt': restartedAt }
        }
        await appsV1Api.replaceNamespacedDaemonSet({ name, namespace, body: current })
        return
      }
    }
  }
}
