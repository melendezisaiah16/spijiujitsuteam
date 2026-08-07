/**
 * Verified business data. Every number, name, and address on the
 * site derives from here — change it once, it changes everywhere.
 */

export const SITE = {
  name: 'SPI Jiu Jitsu',
  /** Registered name on the Google Business Profile. */
  legalName: 'SPI BJJ & Fitness LLC',
  tagline: 'Roll like a wave',
  city: 'Port Isabel',
  state: 'TX',
  /** Port Isabel is NOT on South Padre Island. Copy must never say "on the island." */
  street: '134 S Shore Dr',
  zip: '78578',
  phone: '(956) 667-1971',
  instructor: 'Thomas Trevino',
  /** His first class. Keeps the "N years later" line in the bio current. */
  instructorSince: 2020,
  affiliate: 'United BJJ Team',
  affiliateUrl: 'https://unitedbjjteam.com',
} as const

export const ADDRESS = `${SITE.street}, ${SITE.city}, ${SITE.state} ${SITE.zip}`

/**
 * The gym's own pin, not the street address.
 *
 * Searching Maps for "134 S Shore Dr" resolves to the rooftop parcel,
 * which drops the pin on a neighbouring house. These come from the
 * business listing itself: `lat`/`lng` are its coordinates and `cid`
 * is its Google Maps customer ID.
 *
 * Repointed 2026-08-06 to the "SPI JIU JITSU" listing. The previous
 * values (cid 1768797045726719715, 26.0737075/-97.2120742) belonged to
 * a *different* profile 16 m away — not a moved pin, a separate record.
 * That matters more than the distance suggests: `hasMap` and `sameAs`
 * are the site's claim about which Google listing this business *is*,
 * so pointing them at the wrong one splits the entity in two and wastes
 * every review and photo on the listing people actually find.
 *
 * Sourced from the Maps URL: `!1s<feature-id>:0x5c79e348d5a522be` is
 * the CID in hex (6663607025632879294 decimal), and `!3d/!4d` carry the
 * pin's real coordinates — not the `@lat,lng` in the path, which is
 * only the map viewport and is a few hundred metres off.
 */
export const PLACE = {
  lat: 26.0738256,
  lng: -97.2121702,
  cid: '6663607025632879294',
} as const

/** Digits only — every deep link is built from this. */
const DIGITS = SITE.phone.replace(/[^0-9]/g, '')

/**
 * One prefilled message for every CTA on the page.
 *
 * Deliberately generic — it used to name the specific class the
 * visitor tapped, which made the text read like a booking form. The
 * claim sheet still shows which class they picked; the message they
 * send is the same either way.
 */
const SMS_BODY = "Hi, I'd like to claim a free trial class."

/* `?&body=` rather than `?body=` — the odd-looking form is what iOS
   Messages actually honours, and Android accepts it too. */
export const smsHref = `sms:${DIGITS}?&body=${encodeURIComponent(SMS_BODY)}`
export const telHref = `tel:${DIGITS}`
/** Routing straight to the gym's coordinates — never a guessed parcel. */
export const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${PLACE.lat}%2C${PLACE.lng}`

/** The business listing: photos, hours, reviews. */
export const placeHref = `https://www.google.com/maps?cid=${PLACE.cid}`

/**
 * Off-site profiles for the same business, for JSON-LD `sameAs`.
 *
 * "Described the same way in several places" is weighted heavily by AI
 * answer engines and by Google's entity resolution — this is worth far
 * more than its size suggests. Add the gym's Facebook and Instagram
 * URLs here and they flow into the structured data automatically.
 *
 * Only verified URLs belong here. A guessed profile link is worse than
 * an absent one: `sameAs` asserts "this is the same entity", so a wrong
 * URL actively tells Google the gym is somebody else.
 */
/**
 * The gym's social accounts, as visible links.
 *
 * Supplied by the gym 2026-08-01. The Facebook entry is a share link
 * rather than the page's own address — the tracking query string it
 * arrived with has been dropped, since a `sameAs` carrying someone's
 * click-attribution parameters is not a clean identity claim. Swap it
 * for the canonical facebook.com/<pagename> URL when that's to hand.
 *
 * Instagram leads: for a gym it's the account people actually check
 * before deciding to walk in.
 */
export const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://www.instagram.com/spijiujitsu' },
  { label: 'Facebook', href: 'https://www.facebook.com/share/1BZw6GmxyB/' },
] as const

/**
 * The same accounts as bare URLs, for JSON-LD `sameAs`.
 *
 * Derived from SOCIAL_LINKS rather than listed again — a profile that
 * search engines are told about but visitors can't reach is the bug
 * this file just had.
 */
export const SOCIAL_PROFILES: readonly string[] = [
  placeHref,
  ...SOCIAL_LINKS.map((link) => link.href),
]

/**
 * The "A room with a scoreboard" band. Stays false until the gym
 * supplies verified season results — the numbers below are the
 * design's placeholders and have never been confirmed.
 */
export const SHOW_RECORD_BAND = false

export const STATS = [
  { n: '24', label: 'Medals' },
  { n: '9', label: 'Gold' },
  { n: '14', label: 'Competitors' },
  { n: '6', label: 'Tournaments' },
] as const
