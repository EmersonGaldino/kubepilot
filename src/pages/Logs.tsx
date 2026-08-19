import { Download, ScrollText, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { EmptyState } from '@/components/common/EmptyState'
import { DeploymentLogsView, type LogsPageGroupTarget } from '@/components/logs/DeploymentLogsView'
import { LogViewer } from '@/components/logs/LogViewer'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/SearchInput'
import { ALL_LOG_LEVELS, logLineMatchesFilter, type LogLevelFilter } from '@/lib/logLineParser'
import { kubernetesApi } from '@/services/kubernetesApi'
import { ALL_NAMESPACES, useNamespaceStore } from '@/stores/useNamespaceStore'
import { usePodStore } from '@/stores/usePodStore'

export interface LogsPageTarget {
  namespace: string
  podName: string
  containerName?: string
}

export type { LogsPageGroupTarget }

type LogsNavState = LogsPageTarget | LogsPageGroupTarget

function isGroupTarget(target: LogsNavState): target is LogsPageGroupTarget {
  return 'labelSelector' in target
}

const TAIL_LINE_OPTIONS = [100, 200, 500, 1000, 2000]
const AUTO_REFRESH_OPTIONS: { label: string; ms: number | null }[] = [
  { label: 'Disabled', ms: null },
  { label: '5 seconds', ms: 5_000 },
  { label: '10 seconds', ms: 10_000 },
  { label: '30 seconds', ms: 30_000 },
  { label: '1 minute', ms: 60_000 },
]

/** Routes `/logs` navigation state to either a single-pod live view or, when
 * a workload (e.g. a Deployment) was opened instead of one pod, the
 * multi-pod {@link DeploymentLogsView}. Kept as a separate component (rather
 * than an early return inside `SinglePodLogs`) so React remounts fresh state
 * when switching between the two shapes instead of reusing hook state across
 * an incompatible target. */
export function Logs() {
  const location = useLocation()
  const navTarget = location.state as LogsNavState | null

  if (navTarget && isGroupTarget(navTarget)) {
    return <DeploymentLogsView namespace={navTarget.namespace} labelSelector={navTarget.labelSelector} groupName={navTarget.groupName} />
  }

  return <SinglePodLogs navTarget={navTarget} />
}

function SinglePodLogs({ navTarget }: { navTarget: LogsPageTarget | null }) {
  const namespaceFilter = useNamespaceStore((s) => s.selected)
  const pods = usePodStore((s) => s.pods)

  const [target, setTarget] = useState<LogsPageTarget | null>(navTarget)
  const [containers, setContainers] = useState<string[]>(navTarget?.containerName ? [navTarget.containerName] : [])
  const [tailLines, setTailLines] = useState(200)
  const [timestamps, setTimestamps] = useState(false)
  const [following, setFollowing] = useState(true)
  const [autoRefreshMs, setAutoRefreshMs] = useState<number | null>(null)
  const [lines, setLines] = useState<string[]>([])
  const [streamError, setStreamError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<LogLevelFilter>('ALL')

  const streamIdRef = useRef<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Look up the full container list whenever the target pod changes, so the
  // container picker works even when landing here from the tray/picker
  // instead of the Pod detail drawer.
  useEffect(() => {
    if (!target) return
    let cancelled = false
    void kubernetesApi.pods.get(target.namespace, target.podName).then(
      (detail) => {
        if (cancelled) return
        setContainers(detail.containers.map((c) => c.name))
      },
      () => undefined,
    )
    return () => {
      cancelled = true
    }
    // Only re-fetch the container list when the pod identity changes, not on
    // every containerName/tailLines tweak from the controls below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.namespace, target?.podName])

  const stopStream = () => {
    if (streamIdRef.current) {
      void kubernetesApi.logs.streamStop(streamIdRef.current)
      streamIdRef.current = null
    }
  }

  const stopAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const fetchOnce = async () => {
    if (!target) return
    try {
      const fetched = await kubernetesApi.logs.fetch({
        namespace: target.namespace,
        podName: target.podName,
        containerName: target.containerName,
        tailLines,
        timestamps,
      })
      setLines(fetched)
      setStreamError(null)
    } catch (error) {
      setStreamError(error instanceof Error ? error.message : String(error))
    }
  }

  // Drives both modes: streaming ("Follow") vs. one-shot fetch with an
  // optional auto-refresh interval.
  useEffect(() => {
    stopStream()
    stopAutoRefresh()
    // Intentional: clears any stale error/stream state synchronously before
    // (re)starting the fetch/stream below, so switching pods or toggling
    // "Follow" never briefly shows the previous target's error message.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStreamError(null)

    if (!target) return

    if (following) {
      setLines([])
      void kubernetesApi.logs
        .streamStart({ namespace: target.namespace, podName: target.podName, containerName: target.containerName, tailLines, timestamps })
        .then(({ streamId }) => {
          streamIdRef.current = streamId
          return kubernetesApi.logs.subscribe(streamId, {
            onData: (newLines) => setLines((prev) => [...prev, ...newLines]),
            onError: (error) => setStreamError(error),
            onEnd: () => {
              streamIdRef.current = null
            },
          })
        })
        .catch((error) => setStreamError(error instanceof Error ? error.message : String(error)))
    } else {
      void fetchOnce()
      if (autoRefreshMs) {
        intervalRef.current = setInterval(() => void fetchOnce(), autoRefreshMs)
      }
    }

    return () => {
      stopStream()
      stopAutoRefresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.namespace, target?.podName, target?.containerName, following, tailLines, timestamps, autoRefreshMs])

  const filteredLines = useMemo(
    () => lines.filter((line) => logLineMatchesFilter(line, query, levelFilter)),
    [lines, query, levelFilter],
  )

  const downloadLogs = () => {
    if (!target) return
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${target.podName}-${target.containerName ?? 'logs'}.log`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!target) {
    const pickablePods = namespaceFilter === ALL_NAMESPACES ? pods : pods.filter((p) => p.namespace === namespaceFilter)
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6">
        <EmptyState icon={ScrollText} title="No pod selected" description="Pick a pod to stream its logs, or open Logs from a Pod's details." />
        {pickablePods.length > 0 && (
          <select
            aria-label="Select a pod"
            className="kp-control min-w-72"
            defaultValue=""
            onChange={(e) => {
              const [namespace, podName] = e.target.value.split('/')
              if (namespace && podName) setTarget({ namespace, podName })
            }}
          >
            <option value="" disabled>
              Select a pod…
            </option>
            {pickablePods.map((p) => (
              <option key={`${p.namespace}/${p.name}`} value={`${p.namespace}/${p.name}`}>
                {p.namespace}/{p.name}
              </option>
            ))}
          </select>
        )}
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-5">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border-subtle bg-surface-2 px-3 py-2">
        {containers.length > 1 && (
          <select
            aria-label="Container"
            value={target.containerName ?? containers[0]}
            onChange={(e) => setTarget({ ...target, containerName: e.target.value })}
            className="kp-control"
          >
            {containers.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}

        <button
          type="button"
          onClick={() => setFollowing((v) => !v)}
          className={`inline-flex h-8 items-center rounded-md px-2.5 text-xs font-medium transition-colors duration-150 ${
            following ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/[0.06] text-fg-muted'
          }`}
        >
          {following ? 'Following' : 'Follow logs'}
        </button>

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

        {!following && (
          <select
            aria-label="Auto refresh"
            value={autoRefreshMs ?? ''}
            onChange={(e) => setAutoRefreshMs(e.target.value ? Number(e.target.value) : null)}
            className="kp-control"
          >
            {AUTO_REFRESH_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.ms ?? ''}>
                Auto refresh: {opt.label}
              </option>
            ))}
          </select>
        )}

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

        <SearchInput value={query} onValueChange={setQuery} placeholder="Search logs…" className="w-52" />

        {(query || levelFilter !== 'ALL') && (
          <span className="text-xs tabular-nums text-fg-subtle">
            {filteredLines.length}/{lines.length}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="ghost" onClick={() => setLines([])}>
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
          <Button variant="ghost" onClick={downloadLogs}>
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
        </div>
      </div>

      {streamError && (
        <p className="text-xs text-danger" role="alert">
          {streamError}
        </p>
      )}

      <LogViewer
        lines={filteredLines}
        query={query}
        emptyMessage={query || levelFilter !== 'ALL' ? 'No lines match your search.' : 'No log output yet.'}
        podName={`${target.namespace}/${target.podName}${target.containerName ? ` · ${target.containerName}` : ''}`}
      />
    </div>
  )
}
