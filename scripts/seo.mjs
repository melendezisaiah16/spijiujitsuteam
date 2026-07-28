/**
 * Generates robots.txt and sitemap.xml from SITE_URL.
 *
 * Written rather than hand-maintained so the domain lives in exactly
 * one place — see site.config.js. index.html gets the same value
 * substituted by the vite plugin in vite.config.ts.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ALLOW_INDEXING, SITE_URL, SITE_URL_IS_PLACEHOLDER } from '../site.config.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC = join(root, 'public')
await mkdir(PUBLIC, { recursive: true })

const robots = ALLOW_INDEXING
  ? `# https://www.robotstxt.org/
User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`
  : `# Pre-launch build — indexing disabled via SITE_NOINDEX.
# Remove SITE_NOINDEX from the environment to allow crawling.
User-agent: *
Disallow: /
`

// One page, so one URL. lastmod is the build date: the schedule and
// copy change from source, and a stale lastmod is worse than none.
const lastmod = new Date().toISOString().slice(0, 10)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`

/**
 * Only write when the content actually changed. These run on every
 * build, and rewriting files inside public/ churns the dev server's
 * watcher — enough to make a concurrent test run flake.
 */
async function writeIfChanged(file, next) {
  const path = join(PUBLIC, file)
  const prev = await readFile(path, 'utf8').catch(() => null)
  if (prev === next) return false
  await writeFile(path, next)
  return true
}

const wrote = [
  (await writeIfChanged('robots.txt', robots)) && 'robots.txt',
  (await writeIfChanged('sitemap.xml', sitemap)) && 'sitemap.xml',
].filter(Boolean)

console.log(
  wrote.length
    ? `seo: wrote ${wrote.join(' + ')} for ${SITE_URL}`
    : `seo: robots.txt + sitemap.xml already current for ${SITE_URL}`,
)

// Loud on purpose. Shipping the placeholder means the canonical link,
// Open Graph tags, JSON-LD and sitemap all point at a domain that
// isn't yours — the kind of thing nobody notices for a month.
if (!ALLOW_INDEXING) {
  console.log('seo: SITE_NOINDEX set — robots.txt disallows crawling and a noindex meta is injected')
}

if (SITE_URL_IS_PLACEHOLDER) {
  console.warn(
    `\n  ⚠  SITE_URL is unset — using the placeholder ${SITE_URL}.\n` +
      `     Fine locally. Set SITE_URL in the environment before a real deploy.\n`,
  )
}
