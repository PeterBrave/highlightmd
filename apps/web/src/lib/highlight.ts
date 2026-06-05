import type { HighlightKind, HighlightMode } from '@highlightmd/core'

interface Rule {
  kind: HighlightKind
  patterns: RegExp[]
  modes: HighlightMode[]
}

const rules: Rule[] = [
  {
    kind: 'decision',
    modes: ['light', 'pitch', 'review'],
    patterns: [
      /\b(conclusion|recommendation|recommended|must|should|final choice|core reason)\b/gi,
      /(结论|建议|推荐|必须|不建议|核心原因|最终选择)/g,
    ],
  },
  {
    kind: 'risk',
    modes: ['light', 'review', 'tech'],
    patterns: [
      /\b(risks?|issues?|limitations?|blocked|dependencies|dependency|trade-offs?|fallback|rollback|compatibility|security|performance)\b/gi,
      /(风险|限制|问题|阻塞|依赖|回滚|兼容|安全|性能|成本)/g,
    ],
  },
  {
    kind: 'action',
    modes: ['review', 'pitch'],
    patterns: [
      /\b(TODO|Action|Next step|Owner|Deadline|Follow-up)\b/gi,
      /(负责人|时间节点|下一步|行动项|上线)/g,
    ],
  },
  {
    kind: 'number',
    modes: ['light', 'review', 'pitch', 'tech'],
    patterns: [
      /\b\d+(?:\.\d+)?\s?(?:ms|s|MB|GB|KB|%|fps|QPS|users|requests|USD|RMB)\b/gi,
      /\b(?:20\d{2})[-/](?:0?[1-9]|1[0-2])[-/](?:0?[1-9]|[12]\d|3[01])\b/g,
      /\bv?\d+\.\d+(?:\.\d+)?\b/gi,
    ],
  },
  {
    kind: 'tech',
    modes: ['tech', 'review'],
    patterns: [
      /\b(API|SDK|endpoint|function|package|database|schema|model|service|worker|pipeline|cache|runtime|adapter)\b/gi,
      /\b[A-Z][A-Za-z0-9]*\.[A-Za-z0-9_.-]+\b/g,
      /\b[A-Z_]{3,}\b/g,
      /\b(?:\.\/|\.\.\/|\/)?[\w.-]+\/[\w./-]+\b/g,
      /(接口|模块|配置|架构|服务|模型|数据库|端侧|高亮|渲染|缓存)/g,
    ],
  },
]

const densityLimit: Record<HighlightMode, number> = {
  light: 10,
  review: 22,
  pitch: 18,
  tech: 24,
}

const priorityByMode: Record<HighlightMode, HighlightKind[]> = {
  light: ['decision', 'risk', 'number', 'keyword', 'tech', 'action', 'code', 'custom'],
  review: ['risk', 'action', 'number', 'decision', 'tech', 'keyword', 'code', 'custom'],
  pitch: ['decision', 'action', 'number', 'risk', 'keyword', 'tech', 'code', 'custom'],
  tech: ['tech', 'risk', 'number', 'decision', 'action', 'keyword', 'code', 'custom'],
}

export function highlightHtml(html: string, mode: HighlightMode): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstElementChild

  if (!root) {
    return html
  }

  const matches = collectMatches(root, mode)
  if (matches.length === 0) {
    return html
  }

  const prioritized = matches
    .sort((a, b) => {
      const kindDelta =
        priorityByMode[mode].indexOf(a.kind) - priorityByMode[mode].indexOf(b.kind)
      return kindDelta || b.text.length - a.text.length
    })
    .slice(0, densityLimit[mode])

  for (const match of prioritized) {
    wrapFirstTextMatch(root, match.text, match.kind)
  }

  return root.innerHTML
}

function collectMatches(root: Element, mode: HighlightMode) {
  const text = root.textContent ?? ''
  const seen = new Set<string>()
  const matches: Array<{ text: string; kind: HighlightKind }> = []

  for (const rule of rules) {
    if (!rule.modes.includes(mode)) continue

    for (const pattern of rule.patterns) {
      for (const match of text.matchAll(pattern)) {
        const value = match[0]?.trim()
        if (!value || value.length < 2) continue

        const key = `${rule.kind}:${value.toLowerCase()}`
        if (seen.has(key)) continue

        seen.add(key)
        matches.push({ text: value, kind: rule.kind })
      }
    }
  }

  return matches
}

function wrapFirstTextMatch(root: Element, needle: string, kind: HighlightKind) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      if (!parent) return NodeFilter.FILTER_REJECT
      if (parent.closest('code, pre, a, .ml-highlight')) return NodeFilter.FILTER_REJECT
      return node.textContent?.includes(needle)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP
    },
  })

  const node = walker.nextNode()
  if (!node || !node.textContent) return

  const index = node.textContent.indexOf(needle)
  if (index < 0) return

  const range = document.createRange()
  range.setStart(node, index)
  range.setEnd(node, index + needle.length)

  const span = document.createElement('span')
  span.className = `ml-highlight ml-highlight-${kind}`
  range.surroundContents(span)
}
