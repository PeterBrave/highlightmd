import { memo, useEffect, useMemo, useRef, useState } from 'react'
import {
  Download,
  Focus,
  Moon,
  PanelRight,
  Presentation,
  Sun,
  Type,
  Upload,
} from 'lucide-react'
import type { DocBlock, HighlightMode } from '@highlightmd/core'
import { segmentMarkdown } from './lib/blocks'
import { exportHtmlDocument, highlightCodeBlocksIn, renderMarkdownBlock } from './lib/markdown'
import { sampleMarkdown } from './lib/sample'

type Theme = 'light' | 'dark'

const modeLabels: Record<HighlightMode, string> = {
  light: 'Light',
  review: 'Review',
  pitch: 'Pitch',
  tech: 'Tech',
}

const defaultSource = localStorage.getItem('highlightmd:source') ?? sampleMarkdown
const initialRenderBlocks = 24
const renderBatchSize = 180
const maxAutosaveBytes = 512 * 1024

export function App() {
  const [source, setSource] = useState(defaultSource)
  const [mode, setMode] = useState<HighlightMode>('review')
  const [theme, setTheme] = useState<Theme>('light')
  const [fontSize, setFontSize] = useState(17)
  const [lineHeight, setLineHeight] = useState(1.7)
  const [showOutline, setShowOutline] = useState(true)
  const [presentation, setPresentation] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [fileName, setFileName] = useState('sample.md')
  const [renderLimit, setRenderLimit] = useState(initialRenderBlocks)
  const [blocks, setBlocks] = useState<DocBlock[]>([])
  const [segmentationMs, setSegmentationMs] = useState<number | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const requestIdRef = useRef(0)
  const editRangeRef = useRef<{ index: number; start: number; end: number } | null>(null)

  const visibleBlocks = useMemo(() => blocks.slice(0, renderLimit), [blocks, renderLimit])
  const outline = useMemo(() => extractOutline(blocks), [blocks])
  const isRendering = renderLimit < blocks.length

  useEffect(() => {
    if (!('Worker' in window)) return

    const worker = new Worker(new URL('./workers/markdownWorker.ts', import.meta.url), {
      type: 'module',
    })

    worker.onmessage = (
      event: MessageEvent<{ id: number; blocks: DocBlock[]; durationMs: number }>,
    ) => {
      if (event.data.id !== requestIdRef.current) return
      setBlocks(event.data.blocks)
      setSegmentationMs(event.data.durationMs)
    }

    workerRef.current = worker

    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [])

  useEffect(() => {
    const id = requestIdRef.current + 1
    requestIdRef.current = id
    setSegmentationMs(null)

    const worker = workerRef.current
    if (worker) {
      worker.postMessage({ id, source })
      return
    }

    const timeoutId = globalThis.setTimeout(() => {
      const startedAt = performance.now()
      const nextBlocks = segmentMarkdown(source)
      if (id !== requestIdRef.current) return
      setBlocks(nextBlocks)
      setSegmentationMs(performance.now() - startedAt)
    }, 0)

    return () => globalThis.clearTimeout(timeoutId)
  }, [source])

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (source.length <= maxAutosaveBytes) {
        localStorage.setItem('highlightmd:source', source)
      }
    }, 350)

    return () => window.clearTimeout(id)
  }, [source])

  useEffect(() => {
    let cancelled = false
    let currentLimit = Math.min(initialRenderBlocks, blocks.length)

    setRenderLimit(currentLimit)

    function pump() {
      if (cancelled || currentLimit >= blocks.length) return

      currentLimit = Math.min(currentLimit + renderBatchSize, blocks.length)
      setRenderLimit(currentLimit)

      if (currentLimit < blocks.length) {
        scheduleIdle(pump)
      }
    }

    let startupId: number | undefined
    if (currentLimit < blocks.length) {
      startupId = window.setTimeout(() => scheduleIdle(pump), 120)
    }

    return () => {
      cancelled = true
      if (startupId !== undefined) {
        window.clearTimeout(startupId)
      }
    }
  }, [blocks])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setPresentation(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file) return

    setFileName(file.name)
    file
      .text()
      .then((text) => {
        setSource(text)
      })
      .catch(() => {
        setSource('Unable to read this file.')
      })
  }

  function handleExport() {
    const renderedHtml = blocks.map((block) => renderMarkdownBlock(block.raw, mode)).join('\n')
    const doc = exportHtmlDocument(renderedHtml, fileName.replace(/\.md$/i, ''))
    const blob = new Blob([doc], { type: 'text/html;charset=utf-8' })
    const href = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = `${fileName.replace(/\.md$/i, '') || 'highlightmd'}.html`
    anchor.click()
    URL.revokeObjectURL(href)
  }

  function beginBlockEdit(block: DocBlock, index: number) {
    editRangeRef.current = { index, start: block.start, end: block.end }
    setEditingIndex(index)
  }

  function patchEditingBlock(index: number, nextRaw: string) {
    const range = editRangeRef.current
    if (!range || range.index !== index) return

    setSource((currentSource) => {
      const nextSource =
        currentSource.slice(0, range.start) + nextRaw + currentSource.slice(range.end)
      range.end = range.start + nextRaw.length
      return nextSource
    })
  }

  function endBlockEdit() {
    editRangeRef.current = null
    setEditingIndex(null)
  }

  return (
    <div
      className={[
        'app-shell',
        presentation ? 'is-presentation' : '',
        'reader-only',
      ].join(' ')}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        handleFiles(event.dataTransfer.files)
      }}
    >
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">M</span>
          <div>
            <strong>MarkLens</strong>
            <span>{fileName}</span>
          </div>
        </div>

        <div className="segmented" aria-label="Highlight mode">
          {(Object.keys(modeLabels) as HighlightMode[]).map((key) => (
            <button
              key={key}
              className={mode === key ? 'active' : ''}
              onClick={() => setMode(key)}
              type="button"
            >
              {modeLabels[key]}
            </button>
          ))}
        </div>

        <div className="reader-controls">
          <label>
            <Type size={16} />
            <input
              max="24"
              min="14"
              type="range"
              value={fontSize}
              onChange={(event) => setFontSize(Number(event.target.value))}
            />
          </label>
          <label>
            Line
            <input
              max="2.1"
              min="1.35"
              step="0.05"
              type="range"
              value={lineHeight}
              onChange={(event) => setLineHeight(Number(event.target.value))}
            />
          </label>
        </div>

        <div className="toolbar">
          <label className="icon-button" title="Open Markdown">
            <Upload size={18} />
            <input
              accept=".md,.markdown,text/markdown,text/plain"
              type="file"
              onChange={(event) => handleFiles(event.target.files)}
            />
          </label>
          <button title="Toggle outline" type="button" onClick={() => setShowOutline((v) => !v)}>
            <PanelRight size={18} />
          </button>
          <button title="Presentation mode" type="button" onClick={() => setPresentation((v) => !v)}>
            {presentation ? <Focus size={18} /> : <Presentation size={18} />}
          </button>
          <button title="Export HTML" type="button" onClick={handleExport}>
            <Download size={18} />
          </button>
          <button title="Theme" type="button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>

      <main className="workspace">
        <section className="reader-pane">
          <article
            className="markdown-body markdown-reader"
            style={{ fontSize, lineHeight }}
          >
            {visibleBlocks.map((block, index) => (
              <RenderedBlock
                block={block}
                blockIndex={index}
                isEditing={editingIndex === index}
                key={`${index}-${block.start}-${block.type}`}
                mode={mode}
                onBeginEdit={() => beginBlockEdit(block, index)}
                onEndEdit={endBlockEdit}
                onPatch={patchEditingBlock}
              />
            ))}
            {isRendering && (
              <div className="render-progress" aria-live="polite">
                Rendering {Math.min(renderLimit, blocks.length).toLocaleString()} /{' '}
                {blocks.length.toLocaleString()} blocks
              </div>
            )}
            {blocks.length === 0 && (
              <div className="render-progress" aria-live="polite">
                Preparing document...
              </div>
            )}
          </article>
        </section>

        {showOutline && (
          <aside className="outline-pane">
            {segmentationMs !== null && (
              <span className="outline-meta">
                {blocks.length.toLocaleString()} blocks · {Math.round(segmentationMs)}ms
              </span>
            )}
            {outline.length > 0 ? (
              outline.map((item) => (
                <a
                  href={`#${item.id}`}
                  key={`${item.id}-${item.text}`}
                  style={{ paddingLeft: (item.level - 1) * 12 }}
                >
                  {item.text}
                </a>
              ))
            ) : (
              <span className="empty-outline">No headings</span>
            )}
          </aside>
        )}
      </main>
    </div>
  )
}

