import type { HighlightKind } from '@highlightmd/core'
import { getOllamaAllowSiteCommand, t } from './i18n'
import {
  defaultModelBindings,
  defaultPromptPresets,
  mergeModelBindings,
  mergePromptPresets,
  renderPromptTemplate,
  resolvePromptsForModel,
  type AiPromptPresets,
  type AiPrompts,
  type ModelPromptBinding,
} from './aiPrompts'

export type {
  AiPromptPresets,
  AiPrompts,
  ModelPromptBinding,
  PromptLocale,
} from './aiPrompts'
export {
  defaultChinesePrompts,
  defaultEnglishPrompts,
  defaultModelBindings,
  defaultPromptPresets,
  inferPromptLocale,
  mergePromptPresets,
  resolvePromptLocale,
  resolvePromptsForModel,
} from './aiPrompts'

export type ExtractionLevel = 'low' | 'medium' | 'high'

export interface AiSettings {
  enabled: boolean
  endpoint: string
  model: string
  extractionLevel: ExtractionLevel
  promptPresets: AiPromptPresets
  modelBindings: ModelPromptBinding[]
}

export interface AiHighlight {
  text: string
  kind: HighlightKind
  reason?: string
}

export interface AiAnalysisProgress {
  completedChunks: number
  totalChunks: number
  highlights: AiHighlight[]
}

interface AiAnalysisOptions {
  maxHighlights?: number
  onProgress?: (progress: AiAnalysisProgress) => void
}

interface OllamaChatResponse {
  message?: {
    content?: string
  }
}

interface ModelHighlight {
  text?: unknown
  kind?: unknown
  reason?: unknown
}

const supportedKinds = new Set<HighlightKind>([
  'keyword',
  'risk',
  'action',
  'decision',
  'number',
  'tech',
])

const fastAnalysisLimit = {
  maxChunks: 8,
  chunkChars: 700,
  timeoutMs: 8000,
  slowModelTimeoutMs: 20000,
  maxHighlightAttempts: 3,
  maxSummaryAttempts: 3,
}

const highlightRetryReminder = `\n\nImportant: return ONE JSON array like [{"text":"...","kind":"keyword","reason":"..."}]. Do not return separate JSON objects or extra text.`

const highlightRetryReminderZh = `\n\n重要：必须返回一个 JSON 数组，格式如 [{"text":"...","kind":"keyword","reason":"..."}]。不要返回多个独立 JSON 对象，不要输出其他文字。`

export const extractionLevelLimits: Record<ExtractionLevel, number> = {
  low: 6,
  medium: 12,
  high: 24,
}

export const ollamaDirectPort = 11434

export class OllamaCorsError extends Error {
  constructor(message = 'Ollama blocked the browser request (CORS).') {
    super(message)
    this.name = 'OllamaCorsError'
  }
}

export function isLocalWebAppHost() {
  if (typeof window === 'undefined') return true
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0'
}

export function getDefaultOllamaEndpoint() {
  if (import.meta.env.DEV) {
    return '/ollama'
  }
  return `http://localhost:${ollamaDirectPort}`
}

export const defaultAiSettings: AiSettings = {
  enabled: true,
  endpoint: getDefaultOllamaEndpoint(),
  model: 'gemma4:latest',
  extractionLevel: 'medium',
  promptPresets: defaultPromptPresets,
  modelBindings: defaultModelBindings,
}

interface LegacyAiSettings extends Partial<AiSettings> {
  prompts?: AiPrompts
}

export function mergeAiSettings(partial: LegacyAiSettings = {}): AiSettings {
  const endpoint = partial.endpoint?.trim()
    ? migrateStoredOllamaEndpoint(partial.endpoint)
    : getDefaultOllamaEndpoint()

  return {
    enabled: partial.enabled ?? defaultAiSettings.enabled,
    endpoint,
    model: partial.model?.trim() || defaultAiSettings.model,
    extractionLevel: partial.extractionLevel ?? defaultAiSettings.extractionLevel,
    promptPresets: mergePromptPresets(partial.promptPresets, partial.prompts),
    modelBindings: mergeModelBindings(partial.modelBindings),
  }
}

function getActivePrompts(settings: AiSettings): AiPrompts {
  return resolvePromptsForModel(settings)
}

export const highlightRetryAttempts = fastAnalysisLimit.maxHighlightAttempts
export const summaryRetryAttempts = fastAnalysisLimit.maxSummaryAttempts

