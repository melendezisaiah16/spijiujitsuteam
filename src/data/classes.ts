/**
 * The class schedule. Ten classes, Mon–Thu, closed Fri–Sun.
 * This is the only place the gym's timetable lives.
 *
 * Confirmed with Thomas, 2026-07-26:
 *   Little Ninjas  Mon & Wed  5:00–5:30p   (ages 4–6)
 *   Kids & Teens   Mon–Thu    5:30–6:15p   (ages 7–15)
 *   Adults         Mon–Thu    6:30p        (16+)
 *   Gi on Mon & Wed, no-gi on Tue & Thu.
 */

export type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu'
export type Track = 'kids' | 'adults' | 'comp'

export interface ClassSession {
  day: Day
  /** Display start time, e.g. "6:30p". */
  time: string
  /** Display end time. Omitted where the gym hasn't fixed one. */
  end?: string
  name: string
  /** Age band, shown on the meta line. */
  detail: string
  track: Track
  /** Beginner classes render as the hero row and drive the rail pick. */
  beginner: boolean
}

export const ALL_DAYS: readonly Day[] = ['Mon', 'Tue', 'Wed', 'Thu']

export const DAY_FULL: Record<Day, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
}

/** Day-of-week index (Sun = 0) → Day, for `new Date().getDay()`. */
export const DAY_BY_INDEX: Record<number, Day | undefined> = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
}

/** Gi nights. Everything else trains no-gi. */
const GI_DAYS: readonly Day[] = ['Mon', 'Wed']

export function isGiDay(day: Day): boolean {
  return GI_DAYS.includes(day)
}

/** "Gi" / "No-gi" — what to bring on a given night. */
export function uniformFor(day: Day): string {
  return isGiDay(day) ? 'Gi' : 'No-gi'
}

export const CLASSES: readonly ClassSession[] = [
  { day: 'Mon', time: '5:00p', end: '5:30p', name: 'Little Ninjas', detail: 'Ages 4–6', track: 'kids', beginner: false },
  { day: 'Mon', time: '5:30p', end: '6:15p', name: 'Kids & Teens', detail: 'Ages 7–15', track: 'kids', beginner: false },
  { day: 'Mon', time: '6:30p', name: 'Adults', detail: '16+', track: 'adults', beginner: true },

  { day: 'Tue', time: '5:30p', end: '6:15p', name: 'Kids & Teens', detail: 'Ages 7–15', track: 'kids', beginner: false },
  { day: 'Tue', time: '6:30p', name: 'Adults', detail: '16+', track: 'adults', beginner: true },

  { day: 'Wed', time: '5:00p', end: '5:30p', name: 'Little Ninjas', detail: 'Ages 4–6', track: 'kids', beginner: false },
  { day: 'Wed', time: '5:30p', end: '6:15p', name: 'Kids & Teens', detail: 'Ages 7–15', track: 'kids', beginner: false },
  { day: 'Wed', time: '6:30p', name: 'Adults', detail: '16+', track: 'adults', beginner: true },

  { day: 'Thu', time: '5:30p', end: '6:15p', name: 'Kids & Teens', detail: 'Ages 7–15', track: 'kids', beginner: false },
  { day: 'Thu', time: '6:30p', name: 'Adults', detail: '16+', track: 'adults', beginner: true },
]

/** Left accent-bar colour per track. */
export const TRACK_COLOR: Record<Track, string> = {
  adults: 'var(--color-brand)',
  kids: 'var(--color-sand)',
  comp: 'var(--color-amber)',
}

export function classesFor(day: Day): ClassSession[] {
  return CLASSES.filter((c) => c.day === day)
}

/** "3 classes" / "1 class" */
export function classCount(n: number): string {
  return `${n} ${n === 1 ? 'class' : 'classes'}`
}

/** The beginner-friendly class, which the rail and copy point people at. */
export function beginnerClass(): ClassSession | undefined {
  return CLASSES.find((c) => c.beginner)
}

/** "Mon" · "Mon & Wed" · "Mon–Thu" — a contiguous run collapses. */
function formatDays(days: readonly Day[]): string {
  const ordered = ALL_DAYS.filter((d) => days.includes(d))
  if (ordered.length === 0) return ''
  if (ordered.length === 1) return ordered[0]!
  const idx = ordered.map((d) => ALL_DAYS.indexOf(d))
  const contiguous = idx.every((v, i) => i === 0 || v === idx[i - 1]! + 1)
  return contiguous && ordered.length > 2
    ? `${ordered[0]}–${ordered.at(-1)}`
    : ordered.join(' & ')
}

/**
 * "5:00–5:30p" rather than "5:00p–5:30p" — the meridiem is only worth
 * printing once when both ends share it.
 */
function timeRange(start: string, end: string): string {
  const suffix = /[ap]$/.exec(start)?.[0]
  return `${suffix && end.endsWith(suffix) ? start.slice(0, -1) : start}\u2013${end}`
}

export interface ProgramSummary {
  name: string
  /** "Mon & Wed" / "Mon–Thu" */
  days: string
  /** "5:00–5:30p", or just the start where no end time is published. */
  time: string
}

/**
 * One row per class name, in schedule order.
 *
 * Derived rather than written out so the visit strip can't drift from
 * the schedule above it — the whole reason the timetable lives in this
 * module is that it should only be stated once.
 */
export function programSummaries(): ProgramSummary[] {
  const byName = new Map<string, ClassSession[]>()
  for (const c of CLASSES) {
    byName.set(c.name, [...(byName.get(c.name) ?? []), c])
  }
  return [...byName].map(([name, list]) => {
    const first = list[0]!
    return {
      name,
      days: formatDays(list.map((c) => c.day)),
      time: first.end ? timeRange(first.time, first.end) : first.time,
    }
  })
}

/** "Mon–Thu · closed Fri–Sun" */
export function openDaysSummary(): string {
  return `${formatDays(ALL_DAYS)} · closed Fri–Sun`
}

/** "Gi Mon & Wed · No-gi Tue & Thu" */
export function uniformSummary(): string {
  const gi = ALL_DAYS.filter(isGiDay)
  const noGi = ALL_DAYS.filter((d) => !isGiDay(d))
  return `Gi ${formatDays(gi)} · No-gi ${formatDays(noGi)}`
}

/**
 * Meta line under a class name: age band, run time where known, and
 * what to wear — the three things someone deciding tonight needs.
 */
export function classMeta(c: ClassSession): string {
  const parts = [c.detail]
  if (c.end) parts.push(timeRange(c.time, c.end))
  parts.push(uniformFor(c.day))
  return parts.join(' · ')
}
