import { faqItems } from '../data/faq'
import { SITE, smsHref } from '../data/site'
import { track } from '../lib/analytics'

/**
 * Common questions, as a native disclosure accordion.
 *
 * `<details>`/`<summary>` rather than a JS accordion. It is keyboard
 * operable, exposes disclosure semantics to screen readers, survives a
 * failed JS bundle, and needs no state — everything a hand-rolled
 * version would have to reimplement and usually gets wrong.
 *
 * An earlier version of this section deliberately avoided collapsing,
 * on the theory that hidden answers are worth less to search. That was
 * over-cautious: collapsed `<details>` content is present in the DOM
 * and in the prerendered HTML, which is what crawlers and AI fetchers
 * read — the `structured data` spec asserts exactly that by matching
 * every marked-up answer against this section's textContent. Seven
 * stacked paragraphs cost more in scanning than they ever won.
 *
 * The first item opens by default so the section reads as content
 * rather than as a row of closed bars.
 *
 * The matching FAQPage markup is built from this same `faqItems()`
 * array in StructuredData.tsx. Marking up a question that isn't
 * visible on the page is a structured-data violation, so the two must
 * not be allowed to diverge.
 */
export function Faq() {
  const items = faqItems()

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="border-hairline grid items-start gap-8 border-t px-5 py-14 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:px-12 lg:py-[72px]"
    >
      <div className="flex flex-col gap-5">
        <span className="kicker text-amber self-start">Before you come</span>
        <h2 id="faq-heading" className="font-display text-display-sm m-0 font-extrabold uppercase">
          Common questions.
        </h2>
        <p className="text-muted m-0 max-w-[360px] text-base leading-[1.65]">
          Anything not answered here — text {SITE.phone} and{' '}
          {SITE.instructor.split(' ')[0]} will answer it himself.
        </p>
        {/* Held out of the mobile flow: below lg this column stacks
            above the questions, and a CTA before the content it's
            meant to follow asks for the sale too early. */}
        <a
          href={smsHref}
          className="bg-amber text-midnight hover:bg-bone mt-1.5 hidden self-start px-6 py-[15px] text-center text-[15px] font-bold transition-colors lg:block"
        >
          Text for a free class
        </a>
      </div>

      <div className="flex flex-col">
        {items.map((item, i) => (
          <details
            key={item.q}
            open={i === 0}
            className="group border-hairline border-b first:border-t"
          >
            {/* list-none plus the webkit pseudo-element: Safari and
                Firefox each need a different one to drop the default
                triangle, and neither alone is enough. */}
            {/*
              Measured from the summary's click, not the <details>
              toggle event. `toggle` reports "state changed", which
              includes the one hydration fires for the item that starts
              open — so every session logged an open nobody performed,
              and question one would have looked permanently the most
              asked. A click is a person. Keyboard is covered too:
              <summary> synthesises a click for Enter and Space.

              `open` is still the pre-toggle value inside a click
              handler, so false here means "about to open".
            */}
            <summary
              onClick={(event) => {
                const details = event.currentTarget.closest('details')
                if (details && !details.open) track('faq_open', { faq_question: item.q })
              }}
              className="flex cursor-pointer list-none items-start justify-between gap-6 py-[18px] [&::-webkit-details-marker]:hidden"
            >
              <h3 className="font-display text-bone m-0 text-[20px] leading-[1.2] font-extrabold uppercase sm:text-[23px]">
                {item.q}
              </h3>
              {/* A plus that becomes a cross. Purely decorative — the
                  expanded state is already announced by <details>. */}
              <span
                aria-hidden="true"
                className="text-amber relative top-px flex size-6 flex-none items-center justify-center text-[26px] leading-none font-light transition-transform duration-200 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="text-muted m-0 max-w-[62ch] pb-[22px] text-base leading-[1.7]">
              {item.a}
            </p>
          </details>
        ))}

        <a
          href={smsHref}
          className="bg-amber text-midnight hover:bg-bone mt-8 self-start px-6 py-[15px] text-center text-[15px] font-bold transition-colors lg:hidden"
        >
          Text for a free class
        </a>
      </div>
    </section>
  )
}
