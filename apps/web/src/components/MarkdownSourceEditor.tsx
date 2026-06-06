import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorState, StateEffect } from '@codemirror/state'
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  keymap,
  placeholder,
  type KeyBinding,
} from '@codemirror/view'
import { tags as t } from '@lezer/highlight'

export interface MarkdownEditorHandle {
  focus: () => void
  formatBold: () => void
  formatItalic: () => void
  formatUnderline: () => void
  formatStrike: () => void
  setHeading: (level: 1 | 2 | 3) => void
  insertBlockquote: () => void
  insertCodeBlock: () => void
  insertFormula: () => void
  insertHorizontalRule: () => void
  insertImage: () => void
  insertInlineCode: () => void
  insertLink: () => void
  insertMermaid: () => void
  insertOrderedList: () => void
  insertTable: () => void
  insertUnorderedList: () => void
  setParagraph: () => void
  scrollToOffset: (offset: number) => void
}

export interface LineMenuAnchor {
  lineNumber: number
  x: number
  y: number
}

interface MarkdownSourceEditorProps {
  source: string
  onScrollerChange?: (element: HTMLElement | null) => void
  onSourceChange: (nextSource: string) => void
  onLineMenu?: (anchor: LineMenuAnchor) => void
}

const GRIP_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/>' +
  '<circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>'

const markdownHighlightStyle = HighlightStyle.define([
  { tag: t.heading, color: 'var(--editor-heading)', fontWeight: '760' },
  { tag: t.heading1, color: 'var(--editor-heading)', fontWeight: '780' },
  { tag: t.heading2, color: 'var(--editor-heading)', fontWeight: '760' },
  { tag: t.heading3, color: 'var(--editor-heading)', fontWeight: '740' },
  { tag: t.strong, color: 'var(--editor-strong)', fontWeight: '760' },
  { tag: t.emphasis, color: 'var(--editor-emphasis)', fontStyle: 'italic' },
  { tag: t.strikethrough, color: 'var(--editor-muted)', textDecoration: 'line-through' },
  { tag: t.link, color: 'var(--editor-link)', textDecoration: 'underline' },
  { tag: t.url, color: 'var(--editor-url)' },
  { tag: t.monospace, color: 'var(--editor-code)' },
  { tag: t.processingInstruction, color: 'var(--editor-code)' },
  { tag: t.atom, color: 'var(--editor-atom)' },
  { tag: t.quote, color: 'var(--editor-quote)' },
  { tag: t.list, color: 'var(--editor-list)' },
  { tag: t.contentSeparator, color: 'var(--editor-muted)' },
  { tag: t.meta, color: 'var(--editor-muted)' },
  { tag: t.punctuation, color: 'var(--editor-punctuation)' },
  { tag: t.labelName, color: 'var(--editor-link)' },
])

