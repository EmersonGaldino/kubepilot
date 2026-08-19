import { create } from 'zustand'

/** Whether the Settings drawer (see `SettingsDrawer.tsx`) is open. Lives in
 * a store rather than local component state because it needs to be toggled
 * from two independent places — the Sidebar's "Settings" button and the
 * tray menu's "Settings" item (via `useTrayNavigation`) — neither of which
 * is an ancestor of the other. */
interface SettingsDrawerState {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

export const useSettingsDrawerStore = create<SettingsDrawerState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
}))