const RenderedBlock = memo(function RenderedBlock({
  block,
  blockIndex,
  isEditing,
  mode,
  onBeginEdit,
  onEndEdit,
  onPatch,
}: {
  block: DocBlock
  blockIndex: number
  isEditing: boolean
  mode: HighlightMode
  onBeginEdit: () => void
  onEndEdit: () => void
  onPatch: (index: number, nextRaw: string) => void
}) {
  const blockRef = useRef<HTMLElement | null>(null)
  const [draft, setDraft] = useState(block.raw)
  const html = useMemo(() => renderMarkdownBlock(block.raw, mode), [block.hash, block.raw, mode])
  const draftHtml = useMemo(() => renderMarkdownBlock(draft, mode), [draft, mode])

  useEffect(() => {
    if (!isEditing) {
      setDraft(block.raw)
    }
  }, [block.raw, isEditing])

  useEffect(() => {
    const element = blockRef.current
    if (!element || block.type !== 'code') return

    if (!('IntersectionObserver' in window)) {
      highlightCodeBlocksIn(element)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          highlightCodeBlocksIn(element)
          observer.disconnect()
        }
      },
      { rootMargin: '600px 0px' },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [block.hash, block.type, html])

  return (
    <section
      className={`ml-block ml-block-${block.type} ${isEditing ? 'is-editing-block' : ''}`}
      data-block-id={block.id}
      onDoubleClick={onBeginEdit}
      ref={blockRef}
    >
      {isEditing ? (
        <div className="block-editor">
          <textarea
            autoFocus
            className="block-editor-input"
            spellCheck={false}
            value={draft}
            onBlur={onEndEdit}
            onChange={(event) => {
              const nextDraft = event.currentTarget.value
              setDraft(nextDraft)
              onPatch(blockIndex, nextDraft)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.currentTarget.blur()
              }
            }}
          />
          <div
            className="block-editor-preview"
            dangerouslySetInnerHTML={{ __html: draftHtml }}
          />
        </div>
      ) : (
        <>
          <button
            aria-label="Edit block"
            className="block-edit-button"
            onClick={onBeginEdit}
            type="button"
          >
            Edit
          </button>
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </>
      )}
    </section>
  )
})

function extractOutline(blocks: DocBlock[]) {
  return blocks
    .filter((block) => block.type === 'heading')
    .map((block) => {
      const match = /^(#{1,4})\s+(.+)$/.exec(block.raw.trim())
      if (!match) return null

      const text = match[2].replace(/[#*_`]/g, '').trim()
      return {
        level: match[1].length,
        text,
        id: text
          .toLowerCase()
          .replace(/[^\p{L}\p{N}]+/gu, '-')
          .replace(/^-|-$/g, ''),
      }
    })
    .filter((item): item is { level: number; text: string; id: string } => Boolean(item))
}

function scheduleIdle(callback: () => void) {
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(callback, { timeout: 120 })
    return () => window.cancelIdleCallback(id)
  }

  const id = globalThis.setTimeout(callback, 16)
  return () => globalThis.clearTimeout(id)
}
