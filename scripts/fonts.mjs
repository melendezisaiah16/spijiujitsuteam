/**
 * Copies the Latin woff2 subsets out of the @fontsource packages into
 * public/fonts/.
 *
 * The fonts are served from stable, unhashed URLs so index.html can
 * preload them (a Vite-hashed URL can't be named in a preload, and the
 * preload is what removes the swap flash — see src/index.css).
 *
 * Doing it here rather than committing four binaries means the origin
 * of each file is recorded in code, and bumping @fontsource picks up
 * new builds automatically. The packages stay devDependencies: nothing
 * imports them at runtime.
 *
 *   npm run fonts
 */
import { copyFile, mkdir, readFile, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(root, 'public', 'fonts')
const MODULES = join(root, 'node_modules')

/** Latin only — the site has no non-Latin copy. */
const FONTS = [
  '@fontsource-variable/big-shoulders-display/files/big-shoulders-display-latin-wght-normal.woff2',
  '@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2',
  '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2',
  '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2',
]

/** SIL Open Font License texts, shipped alongside the fonts. */
const LICENCES = [
  ['@fontsource-variable/big-shoulders-display/LICENSE', 'LICENSE-big-shoulders-display.txt'],
  ['@fontsource/ibm-plex-mono/LICENSE', 'LICENSE-ibm-plex.txt'],
]

await mkdir(OUT, { recursive: true })

const same = async (a, b) => {
  const [x, y] = await Promise.all([readFile(a).catch(() => null), readFile(b).catch(() => null)])
  return x && y && x.equals(y)
}

let copied = 0
for (const [src, name] of [
  ...FONTS.map((f) => [f, f.split('/').pop()]),
  ...LICENCES,
]) {
  const from = join(MODULES, src)
  if (!(await stat(from).catch(() => null))) {
    throw new Error(`fonts: ${src} not found — run npm install first`)
  }
  const to = join(OUT, name)
  // Skip identical files so the dev server's public/ watcher stays quiet.
  if (await same(from, to)) continue
  await copyFile(from, to)
  copied++
}

console.log(
  copied ? `fonts: copied ${copied} file(s) to public/fonts` : 'fonts: already current',
)
