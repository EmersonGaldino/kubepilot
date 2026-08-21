import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProductSettingsState {
  onboardingComplete: boolean
  telemetryOptIn: boolean
  completeOnboarding: () => void
  setTelemetryOptIn: (enabled: boolean) => void
}

/** Product-level preferences are deliberately renderer-local. Telemetry is
 * opt-in only and this store never records cluster or resource data. */
export const useProductSettingsStore = create<ProductSettingsState>()(
  persist(
    (set) => ({
      onboardingComplete: false,
      telemetryOptIn: false,
      completeOnboarding: () => set({ onboardingComplete: true }),
      setTelemetryOptIn: (telemetryOptIn) => set({ telemetryOptIn }),
    }),
    { name: 'kubepilot.product-settings' },
  ),
)
