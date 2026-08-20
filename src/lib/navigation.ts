import {
  Archive,
  Boxes,
  Clock,
  Copy,
  Cpu,
  Database,
  FileText,
  Gauge,
  Globe,
  HardDrive,
  Key,
  Layers,
  LayoutDashboard,
  ListTree,
  Network,
  PlayCircle,
  ScrollText,
  ServerCog,
  SquareStack,
  type LucideIcon,
} from 'lucide-react'

/** Shared source of truth for in-app navigation — consumed by the Sidebar
 * (grouped, collapsible) and the command palette (flat, searchable) so the
 * two never drift out of sync. */
export type NavLinkItem = { to: string; label: string; icon: LucideIcon; end?: boolean }

export const CLUSTER_LINKS: NavLinkItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/nodes', label: 'Nodes', icon: ServerCog, end: false },
  { to: '/namespaces', label: 'Namespaces', icon: Layers, end: false },
]

export type NavSegment = {
  key: string
  label: string
  /** Shown on the group header itself — including while collapsed, so a
   * closed segment still reads as "Workloads"/"Storage"/etc. at a glance
   * instead of just a chevron and text. */
  icon: LucideIcon
  links: NavLinkItem[]
}

export const NAV_SEGMENTS: NavSegment[] = [
  {
    key: 'workloads',
    label: 'Workloads',
    icon: Boxes,
    links: [
      { to: '/pods', label: 'Pods', icon: Boxes },
      { to: '/deployments', label: 'Deployments', icon: SquareStack },
      { to: '/statefulsets', label: 'StatefulSets', icon: Database },
      { to: '/daemonsets', label: 'DaemonSets', icon: Cpu },
      { to: '/replicasets', label: 'ReplicaSets', icon: Copy },
      { to: '/jobs', label: 'Jobs', icon: PlayCircle },
      { to: '/cronjobs', label: 'CronJobs', icon: Clock },
    ],
  },
  {
    key: 'networking',
    label: 'Networking',
    icon: Network,
    links: [
      { to: '/services', label: 'Services', icon: Network },
      { to: '/ingresses', label: 'Ingresses', icon: Globe },
      { to: '/hpa', label: 'HPA', icon: Gauge },
    ],
  },
  {
    key: 'storage',
    label: 'Storage',
    icon: HardDrive,
    links: [
      { to: '/pvcs', label: 'PVCs', icon: HardDrive },
      { to: '/pvs', label: 'PVs', icon: Database },
      { to: '/storageclasses', label: 'StorageClasses', icon: Archive },
    ],
  },
  {
    key: 'config',
    label: 'Config & Secrets',
    icon: FileText,
    links: [
      { to: '/configmaps', label: 'ConfigMaps', icon: FileText },
      { to: '/secrets', label: 'Secrets', icon: Key },
    ],
  },
  {
    key: 'observability',
    label: 'Observability',
    icon: ScrollText,
    links: [
      { to: '/logs', label: 'Logs', icon: ScrollText },
      { to: '/events', label: 'Events', icon: ListTree },
    ],
  },
]

/** Flat view of every page in the app, tagged with the group it belongs to —
 * what the command palette searches over. */
export const ALL_NAV_ITEMS: Array<NavLinkItem & { group: string }> = [
  ...CLUSTER_LINKS.map((link) => ({ ...link, group: 'Cluster' })),
  ...NAV_SEGMENTS.flatMap((segment) => segment.links.map((link) => ({ ...link, group: segment.label }))),
]
