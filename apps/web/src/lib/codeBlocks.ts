import { highlightCodeBlocksIn } from './markdown'

const COPY_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>' +
  '</svg>'

const LANGUAGE_LABELS: Record<string, string> = {
  bash: 'Bash',
  sh: 'Shell',
  css: 'CSS',
  html: 'HTML',
  javascript: 'JavaScript',
  js: 'JavaScript',
  json: 'JSON',
  markdown: 'Markdown',
  md: 'Markdown',
  python: 'Python',
  py: 'Python',
  sql: 'SQL',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  xml: 'XML',
  yaml: 'YAML',
  yml: 'YAML',
  mermaid: 'Mermaid',
}

function languageFromCode(code: Element) {
  const fromClass = Array.from(code.classList)
    .find((className) => className.startsWith('language-'))
    ?.replace('language-', '')
    .trim()

  if (fromClass) return fromClass

  const resultLang = code.getAttribute('data-language')?.trim()
  return resultLang || null
}

function languageLabel(language: string | null) {
  if (!language) return 'text'
  return LANGUAGE_LABELS[language] ?? language
}

function languageClassToken(language: string) {
  return language.replace(/[^a-z0-9_-]/gi, '')
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
}

export function enhanceCodeBlocksIn(root: ParentNode) {
  highlightCodeBlocksIn(root)

  root.querySelectorAll('pre').forEach((pre) => {
    if (pre.closest('.ml-code-block')) return

    const code = pre.querySelector('code')
    if (!code) return

    const language = languageFromCode(code)
    const sourceText = code.textContent ?? ''

    const block = document.createElement('div')
    block.className = 'ml-code-block'

    const header = document.createElement('div')
    header.className = 'ml-code-block-header'

    const lang = document.createElement('span')
    lang.className = 'ml-code-block-lang'
    lang.textContent = languageLabel(language)

    const copyBtn = document.createElement('button')
    copyBtn.type = 'button'
    copyBtn.className = 'ml-code-copy-btn'
    copyBtn.setAttribute('aria-label', '复制代码')
    copyBtn.innerHTML = `${COPY_ICON}<span class="ml-code-copy-label">复制</span>`

    copyBtn.addEventListener('click', async (event) => {
      event.preventDefault()
      event.stopPropagation()

      const label = copyBtn.querySelector('.ml-code-copy-label')
      try {
        await copyText(sourceText)
        copyBtn.classList.add('is-copied')
        if (label) label.textContent = '已复制'
      } catch {
        if (label) label.textContent = '复制失败'
      }

      window.setTimeout(() => {
        copyBtn.classList.remove('is-copied')
        if (label) label.textContent = '复制'
      }, 2000)
    })

    header.append(lang, copyBtn)

    const highlight = document.createElement('div')
    highlight.className = language
      ? `highlight highlight-source-${languageClassToken(language)}`
      : 'highlight'

    const parent = pre.parentNode
    if (!parent) return

    parent.insertBefore(block, pre)
    highlight.appendChild(pre)
    block.append(header, highlight)
  })
}
