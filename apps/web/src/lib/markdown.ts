import DOMPurify from 'dompurify'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'
import { marked } from 'marked'
import type { HighlightMode } from '@highlightmd/core'
import { highlightHtml } from './highlight'
import type { AiHighlight } from './ollama'

hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('css', css)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('json', json)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('md', markdown)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)

marked.use({
  gfm: true,
  breaks: true,
  renderer: {
    heading(text, level) {
      const id = text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-|-$/g, '')
      return `<h${level} id="${id}">${text}</h${level}>`
    },
  },
})

export function renderMarkdown(
  source: string,
  mode: HighlightMode | AiHighlight[],
  aiHighlights: AiHighlight[] = [],
) {
  const highlights = Array.isArray(mode) ? mode : aiHighlights
  const html = marked.parse(source, { async: false }) as string

  const safeHtml = DOMPurify.sanitize(html, {
    ADD_ATTR: ['target', 'id'],
  })

  return highlightHtml(highlightCodeBlocks(safeHtml), highlights)
}

const blockCache = new Map<string, string>()
const blockCacheLimit = 1200

export function renderMarkdownBlock(
  source: string,
  mode: HighlightMode | AiHighlight[],
  aiHighlights: AiHighlight[] = [],
) {
  const highlights = Array.isArray(mode) ? mode : aiHighlights
  const key = `${hashString(source)}:${hashAiHighlights(highlights)}`
  const cached = blockCache.get(key)

  if (cached) {
    return cached
  }

  const html = marked.parse(trimLargeCodeBlock(source), { async: false }) as string
  const safeHtml = DOMPurify.sanitize(html, {
    ADD_ATTR: ['target', 'id'],
  })
  const highlighted = highlightHtml(safeHtml, highlights)

  blockCache.set(key, highlighted)
  if (blockCache.size > blockCacheLimit) {
    const firstKey = blockCache.keys().next().value
    if (firstKey) {
      blockCache.delete(firstKey)
    }
  }

  return highlighted
}

export function highlightCodeBlocksIn(root: ParentNode) {
  root.querySelectorAll('pre code:not([data-code-highlighted])').forEach((code) => {
    const language = Array.from(code.classList)
      .find((className) => className.startsWith('language-'))
      ?.replace('language-', '')

    const source = code.textContent ?? ''
    const result =
      language && hljs.getLanguage(language)
        ? hljs.highlight(source, { language })
        : hljs.highlightAuto(source)

    code.innerHTML = result.value
    code.classList.add('hljs')
    code.setAttribute('data-code-highlighted', 'true')
  })
}

export function exportHtmlDocument(renderedHtml: string, title = 'HightlightMD Export') {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1c2430; background: #fbfaf7; }
    main { max-width: 880px; margin: 0 auto; padding: 48px 24px 72px; line-height: 1.7; font-size: 17px; }
    pre { overflow: auto; padding: 16px; border-radius: 8px; background: #17202a; color: #f5f7fa; }
    code { font-family: "SFMono-Regular", Consolas, monospace; }
    :not(pre) > code { padding: 0.15em 0.35em; border-radius: 4px; background: #eef1f4; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #d7dce2; padding: 8px 10px; }
    .ml-highlight { border-radius: 4px; padding: 0.03em 0.16em; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
    .ml-highlight-risk { background: #ffe3df; color: #8f1d12; }
    .ml-highlight-action { background: #dff5ea; color: #135c39; }
    .ml-highlight-decision { background: #fff0ba; color: #6a4a00; }
    .ml-highlight-number { background: #deedff; color: #174a86; }
    .ml-highlight-tech { background: #e9e4ff; color: #44318d; }
  </style>
</head>
<body>
  <main>${renderedHtml}</main>
</body>
</html>`
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function hashAiHighlights(highlights: AiHighlight[]) {
  if (highlights.length === 0) return 'no-ai'
  return hashString(highlights.map((highlight) => `${highlight.kind}:${highlight.text}`).join('|'))
}

function highlightCodeBlocks(html: string) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstElementChild

  if (!root) return html

  root.querySelectorAll('pre code').forEach((code) => {
    const language = Array.from(code.classList)
      .find((className) => className.startsWith('language-'))
      ?.replace('language-', '')

    const source = code.textContent ?? ''
    const result =
      language && hljs.getLanguage(language)
        ? hljs.highlight(source, { language })
        : hljs.highlightAuto(source)

    code.innerHTML = result.value
    code.classList.add('hljs')
  })

  return root.innerHTML
}

function trimLargeCodeBlock(source: string) {
  const lines = source.split('\n')
  const first = lines[0]?.trim()

  if (!first?.startsWith('```') && !first?.startsWith('~~~')) {
    return source
  }

  if (lines.length <= 520) {
    return source
  }

  const head = lines.slice(0, 121)
  const tail = lines[lines.length - 1] ?? '```'

  return `${head.join('\n')}\n\n// Large code block collapsed. Showing first 120 lines of ${lines.length - 2}.\n${tail}\n`
}

function hashString(value: string) {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(36)
}
