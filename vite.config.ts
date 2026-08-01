import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { ALLOW_INDEXING, GA_MEASUREMENT_ID, SITE_URL } from './site.config.js'

/**
 * Substitutes __SITE_URL__ in index.html.
 *
 * The canonical link, four Open Graph tags and three JSON-LD fields
 * all need the live domain. Hard-coded, that's eight places to
 * remember on launch day and eight chances to ship a placeholder to
 * production. This makes site.config.js the only place it's written.
 */
function siteUrl(): Plugin {
  return {
    name: 'spi-site-url',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => {
        const out = html.replaceAll('__SITE_URL__', SITE_URL)
        if (ALLOW_INDEXING) return out
        // Belt and braces with robots.txt: a disallowed page can still
        // be indexed if something links to it, but a noindex meta on
        // the page itself keeps it out of results.
        return out.replace(
          '<head>',
          '<head>\n    <meta name="robots" content="noindex, nofollow" />',
        )
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), siteUrl()],
  /*
   * The same origin, available to the React tree.
   *
   * The structured data moved out of index.html and into
   * src/components/StructuredData.tsx so it can be derived from
   * classes.ts and site.ts instead of hand-copied. That component needs
   * the live origin for its @id values, and site.config.js is a build
   * file — this is the bridge. Still one source: site.config.js.
   */
  define: {
    __SPI_SITE_URL__: JSON.stringify(SITE_URL),
    // '' when unset, which switches the tag off entirely. See
    // src/lib/analytics.ts and docs/measurement-plan.md.
    __SPI_GA_ID__: JSON.stringify(GA_MEASUREMENT_ID),
  },
  server: {
    // Pinned so the local URL is stable. 5173 is taken by another
    // project on this machine.
    port: 5183,
    // --host also exposes it on the LAN for phone testing.
  },
  preview: {
    port: 5183,
  },
  build: {
    // The whole site is one page — no route splitting to gain anything from.
    cssCodeSplit: false,
  },
})
