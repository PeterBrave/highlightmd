export const sampleMarkdown = `# HightlightMD Web MVP

HightlightMD is a local-first Markdown reader for reviews, walkthroughs, and presentations.

## Conclusion

The first version should focus on Web / PWA. The core reason is that a web demo is easier to share, easier to validate, and can become the base for a Tauri macOS app.

## Risks

- Risk: large Markdown files can block the UI if the app parses and renders the entire document at once.
- Trade-off: local AI highlights are more useful, but model latency must stay out of the editing path.
- Fallback: keep the original Markdown visible and make every highlight removable by mode.

## Action Items

- TODO: support paste and drag-in Markdown files.
- Owner: web team.
- Deadline: 2026-07-01.
- Next step: add performance benchmarks for 1MB and 5MB files.

## Technical Design

The rendering pipeline should use block segmentation, Web Worker analysis, cached highlight results, and lazy code highlighting.

\`\`\`ts
export interface Highlight {
  id: string
  text: string
  kind: 'risk' | 'action' | 'decision' | 'number' | 'tech'
  score: number
}
\`\`\`

## Metrics

The target is first readable paint under 300ms for 1MB Markdown and under 1s for 5MB Markdown. Scrolling should stay close to 60fps.
`
