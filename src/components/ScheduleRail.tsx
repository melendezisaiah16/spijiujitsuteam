import { SITE, smsHref } from '../data/site'
import type { DaySummary } from '../hooks/useSchedule'

/**
 * The three-panel rail beside the class list.
 *
 * The amber panel leads with gi vs no-gi, because that's the one thing
 * that genuinely changes from night to night — and the only thing here
 * a visitor can't already read off the class list to its left.
 */
export function ScheduleRail({ summary }: { summary: DaySummary }) {
  return (
    <aside
      aria-label="What to expect"
      // Distinguishes the rail's phone panel from anything else in the
      // schedule section — it's the only CTA in there, and worth
      // knowing about separately.
      data-analytics-location="schedule_rail"
      className="bg-hairline border-hairline flex flex-col gap-px border"
    >
      <div className="bg-amber text-midnight flex flex-col gap-[7px] px-6 py-[22px]">
        <span className="font-mono text-[11px] tracking-[0.14em] uppercase opacity-75">
          {summary.when}
        </span>
        <span className="font-display text-[32px] leading-none font-extrabold uppercase sm:text-[36px]">
          {summary.uniform}
        </span>
        <span className="font-mono text-[13px]">{summary.meta}</span>
      </div>

      <div className="bg-midnight text-dim flex flex-col gap-2 px-6 py-[18px] font-mono text-[13px] leading-[1.7]">
        <span className="text-body">{summary.note}</span>
        <span>{summary.gear}</span>
      </div>

      <a
        href={smsHref}
        className="bg-brand text-bone hover:bg-brand-hover flex flex-col gap-1 px-6 py-5 transition-colors"
      >
        <span className="text-on-blue font-mono text-[11px] tracking-[0.12em] uppercase">
          Text to claim any class
        </span>
        <span className="font-display text-[32px] leading-none font-extrabold sm:text-[36px]">
          {SITE.phone}
        </span>
      </a>
    </aside>
  )
}
