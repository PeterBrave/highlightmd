import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Focus,
  Moon,
  PanelLeft,
  PanelRight,
  Presentation,
  Settings2,
  Sparkles,
  Sun,
  Upload,
} from 'lucide-react'
import { BlockEditor, type BlockEditorHandle, type HeadingItem } from './components/BlockEditor'
import { AiSettingsModal } from './components/AiSettingsModal'
import { TutorialModal } from './components/TutorialModal'
import {
  clearAiHighlightCache,
  loadAiHighlightCache,
  saveAiHighlightCache,
} from './lib/aiHighlightCache'
import { scrollToHighlight } from './lib/editorHighlights'
import { buildHighlightSummary } from './lib/keyPointSummary'
import {
  analyzeMarkdownWithOllama,
  defaultAiSettings,
  mergeAiSettings,
  testOllamaConnection,
  fetchOllamaModels,
  OllamaCorsError,
  extractionLevelLimits,
  synthesizeHighlightSummary,
  type AiHighlight,
  type AiSettings,
  type ExtractionLevel,
  highlightRetryAttempts,
  summaryRetryAttempts,
} from './lib/ollama'
import { sampleMarkdown } from './lib/sample'

type Theme = 'light' | 'dark'

const defaultSource = localStorage.getItem('highlightmd:source') ?? sampleMarkdown
const initialHighlightCache = loadAiHighlightCache(defaultSource)
const aiSettingsStorageKey = 'highlightmd:ai-settings'
const tutorialSeenStorageKey = 'highlightmd:tutorial-seen'
const extractionLevels: ExtractionLevel[] = ['low', 'medium', 'high']
const maxAutosaveBytes = 512 * 1024
const autosaveDebounceMs = 800
const kindOrder = ['risk', 'decision', 'action', 'keyword', 'number', 'tech'] as const
const kindLabels: Record<(typeof kindOrder)[number], string> = {
  risk: 'Risks',
  decision: 'Decisions',
  action: 'Actions',
  keyword: 'Keywords',
  number: 'Numbers',
  tech: 'Technical',
}

type AiStatus = 'idle' | 'testing' | 'connected' | 'analyzing' | 'done' | 'error'
type AiSummaryStatus = 'idle' | 'summarizing' | 'done' | 'fallback'

interface AiProgress {
  completed: number
  total: number
}

