import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ClusterProfile } from '@shared/types'

/** Per-context display preferences — a custom alias and favorite/pinned
 * status — keyed by kubeconfig context name. Purely a renderer-local UI
 * preference (never touches the kubeconfig file itself), persisted to
 * localStorage so it survives app restarts. */
interface ClusterPrefsState {
  aliases: Record<string, string>
  favorites: Record<string, boolean>
  profiles: Record<string, ClusterProfile>

  setAlias: (contextName: string, alias: string | null) => void
  toggleFavorite: (contextName: string) => void
  setProfile: (contextName: string, profile: ClusterProfile) => void
}

export const useClusterPrefsStore = create<ClusterPrefsState>()(
  persist(
    (set) => ({
      aliases: {},
      favorites: {},
      profiles: {},

      setAlias: (contextName, alias) =>
        set((s) => {
          const aliases = { ...s.aliases }
          if (alias) aliases[contextName] = alias
          else delete aliases[contextName]
          return { aliases }
        }),

      toggleFavorite: (contextName) =>
        set((s) => {
          const favorites = { ...s.favorites }
          if (favorites[contextName]) delete favorites[contextName]
          else favorites[contextName] = true
          return { favorites }
        }),

      setProfile: (contextName, profile) => set((state) => ({ profiles: { ...state.profiles, [contextName]: profile } })),
    }),
    { name: 'kubepilot.cluster-prefs' },
  ),
)
