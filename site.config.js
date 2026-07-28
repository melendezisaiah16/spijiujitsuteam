/**
 * The one place the live domain is resolved.
 *
 * Consumed by vite.config.ts (which substitutes __SITE_URL__ in
 * index.html for the canonical link, Open Graph tags and JSON-LD) and
 * by scripts/seo.mjs (robots.txt, sitemap.xml).
 *
 * Set the SITE_URL environment variable at build time — that is how
 * .do/app.yaml supplies it, so going live is a platform setting rather
 * than a code change. The fallback exists only so local builds work
 * and is deliberately not treated as a real domain.
 */
const FALLBACK = 'https://spijiujitsu.com'

/** Never a trailing slash — every consumer appends its own path. */
export const SITE_URL = (process.env.SITE_URL || FALLBACK).replace(/\/+$/, '')

/** True while still on the fallback, so the build can say so out loud. */
export const SITE_URL_IS_PLACEHOLDER = !process.env.SITE_URL

/**
 * Whether search engines may index this build.
 *
 * Set SITE_NOINDEX=true for any deploy that isn't the final public
 * domain. A pre-launch build on a temporary URL that gets indexed
 * creates a duplicate of the site under a domain you'll later abandon,
 * and the canonical tag would be pointing somewhere you don't own.
 * Cheap to prevent, tedious to undo.
 */
export const ALLOW_INDEXING = process.env.SITE_NOINDEX !== 'true'