const summaryRetryReminder =
  '\n\nReturn plain prose only. 2-4 sentences. No bullet lists, no JSON, no markdown fences.'

const summaryRetryReminderZh =
  '\n\n只返回 2-4 句纯文本摘要。不要列表，不要 JSON，不要 markdown 代码块。'

export async function testOllamaConnection(settings: AiSettings) {
  const endpoint = normalizeEndpoint(settings.endpoint)
  const response = await fetchWithTimeout(`${endpoint}/api/tags`, {
    timeoutMs: 5000,
  })

  if (!response.ok) {
    throw new Error(`Ollama returned ${response.status}`)
  }

  const data = (await response.json()) as { models?: Array<{ name?: string }> }
  const models = data.models?.map((model) => model.name).filter(Boolean) ?? []
  return {
    models,
    hasConfiguredModel: models.includes(settings.model),
  }
}

export async function analyzeMarkdownWithOllama(
  source: string,
  settings: AiSettings,
  options: AiAnalysisOptions = {},
): Promise<AiHighlight[]> {
  const chunks = createFastChunks(source)
  if (chunks.length === 0) return []

  const highlights: AiHighlight[] = []
  const seen = new Set<string>()
  const maxHighlights = options.maxHighlights ?? extractionLevelLimits[settings.extractionLevel]
  const perChunkLimit = Math.max(2, Math.min(6, Math.ceil(maxHighlights / chunks.length)))

  options.onProgress?.({
    completedChunks: 0,
    totalChunks: chunks.length,
    highlights,
  })

  for (const [index, chunk] of chunks.entries()) {
    const content = await requestHighlights(settings, chunk, perChunkLimit)
    for (const highlight of parseHighlights(content, chunk)) {
      const key = `${highlight.kind}:${highlight.text.toLowerCase()}`
      if (seen.has(key)) continue
      seen.add(key)
      highlights.push(highlight)
    }

    options.onProgress?.({
      completedChunks: index + 1,
      totalChunks: chunks.length,
      highlights: highlights.slice(0, maxHighlights),
    })
  }

  return highlights.slice(0, maxHighlights)
}

const summaryTimeoutMs = 6000

