/**
 * The one place the live domain is resolved.
 *
 * Consumed by vite.config.ts (which substitutes __SITE_URL__ in
 * index.html for the canonical link, Open Graph tags and JSON-LD) and
 * by scripts/seo.mjs (robots.txt, sitemap.xml).
 *
 * Set the SITE_URL environment variable at build time — that is how
 * .do/app.*.yaml supplies it, so going live is a platform setting
 * rather than a code change. The fallback exists only so local builds
 * work and is deliberately not treated as a real domain.
 */
const FALLBACK = 'https://spijiujitsu.com'

/** A bare origin: scheme, host, optional port. Nothing else. */
const SAFE_ORIGIN = /^https?:\/\/[a-z0-9.-]+(:\d+)?$/i

/**
 * Validates SITE_URL down to a bare origin, or fails the build.
 *
 * This value is interpolated straight into index.html — the canonical
 * link, four Open Graph tags and three JSON-LD fields. Unvalidated, a
 * value containing a quote escapes the href attribute and everything
 * after it is parsed as markup; a value containing a brace or bracket
 * silently corrupts the JSON-LD with no error at all. Verified: a
 * hostile value injected seven <script> tags into <head>.
 *
 * Reaching this requires build-environment access, which is already
 * privileged. It's fixed anyway because the accidental case — a pasted
 * URL with a stray character — is far more likely than the malicious
 * one, and fails silently in production.
 *
 * Throwing beats sanitising: a wrong canonical URL should stop the
 * build, not ship a quietly mangled one.
 */
function resolveSiteUrl(raw) {
  const trimmed = String(raw).trim().replace(/\/+$/, '')

  let parsed
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new Error(`SITE_URL is not a valid URL: ${JSON.stringify(raw)}`)
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`SITE_URL must be http or https, got ${parsed.protocol}`)
  }
  if (parsed.username || parsed.password) {
    throw new Error('SITE_URL must not contain credentials')
  }
  if (parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error(
      `SITE_URL must be a bare origin with no path, query or fragment — got ${trimmed}`,
    )
  }
  // Belt and braces: URL parsing is permissive about hosts, and this
  // string ends up inside HTML attributes.
  if (!SAFE_ORIGIN.test(parsed.origin)) {
    throw new Error(`SITE_URL resolved to an unexpected origin: ${parsed.origin}`)
  }

  return parsed.origin
}

/** Never a trailing slash — every consumer appends its own path. */
export const SITE_URL = resolveSiteUrl(process.env.SITE_URL || FALLBACK)

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
