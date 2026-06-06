import type { DocBlock, DocBlockType } from '@highlightmd/core'

export function segmentMarkdown(source: string): DocBlock[] {
  const normalized = source.replace(/\r\n?/g, '\n')
  const lines = normalized.split('\n')
  const blocks: DocBlock[] = []
  let index = 0
  let offset = 0

  while (index < lines.length) {
    const startLine = index
    const startOffset = offset
    const line = lines[index]

    if (line.trim() === '') {
      index += 1
      offset += line.length + 1
      continue
    }

    if (startLine === 0 && line.trim() === '---') {
      index += 1
      offset += line.length + 1
      while (index < lines.length && lines[index].trim() !== '---') {
        offset += lines[index].length + 1
        index += 1
      }
      if (index < lines.length) {
        offset += lines[index].length + 1
        index += 1
      }
      pushBlock(blocks, normalized, startOffset, offset, 'frontmatter')
      continue
    }

    const fence = /^(```|~~~)/.exec(line.trim())
    if (fence) {
      const fenceToken = fence[1]
      index += 1
      offset += line.length + 1
      while (index < lines.length && !lines[index].trim().startsWith(fenceToken)) {
        offset += lines[index].length + 1
        index += 1
      }
      if (index < lines.length) {
        offset += lines[index].length + 1
        index += 1
      }
      pushBlock(blocks, normalized, startOffset, offset, 'code')
      continue
    }

    if (/^#{1,6}\s+/.test(line)) {
      index += 1
      offset += line.length + 1
      pushBlock(blocks, normalized, startOffset, offset, 'heading')
      continue
    }

    if (/^\s*(?:[-*+]\s+|\d+\.\s+)/.test(line)) {
      index += 1
      offset += line.length + 1
      pushBlock(blocks, normalized, startOffset, offset, 'list')
      continue
    }

    if (/^\s*>/.test(line)) {
      index += 1
      offset += line.length + 1
      pushBlock(blocks, normalized, startOffset, offset, 'blockquote')
      continue
    }

    if (/^\s*\|.*\|\s*$/.test(line)) {
      ;({ index, offset } = consumeUntilBoundary(lines, index, offset))
      pushBlock(blocks, normalized, startOffset, offset, 'table')
      continue
    }

    if (/^\s*(?:---|\*\*\*|___)\s*$/.test(line)) {
      index += 1
      offset += line.length + 1
      pushBlock(blocks, normalized, startOffset, offset, 'hr')
      continue
    }

    if (/^\s*!\[/.test(line)) {
      index += 1
      offset += line.length + 1
      pushBlock(blocks, normalized, startOffset, offset, 'image')
      continue
    }

    index += 1
    offset += line.length + 1
    pushBlock(blocks, normalized, startOffset, offset, 'paragraph')
  }

  return fillDocumentGaps(blocks, normalized)
}

function fillDocumentGaps(blocks: DocBlock[], source: string): DocBlock[] {
  if (blocks.length === 0 && source.length > 0) {
    return [
      {
        id: `b0-${hashString(source)}`,
        type: 'paragraph',
        start: 0,
        end: source.length,
        raw: source,
        hash: hashString(source),
      },
    ]
  }

  const filled: DocBlock[] = []
  let cursor = 0
  let gapIndex = 0

  for (const block of blocks) {
    if (block.start > cursor) {
      const raw = source.slice(cursor, block.start)
      filled.push({
        id: `gap${gapIndex}-${hashString(raw)}`,
        type: 'paragraph',
        start: cursor,
        end: block.start,
        raw,
        hash: hashString(raw),
      })
      gapIndex += 1
    }

    filled.push(block)
    cursor = block.end
  }

  if (cursor < source.length) {
    const raw = source.slice(cursor)
    filled.push({
      id: `gap${gapIndex}-${hashString(raw)}`,
      type: 'paragraph',
      start: cursor,
      end: source.length,
      raw,
      hash: hashString(raw),
    })
  }

  return filled
}

function consumeUntilBoundary(lines: string[], index: number, offset: number) {
  while (index < lines.length) {
    const line = lines[index]
    const trimmed = line.trim()

    if (trimmed === '') {
      index += 1
      offset += line.length + 1
      break
    }

    if (
      index > 0 &&
      (/^#{1,6}\s+/.test(line) ||
        /^(```|~~~)/.test(trimmed) ||
        /^\s*(?:---|\*\*\*|___)\s*$/.test(line))
    ) {
      break
    }

    index += 1
    offset += line.length + 1
  }

  return { index, offset }
}

function pushBlock(
  blocks: DocBlock[],
  source: string,
  start: number,
  end: number,
  type: DocBlockType,
) {
  const raw = source.slice(start, end)
  const hash = hashString(raw)

  blocks.push({
    id: `b${blocks.length}-${hash}`,
    type,
    start,
    end,
    raw,
    hash,
  })
}

export function hashString(value: string) {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(36)
}
