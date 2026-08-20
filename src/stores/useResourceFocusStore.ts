import { create } from 'zustand'

/** Kinds the command palette can search across and hand off to a resource
 * page — see `RESOURCE_SEARCH_KINDS` in `@/lib/resourceSearch`. */
export type ResourceFocusKind =
  | 'pods'
  | 'deployments'
  | 'statefulsets'
  | 'daemonsets'
  | 'replicasets'
  | 'jobs'
  | 'cronjobs'
  | 'services'
  | 'ingresses'
  | 'hpa'
  | 'pvcs'
  | 'configmaps'
  | 'secrets'

export interface ResourceFocus {
  kind: ResourceFocusKind
  namespace: string
  name: string
}

/** A one-shot "open this specific item" request, set by the command palette
 * right before it navigates to a resource page. The target page's
 * `useResourceFocus` hook picks it up once the matching row shows up in its
 * freshly loaded list, opens its details drawer, and clears it — so it never
 * fires again on a later visit to the same page. */
interface ResourceFocusState {
  focus: ResourceFocus | null
  setFocus: (focus: ResourceFocus) => void
  clearFocus: () => void
}

export const useResourceFocusStore = create<ResourceFocusState>((set) => ({
  focus: null,
  setFocus: (focus) => set({ focus }),
  clearFocus: () => set({ focus: null }),
}))
