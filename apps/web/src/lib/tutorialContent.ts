export interface TutorialSection {
  id: string
  title: string
  subtitle: string
  steps: Array<{
    title: string
    body: string
  }>
  tips?: string[]
}

export const tutorialSections: TutorialSection[] = [
  {
    id: 'start',
    title: '快速开始',
    subtitle: '打开文档，立即进入阅读',
    steps: [
      {
        title: '打开 Markdown 文件',
        body: '点击顶部工具栏的 Upload 按钮选择 `.md` 文件，或直接把 Markdown 文件拖进页面。支持 `.md`、`.markdown` 和纯文本。',
      },
      {
        title: '直接编辑文档',
        body: '中间区域是 BlockNote 编辑器，可以直接修改 Markdown 内容。左侧 Outline 会根据标题自动生成目录，点击可快速跳转。',
      },
      {
        title: '自动保存',
        body: '编辑后内容会自动保存到浏览器本地（localStorage）。刷新页面后文档会恢复，无需手动保存。',
      },
    ],
    tips: ['适合 PRD、RFC、复盘文档、README、方案评审等 Markdown 文档。'],
  },
  {
    id: 'ai',
    title: '本地 AI 高亮',
    subtitle: '用 Ollama 在本地找出重点',
    steps: [
      {
        title: '准备 Ollama',
        body: '先在本机安装并启动 Ollama（默认地址 `http://localhost:11434`）。拉取模型，例如 `ollama pull qwen3:8b` 或 `ollama pull gemma3:latest`。',
      },
      {
        title: '点击 AI Highlight',
        body: '工具栏上的 AI Highlight 会扫描当前文档，提取风险、决策、行动项、关键词、数字、技术术语等，并在正文中高亮显示。',
      },
      {
        title: '扫描与重试',
        body: '扫描按文档分块进行，状态栏会显示进度。每个分块最多自动重试 3 次；若模型返回格式不对，可在 Settings 里调整 Prompt。',
      },
    ],
    tips: [
      '文档不会上传到云端，AI 分析完全在本地完成。',
      '编辑文档后，高亮会自动清除，需要重新点击 AI Highlight。',
    ],
  },
  {
    id: 'keypoints',
    title: '要点与摘要',
    subtitle: '右侧 Key Points 面板',
    steps: [
      {
        title: '查看分类要点',
        body: 'AI 扫描完成后，右侧 Key Points 面板按 Risks、Decisions、Actions、Keywords 等类别列出所有高亮项。',
      },
      {
        title: '点击跳转',
        body: '点击任意要点，正文会自动滚动到对应位置，方便讲解和评审。',
      },
      {
        title: 'AI 摘要',
        body: 'Summary 区域会把全部关键词综合成 2–4 句概述。生成期间有 loading 动画；失败时会回退到结构化摘要，并自动重试最多 3 次。',
      },
      {
        title: '结果缓存',
        body: '高亮和摘要会缓存到浏览器。刷新页面后，若文档内容未变，会自动恢复上次的结果。重新生成请点击 AI Highlight。',
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
        body: '点击 Settings（齿轮图标），配置 Ollama endpoint 和模型名称。可用 Test connection 测试连通性。',
      },
      {
        title: '中英文 Prompt',
        body: 'Settings 里提供 English 和 中文 两套 Prompt，开源用户可自行修改。User Prompt 支持占位符：`{{markdown}}`、`{{perChunkLimit}}`、`{{keyPoints}}`。',
      },
      {
        title: '模型绑定',
        body: '在 Model Bindings 里把模型前缀绑定到语言包，例如 `gemma` → English、`qwen` → 中文。当前使用的模型会在 General 页显示 Active 语言包。',
      },
      {
        title: 'Detail Level',
        body: 'Low / Medium / High 控制每次扫描提取的高亮数量（6 / 12 / 24 条）。演示推荐 Medium，长文档可用 High。',
      },
    ],
  },
  {
    id: 'present',
    title: '演示与导出',
    subtitle: '汇报场景',
    steps: [
      {
        title: 'Presentation 模式',
        body: '点击 Presentation 图标进入全屏演示模式，适合 walkthrough 和评审汇报。按 Esc 退出。',
      },
      {
        title: '导出 Markdown',
        body: '点击 Download 导出当前文档为 `.md` 文件，包含你在编辑器中的全部修改。',
      },
      {
        title: '主题切换',
        body: 'Sun / Moon 按钮切换浅色与深色主题，演示前可根据投影环境选择。',
      },
    ],
    tips: ['演示前建议：先跑一遍 AI Highlight，确认 Ollama 响应速度可接受，并展开 Key Points 面板。'],
  },
  {
    id: 'faq',
    title: '常见问题',
    subtitle: '排查与建议',
    steps: [
      {
        title: 'AI 高亮了 0 条',
        body: '通常是模型返回格式不符合 JSON 要求。qwen 等模型可能返回多个独立 JSON 对象——我们已做兼容，若仍失败请检查 Settings 中的 Prompt，或换用 Medium Detail Level 重试。',
      },
      {
        title: '只有文档前半段有高亮',
        body: '长文档会均匀分块扫描。若仍不完整，可在 Settings 提高 Detail Level，或检查 Ollama 是否超时（慢模型会自动延长到 20 秒）。',
      },
      {
        title: 'Summary 一直是 loading',
        body: 'Summary 独立请求 Ollama，同样有 3 次重试。若最终失败，会显示按类别拼接的结构化 fallback 摘要。',
      },
      {
        title: '无法连接 Ollama',
        body: '确认 Ollama 已启动、endpoint 正确。浏览器访问本地 Ollama 可能受 CORS 影响——开发环境下请按 README 说明启动，或确保 Ollama 允许跨域。',
      },
    ],
  },
]

export const tutorialIntro = {
  title: 'HightlightMD 使用教程',
  description:
    'HightlightMD 是本地优先的 Markdown 阅读器，用本地 AI 帮你找出文档里的重点，适合评审、walkthrough 和汇报。',
}
