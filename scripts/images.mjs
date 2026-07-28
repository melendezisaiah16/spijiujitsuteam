/**
 * Responsive image pipeline.
 *
 * Reads the originals in assets/photos/, emits AVIF + WebP + JPEG at
 * several widths into public/img/, and writes src/generated/images.json
 * so components know each image's widths and intrinsic size (which is
 * what keeps the layout from shifting as photos load).
 *
 * Runs automatically before `dev` and `build`. Outputs newer than both
 * their source and this script are left alone, so repeat runs are cheap.
 *
 *   npm run images -- --force   regenerate everything
 */
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIR = join(root, 'assets', 'photos')
const OUT_DIR = join(root, 'public', 'img')
const MANIFEST_OUT = join(root, 'src', 'generated', 'images.json')
const force = process.argv.includes('--force')

/**
 * `crop` is applied before resizing, in source pixels. Widths should
 * cover 1x and 2x for the slot the image renders in.
 */
const IMAGES = [
  {
    id: 'hero-team',
    src: 'hero-team.jpg',
    widths: [640, 960, 1280, 1920, 2560],
  },
  {
    id: 'adults-training',
    src: 'adults-training.jpg',
    // Square original; the drilling happens in a band across the
    // middle, so trim the ceiling and the empty foreground mat.
    crop: { left: 0, top: 300, width: 2063, height: 1020 },
    widths: [480, 720, 960, 1440],
  },
  {
    id: 'kids-class',
    src: 'kids-class.jpg',
    // Trim ceiling and a third of the empty floor. The kids sit in a
    // band across the middle; at the section's near-4:3 slot the
    // untrimmed frame leaves them stranded above a lot of bare mat.
    crop: { left: 0, top: 60, width: 1440, height: 950 },
    widths: [480, 720, 960, 1440],
  },
  {
    id: 'kids-pair',
    src: 'kids-mat.jpg',
    // Two kids drilling on the right of the wide room shot. The full
    // frame reads as "a room", which the Kids card can't afford at
    // 220px tall — and the wide version is already the adults card.
    crop: { left: 1180, top: 930, width: 868, height: 330 },
    widths: [480, 720, 868],
  },
  {
    id: 'coach-thomas',
    src: 'coach-thomas.jpg',
    // Tightened onto Thomas in his corner; the full frame is mostly
    // empty gym floor.
    crop: { left: 0, top: 270, width: 1180, height: 1010 },
    widths: [480, 720, 960, 1180],
  },
]

const FORMATS = [
  { ext: 'avif', apply: (p) => p.avif({ quality: 55, effort: 6 }) },
  { ext: 'webp', apply: (p) => p.webp({ quality: 74 }) },
  { ext: 'jpg', apply: (p) => p.jpeg({ quality: 78, mozjpeg: true, progressive: true }) },
]

const mtime = async (p) => (await stat(p).catch(() => null))?.mtimeMs ?? 0
const scriptTime = await mtime(fileURLToPath(import.meta.url))

await mkdir(OUT_DIR, { recursive: true })
await mkdir(dirname(MANIFEST_OUT), { recursive: true })

const manifest = {}
let written = 0
let skipped = 0

for (const image of IMAGES) {
  const srcPath = join(SRC_DIR, image.src)
  const srcTime = await mtime(srcPath)
  if (!srcTime) {
    console.warn(`images: MISSING ${image.src} — skipping "${image.id}"`)
    continue
  }

  // Intrinsic size after cropping, used for width/height attributes.
  const meta = await sharp(srcPath).rotate().metadata()
  const base = image.crop ?? { width: meta.width, height: meta.height }
  // Never upscale, but do keep the source's own width as the top step
  // so a small original still serves its best available detail.
  const widths = image.widths.filter((w) => w < base.width)
  if (image.widths.some((w) => w >= base.width) || widths.length === 0) {
    widths.push(base.width)
  }

  for (const width of widths) {
    for (const { ext, apply } of FORMATS) {
      const outPath = join(OUT_DIR, `${image.id}-${width}.${ext}`)
      const outTime = await mtime(outPath)
      if (!force && outTime > srcTime && outTime > scriptTime) {
        skipped++
        continue
      }

      let pipeline = sharp(srcPath).rotate()
      if (image.crop) pipeline = pipeline.extract(image.crop)
      await apply(pipeline.resize({ width, withoutEnlargement: true })).toFile(outPath)
      written++
    }
  }

  manifest[image.id] = {
    widths,
    width: base.width,
    height: base.height,
    aspectRatio: Number((base.width / base.height).toFixed(4)),
  }
}

/*
 * Delete outputs that no longer belong to any manifest entry.
 *
 * Without this, renaming or removing an image leaves its derivatives
 * behind forever. They keep getting copied into dist and deployed,
 * while a fresh CI checkout produces a different — correct — file set.
 * Local and production builds silently diverge.
 */
const expected = new Set(
  Object.entries(manifest).flatMap(([id, m]) =>
    m.widths.flatMap((w) => FORMATS.map(({ ext }) => `${id}-${w}.${ext}`)),
  ),
)
const orphans = (await readdir(OUT_DIR)).filter((f) => !expected.has(f))
for (const f of orphans) await rm(join(OUT_DIR, f))
if (orphans.length) console.log(`images: pruned ${orphans.length} orphaned file(s)`)

// Only rewrite the manifest when it actually changed, so `predev`
// doesn't churn the file and trigger a needless HMR reload.
const next = JSON.stringify(manifest, null, 2) + '\n'
const prev = await readFile(MANIFEST_OUT, 'utf8').catch(() => '')
if (next !== prev) await writeFile(MANIFEST_OUT, next)

console.log(`images: ${written} written, ${skipped} up to date, ${Object.keys(manifest).length} in manifest`)
