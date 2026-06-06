import { hashString } from './blocks'
import type { AiHighlight } from './ollama'

export interface AiHighlightCache {
  sourceHash: string
  highlights: AiHighlight[]
  summary: string
}

const cacheStorageKey = 'highlightmd:ai-highlights'

export function loadAiHighlightCache(source: string): AiHighlightCache | null {
  const raw = localStorage.getItem(cacheStorageKey)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<AiHighlightCache>
    if (!parsed || typeof parsed.sourceHash !== 'string' || !Array.isArray(parsed.highlights)) {
      return null
    }

    const sourceHash = hashString(source)
    if (parsed.sourceHash !== sourceHash) return null

    return {
      sourceHash,
      highlights: parsed.highlights.filter(isValidHighlight),
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    }
  } catch {
    return null
  }
}

export function saveAiHighlightCache(
  source: string,
  highlights: AiHighlight[],
  summary: string,
) {
  if (highlights.length === 0) {
    clearAiHighlightCache()
    return
  }

  const payload: AiHighlightCache = {
    sourceHash: hashString(source),
    highlights,
    summary,
  }
  localStorage.setItem(cacheStorageKey, JSON.stringify(payload))
}

export function clearAiHighlightCache() {
  localStorage.removeItem(cacheStorageKey)
}

function isValidHighlight(value: unknown): value is AiHighlight {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<AiHighlight>
  return typeof item.text === 'string' && typeof item.kind === 'string'
}
