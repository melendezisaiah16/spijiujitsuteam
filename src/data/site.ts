/**
 * Verified business data. Every number, name, and address on the
 * site derives from here — change it once, it changes everywhere.
 */

export const SITE = {
  /**
   * Must match the Google Business Profile name exactly, bar casing —
   * the profile reads "SPI JIU JITSU". This string is also what Google
   * uses as the site name beside the title in search results, via the
   * WebSite node's `name`.
   */
  name: 'SPI Jiu Jitsu',
  /**
   * The registered legal entity. No longer the Business Profile name —
   * the surviving profile reads "SPI JIU JITSU".
   *
   * Kept deliberately, and on the plain grounds that it is true: this is
   * the registered entity, `Organization.legalName` is the right slot
   * for it, and it is a name the gym is still referred to by on
   * paperwork. Google resolves the local entity from NAP consistency and
   * the profile-to-site link, not from these strings, so carrying the
   * LLC name costs nothing. Remove it only if the entity is dissolved or
   * renamed — not because the profile is named something else.
   */
  legalName: 'SPI BJJ & Fitness LLC',
  tagline: 'Roll like a wave',
  city: 'Port Isabel',
  state: 'TX',
  /**
   * Port Isabel is NOT on South Padre Island. Copy must never say "on
   * the island."
   *
   * Includes the unit, because the Business Profile does. Both listings
   * rendered as "134 S Shore Dr Unit c" in search results before the
   * merge, so the survivor carries it too — re-verify against the
   * profile if that address is ever edited. NAP consistency is judged on
   * the exact string: an address differing from the profile by a unit
   * number is weaker corroboration than one matching character for
   * character, and this is the site's half of that match.
   */
  street: '134 S Shore Dr Unit C',
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
 * Names this business is genuinely known by, for JSON-LD
 * `alternateName`.
 *
 * These are real variants, not keyword padding. "SPI Jiu Jitsu Port
 * Isabel" and the like do not belong here: stuffing alternateName with
 * search phrases is the schema equivalent of keyword-stuffing a Business
 * Profile name, and Google discounts or penalises both.
 *
 * "SPI Jiu Jitsu Team" matters more than it looks — it is the domain
 * (spijiujitsuteam.com). Anyone who reads the URL off a gi, a flyer or
 * a car window searches that phrase, and without this the site claims
 * no connection to the name on its own address bar.
 */
export const ALTERNATE_NAMES: readonly string[] = [
  'SPI Jiu Jitsu Team',
  'SPI BJJ',
  SITE.legalName,
]

/**
 * The gym's own pin, not the street address.
 *
 * Searching Maps for "134 S Shore Dr" resolves to the rooftop parcel,
 * which drops the pin on a neighbouring house. These come from the
 * business listing itself: `lat`/`lng` are its coordinates and `cid`
 * is its Google Maps customer ID.
 *
 * The gym had two Business Profiles at this address for a while. Both
 * were named SPI JIU JITSU with the same phone number and pins 16m
 * apart, and one held almost all the reviews. This value tracked
 * whichever the gym could administer at the time:
 *
 *   …9715  the review-holding listing. Ownership being recovered.
 *   …9294  the second listing, administered first. Set 2026-08-06.
 *   …9715  survivor of the merge. Set back 2026-08-11.
 *
 * (Decimal suffixes, because that is how the value is stored here. The
 * hex form only appears in Maps URLs.)
 *
 * Google merged them and the smaller listing came down. Per Google's
 * own documentation a merge *combines* reviews rather than moving them,
 * and review replies can be lost in the process — worth checking on the
 * survivor.
 *
 * Keeping this current matters because `hasMap` and `sameAs` are the
 * site's claim about which Google listing this business *is*. Nothing
 * Google publishes suggests pointing at a suppressed duplicate is
 * penalised, so treat this as lost corroboration rather than damage —
 * but corroboration is the entire reason the claim is here.
 *
 * The coordinates are the survivor's, read from `!3d`/`!4d`. They sit
 * ~16m from the values this file carried for this same CID before
 * 2026-08-06; whether the pin was adjusted or the original figure was
 * imprecise isn't recoverable now.
 *
 * Sourced from the Maps URL's `data=` parameter, where `!1s<ftid>`
 * splits on the colon and the second half — `0x188c078aa64d2ee3` — is
 * the CID in hex. Worth knowing that Google documents neither `data=`
 * nor `cid=`: this is stable, long-established convention rather than a
 * contract. The `@lat,lng` in the path is only the map viewport and
 * sits ~257m west of the pin.
 */
export const PLACE = {
  lat: 26.0738256,
  lng: -97.2121702,
  cid: '1768797045726719715',
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
 * Off-site profiles for the same business, for JSON-LD `sameAs`.
 *
 * "Described the same way in several places" is weighted heavily by AI
 * answer engines and by Google's entity resolution, so this is worth
 * more than its size suggests.
 *
 * ONLY VERIFIED URLS BELONG HERE. `sameAs` asserts "this is the same
 * entity", so a wrong URL actively tells Google the gym is somebody
 * else. That rule is why this list is short, and it is the rule the CID
 * above got caught by when a Business Profile was merged away.
 *
 * One entity, one URL each. Don't add a second spelling of a listing
 * already present — the Knowledge Graph mid and place-ID forms of the
 * Google profile are the same entity as the CID URL, and enumerating
 * all three is duplicate-entity noise rather than corroboration. If a
 * second identifier is ever genuinely needed, `identifier` as a
 * PropertyValue is the slot for it.
 *
 * Derived from SOCIAL_LINKS rather than listed again — a profile that
 * search engines are told about but visitors can't reach is the bug
 * this file once had.
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