export const MarkdownSourceEditor = forwardRef<MarkdownEditorHandle, MarkdownSourceEditorProps>(
function MarkdownSourceEditor({
  source,
  onScrollerChange,
  onSourceChange,
  onLineMenu,
}: MarkdownSourceEditorProps, ref) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<EditorView | null>(null)
  const editorSourceRef = useRef(source)
  const onSourceChangeRef = useRef(onSourceChange)
  const onScrollerChangeRef = useRef(onScrollerChange)
  const onLineMenuRef = useRef(onLineMenu)

  onSourceChangeRef.current = onSourceChange
  onScrollerChangeRef.current = onScrollerChange
  onLineMenuRef.current = onLineMenu

  useImperativeHandle(ref, () => createMarkdownEditorHandle(() => viewRef.current), [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const getView = () => viewRef.current

    const view = new EditorView({
      state: EditorState.create({
        doc: source,
        extensions: [
          history(),
          drawSelection(),
          highlightActiveLine(),
          markdown({ base: markdownLanguage }),
          syntaxHighlighting(markdownHighlightStyle, { fallback: true }),
          placeholder('Write Markdown...'),
          EditorView.lineWrapping,
          keymap.of([
            ...createMarkdownKeymap(getView),
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          EditorView.theme({
            '&': {
              height: '100%',
              background: 'transparent',
              color: 'var(--editor-text)',
            },
            '.cm-scroller': {
              fontFamily:
                '"SFMono-Regular", ui-monospace, Menlo, Consolas, monospace',
              overflow: 'auto',
            },
            '.cm-content': {
              minHeight: '100%',
              padding: '18px 22px 56px 44px',
              caretColor: 'var(--accent)',
            },
            '.cm-line': {
              padding: '0 2px',
            },
            '.cm-activeLine': {
              backgroundColor: 'rgb(0 122 255 / 6%)',
            },
            '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
              backgroundColor: 'rgb(0 122 255 / 20%)',
            },
            '&.cm-focused': {
              outline: 'none',
            },
            '.cm-gutters': {
              display: 'none',
            },
            '.cm-placeholder': {
              color: 'var(--muted)',
            },
          }),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) return

            const nextSource = update.state.doc.toString()
            editorSourceRef.current = nextSource
            onSourceChangeRef.current(nextSource)
          }),
        ],
      }),
      parent: container,
    })

    viewRef.current = view
    editorSourceRef.current = source
    onScrollerChangeRef.current?.(view.scrollDOM)

    const grip = document.createElement('button')
    grip.type = 'button'
    grip.className = 'cm-line-grip'
    grip.tabIndex = -1
    grip.setAttribute('aria-label', 'Line options')
    grip.innerHTML = GRIP_SVG
    view.dom.appendChild(grip)

    let gripLine = -1
    let hoverLine = -1
    let pointerInside = false
    let disposed = false

    const hideGrip = () => {
      gripLine = -1
      hoverLine = -1
      grip.classList.remove('is-visible', 'is-active-line')
    }

    const safePosAtCoords = (x: number, y: number) => {
      try {
        return view.posAtCoords({ x, y }, false)
      } catch {
        return null
      }
    }

    const positionGripAtLine = (lineNumber: number, active = false) => {
      if (lineNumber < 1 || lineNumber > view.state.doc.lines) {
        hideGrip()
        return false
      }

      const line = view.state.doc.line(lineNumber)
      const coords = view.coordsAtPos(line.from)
      if (!coords) {
        hideGrip()
        return false
      }

      const rect = view.dom.getBoundingClientRect()
      gripLine = lineNumber
      grip.style.top = `${coords.top - rect.top}px`
      grip.style.height = `${Math.max(coords.bottom - coords.top, 22)}px`
      grip.classList.add('is-visible')
      grip.classList.toggle('is-active-line', active)
      return true
    }

    const refreshGrip = () => {
      if (hoverLine > 0) {
        positionGripAtLine(hoverLine)
        return
      }

      if (view.hasFocus) {
        const activeLine = view.state.doc.lineAt(view.state.selection.main.head).number
        positionGripAtLine(activeLine, true)
        return
      }

      hideGrip()
    }

    const showGripAt = (clientX: number, clientY: number) => {
      const pos = safePosAtCoords(clientX, clientY)
      if (pos == null) {
        hoverLine = -1
        if (view.hasFocus) {
          refreshGrip()
        } else {
          hideGrip()
        }
        return
      }

      hoverLine = view.state.doc.lineAt(pos).number
      positionGripAtLine(hoverLine)
    }

    const handleMove = (event: MouseEvent) => {
      if (event.target === grip || grip.contains(event.target as Node)) return
      showGripAt(event.clientX, event.clientY)
    }

    const handleScrollerEnter = () => {
      pointerInside = true
      refreshGrip()
    }

    const handleScrollerLeave = (event: MouseEvent) => {
      const related = event.relatedTarget as Node | null
      if (related && (related === grip || grip.contains(related))) return

      pointerInside = false
      hoverLine = -1
      if (view.hasFocus) {
        refreshGrip()
      } else {
        hideGrip()
      }
    }

    const handleGripLeave = (event: MouseEvent) => {
      const related = event.relatedTarget as Node | null
      if (related && view.scrollDOM.contains(related)) return

      hoverLine = -1
      if (view.hasFocus) {
        refreshGrip()
      } else {
        hideGrip()
      }
    }

    const handleGripMouseDown = (event: MouseEvent) => {
      event.preventDefault()
    }

    const handleGripClick = (event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      if (gripLine < 1 || gripLine > view.state.doc.lines) return

      const line = view.state.doc.line(gripLine)
      view.dispatch({ selection: { anchor: line.from }, scrollIntoView: false })
      view.focus()

      const rect = grip.getBoundingClientRect()
      onLineMenuRef.current?.({
        lineNumber: gripLine,
        x: rect.right + 6,
        y: rect.top,
      })
    }

    const handleFocus = () => {
      if (!pointerInside) refreshGrip()
    }

    const handleBlur = () => {
      if (!pointerInside) hideGrip()
    }

    const gripUpdateListener = EditorView.updateListener.of((update) => {
      if (disposed) return
      if (!update.selectionSet && !update.docChanged && !update.focusChanged) return
      requestAnimationFrame(() => {
        if (!disposed) refreshGrip()
      })
    })

    view.dispatch({ effects: StateEffect.appendConfig.of(gripUpdateListener) })

    view.scrollDOM.addEventListener('mouseenter', handleScrollerEnter)
    view.scrollDOM.addEventListener('mousemove', handleMove)
    view.scrollDOM.addEventListener('mouseleave', handleScrollerLeave)
    grip.addEventListener('mouseleave', handleGripLeave)
    grip.addEventListener('mousedown', handleGripMouseDown)
    grip.addEventListener('click', handleGripClick)
    view.scrollDOM.addEventListener('scroll', refreshGrip, { passive: true })
    view.contentDOM.addEventListener('focusin', handleFocus)
    view.contentDOM.addEventListener('focusout', handleBlur)

    return () => {
      disposed = true
      view.scrollDOM.removeEventListener('mouseenter', handleScrollerEnter)
      view.scrollDOM.removeEventListener('mousemove', handleMove)
      view.scrollDOM.removeEventListener('mouseleave', handleScrollerLeave)
      grip.removeEventListener('mouseleave', handleGripLeave)
      grip.removeEventListener('mousedown', handleGripMouseDown)
      grip.removeEventListener('click', handleGripClick)
      view.scrollDOM.removeEventListener('scroll', refreshGrip)
      view.contentDOM.removeEventListener('focusin', handleFocus)
      view.contentDOM.removeEventListener('focusout', handleBlur)
      grip.remove()
      onScrollerChangeRef.current?.(null)
      view.destroy()
      viewRef.current = null
    }
  }, [])

  useEffect(() => {
    const view = viewRef.current
    if (!view || editorSourceRef.current === source) return

    editorSourceRef.current = source
    if (view.state.doc.toString() === source) return

    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: source },
    })
  }, [source])

  return <div className="markdown-source-editor" ref={containerRef} />
})

