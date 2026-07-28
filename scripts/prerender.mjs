/**
 * Bakes the rendered page into dist/index.html.
 *
 * A plain Vite SPA ships an empty <div id="root">, which leaves
 * Google to render JS before it sees any copy. This runs the same
 * React tree through renderToString at build time so the deployed
 * HTML already contains the headline, schedule, and address — the
 * same output a Next.js static export would produce, without
 * taking on the framework.
 *
 * Runs after both Vite builds. See the "build" script.
 */
import { readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.cwd()
const htmlPath = join(root, 'dist', 'index.html')
const ssrEntry = join(root, 'dist-ssr', 'entry-server.js')
const PLACEHOLDER = '<div id="root"></div>'

const { render } = await import(pathToFileURL(ssrEntry).href)
const html = await readFile(htmlPath, 'utf8')

if (!html.includes(PLACEHOLDER)) {
  throw new Error(`prerender: could not find ${PLACEHOLDER} in dist/index.html`)
}

const appHtml = render()
await writeFile(htmlPath, html.replace(PLACEHOLDER, `<div id="root">${appHtml}</div>`))
await rm(join(root, 'dist-ssr'), { recursive: true, force: true })

console.log(`prerender: injected ${appHtml.length.toLocaleString()} chars into dist/index.html`)
