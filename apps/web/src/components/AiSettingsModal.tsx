import { useMemo, useState } from 'react'
import { Bot, Languages, Link2, Sparkles, X } from 'lucide-react'
import {
  aiPromptFieldOrder,
  aiPromptVariables,
  defaultChinesePrompts,
  defaultEnglishPrompts,
  defaultModelBindings,
  defaultPromptPresets,
  promptLocaleLabels,
  resolvePromptLocale,
  type AiPrompts,
  type PromptLocale,
} from '../lib/aiPrompts'
import { useI18n } from '../lib/i18n/context'
import { extractionLevelLimits, type AiSettings, type ExtractionLevel } from '../lib/ollama'

type SettingsTab = 'general' | 'bindings' | 'prompts-en' | 'prompts-zh'

type AiStatus = 'idle' | 'testing' | 'connected' | 'analyzing' | 'done' | 'error'

interface AiSettingsModalProps {
  aiMessage: string
  aiSettings: AiSettings
  aiStatus: AiStatus
  availableModels: string[]
  extractionLevels: ExtractionLevel[]
  onClose: () => void
  onRunHighlight: () => void
  onSettingsChange: (updater: (settings: AiSettings) => AiSettings) => void
  onTestConnection: () => void
}

export function AiSettingsModal({
  aiMessage,
  aiSettings,
  aiStatus,
  availableModels,
  extractionLevels,
  onClose,
  onRunHighlight,
  onSettingsChange,
  onTestConnection,
}: AiSettingsModalProps) {
  const { messages } = useI18n()
  const s = messages.settings
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')

  const settingsTabs = useMemo(
    () =>
      [
        { id: 'general' as const, label: s.tabs.general.label, hint: s.tabs.general.hint },
        { id: 'bindings' as const, label: s.tabs.bindings.label, hint: s.tabs.bindings.hint },
        { id: 'prompts-en' as const, label: s.tabs.promptsEn.label, hint: s.tabs.promptsEn.hint },
        { id: 'prompts-zh' as const, label: s.tabs.promptsZh.label, hint: s.tabs.promptsZh.hint },
      ] as const,
    [s],
  )

  const activeLocale = useMemo(
    () => resolvePromptLocale(aiSettings.model, aiSettings.modelBindings),
    [aiSettings.model, aiSettings.modelBindings],
  )

  function updatePromptPreset(locale: PromptLocale, field: keyof AiPrompts, value: string) {
    onSettingsChange((settings) => ({
      ...settings,
      promptPresets: {
        ...settings.promptPresets,
        [locale]: {
          ...settings.promptPresets[locale],
          [field]: value,
        },
      },
    }))
  }

  function resetPromptPreset(locale: PromptLocale) {
    onSettingsChange((settings) => ({
      ...settings,
      promptPresets: {
        ...settings.promptPresets,
        [locale]: locale === 'zh' ? { ...defaultChinesePrompts } : { ...defaultEnglishPrompts },
      },
    }))
  }

  function updateBinding(index: number, patch: Partial<{ model: string; locale: PromptLocale }>) {
    onSettingsChange((settings) => ({
      ...settings,
      modelBindings: settings.modelBindings.map((binding, bindingIndex) =>
        bindingIndex === index ? { ...binding, ...patch } : binding,
      ),
    }))
  }

  function addBinding() {
    onSettingsChange((settings) => ({
      ...settings,
      modelBindings: [...settings.modelBindings, { model: '', locale: 'en' }],
    }))
  }

  function removeBinding(index: number) {
    onSettingsChange((settings) => ({
      ...settings,
      modelBindings: settings.modelBindings.filter((_, bindingIndex) => bindingIndex !== index),
    }))
  }

  function renderPromptEditor(locale: PromptLocale) {
    const prompts = aiSettings.promptPresets[locale]
    const localeLabel = promptLocaleLabels[locale]

    return (
      <div className="ai-settings-panel">
        <div className="ai-settings-panel-head">
          <div>
            <strong>{s.promptPackTitle(localeLabel)}</strong>
            <p>{s.promptPackDesc(localeLabel)}</p>
          </div>
          <button
            className="ai-settings-soft-button"
            type="button"
            onClick={() => resetPromptPreset(locale)}
          >
            {s.resetPromptPack(localeLabel)}
          </button>
        </div>

        <div className="ai-prompt-grid">
          {aiPromptFieldOrder.map((field) => (
            <label className="ai-prompt-field" key={field}>
              <span className="ai-prompt-field-label">
                {s.promptLabels[field]}
                {aiPromptVariables[field].length > 0 ? (
                  <small>{aiPromptVariables[field].join(' · ')}</small>
                ) : null}
              </span>
              <textarea
                rows={field.endsWith('System') ? 4 : 10}
                spellCheck={false}
                value={prompts[field]}
                onChange={(event) => updatePromptPreset(locale, field, event.target.value)}
              />
            </label>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section
        className="ai-settings-shell"
        aria-label="AI settings"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="ai-settings-topbar">
          <div>
            <span className="ai-settings-kicker">{s.kicker}</span>
            <h2>{s.title}</h2>
            <p>{s.subtitle}</p>
          </div>
          <button className="ai-settings-icon-button" type="button" onClick={onClose} title={s.close}>
            <X size={18} />
          </button>
        </header>

        <div className="ai-settings-layout">
          <nav className="ai-settings-nav" aria-label="Settings sections">
            {settingsTabs.map((tab) => (
              <button
                className={activeTab === tab.id ? 'active' : ''}
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
              >
                <strong>{tab.label}</strong>
                <span>{tab.hint}</span>
              </button>
            ))}
          </nav>

          <div className="ai-settings-content">
            {activeTab === 'general' ? (
              <div className="ai-settings-panel">
                <div className="ai-settings-status-card">
                  <span className={`ai-status-dot ai-status-${aiStatus}`} />
                  <div>
                    <strong>{s.localAi}</strong>
                    <span>{aiMessage}</span>
                  </div>
                  <span className={`ai-locale-badge ai-locale-${activeLocale}`}>
                    <Languages size={14} />
                    {s.activeLocale(promptLocaleLabels[activeLocale])}
                  </span>
                </div>

                <div className="ai-settings-form-grid">
                  <label>
                    <span>{s.endpoint}</span>
                    <input
                      value={aiSettings.endpoint}
                      onChange={(event) =>
                        onSettingsChange((settings) => ({
                          ...settings,
                          endpoint: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label>
                    <span>{s.model}</span>
                    {availableModels.length > 0 ? (
                      <select
                        value={aiSettings.model}
                        onChange={(event) =>
                          onSettingsChange((settings) => ({
                            ...settings,
                            model: event.target.value,
                          }))
                        }
                      >
                        {availableModels.map((modelName) => (
                          <option key={modelName} value={modelName}>
                            {modelName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={aiSettings.model}
                        placeholder={s.modelPlaceholder}
                        onChange={(event) =>
                          onSettingsChange((settings) => ({
                            ...settings,
                            model: event.target.value,
                          }))
                        }
                      />
                    )}
                  </label>
                </div>

                <label className="ai-toggle-card">
                  <input
                    checked={aiSettings.enabled}
                    type="checkbox"
                    onChange={(event) =>
                      onSettingsChange((settings) => ({
                        ...settings,
                        enabled: event.target.checked,
                      }))
                    }
                  />
                  <div>
                    <strong>{s.enableLocalAi}</strong>
                    <span>{s.enableLocalAiHint}</span>
                  </div>
                </label>

                <div className="ai-limit-control ai-limit-card">
                  <div className="ai-limit-card-head">
                    <strong>{s.detailLevel}</strong>
                    <span>{s.detailLevelHint(extractionLevelLimits[aiSettings.extractionLevel])}</span>
                  </div>
                  <div>
                    {extractionLevels.map((level) => (
                      <button
                        className={aiSettings.extractionLevel === level ? 'active' : ''}
                        key={level}
                        type="button"
                        onClick={() =>
                          onSettingsChange((settings) => ({
                            ...settings,
                            extractionLevel: level,
                          }))
                        }
                      >
                        {s.detailLevels[level]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === 'bindings' ? (
              <div className="ai-settings-panel">
                <div className="ai-settings-panel-head">
                  <div>
                    <strong>{s.bindingsTitle}</strong>
                    <p>
                      {s.bindingsDesc(aiSettings.model, promptLocaleLabels[activeLocale])}
                    </p>
                  </div>
                  <button
                    className="ai-settings-soft-button"
                    type="button"
                    onClick={() =>
                      onSettingsChange((settings) => ({
                        ...settings,
                        modelBindings: defaultModelBindings.map((item) => ({ ...item })),
                      }))
                    }
                  >
                    {s.resetBindings}
                  </button>
                </div>

                <div className="ai-binding-list">
                  {aiSettings.modelBindings.map((binding, index) => (
                    <div className="ai-binding-row" key={`${binding.model}-${index}`}>
                      <span className="ai-binding-icon">
                        <Link2 size={16} />
                      </span>
                      <input
                        placeholder={s.modelPrefixPlaceholder}
                        value={binding.model}
                        onChange={(event) => updateBinding(index, { model: event.target.value })}
                      />
                      <select
                        value={binding.locale}
                        onChange={(event) =>
                          updateBinding(index, { locale: event.target.value as PromptLocale })
                        }
                      >
                        <option value="en">{promptLocaleLabels.en}</option>
                        <option value="zh">{promptLocaleLabels.zh}</option>
                      </select>
                      <button
                        className="ai-settings-icon-button"
                        type="button"
                        onClick={() => removeBinding(index)}
                        title={s.removeBinding}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <button className="ai-settings-soft-button" type="button" onClick={addBinding}>
                  {s.addBinding}
                </button>

                <div className="ai-settings-note">{s.bindingsNote}</div>
              </div>
            ) : null}

            {activeTab === 'prompts-en' ? renderPromptEditor('en') : null}
            {activeTab === 'prompts-zh' ? renderPromptEditor('zh') : null}
          </div>
        </div>

        <footer className="ai-settings-footer">
          <button className="ai-settings-soft-button" type="button" onClick={onTestConnection}>
            {s.testConnection}
          </button>
          <button
            className={`ai-settings-primary-button ${aiStatus === 'analyzing' ? 'is-loading' : ''}`}
            disabled={aiStatus === 'analyzing'}
            type="button"
            onClick={onRunHighlight}
          >
            <Bot size={16} />
            {s.runHighlight}
          </button>
          <button
            className="ai-settings-soft-button"
            type="button"
            onClick={() =>
              onSettingsChange((settings) => ({
                ...settings,
                promptPresets: {
                  en: { ...defaultPromptPresets.en },
                  zh: { ...defaultPromptPresets.zh },
                },
                modelBindings: defaultModelBindings.map((item) => ({ ...item })),
              }))
            }
          >
            <Sparkles size={16} />
            {s.resetAllPrompts}
          </button>
        </footer>
      </section>
    </div>
  )
}
