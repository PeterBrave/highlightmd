# HightlightMD

HightlightMD is an open-source Markdown reader and editor that uses AI to find the most important words, ideas, risks, numbers, and action items in your document, then highlights them for faster reading and better presentations.

It turns long Markdown documents, READMEs, PRDs, RFCs, meeting notes, and technical specs into scannable, presentation-friendly reading views.

## Why HightlightMD

Most Markdown editors help you write. HightlightMD helps you present.

When you are reviewing a document, explaining a proposal, or walking through a technical design, the hard part is not rendering Markdown. The hard part is knowing what the audience should notice first.

HightlightMD focuses on one core idea:

> Use AI to quickly recognize key information in text and highlight it directly inside the reading experience.

The goal is to make important content stand out while keeping the document local, private, and easy to share.

## Core Idea

HightlightMD highlights the parts of a document that matter most:

- Keywords and key concepts
- Risks and blockers
- Decisions and conclusions
- Numbers, dates, owners, and deadlines
- Action items and next steps
- Technical terms in engineering documents

This makes Markdown easier to scan, review, and present. Instead of manually bolding everything before a meeting, you can let the editor help surface what deserves attention.

## Web MVP

The first version includes:

- Paste Markdown
- Drag in `.md` files
- Markdown rendering
- Local AI highlights through Ollama
- Fast key-point scanning
- Presentation mode
- Reading controls
- Local-only document processing

## AI Roadmap

HightlightMD is designed to become a local-first AI Markdown editor.

Planned AI features:

- Use local models through Ollama
- Detect document keywords and important sentences
- Explain why a section was highlighted
- Let users accept, remove, or tune AI highlights
- Keep document analysis local whenever possible

The long-term vision is simple: install a local model, open a Markdown document, and get an AI-assisted presentation view without sending private documents to the cloud.

## Product Direction

HightlightMD will start as a Web / PWA app and later expand into a macOS app built on the same foundation.

The project is open source because Markdown, local-first tools, and personal AI workflows should be easy to inspect, remix, and improve.

## Run

```bash
npm install
npm run dev
```

The web app runs from `apps/web`.

## Deploy

Pushes to `main` build the site and publish it to GitHub Pages via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

After the first successful deploy, enable GitHub Pages in the repository settings:

1. Open **Settings → Pages**
2. Set **Build and deployment → Source** to **GitHub Actions**

The live site is available at https://peterbrave.github.io/highlightmd/.
