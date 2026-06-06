import { chromium } from 'playwright'

const url = process.env.BENCH_URL ?? 'http://localhost:5173/'
const sizes = [
  ['1mb', 1024 * 1024],
  ['5mb', 5 * 1024 * 1024],
]

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
await page.addInitScript(() => localStorage.clear())

for (const [name, bytes] of sizes) {
  const source = makeMarkdown(bytes)

  await page.goto(url, { waitUntil: 'domcontentloaded' })
  const importStartedAt = performance.now()
  await page.locator('input[type="file"]').setInputFiles({
    name: `${name}.md`,
    mimeType: 'text/markdown',
    buffer: Buffer.from(source),
  })
  const importedAt = performance.now()
  await page.waitForFunction(() => document.querySelectorAll('.ml-block').length > 0)
  const firstBlockAfterImportMs = performance.now() - importedAt

  await page.waitForFunction(() => {
    const meta = document.querySelector('.outline-meta')?.textContent
    return Boolean(meta && /blocks/.test(meta))
  })

  const result = await page.evaluate(() => ({
    renderedBlocks: document.querySelectorAll('.ml-block').length,
    progress: document.querySelector('.render-progress')?.textContent?.replace(/\s+/g, ' ').trim() ?? 'complete',
    outlineMeta: document.querySelector('.outline-meta')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    highlights: document.querySelectorAll('.ml-highlight').length,
  }))

  console.log(
    JSON.stringify(
      {
        file: name,
        bytes: source.length,
        importMs: Math.round(importedAt - importStartedAt),
        firstBlockAfterImportMs: Math.round(firstBlockAfterImportMs),
        ...result,
      },
      null,
      2,
    ),
  )
}

await browser.close()

function makeMarkdown(targetBytes) {
  const section = `## Technical Design Review

Conclusion: the Web / PWA path is recommended because it keeps the demo local-first and easy to share.

- Risk: rendering the entire document can block the UI.
- TODO: move segmentation to a Web Worker.
- Owner: platform team.
- Deadline: 2026-07-01.
- Metric: first readable paint should stay under 300ms for 1MB and under 1s for 5MB.

\`\`\`ts
export interface BenchmarkBlock {
  id: string
  endpoint: '/api/render'
  latencyMs: 42
}
\`\`\`

`

  let output = '# HightlightMD Benchmark\n\n'

  while (output.length < targetBytes) {
    output += section
  }

  return output.slice(0, targetBytes)
}
