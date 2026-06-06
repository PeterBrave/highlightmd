import { StateEffect, StateField } from '@codemirror/state'
import {
  Decoration,
  EditorView,
  ViewPlugin,
  WidgetType,
  type DecorationSet,
} from '@codemirror/view'
import type { DocBlock, HighlightMode } from '@highlightmd/core'
import { enhanceCodeBlocksIn } from '../codeBlocks'
import { renderMarkdownBlock } from '../markdown'
import { blockEditorField, setActiveBlock } from './blockState'

export const refreshBlockDecorations = StateEffect.define<null>()

class BlockPreviewWidget extends WidgetType {
  constructor(
    readonly block: DocBlock,
    readonly html: string,
  ) {
    super()
  }

  eq(other: BlockPreviewWidget) {
    return other.block.id === this.block.id && other.html === this.html
  }

  toDOM() {
    const section = document.createElement('section')
    section.className = `ml-block ml-block-${this.block.type}`
    section.dataset.blockId = this.block.id
    section.innerHTML = this.html

    if (this.block.type === 'code') {
      enhanceCodeBlocksIn(section)
    }

    return section
  }

  ignoreEvent() {
    return false
  }
}

class BlockGapWidget extends WidgetType {
  constructor(readonly block: DocBlock) {
    super()
  }

  eq(other: BlockGapWidget) {
    return other.block.id === this.block.id
  }

  toDOM() {
    const el = document.createElement('div')
    el.className = 'ml-block-gap'
    el.dataset.blockId = this.block.id
    el.setAttribute('aria-hidden', 'true')
    return el
  }
}

class BlockPendingWidget extends WidgetType {
  constructor(readonly block: DocBlock) {
    super()
  }

  eq(other: BlockPendingWidget) {
    return other.block.id === this.block.id
  }

  toDOM() {
    const el = document.createElement('div')
    el.className = 'ml-block-pending'
    el.dataset.blockId = this.block.id
    el.textContent = '…'
    return el
  }
}

export function activateBlock(view: EditorView, block: DocBlock, localOffset = 0) {
  const docLength = view.state.doc.length
  const start = Math.max(0, Math.min(block.start, docLength))
  const end = Math.max(start, Math.min(block.end, docLength))
  const anchor = Math.min(
    start + localOffset,
    Math.max(end - 1, start),
  )

  view.dispatch({
    selection: { anchor, head: anchor },
    effects: setActiveBlock.of(block.id),
    scrollIntoView: true,
  })
  view.focus()
}

interface PreviewDecorationState {
  decorations: DecorationSet
  atomic: DecorationSet
  previewCache: Map<string, string>
}

interface BuiltDecorations {
  decorations: DecorationSet
  atomic: DecorationSet
}

function buildDecorations(
  blocks: DocBlock[],
  activeBlockId: string | null,
  mode: HighlightMode,
  renderLimit: number,
  previewCache: Map<string, string>,
  docLength: number,
): BuiltDecorations {
  const decorations = []
  // Only block-replacing widgets are atomic. The active block stays as plain
  // editable source, so it must never be part of the atomic range set or the
  // cursor would get bounced out of the text being edited.
  const atomic = []

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index]
    const start = Math.max(0, Math.min(block.start, docLength))
    const end = Math.max(start, Math.min(block.end, docLength))
    if (end <= start) continue

    // The block under the cursor reveals its raw Markdown source for editing.
    // Every other block keeps rendering as a preview so the document never
    // collapses into raw text while you type.
    if (block.id === activeBlockId) {
      decorations.push(
        Decoration.mark({ class: 'cm-active-block-range' }).range(start, end),
      )
      continue
    }

    const isGap = block.id.startsWith('gap') && /^\s*$/.test(block.raw)

    if (isGap) {
      const decoration = Decoration.replace({
        widget: new BlockGapWidget(block),
        block: true,
        inclusive: true,
      }).range(start, end)
      decorations.push(decoration)
      atomic.push(decoration)
      continue
    }

    if (index >= renderLimit) {
      const decoration = Decoration.replace({
        widget: new BlockPendingWidget(block),
        block: true,
        inclusive: false,
      }).range(start, end)
      decorations.push(decoration)
      atomic.push(decoration)
      continue
    }

    const cacheKey = `${mode}:${block.hash}`
    let html = previewCache.get(cacheKey)

    if (!html) {
      html = renderMarkdownBlock(block.raw, mode)
      previewCache.set(cacheKey, html)
    }

    const decoration = Decoration.replace({
      widget: new BlockPreviewWidget(block, html),
      block: true,
      inclusive: false,
    }).range(start, end)
    decorations.push(decoration)
    atomic.push(decoration)
  }

  return {
    decorations: Decoration.set(decorations, true),
    atomic: Decoration.set(atomic, true),
  }
}

