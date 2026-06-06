import type { AppMessages } from './types'

export const zh: AppMessages = {
  meta: {
    title: 'HightlightMD',
    description: '本地优先的 Markdown 编辑器，用本地 AI 高亮重点，快速扫读与演示。',
  },
  locale: {
    en: 'EN',
    zh: '中文',
    switchTitle: '语言',
  },
  toolbar: {
    openMarkdown: '打开 Markdown',
    presentation: '演示模式',
    aiHighlight: 'AI 高亮',
    scanning: '扫描中',
    aiSettings: 'AI 设置',
    tutorial: '使用教程',
    export: '导出 Markdown',
    theme: '主题',
  },
  outline: {
    title: '目录',
    collapse: '收起目录',
    expand: '展开目录',
    empty: '暂无标题',
  },
  keyPoints: {
    title: '要点',
    collapse: '收起要点',
    expand: '展开要点',
    summary: '摘要：',
    synthesizing: '正在生成摘要…',
    synthesizingDetail: 'AI 正在根据全部要点综合生成摘要…',
    scanning: (completed, total) => `扫描中 ${completed}/${total || 1}`,
    highlightCount: (current, max) => `${current}/${max} 条高亮`,
    emptyAnalyzing: 'AI 正在提取要点…',
    emptyIdle: '点击 AI 高亮生成快速摘要。',
  },
  progress: {
    title: 'AI 正在扫描要点',
    chunk: (completed, total, highlights) =>
      `分块 ${completed} / ${total} · 已就绪 ${highlights} 条高亮`,
  },
  kinds: {
    risk: '风险',
    decision: '决策',
    action: '行动项',
    keyword: '关键词',
    number: '数字',
    tech: '技术术语',
  },
  ai: {
    ready: '本地 AI 已就绪',
    clearedAfterEdit: '编辑后已清除 AI 高亮',
    restoredHighlights: (count) => `已恢复 ${count} 条缓存高亮`,
    testing: '正在测试 Ollama…',
    connected: (model) => `已连接 ${model}`,
    connectedMissingModel: (model) => `已连接，但未找到模型：${model}`,
    enableFirst: '请先在设置中启用本地 AI',
    startingScan: '开始快速 AI 扫描…',
    preparingScan: '准备 AI 扫描…',
    chunkProgress: (completed, total, highlights) =>
      `AI 分块 ${completed}/${total} · ${highlights} 条高亮`,
    highlightsReadySummarizing: '高亮完成 · 正在生成摘要…',
    doneWithSummary: (count, ms) => `已高亮 ${count} 处 · 摘要就绪（${ms}ms）`,
    summaryFallback: (attempts) => `高亮完成 · 摘要回退（已重试 ${attempts} 次）`,
    noHighlightsParsed: (attempts) =>
      `未解析到高亮 — 每个分块最多重试 ${attempts} 次。请在设置中检查模型输出格式。`,
    fileReadError: '无法读取该文件。',
  },
  errors: {
    timeout: 'Ollama 请求超时',
    unreachable: '无法连接 Ollama，请检查地址或 CORS 配置。',
    failed: 'AI 请求失败',
    ollamaCors: (command) => `Ollama 拒绝了跨域请求（CORS）。在终端运行一次：${command}`,
    ollamaBlockedLocal: 'Ollama 拒绝了浏览器请求，请确认 Ollama 已启动。',
  },
  settings: {
    kicker: '本地 AI 工作区',
    title: '设置',
    subtitle: '连接 Ollama，绑定模型与中英文 Prompt，并调整提取强度。',
    close: '关闭',
    tabs: {
      general: { label: '通用', hint: '连接与模型' },
      bindings: { label: '模型绑定', hint: '按模型选择 Prompt 语言' },
      promptsEn: { label: 'English Prompts', hint: '适用于 gemma、llama、mistral…' },
      promptsZh: { label: '中文 Prompts', hint: '适用于 qwen、deepseek、glm…' },
    },
    localAi: '本地 AI 高亮',
    activeLocale: (locale) => `当前：${locale}`,
    endpoint: 'Ollama 地址',
    model: '模型',
    modelPlaceholder: '例如 gemma4:latest',
    enableLocalAi: '启用本地 AI',
    enableLocalAiHint: '高亮与摘要仅在本机处理。',
    detailLevel: '详细程度',
    detailLevelHint: (max) => `每次扫描最多 ${max} 条高亮`,
    detailLevels: { low: '低', medium: '中', high: '高' },
    bindingsTitle: '模型 → Prompt 语言',
    bindingsDesc: (model, locale) =>
      `将模型名或前缀绑定到英文或中文 Prompt。当前模型 ${model} 使用 ${locale}。`,
    resetBindings: '重置绑定',
    modelPrefixPlaceholder: '模型前缀，如 gemma 或 qwen2.5',
    removeBinding: '删除绑定',
    addBinding: '添加模型绑定',
    bindingsNote:
      '按前缀匹配：gemma 可匹配 gemma4:latest。无匹配时，HightlightMD 会按模型名启发式选择。',
    promptPackTitle: (locale) => `${locale} Prompt 包`,
    promptPackDesc: (locale) =>
      `占位符在运行时填充。绑定到 ${locale} 的模型会使用此 Prompt 包。`,
    resetPromptPack: (locale) => `重置 ${locale}`,
    promptLabels: {
      highlightSystem: '高亮 · system',
      highlightUser: '高亮 · user',
      summarySystem: '摘要 · system',
      summaryUser: '摘要 · user',
    },
    testConnection: '测试连接',
    runHighlight: 'AI 高亮',
    resetAllPrompts: '重置全部 Prompt',
  },
  tutorial: {
    kicker: '教程',
    close: '关闭',
    tips: '提示',
    footer: '开源项目 · 可在设置中自定义 Prompt 与模型绑定',
    getStarted: '开始使用',
    intro: {
      title: 'HightlightMD 使用教程',
      description:
        '本地优先的 Markdown 阅读器，用本地 AI 找出文档重点，适合评审、讲解与汇报。',
    },
    sections: [
      {
        id: 'start',
        title: '快速开始',
        subtitle: '打开文档，立即进入阅读',
        steps: [
          {
            title: '打开 Markdown 文件',
            body: '点击顶部 Upload 选择 `.md` 文件，或把 Markdown 拖进页面。支持 `.md`、`.markdown` 和纯文本。',
          },
          {
            title: '直接编辑文档',
            body: '中间区域是块编辑器，可直接修改内容。左侧目录根据标题生成，点击可跳转。',
          },
          {
            title: '自动保存',
            body: '编辑后自动保存到浏览器本地。刷新页面后文档会恢复，无需手动保存。',
          },
        ],
        tips: ['适合 PRD、RFC、复盘、README、方案评审等 Markdown 文档。'],
      },
      {
        id: 'ai',
        title: '本地 AI 高亮',
        subtitle: '用 Ollama 在本地找出重点',
        steps: [
          {
            title: '准备 Ollama',
            body: '在本机安装并启动 Ollama（默认 `http://localhost:11434`）。拉取模型，例如 `ollama pull qwen3:8b` 或 `ollama pull gemma3:latest`。',
          },
          {
            title: '允许线上站点（一次性）',
            body: '若使用 GitHub Pages 版本，在仓库目录运行一次 `npm run ollama:allow-site`，会设置 `OLLAMA_ORIGINS` 并重启 Ollama。Settings 中保持 `http://localhost:11434` 即可。',
          },
          {
            title: '点击 AI 高亮',
            body: '工具栏 AI 高亮会扫描文档，提取风险、决策、行动项、关键词、数字、技术术语等，并在正文中高亮。',
          },
          {
            title: '扫描与重试',
            body: '按文档分块扫描，状态栏显示进度。每块最多重试 3 次；若格式不对，可在设置中调整 Prompt。',
          },
        ],
        tips: [
          '文档不会上传云端，AI 分析完全在本地完成。',
          '编辑文档后高亮会清除，需重新点击 AI 高亮。',
        ],
      },
      {
        id: 'keypoints',
        title: '要点与摘要',
        subtitle: '右侧要点面板',
        steps: [
          {
            title: '查看分类要点',
            body: '扫描完成后，要点面板按风险、决策、行动项、关键词等分类列出高亮项。',
          },
          {
            title: '点击跳转',
            body: '点击任意要点，正文会滚动到对应位置，方便讲解和评审。',
          },
          {
            title: 'AI 摘要',
            body: '摘要区域将要点综合为 2–4 句概述。失败时回退到结构化摘要，最多重试 3 次。',
          },
          {
            title: '结果缓存',
            body: '高亮和摘要缓存在浏览器。文档未变时，刷新页面会自动恢复上次结果。',
          },
        ],
      },
      {
        id: 'settings',
        title: '设置',
        subtitle: '模型、Prompt 与绑定',
        steps: [
          {
            title: '连接 Ollama',
            body: '点击设置（齿轮），配置 Ollama 地址和模型，用「测试连接」验证。',
          },
          {
            title: '中英文 Prompt',
            body: '提供 English 与中文两套 Prompt，可自行修改。User Prompt 支持 `{{markdown}}`、`{{perChunkLimit}}`、`{{keyPoints}}`。',
          },
          {
            title: '模型绑定',
            body: '在模型绑定里把前缀映射到语言包，例如 `gemma` → English、`qwen` → 中文。',
          },
          {
            title: '详细程度',
            body: '低 / 中 / 高 对应每次扫描 6 / 12 / 24 条高亮。演示推荐「中」，长文档可用「高」。',
          },
        ],
      },
      {
        id: 'present',
        title: '演示与导出',
        subtitle: '汇报场景',
        steps: [
          {
            title: '演示模式',
            body: '点击演示图标进入全屏模式，适合 walkthrough 和评审。按 Esc 退出。',
          },
          {
            title: '导出 Markdown',
            body: '点击下载导出当前 `.md` 文件，包含编辑器中的全部修改。',
          },
          {
            title: '主题切换',
            body: '切换浅色/深色主题，演示前可按投影环境选择。',
          },
        ],
        tips: ['演示前建议：先跑一遍 AI 高亮，确认 Ollama 速度，并展开要点面板。'],
      },
      {
        id: 'faq',
        title: '常见问题',
        subtitle: '排查与建议',
        steps: [
          {
            title: 'AI 高亮了 0 条',
            body: '通常是模型返回格式不符合 JSON。可换模型、调整 Prompt，或提高详细程度后重试。',
          },
          {
            title: '只有部分文档有高亮',
            body: '长文档会分块均匀采样。可提高详细程度，或检查 Ollama 是否超时（慢模型最长 20 秒）。',
          },
          {
            title: '摘要一直 loading',
            body: '摘要为独立 Ollama 请求，同样有 3 次重试。失败会显示结构化 fallback 摘要。',
          },
          {
            title: '无法连接 Ollama / CORS 403',
            body: '确认 Ollama 已启动。线上版运行一次 `npm run ollama:allow-site`；本地开发时 `npm run dev` 会自动代理 `/ollama`。',
          },
        ],
      },
    ],
  },
}
