import { useState } from 'react'
import { BookOpen, X } from 'lucide-react'
import { tutorialIntro, tutorialSections, type TutorialSection } from '../lib/tutorialContent'

interface TutorialModalProps {
  onClose: () => void
}

export function TutorialModal({ onClose }: TutorialModalProps) {
  const [activeSectionId, setActiveSectionId] = useState(tutorialSections[0]?.id ?? 'start')

  const activeSection =
    tutorialSections.find((section) => section.id === activeSectionId) ?? tutorialSections[0]

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
              <span className="tutorial-kicker">Guide</span>
              <h2>{tutorialIntro.title}</h2>
              <p>{tutorialIntro.description}</p>
            </div>
          </div>
          <button className="ai-settings-icon-button" type="button" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </header>

        <div className="tutorial-layout">
          <nav className="tutorial-nav" aria-label="Tutorial sections">
            {tutorialSections.map((section, index) => (
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
            {activeSection ? <TutorialSectionView section={activeSection} /> : null}
          </article>
        </div>

        <footer className="tutorial-footer">
          <span>开源项目 · 可在 Settings 中自定义 Prompt 与模型绑定</span>
          <button className="ai-settings-primary-button" type="button" onClick={onClose}>
            开始使用
          </button>
        </footer>
      </section>
    </div>
  )
}

function TutorialSectionView({ section }: { section: TutorialSection }) {
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
          <strong>Tips</strong>
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