export async function synthesizeHighlightSummary(
  highlights: AiHighlight[],
  settings: AiSettings,
): Promise<string> {
  if (highlights.length === 0) return ''

  const prompts = getActivePrompts(settings)
  const endpoint = normalizeEndpoint(settings.endpoint)
  const timeoutMs = Math.max(summaryTimeoutMs, getHighlightTimeoutMs(settings.model))
  const baseUserPrompt = buildSummaryPrompt(highlights, prompts.summaryUser)
  const retryReminder = prompts.summaryUser.includes('关键点')
    ? summaryRetryReminderZh
    : summaryRetryReminder

  for (let attempt = 0; attempt < fastAnalysisLimit.maxSummaryAttempts; attempt += 1) {
    try {
      const userPrompt =
        attempt === 0 ? baseUserPrompt : `${baseUserPrompt}${retryReminder}`

      const response = await fetchWithTimeout(`${endpoint}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: settings.model,
          think: false,
          stream: false,
          messages: [
            {
              role: 'system',
              content: prompts.summarySystem,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        }),
        timeoutMs,
      })

      if (!response.ok) {
        throw new Error(`Ollama returned ${response.status}`)
      }

      const data = (await response.json()) as OllamaChatResponse
      const cleaned = cleanSummaryOutput(data.message?.content ?? '')
      if (isValidSummary(cleaned)) {
        return cleaned
      }
    } catch {
      // Retry on network, timeout, or invalid summary output.
    }

    if (attempt < fastAnalysisLimit.maxSummaryAttempts - 1) {
      await sleep(500 * (attempt + 1))
    }
  }

  return ''
}

function createFastChunks(source: string) {
  const blocks = source
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 24 && !block.startsWith('```'))

  const chunks: string[] = []
  let current = ''

  for (const block of blocks) {
    if ((current + '\n\n' + block).length > fastAnalysisLimit.chunkChars) {
      if (current) chunks.push(current)
      current = block.slice(0, fastAnalysisLimit.chunkChars)
      continue
    }

    current = current ? `${current}\n\n${block}` : block
  }

  if (current) {
    chunks.push(current)
  }

  return sampleEvenly(chunks, fastAnalysisLimit.maxChunks)
}

export async function fetchOllamaModels(endpoint: string): Promise<string[]> {
  const normalized = normalizeEndpoint(endpoint)
  try {
    const response = await fetchWithTimeout(`${normalized}/api/tags`, { timeoutMs: 3000 })
    if (!response.ok) return []
    const data = (await response.json()) as { models?: Array<{ name?: string }> }
    return data.models?.map((model) => model.name).filter((name): name is string => Boolean(name)) ?? []
  } catch {
    return []
  }
}

function sampleEvenly(items: string[], count: number) {
  if (items.length <= count) return items
  if (count <= 1) return [items[0]]

  const sampled: string[] = []
  for (let index = 0; index < count; index += 1) {
    const sourceIndex = Math.round((index * (items.length - 1)) / (count - 1))
    sampled.push(items[sourceIndex])
  }

  return sampled
}

async function requestHighlights(
  settings: AiSettings,
  markdown: string,
  perChunkLimit: number,
) {
  const prompts = getActivePrompts(settings)
  const endpoint = normalizeEndpoint(settings.endpoint)
  const timeoutMs = getHighlightTimeoutMs(settings.model)
  const baseUserPrompt = buildHighlightPrompt(markdown, perChunkLimit, prompts.highlightUser)
  const retryReminder = prompts.highlightUser.includes('JSON 数组')
    ? highlightRetryReminderZh
    : highlightRetryReminder

  let lastContent = ''

  for (let attempt = 0; attempt < fastAnalysisLimit.maxHighlightAttempts; attempt += 1) {
    const userPrompt =
      attempt === 0 ? baseUserPrompt : `${baseUserPrompt}${retryReminder}`

    const response = await fetchWithTimeout(`${endpoint}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: settings.model,
        think: false,
        stream: false,
        messages: [
          {
            role: 'system',
            content: prompts.highlightSystem,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
      timeoutMs,
    })

    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}`)
    }

    const data = (await response.json()) as OllamaChatResponse
    lastContent = data.message?.content ?? ''

    const parsed = parseHighlights(lastContent, markdown)
    if (parsed.length > 0 || !lastContent.trim()) {
      return lastContent
    }

    if (attempt < fastAnalysisLimit.maxHighlightAttempts - 1) {
      await sleep(400 * (attempt + 1))
    }
  }

  return lastContent
}

function getHighlightTimeoutMs(model: string) {
  return /qwen|deepseek|glm|llama/i.test(model)
    ? fastAnalysisLimit.slowModelTimeoutMs
    : fastAnalysisLimit.timeoutMs
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function buildHighlightPrompt(
  markdown: string,
  perChunkLimit: number,
  template: string,
) {
  return renderPromptTemplate(template, {
    perChunkLimit,
    markdown,
  })
}

function formatKeyPointsForSummary(highlights: AiHighlight[]) {
  return highlights
    .map((highlight) => {
      const reason = highlight.reason ? ` (${highlight.reason})` : ''
      return `- [${highlight.kind}] ${highlight.text}${reason}`
    })
    .join('\n')
}

function buildSummaryPrompt(highlights: AiHighlight[], template: string) {
  return renderPromptTemplate(template, {
    keyPoints: formatKeyPointsForSummary(highlights),
  })
}

function cleanSummaryOutput(content: string) {
  let value = stripModelWrappers(content).trim()
  value = value.replace(/^```[\s\S]*?```\s*/m, '').trim()

  const lines = value
    .split('\n')
    .map((line) => line.replace(/^[\s>*-•\d.)]+/, '').trim())
    .filter(Boolean)

  if (lines.length === 0) return ''
  return lines.join(' ').replace(/\s+/g, ' ').trim()
}

function isValidSummary(text: string) {
  if (text.length < 12) return false
  if (/^\s*[[{]/.test(text)) return false
  return true
}

function parseHighlights(content: string, source: string): AiHighlight[] {
  const items = extractHighlightItems(content)

  return items.flatMap((item): AiHighlight[] => {
    const highlight = normalizeModelHighlight(item)
    if (!highlight) return []
    if (!textExistsInSource(source, highlight.text)) return []
    return [highlight]
  })
}

function textExistsInSource(source: string, text: string) {
  if (source.includes(text)) return true

  const normalizedSource = normalizeMatchText(source)
  const normalizedText = normalizeMatchText(text)
  if (normalizedText.length >= 2 && normalizedSource.includes(normalizedText)) {
    return true
  }

  // Allow minor spacing differences around slashes, e.g. "Go/Python" vs "Go / Python"
  const compactSource = normalizedSource.replace(/[\/\\|·•]/g, '')
  const compactText = normalizedText.replace(/[\/\\|·•]/g, '')
  return compactText.length >= 2 && compactSource.includes(compactText)
}

function normalizeMatchText(text: string) {
  return text.replace(/\s+/g, '').toLowerCase()
}

function extractHighlightItems(content: string): unknown[] {
  const cleaned = stripModelWrappers(content)

  const arrayJson = extractJsonArray(cleaned)
  if (arrayJson) {
    try {
      const parsed = JSON.parse(arrayJson)
      if (Array.isArray(parsed)) return parsed
      if (parsed && typeof parsed === 'object') return [parsed]
    } catch {
      // Fall through to object extraction.
    }
  }

  try {
    const parsed = JSON.parse(cleaned.trim())
    if (Array.isArray(parsed)) return parsed
    if (parsed && typeof parsed === 'object') return [parsed]
  } catch {
    // Fall through to object extraction.
  }

  return extractJsonObjects(cleaned)
}

function stripModelWrappers(content: string) {
  let value = content.trim()
  value = value.replace(/^[\s\S]*?<\/think>\s*/i, '')
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(value)
  if (fenced?.[1]) value = fenced[1].trim()
  return value
}

function extractJsonObjects(content: string) {
  const items: unknown[] = []

  for (const slice of splitTopLevelJsonObjects(content)) {
    try {
      items.push(JSON.parse(slice))
    } catch {
      // Ignore malformed object slices.
    }
  }

  return items
}

function splitTopLevelJsonObjects(content: string) {
  const slices: string[] = []
  let depth = 0
  let start = -1
  let inString = false
  let escaped = false

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === '{') {
      if (depth === 0) start = index
      depth += 1
      continue
    }

    if (char === '}') {
      depth -= 1
      if (depth === 0 && start >= 0) {
        slices.push(content.slice(start, index + 1))
        start = -1
      }
    }
  }

  return slices
}

function normalizeModelHighlight(item: unknown): AiHighlight | null {
  if (!item || typeof item !== 'object') return null

  const modelHighlight = item as ModelHighlight
  if (typeof modelHighlight.text !== 'string') return null
  if (typeof modelHighlight.kind !== 'string') return null
  if (!supportedKinds.has(modelHighlight.kind as HighlightKind)) return null

  const text = modelHighlight.text.trim()
  if (text.length < 2 || text.length > 120) return null

  return {
    text,
    kind: modelHighlight.kind as HighlightKind,
    reason: typeof modelHighlight.reason === 'string' ? modelHighlight.reason.trim() : undefined,
  }
}

function extractJsonArray(content: string) {
  const value = stripModelWrappers(content)
  const start = value.indexOf('[')
  const end = value.lastIndexOf(']')

  if (start < 0 || end <= start) return null
  return value.slice(start, end + 1)
}

function normalizeEndpoint(endpoint: string) {
  return (endpoint.trim() || defaultAiSettings.endpoint).replace(/\/+$/, '')
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {},
) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), init.timeoutMs ?? 8000)

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    })

    if (response.status === 403 && !isLocalWebAppHost()) {
      throw new OllamaCorsError(buildCorsHelpMessage())
    }

    return response
  } catch (error) {
    if (error instanceof OllamaCorsError) {
      throw error
    }

    if (error instanceof TypeError && !isLocalWebAppHost()) {
      throw new OllamaCorsError(buildCorsHelpMessage())
    }

    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}

function migrateStoredOllamaEndpoint(endpoint: string) {
  const normalized = normalizeEndpoint(endpoint)

  if (normalized === 'http://localhost:11435') {
    return `http://localhost:${ollamaDirectPort}`
  }

  if (import.meta.env.DEV && (normalized === `http://localhost:${ollamaDirectPort}` || normalized === `http://127.0.0.1:${ollamaDirectPort}`)) {
    return '/ollama'
  }

  return normalized
}

function buildCorsHelpMessage() {
  const messages = t()
  if (isLocalWebAppHost()) {
    return messages.errors.ollamaBlockedLocal
  }

  return messages.errors.ollamaCors(getOllamaAllowSiteCommand())
}
