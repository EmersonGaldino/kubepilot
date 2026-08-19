import type { V1CronJob } from '@kubernetes/client-node'

import type { CronJobDetail, CronJobSummary } from '../../../shared/types'
import type { ClusterService } from '../clusters/ClusterService'
import { formatAge } from '../../utils/k8s-format'

function toSummary(cronJob: V1CronJob): CronJobSummary {
  return {
    name: cronJob.metadata?.name ?? 'unknown',
    namespace: cronJob.metadata?.namespace ?? 'unknown',
    schedule: cronJob.spec?.schedule ?? '',
    suspended: cronJob.spec?.suspend ?? false,
    active: (cronJob.status?.active ?? []).length,
    lastScheduleTime: cronJob.status?.lastScheduleTime ? new Date(cronJob.status.lastScheduleTime).toISOString() : null,
    age: formatAge(cronJob.metadata?.creationTimestamp),
  }
}

export interface CronJobListParams {
  namespace: string | 'all'
}

export interface CronJobGetParams {
  namespace: string
  name: string
}

/** Reads CronJobs (batch/v1) for whichever context {@link ClusterService}
 * currently considers active. Mirrors {@link DeploymentService}'s shape. */
export class CronJobService {
  constructor(private readonly clusterService: ClusterService) {}

  async list({ namespace }: CronJobListParams): Promise<CronJobSummary[]> {
    const { batchV1Api } = this.clusterService.getActiveBundle()

    const { items } =
      namespace === 'all'
        ? await batchV1Api.listCronJobForAllNamespaces()
        : await batchV1Api.listNamespacedCronJob({ namespace })

    return items.map(toSummary).sort((a, b) => a.name.localeCompare(b.name))
  }

  async get({ namespace, name }: CronJobGetParams): Promise<CronJobDetail> {
    const { batchV1Api } = this.clusterService.getActiveBundle()
    const cronJob = await batchV1Api.readNamespacedCronJob({ name, namespace })

    return {
      ...toSummary(cronJob),
      createdAt: cronJob.metadata?.creationTimestamp ? new Date(cronJob.metadata.creationTimestamp).toISOString() : null,
      labels: cronJob.metadata?.labels ?? {},
      concurrencyPolicy: cronJob.spec?.concurrencyPolicy ?? 'Allow',
      containers: (cronJob.spec?.jobTemplate?.spec?.template?.spec?.containers ?? []).map((c) => ({
        name: c.name,
        image: c.image ?? 'unknown',
      })),
    }
  }
}
