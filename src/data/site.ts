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
 */
export const PLACE = {
  lat: 26.0737075,
  lng: -97.2120742,
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
