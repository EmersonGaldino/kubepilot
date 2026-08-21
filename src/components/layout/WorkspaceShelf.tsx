import { Activity, FileCode2, Terminal, Unplug, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { IconButton } from '@/components/ui/IconButton'
import { useWorkspaceStore, type WorkspaceActivity, type WorkspaceActivityKind } from '@/stores/useWorkspaceStore'

const ICONS: Record<WorkspaceActivityKind, typeof Activity> = {
  logs: Activity,
  exec: Terminal,
  yaml: FileCode2,
  portforward: Unplug,
}

const STATE_CLASS: Record<WorkspaceActivity['state'], string> = {
  live: 'bg-emerald-400',
  idle: 'bg-fg-subtle',
  error: 'bg-danger',
  ended: 'bg-fg-subtle/50',
}

export function WorkspaceShelf() {
  const activities = useWorkspaceStore((state) => state.activities)
  const remove = useWorkspaceStore((state) => state.remove)
  const clearEnded = useWorkspaceStore((state) => state.clearEnded)
  const navigate = useNavigate()

  if (activities.length === 0) return null

  return (
    <section className="border-t border-border-subtle bg-surface-1/95 px-3 py-2 backdrop-blur-xl" aria-label="Incident workspace">
      <div className="flex items-center gap-2 overflow-x-auto">
        <div className="flex shrink-0 items-center gap-1.5 px-1 text-xs font-medium text-fg-muted">
          <Activity className="h-3.5 w-3.5 text-accent-hover" />
          Workspace
        </div>
        {activities.map((activity) => {
          const Icon = ICONS[activity.kind]
          return (
            <div key={activity.id} className="flex shrink-0 items-center gap-1 rounded-md border border-border-subtle bg-surface-2 pl-2 pr-1">
              <button
                type="button"
                onClick={() =>
                  navigate(activity.route, {
                    state:
                      activity.kind === 'logs' && activity.namespace && activity.resourceName
                        ? { namespace: activity.namespace, podName: activity.resourceName, containerName: activity.containerName }
                        : undefined,
                  })
                }
                className="flex min-w-0 items-center gap-1.5 py-1.5 text-left text-xs hover:text-fg"
              >
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATE_CLASS[activity.state]}`} />
                <Icon className="h-3.5 w-3.5 shrink-0 text-fg-subtle" />
                <span className="max-w-40 truncate text-fg-muted">{activity.title}</span>
              </button>
              <IconButton label={`Close ${activity.title}`} onClick={() => remove(activity.id)} className="h-6 w-6">
                <X className="h-3.5 w-3.5" />
              </IconButton>
            </div>
          )
        })}
        {activities.some((activity) => activity.state === 'ended') && (
          <button type="button" onClick={clearEnded} className="shrink-0 text-xs text-fg-subtle hover:text-fg">
            Clear ended
          </button>
        )}
      </div>
    </section>
  )
}
