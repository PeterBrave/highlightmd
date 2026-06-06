import type { AiHighlight } from './ollama'
import { applyAiHighlightsToHtml } from './editorHighlights'

export function highlightHtml(html: string, aiHighlights: AiHighlight[] = []): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstElementChild

  if (!root) {
    return html
  }

  applyAiHighlightsToHtml(root, aiHighlights)
  return root.innerHTML
}
