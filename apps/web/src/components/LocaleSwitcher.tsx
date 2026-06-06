import { Languages } from 'lucide-react'
import { useI18n } from '../lib/i18n/context'
import type { AppLocale } from '../lib/i18n/types'

export function LocaleSwitcher() {
  const { locale, messages, setLocale } = useI18n()

  function select(next: AppLocale) {
    if (next !== locale) setLocale(next)
  }

  return (
    <div className="locale-switcher" title={messages.locale.switchTitle}>
      <Languages size={15} aria-hidden="true" />
      <button
        className={locale === 'en' ? 'active' : ''}
        type="button"
        onClick={() => select('en')}
      >
        {messages.locale.en}
      </button>
      <button
        className={locale === 'zh' ? 'active' : ''}
        type="button"
        onClick={() => select('zh')}
      >
        {messages.locale.zh}
      </button>
    </div>
  )
}
