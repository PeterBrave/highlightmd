export type AppLocale = 'en' | 'zh'

export interface TutorialStep {
  title: string
  body: string
}

export interface TutorialSection {
  id: string
  title: string
  subtitle: string
  steps: TutorialStep[]
  tips?: string[]
}

export interface AppMessages {
  meta: {
    title: string
    description: string
  }
  locale: {
    en: string
    zh: string
    switchTitle: string
  }
  toolbar: {
    openMarkdown: string
    presentation: string
    aiHighlight: string
    scanning: string
    aiSettings: string
    tutorial: string
    export: string
    theme: string
  }
  outline: {
    title: string
    collapse: string
    expand: string
    empty: string
  }
  keyPoints: {
    title: string
    collapse: string
    expand: string
    summary: string
    synthesizing: string
    synthesizingDetail: string
    scanning: (completed: number, total: number) => string
    highlightCount: (current: number, max: number) => string
    emptyAnalyzing: string
    emptyIdle: string
  }
  progress: {
    title: string
    chunk: (completed: number, total: number, highlights: number) => string
  }
  kinds: {
    risk: string
    decision: string
    action: string
    keyword: string
    number: string
    tech: string
  }
  ai: {
    ready: string
    clearedAfterEdit: string
    restoredHighlights: (count: number) => string
    testing: string
    connected: (model: string) => string
    connectedMissingModel: (model: string) => string
    enableFirst: string
    startingScan: string
    preparingScan: string
    chunkProgress: (completed: number, total: number, highlights: number) => string
    highlightsReadySummarizing: string
    doneWithSummary: (count: number, ms: number) => string
    summaryFallback: (attempts: number) => string
    noHighlightsParsed: (attempts: number) => string
    fileReadError: string
  }
  errors: {
    timeout: string
    unreachable: string
    failed: string
    ollamaCors: (command: string) => string
    ollamaBlockedLocal: string
  }
  settings: {
    kicker: string
    title: string
    subtitle: string
    close: string
    tabs: {
      general: { label: string; hint: string }
      bindings: { label: string; hint: string }
      promptsEn: { label: string; hint: string }
      promptsZh: { label: string; hint: string }
    }
    localAi: string
    activeLocale: (locale: string) => string
    endpoint: string
    model: string
    modelPlaceholder: string
    enableLocalAi: string
    enableLocalAiHint: string
    detailLevel: string
    detailLevelHint: (max: number) => string
    detailLevels: Record<'low' | 'medium' | 'high', string>
    bindingsTitle: string
    bindingsDesc: (model: string, locale: string) => string
    resetBindings: string
    modelPrefixPlaceholder: string
    removeBinding: string
    addBinding: string
    bindingsNote: string
    promptPackTitle: (locale: string) => string
    promptPackDesc: (locale: string) => string
    resetPromptPack: (locale: string) => string
    promptLabels: {
      highlightSystem: string
      highlightUser: string
      summarySystem: string
      summaryUser: string
    }
    testConnection: string
    runHighlight: string
    resetAllPrompts: string
  }
  tutorial: {
    kicker: string
    close: string
    tips: string
    footer: string
    getStarted: string
    intro: {
      title: string
      description: string
    }
    sections: TutorialSection[]
  }
}
