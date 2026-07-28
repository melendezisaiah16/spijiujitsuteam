import { SITE, smsHref } from '../data/site'

/**
 * Sticky conversion bar, phones only. Texting the gym is the single
 * job of this site, so on the device most visitors arrive with, the
 * action is never more than a thumb away.
 *
 * The matching bottom padding that keeps this off the footer lives
 * on the page wrapper in App.tsx.
 */
export function MobileCtaBar() {
  return (
    <div
      data-sticky-cta
      className="border-hairline bg-deep/95 fixed inset-x-0 bottom-0 z-50 border-t px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden"
    >
      <a
        href={smsHref}
        className="bg-amber text-midnight flex min-h-12 items-center justify-center gap-2.5 px-4 text-[15px] font-bold"
      >
        <span>Text for a free class</span>
        <span className="font-mono text-xs opacity-70">{SITE.phone}</span>
      </a>
    </div>
  )
}
