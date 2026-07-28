import { STATS } from '../data/site'

/**
 * "A room with a scoreboard" — season results.
 *
 * Gated behind SHOW_RECORD_BAND in data/site.ts, which is false.
 * The numbers below were never verified by the gym. Do not enable
 * this until real results arrive.
 */
export function RecordBand() {
  return (
    <section
      id="record"
      aria-labelledby="record-heading"
      className="bg-deep border-hairline flex flex-col gap-8 border-y px-5 py-14 sm:px-8 lg:px-12 lg:py-[72px]"
    >
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end sm:gap-12">
        <div className="flex max-w-[600px] flex-col gap-3">
          <span className="kicker text-amber">2026 season</span>
          <h2 id="record-heading" className="font-display text-display-sm m-0 font-extrabold uppercase">
            A room with a scoreboard
          </h2>
        </div>
        <blockquote className="border-amber m-0 max-w-[300px] border-l-2 pl-[22px]">
          <p className="font-display text-sand m-0 text-[29px] leading-[1.1] font-extrabold uppercase">
            "Train with people chasing something."
          </p>
          <footer className="text-dim mt-2.5 font-mono text-[11px] tracking-[0.1em] uppercase">
            Coach Trevino
          </footer>
        </blockquote>
      </div>

      <div className="bg-hairline border-hairline grid grid-cols-2 gap-px border lg:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="bg-midnight flex flex-col gap-2 px-[26px] py-7">
            <span className="font-display text-amber text-[48px] leading-none font-extrabold lg:text-[62px]">
              {stat.n}
            </span>
            <span className="text-sand font-mono text-[11px] tracking-[0.1em] uppercase">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
