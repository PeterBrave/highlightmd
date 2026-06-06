# HightlightMD

**English** · [简体中文](README.zh-CN.md)

**Live demo:** https://peterbrave.github.io/highlightmd/

HightlightMD is an open-source Markdown reader and editor that uses local AI to surface the most important words, ideas, risks, numbers, and action items in your document — then highlights them for faster reading and better presentations.

It turns long Markdown documents, READMEs, PRDs, RFCs, meeting notes, and technical specs into scannable, presentation-friendly views.

## Why HightlightMD

Most Markdown editors help you **write**. HightlightMD helps you **present**.

When you review a document, explain a proposal, or walk through a technical design, the hard part is not rendering Markdown. The hard part is knowing what the audience should notice first.

> Use AI to quickly recognize key information in text and highlight it directly inside the reading experience.

Documents stay on your device. Highlights and summaries run through **Ollama** on your machine whenever possible.

## Features

- Paste or drag in `.md` files
- Block-based Markdown editing with auto outline
- Local AI highlights (risks, decisions, actions, keywords, numbers, tech terms)
- Key Points panel with category grouping and jump-to-highlight
- AI summary synthesized from all key points
- Presentation mode, light/dark theme, export to `.md`
- English / 中文 UI (switch in the toolbar)
- Browser-local autosave and highlight cache

## Quick start

### Try online

1. Open https://peterbrave.github.io/highlightmd/
2. Upload a Markdown file or edit the sample document
3. Set up Ollama once (see below), then click **AI Highlight**

### Run locally

```bash
git clone https://github.com/PeterBrave/highlightmd.git
cd highlightmd
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`). Local dev proxies Ollama through `/ollama` — no extra CORS setup needed.

## Use local AI (Ollama)

### 1. Install Ollama and pull a model

Install [Ollama](https://ollama.com/) and start it. Then pull a model, for example:

```bash
ollama pull qwen3:8b
# or
ollama pull gemma3:latest
```

Default endpoint: `http://localhost:11434`

### 2. Allow the hosted site (one-time, if you use GitHub Pages)

The online app runs on `https://peterbrave.github.io`. Browsers treat requests to `localhost:11434` as cross-origin, so Ollama must allow that origin **once**:

```bash
cd highlightmd
npm run ollama:allow-site
```

This sets `OLLAMA_ORIGINS` and restarts Ollama. Keep endpoint at `http://localhost:11434` in **Settings**.

If you deploy to another URL:

```bash
npm run ollama:allow-site -- https://your-domain.example
```

### 3. Configure in the app

1. Click **Settings** (gear icon)
2. Set **Ollama endpoint** — `http://localhost:11434` for hosted app; `/ollama` is used automatically in `npm run dev`
3. Choose a **model** name that matches your Ollama pull
4. Click **Test connection**
5. Click **AI Highlight** in the toolbar

### 4. Tune extraction (optional)

- **Detail level:** Low / Medium / High → up to 6 / 12 / 24 highlights per scan
- **Model bindings:** Map model prefixes to English or 中文 prompt packs
- **Prompts:** Customize highlight and summary prompts in Settings (open source)

## In-app guide

Click the **Guide** (book) icon in the toolbar for a step-by-step tutorial. Switch **EN / 中文** in the toolbar for UI language.

## Development

```bash
npm run dev        # Vite dev server + /ollama proxy
npm run build      # production build
npm run typecheck  # TypeScript check
npm run bench:web  # Playwright bench script
```

Monorepo layout:

- `apps/web` — React + Vite web app
- `packages/core` — shared highlight types and logic

## Deploy

Pushes to `main` publish to GitHub Pages via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

1. **Settings → Pages → Build and deployment → Source:** GitHub Actions
2. After deploy, run `npm run ollama:allow-site` on each machine that uses AI from the hosted URL

## Roadmap

- Deeper local-first AI editing (accept / reject highlights, explain why)
- macOS app on the same foundation
- More languages beyond EN / 中文

## License

MIT — see [LICENSE](LICENSE).
