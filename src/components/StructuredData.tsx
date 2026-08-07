import { openingHours } from '../data/classes'
import { faqItems } from '../data/faq'
import { PLACE, placeHref, SITE, SOCIAL_PROFILES } from '../data/site'

/**
 * Every piece of schema.org markup on the site, in one connected graph.
 *
 * This used to be a hand-written JSON literal in index.html. Two things
 * were wrong with that. The hours were typed out by hand beside a
 * timetable that lives in classes.ts, so a schedule change would leave
 * Google advertising hours the gym no longer keeps — and those hours
 * print in the search result itself. And adding a verified Facebook URL
 * meant editing raw JSON inside an HTML comment rather than a list in
 * site.ts.
 *
 * Rendered from the React tree, it is prerendered into
 * dist/index.html by scripts/prerender.mjs — static markup in the first
 * response, which is the only form most AI fetchers and rich-result
 * parsers ever see. It is never injected client-side.
 *
 * The graph is connected by @id rather than being a heap of separate
 * blocks: a parser resolving "SPI Jiu Jitsu" gets the organisation, the
 * page about it, the person who teaches there and the questions it
 * answers as one entity, not five unrelated ones.
 */
export function StructuredData() {
  const origin = __SPI_SITE_URL__
  const id = (fragment: string) => `${origin}/#${fragment}`

  const gym = {
    '@type': ['SportsActivityLocation', 'SportsClub'],
    '@id': id('gym'),
    name: SITE.name,
    legalName: SITE.legalName,
    alternateName: ['SPI BJJ', SITE.legalName],
    slogan: SITE.tagline,
    description: `Brazilian jiu jitsu academy in ${SITE.city}, ${SITE.state}. Classes for adults, women, teens and children from age four, Monday through Thursday. ${SITE.affiliate} affiliate.`,
    url: `${origin}/`,
    telephone: `+1${SITE.phone.replace(/[^0-9]/g, '')}`,
    image: `${origin}/assets/og-image.jpg`,
    logo: `${origin}/assets/spi-logo.png`,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.street,
      addressLocality: SITE.city,
      addressRegion: SITE.state,
      postalCode: SITE.zip,
      addressCountry: 'US',
    },
    geo: { '@type': 'GeoCoordinates', latitude: PLACE.lat, longitude: PLACE.lng },
    hasMap: placeHref,
    sameAs: [...SOCIAL_PROFILES],
    knowsLanguage: ['en-US'],
    areaServed: ['Port Isabel', 'Laguna Vista', 'South Padre Island', 'Los Fresnos'].map(
      (name) => ({ '@type': 'City', name }),
    ),
    // Derived from classes.ts — see openingHours().
    openingHoursSpecification: openingHours().map((window) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: window.days,
      opens: window.opens,
      closes: window.closes,
    })),
    employee: { '@id': id('thomas') },
    parentOrganization: {
      '@type': 'Organization',
      name: SITE.affiliate,
      url: SITE.affiliateUrl,
    },
    // The free trial only. The gym discusses membership pricing in
    // person by choice, so there is no price to mark up — and an Offer
    // without a real figure is a figure Google would invent a display
    // for. See README, "Copy rules".
    makesOffer: {
      '@type': 'Offer',
      name: 'Free trial class',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      description:
        'First Brazilian jiu jitsu class is free for new students. No experience or booking required.',
    },
  }

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': id('website'),
        url: `${origin}/`,
        name: SITE.name,
        inLanguage: 'en-US',
        publisher: { '@id': id('gym') },
      },
      {
        '@type': 'WebPage',
        '@id': id('webpage'),
        url: `${origin}/`,
        name: `Brazilian Jiu Jitsu in ${SITE.city}, ${SITE.state} | First Class Free`,
        isPartOf: { '@id': id('website') },
        about: { '@id': id('gym') },
        primaryImageOfPage: `${origin}/assets/og-image.jpg`,
        inLanguage: 'en-US',
      },
      {
        '@type': 'Person',
        '@id': id('thomas'),
        name: SITE.instructor,
        jobTitle: 'Head Instructor',
        worksFor: { '@id': id('gym') },
      },
      gym,
      {
        // Same array as the visible #faq section. Marking up a question
        // that isn't on the page is a structured-data violation, so
        // these must not be allowed to diverge — hence one source.
        '@type': 'FAQPage',
        '@id': id('faq'),
        isPartOf: { '@id': id('webpage') },
        mainEntity: faqItems().map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      // The content is our own copy, not user input. Escaping "<"
      // anyway: one stray closing-script sequence inside an answer
      // would end the block early and spill the rest into the document
      // as visible text.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, '\\u003c') }}
    />
  )
}
