import { Editor, type OnMount } from '@monaco-editor/react'
import { useEffect, useId, useMemo } from 'react'
import type { editor } from 'monaco-editor'

import type { DescribableKind } from '@shared/types'

import { inferKindFromYaml } from '@/monaco/kubernetesSchema'
import { applyKubernetesYamlSchema } from '@/monaco/setupMonaco'

export function YamlEditor({
  value,
  onChange,
  readOnly = false,
  kind,
  onReady,
}: {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  kind?: DescribableKind
  onReady?: (editor: editor.IStandaloneCodeEditor) => void
}) {
  const id = useId().replace(/:/g, '')
  const schemaKind = useMemo(() => kind ?? inferKindFromYaml(value), [kind, value])

  useEffect(() => {
    applyKubernetesYamlSchema(schemaKind)
  }, [schemaKind])

  const handleMount: OnMount = (instance) => {
    onReady?.(instance)
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden rounded-md border border-border-subtle">
      <Editor
        height="100%"
        path={`kubepilot-${id}.yaml`}
        language="yaml"
        theme="kubepilot-yaml"
        value={value}
        onChange={(next) => onChange(next ?? '')}
        onMount={handleMount}
        loading={<p className="p-3 text-xs text-fg-muted">Loading editor…</p>}
        options={{
          readOnly,
          automaticLayout: true,
          minimap: { enabled: false },
          fontSize: 12,
          fontFamily: "ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace",
          lineNumbers: 'on',
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          padding: { top: 8, bottom: 8 },
          formatOnPaste: true,
          formatOnType: false,
          quickSuggestions: { other: true, comments: false, strings: true },
          suggestOnTriggerCharacters: true,
          tabCompletion: 'on',
          scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
          renderLineHighlight: 'line',
          overviewRulerLanes: 0,
          folding: true,
          glyphMargin: false,
          contextmenu: true,
        }}
      />
    </div>
  )
}
