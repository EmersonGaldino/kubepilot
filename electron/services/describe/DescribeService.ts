import * as yaml from 'js-yaml'

import type { DescribeParams } from '../../../shared/types'
import type { ClusterService } from '../clusters/ClusterService'

/** Fetches the raw Kubernetes object for any resource kind KubePilot knows
 * about and renders it as YAML — the desktop equivalent of
 * `kubectl get <kind> <name> -o yaml`. Backs every resource drawer's
 * "Describe" action from one place instead of each resource growing its own
 * describe endpoint. */
export class DescribeService {
  constructor(private readonly clusterService: ClusterService) {}

  async describe({ kind, namespace, name }: DescribeParams): Promise<string> {
    const { coreV1Api, appsV1Api, batchV1Api, networkingV1Api, autoscalingV2Api, storageV1Api } =
      this.clusterService.getActiveBundle()

    const object = await (() => {
      switch (kind) {
        case 'pod':
          return coreV1Api.readNamespacedPod({ name, namespace })
        case 'deployment':
          return appsV1Api.readNamespacedDeployment({ name, namespace })
        case 'statefulset':
          return appsV1Api.readNamespacedStatefulSet({ name, namespace })
        case 'daemonset':
          return appsV1Api.readNamespacedDaemonSet({ name, namespace })
        case 'replicaset':
          return appsV1Api.readNamespacedReplicaSet({ name, namespace })
        case 'job':
          return batchV1Api.readNamespacedJob({ name, namespace })
        case 'cronjob':
          return batchV1Api.readNamespacedCronJob({ name, namespace })
        case 'service':
          return coreV1Api.readNamespacedService({ name, namespace })
        case 'configmap':
          return coreV1Api.readNamespacedConfigMap({ name, namespace })
        case 'secret':
          return coreV1Api.readNamespacedSecret({ name, namespace })
        case 'node':
          return coreV1Api.readNode({ name })
        case 'namespace':
          return coreV1Api.readNamespace({ name })
        case 'ingress':
          return networkingV1Api.readNamespacedIngress({ name, namespace })
        case 'hpa':
          return autoscalingV2Api.readNamespacedHorizontalPodAutoscaler({ name, namespace })
        case 'persistentvolumeclaim':
          return coreV1Api.readNamespacedPersistentVolumeClaim({ name, namespace })
        case 'persistentvolume':
          return coreV1Api.readPersistentVolume({ name })
        case 'storageclass':
          return storageV1Api.readStorageClass({ name })
        default:
          throw new Error(`Unsupported kind for describe: ${kind as string}`)
      }
    })()

    const plain = JSON.parse(JSON.stringify(object)) as unknown
    return yaml.dump(plain, { skipInvalid: true, noRefs: true, lineWidth: 120 })
  }
}
