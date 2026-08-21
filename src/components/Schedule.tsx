import { useId } from 'react'
import { ALL_DAYS, classesFor, DAY_FULL } from '../data/classes'
import { ADDRESS } from '../data/site'
import type { Schedule as ScheduleModel } from '../hooks/useSchedule'
import { ClassRow } from './ClassRow'
import { DayTabs } from './DayTabs'
import { ScheduleRail } from './ScheduleRail'

export function Schedule({ schedule }: { schedule: ScheduleModel }) {
  const baseId = useId()
  const panelId = (day: string) => `${baseId}-panel-${day}`
  const tabId = (day: string) => `${baseId}-tab-${day}`

  return (
    <section
      id="schedule"
      aria-labelledby={`${baseId}-heading`}
      className="bg-deep border-hairline flex flex-col gap-6 border-b px-5 py-12 sm:px-8 lg:px-12 lg:pt-14 lg:pb-16"
    >
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end sm:gap-12">
        <div className="flex flex-col gap-2.5">
          <span className="kicker text-amber">This week on the mat</span>
          <h2
            id={`${baseId}-heading`}
            className="font-display text-display-lg m-0 font-extrabold uppercase"
          >
            Pick your night.
          </h2>
          <p className="text-muted m-0 text-base leading-[1.6] sm:text-[17px]">
            Every class this week. Text us and your first one's free. No app, no account.
          </p>
        </div>
        {/* nowrap so the flex sibling can't squeeze this into breaking
            "Port / Isabel" across two lines, which it did around
            800–900px. It fits on one line even at 320. */}
        <p className="text-dim m-0 font-mono text-[13px] leading-[1.8] whitespace-nowrap sm:shrink-0 sm:text-right">
          Mon–Thu evenings
          <br />
          {ADDRESS.replace(', TX 78578', '')}
        </p>
      </div>

      <DayTabs tabs={schedule.tabs} onSelect={schedule.setDay} panelId={panelId} tabId={tabId} />


      <div className="grid items-start gap-8 lg:grid-cols-[1fr_340px]">
        {/*
          All four nights render; the three that aren't selected carry
          the `hidden` attribute. Previously only the selected day was
          in the tree, which meant the deployed HTML — and therefore
          Google, and every AI fetcher that reads raw HTML — only ever
          saw Monday. Three quarters of the timetable existed solely
          as the result of a click.

          This is also the more correct tabs pattern: one panel per
          tab, each labelled by its own tab. Hidden panels leave the
          accessibility tree entirely, so screen readers and
          getByRole('tabpanel') still see exactly one.
        */}
        <div className="flex flex-col gap-3">
          {ALL_DAYS.map((day) => {
            const active = day === schedule.day
            return (
              <div
                key={day}
                id={panelId(day)}
                role="tabpanel"
                aria-labelledby={tabId(day)}
                tabIndex={-1}
                hidden={!active}
                className={active ? 'flex flex-col gap-3' : undefined}
              >
                {/* Names the night in the markup for anything reading
                    the panels out of context — never rendered. */}
                <h3 className="sr-only">{DAY_FULL[day]} classes</h3>
                {classesFor(day).map((session) => (
                  <ClassRow key={`${session.day}-${session.time}`} session={session} />
                ))}
              </div>
            )
          })}
          <p className="text-faint-text m-0 font-mono text-xs">{schedule.dayNote}</p>
        </div>

        <ScheduleRail summary={schedule.summary} />
      </div>
    </section>
  )
}
