import { SITE, smsHref } from '../data/site'


export function Closer() {
  return (
    <section
      // No id — it isn't an anchor target — so it needs naming for
      // reports, and this is the last CTA before the footer.
      data-analytics-location="closer"
      className="bg-deep flex flex-col items-center gap-5 px-5 py-16 text-center sm:px-8 lg:px-12 lg:py-[84px]"
    >
      {/* The school's tagline. Sand rather than amber — amber is
          reserved for the free-class signal. */}
      <p className="text-sand m-0 flex items-center gap-3 font-mono text-[11px] tracking-[0.28em] uppercase sm:gap-4">
        <span aria-hidden="true" className="bg-sand/40 block h-px w-8 sm:w-12" />
        {SITE.tagline}
        <span aria-hidden="true" className="bg-sand/40 block h-px w-8 sm:w-12" />
      </p>
      <h2 className="font-display text-display-xl m-0 font-extrabold uppercase">
        Your first class
        <br />
        is on us.
      </h2>
      <a
        href={smsHref}
        className="bg-amber text-midnight hover:bg-bone mt-1.5 flex flex-col gap-1 px-8 py-5 transition-colors lg:px-[34px]"
      >
        <span className="font-mono text-[11px] tracking-[0.12em] uppercase opacity-75">
          Text us — free trial class
        </span>
        <span className="font-display text-phone-lg font-extrabold">{SITE.phone}</span>
      </a>
    </section>
  )
}
