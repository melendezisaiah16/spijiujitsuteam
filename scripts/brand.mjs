/**
 * Brand asset pipeline.
 *
 * The logo shipped from the handoff at 1036×1037 and 462 KB — the
 * heaviest file on the page, for something rendered at 40×40 in the
 * header. React 19 auto-preloads images it renders, so it was also
 * competing with the hero photo (the LCP element) for bandwidth.
 *
 * Also builds the Open Graph card. The og:image was pointing at that
 * square logo, which link previews crop badly; 1200×630 is what
 * Facebook, iMessage, WhatsApp and Slack actually want.
 *
 *   npm run brand
 */
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(root, 'public', 'assets')
await mkdir(OUT, { recursive: true })

const kb = (n) => `${(n / 1024).toFixed(1)} KB`

/**
 * Byte-compare before writing. Both outputs are regenerated on every
 * build; rewriting them churns the dev server's public/ watcher, which
 * is enough to flake a concurrent test run.
 */
async function writeIfChanged(path, buf) {
  const prev = await readFile(path).catch(() => null)
  if (prev && prev.equals(buf)) return false
  await writeFile(path, buf)
  return true
}

/* --- Logo -------------------------------------------------------
   180px covers a 40px slot at 4x DPR and doubles as the
   apple-touch-icon, so one file serves the header and the tab. */
const logoSrc = join(root, 'assets', 'brand', 'spi-logo.png')
const before = (await stat(logoSrc)).size
const logo = await sharp(logoSrc)
  .resize(180, 180, { fit: 'cover' })
  .png({ compressionLevel: 9, palette: true })
  .toBuffer()
const logoWritten = await writeIfChanged(join(OUT, 'spi-logo.png'), logo)
console.log(
  `brand: logo ${kb(before)} → ${kb(logo.length)}${logoWritten ? '' : ' (unchanged)'}`,
)

/* --- Open Graph card -------------------------------------------
   The hero frame, cropped to 1200×630 and darkened so the platform's
   own title text stays legible over it. No baked-in type: sharp
   renders SVG text with system fonts, so the display face wouldn't be
   available and it would silently fall back to something else. */
const heroSrc = join(root, 'assets', 'photos', 'hero-team.jpg')
const scrim = Buffer.from(
  `<svg width="1200" height="630"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
     <stop offset="0%" stop-color="#0A1428" stop-opacity="0.35"/>
     <stop offset="100%" stop-color="#07101F" stop-opacity="0.72"/>
   </linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/></svg>`,
)
const og = await sharp(heroSrc)
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .composite([{ input: scrim, blend: 'over' }])
  .jpeg({ quality: 82, mozjpeg: true, progressive: true })
  .toBuffer()
const ogWritten = await writeIfChanged(join(OUT, 'og-image.jpg'), og)
console.log(`brand: og-image 1200×630 ${kb(og.length)}${ogWritten ? '' : ' (unchanged)'}`)
