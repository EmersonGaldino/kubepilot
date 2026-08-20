import type { JSONSchema } from 'monaco-yaml'

import type { DescribableKind } from '@shared/types'

const objectMeta = {
  type: 'object',
  description: 'Standard Kubernetes object metadata.',
  additionalProperties: true,
  properties: {
    name: { type: 'string', description: 'Name of the resource. Must be unique within the namespace.' },
    namespace: { type: 'string', description: 'Namespace of the resource. Empty for cluster-scoped objects.' },
    labels: {
      type: 'object',
      additionalProperties: { type: 'string' },
      description: 'Key/value pairs for selection and grouping.',
    },
    annotations: {
      type: 'object',
      additionalProperties: { type: 'string' },
      description: 'Unstructured metadata for tools and controllers.',
    },
    generateName: { type: 'string' },
    uid: { type: 'string' },
    resourceVersion: { type: 'string' },
    generation: { type: 'integer' },
    creationTimestamp: { type: 'string' },
    deletionTimestamp: { type: 'string' },
    finalizers: { type: 'array', items: { type: 'string' } },
    ownerReferences: { type: 'array', items: { type: 'object', additionalProperties: true } },
  },
}

const quantity = { type: ['string', 'integer', 'number'], description: 'Kubernetes quantity (e.g. 100m, 128Mi).' }

const envVar = {
  type: 'object',
  additionalProperties: true,
  properties: {
    name: { type: 'string' },
    value: { type: 'string' },
    valueFrom: {
      type: 'object',
      additionalProperties: true,
      properties: {
        secretKeyRef: {
          type: 'object',
          properties: { name: { type: 'string' }, key: { type: 'string' }, optional: { type: 'boolean' } },
        },
        configMapKeyRef: {
          type: 'object',
          properties: { name: { type: 'string' }, key: { type: 'string' }, optional: { type: 'boolean' } },
        },
        fieldRef: { type: 'object', properties: { fieldPath: { type: 'string' } } },
      },
    },
  },
}

const container = {
  type: 'object',
  additionalProperties: true,
  required: ['name', 'image'],
  properties: {
    name: { type: 'string', description: 'Name of the container. Unique within the pod.' },
    image: { type: 'string', description: 'Container image, e.g. nginx:1.27.' },
    imagePullPolicy: { type: 'string', enum: ['Always', 'IfNotPresent', 'Never'] },
    command: { type: 'array', items: { type: 'string' } },
    args: { type: 'array', items: { type: 'string' } },
    ports: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          containerPort: { type: 'integer' },
          protocol: { type: 'string', enum: ['TCP', 'UDP', 'SCTP'] },
        },
      },
    },
    env: { type: 'array', items: envVar },
    envFrom: { type: 'array', items: { type: 'object', additionalProperties: true } },
    resources: {
      type: 'object',
      properties: {
        requests: { type: 'object', additionalProperties: quantity },
        limits: { type: 'object', additionalProperties: quantity },
      },
    },
    volumeMounts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          mountPath: { type: 'string' },
          readOnly: { type: 'boolean' },
          subPath: { type: 'string' },
        },
      },
    },
    livenessProbe: { type: 'object', additionalProperties: true },
    readinessProbe: { type: 'object', additionalProperties: true },
    startupProbe: { type: 'object', additionalProperties: true },
    securityContext: { type: 'object', additionalProperties: true },
  },
}

const labelSelector = {
  type: 'object',
  additionalProperties: true,
  properties: {
    matchLabels: { type: 'object', additionalProperties: { type: 'string' } },
    matchExpressions: { type: 'array', items: { type: 'object', additionalProperties: true } },
  },
}

const podTemplateSpec = {
  type: 'object',
  additionalProperties: true,
  properties: {
    metadata: objectMeta,
    spec: { $ref: '#/definitions/podSpec' },
  },
}

