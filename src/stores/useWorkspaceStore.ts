import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WorkspaceActivity, WorkspaceActivityKind, WorkspaceActivityState } from '@shared/types'

export type { WorkspaceActivity, WorkspaceActivityKind, WorkspaceActivityState }

interface WorkspaceState {
  activities: WorkspaceActivity[]
  addOrUpdate: (activity: Omit<WorkspaceActivity, 'createdAt'>) => void
  setState: (id: string, state: WorkspaceActivityState) => void
  remove: (id: string) => void
  clearEnded: () => void
}

/** A local task shelf. It stores navigation metadata only — never log lines,
 * YAML, commands, credentials, or port-forward socket identifiers. */
export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      activities: [],
      addOrUpdate: (activity) =>
        set((current) => {
          const existing = current.activities.find((item) => item.id === activity.id)
          const next = { ...activity, createdAt: existing?.createdAt ?? new Date().toISOString() }
          return { activities: [next, ...current.activities.filter((item) => item.id !== activity.id)].slice(0, 12) }
        }),
      setState: (id, state) => set((current) => ({ activities: current.activities.map((item) => (item.id === id ? { ...item, state } : item)) })),
      remove: (id) => set((current) => ({ activities: current.activities.filter((item) => item.id !== id) })),
      clearEnded: () => set((current) => ({ activities: current.activities.filter((item) => item.state !== 'ended') })),
    }),
    { name: 'kubepilot.workspace' },
  ),
)
