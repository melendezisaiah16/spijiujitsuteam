import { renderToString } from 'react-dom/server'
import { App } from './App'

/**
 * Build-time render. Used only by scripts/prerender.mjs to bake the
 * page's real text into dist/index.html so crawlers get content in
 * the first response instead of an empty shell.
 */
export function render(): string {
  return renderToString(<App />)
}
