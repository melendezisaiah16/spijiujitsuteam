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
    // The whole academy on the mat. The camera original is 1.83:1 with
    // a ceiling above the back row and a wide empty foreground; cropped
    // to ~2.27:1, which is what the hero slot is on a laptop, so the
    // people survive object-cover instead of being trimmed at the
    // edges. The floor that's left sits under the gradient and holds
    // the headline.
    crop: { left: 0, top: 120, width: 3752, height: 1650 },
    widths: [640, 960, 1280, 1920, 2560],
  },
  /*
   * hero-team-belt.jpg is the competition shot that held the hero until
   * the whole-academy photo replaced it. Kept as a source, not built.
   */
  {
    id: 'adults-training',
    src: 'adults-training.jpg',
    // Square original; the drilling happens in a band across the
    // middle, so trim the ceiling and the empty foreground mat.
    crop: { left: 0, top: 300, width: 2063, height: 1020 },
    widths: [480, 720, 960, 1440],
  },
  {
    id: 'kids-podium',
    src: 'kids-podium.jpg',
    // Cropped to the SPI athlete alone, at 1.51:1 to match the #kids
    // slot almost exactly. Two reasons beyond composition: the full
    // frame carries two children from other academies, who are not
    // ours to publish — and the untrimmed banner reads "SAVAGE" in
    // graffiti behind a section whose copy promises no yelling.
    crop: { left: 470, top: 180, width: 1150, height: 760 },
    widths: [480, 720, 960, 1150],
  },
  /*
   * kids-mat.jpg is still in assets/photos/ but no longer built. Its
   * crop held the Kids card until the class line-up took the slot.
   */
  {
    id: 'kids-class',
    src: 'kids-class.jpg',
    // The class lined up, trimmed to the band from heads to feet —
    // 3.27:1, which is what the card's letterbox actually wants. A row
    // of people is a horizontal composition; the drilling pair that
    // used to hold this slot was a square subject in a 3:1 hole, so it
    // rendered as an empty grey mat with two kids pushed into the
    // right third and a stranger's head cropped at the left edge.
    crop: { left: 0, top: 262, width: 1440, height: 440 },
    widths: [480, 720, 960, 1440],
  },
  /*
   * kids-hand-raised.jpg is in assets/photos/ but deliberately not
   * built. Tried in the programs card and pulled: at 640px wide it had
   * to be cropped to 425 and stretched to ~660 in a 3:1 letterbox,
   * which decapitated the coach, shrank the child to a sixth of the
   * frame and went visibly soft beside a sharp neighbour.
   *
   * It fits the #kids section slot (1.50:1 source, ~1.57:1 slot, almost
   * no upscale) — but the women's section directly above it is already
   * a hand-being-raised photograph, and two of those in consecutive
   * full-width sections reads as repetition rather than as a motif.
   *
   * Revisit when the camera original arrives. See README.
   */
  {
    id: 'women-hand-raised',
    src: 'women-hand-raised.jpg',
    // The uncropped frame is 1.5:1 with the referee dead centre, and
    // the section's slot is portrait — object-cover threw away both
    // athletes and left a section about women showing a man's back.
    // Cropped to the raised hand and the SPI patch, at ~0.96:1 so the
    // slot barely has to crop it at all.
    crop: { left: 900, top: 60, width: 1148, height: 1200 },
    widths: [480, 720, 960, 1148],
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
