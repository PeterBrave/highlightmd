import { useMemo, useState } from 'react'
import { Bot, Languages, Link2, Sparkles, X } from 'lucide-react'
import {
  aiPromptFieldOrder,
  aiPromptLabels,
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

const settingsTabs: Array<{ id: SettingsTab; label: string; hint: string }> = [
  { id: 'general', label: 'General', hint: 'Connection & model' },
  { id: 'bindings', label: 'Model Bindings', hint: 'Prompt locale per model' },
  { id: 'prompts-en', label: 'English Prompts', hint: 'For gemma, llama, mistral…' },
  { id: 'prompts-zh', label: '中文 Prompts', hint: 'For qwen, deepseek, glm…' },
]

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
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')

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

    return (
      <div className="ai-settings-panel">
        <div className="ai-settings-panel-head">
          <div>
            <strong>{promptLocaleLabels[locale]} prompt pack</strong>
            <p>
              Placeholders are filled at runtime. Models bound to {promptLocaleLabels[locale]} will
              use this pack.
            </p>
          </div>
          <button
            className="ai-settings-soft-button"
            type="button"
            onClick={() => resetPromptPreset(locale)}
          >
            Reset {promptLocaleLabels[locale]}
          </button>
        </div>

        <div className="ai-prompt-grid">
          {aiPromptFieldOrder.map((field) => (
            <label className="ai-prompt-field" key={field}>
              <span className="ai-prompt-field-label">
                {aiPromptLabels[field]}
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
            <span className="ai-settings-kicker">Local AI Workspace</span>
            <h2>Settings</h2>
            <p>Connect Ollama, bind models to English or Chinese prompts, and tune extraction.</p>
          </div>
          <button className="ai-settings-icon-button" type="button" onClick={onClose} title="Close">
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
                    <strong>Local AI highlights</strong>
                    <span>{aiMessage}</span>
                  </div>
                  <span className={`ai-locale-badge ai-locale-${activeLocale}`}>
                    <Languages size={14} />
                    Active: {promptLocaleLabels[activeLocale]}
                  </span>
                </div>

                <div className="ai-settings-form-grid">
                  <label>
                    <span>Ollama endpoint</span>
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
                    <span>Model</span>
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
                        placeholder="e.g. gemma4:latest"
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
                    <strong>Enable local AI</strong>
                    <span>Highlights and summaries stay on this device.</span>
                  </div>
                </label>

                <div className="ai-limit-control ai-limit-card">
                  <div className="ai-limit-card-head">
                    <strong>Detail level</strong>
                    <span>
                      Up to {extractionLevelLimits[aiSettings.extractionLevel]} highlights per scan
                    </span>
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
                        {level.charAt(0).toUpperCase() + level.slice(1)}
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
                    <strong>Model → prompt locale</strong>
                    <p>
                      Bind a model name or prefix to English or Chinese prompts. Current model{' '}
                      <code>{aiSettings.model}</code> resolves to{' '}
                      <strong>{promptLocaleLabels[activeLocale]}</strong>.
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
                    Reset bindings
                  </button>
                </div>

                <div className="ai-binding-list">
                  {aiSettings.modelBindings.map((binding, index) => (
                    <div className="ai-binding-row" key={`${binding.model}-${index}`}>
                      <span className="ai-binding-icon">
                        <Link2 size={16} />
                      </span>
                      <input
                        placeholder="Model prefix, e.g. gemma or qwen2.5"
                        value={binding.model}
                        onChange={(event) => updateBinding(index, { model: event.target.value })}
                      />
                      <select
                        value={binding.locale}
                        onChange={(event) =>
                          updateBinding(index, { locale: event.target.value as PromptLocale })
                        }
                      >
                        <option value="en">English</option>
                        <option value="zh">中文</option>
                      </select>
                      <button
                        className="ai-settings-icon-button"
                        type="button"
                        onClick={() => removeBinding(index)}
                        title="Remove binding"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <button className="ai-settings-soft-button" type="button" onClick={addBinding}>
                  Add model binding
                </button>

                <div className="ai-settings-note">
                  Matching is prefix-based: <code>gemma</code> matches <code>gemma4:latest</code>.
                  If nothing matches, HightlightMD falls back to name heuristics.
                </div>
              </div>
            ) : null}

            {activeTab === 'prompts-en' ? renderPromptEditor('en') : null}
            {activeTab === 'prompts-zh' ? renderPromptEditor('zh') : null}
          </div>
        </div>

        <footer className="ai-settings-footer">
          <button className="ai-settings-soft-button" type="button" onClick={onTestConnection}>
            Test connection
          </button>
          <button
            className={`ai-settings-primary-button ${aiStatus === 'analyzing' ? 'is-loading' : ''}`}
            disabled={aiStatus === 'analyzing'}
            type="button"
            onClick={onRunHighlight}
          >
            <Bot size={16} />
            AI Highlight
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
            Reset all prompts
          </button>
        </footer>
      </section>
    </div>
  )
}
