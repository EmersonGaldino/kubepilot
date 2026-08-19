import clsx from 'clsx'
import {
  Boxes,
  ChevronRight,
  Clock,
  Copy,
  Cpu,
  Database,
  FileText,
  Key,
  LayoutDashboard,
  ListTree,
  Network,
  PlayCircle,
  ScrollText,
  Settings,
  SquareStack,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import { SearchInput } from '@/components/ui/SearchInput'
import { useClusterPrefsStore } from '@/stores/useClusterPrefsStore'
import { useClusterStore } from '@/stores/useClusterStore'
import { useSettingsDrawerStore } from '@/stores/useSettingsDrawerStore'

import { ClusterCard } from './ClusterCard'

const TOP_LINKS = [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }]

const WORKLOAD_LINKS = [
  { to: '/pods', label: 'Pods', icon: Boxes },
  { to: '/deployments', label: 'Deployments', icon: SquareStack },
  { to: '/statefulsets', label: 'StatefulSets', icon: Database },
  { to: '/daemonsets', label: 'DaemonSets', icon: Cpu },
  { to: '/replicasets', label: 'ReplicaSets', icon: Copy },
  { to: '/jobs', label: 'Jobs', icon: PlayCircle },
  { to: '/cronjobs', label: 'CronJobs', icon: Clock },
]

const OTHER_LINKS = [
  { to: '/logs', label: 'Logs', icon: ScrollText },
  { to: '/services', label: 'Services', icon: Network },
  { to: '/configmaps', label: 'ConfigMaps', icon: FileText },
  { to: '/secrets', label: 'Secrets', icon: Key },
  { to: '/events', label: 'Events', icon: ListTree },
]

function navLinkClasses(isActive: boolean) {
  return clsx(
    'flex min-h-8 items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors duration-150',
    isActive
      ? 'bg-accent/15 font-medium text-blue-200'
      : 'text-fg-muted hover:bg-white/[0.05] hover:text-fg',
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="px-2.5 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">{children}</p>
  )
}

function WorkloadsGroup() {
  const location = useLocation()
  const hasActiveChild = WORKLOAD_LINKS.some((link) => location.pathname === link.to)
  const [expanded, setExpanded] = useState(true)
  const open = expanded || hasActiveChild

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={open}
        className="flex min-h-8 w-full items-center gap-1.5 rounded-md px-1 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle transition-colors hover:text-fg-muted"
      >
        <ChevronRight className={clsx('h-3.5 w-3.5 transition-transform duration-150', open && 'rotate-90')} strokeWidth={2} />
        Workloads
      </button>

      {open && (
        <div className="space-y-0.5 pl-1">
          {WORKLOAD_LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => navLinkClasses(isActive)}>
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  const contexts = useClusterStore((s) => s.contexts)
  const switchContext = useClusterStore((s) => s.switchContext)
  const infoStatus = useClusterStore((s) => s.infoStatus)
  const settingsOpen = useSettingsDrawerStore((s) => s.open)
  const toggleSettings = useSettingsDrawerStore((s) => s.toggle)

  const aliases = useClusterPrefsStore((s) => s.aliases)
  const favorites = useClusterPrefsStore((s) => s.favorites)
  const setAlias = useClusterPrefsStore((s) => s.setAlias)
  const toggleFavorite = useClusterPrefsStore((s) => s.toggleFavorite)

  const [clusterQuery, setClusterQuery] = useState('')

  const sortedContexts = useMemo(() => {
    return [...contexts].sort((a, b) => {
      const favDiff = (favorites[b.name] ? 1 : 0) - (favorites[a.name] ? 1 : 0)
      if (favDiff !== 0) return favDiff
      return (aliases[a.name] ?? a.name).localeCompare(aliases[b.name] ?? b.name)
    })
  }, [contexts, aliases, favorites])

  const visibleContexts = useMemo(() => {
    const needle = clusterQuery.trim().toLowerCase()
    if (!needle) return sortedContexts
    return sortedContexts.filter((ctx) => {
      const alias = aliases[ctx.name]
      return ctx.name.toLowerCase().includes(needle) || (alias?.toLowerCase().includes(needle) ?? false)
    })
  }, [sortedContexts, clusterQuery, aliases])

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border-subtle bg-surface-1">
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <SectionLabel>Clusters</SectionLabel>
        {contexts.length > 4 && (
          <SearchInput
            value={clusterQuery}
            onValueChange={setClusterQuery}
            placeholder="Filter clusters…"
            className="mb-2 px-1"
          />
        )}
        <div className="space-y-1">
          {contexts.length === 0 && <p className="px-2.5 py-1 text-xs text-fg-subtle">No contexts found</p>}
          {contexts.length > 0 && visibleContexts.length === 0 && (
            <p className="px-2.5 py-1 text-xs text-fg-subtle">No clusters match “{clusterQuery.trim()}”</p>
          )}
          {visibleContexts.map((ctx) => (
            <ClusterCard
              key={ctx.name}
              context={ctx}
              alias={aliases[ctx.name] ?? null}
              favorite={Boolean(favorites[ctx.name])}
              switching={ctx.isCurrent && infoStatus === 'loading'}
              onSelect={() => void switchContext(ctx.name)}
              onToggleFavorite={() => toggleFavorite(ctx.name)}
              onRename={(alias) => setAlias(ctx.name, alias)}
            />
          ))}
        </div>

        <SectionLabel>Resources</SectionLabel>
        <nav className="space-y-0.5">
          {TOP_LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => navLinkClasses(isActive)}>
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-1">
          <WorkloadsGroup />
        </div>

        <nav className="mt-1 space-y-0.5">
          {OTHER_LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => navLinkClasses(isActive)}>
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="border-t border-border-subtle px-2 py-2">
        <button type="button" onClick={toggleSettings} className={clsx('w-full', navLinkClasses(settingsOpen))}>
          <Settings className="h-4 w-4" strokeWidth={1.75} />
          Settings
        </button>
      </div>
    </aside>
  )
}
