import { ResourceActionService } from './actions/ResourceActionService'
import { ClusterService } from './clusters/ClusterService'
import { ConfigMapService } from './configmaps/ConfigMapService'
import { CronJobService } from './cronjobs/CronJobService'
import { DaemonSetService } from './daemonsets/DaemonSetService'
import { DeploymentService } from './deployments/DeploymentService'
import { DescribeService } from './describe/DescribeService'
import { EventService } from './events/EventService'
import { ExecService } from './exec/ExecService'
import { JobService } from './jobs/JobService'
import { ServiceService } from './k8sservices/ServiceService'
import { KubeconfigService } from './kubeconfig/KubeconfigService'
import { KubernetesClientFactory } from './kubernetes/KubernetesClientFactory'
import { LogsService } from './logs/LogsService'
import { NamespaceService } from './namespaces/NamespaceService'
import { PodService } from './pods/PodService'
import { ReplicaSetService } from './replicasets/ReplicaSetService'
import { SecretService } from './secrets/SecretService'
import { StatefulSetService } from './statefulsets/StatefulSetService'

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
  logsService: LogsService
  describeService: DescribeService
  actionService: ResourceActionService
  execService: ExecService
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
  const logsService = new LogsService(clusterService)
  const describeService = new DescribeService(clusterService)
  const actionService = new ResourceActionService(clusterService)
  const execService = new ExecService(clusterService)

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
    logsService,
    describeService,
    actionService,
    execService,
  }
}
