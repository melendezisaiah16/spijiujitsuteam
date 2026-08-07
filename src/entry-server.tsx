import { renderToString } from 'react-dom/server'
import { App } from './App'
import { openDaysSummary, programSummaries, uniformSummary } from './data/classes'
import { faqItems } from './data/faq'
import { ADDRESS, placeHref, SITE } from './data/site'

/**
 * Build-time render. Used only by scripts/prerender.mjs to bake the
 * page's real text into dist/index.html so crawlers get content in
 * the first response instead of an empty shell.
 */
export function render(): string {
  return renderToString(<App />)
}

/**
 * The llms.txt body.
 *
 * An emerging convention, not a standard anyone is obliged to honour:
 * a plain-markdown summary at the site root for language models that
 * would otherwise have to infer the facts from rendered HTML. It costs
 * a few hundred bytes and carries no downside, which is the whole
 * argument for it — treat it as cheap insurance, not as a ranking
 * factor, because nothing has established that it is one.
 *
 * Built here rather than in scripts/seo.mjs so it reads the same
 * classes.ts and faq.ts the page does. A hand-written copy of the
 * timetable is a copy that goes stale.
 */
export function llmsTxt(siteUrl: string): string {
  const hours = programSummaries()
    .map((p) => `- ${p.name}: ${p.days}, ${p.time}`)
    .join('\n')

  const faq = faqItems()
    .map((item) => `### ${item.q}\n\n${item.a}`)
    .join('\n\n')

  return `# ${SITE.name}

> Brazilian jiu jitsu academy in ${SITE.city}, ${SITE.state}. Classes for adults, teens, women and children from age four, four nights a week. The first class is free and requires no experience or booking.

${SITE.name} (legally ${SITE.legalName}) is a ${SITE.affiliate} affiliate at ${ADDRESS}, run by head instructor ${SITE.instructor}. It is on the mainland in ${SITE.city}, not on South Padre Island, a few minutes across the causeway. Contact by text or phone: ${SITE.phone}.

## Class schedule

${hours}

${openDaysSummary()}. ${uniformSummary()}.

## Common questions

${faq}

## Links

- [Website](${siteUrl}/): schedule, programs, instructor and directions
- [Google Business Profile](${placeHref}): reviews, photos and directions
- [${SITE.affiliate}](${SITE.affiliateUrl}): the affiliation this academy trains under
`
}
