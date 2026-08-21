import { SITE } from '../data/site'
import { Picture } from './Picture'

/** Spelled-out numerals read better than digits in running copy. */
const NUMBER_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
  'nineteen', 'twenty',
]

const spell = (n: number) => NUMBER_WORDS[n] ?? String(n)

/**
 * All three rows render identically. The handoff set the two names in
 * uppercase display type and left the middle row as plain sentence
 * copy, which made a three-line list read as two shouted headlines
 * with a caption wedged between them.
 */
const LINEAGE = [
  { label: 'Started', value: 'Professor Joseph Cantu' },
  { label: 'Promoted', value: 'Purple belt under Professor Cantu' },
  { label: 'Now', value: 'Professor Carlos Henriquez' },
] as const

export function Coach() {
  return (
    <section
      id="coach"
      aria-labelledby="coach-heading"
      // The hairline matters most below lg, where this section's photo
      // stacks directly under the kids photo — two bright frames with
      // nothing between them reads as one confused image.
      className="bg-brand border-hairline grid items-stretch border-t lg:grid-cols-[0.9fr_1.1fr]"
    >
      {/* At lg the photo is taken out of flow so the row height comes
          from the text alone. Left in flow it contributes its own
          intrinsic height, which on a wide screen inflated the panel
          to 740px and stranded the copy in 200px of empty blue above
          and below it. */}
      {/*
        order-2 below lg. Stacked, this photo would land immediately
        under the kids photo from the section above — measured at
        1px apart across the full width, which read as one 520px block
        of photography rather than two sections. Dropping it below the
        copy puts the blue text panel between them. At lg the columns
        sit side by side and the original left-hand position returns.
      */}
      <div className="relative order-2 h-[280px] sm:h-[360px] lg:order-1 lg:h-auto lg:min-h-[470px]">
        <div className="h-full lg:absolute lg:inset-0">
          <Picture
            id="coach-thomas"
            alt={`${SITE.instructor} coaching one of his students from the corner at a tournament.`}
            sizes="(min-width: 1024px) 45vw, 100vw"
            position="center 30%"
          />
        </div>
      </div>

      <div className="order-1 flex flex-col justify-center gap-5 px-5 py-14 sm:px-8 lg:order-2 lg:px-12 lg:py-[72px]">
        <span className="kicker text-amber-on-blue">Head instructor</span>
        <h2 id="coach-heading" className="font-display text-display-md m-0 font-extrabold uppercase">
          {SITE.instructor}
        </h2>
        {/*
          The years are counted from SITE.instructorSince rather than
          written down, so the line can't quietly go stale. Same
          suppressHydrationWarning reasoning as the footer copyright:
          the prerender bakes the build year and the browser corrects
          it, which only ever differ across a New Year.
        */}
        <div
          className="text-on-blue-body flex max-w-[520px] flex-col gap-4 text-[17px] leading-[1.7] sm:text-lg"
          suppressHydrationWarning
        >
          {/* "One class" deliberately, not "for a day" — his origin is
              the same offer the whole page is making the reader, and
              the closing line lands it. */}
          <p className="m-0">
            {/* ", and" rather than a dash: the spelled year is lowercase,
                so a full stop here would start a sentence with "six". */}
            He came in to try one class in {SITE.instructorSince} and never left, and{' '}
            {spell(new Date().getFullYear() - SITE.instructorSince)} years later he's a purple belt
            with a team of his own, still teaching every class on the schedule himself.
          </p>
          <p className="m-0">
            What he's building now is a room that competes. It starts the way his did: one class.
          </p>
        </div>

        <div className="border-amber flex flex-col gap-3 border-l-2 pl-[18px]">
          <h3 className="kicker text-amber-on-blue m-0">Lineage</h3>
          <dl className="m-0 flex flex-col gap-2.5">
            {LINEAGE.map((row) => (
              <div key={row.label} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-[14px]">
                <dt className="text-on-blue flex-none font-mono text-xs sm:w-[70px]">{row.label}</dt>
                <dd className="text-bone m-0 text-base leading-[1.5] font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
