import type { AppMessages } from './types'

export const en: AppMessages = {
  meta: {
    title: 'HightlightMD',
    description:
      'Local-first Markdown editor with AI highlights for fast key-point scanning and presentation.',
  },
  locale: {
    en: 'EN',
    zh: '中文',
    switchTitle: 'Language',
  },
  toolbar: {
    openMarkdown: 'Open Markdown',
    presentation: 'Presentation mode',
    aiHighlight: 'AI Highlight',
    scanning: 'Scanning',
    aiSettings: 'AI settings',
    tutorial: 'Guide',
    export: 'Export Markdown',
    theme: 'Theme',
  },
  outline: {
    title: 'Outline',
    collapse: 'Collapse outline',
    expand: 'Expand outline',
    empty: 'No headings',
  },
  keyPoints: {
    title: 'Key Points',
    collapse: 'Collapse key points',
    expand: 'Expand key points',
    summary: 'Summary:',
    synthesizing: 'Synthesizing summary...',
    synthesizingDetail: 'AI is synthesizing a summary from all key points…',
    scanning: (completed, total) => `${completed}/${total || 1} scanning`,
    highlightCount: (current, max) => `${current}/${max} highlights`,
    emptyAnalyzing: 'AI is finding key points...',
    emptyIdle: 'Click AI Highlight to generate a quick summary.',
  },
  progress: {
    title: 'AI scanning key points',
    chunk: (completed, total, highlights) =>
      `Chunk ${completed} / ${total} · ${highlights} highlights ready`,
  },
  kinds: {
    risk: 'Risks',
    decision: 'Decisions',
    action: 'Actions',
    keyword: 'Keywords',
    number: 'Numbers',
    tech: 'Technical',
  },
  ai: {
    ready: 'Local AI ready',
    clearedAfterEdit: 'AI highlights cleared after edit',
    restoredHighlights: (count) => `Restored ${count} cached highlights`,
    testing: 'Testing Ollama...',
    connected: (model) => `Connected to ${model}`,
    connectedMissingModel: (model) => `Connected. Model not listed: ${model}`,
    enableFirst: 'Enable local AI in settings first',
    startingScan: 'Starting quick AI scan...',
    preparingScan: 'Preparing AI scan...',
    chunkProgress: (completed, total, highlights) =>
      `AI chunk ${completed}/${total} · ${highlights} highlights`,
    highlightsReadySummarizing: 'Highlights ready · synthesizing summary...',
    doneWithSummary: (count, ms) => `AI highlighted ${count} items · summary ready in ${ms}ms`,
    summaryFallback: (attempts) =>
      `Highlights ready · summary fallback after ${attempts} attempts`,
    noHighlightsParsed: (attempts) =>
      `No highlights parsed — retried up to ${attempts}x per chunk. Check model output format in Settings.`,
    fileReadError: 'Unable to read this file.',
  },
  errors: {
    timeout: 'Ollama request timed out',
    unreachable: 'Cannot reach Ollama. Check endpoint or CORS.',
    failed: 'AI request failed',
    ollamaCors: (command) =>
      `Ollama blocked this page (CORS). Run once in terminal: ${command}`,
    ollamaBlockedLocal: 'Ollama blocked the browser request. Check that Ollama is running.',
  },
  settings: {
    kicker: 'Local AI Workspace',
    title: 'Settings',
    subtitle: 'Connect Ollama, bind models to English or Chinese prompts, and tune extraction.',
    close: 'Close',
    tabs: {
      general: { label: 'General', hint: 'Connection & model' },
      bindings: { label: 'Model Bindings', hint: 'Prompt locale per model' },
      promptsEn: { label: 'English Prompts', hint: 'For gemma, llama, mistral…' },
      promptsZh: { label: '中文 Prompts', hint: 'For qwen, deepseek, glm…' },
    },
    localAi: 'Local AI highlights',
    activeLocale: (locale) => `Active: ${locale}`,
    endpoint: 'Ollama endpoint',
    model: 'Model',
    modelPlaceholder: 'e.g. gemma4:latest',
    enableLocalAi: 'Enable local AI',
    enableLocalAiHint: 'Highlights and summaries stay on this device.',
    detailLevel: 'Detail level',
    detailLevelHint: (max) => `Up to ${max} highlights per scan`,
    detailLevels: { low: 'Low', medium: 'Medium', high: 'High' },
    bindingsTitle: 'Model → prompt locale',
    bindingsDesc: (model, locale) =>
      `Bind a model name or prefix to English or Chinese prompts. Current model ${model} resolves to ${locale}.`,
    resetBindings: 'Reset bindings',
    modelPrefixPlaceholder: 'Model prefix, e.g. gemma or qwen2.5',
    removeBinding: 'Remove binding',
    addBinding: 'Add model binding',
    bindingsNote:
      'Matching is prefix-based: gemma matches gemma4:latest. If nothing matches, HightlightMD falls back to name heuristics.',
    promptPackTitle: (locale) => `${locale} prompt pack`,
    promptPackDesc: (locale) =>
      `Placeholders are filled at runtime. Models bound to ${locale} will use this pack.`,
    resetPromptPack: (locale) => `Reset ${locale}`,
    promptLabels: {
      highlightSystem: 'Highlight · system',
      highlightUser: 'Highlight · user',
      summarySystem: 'Summary · system',
      summaryUser: 'Summary · user',
    },
    testConnection: 'Test connection',
    runHighlight: 'AI Highlight',
    resetAllPrompts: 'Reset all prompts',
  },
  tutorial: {
    kicker: 'Guide',
    close: 'Close',
    tips: 'Tips',
    footer: 'Open source · customize prompts and model bindings in Settings',
    getStarted: 'Get started',
    intro: {
      title: 'HightlightMD Guide',
      description:
        'A local-first Markdown reader that uses on-device AI to surface what matters for reviews, walkthroughs, and presentations.',
    },
    sections: [
      {
        id: 'start',
        title: 'Quick start',
        subtitle: 'Open a document and start reading',
        steps: [
          {
            title: 'Open a Markdown file',
            body: 'Click Upload in the toolbar to pick a `.md` file, or drag and drop Markdown into the page. Supports `.md`, `.markdown`, and plain text.',
          },
          {
            title: 'Edit in place',
            body: 'The center pane is a block editor. Edit Markdown directly. The left Outline builds a table of contents from headings.',
          },
          {
            title: 'Autosave',
            body: 'Edits autosave to browser localStorage. Refresh the page and your document comes back — no manual save needed.',
          },
        ],
        tips: ['Great for PRDs, RFCs, retros, READMEs, and design reviews.'],
      },
      {
        id: 'ai',
        title: 'Local AI highlights',
        subtitle: 'Find key points with Ollama on your machine',
        steps: [
          {
            title: 'Install Ollama',
            body: 'Install and start Ollama locally (default `http://localhost:11434`). Pull a model, e.g. `ollama pull qwen3:8b` or `ollama pull gemma3:latest`.',
          },
          {
            title: 'Allow the hosted site (one time)',
            body: 'If you use the GitHub Pages app, run `npm run ollama:allow-site` once in this repo. It sets `OLLAMA_ORIGINS` and restarts Ollama. Keep endpoint at `http://localhost:11434`.',
          },
          {
            title: 'Run AI Highlight',
            body: 'Click AI Highlight to scan the document for risks, decisions, actions, keywords, numbers, and technical terms, then highlight them in the document.',
          },
          {
            title: 'Progress & retries',
            body: 'Scanning runs in chunks with progress in the status bar. Each chunk retries up to 3 times. Tune prompts in Settings if the model output format is off.',
          },
        ],
        tips: [
          'Documents never leave your device — AI runs locally through Ollama.',
          'After you edit the document, highlights clear until you run AI Highlight again.',
        ],
      },
      {
        id: 'keypoints',
        title: 'Key points & summary',
        subtitle: 'Right-hand Key Points panel',
        steps: [
          {
            title: 'Browse by category',
            body: 'After scanning, Key Points groups highlights into Risks, Decisions, Actions, Keywords, and more.',
          },
          {
            title: 'Jump in the document',
            body: 'Click any key point to scroll the editor to that highlight — useful in reviews and walkthroughs.',
          },
          {
            title: 'AI summary',
            body: 'Summary synthesizes all key points into 2–4 sentences. On failure, a structured fallback summary is shown after up to 3 retries.',
          },
          {
            title: 'Cache',
            body: 'Highlights and summaries cache in the browser. If the document is unchanged, results restore on refresh.',
          },
        ],
      },
      {
        id: 'settings',
        title: 'Settings',
        subtitle: 'Models, prompts, and bindings',
        steps: [
          {
            title: 'Connect Ollama',
            body: 'Open Settings (gear icon), set endpoint and model, then Test connection.',
          },
          {
            title: 'English & Chinese prompts',
            body: 'Two prompt packs ship in the repo. User prompts support `{{markdown}}`, `{{perChunkLimit}}`, and `{{keyPoints}}`.',
          },
          {
            title: 'Model bindings',
            body: 'Map model prefixes to a prompt locale, e.g. `gemma` → English, `qwen` → 中文. General shows the active pack for the current model.',
          },
          {
            title: 'Detail level',
            body: 'Low / Medium / High caps highlights per scan at 6 / 12 / 24. Medium works well for presentations; High for long docs.',
          },
        ],
      },
      {
        id: 'present',
        title: 'Present & export',
        subtitle: 'For meetings and handoff',
        steps: [
          {
            title: 'Presentation mode',
            body: 'Click Presentation for a focused full-screen view. Press Esc to exit.',
          },
          {
            title: 'Export Markdown',
            body: 'Download exports the current document as `.md` with all editor changes.',
          },
          {
            title: 'Theme',
            body: 'Toggle light/dark before presenting based on your display environment.',
          },
        ],
        tips: [
          'Before a meeting: run AI Highlight once, confirm Ollama speed, and open Key Points.',
        ],
      },
      {
        id: 'faq',
        title: 'FAQ',
        subtitle: 'Troubleshooting',
        steps: [
          {
            title: 'Zero highlights',
            body: 'Usually the model returned invalid JSON. Try another model, adjust prompts, or raise Detail Level.',
          },
          {
            title: 'Only part of the doc highlighted',
            body: 'Long docs are sampled in chunks. Raise Detail Level or check for Ollama timeouts (slow models get up to 20s).',
          },
          {
            title: 'Summary keeps loading',
            body: 'Summary is a separate Ollama call with 3 retries. Failure falls back to a structured per-category summary.',
          },
          {
            title: 'Cannot reach Ollama / CORS 403',
            body: 'Confirm Ollama is running. For the hosted app, run `npm run ollama:allow-site` once. For local dev, `npm run dev` proxies `/ollama` automatically.',
          },
        ],
      },
    ],
  },
}
