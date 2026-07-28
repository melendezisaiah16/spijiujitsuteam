import { Fragment } from 'react'
import { openDaysSummary, programSummaries, uniformSummary } from '../data/classes'
import { directionsHref, placeHref, SITE, smsHref } from '../data/site'

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
        <address className="not-italic">
          <a
            href={placeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display hover:text-amber text-[26px] leading-[1.15] font-extrabold uppercase transition-colors"
          >
            {SITE.street}
            <br />
            {SITE.city}, {SITE.state} {SITE.zip}
          </a>
        </address>
        <a
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          // Hit area on the anchor, rule on the inner span, so the
          // target reaches 44px without the underline drifting away
          // from the text.
          className="text-sand hover:text-bone inline-flex min-h-11 items-center self-start font-mono text-xs transition-colors"
        >
          <span className="border-b border-[#3a4a66] pb-0.5">Get directions →</span>
        </a>
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
