import clsx from 'clsx'
import { ChevronRight, Settings } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import { CLUSTER_LINKS, NAV_SEGMENTS, type NavSegment } from '@/lib/navigation'
import { useSettingsDrawerStore } from '@/stores/useSettingsDrawerStore'

import { ClusterDropdown } from './ClusterDropdown'

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

function SegmentGroup({ segment, defaultExpanded = true }: { segment: NavSegment; defaultExpanded?: boolean }) {
  const location = useLocation()
  const hasActiveChild = segment.links.some((link) => location.pathname === link.to)
  const [expanded, setExpanded] = useState(defaultExpanded)
  const open = expanded || hasActiveChild

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={open}
        className="flex min-h-8 w-full items-center gap-1.5 rounded-md px-1 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle transition-colors hover:text-fg-muted"
      >
        <ChevronRight className={clsx('h-3.5 w-3.5 shrink-0 transition-transform duration-150', open && 'rotate-90')} strokeWidth={2} />
        <segment.icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
        {segment.label}
      </button>

      {open && (
        <div className="space-y-0.5 pl-1">
          {segment.links.map(({ to, label, icon: Icon }) => (
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
  const settingsOpen = useSettingsDrawerStore((s) => s.open)
  const toggleSettings = useSettingsDrawerStore((s) => s.toggle)

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border-subtle bg-surface-1">
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <ClusterDropdown />

        <SectionLabel>Cluster</SectionLabel>
        <nav className="space-y-0.5">
          {CLUSTER_LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => navLinkClasses(isActive)}>
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-1 space-y-1">
          {NAV_SEGMENTS.map((segment) => (
            <SegmentGroup key={segment.key} segment={segment} defaultExpanded={segment.key === 'workloads'} />
          ))}
        </div>
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
