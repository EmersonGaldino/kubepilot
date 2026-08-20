import { ALL_NAMESPACES } from '@/stores/useNamespaceStore'
import type { DescribableKind } from '@shared/types'

const STUBS: Record<DescribableKind, string> = {
  pod: `apiVersion: v1
kind: Pod
metadata:
  name: example
  namespace: default
spec:
  containers:
    - name: app
      image: nginx:alpine
`,
  deployment: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: example
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: example
  template:
    metadata:
      labels:
        app: example
    spec:
      containers:
        - name: app
          image: nginx:alpine
`,
  statefulset: `apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: example
  namespace: default
spec:
  serviceName: example
  replicas: 1
  selector:
    matchLabels:
      app: example
  template:
    metadata:
      labels:
        app: example
    spec:
      containers:
        - name: app
          image: nginx:alpine
`,
  daemonset: `apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: example
  namespace: default
spec:
  selector:
    matchLabels:
      app: example
  template:
    metadata:
      labels:
        app: example
    spec:
      containers:
        - name: app
          image: nginx:alpine
`,
  replicaset: `apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: example
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: example
  template:
    metadata:
      labels:
        app: example
    spec:
      containers:
        - name: app
          image: nginx:alpine
`,
  job: `apiVersion: batch/v1
kind: Job
metadata:
  name: example
  namespace: default
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: app
          image: busybox:1.36
          command: ["echo", "hello"]
`,
  cronjob: `apiVersion: batch/v1
kind: CronJob
metadata:
  name: example
  namespace: default
spec:
  schedule: "*/15 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: app
              image: busybox:1.36
              command: ["echo", "hello"]
`,
  service: `apiVersion: v1
kind: Service
metadata:
  name: example
  namespace: default
spec:
  selector:
    app: example
  ports:
    - port: 80
      targetPort: 80
`,
  configmap: `apiVersion: v1
kind: ConfigMap
metadata:
  name: example
  namespace: default
data:
  key: value
`,
  secret: `apiVersion: v1
kind: Secret
metadata:
  name: example
  namespace: default
type: Opaque
stringData:
  key: value
`,
  node: `apiVersion: v1
kind: Node
metadata:
  name: example
`,
  namespace: `apiVersion: v1
kind: Namespace
metadata:
  name: example
`,
  ingress: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: example
  namespace: default
spec:
  rules:
    - host: example.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: example
                port:
                  number: 80
`,
  hpa: `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: example
  namespace: default
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: example
  minReplicas: 1
  maxReplicas: 3
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 80
`,
  persistentvolumeclaim: `apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: example
  namespace: default
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
`,
  persistentvolume: `apiVersion: v1
kind: PersistentVolume
metadata:
  name: example
spec:
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  hostPath:
    path: /tmp/example
`,
  storageclass: `apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: example
provisioner: kubernetes.io/no-provisioner
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
`,
}

/**
 * The "New YAML" starting point for a resource kind — prefilled with the
 * cluster's actual current context instead of blank placeholders, so
 * hitting Apply immediately targets somewhere real. Namespace-scoped kinds
 * get their `namespace: default` line swapped for whatever namespace the
 * page is currently filtered to (skipped for "All namespaces", where there's
 * no single right answer to guess).
 */
export function yamlStubFor(kind: DescribableKind, namespace?: string): string {
  const stub = STUBS[kind]
  if (!namespace || namespace === ALL_NAMESPACES) return stub
  return stub.replace('namespace: default', `namespace: ${namespace}`)
}
