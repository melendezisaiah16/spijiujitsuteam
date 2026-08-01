/**
 * GA4, loaded by hand rather than by package.
 *
 * Exactly three packages reach the browser — react, react-dom and
 * scheduler — and that is a documented property of this build. A GA
 * wrapper would break it to save forty lines, so this is the official
 * gtag.js snippet, typed, with a loader that protects the LCP.
 *
 * Two behaviours worth knowing before reading the code:
 *
 * 1. `track()` always records into `window.dataLayer`, whether or not a
 *    measurement ID exists. Without one, gtag.js is never fetched, so
 *    the array is an inert log that leaves the browser — the
 *    instrumentation stays fully testable on a dev build that reports
 *    nothing to anyone.
 *
 * 2. The tag is deferred until the browser goes idle, or until the
 *    first real interaction, whichever lands first. LCP here was
 *    measured at 2292 ms on Fast 3G with the hero photo as the LCP
 *    element; a 90 KB tag fetched eagerly competes for bandwidth on
 *    exactly the connections least able to spare it. The cost is that
 *    someone who leaves inside a second or two is never counted. That
 *    trade is deliberate and is written up in docs/measurement-plan.md
 *    under "What this data cannot tell you" — sessions read a little
 *    low, engagement quality reads a little high.
 */

/** Injected by vite.config.ts. '' means analytics are off. */
const MEASUREMENT_ID = __SPI_GA_ID__

export type EventParams = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    dataLayer?: unknown[]
  }
}

/**
 * The canonical gtag shim.
 *
 * It pushes `arguments`, not the rest array — gtag.js reads dataLayer
 * entries as the arguments objects its own snippet produces, and this
 * is not the place to be clever about a documented wire format.
 */
function gtag(..._args: unknown[]): void {
  ;(window.dataLayer ??= []).push(arguments)
}

let primed = false
let scheduled = false
let fetched = false

/**
 * Consent Mode v2 defaults, pushed before the tag loads so they apply
 * to the very first hit.
 *
 * Every advertising signal is denied and only analytics storage is
 * granted: the privacy-forward default, and the reason this site needs
 * no cookie banner today. It stops being purely a technical decision
 * the moment the gym runs Google Ads or takes real EU traffic.
 */
function prime(): void {
  if (primed) return
  primed = true
  window.dataLayer ??= []
  if (!MEASUREMENT_ID) return

  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted',
    functionality_storage: 'granted',
    security_storage: 'granted',
  })
  gtag('js', new Date())
  gtag('config', MEASUREMENT_ID)
}

function fetchTag(): void {
  if (fetched || !MEASUREMENT_ID) return
  fetched = true
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  document.head.appendChild(script)
}

/**
 * Arms the loader. Safe to call more than once; safe during SSR.
 */
export function initAnalytics(): void {
  if (typeof window === 'undefined' || scheduled) return
  prime()
  if (!MEASUREMENT_ID) return
  scheduled = true

  // One controller so that whichever trigger wins detaches the others.
  const controller = new AbortController()
  const start = () => {
    controller.abort()
    fetchTag()
  }

  // A `'requestIdleCallback' in window` guard narrows `window` itself
  // to never in the else branch, since the DOM lib declares it. Test
  // the property, not the object.
  const whenIdle = () => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(start, { timeout: 3000 })
    } else {
      window.setTimeout(start, 1500)
    }
  }

  // `load` has already fired if React hydrated late — addEventListener
  // would then wait forever.
  if (document.readyState === 'complete') whenIdle()
  else window.addEventListener('load', whenIdle, { signal: controller.signal })

  // Anyone who interacts is worth counting immediately, idle or not.
  for (const type of ['pointerdown', 'keydown', 'touchstart'] as const) {
    window.addEventListener(type, start, { signal: controller.signal, passive: true })
  }
}

/**
 * Record an event. No-ops during SSR, inert without a measurement ID.
 *
 * Never pass anything that identifies a person. Names, phone numbers
 * and email addresses in GA are a Terms of Service violation and get
 * properties deleted, not warned.
 */
export function track(name: string, params: EventParams = {}): void {
  if (typeof window === 'undefined') return
  window.dataLayer ??= []
  gtag('event', name, params)
}
