import { useEffect, useState } from 'react'
import { DAY_BY_INDEX, type Day } from '../data/classes'

/**
 * The current day, or null when the gym is closed (Fri–Sun).
 *
 * Deliberately resolved in an effect rather than during render.
 * The page is prerendered at build time, so reading the clock
 * during the first render would either bake a stale "Today"
 * marker into the static HTML or throw a hydration mismatch.
 * First paint shows Monday; the real day lands on hydration.
 */
export function useToday(): Day | null {
  const [today, setToday] = useState<Day | null>(null)

  useEffect(() => {
    setToday(DAY_BY_INDEX[new Date().getDay()] ?? null)
  }, [])

  return today
}
