import type { HighlightKind } from '@highlightmd/core'
import type { AiHighlight } from './ollama'

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

const skipSelector = 'code, pre, a, .ml-highlight, .bn-code-block'

export function applyAiHighlightsToHtml(root: Element, aiHighlights: AiHighlight[] = []) {
  clearAiHighlights(root)
  if (aiHighlights.length === 0) return

  const prioritized = aiHighlights
    .slice()
    .sort((a, b) => {
      const kindDelta = priority.indexOf(a.kind) - priority.indexOf(b.kind)
      return kindDelta || b.text.length - a.text.length
    })
    .slice(0, aiHighlightLimit)

  for (const match of prioritized) {
    wrapFirstTextMatch(root, match)
  }
}

export function scrollToHighlight(root: Element, text: string) {
  for (const span of root.querySelectorAll('.ml-highlight-ai')) {
    if (span.textContent?.includes(text)) {
      span.scrollIntoView({ behavior: 'smooth', block: 'center' })
      span.classList.add('ml-highlight-active')
      window.setTimeout(() => span.classList.remove('ml-highlight-active'), 1600)
      return true
    }
  }

  const normalized = text.replace(/\s+/g, '')
  for (const span of root.querySelectorAll('.ml-highlight-ai')) {
    const content = span.textContent?.replace(/\s+/g, '') ?? ''
    if (content.includes(normalized)) {
      span.scrollIntoView({ behavior: 'smooth', block: 'center' })
      span.classList.add('ml-highlight-active')
      window.setTimeout(() => span.classList.remove('ml-highlight-active'), 1600)
      return true
    }
  }

  return false
}

export function clearAiHighlights(root: ParentNode) {
  const highlights = root.querySelectorAll('.ml-highlight-ai')
  for (const span of highlights) {
    const parent = span.parentNode
    if (!parent) continue
    while (span.firstChild) {
      parent.insertBefore(span.firstChild, span)
    }
    parent.removeChild(span)
    parent.normalize()
  }
}

function wrapFirstTextMatch(root: Element, match: AiHighlight) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      if (!parent) return NodeFilter.FILTER_REJECT
      if (parent.closest(skipSelector)) return NodeFilter.FILTER_REJECT
      return node.textContent?.includes(match.text)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP
    },
  })

  const node = walker.nextNode()
  if (!node || !node.textContent) return

  const index = node.textContent.indexOf(match.text)
  if (index < 0) return

  const range = document.createRange()
  range.setStart(node, index)
  range.setEnd(node, index + match.text.length)

  const span = document.createElement('span')
  span.className = `ml-highlight ml-highlight-${match.kind} ml-highlight-ai`
  span.dataset.highlightText = match.text
  if (match.reason) {
    span.title = `AI: ${match.reason}`
  }
  range.surroundContents(span)
}
