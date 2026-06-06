export interface AiPrompts {
  highlightSystem: string
  highlightUser: string
  summarySystem: string
  summaryUser: string
}

export type PromptLocale = 'en' | 'zh'

export interface AiPromptPresets {
  en: AiPrompts
  zh: AiPrompts
}

export interface ModelPromptBinding {
  model: string
  locale: PromptLocale
}

export const defaultEnglishPrompts: AiPrompts = {
  highlightSystem:
    'You are the local AI highlight engine inside HightlightMD. Return only valid JSON. Do not use markdown fences.',
  highlightUser: `Find key points a reader should notice at a glance.

Return a JSON array. Each item must have:
- "text": exact text copied from the input, 2 to 80 characters
- "kind": one of "keyword", "risk", "action", "decision", "number", "tech"
- "reason": short reason under 80 characters

Rules:
- Optimize for fast scanning and presentation.
- Prefer specific phrases over full sentences.
- Prefer content that changes what the reader should remember, decide, or do.
- Do not invent text.
- Do not highlight markdown syntax.
- Return at most {{perChunkLimit}} items.

Markdown:
{{markdown}}`,
  summarySystem:
    'You are the local summary engine inside HightlightMD. Return plain text only. No markdown fences, no bullet lists.',
  summaryUser: `Synthesize ALL extracted key points below into a concise 2-4 sentence overview.

Requirements:
- Use the same language as the key points (Chinese if mostly Chinese, English if mostly English).
- Weave every category into flowing prose: conclusions, risks, actions, keywords, numbers, and technical terms.
- Do not output bullet points or numbered lists.
- Do not invent facts beyond the key points.
- Keep it scannable in under 120 words.

Key points:
{{keyPoints}}`,
}

export const defaultChinesePrompts: AiPrompts = {
  highlightSystem:
    '你是 HightlightMD 的本地 AI 高亮引擎。必须返回一个 JSON 数组，形如 [{...},{...}]。不要返回多个独立 JSON 对象，不要使用 markdown 代码块。',
  highlightUser: `找出读者一眼就应该注意到的关键点。

必须返回一个 JSON 数组（不是多个独立对象），每项包含：
- "text": 从原文精确复制的文本，2 到 80 个字符
- "kind": "keyword" | "risk" | "action" | "decision" | "number" | "tech" 之一
- "reason": 不超过 80 字的简短原因

示例格式：
[{"text":"示例短语","kind":"keyword","reason":"原因说明"}]

规则：
- 优化快速浏览和演示效果。
- 优先选择具体短语，而非整句。
- 优先标注读者需要记住、决策或执行的内容。
- 不要编造原文没有的文本。
- 不要高亮 markdown 语法。
- 最多返回 {{perChunkLimit}} 项。
- 只输出 JSON 数组，不要输出任何其他文字。

Markdown:
{{markdown}}`,
  summarySystem:
    '你是 HightlightMD 的本地摘要引擎。只返回纯文本，不要 markdown 代码块，不要列表。',
  summaryUser: `将下方全部关键点综合成 2-4 句简洁摘要。

要求：
- 使用与关键点相同的语言（中文文档用中文）。
- 把结论、风险、行动项、关键词、数字、技术术语都融入流畅的叙述中。
- 不要输出列表。
- 不要编造关键点以外的内容。
- 控制在 120 字以内。

关键点：
{{keyPoints}}`,
}

export const defaultPromptPresets: AiPromptPresets = {
  en: defaultEnglishPrompts,
  zh: defaultChinesePrompts,
}

/** @deprecated Use defaultEnglishPrompts */
export const defaultAiPrompts = defaultEnglishPrompts

export const defaultModelBindings: ModelPromptBinding[] = [
  { model: 'gemma', locale: 'en' },
  { model: 'llama', locale: 'en' },
  { model: 'mistral', locale: 'en' },
  { model: 'phi', locale: 'en' },
  { model: 'qwen', locale: 'zh' },
  { model: 'qwen3', locale: 'zh' },
  { model: 'deepseek', locale: 'zh' },
  { model: 'glm', locale: 'zh' },
  { model: 'yi', locale: 'zh' },
]

export const promptLocaleLabels: Record<PromptLocale, string> = {
  en: 'English',
  zh: '中文',
}

export const aiPromptVariables: Record<keyof AiPrompts, string[]> = {
  highlightSystem: [],
  highlightUser: ['{{perChunkLimit}}', '{{markdown}}'],
  summarySystem: [],
  summaryUser: ['{{keyPoints}}'],
}

export const aiPromptLabels: Record<keyof AiPrompts, string> = {
  highlightSystem: 'Highlight · system',
  highlightUser: 'Highlight · user',
  summarySystem: 'Summary · system',
  summaryUser: 'Summary · user',
}

export const aiPromptFieldOrder = [
  'highlightSystem',
  'highlightUser',
  'summarySystem',
  'summaryUser',
] as const satisfies readonly (keyof AiPrompts)[]

export function mergeAiPrompts(
  partial?: Partial<AiPrompts>,
  fallback: AiPrompts = defaultEnglishPrompts,
): AiPrompts {
  return {
    highlightSystem: partial?.highlightSystem?.trim() || fallback.highlightSystem,
    highlightUser: partial?.highlightUser?.trim() || fallback.highlightUser,
    summarySystem: partial?.summarySystem?.trim() || fallback.summarySystem,
    summaryUser: partial?.summaryUser?.trim() || fallback.summaryUser,
  }
}

export function mergePromptPresets(
  partial?: Partial<AiPromptPresets>,
  legacySingle?: Partial<AiPrompts>,
): AiPromptPresets {
  return {
    en: mergeAiPrompts(partial?.en ?? legacySingle, defaultEnglishPrompts),
    zh: mergeAiPrompts(partial?.zh, defaultChinesePrompts),
  }
}

export function mergeModelBindings(partial?: ModelPromptBinding[]) {
  if (!partial || partial.length === 0) {
    return defaultModelBindings.map((item) => ({ ...item }))
  }
  return partial
    .filter((item) => item.model.trim().length > 0)
    .map((item) => ({
      model: item.model.trim(),
      locale: item.locale === 'zh' ? ('zh' as const) : ('en' as const),
    }))
}

export function inferPromptLocale(model: string): PromptLocale {
  const normalized = model.trim().toLowerCase()
  if (/qwen|deepseek|glm|baichuan|chatglm|internlm|minicpm|^yi|yi-/.test(normalized)) {
    return 'zh'
  }
  return 'en'
}

export function resolvePromptLocale(model: string, bindings: ModelPromptBinding[]): PromptLocale {
  const normalizedModel = model.trim().toLowerCase()
  if (!normalizedModel) return 'en'

  for (const binding of bindings) {
    const pattern = binding.model.trim().toLowerCase()
    if (!pattern) continue
    if (normalizedModel === pattern) return binding.locale
  }

  for (const binding of bindings) {
    const pattern = binding.model.trim().toLowerCase()
    if (!pattern) continue
    if (normalizedModel.startsWith(pattern) || normalizedModel.includes(`/${pattern}`)) {
      return binding.locale
    }
  }

  return inferPromptLocale(model)
}

export function resolvePromptsForModel(input: {
  model: string
  promptPresets: AiPromptPresets
  modelBindings: ModelPromptBinding[]
}): AiPrompts {
  const locale = resolvePromptLocale(input.model, input.modelBindings)
  return input.promptPresets[locale]
}

export function renderPromptTemplate(
  template: string,
  variables: Record<string, string | number>,
) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = variables[key]
    return value === undefined || value === null ? '' : String(value)
  })
}
