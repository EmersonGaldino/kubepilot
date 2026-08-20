import { describe, expect, it } from 'vitest'

import { isClusterScopedKind } from '../../shared/types'

describe('isClusterScopedKind', () => {
  it('treats nodes and namespaces as cluster-scoped', () => {
    expect(isClusterScopedKind('node')).toBe(true)
    expect(isClusterScopedKind('namespace')).toBe(true)
    expect(isClusterScopedKind('persistentvolume')).toBe(true)
    expect(isClusterScopedKind('storageclass')).toBe(true)
  })

  it('treats namespaced workloads as namespaced', () => {
    expect(isClusterScopedKind('pod')).toBe(false)
    expect(isClusterScopedKind('ingress')).toBe(false)
    expect(isClusterScopedKind('persistentvolumeclaim')).toBe(false)
  })
})
