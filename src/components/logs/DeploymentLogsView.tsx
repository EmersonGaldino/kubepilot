import { ScrollText } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { EmptyState } from '@/components/common/EmptyState'
import { LogViewer } from '@/components/logs/LogViewer'
import { SearchInput } from '@/components/ui/SearchInput'
import { usePodLogStream } from '@/hooks/usePodLogStream'
import { ALL_LOG_LEVELS, logLineMatchesFilter, type LogLevelFilter } from '@/lib/logLineParser'
import { kubernetesApi } from '@/services/kubernetesApi'
import type { PodSummary } from '@shared/types'

const TAIL_LINE_OPTIONS = [100, 200, 500, 1000]
// Re-lists matching pods on this interval so a scale-up/rollout/crash-loop
// is picked up without the user having to reopen the drawer — new pods gain
// a pane, pods that disappeared lose theirs.
const POD_LIST_POLL_MS = 10_000

export interface LogsPageGroupTarget {
  namespace: string
  labelSelector: string
  groupName: string
}

/** Tails every pod matching a workload's label selector at once — each pane
 * streams independently and follows automatically, so logs "correm sozinhos"
 * for the whole Deployment as soon as it's opened, no per-pod setup needed. */
export function DeploymentLogsView({ namespace, labelSelector, groupName }: LogsPageGroupTarget) {
  const [pods, setPods] = useState<PodSummary[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tailLines, setTailLines] = useState(200)
  const [timestamps, setTimestamps] = useState(false)
  const [query, setQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<LogLevelFilter>('ALL')

  useEffect(() => {
    let cancelled = false

    const refresh = async () => {
      try {
        const found = await kubernetesApi.pods.list(namespace, labelSelector)
        if (cancelled) return
        setPods(found)
        setError(null)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void refresh()
    const interval = setInterval(() => void refresh(), POD_LIST_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [namespace, labelSelector])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-5">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border-subtle bg-surface-2 px-3 py-2">
        <div className="mr-auto min-w-0">
          <h2 className="truncate text-sm font-semibold text-fg">{groupName}</h2>
          <p className="text-xs text-fg-muted">
            {namespace} · {pods.length} pod{pods.length === 1 ? '' : 's'} · following live
          </p>
        </div>

        <select
          aria-label="Tail lines"
          value={tailLines}
          onChange={(e) => setTailLines(Number(e.target.value))}
          className="kp-control"
        >
          {TAIL_LINE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n} lines
            </option>
          ))}
        </select>

        <label className="flex h-8 items-center gap-1.5 text-xs text-fg-muted">
          <input type="checkbox" checked={timestamps} onChange={(e) => setTimestamps(e.target.checked)} />
          Timestamps
        </label>

        <select
          aria-label="Log level"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value as LogLevelFilter)}
          className="kp-control"
        >
          <option value="ALL">All levels</option>
          {ALL_LOG_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>

        <SearchInput value={query} onValueChange={setQuery} placeholder="Search all panes…" className="w-52" />
      </div>

      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}

      {loading && pods.length === 0 && !error && <p className="text-xs text-fg-muted">Loading pods…</p>}

      {!loading && pods.length === 0 && !error && (
        <EmptyState icon={ScrollText} title="No pods found" description="This workload has no pods matching its selector right now." />
      )}

      {pods.length > 0 && (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {pods.map((pod) => (
            <PodLogPane
              key={`${pod.namespace}/${pod.name}`}
              pod={pod}
              tailLines={tailLines}
              timestamps={timestamps}
              query={query}
              levelFilter={levelFilter}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PodLogPane({
  pod,
  tailLines,
  timestamps,
  query,
  levelFilter,
}: {
  pod: PodSummary
  tailLines: number
  timestamps: boolean
  query: string
  levelFilter: LogLevelFilter
}) {
  const { lines, error } = usePodLogStream({ namespace: pod.namespace, podName: pod.name, tailLines, timestamps })

  const filteredLines = useMemo(
    () => lines.filter((line) => logLineMatchesFilter(line, query, levelFilter)),
    [lines, query, levelFilter],
  )

  return (
    <div className="flex h-80 flex-col gap-1">
      {error && <p className="text-xs text-danger" role="alert">{error}</p>}
      <LogViewer
        lines={filteredLines}
        query={query}
        emptyMessage={query || levelFilter !== 'ALL' ? 'No lines match your search.' : 'No log output yet.'}
        podName={pod.name}
        following
      />
    </div>
  )
}
