import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { kubernetesApi } from '@/services/kubernetesApi'
import { refreshCurrentView } from '@/lib/refreshCurrentView'
import { useNamespaceStore } from '@/stores/useNamespaceStore'
import { useSettingsDrawerStore } from '@/stores/useSettingsDrawerStore'

export function useTrayNavigation(): void {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const selectedNamespace = useNamespaceStore((s) => s.selected)
  const openSettings = useSettingsDrawerStore((s) => s.setOpen)

  useEffect(() => {
    return kubernetesApi.tray.onNavigate((route) => {
      if (route === 'refresh') {
        refreshCurrentView(pathname, selectedNamespace)
        return
      }
      if (route === '/settings') {
        openSettings(true)
        return
      }
      navigate(route)
    })
  }, [navigate, pathname, selectedNamespace, openSettings])
}