export function App() {
  const [theme, setTheme] = useState<Theme>('light')
  const [showOutline, setShowOutline] = useState(true)
  const [showAiSettings, setShowAiSettings] = useState(false)
  const [showTutorial, setShowTutorial] = useState(
    () => !localStorage.getItem(tutorialSeenStorageKey),
  )
  const [showKeyPoints, setShowKeyPoints] = useState(false)
  const [presentation, setPresentation] = useState(false)
  const [fileName, setFileName] = useState('sample.md')
  const [aiSettings, setAiSettings] = useState<AiSettings>(() => loadAiSettings())
  const [aiHighlights, setAiHighlights] = useState<AiHighlight[]>(
    () => initialHighlightCache?.highlights ?? [],
  )
  const [aiSummary, setAiSummary] = useState(initialHighlightCache?.summary ?? '')
  const [aiSummaryStatus, setAiSummaryStatus] = useState<AiSummaryStatus>(
    () => (initialHighlightCache?.summary ? 'done' : 'idle'),
  )
  const [aiStatus, setAiStatus] = useState<AiStatus>(
    () => (initialHighlightCache ? 'done' : 'idle'),
  )
  const [aiMessage, setAiMessage] = useState(
    initialHighlightCache
      ? `Restored ${initialHighlightCache.highlights.length} cached highlights`
      : 'Local AI ready',
  )
  const [aiProgress, setAiProgress] = useState<AiProgress>({ completed: 0, total: 0 })
  const [headings, setHeadings] = useState<HeadingItem[]>([])
  const [collapsedHeadings, setCollapsedHeadings] = useState<Set<string>>(new Set())
  const [collapsedKinds, setCollapsedKinds] = useState<Set<string>>(new Set())
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null)
  const [activeKeyPointId, setActiveKeyPointId] = useState<string | null>(null)
  const [availableModels, setAvailableModels] = useState<string[]>([])

  const editorHandleRef = useRef<BlockEditorHandle | null>(null)
  const aiRequestIdRef = useRef(0)
  const autosaveTimerRef = useRef<number | undefined>(undefined)
  const sourceRef = useRef(defaultSource)

  useEffect(() => {
    if (showAiSettings) {
      fetchOllamaModels(aiSettings.endpoint).then(setAvailableModels)
    }
  }, [showAiSettings, aiSettings.endpoint])

  const outlineWithVisibility = useMemo(() => {
    const result: Array<HeadingItem & { hasChildren: boolean; isHidden: boolean; key: string }> = []
    let hideLevel = Infinity

    for (let i = 0; i < headings.length; i++) {
      const item = headings[i]
      const hasChildren = i < headings.length - 1 && headings[i + 1].level > item.level
      const key = `${item.id}-${i}`

      if (item.level <= hideLevel) {
        hideLevel = Infinity
      }

      const isHidden = hideLevel < item.level

      if (!isHidden && collapsedHeadings.has(key)) {
        hideLevel = Math.min(hideLevel, item.level)
      }

      result.push({ ...item, hasChildren, isHidden, key })
    }

    return result.filter((item) => !item.isHidden)
  }, [headings, collapsedHeadings])

  const handleOutlineClick = (item: HeadingItem & { key: string }, e: React.MouseEvent) => {
    e.preventDefault()
    setActiveHeadingId(item.id)

    const el = document.querySelector(`[data-id="${item.blockId}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const toggleHeading = (key: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCollapsedHeadings((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleKindGroup = (key: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCollapsedKinds((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleKeyPointClick = (highlight: AiHighlight, itemKey: string, e: React.MouseEvent) => {
    e.preventDefault()
    setActiveKeyPointId(itemKey)
    const root = editorHandleRef.current?.getEditorRoot()
    if (root) {
      scrollToHighlight(root, highlight.text)
    }
  }

  const handleEditorReady = useCallback(async (handle: BlockEditorHandle) => {
    editorHandleRef.current = handle
    setHeadings(handle.getHeadings())

    const markdown = await handle.getMarkdown()
    sourceRef.current = markdown
    const cached = loadAiHighlightCache(markdown)
    if (!cached) return

    handle.setAiHighlights(cached.highlights)
    setAiHighlights(cached.highlights)
    setAiSummary(cached.summary)
    setAiSummaryStatus('done')
    setAiStatus('done')
    setAiMessage(`Restored ${cached.highlights.length} cached highlights`)
    setShowKeyPoints(true)
  }, [])

  const handleEditorChange = useCallback(() => {
    const handle = editorHandleRef.current
    if (!handle) return

    setHeadings(handle.getHeadings())

    if (aiHighlights.length > 0) {
      handle.setAiHighlights([])
      setAiHighlights([])
      setAiSummary('')
      clearAiHighlightCache()
      setAiSummaryStatus('idle')
      setAiStatus('idle')
      setAiProgress({ completed: 0, total: 0 })
      setAiMessage('AI highlights cleared after edit')
    }

    if (autosaveTimerRef.current !== undefined) {
      window.clearTimeout(autosaveTimerRef.current)
    }
    autosaveTimerRef.current = window.setTimeout(async () => {
      const md = await handle.getMarkdown()
      sourceRef.current = md
      if (md.length <= maxAutosaveBytes) {
        localStorage.setItem('highlightmd:source', md)
      }
    }, autosaveDebounceMs)
  }, [aiHighlights.length])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    localStorage.setItem(aiSettingsStorageKey, JSON.stringify(aiSettings))
  }, [aiSettings])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setPresentation(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const keyPoints = useMemo(
    () => aiHighlights.slice(0, extractionLevelLimits[aiSettings.extractionLevel]),
    [aiHighlights, aiSettings.extractionLevel],
  )
  const prevKeyPointsLengthRef = useRef(0)

  useEffect(() => {
    const previousLength = prevKeyPointsLengthRef.current
    if (keyPoints.length > 0 && previousLength === 0) {
      setShowKeyPoints(true)
    } else if (keyPoints.length === 0 && aiStatus !== 'analyzing') {
      setShowKeyPoints(false)
    }
    prevKeyPointsLengthRef.current = keyPoints.length
  }, [keyPoints.length, aiStatus])

  const keyPointGroups = useMemo(() => {
    const groups = new Map<string, AiHighlight[]>()
    for (const kind of kindOrder) {
      const items = keyPoints.filter((item) => item.kind === kind)
      if (items.length > 0) groups.set(kind, items)
    }
    for (const item of keyPoints) {
      if (kindOrder.includes(item.kind as (typeof kindOrder)[number])) continue
      const bucket = groups.get(item.kind) ?? []
      bucket.push(item)
      groups.set(item.kind, bucket)
    }
    return Array.from(groups.entries()).map(([kind, items]) => ({
      kind,
      label: kindLabels[kind as (typeof kindOrder)[number]] ?? kind,
      items,
      key: `kind-${kind}`,
    }))
  }, [keyPoints])

  const keyPointGroupsWithVisibility = useMemo(() => {
    return keyPointGroups.map((group) => ({
      ...group,
      isCollapsed: collapsedKinds.has(group.key),
    }))
  }, [keyPointGroups, collapsedKinds])

  const hasKeyPointsContent = keyPoints.length > 0 || aiStatus === 'analyzing'
  const workspaceStyle = useMemo(
    () => ({
      gridTemplateColumns: `${showOutline ? 'var(--side-pane-width)' : '0px'} minmax(0, 1fr) ${
        showKeyPoints && hasKeyPointsContent ? 'var(--key-points-pane-width)' : '0px'
      }`,
    }),
    [showOutline, showKeyPoints, hasKeyPointsContent],
  )

  async function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file) return

    setFileName(file.name)
    try {
      const text = await file.text()
      sourceRef.current = text
      const cached = loadAiHighlightCache(text)
      setAiHighlights(cached?.highlights ?? [])
      setAiSummary(cached?.summary ?? '')
      setAiSummaryStatus(cached?.summary ? 'done' : 'idle')
      setAiProgress({ completed: 0, total: 0 })
      setAiStatus(cached ? 'done' : 'idle')
      setAiMessage(
        cached
          ? `Restored ${cached.highlights.length} cached highlights`
          : 'Local AI ready',
      )
      await editorHandleRef.current?.setMarkdown(text)
      editorHandleRef.current?.setAiHighlights(cached?.highlights ?? [])
      setHeadings(editorHandleRef.current?.getHeadings() ?? [])
      if (cached) setShowKeyPoints(true)
    } catch {
      sourceRef.current = 'Unable to read this file.'
    }
  }

  async function handleExport() {
    const handle = editorHandleRef.current
    if (!handle) return

    const md = await handle.getMarkdown()
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const href = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = fileName.endsWith('.md') ? fileName : `${fileName}.md`
    anchor.click()
    URL.revokeObjectURL(href)
  }

  function closeTutorial() {
    localStorage.setItem(tutorialSeenStorageKey, '1')
    setShowTutorial(false)
  }

  async function handleTestAiConnection() {
    setAiStatus('testing')
    setAiMessage('Testing Ollama...')

    try {
      const result = await testOllamaConnection(aiSettings)
      setAiStatus('connected')
      setAiMessage(
        result.hasConfiguredModel
          ? `Connected to ${aiSettings.model}`
          : `Connected. Model not listed: ${aiSettings.model}`,
      )
    } catch (error) {
      setAiStatus('error')
      setAiMessage(getErrorMessage(error))
    }
  }

  async function handleAiHighlight() {
    if (!aiSettings.enabled) {
      setAiStatus('idle')
      setAiMessage('Enable local AI in settings first')
      setShowAiSettings(true)
      return
    }

    const handle = editorHandleRef.current
    if (!handle) return

    const source = await handle.getMarkdown()
    const id = aiRequestIdRef.current + 1
    aiRequestIdRef.current = id
    setAiStatus('analyzing')
    setAiHighlights([])
    setAiSummary('')
    setAiSummaryStatus('idle')
    setAiProgress({ completed: 0, total: 1 })
    setAiMessage('Starting quick AI scan...')
    setShowKeyPoints(true)

    try {
      const startedAt = performance.now()
      const highlights = await analyzeMarkdownWithOllama(source, aiSettings, {
        maxHighlights: extractionLevelLimits[aiSettings.extractionLevel],
        onProgress: (progress) => {
          if (id !== aiRequestIdRef.current) return
          const nextHighlights = progress.highlights
          setAiHighlights(nextHighlights)
          setAiSummary(buildHighlightSummary(nextHighlights))
          setAiProgress({
            completed: progress.completedChunks,
            total: progress.totalChunks,
          })
          setAiMessage(
            progress.totalChunks === 0
              ? 'Preparing AI scan...'
              : `AI chunk ${progress.completedChunks}/${progress.totalChunks} · ${progress.highlights.length} highlights`,
          )
        },
      })
      if (id !== aiRequestIdRef.current) return

      setAiHighlights(highlights)
      const fallbackSummary = buildHighlightSummary(highlights)
      setAiSummary(fallbackSummary)
      saveAiHighlightCache(source, highlights, fallbackSummary)
      setAiStatus('done')
      setAiProgress((progress) => ({
        completed: progress.total,
        total: progress.total,
      }))

      if (highlights.length > 0) {
        setAiSummaryStatus('summarizing')
        setAiMessage('Highlights ready · synthesizing summary...')

        const summary = await synthesizeHighlightSummary(highlights, aiSettings)
        if (id !== aiRequestIdRef.current) return

        if (summary) {
          setAiSummary(summary)
          setAiSummaryStatus('done')
          saveAiHighlightCache(source, highlights, summary)
          setAiMessage(
            `AI highlighted ${highlights.length} items · summary ready in ${Math.round(performance.now() - startedAt)}ms`,
          )
        } else {
          setAiSummary(fallbackSummary)
          setAiSummaryStatus('fallback')
          setAiMessage(
            `Highlights ready · summary fallback after ${summaryRetryAttempts} attempts`,
          )
        }
      } else {
        setAiSummaryStatus('idle')
        setAiMessage(
          `No highlights parsed — retried up to ${highlightRetryAttempts}x per chunk. Check model output format in Settings.`,
        )
      }
    } catch (error) {
      if (id !== aiRequestIdRef.current) return
      setAiStatus('error')
      setAiProgress({ completed: 0, total: 0 })
      setAiMessage(getErrorMessage(error))
    }
  }

  return (
    <div
      className={['app-shell', presentation ? 'is-presentation' : '', 'has-block-editor'].join(' ')}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        handleFiles(event.dataTransfer.files)
      }}
    >
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">H</span>
          <div>
            <strong>HightlightMD</strong>
            <span>
              <CheckCircle2 size={13} />
              {fileName}
            </span>
          </div>
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
          <button title="Presentation mode" type="button" onClick={() => setPresentation((v) => !v)}>
            {presentation ? <Focus size={18} /> : <Presentation size={18} />}
          </button>
          <button
            className={`ai-highlight-button ${aiStatus === 'analyzing' ? 'is-loading' : ''}`}
            disabled={aiStatus === 'analyzing'}
            title="AI Highlight"
            type="button"
            onClick={handleAiHighlight}
          >
            <Sparkles size={17} />
            <span>{aiStatus === 'analyzing' ? 'Scanning' : 'AI Highlight'}</span>
          </button>
          <button
            className={showAiSettings ? 'active' : ''}
            title="AI settings"
            type="button"
            onClick={() => setShowAiSettings((value) => !value)}
          >
            <Settings2 size={18} />
          </button>
          <button
            className={showTutorial ? 'active' : ''}
            title="使用教程"
            type="button"
            onClick={() => setShowTutorial(true)}
          >
            <BookOpen size={18} />
          </button>
          <button title="Export Markdown" type="button" onClick={handleExport}>
            <Download size={18} />
          </button>
          <button title="Theme" type="button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>

      {showTutorial ? <TutorialModal onClose={closeTutorial} /> : null}

      {showAiSettings ? (
        <AiSettingsModal
          aiMessage={aiMessage}
          aiSettings={aiSettings}
          aiStatus={aiStatus}
          availableModels={availableModels}
          extractionLevels={extractionLevels}
          onClose={() => setShowAiSettings(false)}
          onRunHighlight={handleAiHighlight}
          onSettingsChange={setAiSettings}
          onTestConnection={handleTestAiConnection}
        />
      ) : null}

      <main className="workspace" style={workspaceStyle}>
        <div className={`workspace-side workspace-side-left ${showOutline ? 'is-open' : 'is-collapsed'}`}>
          {showOutline ? (
            <aside className="outline-pane left-pane">
              <div className="outline-header">
                <strong>Outline</strong>
                <button type="button" onClick={() => setShowOutline(false)} title="收起目录">
                  <ChevronLeft size={16} />
                </button>
              </div>
              {outlineWithVisibility.length > 0 ? (
                <div className="outline-tree">
                  {outlineWithVisibility.map((item) => (
                    <a
                      href={`#${item.id}`}
                      key={item.key}
                      className={`outline-item ${activeHeadingId === item.id ? 'active' : ''}`}
                      style={{ paddingLeft: (item.level - 1) * 16 + 6 }}
                      onClick={(e) => handleOutlineClick(item, e)}
                    >
                      {item.hasChildren ? (
                        <button
                          className="outline-toggle"
                          type="button"
                          onClick={(e) => toggleHeading(item.key, e)}
                        >
                          {collapsedHeadings.has(item.key) ? (
                            <ChevronRight size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </button>
                      ) : (
                        <span className="outline-spacer" />
                      )}
                      <span className="outline-text">{item.text}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <span className="empty-outline">No headings</span>
              )}
            </aside>
          ) : (
            <button
              className="outline-floating-tab"
              type="button"
              onClick={() => setShowOutline(true)}
              title="展开目录"
            >
              <PanelLeft size={16} />
            </button>
          )}
        </div>

        <section className="editor-pane" aria-label="Document editor">
          <div className="editor-container">
            <BlockEditor
              aiHighlights={aiHighlights}
              initialMarkdown={defaultSource}
              theme={theme}
              onChange={handleEditorChange}
              onReady={handleEditorReady}
            />

            {aiStatus === 'analyzing' && aiProgress.total > 0 && (
              <div className="ai-progress" aria-live="polite">
                <div className="ai-progress-header">
                  <div className="ai-progress-title">
                    <span className="ai-spinner" />
                    <strong>AI scanning key points</strong>
                  </div>
                  <span>
                    Chunk {aiProgress.completed} / {aiProgress.total} ·{' '}
                    {aiHighlights.length} highlights ready
                  </span>
                </div>
                <div
                  className={`ai-progress-track ${
                    aiProgress.completed === 0 ? 'is-indeterminate' : ''
                  }`}
                >
                  <span
                    style={{
                      width: `${Math.max(
                        8,
                        Math.round((aiProgress.completed / aiProgress.total) * 100),
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        <div
          className={`workspace-side workspace-side-right ${
            showKeyPoints && hasKeyPointsContent ? 'is-open' : 'is-collapsed'
          }`}
        >
          {showKeyPoints && hasKeyPointsContent ? (
            <aside className="key-points-pane right-pane" aria-label="AI key points">
              <div className="key-points-header">
                <strong>Key Points</strong>
                <button type="button" onClick={() => setShowKeyPoints(false)} title="收起要点">
                  <ChevronRight size={16} />
                </button>
              </div>
              <span className="key-points-meta">
                {aiStatus === 'analyzing'
                  ? `${aiProgress.completed}/${aiProgress.total || 1} scanning`
                  : aiSummaryStatus === 'summarizing'
                    ? 'Synthesizing summary...'
                    : `${keyPoints.length}/${extractionLevelLimits[aiSettings.extractionLevel]} highlights`}
              </span>
              <div
                className={`key-points-summary ${aiSummaryStatus === 'summarizing' ? 'is-loading' : ''}`}
              >
                <strong>Summary:</strong>
                {aiSummaryStatus === 'summarizing' ? (
                  <div className="key-points-summary-loading" aria-live="polite">
                    <span className="key-points-summary-shimmer" aria-hidden="true" />
                    <span>AI is synthesizing a summary from all key points…</span>
                  </div>
                ) : (
                  <p>{aiSummary || buildHighlightSummary(keyPoints)}</p>
                )}
              </div>
              {keyPointGroupsWithVisibility.length > 0 ? (
                <div className="key-points-tree">
                  {keyPointGroupsWithVisibility.map((group) => (
                    <div className="key-points-group" key={group.key}>
                      <button
                        className="key-points-group-header"
                        type="button"
                        onClick={(e) => toggleKindGroup(group.key, e)}
                      >
                        <span className="outline-toggle" aria-hidden="true">
                          {group.isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                        </span>
                        <span className={`key-point-kind key-point-${group.kind}`}>{group.label}</span>
                        <span className="key-points-count">{group.items.length}</span>
                      </button>
                      {!group.isCollapsed && (
                        <div className="key-points-items">
                          {group.items.map((highlight, index) => {
                            const itemKey = `${group.kind}-${highlight.text}-${index}`
                            return (
                              <a
                                className={`key-points-item ${activeKeyPointId === itemKey ? 'active' : ''}`}
                                href={`#${itemKey}`}
                                key={itemKey}
                                onClick={(e) => handleKeyPointClick(highlight, itemKey, e)}
                              >
                                <span className="key-points-item-text">{highlight.text}</span>
                                {highlight.reason && (
                                  <small className="key-points-item-reason">{highlight.reason}</small>
                                )}
                              </a>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="key-points-empty">
                  {aiStatus === 'analyzing'
                    ? 'AI is finding key points...'
                    : 'Click AI Highlight to generate a quick summary.'}
                </span>
              )}
            </aside>
          ) : (
            hasKeyPointsContent && (
              <button
                className="key-points-floating-tab"
                type="button"
                onClick={() => setShowKeyPoints(true)}
                title="展开要点"
              >
                <PanelRight size={16} />
              </button>
            )
          )}
        </div>
      </main>
    </div>
  )
}

function loadAiSettings(): AiSettings {
  const raw = localStorage.getItem(aiSettingsStorageKey)
  if (!raw) return defaultAiSettings

  try {
    const parsed = JSON.parse(raw) as Partial<AiSettings>
    return mergeAiSettings({
      ...parsed,
      extractionLevel: isExtractionLevel(parsed.extractionLevel)
        ? parsed.extractionLevel
        : defaultAiSettings.extractionLevel,
    })
  } catch {
    return defaultAiSettings
  }
}

function isExtractionLevel(value: unknown): value is ExtractionLevel {
  return typeof value === 'string' && (extractionLevels as readonly string[]).includes(value)
}

function getErrorMessage(error: unknown) {
  if (error instanceof OllamaCorsError) {
    return error.message
  }
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'Ollama request timed out'
  }
  if (error instanceof TypeError) {
    return 'Cannot reach Ollama. Check endpoint or CORS.'
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'AI request failed'
}
