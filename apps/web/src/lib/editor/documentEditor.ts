import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { EditorState, type Extension } from '@codemirror/state'
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  keymap,
  placeholder,
} from '@codemirror/view'
import type { DocBlock, HighlightMode } from '@highlightmd/core'
import { blockEditorField, setActiveBlock, setDocBlocks } from './blockState'
import { activateBlock, createBlockDecorationExtensions } from './blockPreview'

export interface DocumentEditorConfig {
  initialBlocks: DocBlock[]
  getMode: () => HighlightMode
  getRenderLimit: () => number
  onDocChange: (nextText: string) => void
}

function createSelectAllKeymap() {
  return keymap.of([
    {
      key: 'Mod-a',
      run(view) {
        const { activeBlockId } = view.state.field(blockEditorField)
        view.dispatch({
          effects: activeBlockId ? setActiveBlock.of(null) : undefined,
          selection: { anchor: 0, head: view.state.doc.length },
          scrollIntoView: true,
        })
        return true
      },
    },
  ])
}

function createBlockNavigationKeymap() {
  return keymap.of([
    {
      key: 'Escape',
      run(view) {
        view.dispatch({
          effects: setActiveBlock.of(null),
          selection: { anchor: view.state.selection.main.anchor, head: view.state.selection.main.anchor },
        })
        view.contentDOM.blur()
        return true
      },
    },
    {
      key: 'ArrowDown',
      run(view) {
        return moveToAdjacentBlock(view, 1)
      },
    },
    {
      key: 'ArrowUp',
      run(view) {
        return moveToAdjacentBlock(view, -1)
      },
    },
  ])
}

function moveToAdjacentBlock(view: EditorView, direction: 1 | -1) {
  const { blocks, activeBlockId } = view.state.field(blockEditorField)
  if (!activeBlockId) return false

  const index = blocks.findIndex((block) => block.id === activeBlockId)
  if (index < 0) return false

  const selection = view.state.selection.main
  const block = blocks[index]
  const atBoundary =
    direction > 0
      ? selection.head >= block.end - 1
      : selection.head <= block.start

  if (!atBoundary) return false

  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= blocks.length) return false

  const nextBlock = blocks[nextIndex]
  const localOffset =
    direction > 0 ? 0 : Math.max(0, nextBlock.end - nextBlock.start - 1)
  activateBlock(view, nextBlock, localOffset)
  return true
}

export function createDocumentEditorExtensions(config: DocumentEditorConfig): Extension[] {
  return [
    blockEditorField.init(() => ({
      activeBlockId: null,
      blocks: config.initialBlocks,
    })),
    history(),
    drawSelection(),
    highlightActiveLine(),
    markdown({ base: markdownLanguage }),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    placeholder('Start writing Markdown...'),
    ...createBlockDecorationExtensions(config.getMode, config.getRenderLimit),
    createSelectAllKeymap(),
    createBlockNavigationKeymap(),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    EditorView.theme({
      '&': {
        height: '100%',
      },
      '.cm-scroller': {
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
        overflow: 'auto',
      },
      '.cm-content': {
        padding: '22px 44px 58px',
        maxWidth: '1040px',
        margin: '0 auto',
        caretColor: 'var(--accent)',
      },
      '.cm-line': {
        padding: '0 2px',
      },
      '.cm-active-block-range': {
        fontFamily:
          '"SFMono-Regular", ui-monospace, Menlo, Consolas, monospace',
        fontSize: '0.92em',
      },
      '.cm-inactive-block-range': {
        opacity: '0.42',
        fontFamily:
          '"SFMono-Regular", ui-monospace, Menlo, Consolas, monospace',
        fontSize: '0.88em',
      },
      '.cm-gutters': {
        display: 'none',
      },
      '&.cm-focused': {
        outline: 'none',
      },
      '.cm-activeLine': {
        backgroundColor: 'rgb(0 122 255 / 6%)',
      },
      '.ml-block-pending': {
        color: 'var(--muted)',
        fontSize: '13px',
        padding: '8px 0',
      },
      '.ml-block-gap': {
        height: '16px',
      },
    }),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        config.onDocChange(update.state.doc.toString())
      }
    }),
  ]
}

export function createDocumentEditorState(docText: string, config: DocumentEditorConfig) {
  return EditorState.create({
    doc: docText,
    extensions: createDocumentEditorExtensions(config),
  })
}

export function syncDocumentBlocks(view: EditorView, blocks: DocBlock[]) {
  const current = view.state.field(blockEditorField)
  if (current.blocks === blocks) return
  if (view.hasFocus) return
  view.dispatch({ effects: setDocBlocks.of(blocks) })
}
