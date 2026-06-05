import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import 'github-markdown-css/github-markdown.css'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {
      // PWA support should never block the reader.
    })
  })
}
