import { Fragment } from 'react'
import { openDaysSummary, programSummaries, uniformSummary } from '../data/classes'
import { directionsHref, placeHref, SITE, smsHref } from '../data/site'

/**
 * Small labelled link out to Google Maps.
 *
 * The 44px hit area sits on the anchor and the rule on the inner span,
 * so the target is big enough to tap without the underline drifting
 * away from the text.
 */
function MapLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sand hover:text-bone inline-flex min-h-11 items-center font-mono text-xs transition-colors"
    >
      <span className="border-b border-[#3a4a66] pb-0.5">{children}</span>
    </a>
  )
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-midnight flex flex-col gap-2 px-6 py-7 sm:px-8 sm:py-[30px]">
      <h3 className="text-amber m-0 font-mono text-[11px] font-normal tracking-[0.12em] uppercase">
        {label}
      </h3>
      {children}
    </div>
  )
}

export function VisitStrip() {
  return (
    <section
      id="visit"
      aria-label="Visit us"
      // Four across only from xl. At lg each cell had 191px of usable
      // width, which broke the address onto three lines and the hours
      // onto two apiece — it read as damaged rather than dense.
      className="bg-hairline border-hairline grid grid-cols-1 gap-px border-t sm:grid-cols-2 xl:grid-cols-4"
    >
      <Cell label="Where">
        {/*
          The address is plain text. It used to be the link to the
          Google Business Profile, which meant the profile was only
          reachable by clicking something that looked like a heading —
          an affordance nobody finds, and one that hover can't hint at
          on a touch screen. Both destinations are now labelled links.
        */}
        <address className="font-display text-[26px] leading-[1.15] font-extrabold uppercase not-italic">
          {SITE.street}
          <br />
          {SITE.city}, {SITE.state} {SITE.zip}
        </address>
        <div className="flex flex-wrap items-center gap-x-5">
          <MapLink href={directionsHref}>Get directions →</MapLink>
          <MapLink href={placeHref}>Reviews &amp; photos →</MapLink>
        </div>
      </Cell>

      <Cell label="Hours">
        {/* Derived, not written out. Hand-keyed hours drift from the
            schedule section the moment classes.ts changes, and this is
            the cell people screenshot. */}
        <p className="text-body m-0 font-mono text-sm leading-[1.9]">
          {programSummaries().map((p) => (
            <Fragment key={p.name}>
              {p.name} {p.time}
              <br />
            </Fragment>
          ))}
          {openDaysSummary()}
        </p>
        <p className="text-dim m-0 font-mono text-xs">{uniformSummary()}</p>
      </Cell>

      <Cell label="Parking">
        <p className="text-body m-0 font-mono text-sm leading-[1.9]">Free parking out front</p>
      </Cell>

      <Cell label="Questions">
        <a
          href={smsHref}
          className="font-display text-bone hover:text-amber flex min-h-11 items-center text-[28px] leading-[1.1] font-extrabold uppercase transition-colors sm:text-[31px]"
        >
          {SITE.phone}
        </a>
        <p className="text-dim m-0 font-mono text-xs">
          Text or call — {SITE.instructor.split(' ')[0]} answers
        </p>
      </Cell>
    </section>
  )
}
