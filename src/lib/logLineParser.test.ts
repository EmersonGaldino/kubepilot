import { describe, expect, it } from 'vitest'

import { logLineMatchesFilter, parseLogLine } from './logLineParser'

describe('parseLogLine', () => {
  it('parses a Serilog-style console line', () => {
    const result = parseLogLine('[14:32:07 INF] Starting up')
    expect(result.level).toBe('INF')
    expect(result.timestamp).toBe('14:32:07')
    expect(result.message).toBe('Starting up')
  })

  it('normalizes full-word levels', () => {
    expect(parseLogLine('2024-01-02T03:04:05.678Z WARNING disk usage high').level).toBe('WRN')
    expect(parseLogLine('ERROR: connection refused').level).toBe('ERR')
    expect(parseLogLine('Information: request completed').level).toBe('INF')
  })

  it('parses a JSON log line and pulls out extra properties', () => {
    const result = parseLogLine('{"level":"error","time":"2024-01-02T03:04:05Z","msg":"db down","retries":3}')
    expect(result.level).toBe('ERR')
    expect(result.timestamp).toBe('2024-01-02T03:04:05Z')
    expect(result.message).toBe('db down')
    expect(result.properties).toEqual([{ key: 'retries', value: '3' }])
  })

  it('falls back to a plain, unparsed line when nothing matches', () => {
    const result = parseLogLine('   at MyApp.Program.Main() in /src/Program.cs:line 42')
    expect(result.level).toBeNull()
    expect(result.timestamp).toBeNull()
    expect(result.message).toBe(result.raw)
  })

  it('does not misfire on an empty line', () => {
    const result = parseLogLine('')
    expect(result.level).toBeNull()
    expect(result.message).toBe('')
  })
})

describe('logLineMatchesFilter', () => {
  const line = '[14:32:07 WRN] Disk usage at 92% on /data'

  it('matches everything with no query and no level filter', () => {
    expect(logLineMatchesFilter(line, '', 'ALL')).toBe(true)
  })

  it('matches a case-insensitive substring in the query', () => {
    expect(logLineMatchesFilter(line, 'disk usage', 'ALL')).toBe(true)
    expect(logLineMatchesFilter(line, 'DISK', 'ALL')).toBe(true)
    expect(logLineMatchesFilter(line, 'connection refused', 'ALL')).toBe(false)
  })

  it('filters by level', () => {
    expect(logLineMatchesFilter(line, '', 'WRN')).toBe(true)
    expect(logLineMatchesFilter(line, '', 'ERR')).toBe(false)
  })

  it('requires both the level and the query to match', () => {
    expect(logLineMatchesFilter(line, 'disk', 'WRN')).toBe(true)
    expect(logLineMatchesFilter(line, 'disk', 'ERR')).toBe(false)
  })

  it('excludes unparsed lines whenever a specific level filter is active', () => {
    const stackFrame = '   at MyApp.Program.Main()'
    expect(logLineMatchesFilter(stackFrame, '', 'ALL')).toBe(true)
    expect(logLineMatchesFilter(stackFrame, '', 'ERR')).toBe(false)
  })
})
