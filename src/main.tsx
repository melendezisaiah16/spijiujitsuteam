import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'

// Self-hosted rather than Google Fonts: no third-party request on
// the critical path, and no privacy surface. The `wght` entrypoints
// pull the weight axis only — no width axis, no italics. Non-Latin
// subsets are unicode-range gated and never fetched.
// Fonts are declared in index.css against stable /fonts/ URLs and
// preloaded from index.html — see the comment there.
import './index.css'

import { App } from './App'

const root = document.getElementById('root')
if (!root) throw new Error('#root not found')

const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// Production builds ship prerendered markup, so hydrate it. In dev
// the shell is empty and we mount fresh.
if (root.hasChildNodes()) {
  hydrateRoot(root, app)
} else {
  createRoot(root).render(app)
}
