import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { getLocale, setLocale, t, type AppLocale, type AppMessages } from './index'

interface I18nContextValue {
  locale: AppLocale
  messages: AppMessages
  setLocale: (locale: AppLocale) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(() => getLocale())

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      messages: t(locale),
      setLocale: (next) => {
        setLocale(next)
        setLocaleState(next)
      },
    }),
    [locale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}
