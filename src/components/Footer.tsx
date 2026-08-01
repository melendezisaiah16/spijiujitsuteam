import { SITE, SOCIAL_LINKS } from '../data/site'

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
        row-reverse at sm so the accounts sit right and the copyright
        left, while stacked on a phone the accounts come first — they
        are the useful half of this row and shouldn't land underneath
        the legal boilerplate.
      */}
      <div className="border-hairline flex flex-col items-center gap-1 border-t pt-2 sm:flex-row-reverse sm:justify-between sm:pt-3">
        <nav aria-label="Social media" className="flex items-center gap-6">
          {SOCIAL_LINKS.map((link) => (
            // 44px hit area on the anchor, rule on the inner span — the
            // same split as the map links, so the underline stays with
            // the text instead of drifting below it.
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sand inline-flex min-h-11 items-center transition-colors"
            >
              <span className="border-hairline border-b pb-0.5">{link.label} →</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ))}
        </nav>

        {/*
          The year is read at render. That means the build bakes the
          build-year into the prerendered HTML and the browser corrects
          it on hydration — suppressHydrationWarning covers the one
          night a year those disagree. Nothing to remember to update.
        */}
        <p className="m-0 text-center" suppressHydrationWarning>
          © {new Date().getFullYear()} {SITE.name}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
