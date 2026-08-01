import { useRef } from 'react'
import type { Day } from '../data/classes'
import type { DayTab } from '../hooks/useSchedule'

interface DayTabsProps {
  tabs: DayTab[]
  onSelect: (day: Day) => void
  /** id of the panel a given tab controls — one panel per day. */
  panelId: (day: Day) => string
  tabId: (day: Day) => string
}

/**
 * Mon–Thu tab strip. Implemented as a real ARIA tablist with a
 * roving tabindex: Tab enters the strip once, then arrow keys move
 * between days — the standard pattern, and far less tabbing for
 * keyboard users than four separate buttons.
 */
export function DayTabs({ tabs, onSelect, panelId, tabId }: DayTabsProps) {
  const stripRef = useRef<HTMLDivElement>(null)

  const move = (to: number) => {
    const index = (to + tabs.length) % tabs.length
    const tab = tabs[index]
    if (!tab) return
    onSelect(tab.day)
    stripRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[index]?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        move(index + 1)
        break
      case 'ArrowLeft':
        e.preventDefault()
        move(index - 1)
        break
      case 'Home':
        e.preventDefault()
        move(0)
        break
      case 'End':
        e.preventDefault()
        move(tabs.length - 1)
        break
    }
  }

  return (
    <div
      ref={stripRef}
      role="tablist"
      aria-label="Day of the week"
      className="bg-hairline border-hairline grid grid-cols-4 gap-px border"
    >
      {tabs.map((tab, i) => (
        <button
          key={tab.day}
          role="tab"
          id={tabId(tab.day)}
          aria-selected={tab.active}
          aria-controls={panelId(tab.day)}
          tabIndex={tab.active ? 0 : -1}
          onClick={() => onSelect(tab.day)}
          onKeyDown={(e) => onKeyDown(e, i)}
          // The focus ring is drawn *inside* the tab (negative offset)
          // so it isn't clipped by the neighbouring cells. That means
          // the global amber ring lands on amber for the selected tab
          // and disappears — it needs the dark outline instead.
          className={`flex flex-col items-center gap-1 border-0 px-1 pt-[14px] pb-[13px] transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 ${
            tab.active
              ? 'bg-amber text-midnight focus-visible:outline-midnight'
              : 'bg-midnight text-dim hover:bg-[#112039]'
          }`}
        >
          {/* Reserves its line height even when empty so the
              abbreviations stay on one baseline across tabs. */}
          <span
            className={`font-mono text-[10px] leading-4 tracking-[0.1em] uppercase ${
              tab.active ? 'text-on-amber' : 'text-amber'
            }`}
          >
            {tab.today || ' '}
          </span>
          <span className="font-display text-[22px] leading-none font-extrabold uppercase sm:text-[26px]">
            {tab.abbr}
          </span>
          <span
            className={`font-mono text-[10px] tracking-[0.06em] whitespace-nowrap uppercase sm:text-[11px] ${
              tab.active ? 'text-on-amber' : 'text-faint-text'
            }`}
          >
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  )
}
