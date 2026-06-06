import { StateEffect, StateField, type Text, type Transaction } from '@codemirror/state'
import type { DocBlock } from '@highlightmd/core'
import { hashString, segmentMarkdown } from '../blocks'

const inlineSegmentLimit = 200_000

export const setActiveBlock = StateEffect.define<string | null>()
export const setDocBlocks = StateEffect.define<DocBlock[]>()
export const setPreviewReady = StateEffect.define<null>()

export interface BlockEditorState {
  activeBlockId: string | null
  blocks: DocBlock[]
}

export const blockEditorField = StateField.define<BlockEditorState>({
  create() {
    return {
      activeBlockId: null,
      blocks: [],
    }
  },
  update(value, transaction) {
    let next = value

    for (const effect of transaction.effects) {
      if (effect.is(setActiveBlock)) {
        next = { ...next, activeBlockId: effect.value }
        if (effect.value === null && transaction.state.doc.length <= inlineSegmentLimit) {
          next = {
            ...next,
            blocks: normalizeBlocks(
              segmentMarkdown(transaction.state.doc.toString()),
              transaction.state.doc,
            ),
          }
        }
      }

      if (effect.is(setDocBlocks)) {
        next = reconcileBlocks(next, effect.value, transaction.state.doc, transaction)
      }
    }

    if (transaction.docChanged) {
      next = refreshBlocksFromDoc(next, transaction)
    }

    return next
  },
})

export function findBlockAtOffset(blocks: DocBlock[], offset: number): DocBlock | null {
  const clamped = Math.max(0, offset)
  // A caret sitting exactly on a boundary belongs to the block that *starts*
  // there. Only when no block contains the offset (e.g. the caret is at the
  // very end of the document) do we fall back to the block that ends there, so
  // editing the trailing block doesn't deactivate it into a preview.
  let boundaryFallback: DocBlock | null = null
  for (const block of blocks) {
    if (clamped >= block.start && clamped < block.end) {
      return block
    }
    if (clamped === block.end) {
      boundaryFallback = block
    }
  }
  return boundaryFallback
}

function reconcileBlocks(
  current: BlockEditorState,
  incoming: DocBlock[],
  doc: Text,
  transaction: Transaction,
): BlockEditorState {
  const docText = doc.toString()
  const valid = normalizeBlocks(incoming, doc)
  if (valid.length === 0 || docText.length === 0) {
    return { activeBlockId: null, blocks: valid }
  }

  // setDocBlocks only arrives from outside the editor (initial sync, blur-time
  // resync, or a full external document replace). None of those represent the
  // user placing a caret, so we must not promote a block to the editable
  // "active" state from the anchor here — doing so renders that block as raw
  // Markdown while the editor is idle. Preserve an existing active block only
  // when its identity survives the new segmentation.
  const activeBlock = current.activeBlockId
    ? valid.find((block) => block.id === current.activeBlockId)
    : null

  return {
    activeBlockId: activeBlock?.id ?? null,
    blocks: valid,
  }
}

function refreshBlocksFromDoc(current: BlockEditorState, transaction: Transaction) {
  const doc = transaction.state.doc
  const docText = doc.toString()
  const anchor = transaction.state.selection.main.anchor

  const blocks =
    docText.length <= inlineSegmentLimit
      ? segmentMarkdown(docText)
      : current.blocks.length > 0
        ? mapBlocksThroughChanges(current.blocks, transaction, doc)
        : segmentMarkdown(docText)

  const valid = normalizeBlocks(blocks, doc)

  // Block ids embed a content hash, so editing the active block changes its id
  // every keystroke and the id lookup below misses. Fall back to the caret
  // position, but only for genuine user edits — programmatic document
  // replacements (e.g. loading a file) must not flip a block into raw source.
  const isUserEdit =
    transaction.isUserEvent('input') ||
    transaction.isUserEvent('delete') ||
    transaction.isUserEvent('move')
  const activeBlock =
    (current.activeBlockId
      ? valid.find((block) => block.id === current.activeBlockId)
      : null) ?? (isUserEdit ? findBlockAtOffset(valid, anchor) : null)

  return {
    activeBlockId: activeBlock?.id ?? null,
    blocks: valid,
  }
}

function normalizeBlocks(blocks: DocBlock[], doc: Text) {
  const docLength = doc.length

  return blocks
    .map((block) => {
      const start = Math.max(0, Math.min(block.start, docLength))
      const end = Math.max(start, Math.min(block.end, docLength))
      const raw = doc.sliceString(start, end)

      return {
        ...block,
        start,
        end,
        raw,
        hash: hashString(raw),
      }
    })
    .filter((block) => block.end > block.start)
}

function mapBlocksThroughChanges(
  blocks: DocBlock[],
  transaction: Transaction,
  doc: Text,
): DocBlock[] {
  // Positions handed to mapPos must lie within the *previous* document or
  // CodeMirror throws a RangeError. Stale block bounds can exceed it, so clamp
  // against the old length before mapping.
  const previousLength = transaction.startState.doc.length

  return blocks.map((block) => {
    const safeStart = Math.max(0, Math.min(block.start, previousLength))
    const safeEnd = Math.max(safeStart, Math.min(block.end, previousLength))
    const start = transaction.changes.mapPos(safeStart, 1)
    const end = transaction.changes.mapPos(safeEnd, -1)
    const clampedStart = Math.max(0, Math.min(start, doc.length))
    const clampedEnd = Math.max(clampedStart, Math.min(end, doc.length))
    const raw = doc.sliceString(clampedStart, clampedEnd)

    return {
      ...block,
      start: clampedStart,
      end: clampedEnd,
      raw,
      hash: hashString(raw),
      dirty: true,
    }
  })
}
