import { useEffect } from 'react'
import { initAnalytics, track } from '../lib/analytics'

/**
 * Everything that can be measured without touching a component.
 *
 * Clicks are caught by one delegated listener on `document` rather than
 * by handlers on each button, and a CTA's reported location is derived
 * from its nearest `section[id]`. That means a button added anywhere on
 * this page is instrumented the moment it exists — no one has to
 * remember to tag it, which is how every hand-tagged analytics
 * implementation eventually rots.
 *
 * Sections and scroll depth are observed the same way: from the DOM as
 * it actually is, not from a list that has to be kept in sync with it.
 */

/**
 * Where on the page an element sits, for `cta_location`/`nav_source`.
 *
 * An explicit `data-analytics-location` wins, for the handful of places
 * the DOM can't name usefully — the sticky bar, the mobile menu, and
 * the two sections that carry no id.
 */
function locationOf(el: Element): string {
  const explicit = el.closest('[data-analytics-location]')
  if (explicit) return explicit.getAttribute('data-analytics-location') || 'unknown'

  const section = el.closest('section[id]')
  if (section?.id) return section.id

  // `nav` is deliberately absent: closest() returns the *innermost*
  // match, so including it reported every header link as "nav", which
  // names nothing. Falling through to header/footer is what's useful.
  const region = el.closest('header, footer, aside')
  return region ? region.tagName.toLowerCase() : 'page'
}

/** Group outbound links by where they go, not by raw URL. */
function destinationOf(href: string): string {
  try {
    const url = new URL(href)
    const host = url.hostname.replace(/^www\./, '')
    if (host === 'google.com' || host.endsWith('.google.com')) {
      // Directions is a materially different signal from a profile
      // click: one is "how do I get there", the other "who are they".
      return url.pathname.includes('/maps/dir') ? 'directions' : 'google_profile'
    }
    if (host.endsWith('instagram.com')) return 'instagram'
    if (host.endsWith('facebook.com')) return 'facebook'
    if (host.endsWith('unitedbjjteam.com')) return 'affiliate'
    return host
  } catch {
    return 'unknown'
  }
}

function onDocumentClick(event: Event): void {
  const target = event.target
  if (!(target instanceof Element)) return
  const link = target.closest('a[href]')
  if (!link) return

  const href = link.getAttribute('href') ?? ''
  const label = (link.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 80)

  // The conversion. `sms:` and `tel:` are the only ways to reach the
  // gym from this site, so every one of them is the goal event.
  if (href.startsWith('sms:') || href.startsWith('tel:')) {
    track('cta_text_click', {
      cta_location: locationOf(link),
      cta_label: label,
      link_type: href.startsWith('sms:') ? 'sms' : 'tel',
    })
    return
  }

  if (href.startsWith('#')) {
    track('nav_click', { nav_target: href.slice(1), nav_source: locationOf(link) })
    return
  }

  if (/^https?:/i.test(href)) {
    track('outbound_click', { destination: destinationOf(href), outbound_url: href })
  }
}

/**
 * Fires once per section, the first time it crosses the middle half of
 * the viewport.
 *
 * The negative rootMargin is what makes this work for sections both
 * taller and shorter than the screen: a ratio threshold never trips for
 * a section taller than the viewport, and trips instantly for a short
 * one scrolling past the edge. "Overlapped the middle" is a much better
 * proxy for "was actually looked at".
 */
function observeSections(): () => void {
  const sections = [...document.querySelectorAll<HTMLElement>('main section')]
  const seen = new Set<string>()

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const el = entry.target as HTMLElement
        // Explicit name wins over the id, same precedence as
        // locationOf — the hero's id is "top", which names an anchor
        // target rather than anything useful in a report.
        const id = el.dataset.analyticsLocation || el.id || ''
        if (!id || seen.has(id)) continue
        seen.add(id)
        track('section_view', { section_id: id, section_index: sections.indexOf(el) + 1 })
        observer.unobserve(el)
      }
    },
    { rootMargin: '-25% 0px -25% 0px', threshold: 0 },
  )

  for (const section of sections) observer.observe(section)
  return () => observer.disconnect()
}

/** Quartiles, once each. GA4's own scroll event only reports 90%. */
function observeScrollDepth(signal: AbortSignal): void {
  const marks = [25, 50, 75, 100]
  const fired = new Set<number>()
  let frame = 0

  const measure = () => {
    frame = 0
    const scrollable = document.documentElement.scrollHeight - window.innerHeight
    const percent =
      scrollable <= 0 ? 100 : Math.min(100, Math.round((window.scrollY / scrollable) * 100))
    for (const mark of marks) {
      if (percent >= mark && !fired.has(mark)) {
        fired.add(mark)
        track('scroll_depth', { percent: mark })
      }
    }
  }

  const onScroll = () => {
    frame ||= requestAnimationFrame(measure)
  }

  window.addEventListener('scroll', onScroll, { passive: true, signal })
  signal.addEventListener('abort', () => frame && cancelAnimationFrame(frame))
}

export function useAnalytics(): void {
  useEffect(() => {
    initAnalytics()

    const controller = new AbortController()
    // Capture phase: the in-page anchor handler calls preventDefault,
    // and a future one might stop propagation. Measuring shouldn't
    // depend on nobody ever doing that.
    document.addEventListener('click', onDocumentClick, {
      capture: true,
      signal: controller.signal,
    })
    observeScrollDepth(controller.signal)
    const stopSections = observeSections()

    return () => {
      controller.abort()
      stopSections()
    }
  }, [])
}
