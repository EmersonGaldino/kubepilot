import type { V1Job } from '@kubernetes/client-node'

import type { JobDetail, JobStatus, JobSummary } from '../../../shared/types'
import type { ClusterService } from '../clusters/ClusterService'
import { formatAge } from '../../utils/k8s-format'

/** Jobs have no single "phase" field like Pods do — this classifies one from
 * the `Complete`/`Failed` status conditions, mirroring what `kubectl get
 * jobs` shows. Kept local to this service per convention: only Deployments/
 * StatefulSets/DaemonSets share a `WorkloadStatus` classifier in
 * `k8s-format.ts`; Jobs/CronJobs have their own status shapes. */
function jobStatus(job: V1Job): JobStatus {
  const conditions = job.status?.conditions ?? []
  if (conditions.some((c) => c.type === 'Complete' && c.status === 'True')) return 'Complete'
  if (conditions.some((c) => c.type === 'Failed' && c.status === 'True')) return 'Failed'
  return 'Running'
}

function jobCompletions(job: V1Job): string {
  return `${job.status?.succeeded ?? 0}/${job.spec?.completions ?? 1}`
}

function toSummary(job: V1Job): JobSummary {
  return {
    name: job.metadata?.name ?? 'unknown',
    namespace: job.metadata?.namespace ?? 'unknown',
    status: jobStatus(job),
    completions: jobCompletions(job),
    active: job.status?.active ?? 0,
    age: formatAge(job.metadata?.creationTimestamp),
  }
}

export interface JobListParams {
  namespace: string | 'all'
}

export interface JobGetParams {
  namespace: string
  name: string
}

/** Reads Jobs (batch/v1) for whichever context {@link ClusterService}
 * currently considers active. Mirrors {@link DeploymentService}'s shape. */
export class JobService {
  constructor(private readonly clusterService: ClusterService) {}

  async list({ namespace }: JobListParams): Promise<JobSummary[]> {
    const { batchV1Api } = this.clusterService.getActiveBundle()

    const { items } =
      namespace === 'all'
        ? await batchV1Api.listJobForAllNamespaces()
        : await batchV1Api.listNamespacedJob({ namespace })

    return items.map(toSummary).sort((a, b) => a.name.localeCompare(b.name))
  }

  async get({ namespace, name }: JobGetParams): Promise<JobDetail> {
    const { batchV1Api } = this.clusterService.getActiveBundle()
    const job = await batchV1Api.readNamespacedJob({ name, namespace })

    return {
      ...toSummary(job),
      createdAt: job.metadata?.creationTimestamp ? new Date(job.metadata.creationTimestamp).toISOString() : null,
      completedAt: job.status?.completionTime ? new Date(job.status.completionTime).toISOString() : null,
      labels: job.metadata?.labels ?? {},
      containers: (job.spec?.template.spec?.containers ?? []).map((c) => ({
        name: c.name,
        image: c.image ?? 'unknown',
      })),
      conditions: (job.status?.conditions ?? []).map((c) => ({
        type: c.type,
        status: c.status,
        message: c.message ?? null,
      })),
    }
  }
}
