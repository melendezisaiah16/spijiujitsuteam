import { useEffect, useId, useRef, useState } from 'react'
import { SITE, smsHref } from '../data/site'
import { onAnchorClick } from '../lib/anchors'

const NAV = [
  { href: '#schedule', label: 'Schedule' },
  { href: '#programs', label: 'Programs' },
  { href: '#kids', label: 'Kids' },
  { href: '#coach', label: 'About' },
] as const

/**
 * Where a section counts as "current": exactly where anchor jumps put
 * it, plus a few pixels of tolerance for sub-pixel rounding.
 *
 * Read from the CSS rather than hard-coded — a second copy of this
 * number is what let the highlight drift out of step with the scroll
 * position in the first place.
 */
function spyLine(): number {
  const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)
  return (Number.isFinite(padding) ? padding : 80) + 8
}

/**
 * Highlights whichever section the visitor is currently reading.
 *
 * Takes the last section whose top has crossed the line under the
 * header. An IntersectionObserver was tried first and read one section
 * behind: while scrolling into a new section the previous one is often
 * still partly on screen, so "first visible section" stayed stuck on
 * the one above.
 */
function useActiveSection(): string | null {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const ids = NAV.map((n) => n.href.slice(1))
    let frame = 0

    const update = () => {
      frame = 0
      const line = spyLine()
      let current: string | null = null
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= line) current = id
      }
      setActive(current)
    }

    const onScroll = () => {
      frame ||= requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return active
}

export function Header() {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const active = useActiveSection()

  // Close the mobile menu on Escape, on outside click, and once the
  // viewport is wide enough that the full nav is showing again.
  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node
      if (!panelRef.current?.contains(target) && !toggleRef.current?.contains(target)) {
        setOpen(false)
      }
    }
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => mq.matches && setOpen(false)

    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    mq.addEventListener('change', onChange)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
      mq.removeEventListener('change', onChange)
    }
  }, [open])

  return (
    <header className="bg-deep border-hairline sticky top-0 z-40 border-b">
      {/*
        Three columns rather than justify-between. With space-between
        the middle group centres itself between the two side groups,
        so an asymmetric brand cluster pushed the nav 68px off the
        viewport centre at every width. 1fr/auto/1fr centres it against
        the page instead. Horizontal padding matches the sections below
        so the logo lines up with their content.
      */}
      <div className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-3 sm:px-8 lg:grid-cols-[1fr_auto_1fr] lg:px-12 lg:py-[14px]">
        <a
          href="#top"
          onClick={onAnchorClick}
          className="flex min-h-11 items-center gap-2.5 lg:gap-[13px]"
        >
          <img
            src="/assets/spi-logo.png"
            alt=""
            width={40}
            height={40}
            /* The mark is dark navy on a near-black bar — without the
               ring it dissolves into the header. */
            className="ring-bone/20 block size-9 rounded-full ring-1 lg:size-10"
          />
          <span className="font-display text-[22px] font-extrabold tracking-[0.01em] uppercase lg:text-[26px]">
            {SITE.name}
          </span>
          {/* Held back to xl. At the lg boundary the desktop nav has
              just appeared and this tag left only 21px between the
              brand and "Schedule" — they read as colliding. */}
          <span className="border-outline text-dim hidden border-l pl-[13px] font-mono text-[11px] xl:inline">
            {SITE.city}, {SITE.state}
          </span>
        </a>

        <nav
          aria-label="Sections"
          className="hidden justify-self-center lg:flex lg:gap-8 xl:gap-10"
        >
          {NAV.map((item) => {
            const current = active === item.href.slice(1)
            return (
              // 44px hit area on the anchor, underline on an inner
              // span. Padding the anchor itself to reach 44px would
              // drop the underline 12px below the text and detach it.
              // The desktop nav shows from 1024px, which includes
              // touch devices like an iPad in landscape.
              <a
                key={item.href}
                href={item.href}
                onClick={onAnchorClick}
                aria-current={current ? 'true' : undefined}
                className={`flex min-h-11 items-center text-sm font-semibold transition-colors ${
                  current ? 'text-bone' : 'text-body hover:text-bone'
                }`}
              >
                <span
                  className={`border-b-2 py-1 ${current ? 'border-amber' : 'border-transparent'}`}
                >
                  {item.label}
                </span>
              </a>
            )
          })}
        </nav>

        <a
          href={smsHref}
          className="bg-amber text-midnight hover:bg-bone hidden min-h-11 items-center px-[18px] text-sm font-bold transition-colors lg:flex lg:justify-self-end"
        >
          Text for a free class
        </a>

        {/* Mobile menu toggle. 44px square touch target. */}
        <button
          ref={toggleRef}
          type="button"
          aria-expanded={open}
          // Only reference the panel while it exists — a dangling
          // aria-controls is worse than none.
          aria-controls={open ? menuId : undefined}
          onClick={() => setOpen((v) => !v)}
          className="text-body hover:text-bone -mr-2.5 flex size-11 items-center justify-center justify-self-end transition-colors lg:hidden"
        >
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          <span aria-hidden="true" className="flex w-5 flex-col gap-[5px]">
            <span className="bg-current block h-0.5 w-full" />
            <span className="bg-current block h-0.5 w-full" />
            <span className="bg-current block h-0.5 w-full" />
          </span>
        </button>
      </div>

      {open && (
        <div
          ref={panelRef}
          id={menuId}
          className="border-hairline bg-deep border-t px-5 pt-2 pb-5 sm:px-8 lg:hidden"
        >
          <nav aria-label="Sections" className="flex flex-col">
            {NAV.map((item) => {
              const current = active === item.href.slice(1)
              return (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={current ? 'true' : undefined}
                  onClick={(e) => {
                    onAnchorClick(e)
                    setOpen(false)
                  }}
                  className={`border-hairline flex min-h-11 items-center border-b text-[15px] font-semibold transition-colors ${
                    current ? 'text-amber' : 'text-body hover:text-bone'
                  }`}
                >
                  {item.label}
                </a>
              )
            })}
          </nav>
          <a
            href={smsHref}
            onClick={() => setOpen(false)}
            className="bg-amber text-midnight mt-4 flex min-h-11 items-center justify-center px-[18px] py-3 text-[15px] font-bold"
          >
            Text for a free class
          </a>
        </div>
      )}
    </header>
  )
}
