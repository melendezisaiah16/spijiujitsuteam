import { smsHref } from '../data/site'
import { onAnchorClick } from '../lib/anchors'
import { Picture } from './Picture'

export function Kids() {
  return (
    <section
      id="kids"
      aria-labelledby="kids-heading"
      // Top hairline so the bright photo has a defined edge against
      // the dark section above it, matching the coach section below.
      className="border-hairline grid items-stretch border-t lg:grid-cols-2"
    >
      <div className="flex flex-col justify-center gap-5 px-5 py-14 sm:px-8 lg:px-12 lg:py-[72px]">
        <span className="kicker bg-sand text-midnight self-start px-[11px] py-[7px]">
          Little Ninjas &amp; Kids · ages 4–15
        </span>
        <h2 id="kids-heading" className="font-display text-display-md m-0 font-extrabold uppercase">
          Confidence they can't be talked out of.
        </h2>
        <p className="text-muted m-0 max-w-[460px] text-base leading-[1.65] sm:text-[17px]">
          No striking, no yelling. They learn to stay calm when something is hard and to look
          after a training partner. Parents are welcome mat-side, every class.
        </p>
        <div className="mt-1.5 flex flex-col gap-2.5 sm:flex-row">
          <a
            href={smsHref}
            className="bg-amber text-midnight hover:bg-bone px-6 py-[15px] text-center text-[15px] font-bold transition-colors"
          >
            Text about kids classes
          </a>
          <a
            href="#schedule"
            onClick={onAnchorClick}
            className="text-bone px-[22px] py-[14px] text-center text-[15px] font-bold transition-colors hover:bg-[#112039] border border-[#3a4a66]"
          >
            Kids class times
          </a>
        </div>
      </div>

      {/* Definite height below lg. With only a min-height the img
          falls back to its intrinsic aspect ratio, and this frame has
          a lot of empty floor in it — the class ends up a thin strip
          in the middle of a tall box. */}
      {/* Same as the coach section: absolute at lg so the photo fills
          the row without dictating its height. */}
      <div className="border-hairline relative h-[240px] sm:h-[320px] lg:h-auto lg:min-h-[460px] lg:border-l">
        <div className="h-full lg:absolute lg:inset-0">
          <Picture
            id="kids-class"
            alt="The SPI Jiu Jitsu kids class lined up on the mat with their coaches."
            sizes="(min-width: 1024px) 50vw, 100vw"
            position="center 35%"
          />
        </div>
      </div>
    </section>
  )
}