function createMarkdownKeymap(getView: () => EditorView | null): KeyBinding[] {
  const run = (command: (handle: MarkdownEditorHandle) => void) => {
    const handle = createMarkdownEditorHandle(getView)
    command(handle)
    return true
  }

  return [
    { key: 'Mod-b', run: () => run((handle) => handle.formatBold()) },
    { key: 'Mod-i', run: () => run((handle) => handle.formatItalic()) },
    { key: 'Mod-k', run: () => run((handle) => handle.insertLink()) },
    { key: 'Mod-Alt-1', run: () => run((handle) => handle.setHeading(1)) },
    { key: 'Mod-Alt-2', run: () => run((handle) => handle.setHeading(2)) },
    { key: 'Mod-Alt-3', run: () => run((handle) => handle.setHeading(3)) },
    { key: 'Mod-Shift-7', run: () => run((handle) => handle.insertOrderedList()) },
    { key: 'Mod-Shift-8', run: () => run((handle) => handle.insertUnorderedList()) },
    { key: 'Mod-Alt-c', run: () => run((handle) => handle.insertCodeBlock()) },
  ]
}

function createMarkdownEditorHandle(getView: () => EditorView | null): MarkdownEditorHandle {
  return {
    focus: () => getView()?.focus(),
    formatBold: () => wrapSelection(getView(), '**', '**', 'bold text'),
    formatItalic: () => wrapSelection(getView(), '*', '*', 'italic text'),
    formatUnderline: () => wrapSelection(getView(), '<u>', '</u>', 'underlined text'),
    formatStrike: () => wrapSelection(getView(), '~~', '~~', 'struck text'),
    setHeading: (level) => setHeading(getView(), level),
    insertBlockquote: () => prefixSelectedLines(getView(), '> '),
    insertCodeBlock: () => wrapSelection(getView(), '```ts\n', '\n```', 'console.log("Hello HightlightMD")'),
    insertFormula: () => wrapSelection(getView(), '$$', '$$', 'E = mc^2'),
    insertHorizontalRule: () => insertSnippet(getView(), '\n---\n'),
    insertImage: () => insertLinkLike(getView(), '![', 'Image alt', '](https://example.com/image.png)'),
    insertInlineCode: () => wrapSelection(getView(), '`', '`', 'code'),
    insertLink: () => insertLinkLike(getView(), '[', 'Link text', '](https://example.com)'),
    insertMermaid: () => insertSnippet(
      getView(),
      '```mermaid\nflowchart TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[Ship]\n  B -->|No| D[Revise]\n```',
    ),
    insertOrderedList: () => prefixSelectedLines(getView(), '1. ', true),
    insertTable: () => insertSnippet(
      getView(),
      '| Column | Detail |\n| --- | --- |\n| Item | Notes |\n',
    ),
    insertUnorderedList: () => prefixSelectedLines(getView(), '- '),
    setParagraph: () => setParagraph(getView()),
    scrollToOffset: (offset) => {
      const view = getView()
      if (!view) return
      view.dispatch({
        effects: EditorView.scrollIntoView(offset, { y: 'start', yMargin: 40 })
      })
    },
  }
}