const podSpec = {
  type: 'object',
  additionalProperties: true,
  properties: {
    restartPolicy: { type: 'string', enum: ['Always', 'OnFailure', 'Never'] },
    serviceAccountName: { type: 'string' },
    nodeSelector: { type: 'object', additionalProperties: { type: 'string' } },
    tolerations: { type: 'array', items: { type: 'object', additionalProperties: true } },
    affinity: { type: 'object', additionalProperties: true },
    volumes: { type: 'array', items: { type: 'object', additionalProperties: true } },
    containers: { type: 'array', items: { $ref: '#/definitions/container' } },
    initContainers: { type: 'array', items: { $ref: '#/definitions/container' } },
    imagePullSecrets: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' } } } },
    hostNetwork: { type: 'boolean' },
    dnsPolicy: { type: 'string' },
    terminationGracePeriodSeconds: { type: 'integer' },
  },
}

const kindSpecs: Record<DescribableKind, Record<string, unknown>> = {
  deployment: {
    type: 'object',
    additionalProperties: true,
    properties: {
      replicas: { type: 'integer', description: 'Desired number of pods.' },
      selector: labelSelector,
      template: podTemplateSpec,
      strategy: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['RollingUpdate', 'Recreate'] },
          rollingUpdate: {
            type: 'object',
            properties: {
              maxUnavailable: { type: ['string', 'integer'] },
              maxSurge: { type: ['string', 'integer'] },
            },
          },
        },
      },
      minReadySeconds: { type: 'integer' },
      revisionHistoryLimit: { type: 'integer' },
      progressDeadlineSeconds: { type: 'integer' },
    },
  },
  pod: podSpec,
  statefulset: {
    type: 'object',
    additionalProperties: true,
    properties: {
      replicas: { type: 'integer' },
      serviceName: { type: 'string' },
      selector: labelSelector,
      template: podTemplateSpec,
      volumeClaimTemplates: { type: 'array', items: { type: 'object', additionalProperties: true } },
      updateStrategy: { type: 'object', additionalProperties: true },
      podManagementPolicy: { type: 'string', enum: ['OrderedReady', 'Parallel'] },
    },
  },
  daemonset: {
    type: 'object',
    additionalProperties: true,
    properties: {
      selector: labelSelector,
      template: podTemplateSpec,
      updateStrategy: { type: 'object', additionalProperties: true },
    },
  },
  replicaset: {
    type: 'object',
    additionalProperties: true,
    properties: {
      replicas: { type: 'integer' },
      selector: labelSelector,
      template: podTemplateSpec,
    },
  },
  job: {
    type: 'object',
    additionalProperties: true,
    properties: {
      completions: { type: 'integer' },
      parallelism: { type: 'integer' },
      backoffLimit: { type: 'integer' },
      ttlSecondsAfterFinished: { type: 'integer' },
      template: podTemplateSpec,
    },
  },
  cronjob: {
    type: 'object',
    additionalProperties: true,
    properties: {
      schedule: { type: 'string', description: 'Cron schedule, e.g. */5 * * * *' },
      suspend: { type: 'boolean' },
      concurrencyPolicy: { type: 'string', enum: ['Allow', 'Forbid', 'Replace'] },
      successfulJobsHistoryLimit: { type: 'integer' },
      failedJobsHistoryLimit: { type: 'integer' },
      jobTemplate: {
        type: 'object',
        properties: {
          metadata: objectMeta,
          spec: { $ref: '#/definitions/jobSpec' },
        },
      },
    },
  },
  service: {
    type: 'object',
    additionalProperties: true,
    properties: {
      type: { type: 'string', enum: ['ClusterIP', 'NodePort', 'LoadBalancer', 'ExternalName'] },
      selector: { type: 'object', additionalProperties: { type: 'string' } },
      clusterIP: { type: 'string' },
      ports: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            port: { type: 'integer' },
            targetPort: { type: ['string', 'integer'] },
            nodePort: { type: 'integer' },
            protocol: { type: 'string', enum: ['TCP', 'UDP', 'SCTP'] },
          },
        },
      },
      sessionAffinity: { type: 'string', enum: ['None', 'ClientIP'] },
      externalTrafficPolicy: { type: 'string', enum: ['Cluster', 'Local'] },
    },
  },
  configmap: {
    type: 'object',
    additionalProperties: true,
    properties: {},
  },
  secret: {
    type: 'object',
    additionalProperties: true,
    properties: {},
  },
  node: { type: 'object', additionalProperties: true },
  namespace: { type: 'object', additionalProperties: true, properties: { finalizers: { type: 'array', items: { type: 'string' } } } },
  ingress: {
    type: 'object',
    additionalProperties: true,
    properties: {
      ingressClassName: { type: 'string' },
      tls: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            hosts: { type: 'array', items: { type: 'string' } },
            secretName: { type: 'string' },
          },
        },
      },
      rules: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            host: { type: 'string' },
            http: {
              type: 'object',
              properties: {
                paths: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      path: { type: 'string' },
                      pathType: { type: 'string', enum: ['Prefix', 'Exact', 'ImplementationSpecific'] },
                      backend: {
                        type: 'object',
                        properties: {
                          service: {
                            type: 'object',
                            properties: {
                              name: { type: 'string' },
                              port: {
                                type: 'object',
                                properties: { number: { type: 'integer' }, name: { type: 'string' } },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  hpa: {
    type: 'object',
    additionalProperties: true,
    properties: {
      scaleTargetRef: {
        type: 'object',
        properties: {
          apiVersion: { type: 'string' },
          kind: { type: 'string' },
          name: { type: 'string' },
        },
      },
      minReplicas: { type: 'integer' },
      maxReplicas: { type: 'integer' },
      metrics: { type: 'array', items: { type: 'object', additionalProperties: true } },
      behavior: { type: 'object', additionalProperties: true },
    },
  },
  persistentvolumeclaim: {
    type: 'object',
    additionalProperties: true,
    properties: {
      accessModes: { type: 'array', items: { type: 'string', enum: ['ReadWriteOnce', 'ReadOnlyMany', 'ReadWriteMany', 'ReadWriteOncePod'] } },
      storageClassName: { type: 'string' },
      volumeName: { type: 'string' },
      resources: {
        type: 'object',
        properties: {
          requests: { type: 'object', additionalProperties: quantity },
          limits: { type: 'object', additionalProperties: quantity },
        },
      },
      volumeMode: { type: 'string', enum: ['Filesystem', 'Block'] },
    },
  },
  persistentvolume: {
    type: 'object',
    additionalProperties: true,
    properties: {
      capacity: { type: 'object', additionalProperties: quantity },
      accessModes: { type: 'array', items: { type: 'string' } },
      persistentVolumeReclaimPolicy: { type: 'string', enum: ['Retain', 'Delete', 'Recycle'] },
      storageClassName: { type: 'string' },
      claimRef: { type: 'object', additionalProperties: true },
      hostPath: { type: 'object', properties: { path: { type: 'string' } } },
    },
  },
  storageclass: {
    type: 'object',
    additionalProperties: true,
    properties: {},
  },
}

const kindEnums: Record<DescribableKind, { apiVersion: string; kind: string }> = {
  pod: { apiVersion: 'v1', kind: 'Pod' },
  deployment: { apiVersion: 'apps/v1', kind: 'Deployment' },
  statefulset: { apiVersion: 'apps/v1', kind: 'StatefulSet' },
  daemonset: { apiVersion: 'apps/v1', kind: 'DaemonSet' },
  replicaset: { apiVersion: 'apps/v1', kind: 'ReplicaSet' },
  job: { apiVersion: 'batch/v1', kind: 'Job' },
  cronjob: { apiVersion: 'batch/v1', kind: 'CronJob' },
  service: { apiVersion: 'v1', kind: 'Service' },
  configmap: { apiVersion: 'v1', kind: 'ConfigMap' },
  secret: { apiVersion: 'v1', kind: 'Secret' },
  node: { apiVersion: 'v1', kind: 'Node' },
  namespace: { apiVersion: 'v1', kind: 'Namespace' },
  ingress: { apiVersion: 'networking.k8s.io/v1', kind: 'Ingress' },
  hpa: { apiVersion: 'autoscaling/v2', kind: 'HorizontalPodAutoscaler' },
  persistentvolumeclaim: { apiVersion: 'v1', kind: 'PersistentVolumeClaim' },
  persistentvolume: { apiVersion: 'v1', kind: 'PersistentVolume' },
  storageclass: { apiVersion: 'storage.k8s.io/v1', kind: 'StorageClass' },
}

function dataFields(kind?: DescribableKind): Record<string, unknown> {
  if (!kind) return {}
  if (kind === 'configmap') {
    return {
      data: { type: 'object', additionalProperties: { type: 'string' }, description: 'Key/value configuration data.' },
      binaryData: { type: 'object', additionalProperties: { type: 'string' } },
    }
  }
  if (kind === 'secret') {
    return {
      type: { type: 'string', description: 'Secret type, e.g. Opaque or kubernetes.io/tls.' },
      data: { type: 'object', additionalProperties: { type: 'string' }, description: 'Base64-encoded values.' },
      stringData: { type: 'object', additionalProperties: { type: 'string' }, description: 'Plaintext values (converted to data on apply).' },
    }
  }
  if (kind === 'storageclass') {
    return {
      provisioner: { type: 'string' },
      reclaimPolicy: { type: 'string', enum: ['Retain', 'Delete'] },
      volumeBindingMode: { type: 'string', enum: ['Immediate', 'WaitForFirstConsumer'] },
      allowVolumeExpansion: { type: 'boolean' },
      parameters: { type: 'object', additionalProperties: { type: 'string' } },
    }
  }
  return {}
}

const KIND_BY_NAME: Record<string, DescribableKind> = Object.fromEntries(
  Object.entries(kindEnums).map(([key, value]) => [value.kind, key as DescribableKind]),
)

export function inferKindFromYaml(text: string): DescribableKind | undefined {
  const match = text.match(/^\s*kind:\s*["']?([A-Za-z]+)["']?\s*$/m)
  if (!match?.[1]) return undefined
  return KIND_BY_NAME[match[1]]
}

/** JSON Schema used by monaco-yaml for completion, hover, and validation.
 * Known fields are typed; extra fields remain allowed so live objects with
 * status/managedFields don't light up as errors. */
export function kubernetesResourceSchema(kind?: DescribableKind): JSONSchema {
  const identity = kind ? kindEnums[kind] : undefined
  const spec = kind && kind !== 'configmap' && kind !== 'secret' && kind !== 'storageclass' ? kindSpecs[kind] : undefined

  return {
    $id: 'inmemory://kubepilot/kubernetes-resource.schema.json',
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    additionalProperties: true,
    required: ['apiVersion', 'kind'],
    definitions: {
      objectMeta,
      container,
      podSpec,
      jobSpec: kindSpecs.job,
    },
    properties: {
      apiVersion: {
        type: 'string',
        description: 'API group and version, e.g. apps/v1.',
        ...(identity ? { enum: [identity.apiVersion], default: identity.apiVersion } : {}),
      },
      kind: {
        type: 'string',
        description: 'Kubernetes resource kind.',
        ...(identity ? { enum: [identity.kind], default: identity.kind } : { enum: Object.values(kindEnums).map((k) => k.kind) }),
      },
      metadata: objectMeta,
      ...(spec ? { spec } : {}),
      status: { type: 'object', additionalProperties: true, description: 'Status is server-managed; edits are usually ignored.' },
      ...dataFields(kind),
    },
  } as JSONSchema
}
