import { useMemo, useState } from 'react'
import {
  ALL_DAYS,
  beginnerClass,
  classCount,
  classesFor,
  DAY_FULL,
  isGiDay,
  uniformFor,
  type ClassSession,
  type Day,
} from '../data/classes'
import { useToday } from './useToday'

export interface DayTab {
  day: Day
  abbr: string
  count: string
  /** "Today" or empty — the marker line above the abbreviation. */
  today: string
  active: boolean
}

/**
 * The day-specific panel beside the class list.
 *
 * This used to be a "recommendation" resolved in priority order:
 * beginner class, else kids class, else first class. Every night has a
 * beginner-friendly adults class, so the first branch always won and
 * the panel was frozen on "Adults" — a recommender that could only
 * ever recommend one thing, next to a row already saying the same.
 *
 * It now carries what genuinely differs between nights: gi or no-gi,
 * how many classes run, and when the first one starts.
 */
export interface DaySummary {
  /** "Tonight" when the selected day is today, otherwise "Monday". */
  when: string
  /** "Gi night" / "No-gi night" — the thing that actually changes. */
  uniform: string
  /** "3 classes · first at 5:00p" */
  meta: string
  note: string
  /** What to bring, which depends on whether it's a gi night. */
  gear: string
}

export interface Schedule {
  /** The day currently being shown. */
  day: Day
  setDay: (day: Day) => void
  /** Today, or null on Fri–Sun. */
  today: Day | null
  tabs: DayTab[]
  classes: ClassSession[]
  summary: DaySummary
  dayNote: string
}

export function useSchedule(): Schedule {
  const today = useToday()
  const [selected, setSelected] = useState<Day | null>(null)

  // A tab the visitor picked always wins. Otherwise fall back to
  // today, and to Monday when the gym is closed.
  const day: Day = selected ?? today ?? 'Mon'

  return useMemo<Schedule>(() => {
    const classes = classesFor(day)
    const isToday = day === today

    const tabs: DayTab[] = ALL_DAYS.map((d) => ({
      day: d,
      abbr: d.toUpperCase(),
      count: classCount(classesFor(d).length),
      today: d === today ? 'Today' : '',
      active: d === day,
    }))

    // The gym does NOT lend gis — do not reintroduce that claim.
    // No-gi nights we can state the kit exactly; gi nights depend on
    // the gym's own answer for a first-timer, so the copy defers to
    // them instead of inventing a policy.
    const gear = isGiDay(day)
      ? 'Gi night — text us about what to wear for your first class.'
      : 'No-gi night. Shorts or spats, t-shirt or rashguard, water.'

    const first = classes[0]
    const beginner = beginnerClass()
    const summary: DaySummary = {
      when: isToday ? 'Tonight' : DAY_FULL[day],
      uniform: `${uniformFor(day)} night`,
      meta: first
        ? `${classCount(classes.length)} · first at ${first.time}`
        : classCount(classes.length),
      // Names the beginner class from the data rather than repeating
      // "6:30 adults" in prose, which would go stale silently.
      note: beginner
        ? `No experience needed — ${beginner.name} at ${beginner.time} takes beginners any night.`
        : 'No experience needed on any night.',
      gear,
    }

    const count = classCount(classes.length)
    const dayNote = !today
      ? `Closed today — ${count} ${day} · tap a day to switch`
      : `${count}${isToday ? ' today' : ` ${day}`} · tap a day to switch`

    return { day, setDay: setSelected, today, tabs, classes, summary, dayNote }
  }, [day, today])
}
