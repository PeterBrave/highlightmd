import { useEffect, useRef } from 'react'
import { EditorView } from '@codemirror/view'
import type { DocBlock, HighlightMode } from '@highlightmd/core'
import {
  createDocumentEditorState,
  syncDocumentBlocks,
  type DocumentEditorConfig,
} from '../lib/editor/documentEditor'
import { refreshBlockDecorations } from '../lib/editor/blockPreview'
import { setDocBlocks } from '../lib/editor/blockState'

interface DocumentEditorProps {
  source: string
  blocks: DocBlock[]
  mode: HighlightMode
  renderLimit: number
  fontSize: number
  lineHeight: number
  onSourceChange: (nextSource: string) => void
}

export function DocumentEditor({
  source,
  blocks,
  mode,
  renderLimit,
  fontSize,
  lineHeight,
  onSourceChange,
}: DocumentEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<EditorView | null>(null)
  const editorSourceRef = useRef(source)
  const onSourceChangeRef = useRef(onSourceChange)
  const modeRef = useRef(mode)
  const renderLimitRef = useRef(renderLimit)

  onSourceChangeRef.current = onSourceChange
  modeRef.current = mode
  renderLimitRef.current = renderLimit

  const configRef = useRef<DocumentEditorConfig>({
    initialBlocks: blocks,
    getMode: () => modeRef.current,
    getRenderLimit: () => renderLimitRef.current,
    onDocChange: (nextText) => {
      editorSourceRef.current = nextText
      onSourceChangeRef.current(nextText)
    },
  })

  configRef.current = {
    initialBlocks: blocks,
    getMode: configRef.current.getMode,
    getRenderLimit: configRef.current.getRenderLimit,
    onDocChange: configRef.current.onDocChange,
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const view = new EditorView({
      state: createDocumentEditorState(source, {
        ...configRef.current,
        initialBlocks: blocks,
      }),
      parent: container,
    })
    viewRef.current = view
    editorSourceRef.current = source

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return

    if (editorSourceRef.current === source) return

    editorSourceRef.current = source
    const currentDoc = view.state.doc.toString()
    if (currentDoc === source) return

    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: source },
      effects: setDocBlocks.of(blocks),
    })
  }, [source, blocks])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    syncDocumentBlocks(view, blocks)
  }, [blocks])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    view.dispatch({ effects: refreshBlockDecorations.of(null) })
  }, [mode, renderLimit])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    view.dom.style.fontSize = `${fontSize}px`
    view.dom.style.lineHeight = String(lineHeight)
  }, [fontSize, lineHeight])

  return (
    <div
      className="document-editor markdown-body markdown-reader"
      ref={containerRef}
      style={{ fontSize, lineHeight }}
    />
  )
}
