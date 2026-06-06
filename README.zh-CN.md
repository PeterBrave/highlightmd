# HightlightMD

[English](README.md) · **简体中文**

**在线体验：** https://peterbrave.github.io/highlightmd/

HightlightMD 是一款开源 Markdown 阅读与编辑器，通过**本地 AI** 找出文档里最重要的词、观点、风险、数字和行动项，并直接在阅读界面中高亮，让你更快扫读、更好地演示。

它能把长篇 Markdown、README、PRD、RFC、会议纪要和技术方案，变成适合评审和汇报的扫读视图。

## 为什么做 HightlightMD

多数 Markdown 编辑器帮你**写**。HightlightMD 帮你**讲清楚**。

评审文档、讲解方案、过技术设计时，难点往往不是渲染 Markdown，而是让观众先看到该看的地方。

> 用 AI 快速识别文本中的关键信息，并直接高亮在阅读体验里。

文档留在本机；高亮和摘要尽可能通过本机 **Ollama** 完成，不上传云端。

## 功能

- 粘贴或拖入 `.md` 文件
- 块编辑器 + 自动生成目录
- 本地 AI 高亮（风险、决策、行动项、关键词、数字、技术术语）
- 右侧要点面板：分类展示、点击跳转正文
- 根据全部要点生成 AI 摘要
- 演示模式、浅色/深色主题、导出 `.md`
- 界面支持 **English / 中文**（工具栏切换）
- 浏览器本地自动保存与高亮缓存

## 快速开始

### 在线使用

1. 打开 https://peterbrave.github.io/highlightmd/
2. 上传 Markdown 或编辑示例文档
3. 按下方说明配置 Ollama（一次性），再点 **AI 高亮**

### 本地运行

```bash
git clone https://github.com/PeterBrave/highlightmd.git
cd highlightmd
npm install
npm run dev
```

终端会显示地址（通常是 `http://localhost:5173`）。本地开发会通过 `/ollama` 代理访问 Ollama，**无需**额外 CORS 配置。

## 使用本地 AI（Ollama）

### 1. 安装 Ollama 并拉取模型

安装 [Ollama](https://ollama.com/) 并启动，然后拉取模型，例如：

```bash
ollama pull qwen3:8b
# 或
ollama pull gemma3:latest
```

默认地址：`http://localhost:11434`

### 2. 允许线上站点访问（使用 GitHub Pages 时，一次性）

线上版跑在 `https://peterbrave.github.io`。浏览器访问本机 `localhost:11434` 属于跨域，需要让 Ollama **允许该来源一次**：

```bash
cd highlightmd
npm run ollama:allow-site
```

会设置 `OLLAMA_ORIGINS` 并重启 Ollama。之后在 **设置** 里保持 endpoint 为 `http://localhost:11434` 即可。

若部署到其他域名：

```bash
npm run ollama:allow-site -- https://你的域名
```

### 3. 在应用里配置

1. 点击 **设置**（齿轮）
2. **Ollama 地址** — 线上版用 `http://localhost:11434`；`npm run dev` 会自动用 `/ollama`
3. 选择与本机 `ollama pull` 一致的**模型名**
4. 点击 **测试连接**
5. 工具栏点击 **AI 高亮**

### 4. 调整提取效果（可选）

- **详细程度**：低 / 中 / 高 → 每次扫描最多 6 / 12 / 24 条高亮
- **模型绑定**：把模型前缀映射到 English 或 中文 Prompt 包
- **Prompt**：在设置中自定义高亮与摘要 Prompt（开源可改）

## 应用内教程

工具栏点击 **使用教程**（书本图标）查看分步说明。工具栏 **EN / 中文** 可切换界面语言。

## 开发

```bash
npm run dev        # Vite 开发服 + /ollama 代理
npm run build      # 生产构建
npm run typecheck  # TypeScript 检查
npm run bench:web  # Playwright 基准脚本
```

仓库结构：

- `apps/web` — React + Vite 前端
- `packages/core` — 共享高亮类型与逻辑

## 部署

推送到 `main` 会通过 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 发布到 GitHub Pages。

1. 仓库 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**
2. 每台要用线上版 AI 的电脑，部署后执行一次 `npm run ollama:allow-site`

## 路线图

- 更深的本地 AI 编辑（接受/拒绝高亮、解释原因）
- 基于同一基础的 macOS 应用
- 更多界面语言

## 许可证

MIT — 见 [LICENSE](LICENSE)。
