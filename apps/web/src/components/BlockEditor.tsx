import { useCallback, useEffect, useRef } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import type { Block, BlockNoteEditor } from '@blocknote/core'
import type { AiHighlight } from '../lib/ollama'
import {
  AI_HIGHLIGHT_EXTENSION_KEY,
  AiHighlightExtension,
} from '../lib/editor/aiHighlightExtension'

import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'

const aiHighlightExtension = AiHighlightExtension()

export interface BlockEditorHandle {
  getMarkdown: () => Promise<string>
  setMarkdown: (md: string) => Promise<void>
  getHeadings: () => HeadingItem[]
  focus: () => void
  getEditorRoot: () => HTMLElement | null
  setAiHighlights: (highlights: AiHighlight[]) => void
}

export interface HeadingItem {
  id: string
  text: string
  level: number
  blockId: string
}

interface BlockEditorProps {
  initialMarkdown: string
  theme: 'light' | 'dark'
  aiHighlights?: AiHighlight[]
  editable?: boolean
  onChange?: (editor: BlockNoteEditor) => void
  onReady?: (handle: BlockEditorHandle) => void
}

function extractTextFromBlock(block: Block): string {
  if (!block.content || !Array.isArray(block.content)) return ''
  return (block.content as Array<{ type: string; text?: string }>)
    .filter((ic) => ic.type === 'text' && typeof ic.text === 'string')
    .map((ic) => ic.text!)
    .join('')
}

function extractHeadings(blocks: Block[]): HeadingItem[] {
  const result: HeadingItem[] = []
  for (const block of blocks) {
    if (block.type === 'heading') {
      const text = extractTextFromBlock(block)
      const level = (block.props as { level?: number })?.level ?? 1
      const id = text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-|-$/g, '')
      result.push({ id, text, level, blockId: block.id })
    }
    if (block.children && block.children.length > 0) {
      result.push(...extractHeadings(block.children as Block[]))
    }
  }
  return result
}

function getAiHighlightApi(editor: BlockNoteEditor) {
  return editor.getExtension(AI_HIGHLIGHT_EXTENSION_KEY) as
    | {
        setHighlights: (highlights: AiHighlight[]) => void
        clearHighlights: () => void
      }
    | undefined
}

export function BlockEditor({
  initialMarkdown,
  theme,
  aiHighlights = [],
  editable = true,
  onChange,
  onReady,
}: BlockEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const onChangeRef = useRef(onChange)
  const onReadyRef = useRef(onReady)
  const aiHighlightsRef = useRef(aiHighlights)
  const initializedRef = useRef(false)

  onChangeRef.current = onChange
  onReadyRef.current = onReady
  aiHighlightsRef.current = aiHighlights

  const editor = useCreateBlockNote({
    extensions: [aiHighlightExtension],
    domAttributes: {
      editor: {
        class: 'highlightmd-blocknote',
      },
    },
  })

  const getEditorRoot = useCallback(() => {
    return containerRef.current?.querySelector('.bn-editor') as HTMLElement | null
  }, [])

  const syncHighlights = useCallback(
    (highlights: AiHighlight[]) => {
      getAiHighlightApi(editor)?.setHighlights(highlights)
    },
    [editor],
  )

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    async function init() {
      try {
        const blocks = await editor.tryParseMarkdownToBlocks(initialMarkdown)
        editor.replaceBlocks(editor.document, blocks)
      } catch {
        // If markdown parsing fails, leave editor with default empty content
      }

      const handle: BlockEditorHandle = {
        getMarkdown: async () => {
          return await editor.blocksToMarkdownLossy(editor.document)
        },
        setMarkdown: async (md: string) => {
          const blocks = await editor.tryParseMarkdownToBlocks(md)
          editor.replaceBlocks(editor.document, blocks)
        },
        getHeadings: () => extractHeadings(editor.document as Block[]),
        focus: () => editor.focus(),
        getEditorRoot,
        setAiHighlights: syncHighlights,
      }
      onReadyRef.current?.(handle)
      syncHighlights(aiHighlightsRef.current)
    }

    init()
  }, [editor, initialMarkdown, getEditorRoot, syncHighlights])

  useEffect(() => {
    syncHighlights(aiHighlights)
  }, [aiHighlights, syncHighlights])

  const handleChange = useCallback(() => {
    onChangeRef.current?.(editor)
  }, [editor])

  return (
    <div className="block-editor-host" ref={containerRef}>
      <BlockNoteView
        editor={editor}
        editable={editable}
        theme={theme}
        onChange={handleChange}
      />
    </div>
  )
}
