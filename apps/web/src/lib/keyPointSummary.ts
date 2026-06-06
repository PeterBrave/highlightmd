import type { HighlightKind } from '@highlightmd/core'
import type { AiHighlight } from './ollama'

const summaryKindOrder = [
  'decision',
  'risk',
  'action',
  'keyword',
  'number',
  'tech',
] as const satisfies readonly HighlightKind[]

type SummaryKind = (typeof summaryKindOrder)[number]

const summaryLabels: Record<
  'en' | 'zh',
  Record<SummaryKind | 'other' | 'empty', string>
> = {
  en: {
    decision: 'Conclusions',
    risk: 'Risks',
    action: 'Actions',
    keyword: 'Keywords',
    number: 'Metrics',
    tech: 'Technical',
    other: 'Other',
    empty: 'Run AI Highlight to generate a quick overview.',
  },
  zh: {
    decision: '结论',
    risk: '风险',
    action: '行动项',
    keyword: '关键词',
    number: '指标',
    tech: '技术点',
    other: '其他',
    empty: '点击 AI Highlight 生成文档摘要。',
  },
}

function isSummaryKind(kind: HighlightKind): kind is SummaryKind {
  return (summaryKindOrder as readonly HighlightKind[]).includes(kind)
}

function usesChinese(highlights: AiHighlight[]) {
  return highlights.some((highlight) => /[\u4e00-\u9fff]/.test(highlight.text))
}

function joinPhrases(texts: string[], chinese: boolean) {
  if (texts.length === 0) return ''
  const separator = chinese ? '；' : '; '
  return texts.join(separator)
}

export function buildHighlightSummary(highlights: AiHighlight[]) {
  if (highlights.length === 0) {
    return summaryLabels.en.empty
  }

  const chinese = usesChinese(highlights)
  const labels = chinese ? summaryLabels.zh : summaryLabels.en
  const segments: string[] = []

  for (const kind of summaryKindOrder) {
    const texts = highlights
      .filter((highlight) => highlight.kind === kind)
      .map((highlight) => highlight.text)
    if (texts.length === 0) continue
    segments.push(`${labels[kind]}: ${joinPhrases(texts, chinese)}`)
  }

  const otherTexts = highlights
    .filter((highlight) => !isSummaryKind(highlight.kind))
    .map((highlight) => highlight.text)
  if (otherTexts.length > 0) {
    segments.push(`${labels.other}: ${joinPhrases(otherTexts, chinese)}`)
  }

  return segments.join(chinese ? ' ' : ' ')
}
