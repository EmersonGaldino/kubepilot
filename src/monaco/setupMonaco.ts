import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { configureMonacoYaml } from 'monaco-yaml'

import type { DescribableKind } from '@shared/types'

import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import { kubernetesResourceSchema } from './kubernetesSchema'
import YamlWorker from './yaml.worker.js?worker'

self.MonacoEnvironment = {
  getWorker(_moduleId: string, label: string) {
    if (label === 'yaml') return new YamlWorker()
    return new EditorWorker()
  },
}

loader.config({ monaco })

export const monacoYaml = configureMonacoYaml(monaco, {
  validate: true,
  completion: true,
  hover: true,
  format: true,
  enableSchemaRequest: false,
  isKubernetes: true,
  yamlVersion: '1.2',
  schemas: [
    {
      uri: 'inmemory://kubepilot/kubernetes-resource.schema.json',
      fileMatch: ['**/*.yaml', '**/*.yml'],
      schema: kubernetesResourceSchema(),
    },
  ],
})

monaco.editor.defineTheme('kubepilot-yaml', {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#0b0f14',
    'editor.foreground': '#9aabbd',
    'editorLineNumber.foreground': '#7d8fa3',
    'editorLineNumber.activeForeground': '#e8eef7',
    'editorCursor.foreground': '#3b82f6',
    'editor.selectionBackground': '#1d3a63',
    'editor.lineHighlightBackground': '#171d27',
    'editorWidget.background': '#11161e',
    'editorWidget.border': '#273040',
    'editorSuggestWidget.background': '#11161e',
    'editorSuggestWidget.border': '#273040',
    'editorSuggestWidget.selectedBackground': '#1e2633',
    'editorHoverWidget.background': '#11161e',
    'editorHoverWidget.border': '#273040',
    'scrollbarSlider.background': '#27304088',
    'scrollbarSlider.hoverBackground': '#3a4658',
  },
})

export function applyKubernetesYamlSchema(kind?: DescribableKind): void {
  monacoYaml.update({
    schemas: [
      {
        uri: 'inmemory://kubepilot/kubernetes-resource.schema.json',
        fileMatch: ['**/*.yaml', '**/*.yml'],
        schema: kubernetesResourceSchema(kind),
      },
    ],
  })
}
