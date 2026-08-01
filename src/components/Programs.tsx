import { smsHref } from '../data/site'
import { Picture, type ImageId } from './Picture'

interface ProgramCardProps {
  title: string
  sub: string
  /**
   * What the program is like. Deliberately not a timetable — the full
   * schedule sits directly above this section, and repeating it here
   * made the two sections read as the same content twice.
   */
  body: string
  photo: ImageId
  photoAlt: string
  /** object-position for the 220px letterbox crop. */
  photoPosition?: string
  /** Sand-topped kids card inverts to dark text. */
  tone: 'blue' | 'sand'
}

function ProgramCard({ title, sub, body, photo, photoAlt, photoPosition, tone }: ProgramCardProps) {
  const blue = tone === 'blue'

  return (
    <div className={`flex flex-col border ${blue ? 'border-brand' : 'border-sand'}`}>
      {/* Grows on wide screens. Fixed at 220px the card photo became a
          5.5:1 sliver once the card passed ~1200px. */}
      <div className="h-[220px] xl:h-[260px] 2xl:h-[300px]">
        <Picture
          id={photo}
          alt={photoAlt}
          sizes="(min-width: 1024px) 45vw, 100vw"
          position={photoPosition}
        />
      </div>

      <div
        className={`flex flex-col justify-between gap-4 px-5 py-5 sm:flex-row sm:items-end sm:gap-5 sm:px-[26px] sm:py-[22px] ${
          blue ? 'bg-brand' : 'bg-sand text-midnight'
        }`}
      >
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-card-title m-0 font-extrabold uppercase">{title}</h3>
          <span
            className={`font-mono text-[11px] tracking-[0.1em] uppercase ${
              blue ? 'text-on-blue' : 'text-on-sand'
            }`}
          >
            {sub}
          </span>
        </div>
        <a
          href={smsHref}
          className={`font-display px-[19px] py-[13px] text-center text-xl font-extrabold whitespace-nowrap uppercase transition-colors ${
            blue
              ? 'bg-amber text-midnight hover:bg-bone focus-visible:outline-bone'
              : 'bg-midnight text-sand hover:bg-brand hover:text-bone focus-visible:outline-midnight'
          }`}
        >
          Try free
          <span className="sr-only"> — {title}</span>
        </a>
      </div>

      <div className="px-5 pt-5 pb-6 sm:px-[26px] sm:pb-[26px]">
        {/* Capped by character count, not pixels. Uncapped this ran to
            107 characters per line at 1920 and 147 at 2560 — well past
            the ~75 where the eye starts losing its place between
            lines. Below ~1400 the card is narrower than the cap, so
            nothing changes there. */}
        <p className="text-muted m-0 max-w-[68ch] text-base leading-[1.65]">{body}</p>
      </div>
    </div>
  )
}

export function Programs() {
  return (
    <section
      id="programs"
      aria-labelledby="programs-heading"
      className="flex flex-col gap-7 px-5 py-14 sm:px-8 lg:px-12 lg:py-[72px]"
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end sm:gap-12">
        <h2
          id="programs-heading"
          className="font-display text-display-sm m-0 font-extrabold uppercase"
        >
          Find your class.
        </h2>
        <p className="text-muted m-0 max-w-[340px] text-base leading-[1.65]">
          Two programs — teens and adults, and kids. Both start with a free class.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProgramCard
          tone="blue"
          title="Teens & adults"
          sub="13+ · no experience needed"
          photo="adults-training"
          photoAlt="Adults drilling in gi on the mat during an evening class."
          body="Complete beginners, people training a couple of nights a week to stay sharp, and competitors all work from the same class toward their own goals. Teens move up from about thirteen, depending on their size — text us and we'll tell you which one fits. Turn up any night."
        />
        <ProgramCard
          tone="sand"
          title="Kids"
          sub="Ages 4–12 · grouped by age"
          photo="kids-class"
          // "their coach", singular: the card's letterbox trims the two
          // adults standing at the ends of the line at most widths, so
          // only the coach kneeling in the middle is reliably in frame.
          photoAlt="The SPI Jiu Jitsu kids class lined up across the mat with their coach."
          body="Little Ninjas is where four to six-year-olds start — the very basics, and the balance, focus and confidence that come with them. They're growing up as much as they're learning a martial art. From seven, Big Kids goes properly into the art itself, until they're ready to move up with the teens and adults."
        />
      </div>
    </section>
  )
}
