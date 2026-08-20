import { ApplyService } from './apply/ApplyService'
import { ResourceActionService } from './actions/ResourceActionService'
import { ClusterService } from './clusters/ClusterService'
import { ConfigMapService } from './configmaps/ConfigMapService'
import { CronJobService } from './cronjobs/CronJobService'
import { DaemonSetService } from './daemonsets/DaemonSetService'
import { DeploymentService } from './deployments/DeploymentService'
import { DescribeService } from './describe/DescribeService'
import { EventService } from './events/EventService'
import { ExecService } from './exec/ExecService'
import { HpaService } from './hpa/HpaService'
import { IngressService } from './ingresses/IngressService'
import { JobService } from './jobs/JobService'
import { ServiceService } from './k8sservices/ServiceService'
import { KubeconfigService } from './kubeconfig/KubeconfigService'
import { KubernetesClientFactory } from './kubernetes/KubernetesClientFactory'
import { LogsService } from './logs/LogsService'
import { NamespaceService } from './namespaces/NamespaceService'
import { NodeService } from './nodes/NodeService'
import { PodService } from './pods/PodService'
import { PortForwardService } from './portforward/PortForwardService'
import { PvcService } from './pvcs/PvcService'
import { PvService } from './pvs/PvService'
import { ReplicaSetService } from './replicasets/ReplicaSetService'
import { SecretService } from './secrets/SecretService'
import { StatefulSetService } from './statefulsets/StatefulSetService'
import { StorageClassService } from './storageclasses/StorageClassService'
import { UpdateService } from './update/UpdateService'

export interface ServiceContainer {
  kubeconfigService: KubeconfigService
  clientFactory: KubernetesClientFactory
  clusterService: ClusterService
  namespaceService: NamespaceService
  podService: PodService
  deploymentService: DeploymentService
  statefulSetService: StatefulSetService
  daemonSetService: DaemonSetService
  replicaSetService: ReplicaSetService
  jobService: JobService
  cronJobService: CronJobService
  serviceService: ServiceService
  configMapService: ConfigMapService
  secretService: SecretService
  eventService: EventService
  nodeService: NodeService
  ingressService: IngressService
  hpaService: HpaService
  pvcService: PvcService
  pvService: PvService
  storageClassService: StorageClassService
  logsService: LogsService
  describeService: DescribeService
  actionService: ResourceActionService
  applyService: ApplyService
  execService: ExecService
  portForwardService: PortForwardService
  updateService: UpdateService
}

export function createServiceContainer(): ServiceContainer {
  const kubeconfigService = new KubeconfigService()
  const clientFactory = new KubernetesClientFactory()
  const clusterService = new ClusterService(kubeconfigService, clientFactory)
  const namespaceService = new NamespaceService(clusterService)
  const podService = new PodService(clusterService)
  const deploymentService = new DeploymentService(clusterService)
  const statefulSetService = new StatefulSetService(clusterService)
  const daemonSetService = new DaemonSetService(clusterService)
  const replicaSetService = new ReplicaSetService(clusterService)
  const jobService = new JobService(clusterService)
  const cronJobService = new CronJobService(clusterService)
  const serviceService = new ServiceService(clusterService)
  const configMapService = new ConfigMapService(clusterService)
  const secretService = new SecretService(clusterService)
  const eventService = new EventService(clusterService)
  const nodeService = new NodeService(clusterService)
  const ingressService = new IngressService(clusterService)
  const hpaService = new HpaService(clusterService)
  const pvcService = new PvcService(clusterService)
  const pvService = new PvService(clusterService)
  const storageClassService = new StorageClassService(clusterService)
  const logsService = new LogsService(clusterService)
  const describeService = new DescribeService(clusterService)
  const actionService = new ResourceActionService(clusterService)
  const applyService = new ApplyService(clusterService)
  const execService = new ExecService(clusterService)
  const portForwardService = new PortForwardService(clusterService)
  const updateService = new UpdateService()

  return {
    kubeconfigService,
    clientFactory,
    clusterService,
    namespaceService,
    podService,
    deploymentService,
    statefulSetService,
    daemonSetService,
    replicaSetService,
    jobService,
    cronJobService,
    serviceService,
    configMapService,
    secretService,
    eventService,
    nodeService,
    ingressService,
    hpaService,
    pvcService,
    pvService,
    storageClassService,
    logsService,
    describeService,
    actionService,
    applyService,
    execService,
    portForwardService,
    updateService,
  }
}
