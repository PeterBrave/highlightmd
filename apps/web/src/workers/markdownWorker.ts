import type { DocBlock } from '@highlightmd/core'
import { segmentMarkdown } from '../lib/blocks'

interface SegmentRequest {
  id: number
  source: string
}

interface SegmentResponse {
  id: number
  blocks: DocBlock[]
  durationMs: number
}

self.onmessage = (event: MessageEvent<SegmentRequest>) => {
  const startedAt = performance.now()
  const blocks = segmentMarkdown(event.data.source)

  self.postMessage({
    id: event.data.id,
    blocks,
    durationMs: performance.now() - startedAt,
  } satisfies SegmentResponse)
}
