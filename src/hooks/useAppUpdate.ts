import { useCallback, useEffect, useState } from 'react'

export type UpdateStage = 'idle' | 'available' | 'downloading' | 'downloaded' | 'error'

export interface UpdateState {
  stage: UpdateStage
  version: string | null
  percent: number
  error: string | null
}

const IDLE_STATE: UpdateState = { stage: 'idle', version: null, percent: 0, error: null }

/** Drives the "new version available" toast: main process checks for
 * updates on its own schedule and pushes events here — this hook just
 * tracks the resulting state and exposes the two user-initiated actions
 * (download, then restart-to-install). */
export function useAppUpdate() {
  const [state, setState] = useState<UpdateState>(IDLE_STATE)

  useEffect(() => {
    const offAvailable = window.kubepilot.update.onAvailable((version) => {
      setState({ stage: 'available', version, percent: 0, error: null })
    })
    const offProgress = window.kubepilot.update.onProgress((progress) => {
      setState((prev) => ({ ...prev, stage: 'downloading', percent: progress.percent }))
    })
    const offDownloaded = window.kubepilot.update.onDownloaded((version) => {
      setState((prev) => ({ ...prev, stage: 'downloaded', version: version ?? prev.version, percent: 100 }))
    })
    const offError = window.kubepilot.update.onError((error) => {
      setState((prev) => ({ ...prev, stage: 'error', error }))
    })

    return () => {
      offAvailable()
      offProgress()
      offDownloaded()
      offError()
    }
  }, [])

  const download = useCallback(async () => {
    setState((prev) => ({ ...prev, stage: 'downloading', percent: 0, error: null }))
    const result = await window.kubepilot.update.download()
    if (!result.ok) {
      setState((prev) => ({ ...prev, stage: 'error', error: result.error }))
    }
  }, [])

  const install = useCallback(async () => {
    await window.kubepilot.update.install()
  }, [])

  const dismiss = useCallback(() => setState(IDLE_STATE), [])

  return { state, download, install, dismiss }
}
