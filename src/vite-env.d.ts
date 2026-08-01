/// <reference types="vite/client" />

/**
 * The live origin, substituted at build time by the `define` in
 * vite.config.ts, which reads it from site.config.js. Never a trailing
 * slash — every consumer appends its own path.
 */
declare const __SPI_SITE_URL__: string

/**
 * The GA4 measurement ID, or '' when analytics are switched off.
 * Substituted at build time from the GA_MEASUREMENT_ID env var.
 */
declare const __SPI_GA_ID__: string
