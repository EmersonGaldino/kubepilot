import { describe, expect, it } from 'vitest'

import { LineBuffer } from './LogsService'

describe('LineBuffer', () => {
  it('emits complete lines and buffers trailing partial lines', () => {
    const buffer = new LineBuffer()
    expect(buffer.push(Buffer.from('line one\nline two\npartial'))).toEqual(['line one', 'line two'])
  })

  it('stitches a partial line across chunk boundaries', () => {
    const buffer = new LineBuffer()
    expect(buffer.push(Buffer.from('hello wo'))).toEqual([])
    expect(buffer.push(Buffer.from('rld\nnext line\n'))).toEqual(['hello world', 'next line'])
  })

  it('flush returns any remaining partial line', () => {
    const buffer = new LineBuffer()
    buffer.push(Buffer.from('no newline yet'))
    expect(buffer.flush()).toEqual(['no newline yet'])
    expect(buffer.flush()).toEqual([])
  })
})
