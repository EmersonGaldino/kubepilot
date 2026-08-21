import { Download, FolderSearch, ScrollText, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { DeploymentLogsView, type LogsPageGroupTarget } from '@/components/logs/DeploymentLogsView'
import { LogViewer } from '@/components/logs/LogViewer'
import { PodLogTargetPicker } from '@/components/logs/PodLogTargetPicker'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { SearchInput } from '@/components/ui/SearchInput'
import { ALL_LOG_LEVELS, logLineMatchesFilter, type LogLevelFilter } from '@/lib/logLineParser'
import { kubernetesApi } from '@/services/kubernetesApi'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import { useClusterStore } from '@/stores/useClusterStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
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
  const podsStatus = usePodStore((s) => s.status)
  const loadPods = usePodStore((s) => s.loadPods)
  const currentContext = useClusterStore((s) => s.currentContext)
  const addActivity = useWorkspaceStore((s) => s.addOrUpdate)
  const setActivityState = useWorkspaceStore((s) => s.setState)

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
  const [pickerOpen, setPickerOpen] = useState(false)

  const activityId = target ? `logs:${target.namespace}/${target.podName}:${target.containerName ?? ''}` : null

  useEffect(() => {
    if (!target || !activityId) return
    addActivity({ id: activityId, kind: 'logs', state: following ? 'live' : 'idle', title: `Logs · ${target.podName}`, contextName: currentContext, namespace: target.namespace, resourceName: target.podName, containerName: target.containerName, route: '/logs' })
    return () => setActivityState(activityId, 'ended')
  }, [activityId, addActivity, currentContext, following, setActivityState, target])

  const streamIdRef = useRef<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (currentContext) void loadPods(namespaceFilter)
  }, [currentContext, loadPods, namespaceFilter])

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
        setTarget((current) => {
          if (!current || current.namespace !== target.namespace || current.podName !== target.podName || current.containerName) return current
          const firstContainer = detail.containers[0]?.name
          return firstContainer ? { ...current, containerName: firstContainer } : current
        })
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
    return (
      <div className="flex min-h-0 flex-1 flex-col p-5">
        <PodLogTargetPicker
          pods={pods}
          namespaceFilter={namespaceFilter}
          loading={podsStatus === 'loading'}
          onSelect={(pod) => setTarget({ namespace: pod.namespace, podName: pod.name })}
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-5">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border-subtle bg-surface-1 px-3 py-2.5 shadow-[0_10px_28px_-24px_rgb(0_0_0_/_0.9)]">
        <div className="mr-auto flex min-w-0 items-center gap-2.5 pr-2">
          <div className="rounded-md bg-accent/15 p-1.5 text-accent-hover">
            <ScrollText className="h-4 w-4" strokeWidth={1.7} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-fg">{target.podName}</p>
            <p className="truncate text-xs text-fg-subtle">{target.namespace}{target.containerName ? ` · ${target.containerName}` : ''}</p>
          </div>
          <Button variant="ghost" onClick={() => setPickerOpen(true)} className="shrink-0">
            <FolderSearch className="h-3.5 w-3.5" />
            Change pod
          </Button>
        </div>
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

        <Button
          variant={following ? 'primary' : 'secondary'}
          onClick={() => setFollowing((v) => !v)}
        >
          {following ? 'Following' : 'Follow logs'}
        </Button>

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

        <span className="rounded-md bg-white/[0.04] px-2 py-1 text-xs tabular-nums text-fg-subtle" title="Visible lines / received lines">
          {filteredLines.length}/{lines.length}
        </span>

        <div className="flex items-center gap-1.5">
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
        following={following}
      />

      {pickerOpen && (
        <Drawer title="Choose a pod" subtitle="Search the current cluster" onClose={() => setPickerOpen(false)}>
          <PodLogTargetPicker
            pods={pods}
            namespaceFilter={namespaceFilter}
            loading={podsStatus === 'loading'}
            onSelect={(pod) => {
              setTarget({ namespace: pod.namespace, podName: pod.name })
              setPickerOpen(false)
            }}
          />
        </Drawer>
      )}
    </div>
  )
}
