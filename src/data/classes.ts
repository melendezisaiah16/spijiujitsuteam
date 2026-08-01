/**
 * The class schedule. Ten classes, Mon–Thu, closed Fri–Sun.
 * This is the only place the gym's timetable lives.
 *
 * Confirmed with Thomas, 2026-07-26; age bands revised 2026-07-31:
 *   Little Ninjas    Mon & Wed  5:00–5:30p   (ages 4–6)
 *   Big Kids         Mon–Thu    5:30–6:15p   (ages 7–12)
 *   Teens & Adults   Mon–Thu    6:30p        (13+)
 *   Gi on Mon & Wed, no-gi on Tue & Thu.
 *
 * 13+ is the guide, not a rule — which class a teen trains in also
 * depends on their size, so the copy says so rather than turning the
 * band into a promise the gym then has to break at the door.
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
  { day: 'Mon', time: '5:30p', end: '6:15p', name: 'Big Kids', detail: 'Ages 7–12', track: 'kids', beginner: false },
  { day: 'Mon', time: '6:30p', name: 'Teens & Adults', detail: '13+', track: 'adults', beginner: true },

  { day: 'Tue', time: '5:30p', end: '6:15p', name: 'Big Kids', detail: 'Ages 7–12', track: 'kids', beginner: false },
  { day: 'Tue', time: '6:30p', name: 'Teens & Adults', detail: '13+', track: 'adults', beginner: true },

  { day: 'Wed', time: '5:00p', end: '5:30p', name: 'Little Ninjas', detail: 'Ages 4–6', track: 'kids', beginner: false },
  { day: 'Wed', time: '5:30p', end: '6:15p', name: 'Big Kids', detail: 'Ages 7–12', track: 'kids', beginner: false },
  { day: 'Wed', time: '6:30p', name: 'Teens & Adults', detail: '13+', track: 'adults', beginner: true },

  { day: 'Thu', time: '5:30p', end: '6:15p', name: 'Big Kids', detail: 'Ages 7–12', track: 'kids', beginner: false },
  { day: 'Thu', time: '6:30p', name: 'Teens & Adults', detail: '13+', track: 'adults', beginner: true },
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
 * When the doors close, in 24-hour time. Confirmed by the gym
 * 2026-08-01.
 *
 * Deliberately a stated fact rather than something inferred from the
 * last class start. The previous version added an assumed hour to the
 * 6:30p class and advertised a 19:30 close; the gym is actually open
 * until 21:00, so every derivation of it was wrong by ninety minutes —
 * in the figure Google prints in the search result.
 *
 * Opening times still derive from the timetable, because those really
 * are the first class of the night.
 */
const CLOSES_AT = '21:00'

/** "5:00p" → minutes since midnight. */
function toMinutes(time: string): number {
  const [, h, m, mer] = /^(\d{1,2}):(\d{2})([ap])$/.exec(time) ?? []
  if (!h || !m || !mer) throw new Error(`Unparseable class time: ${time}`)
  const hour = Number(h) % 12
  return (mer === 'p' ? hour + 12 : hour) * 60 + Number(m)
}

/** Minutes since midnight → "17:00", the ISO form schema.org wants. */
function toIsoTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  return `${String(h).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

export interface OpeningHours {
  /** Full day names, as schema.org's dayOfWeek expects. */
  days: string[]
  opens: string
  closes: string
}

/**
 * Opening hours per day, grouped so that days sharing the same window
 * collapse into one entry.
 *
 * `opens` is derived from the timetable because a schedule change that
 * didn't reach the JSON-LD would leave Google advertising hours the gym
 * doesn't keep, and these hours appear in the search result itself.
 * `closes` is the gym's stated closing time — see CLOSES_AT.
 */
export function openingHours(): OpeningHours[] {
  const byOpening = new Map<string, string[]>()

  for (const day of ALL_DAYS) {
    const times = classesFor(day).map((c) => toMinutes(c.time))
    if (times.length === 0) continue
    const opens = toIsoTime(Math.min(...times))
    byOpening.set(opens, [...(byOpening.get(opens) ?? []), DAY_FULL[day]])
  }

  return [...byOpening].map(([opens, days]) => ({ days, opens, closes: CLOSES_AT }))
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
