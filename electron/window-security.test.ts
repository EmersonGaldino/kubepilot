import { describe, expect, it } from 'vitest'

import { isSafeExternalUrl } from './window-security'

describe('isSafeExternalUrl', () => {
  it('allows only normal web links', () => {
    expect(isSafeExternalUrl('https://kubernetes.io/docs/')).toBe(true)
    expect(isSafeExternalUrl('http://localhost:8080')).toBe(true)
  })

  it('rejects local, custom, and malformed schemes', () => {
    expect(isSafeExternalUrl('file:///etc/passwd')).toBe(false)
    expect(isSafeExternalUrl('mailto:ops@example.com')).toBe(false)
    expect(isSafeExternalUrl('kubepilot://settings')).toBe(false)
    expect(isSafeExternalUrl('not a url')).toBe(false)
  })
})
