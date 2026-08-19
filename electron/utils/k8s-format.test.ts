import { describe, expect, it } from 'vitest'

import { classifyProvider, containerState, formatAge, podPhase, podReadyRatio, podRestartCount } from './k8s-format'

describe('classifyProvider', () => {
  it('recognizes AKS contexts', () => {
    expect(classifyProvider('aks-priv-anchieta-prod', 'aks-priv-anchieta-prod')).toBe('aks')
  })

  it('recognizes GKE contexts', () => {
    expect(classifyProvider('gke_sistemas-leo-n_us-central1_gke-sistemas-leo-n', 'gke_sistemas-leo-n')).toBe('gke')
  })

  it('recognizes EKS contexts', () => {
    expect(classifyProvider('my-eks-cluster', 'arn:aws:eks:us-east-1:123:cluster/my-cluster')).toBe('eks')
  })

  it('recognizes local clusters', () => {
    expect(classifyProvider('minikube', 'minikube')).toBe('local')
    expect(classifyProvider('rancher-desktop', 'rancher-desktop')).toBe('local')
  })

  it('falls back to unknown', () => {
    expect(classifyProvider('some-random-context', 'some-cluster')).toBe('unknown')
  })
})

describe('formatAge', () => {
  it('returns null for missing timestamps', () => {
    expect(formatAge(null)).toBeNull()
    expect(formatAge(undefined)).toBeNull()
  })

  it('formats recent timestamps in seconds', () => {
    const tenSecondsAgo = new Date(Date.now() - 10_000)
    expect(formatAge(tenSecondsAgo)).toBe('10s')
  })

  it('formats day-old timestamps', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    expect(formatAge(twoDaysAgo)).toBe('2d')
  })
})

describe('pod field helpers', () => {
  const basePod = {
    status: {
      phase: 'Running' as const,
      containerStatuses: [
        { name: 'app', image: 'app:1.0', imageID: '', ready: true, restartCount: 2, state: { running: {} } },
        {
          name: 'sidecar',
          image: 'sidecar:1.0',
          imageID: '',
          ready: false,
          restartCount: 0,
          state: { waiting: { reason: 'CrashLoopBackOff' } },
        },
      ],
    },
  }

  it('podPhase reads status.phase, defaulting to Unknown', () => {
    expect(podPhase(basePod)).toBe('Running')
    expect(podPhase({ status: {} })).toBe('Unknown')
  })

  it('podReadyRatio counts ready containers', () => {
    expect(podReadyRatio(basePod)).toBe('1/2')
    expect(podReadyRatio({ status: {} })).toBe('0/0')
  })

  it('podRestartCount sums restarts across containers', () => {
    expect(podRestartCount(basePod)).toBe(2)
  })

  it('containerState describes waiting/running/terminated states', () => {
    expect(containerState(basePod.status.containerStatuses[0])).toBe('running')
    expect(containerState(basePod.status.containerStatuses[1])).toBe('waiting (CrashLoopBackOff)')
    expect(containerState(undefined)).toBe('unknown')
  })
})
