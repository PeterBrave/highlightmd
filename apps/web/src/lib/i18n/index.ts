import { en } from './en'
import { zh } from './zh'
import type { AppLocale, AppMessages } from './types'

export type { AppLocale, AppMessages, TutorialSection } from './types'

const localeStorageKey = 'highlightmd:locale'

const catalogs: Record<AppLocale, AppMessages> = { en, zh }

let currentLocale: AppLocale = detectInitialLocale()

function detectInitialLocale(): AppLocale {
  if (typeof window === 'undefined') return 'en'

  const stored = localStorage.getItem(localeStorageKey)
  if (stored === 'en' || stored === 'zh') return stored

  const language = navigator.language.toLowerCase()
  return language.startsWith('zh') ? 'zh' : 'en'
}

export function getLocale(): AppLocale {
  return currentLocale
}

export function setLocale(locale: AppLocale) {
  currentLocale = locale
  if (typeof window !== 'undefined') {
    localStorage.setItem(localeStorageKey, locale)
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
    document.title = catalogs[locale].meta.title
    const description = document.querySelector('meta[name="description"]')
    if (description) {
      description.setAttribute('content', catalogs[locale].meta.description)
    }
  }
}

export function t(locale: AppLocale = currentLocale): AppMessages {
  return catalogs[locale]
}

export function getOllamaAllowSiteCommand(origin?: string) {
  const site = origin ?? (typeof window !== 'undefined' ? window.location.origin : 'https://peterbrave.github.io')
  return `npm run ollama:allow-site -- ${site}`
}

if (typeof window !== 'undefined') {
  setLocale(currentLocale)
}