function wrapSelection(
  view: EditorView | null,
  prefix: string,
  suffix: string,
  placeholderText: string,
) {
  if (!view) return

  const selection = view.state.selection.main
  const selected = view.state.sliceDoc(selection.from, selection.to) || placeholderText
  const insert = `${prefix}${selected}${suffix}`
  const anchor = selection.from + prefix.length
  const head = anchor + selected.length

  view.dispatch({
    changes: { from: selection.from, to: selection.to, insert },
    selection: { anchor, head },
    scrollIntoView: true,
    userEvent: 'input',
  })
  view.focus()
}

function insertSnippet(view: EditorView | null, snippet: string) {
  if (!view) return

  const selection = view.state.selection.main
  const needsLeadingBreak = selection.from > 0 && view.state.sliceDoc(selection.from - 1, selection.from) !== '\n'
  const insert = `${needsLeadingBreak ? '\n' : ''}${snippet}${snippet.endsWith('\n') ? '' : '\n'}`

  view.dispatch({
    changes: { from: selection.from, to: selection.to, insert },
    selection: { anchor: selection.from + insert.length },
    scrollIntoView: true,
    userEvent: 'input',
  })
  view.focus()
}

function insertLinkLike(
  view: EditorView | null,
  prefix: string,
  placeholderText: string,
  suffix: string,
) {
  if (!view) return

  const selection = view.state.selection.main
  const selected = view.state.sliceDoc(selection.from, selection.to) || placeholderText
  const insert = `${prefix}${selected}${suffix}`

  view.dispatch({
    changes: { from: selection.from, to: selection.to, insert },
    selection: {
      anchor: selection.from + prefix.length,
      head: selection.from + prefix.length + selected.length,
    },
    scrollIntoView: true,
    userEvent: 'input',
  })
  view.focus()
}

function setHeading(view: EditorView | null, level: 1 | 2 | 3) {
  if (!view) return

  const selection = view.state.selection.main
  const line = view.state.doc.lineAt(selection.from)
  const prefix = `${'#'.repeat(level)} `
  const nextText = `${prefix}${line.text.replace(/^\s{0,3}#{1,6}\s+/, '')}`

  view.dispatch({
    changes: { from: line.from, to: line.to, insert: nextText },
    selection: { anchor: Math.min(line.from + prefix.length, line.from + nextText.length) },
    scrollIntoView: true,
    userEvent: 'input',
  })
  view.focus()
}

function setParagraph(view: EditorView | null) {
  if (!view) return

  const selection = view.state.selection.main
  const line = view.state.doc.lineAt(selection.from)
  const nextText = line.text.replace(/^(\s{0,3})(?:#{1,6}\s+|>\s+|[-*+]\s+|\d+\.\s+)/, '$1')

  if (nextText === line.text) {
    view.focus()
    return
  }

  view.dispatch({
    changes: { from: line.from, to: line.to, insert: nextText },
    selection: { anchor: line.from + nextText.length },
    scrollIntoView: true,
    userEvent: 'input',
  })
  view.focus()
}

function prefixSelectedLines(view: EditorView | null, marker: string, ordered = false) {
  if (!view) return

  const selection = view.state.selection.main
  const startLine = view.state.doc.lineAt(selection.from)
  const endLine = view.state.doc.lineAt(selection.to)
  const changes = []
  let lineNumber = 1

  for (let line = startLine.number; line <= endLine.number; line += 1) {
    const current = view.state.doc.line(line)
    const currentMarker = ordered ? `${lineNumber}. ` : marker
    const existingList = /^(\s*)(?:[-*+]\s+|\d+\.\s+)/
    const existingQuote = /^(\s*)>\s+/
    const match = marker === '> ' ? existingQuote.exec(current.text) : existingList.exec(current.text)

    if (match) {
      const from = current.from + match[1].length
      const to = current.from + match[0].length
      changes.push({ from, to, insert: currentMarker })
    } else {
      changes.push({ from: current.from, insert: currentMarker })
    }

    lineNumber += 1
  }

  view.dispatch({
    changes,
    selection: {
      anchor: selection.from + marker.length,
      head: selection.to + marker.length * changes.length,
    },
    scrollIntoView: true,
    userEvent: 'input',
  })
  view.focus()
}
