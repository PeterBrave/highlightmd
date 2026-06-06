# HightlightMD Technical Design

## Technical Direction

HightlightMD is a web-first, TypeScript-first, local-first Markdown review reader.

The recommended first-stage stack is:

- TypeScript
- React
- Vite
- Markdown AST / renderer pipeline
- Local AI highlight engine through Ollama
- Web Worker pipeline in later iterations
- Tauri for the future macOS app

## Initial Repository Shape

The first version keeps the repository small:

```text
highlightmd/
  apps/
    web/
  packages/
    core/
  docs/
    product.md
    tech-design.md
```

Future packages can be added when the implementation needs them.

## Core Pipeline

The long-term rendering pipeline should avoid whole-document blocking work:

```text
Markdown text
-> block segmentation
-> block-level parse
-> block-level highlight analysis
-> block-level render
-> virtualized reading view
-> lazy code highlight
-> background enhancement
```

The first Web MVP uses a simpler in-browser renderer so the product can be exercised quickly. Worker-based segmentation, block cache, and virtualization should be added as the next performance step.

## Shared Types

The core package defines shared document block, highlight, and block state types. These types are intended to be reused by the web app, future worker package, and future Tauri app.

## AI Highlight Experience

The highlight experience should optimize for one goal: help users find key points at a glance.

- Use local Ollama models for private document analysis.
- Ask the model for exact source text spans so rendering stays deterministic.
- Keep AI analysis manually triggered in the MVP to protect editing speed.
- Cache AI results and clear them after edits to avoid stale highlights.

## Local-first Requirements

- No backend dependency.
- No account system.
- No document uploads.
- No cloud AI in the first phase.
- Browser storage may hold settings and recent local state.

## Next Technical Steps

- Add block segmentation.
- Move AI highlight orchestration into a Web Worker.
- Add Shiki for real syntax highlighting.
- Add virtual rendering for long documents.
- Add benchmark fixtures for 100KB, 1MB, 5MB, and 10MB Markdown files.
