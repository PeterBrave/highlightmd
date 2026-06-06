import { useState } from 'react'
import { BookOpen, X } from 'lucide-react'
import { useI18n } from '../lib/i18n/context'
import type { TutorialSection } from '../lib/i18n/types'

interface TutorialModalProps {
  onClose: () => void
}

export function TutorialModal({ onClose }: TutorialModalProps) {
  const { messages } = useI18n()
  const { tutorial } = messages
  const [activeSectionId, setActiveSectionId] = useState(tutorial.sections[0]?.id ?? 'start')

  const activeSection =
    tutorial.sections.find((section) => section.id === activeSectionId) ?? tutorial.sections[0]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section
        className="tutorial-shell"
        aria-label="Usage tutorial"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="tutorial-topbar">
          <div className="tutorial-topbar-title">
            <BookOpen size={22} />
            <div>
              <span className="tutorial-kicker">{tutorial.kicker}</span>
              <h2>{tutorial.intro.title}</h2>
              <p>{tutorial.intro.description}</p>
            </div>
          </div>
          <button
            className="ai-settings-icon-button"
            type="button"
            onClick={onClose}
            title={tutorial.close}
          >
            <X size={18} />
          </button>
        </header>

        <div className="tutorial-layout">
          <nav className="tutorial-nav" aria-label="Tutorial sections">
            {tutorial.sections.map((section, index) => (
              <button
                className={section.id === activeSectionId ? 'active' : ''}
                key={section.id}
                type="button"
                onClick={() => setActiveSectionId(section.id)}
              >
                <span className="tutorial-nav-index">{index + 1}</span>
                <span>
                  <strong>{section.title}</strong>
                  <small>{section.subtitle}</small>
                </span>
              </button>
            ))}
          </nav>

          <article className="tutorial-content">
            {activeSection ? <TutorialSectionView section={activeSection} tipsLabel={tutorial.tips} /> : null}
          </article>
        </div>

        <footer className="tutorial-footer">
          <span>{tutorial.footer}</span>
          <button className="ai-settings-primary-button" type="button" onClick={onClose}>
            {tutorial.getStarted}
          </button>
        </footer>
      </section>
    </div>
  )
}

function TutorialSectionView({
  section,
  tipsLabel,
}: {
  section: TutorialSection
  tipsLabel: string
}) {
  return (
    <div className="tutorial-section">
      <header className="tutorial-section-head">
        <h3>{section.title}</h3>
        <p>{section.subtitle}</p>
      </header>

      <ol className="tutorial-steps">
        {section.steps.map((step) => (
          <li className="tutorial-step" key={step.title}>
            <strong>{step.title}</strong>
            <p>{step.body}</p>
          </li>
        ))}
      </ol>

      {section.tips && section.tips.length > 0 ? (
        <div className="tutorial-tips">
          <strong>{tipsLabel}</strong>
          <ul>
            {section.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