function shouldRebuildDecorations(
  transaction: import('@codemirror/state').Transaction,
) {
  if (transaction.docChanged) return true
  if (transaction.effects.some((effect) => effect.is(refreshBlockDecorations))) return true
  if (transaction.state.field(blockEditorField) !== transaction.startState.field(blockEditorField)) {
    return true
  }
  return false
}

export function createBlockDecorationField(
  getMode: () => HighlightMode,
  getRenderLimit: () => number,
) {
  return StateField.define<PreviewDecorationState>({
    create(state) {
      const previewCache = new Map<string, string>()
      const { activeBlockId, blocks } = state.field(blockEditorField)
      const { decorations, atomic } = buildDecorations(
        blocks,
        activeBlockId,
        getMode(),
        getRenderLimit(),
        previewCache,
        state.doc.length,
      )

      return { decorations, atomic, previewCache }
    },
    update(state, transaction) {
      if (!shouldRebuildDecorations(transaction)) {
        return state
      }

      const { activeBlockId, blocks } = transaction.state.field(blockEditorField)
      const { decorations, atomic } = buildDecorations(
        blocks,
        activeBlockId,
        getMode(),
        getRenderLimit(),
        state.previewCache,
        transaction.state.doc.length,
      )

      return { decorations, atomic, previewCache: state.previewCache }
    },
    provide: (field) => [
      EditorView.decorations.from(field, (value) => value.decorations),
      EditorView.atomicRanges.of((view) => view.state.field(field).atomic),
    ],
  })
}

function blockIdFromEvent(event: MouseEvent) {
  const target = event.target
  if (!(target instanceof Element)) return null

  return target.closest<HTMLElement>('[data-block-id]')?.dataset.blockId ?? null
}

function safePosAtCoords(view: EditorView, x: number, y: number) {
  try {
    return view.posAtCoords({ x, y })
  } catch {
    return null
  }
}

function blockAtEditorPosition(view: EditorView, event: MouseEvent) {
  const pos = safePosAtCoords(view, event.clientX, event.clientY)
  if (pos === null) return null

  const { blocks } = view.state.field(blockEditorField)
  return blocks.find((item) => pos >= item.start && pos < item.end) ?? null
}

function createBlockInteractionPlugin() {
  return ViewPlugin.fromClass(class {}, {
    eventHandlers: {
      mousedown(event, view) {
        if (event.button !== 0) return false

        const { blocks, activeBlockId } = view.state.field(blockEditorField)
        const blockId = blockIdFromEvent(event)
        const block =
          (blockId ? blocks.find((item) => item.id === blockId) : null) ??
          blockAtEditorPosition(view, event)

        // Clicking inside the block already being edited keeps the native
        // CodeMirror cursor placement.
        if (!block || block.id === activeBlockId) return false

        const { clientX, clientY } = event
        event.preventDefault()
        activateBlock(view, block, 0)

        // After the source is revealed the previous pointer location maps onto
        // a real source offset, so the caret lands where the user clicked
        // instead of jumping to the top of the block.
        requestAnimationFrame(() => {
          const resolved = safePosAtCoords(view, clientX, clientY)
          if (resolved === null) return

          const low = block.start
          const high = Math.max(low, block.end - 1)
          const clamped = Math.max(low, Math.min(resolved, high))
          if (clamped === view.state.selection.main.head) return

          view.dispatch({ selection: { anchor: clamped, head: clamped } })
        })

        return true
      },
    },
  })
}

export function createBlockDecorationExtensions(
  getMode: () => HighlightMode,
  getRenderLimit: () => number,
) {
  return [
    createBlockDecorationField(getMode, getRenderLimit),
    createBlockInteractionPlugin(),
  ]
}
