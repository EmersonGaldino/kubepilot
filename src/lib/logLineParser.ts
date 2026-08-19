/** Serilog's canonical 3-letter level codes — used as the normalized output
 * regardless of which convention the source log line actually used
 * (`INFO`, `Information`, `info`, `INF`, …). */
export type LogLevel = 'VRB' | 'DBG' | 'INF' | 'WRN' | 'ERR' | 'FTL'

/** In display order, noisiest to most severe — backs the level filter
 * dropdown in the Logs UI. */
export const ALL_LOG_LEVELS: LogLevel[] = ['VRB', 'DBG', 'INF', 'WRN', 'ERR', 'FTL']

/** `'ALL'` is the Logs UI's own "no level filter" pseudo-value, alongside a
 * real {@link LogLevel} to restrict the view to just that level. */
export type LogLevelFilter = LogLevel | 'ALL'

export interface ParsedLogLine {
  /** The untouched original line — always available so a render can fall
   * back to it verbatim if nothing else looks useful. */
  raw: string
  timestamp: string | null
  level: LogLevel | null
  message: string
  /** Structured fields beyond level/timestamp/message — from a JSON log
   * line's remaining keys. Rendered as `key=value` chips, Serilog-style. */
  properties: { key: string; value: string }[]
}

const LEVEL_ALIASES: Record<string, LogLevel> = {
  TRACE: 'VRB',
  VERBOSE: 'VRB',
  VRB: 'VRB',
  DEBUG: 'DBG',
  DBG: 'DBG',
  INFO: 'INF',
  INFORMATION: 'INF',
  INF: 'INF',
  WARN: 'WRN',
  WARNING: 'WRN',
  WRN: 'WRN',
  ERROR: 'ERR',
  ERR: 'ERR',
  FATAL: 'FTL',
  CRITICAL: 'FTL',
  CRIT: 'FTL',
  FTL: 'FTL',
}

const LEVEL_WORD = Object.keys(LEVEL_ALIASES).sort((a, b) => b.length - a.length).join('|')

// `[2024-01-02T03:04:05.678Z]` / `2024-01-02 03:04:05,678` / `14:32:07.123` —
// deliberately permissive since containers log timestamps in a dozen
// slightly different shapes.
const TIMESTAMP = String.raw`\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:[.,]\d{1,9})?(?:Z|[+-]\d{2}:?\d{2})?|\d{2}:\d{2}:\d{2}(?:[.,]\d{1,9})?`

const LINE_PATTERN = new RegExp(
  `^\\s*` +
    `(?:\\[?(?<ts>${TIMESTAMP})\\]?)?` +
    `\\s*` +
    `\\[?(?<level>${LEVEL_WORD})\\]?` +
    `\\s*:?\\s*` +
    `(?<rest>.*)$`,
  'i',
)

const JSON_LEVEL_KEYS = ['level', 'lvl', 'severity', 'loglevel', '@l']
const JSON_TIME_KEYS = ['timestamp', 'time', 'ts', '@t', 'asctime']
const JSON_MESSAGE_KEYS = ['message', 'msg', '@m', '@mt', 'text']

function firstStringField(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'string' && value.length > 0) return value
    if (typeof value === 'number') return String(value)
  }
  return null
}

function tryParseJsonLine(raw: string): ParsedLogLine | null {
  const trimmed = raw.trim()
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return null
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null

  const obj = parsed as Record<string, unknown>
  const levelRaw = firstStringField(obj, JSON_LEVEL_KEYS)
  const level = levelRaw ? (LEVEL_ALIASES[levelRaw.toUpperCase()] ?? null) : null
  const timestamp = firstStringField(obj, JSON_TIME_KEYS)
  const message = firstStringField(obj, JSON_MESSAGE_KEYS) ?? trimmed

  const usedKeys = new Set([...JSON_LEVEL_KEYS, ...JSON_TIME_KEYS, ...JSON_MESSAGE_KEYS])
  const properties = Object.entries(obj)
    .filter(([key]) => !usedKeys.has(key))
    .map(([key, value]) => ({ key, value: typeof value === 'string' ? value : JSON.stringify(value) }))

  return { raw, timestamp, level, message, properties }
}

/** Best-effort structured parse of one raw container log line, Serilog
 * console theme in spirit: pull a level and timestamp out of whatever
 * convention the source used (JSON field, `[INF]`/`INFO`/`Information`
 * prefix, …) so {@link LogViewer} can render a colored level badge and a
 * dimmed timestamp instead of one flat line of text. Falls back to
 * `{ level: null, message: raw }` when nothing recognizable is found —
 * every log line still renders, just without the extra structure. */
export function parseLogLine(raw: string): ParsedLogLine {
  const asJson = tryParseJsonLine(raw)
  if (asJson) return asJson

  const match = raw.match(LINE_PATTERN)
  const level = match?.groups?.level ? (LEVEL_ALIASES[match.groups.level.toUpperCase()] ?? null) : null

  // Guards against the regex's optional groups matching an empty prefix on
  // a line that has no level at all (e.g. a stack trace continuation) —
  // treat those as plain, unparsed lines rather than a false-positive match.
  if (!level) return { raw, timestamp: null, level: null, message: raw, properties: [] }

  return {
    raw,
    timestamp: match?.groups?.ts ?? null,
    level,
    message: match?.groups?.rest ?? raw,
    properties: [],
  }
}

/** Backs the Logs page's search field + level filter: a line survives if it
 * matches the selected level (or `'ALL'` skips that check — an unparsed
 * line, like a stack-trace continuation, only ever matches `'ALL'`) *and*
 * its raw text contains the search query, case-insensitively. Matching
 * against the raw line rather than just the parsed message means the query
 * can also hit the timestamp, level word, or JSON property values. */
export function logLineMatchesFilter(raw: string, query: string, levelFilter: LogLevelFilter): boolean {
  if (levelFilter !== 'ALL' && parseLogLine(raw).level !== levelFilter) return false
  if (!query) return true
  return raw.toLowerCase().includes(query.toLowerCase())
}
