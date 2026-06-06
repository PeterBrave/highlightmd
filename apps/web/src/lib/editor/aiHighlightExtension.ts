import { createExtension, createStore } from '@blocknote/core'
import type { HighlightKind } from '@highlightmd/core'
import type { Node as ProseMirrorNode } from 'prosemirror-model'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import type { AiHighlight } from '../ollama'

export const AI_HIGHLIGHT_EXTENSION_KEY = 'aiHighlights'

const PLUGIN_KEY = new PluginKey('highlightmd-ai-highlights')
const aiHighlightLimit = 40
const priority: HighlightKind[] = [
  'risk',
  'decision',
  'action',
  'number',
  'keyword',
  'tech',
  'code',
  'custom',
]

interface TextSegment {
  pos: number
  text: string
}

function normalizeForMatch(text: string) {
  return text.replace(/\s+/g, '').toLowerCase()
}

function collectTextSegments(doc: ProseMirrorNode): TextSegment[] {
  const segments: TextSegment[] = []

  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return

    const $pos = doc.resolve(pos)
    if ($pos.parent.type.spec.code) return false

    segments.push({ pos, text: node.text })
  })

  return segments
}

function mapCharRangeToPositions(segments: TextSegment[], start: number, end: number) {
  let cursor = 0
  let from = -1
  let to = -1

  for (const segment of segments) {
    const segmentStart = cursor
    const segmentEnd = cursor + segment.text.length

    if (from < 0 && start < segmentEnd) {
      from = segment.pos + Math.max(0, start - segmentStart)
    }

    if (to < 0 && end <= segmentEnd) {
      to = segment.pos + Math.max(0, end - segmentStart)
      break
    }

    cursor = segmentEnd
  }

  return from >= 0 && to > from ? { from, to } : null
}

function findExactTextRange(segments: TextSegment[], searchText: string) {
  const joined = segments.map((segment) => segment.text).join('')
  const index = joined.indexOf(searchText)
  if (index < 0) return null
  return mapCharRangeToPositions(segments, index, index + searchText.length)
}

function findNormalizedTextRange(segments: TextSegment[], searchText: string) {
  const indexedChars: Array<{ pos: number; char: string }> = []

  for (const segment of segments) {
    for (let i = 0; i < segment.text.length; i += 1) {
      const char = segment.text[i]
      if (/\s/.test(char)) continue
      indexedChars.push({ pos: segment.pos + i, char: char.toLowerCase() })
    }
  }

  const normalizedDoc = indexedChars.map((entry) => entry.char).join('')
  const normalizedSearch = normalizeForMatch(searchText)
  const index = normalizedDoc.indexOf(normalizedSearch)
  if (index < 0 || normalizedSearch.length === 0) return null

  const from = indexedChars[index].pos
  const last = indexedChars[index + normalizedSearch.length - 1]
  return { from, to: last.pos + 1 }
}

function findTextRangeInDoc(doc: ProseMirrorNode, searchText: string) {
  const segments = collectTextSegments(doc)
  if (segments.length === 0) return null

  const trimmed = searchText.trim()
  return findExactTextRange(segments, trimmed) ?? findNormalizedTextRange(segments, trimmed)
}

function buildDecorations(doc: ProseMirrorNode, highlights: AiHighlight[]) {
  if (highlights.length === 0) return DecorationSet.empty

  const prioritized = highlights
    .slice()
    .sort((a, b) => {
      const kindDelta = priority.indexOf(a.kind) - priority.indexOf(b.kind)
      return kindDelta || b.text.length - a.text.length
    })
    .slice(0, aiHighlightLimit)

  const decorations: Decoration[] = []
  const usedRanges: Array<{ from: number; to: number }> = []

  for (const highlight of prioritized) {
    const range = findTextRangeInDoc(doc, highlight.text)
    if (!range) continue

    const overlaps = usedRanges.some(
      (existing) => !(range.to <= existing.from || range.from >= existing.to),
    )
    if (overlaps) continue

    usedRanges.push(range)
    decorations.push(
      Decoration.inline(range.from, range.to, {
        class: `ml-highlight ml-highlight-${highlight.kind} ml-highlight-ai`,
        title: highlight.reason ? `AI: ${highlight.reason}` : undefined,
        'data-highlight-text': highlight.text,
      }),
    )
  }

  return DecorationSet.create(doc, decorations)
}

export const AiHighlightExtension = createExtension(({ editor }) => {
  const store = createStore(
    { highlights: [] as AiHighlight[] },
    {
      onUpdate() {
        editor.transact((tr) => tr.setMeta(PLUGIN_KEY, true))
      },
    },
  )

  return {
    key: AI_HIGHLIGHT_EXTENSION_KEY,
    store,
    prosemirrorPlugins: [
      new Plugin({
        key: PLUGIN_KEY,
        props: {
          decorations(state) {
            return buildDecorations(state.doc, store.state.highlights)
          },
        },
      }),
    ],
    setHighlights(highlights: AiHighlight[]) {
      store.setState({ highlights })
    },
    clearHighlights() {
      store.setState({ highlights: [] })
    },
  } as const
})
