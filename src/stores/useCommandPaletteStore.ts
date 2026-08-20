import { create } from 'zustand'

/** Whether the ⌘K command palette (see `CommandPalette.tsx`) is open. Lives
 * in a store — like `useSettingsDrawerStore` — rather than local component
 * state because the global ⌘K shortcut lives in `AppLayout` while the
 * palette itself may want to be toggled from elsewhere later (e.g. a menu
 * item or the tray). */
interface CommandPaletteState {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

export const useCommandPaletteStore = create<CommandPaletteState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
}))
