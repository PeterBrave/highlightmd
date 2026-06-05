# MarkLens Product Requirements

## Product Overview

MarkLens is a local-first Markdown reader for walkthroughs, document reviews, and fast scanning. It automatically highlights keywords, conclusions, risks, numbers, action items, and technical terms so Markdown documents become easier to explain, review, and present.

The first phase supports two product forms:

- Web / PWA
- macOS app built with web technology

The first phase does not include Flutter, mobile apps, browser plugins, editor plugins, cloud sync, collaboration, or cloud AI.

## Goals

- Render Markdown with high performance.
- Automatically surface important document content.
- Support review and presentation workflows.
- Keep document processing local.
- Reuse the web foundation for a future macOS app.
- Leave room for optional local AI highlighting later.

## Target Users

- Engineers reading or presenting technical designs, READMEs, APIs, ADRs, RFCs, and postmortems.
- Product managers presenting PRDs, research notes, competitive analysis, and requirement breakdowns.
- Technical leads reviewing architecture, trade-offs, dependencies, risks, and next steps.
- Open-source authors making READMEs and contribution guides easier to scan.

## MVP Scope

The Web MVP must support:

- Paste Markdown.
- Drag in Markdown files.
- Render Markdown.
- Highlight code blocks.
- Automatically highlight important text.
- Switch Light / Review / Pitch / Tech modes.
- Enter presentation mode.
- Adjust reading style.
- Process documents locally.
- Export highlighted HTML.

## Non-goals

- Account system.
- Cloud sync.
- Multiplayer collaboration.
- Heavy Markdown editor.
- WYSIWYG editing.
- Mobile app.
- Flutter full-platform app.
- Chrome, Obsidian, or VS Code plugin.
- PDF reader.
- Cloud AI summary.

## Acceptance Criteria

- Users can open the Web demo.
- Users can paste Markdown.
- Users can drag in `.md` files.
- Markdown renders quickly.
- Code blocks render clearly.
- Smart highlights appear automatically.
- Users can switch four highlight modes.
- Users can enter presentation mode.
- All document processing happens locally.
