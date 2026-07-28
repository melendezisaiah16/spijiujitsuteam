import { classMeta, TRACK_COLOR, uniformFor, type ClassSession } from '../data/classes'

/**
 * One class in the day's list.
 *
 * Informational only — no per-row CTA. A control on every time slot
 * made the schedule read as a booking form; the single "Text to claim
 * any class" panel in the rail carries the conversion instead.
 */
export function ClassRow({ session }: { session: ClassSession }) {
  const hero = session.beginner

  return (
    <div
      className={`flex flex-col gap-1 border p-5 sm:flex-row sm:items-center sm:gap-[26px] sm:px-[26px] sm:py-6 ${
        hero ? 'bg-brand border-brand' : 'border-hairline bg-transparent'
      }`}
      style={{ borderLeft: `5px solid ${TRACK_COLOR[session.track]}` }}
    >
      <span
        className={`font-display text-class-time font-extrabold sm:w-[150px] ${
          hero ? 'text-bone' : session.track === 'kids' ? 'text-sand' : 'text-time-blue'
        }`}
      >
        {session.time}
      </span>
      <span className="flex flex-col gap-[5px]">
        <span
          className={`font-display text-class-name font-extrabold uppercase ${
            hero ? 'text-bone' : 'text-body'
          }`}
        >
          {session.name}
        </span>
        <span
          className={`font-mono text-[11px] tracking-[0.1em] uppercase ${
            hero ? 'text-on-blue' : 'text-dim'
          }`}
        >
          {hero ? `Beginners welcome · ${uniformFor(session.day)}` : classMeta(session)}
        </span>
      </span>
    </div>
  )
}
