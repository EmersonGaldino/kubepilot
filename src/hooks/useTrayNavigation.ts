import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { kubernetesApi } from '@/services/kubernetesApi'
import { useClusterStore } from '@/stores/useClusterStore'
import { useDeploymentStore } from '@/stores/useDeploymentStore'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import { usePodStore } from '@/stores/usePodStore'
import { useSettingsDrawerStore } from '@/stores/useSettingsDrawerStore'

/** Reacts to menu-bar tray actions: "Open KubePilot" focuses the window
 * (handled entirely in main), "Refresh" re-fetches current data, "Settings"
 * opens the Settings drawer (it's a toggleable panel, not a routed page —
 * see SettingsDrawer.tsx), anything else is treated as a route to navigate
 * to. */
export function useTrayNavigation(): void {
  const navigate = useNavigate()
  const loadClusterInfo = useClusterStore((s) => s.loadClusterInfo)
  const loadNamespaces = useNamespaceStore((s) => s.loadNamespaces)
  const selectedNamespace = useNamespaceStore((s) => s.selected)
  const loadPods = usePodStore((s) => s.loadPods)
  const loadDeployments = useDeploymentStore((s) => s.loadDeployments)
  const openSettings = useSettingsDrawerStore((s) => s.setOpen)

  useEffect(() => {
    return kubernetesApi.tray.onNavigate((route) => {
      if (route === 'refresh') {
        void loadClusterInfo()
        void loadNamespaces()
        void loadPods(selectedNamespace)
        void loadDeployments(selectedNamespace)
        return
      }
      if (route === '/settings') {
        openSettings(true)
        return
      }
      navigate(route)
    })
  }, [navigate, loadClusterInfo, loadNamespaces, loadPods, loadDeployments, selectedNamespace, openSettings])
}
