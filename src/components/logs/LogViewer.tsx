import clsx from 'clsx'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { parseLogLine, type LogLevel } from '@/lib/logLineParser'

const SCROLL_BOTTOM_THRESHOLD_PX = 48

// Serilog's own console theme, adapted to KubePilot's dark palette: muted
// grays for the noisy levels, blue for Information, amber for Warning, and
// Error/Fatal both red — Fatal inverted (solid fill) so it still reads as
// "worse than Error" at a glance even in a wall of red-tinted lines.
const LEVEL_STYLES: Record<LogLevel, string> = {
  VRB: 'bg-zinc-500/10 text-zinc-500 ring-zinc-500/20',
  DBG: 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20',
  INF: 'bg-blue-500/10 text-blue-400 ring-blue-500/25',
  WRN: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
  ERR: 'bg-red-500/15 text-red-400 ring-red-500/30',
  FTL: 'bg-red-600 text-white ring-red-500/60',
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Wraps every case-insensitive occurrence of `query` in a `<mark>` — the
 * Logs page's search field highlighting, so a match is visible at a glance
 * instead of the user having to re-read every line. No-op when there's no
 * active query. */
function highlightQuery(text: string, query: string): ReactNode {
  if (!query) return text
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'ig'))
  if (parts.length === 1) return text

  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="rounded bg-amber-400/40 text-zinc-900">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

/** Splits a Serilog-style message template on its `{Property}` placeholders
 * and highlights them — a cosmetic nod to structured logging even when (as
 * is typical for stdout by the time it reaches Kubernetes) the values are
 * already substituted into the string rather than passed separately.
 * Layered with the search-query highlight from {@link highlightQuery}. */
function renderMessageTokens(message: string, query: string): ReactNode {
  const parts = message.split(/(\{[^{}]+\})/g)

  return parts.map((part, i) =>
    part.startsWith('{') && part.endsWith('}') ? (
      <span key={i} className="text-emerald-400/90">
        {highlightQuery(part, query)}
      </span>
    ) : (
      <span key={i}>{highlightQuery(part, query)}</span>
    ),
  )
}

function LogLine({ raw, query }: { raw: string; query: string }) {
  const parsed = useMemo(() => parseLogLine(raw), [raw])

  if (!parsed.level) {
    // Unparsed line (or an exception/stack-trace continuation under a
    // structured entry above it) — render as plain text, same as before
    // this feature existed, so nothing is ever hidden just because it
    // didn't match a known log format.
    return <div className="whitespace-pre-wrap break-all text-fg-muted">{highlightQuery(raw, query)}</div>
  }

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 py-px">
      {parsed.timestamp && <span className="shrink-0 tabular-nums text-fg-subtle">{parsed.timestamp}</span>}
      <span
        className={clsx(
          'shrink-0 rounded px-1 text-[11px] font-semibold tracking-wide ring-1 ring-inset',
          LEVEL_STYLES[parsed.level],
        )}
      >
        {parsed.level}
      </span>
      <span className="whitespace-pre-wrap break-all text-fg-muted">{renderMessageTokens(parsed.message, query)}</span>
      {parsed.properties.map((prop) => (
        <span key={prop.key} className="kp-chip">
          {prop.key}=<span className="text-fg">{highlightQuery(prop.value, query)}</span>
        </span>
      ))}
    </div>
  )
}

export function LogViewer({
  lines,
  podName,
  query = '',
  emptyMessage = 'No log output yet.',
}: {
  lines: string[]
  podName: string
  /** Search text (already used by the caller to filter `lines`) — re-passed
   * here purely so matches get highlighted in place. */
  query?: string
  /** Overridable so a caller filtering `lines` can distinguish "nothing has
   * arrived yet" from "nothing matches your search/level filter". */
  emptyMessage?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pinnedToBottom, setPinnedToBottom] = useState(true)
  // Marks the *next* 'scroll' event as one we caused ourselves, so
  // `handleScroll` can ignore it. Without this, a burst of fast-arriving
  // lines can grow `scrollHeight` again in the moment between us setting
  // `scrollTop` and the browser firing the resulting scroll event — that
  // event then sees a non-zero distance-from-bottom and incorrectly unpins
  // auto-scroll, leaving the view stuck mid-log instead of following.
  const isAutoScrolling = useRef(false)

  // A layout effect (not a plain effect) so the scroll position is
  // corrected synchronously before the browser paints the new lines —
  // otherwise a fast stream can render a frame at the old scroll position
  // first, which reads as the view "jumping" instead of smoothly tracking
  // the bottom.
  useLayoutEffect(() => {
    if (!pinnedToBottom || !containerRef.current) return
    isAutoScrolling.current = true
    containerRef.current.scrollTop = containerRef.current.scrollHeight
    // The scroll event this triggers fires asynchronously (next tick at the
    // earliest) — clear the flag right after so it only swallows that one
    // self-inflicted event, never a genuine user scroll.
    requestAnimationFrame(() => {
      isAutoScrolling.current = false
    })
  }, [lines, pinnedToBottom])

  const handleScroll = () => {
    if (isAutoScrolling.current) return
    const el = containerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setPinnedToBottom(distanceFromBottom < SCROLL_BOTTOM_THRESHOLD_PX)
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border-subtle bg-black/40">
      <div className="border-b border-border-subtle px-4 py-2 font-mono text-xs text-fg-subtle">{podName}</div>
      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-3 font-mono text-[13px] leading-relaxed">
        {lines.length === 0 ? (
          <p className="text-fg-subtle">{emptyMessage}</p>
        ) : (
          lines.map((line, i) => <LogLine key={i} raw={line} query={query} />)
        )}
      </div>
      {!pinnedToBottom && lines.length > 0 && (
        <button
          type="button"
          onClick={() => setPinnedToBottom(true)}
          className="absolute bottom-4 right-8 rounded-full bg-accent px-3 py-1 text-xs font-medium text-white shadow-lg transition-colors hover:bg-accent-hover"
        >
          Jump to bottom
        </button>
      )}
    </div>
  )
}
