import { beginnerClass, programSummaries } from '../data/classes'
import { SITE, smsHref } from '../data/site'
import { onAnchorClick } from '../lib/anchors'
import { Picture } from './Picture'

/**
 * What a woman who has never trained is actually weighing up, in the
 * order she weighs it: which class and when, what it costs to find
 * out, what happens to her on the night, and who is watching the room.
 *
 * Prose is the wrong shape for the first of those — a class name and a
 * time sitting in the middle of an argument reads as filler and pushes
 * the argument down the page. Facts go in the list; the paragraphs
 * keep only what has to persuade.
 *
 * Each line has to be something the gym can stand behind at the door.
 * "Empowering" as an adjective is what every gym writes; the value is
 * in saying the concrete thing instead.
 */
function assurances() {
  // Class and time come from the schedule, never written down here —
  // this is the one row that goes stale silently if it's typed out.
  const beginner = beginnerClass()
  const summary = programSummaries().find((p) => p.name === beginner?.name)

  return [
    summary && { label: 'The class', value: `${summary.name}, ${summary.days} at ${summary.time}.` },
    { label: 'First class', value: 'Free. Or sit and watch one instead.' },
    { label: 'Your pace', value: "You drill what you've been taught. You spar when you decide to." },
    { label: 'The room', value: `${SITE.instructor} coaches every class himself.` },
  ].filter((row) => row !== undefined)
}

export function Women() {
  const rows = assurances()

  return (
    <section
      id="women"
      aria-labelledby="women-heading"
      className="bg-deep border-hairline grid items-stretch border-t lg:grid-cols-[1.1fr_0.9fr]"
    >
      {/* Photo leads on mobile: the section above it ends in body copy,
          so there's no risk of two photographs stacking into one block
          — and the shot makes the argument faster than the paragraph
          under it does. Same absolute trick as the coach section at lg,
          so the row height comes from the copy rather than the frame. */}
      {/* Taller than the other section photos. This one is a near-square
          crop, and in the 240px letterbox the rest of the page uses, the
          raised hand — the only part of the frame that carries the
          point — falls outside the slot entirely. */}
      <div className="border-hairline relative h-[360px] sm:h-[520px] lg:h-auto lg:min-h-[480px] lg:border-r">
        <div className="h-full lg:absolute lg:inset-0">
          <Picture
            id="women-hand-raised"
            alt={`A ${SITE.name} competitor having her hand raised by the referee after winning her match at a tournament.`}
            sizes="(min-width: 1024px) 55vw, 100vw"
            // Weighted high: what the letterbox crops has to come off
            // the spectators at the bottom, never off the raised hand.
            position="center 15%"
          />
        </div>
      </div>

      <div className="flex flex-col justify-center gap-5 px-5 py-14 sm:px-8 lg:px-12 lg:py-[72px]">
        <span className="kicker text-amber self-start">Women on the mat</span>
        <h2 id="women-heading" className="font-display text-display-md m-0 font-extrabold uppercase">
          The art was built for you.
        </h2>

        <div className="text-muted flex max-w-[520px] flex-col gap-4 text-base leading-[1.7] sm:text-[17px]">
          <p className="m-0">
            Jiu jitsu assumes the other person is bigger and stronger than you — that's the problem
            it was built to solve. Leverage and position instead of strength. It's self-defense that
            holds up when the other person really is stronger: a real answer to being grabbed,
            pinned, or put on the ground.
          </p>
          <p className="m-0">
            Nobody is going to throw you in with the biggest guy in the room on your first night.
            You learn a position, you drill it with a partner, and you find out how hard you are to
            move.
          </p>
          <p className="m-0">
            That's one of ours in the photograph, getting her hand raised. She had a first night
            too.
          </p>
        </div>

        <dl className="border-amber m-0 flex flex-col gap-2.5 border-l-2 pl-[18px]">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-[14px]">
              <dt className="text-dim flex-none font-mono text-xs sm:w-[86px]">{row.label}</dt>
              <dd className="text-body m-0 text-base leading-[1.5]">{row.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-1.5 flex flex-col gap-2.5 sm:flex-row">
          <a
            href={smsHref}
            className="bg-amber text-midnight hover:bg-bone px-6 py-[15px] text-center text-[15px] font-bold transition-colors"
          >
            Text for a free class
          </a>
          <a
            href="#schedule"
            onClick={onAnchorClick}
            className="text-bone border-rule px-[22px] py-[14px] text-center text-[15px] font-bold transition-colors hover:bg-[#112039] border"
          >
            See the week
          </a>
        </div>
      </div>
    </section>
  )
}
