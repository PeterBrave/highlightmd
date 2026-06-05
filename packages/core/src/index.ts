export type DocBlockType =
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'blockquote'
  | 'table'
  | 'code'
  | 'image'
  | 'hr'
  | 'frontmatter'
  | 'unknown'

export type HighlightKind =
  | 'keyword'
  | 'risk'
  | 'action'
  | 'decision'
  | 'number'
  | 'tech'
  | 'code'
  | 'custom'

export type HighlightMode = 'light' | 'review' | 'pitch' | 'tech'

export interface DocBlock {
  id: string
  type: DocBlockType
  start: number
  end: number
  raw: string
  hash: string
  level?: number
  language?: string
  html?: string
  highlights?: Highlight[]
  meta?: Record<string, unknown>
}

export interface Highlight {
  id: string
  text: string
  kind: HighlightKind
  score: number
  start?: number
  end?: number
  reason?: string
}

export interface BlockState {
  block: DocBlock
  renderStatus: 'idle' | 'pending' | 'done' | 'error'
  highlightStatus: 'idle' | 'pending' | 'done' | 'error'
  codeHighlightStatus?: 'idle' | 'pending' | 'done' | 'error'
}
