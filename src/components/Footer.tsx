import { SITE } from '../data/site'

export function Footer() {
  return (
    <footer className="bg-midnight border-hairline text-faint-text flex flex-col gap-4 border-t px-5 py-7 font-mono text-xs sm:px-8 lg:px-12">
      <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
        <span>
          {SITE.name.toUpperCase()} · {SITE.city.toUpperCase()}, {SITE.state}
        </span>
        <span className="text-sand tracking-[0.2em]">{SITE.tagline.toUpperCase()}</span>
        <span>A {SITE.affiliate.toUpperCase()} AFFILIATE</span>
      </div>

      {/*
        The year is read at render. That means the build bakes the
        build-year into the prerendered HTML and the browser corrects
        it on hydration — suppressHydrationWarning covers the one
        night a year those disagree. Nothing to remember to update.
      */}
      <p className="border-hairline m-0 border-t pt-4 text-center" suppressHydrationWarning>
        © {new Date().getFullYear()} {SITE.name} Team. All Rights Reserved.
      </p>
    </footer>
  )
}
