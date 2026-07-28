import { useEffect, type MouseEvent } from 'react'

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Drop `#section` from the address bar without touching history. */
function stripHash() {
  if (!window.location.hash) return
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
}

/**
 * Click handler for in-page anchors that scrolls without leaving a
 * `#fragment` in the URL.
 *
 * Native fragment navigation does three things we have to reproduce by
 * hand once `preventDefault` is called: it scrolls (respecting
 * `scroll-padding-top`), it moves focus into the target so keyboard and
 * screen-reader users follow the jump, and it honours reduced-motion.
 * Miss the focus move and the page becomes a keyboard trap where the
 * view jumps but tab order doesn't.
 *
 * Modified clicks — new tab, new window, middle click — are left alone.
 */
export function onAnchorClick(e: MouseEvent<HTMLAnchorElement>) {
  if (e.defaultPrevented || e.button !== 0) return
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

  const href = e.currentTarget.getAttribute('href')
  if (!href?.startsWith('#')) return

  const target = document.getElementById(href.slice(1))
  if (!target) return

  e.preventDefault()

  target.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block: 'start',
  })

  // Sections aren't focusable on their own; make this one focusable
  // just long enough to receive focus, then put the DOM back.
  target.setAttribute('tabindex', '-1')
  target.focus({ preventScroll: true })
  target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true })

  stripHash()
}

/**
 * Clears a `#fragment` a visitor arrived with — an old shared link, or
 * a browser restoring the last position. Deferred a frame so the
 * browser has already scrolled: the jump still happens, only the URL
 * is tidied.
 */
export function useCleanInitialHash() {
  useEffect(() => {
    const frame = requestAnimationFrame(stripHash)
    // A fragment arriving on an already-loaded page is a same-document
    // navigation: React never remounts, so the mount effect alone
    // wouldn't catch it.
    window.addEventListener('hashchange', stripHash)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('hashchange', stripHash)
    }
  }, [])
}
