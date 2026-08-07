# SPI Jiu Jitsu

Single-page marketing site for SPI Jiu Jitsu — a Brazilian jiu jitsu gym in
Port Isabel, TX and a United BJJ Team affiliate.

The site has exactly one job: get a visitor to **text the gym for a free trial
class**. Schedule, programs, instructor, and location all exist to support that
one conversion. There is no backend, no booking system, and no forms — every
CTA is an `sms:` deep link.

Design direction: **"Isla Noche"** — midnight navy field, brand blue from the
gym's logo, warm sand, and amber as a signal colour that means "free class" and
nothing else.

## Running it

```bash
npm install
npm run dev
```

Then open **http://localhost:5183**.

Port 5183 is pinned in `vite.config.ts` because 5173 is already used by another
project on this machine.

To test on a real phone (recommended — most visitors will be on one):

```bash
npm run dev -- --host
```

Vite prints a `Network:` URL. Open it on a phone on the same Wi-Fi. The `sms:`
links only actually do anything on a device with a messaging app.

| Script              | What it does                                              |
| ------------------- | --------------------------------------------------------- |
| `npm run dev`       | Dev server with HMR on :5183                                |
| `npm run images`    | Regenerate responsive photos (runs automatically before dev/build) |
| `npm run build`     | Typecheck → client build → SSR build → prerender into `dist/` |
| `npm run preview`   | Serve the built `dist/` on :5183 — use this to check the prerender |
| `npm run typecheck` | TypeScript only                                             |
| `npm test`          | Playwright: interaction, accessibility, image and analytics checks |
| `npm run screenshots` | Full-page captures at 11 widths into `screenshots/`       |

## The schedule

Confirmed with Thomas on 2026-07-26; age bands revised 2026-07-31.
Ten classes, Mon–Thu.

| | Mon | Tue | Wed | Thu |
| --- | --- | --- | --- | --- |
| **Little Ninjas** (4–6) | 5:00–5:30p | — | 5:00–5:30p | — |
| **Big Kids** (7–12) | 5:30–6:15p | 5:30–6:15p | 5:30–6:15p | 5:30–6:15p |
| **Teens & Adults** (13+) | 6:30p | 6:30p | 6:30p | 6:30p |
| **Uniform** | Gi | No-gi | Gi | No-gi |

Closed Fri–Sun. 13+ is a guide rather than a cutoff — where a teen
trains also depends on their size, so the programs copy says so instead
of stating a hard line the gym has to walk back at the door.

Everything on the page — day tabs, class counts, the rail panel, the
"what to bring" line, the visit strip, and the JSON-LD opening hours —
derives from `src/data/classes.ts`. Teens & Adults has no published end
time; add `end:` to those rows if the gym sets one.

The doors close at **21:00** (`CLOSES_AT`, confirmed 2026-08-01) — later
than the last class starts, which is why closing time is stated rather
than inferred from the timetable. Opening times still derive from the
first class of each night.

## Tests

```bash
npm test                                   # everything
npx playwright test tests/a11y.spec.ts     # accessibility only
npm run screenshots                        # regenerate the review set
```

75 tests, all passing:

- **Interaction** — day tabs re-render the list, arrow keys/Home/End
  move between them, the rail panel renders something distinct for each
  of the four days, anchors land just under the header and light the
  right nav link, the nav follows the section under the header while
  scrolling, in-page links leave no #fragment behind, focus follows the
  jump, the mobile menu opens and closes,
  every CTA is a working sms: deep link, and both map links target the
  business rather than the street address.
- **Accessibility** — axe-core at 320/390/768/1440 plus the open mobile
  menu. Zero WCAG 2.1 A/AA violations.
- **Images** — every photo decodes and fills its slot at four widths,
  after scrolling (everything below the hero is lazy).
- **Layout** — a sweep across 16 widths from 320 to 2560 asserting no
  horizontal scroll and nothing spilling past the viewport edge.

`npm run screenshots` writes full-page captures at those same 16 widths
into `screenshots/` (gitignored) for visual review.

## Stack

Every package sits on its current stable release — no pre-releases, no
pinned-back versions, nothing deprecated anywhere in the tree, 0
vulnerabilities.

| | Version | Notes |
| --- | --- | --- |
| React | 19.2.8 | |
| Vite | 8.1.5 | Rolldown (Rust) bundler |
| Tailwind | 4.3.3 | CSS-first config, no `tailwind.config.js` |
| TypeScript | 7.0.2 | The native Go compiler |
| Node | `^20.19.0 \|\| >=22.12.0` | Declared in `engines`; Vite is the constraint |

**Exactly three packages reach the browser: `react`, `react-dom`, and
`scheduler`.** No UI library, no icon library, no router, no
`react-helmet`. Everything else — Tailwind, sharp, Playwright, the
fontsource packages — is a devDependency that never ships.

Two of those majors are young enough to name explicitly. **TypeScript 7**
is a from-scratch reimplementation of the compiler in Go; here it only
type-checks (Vite/esbuild does the transpiling), so the blast radius is
small, but ecosystem tooling may lag it. **Vite 8** swapped Rollup for
Rolldown. Both are the registry's `latest`, both build clean. If either
ever bites, `vite@7.3.6` and `typescript@5.x` are the fallbacks.

`fsevents` install scripts are left **blocked** by npm 12's `allowScripts`
default. The cost is that macOS file-watching falls back to polling in
dev; the benefit is not running a native build script from a transitive
dependency. Deliberate — approve it only if HMR gets slow enough to care.

### Generated, not committed

`public/` is almost entirely build output — `npm run dev` and `npm run
build` regenerate it. Each script byte-compares before writing so repeat
runs are no-ops and the dev server's watcher stays quiet.

| Script | Produces |
| --- | --- |
| `npm run fonts` | `public/fonts/` — Latin woff2 + OFL licences, from the fontsource packages |
| `npm run brand` | `public/assets/spi-logo.png` (180px), `og-image.jpg` (1200×630) |
| `npm run seo` | `public/robots.txt`, `public/sitemap.xml` (plus `dist/llms.txt` at build) |
| `npm run images` | `public/img/` — responsive AVIF/WebP/JPEG |

The fonts used to be four committed binaries of unrecorded origin; now
the source of each is written down in `scripts/fonts.mjs` and a
fontsource bump picks up new builds automatically.

## Google Maps

Searching Maps for `134 S Shore Dr` resolves to the street parcel and drops
the pin on a neighbouring house. Both map links therefore target the business
listing itself, via `PLACE` in `src/data/site.ts`:

- **Get directions →** routes to the gym's own coordinates
  (`26.0738256, -97.2121702`) — never a guessed address match. Google
  resolves those to "SPI BJJ & Fitness LLC, 134 S Shore Dr" rather than
  showing raw numbers.
- **Reviews & photos →** opens the Google Business Profile by CID
  (`6663607025632879294`).

Both are labelled links. The profile link used to sit on the address
text itself, styled as a display heading — hover was the only hint it
was clickable, which does nothing on a phone, so in practice nobody
could find it. The address is plain text now.

The same coordinates and listing URL are in the JSON-LD as `geo` and
`hasMap`, and the profile's registered name (`SPI BJJ & Fitness LLC`) is
there as `legalName`/`alternateName` so Google links the page to the
listing. That entity match is worth more for local ranking than anything
else on the page.

## Tagline

"Roll like a wave" appears in two places: centred above the closing
"Your first class is on us." between two rules, and in the middle of the
footer. It's also the JSON-LD `slogan`. Set once in `SITE.tagline`.

It's rendered in **sand, not amber** — amber is reserved for the free-class
signal, and spending it on a tagline would blunt the one thing the page is
trying to get people to do.

## SEO

### No react-helmet — and why

Helmet manages the `<head>` **from JavaScript, per route**. This is one
page with one fixed set of tags, so there is nothing to swap; and the
page is prerendered, so tags written into `index.html` are already in
the HTML a crawler receives, with no JS involved. Helmet would move
them *later* in the pipeline for zero benefit, and `renderToString`
doesn't collect Helmet's output unless it's explicitly wired up. It
would be added risk for no gain. (The original `react-helmet` is also
effectively unmaintained; the fork is `react-helmet-async`.)

Add it only if this ever grows real routes.

### Why Vite and not Next.js

A plain Vite SPA ships an empty `<div id="root">`, which is genuinely
bad for crawlers — but the fix is a prerender step, not a framework.

`npm run build` runs the same React tree through `renderToString` and
injects the result into `dist/index.html` (`scripts/prerender.mjs`, ~30
lines, no extra dependency). The deployed HTML contains the headline,
the full schedule, the address and the instructor bio in the first
response — what a Next.js static export would produce.

### The default domain is the real one

`site.config.js` falls back to `https://spijiujitsuteam.com` — the
gym's actual domain, confirmed 2026-08-01 — so a build without a
`SITE_URL` environment variable still emits correct canonicals rather
than pointing somewhere nobody owns.

A build-breaking check briefly lived here, from when that fallback was
a placeholder. It's gone with the problem it guarded: a check that can
only produce false positives is friction, not safety. `SITE_URL` is
still what `.do/app.*.yaml` supplies, so a domain change stays a
platform setting rather than a code change.

### The domain lives in one place

`site.config.js` exports `SITE_URL`. A Vite plugin substitutes
`__SITE_URL__` in `index.html` (canonical, four Open Graph tags, three
JSON-LD fields) and `scripts/seo.mjs` uses it for `robots.txt` and
`sitemap.xml`. **Change it there and eight references follow** — it was
previously hard-coded in every one of them, which is eight chances to
ship a placeholder on launch day.

⚠️ It is still set to the placeholder `https://spijiujitsu.com`.

### What's in place

- Prerendered HTML — real copy in the first response
- `title`, `description`, canonical, Open Graph, Twitter card
- A 1200×630 `og:image` built from the hero frame (`scripts/brand.mjs`).
  It previously pointed at the square logo, which link previews crop badly
- JSON-LD as a connected `@graph`, not one isolated node: `WebSite` →
  `WebPage` → `SportsActivityLocation`/`SportsClub` → `Person`, wired by
  `@id`. Address, `geo`, `hasMap`, `sameAs`, per-day hours,
  `legalName`/`alternateName` matching the Google Business Profile,
  `areaServed`, the free-trial `Offer`
- A second `FAQPage` block, rendered by `src/components/Faq.tsx` from
  the same array as the visible answers and prerendered into the static
  HTML — never injected client-side, which most AI fetchers never see
- `robots.txt` + `sitemap.xml` + `llms.txt`
- Semantic heading order, alt text on every photo
- **The whole week in the first response.** All four day panels render;
  the three that aren't selected carry `hidden`. Previously only the
  selected day was in the tree, so the deployed HTML contained Monday
  and nothing else — three quarters of the timetable existed only as
  the result of a click, invisible to anything that reads raw HTML
- Core Web Vitals, measured on the production build:

| | Unthrottled | Fast 3G + 4× CPU |
| --- | --- | --- |
| LCP | 48 ms | **2292 ms** (good) |
| CLS | 0.0000 | 0.0162 (good) |
| Weight | 382 KB / 11 requests | same |

The logo arrived from the handoff at 1036×1037 and **462 KB** for a
40×40 slot — the heaviest file on the page, and React 19 auto-preloads
rendered images, so it was starving the hero photo (the LCP element) of
bandwidth. `scripts/brand.mjs` takes it to 13.5 KB; that single change
moved LCP from 2776 ms to 2292 ms and the page from 830 KB to 382 KB.

### What is not code, and matters more

Ranking for "jiu jitsu Port Isabel" is mostly won off the site:

1. **Google Business Profile** — claimed, category "Brazilian jiu-jitsu
   school", hours matching the site, real photos, website field set. The
   JSON-LD's `legalName` and `hasMap` CID are there to tie the page to
   that listing; the listing itself has to exist and be maintained.
2. **Reviews.** The local pack is heavily review-weighted. Nothing in
   this repo influences it.
3. **NAP consistency** — identical name, address, phone everywhere the
   gym is listed.
4. **Search Console + analytics** — not installed. Without them none of
   this is measurable.

### AEO / GEO — being cited, not just ranked

Answer engines lift *passages*, not pages, and most of their fetchers
read raw HTML without executing JavaScript. Two things follow, and both
are already true here: the page is prerendered, and the copy is written
in answers rather than atmosphere.

The `#faq` section is the deliberate part. Seven questions, each
answered in the first sentence, each self-contained enough to survive
being quoted with no surrounding context — which is why the answers
name "SPI Jiu Jitsu" and state the phone number rather than saying "we"
and "us". `src/data/faq.ts` is the single source for both the visible
section and the `FAQPage` markup; marking up a question that isn't on
the page is a structured-data violation, so they must not diverge.

It renders as a native `<details>`/`<summary>` accordion. An earlier
version refused to collapse, on the theory that hidden answers count
for less — over-cautious. Collapsed `<details>` content is in the DOM
and in the prerendered HTML, which is what crawlers and AI fetchers
read, and a test asserts exactly that by matching every marked-up
answer against the section's `textContent` while most rows are shut.
Native disclosure also arrives keyboard-operable, announced correctly,
and working without JavaScript — all things a hand-rolled accordion
has to reimplement and usually gets wrong.

`llms.txt` is written to `dist/` by `scripts/prerender.mjs` from the
same schedule and FAQ modules. Treat it as an **emerging convention,
not a standard** — it is cheap and carries no downside, but nothing has
established that anything ranks or cites differently because of it.
Don't let anyone sell it to you as a ranking factor.

`robots.txt` currently allows every crawler, including `GPTBot`,
`ClaudeBot`, `PerplexityBot`, `Google-Extended` and `CCBot`. That is a
deliberate policy position, not an oversight: blocking them protects
content from training use but also removes the site from the answers
those assistants generate. For a gym that wants to be recommended when
someone asks an assistant for jiu jitsu near South Padre Island, being
readable is the point. Revisit only if the gym's view changes.

Measurement here is genuinely fuzzier than classic SEO — there are no
rank positions. What can be done: watch analytics for referrals from
assistant hosts, watch server logs for the AI user agents above, and
periodically ask the major assistants "where can I train jiu jitsu near
South Padre Island?" to see whether the site is cited and whether the
answer is accurate. Anyone quoting precise numbers for this channel is
guessing.

### Known limits

- **One page caps long-tail reach.** A competitor with separate adults,
  kids and schedule pages can rank for more queries than a single page
  can. Fine for now; revisit if you want "kids bjj Port Isabel" and
  similar as their own entry points.
- **English only.** The Rio Grande Valley is heavily bilingual — Spanish
  content is a real, unexploited opportunity here.
- **No favicon set beyond the PNG.** Works, but an `.ico` and a web app
  manifest would be more complete.

### The clock and the prerender

`today` is resolved in an effect (`src/hooks/useToday.ts`), not during render.
If it were read during render, the build would bake whatever day the build ran
on into the static HTML. First paint shows Monday; the real day lands on
hydration.

## Analytics

GA4, with the measurement plan in **[docs/measurement-plan.md](docs/measurement-plan.md)** —
the event table, the GA4 property setup checklist, the funnel to build,
and an honest list of what the data cannot tell you. Read that before
trusting a number.

### Switching it on

The property is live: measurement ID `G-62T44XVCE1`, already set in
`.do/app.prod.yaml` alongside `SITE_URL`. To reproduce a production
build locally:

```bash
GA_MEASUREMENT_ID=G-62T44XVCE1 npm run build
```

Don't make that a habit — it writes into the real property. **Unset is a
first-class state**: no tag is fetched and nothing leaves the browser,
which is what dev and preview builds want. A malformed ID throws rather
than silently disabling — a typo otherwise looks exactly like working
analytics until someone asks why the reports are empty a month later.

### Seven events, and the decision each one drives

| Event | Drives |
| --- | --- |
| `cta_text_click` | **The conversion.** Which CTA placement earns contact. |
| `outbound_click` | Directions clicks — the strongest non-contact intent signal. |
| `section_view` | Which sections are ever reached. |
| `scroll_depth` | Is the page too long. |
| `schedule_day_select` | Which night people research → staffing, promotion. |
| `faq_open` | What people are unsure about before committing. |
| `nav_click` | Whether the nav earns its place. |

The brief was "track everything". That was pushed back on, and the
reasoning is in the plan: every extra event dilutes the reports and
makes the numbers that matter harder to find. An event earns its place
only if a decision changes based on it.

### Two design decisions worth knowing

**Clicks are delegated, and location comes from the DOM.** One listener
on `document`; a CTA's `cta_location` is resolved from its nearest
`section[id]`, or an explicit `data-analytics-location` for the few
places the DOM can't name (the sticky bar, the mobile menu, the hero,
the closer, the schedule rail). A button added anywhere is therefore
instrumented the moment it exists — nobody has to remember to tag it,
which is how hand-tagged analytics always rots.

**The tag is deferred to browser idle** (or the first interaction,
whichever lands first) to protect an LCP measured at 2292 ms on Fast 3G
against a 90 KB script. The cost: someone who leaves within a second or
two is never counted, so sessions read a little low and engagement
quality a little high. Deliberate, and written up in the plan.

### The FAQ event is measured from a click, not a toggle

`<details>` fires `toggle` on hydration for the item that renders open.
Bound to `onToggle`, `faq_open` logged an open nobody performed in every
single session, and question one would have looked permanently the most
asked — corrupting the exact diagnostic the event exists for. It is
measured from the summary's click instead, where `open` still holds its
pre-toggle value. Keyboard is covered: `<summary>` synthesises a click
for Enter and Space. A test pins this.

### No personal data, ever

Names, phone numbers and email addresses in GA are a Terms of Service
violation that gets properties deleted, not warned. A test asserts no
event payload matches a phone or email pattern.

## Security

Reviewed 2026-07-31. The attack surface is small by construction: a
static page with no backend, no forms, no user input, no auth, no
cookies, no analytics and no third-party requests at runtime.

### Verified clean

| Check | Result |
| --- | --- |
| `npm audit`, prod and dev | 0 vulnerabilities |
| Packages reaching the browser | 3 — `react`, `react-dom`, `scheduler` |
| Secrets / keys / `.env` committed | none |
| XSS sinks (`dangerouslySetInnerHTML`, `innerHTML`, `eval`) | none in `src/` |
| `target="_blank"` without `rel="noopener"` | 0 of 2 |
| Source maps in `dist/` | none |
| Inline event handlers | 0 |
| EXIF / IPTC / XMP in the 59 published images | 0 — sharp strips it |
| GPS in source photo EXIF | none |

### Fixed in review

**`SITE_URL` was an HTML injection vector.** It is interpolated into
the canonical link, four Open Graph tags and three JSON-LD fields. A
value containing a quote escaped the `href` attribute — a hostile
value injected **seven `<script>` tags into `<head>`** and left the
JSON-LD unparseable.

Reaching it needs build-environment access, which is already
privileged, so the realistic risk was the accidental case: one stray
character in a pasted URL silently corrupting the structured data with
no error. `site.config.js` now validates down to a bare origin and
**throws**, failing the build rather than shipping something mangled.

**Builds no longer run dependency install scripts.** Both app specs use
`npm ci --include=dev --ignore-scripts`, so a compromised package can't
execute code on the build machine. Verified the build still succeeds —
sharp ships prebuilt binaries rather than compiling.

### Accepted risk: no security headers

App Platform static sites cannot set response headers. Verified against
DigitalOcean's API — the schema rejects the field outright:

```
static_sites[].headers   → unknown field "headers"
ingress.rules[].headers  → unknown field "headers"
```

So there is no CSP, `X-Frame-Options`, `Referrer-Policy` or HSTS beyond
whatever DigitalOcean sets by default.

**The one that matters here is clickjacking.** This page exists to make
someone dial one number. Nothing stops a third party framing it and
overlaying a different number to intercept leads. It is cheap to do and
would be hard to notice.

Options, in order of preference:

1. **Front the app with Cloudflare** (free tier). Transform Rules set
   `Content-Security-Policy`, `X-Frame-Options: DENY`,
   `Referrer-Policy` and HSTS. This is the real fix.
2. **Accept it.** A single-location gym is a low-value target and the
   payoff for an attacker is small.

A JavaScript frame-buster was considered and rejected: `sandbox` on the
iframe defeats it, and it would put security theatre on the critical
path.

If a CSP is ever added, note the page needs `style-src 'unsafe-inline'`
— eight inline `style` attributes come from image `object-position` and
the class-row accent bars. `script-src` needs no `unsafe-inline`; the
only inline block is `application/ld+json`, which is data.

### Not a code issue, but the highest-impact risk

**The site publishes identifiable photographs of children.** Two of the
six images are of children, and the kids card is now a close crop of
one child's face at a tournament. Confirm the gym holds photo releases
from every parent whose child is recognisable, and that they cover web
use. This is worth more attention than anything above.

## Deploying (DigitalOcean App Platform)

Two environments off two branches:

| | Branch | Spec | Indexable |
| --- | --- | --- | --- |
| Production | `main` | `.do/app.prod.yaml` | Once `SITE_NOINDEX` is removed |
| Dev | `dev` | `.do/app.dev.yaml` | Never |

```bash
doctl apps create --spec .do/app.prod.yaml
doctl apps create --spec .do/app.dev.yaml
```

Or in the UI: **Create App → GitHub → this repo**, then set the
resource type to **Static Site** and fill in:

| Field | Value |
| --- | --- |
| Build Command | `npm ci --include=dev && npm run build` |
| Output Directory | `dist` |
| Catchall Document | *leave empty* |

Build-time environment variables: `NODE_VERSION=22`,
`SITE_URL=${APP_URL}`, `SITE_NOINDEX=true`.

### Three things that will bite otherwise

**Static Site, not Web Service.** The build emits plain files — no
server, no API, no runtime. App Platform often guesses Web Service,
which costs ~$5/mo to run a container doing nothing a CDN can't. Static
sites are free for the first few.

**`--include=dev` in the build command.** Every build tool — Vite,
Tailwind, sharp, TypeScript — is a devDependency, and buildpacks
commonly set `NODE_ENV=production`, which makes npm skip them. Verified:
with dev dependencies omitted, neither `vite` nor `sharp` resolves and
the build fails with `vite: not found`.

**Leave Catchall Document empty.** It rewrites unknown paths to
`index.html`. Right for a client-side router, wrong here — it would
return 200 for `/anything` and manufacture soft 404s.

### Going live

Add the domain under Settings → Domains, point DNS at DigitalOcean
(TLS is automatic), then **delete `SITE_NOINDEX` from the production
app** and redeploy. `SITE_URL` tracks `${APP_URL}`, so the canonical
link, Open Graph tags, JSON-LD and `sitemap.xml` all follow with no
code change.

Leave `SITE_NOINDEX` on dev permanently.

### Everything under `public/` is generated

Nothing in `public/` is committed — `prebuild` regenerates fonts, brand
assets, `robots.txt`, `sitemap.xml` and the responsive images from the
sources in `assets/`. Verified against a clean checkout: 52 tracked
files in, a complete 70-file `dist/` out.

## Where things live

```
assets/photos/          Original photography (source of truth)
scripts/images.mjs      Photo pipeline — crops, resizes, AVIF/WebP/JPEG
scripts/prerender.mjs   Bakes the rendered page into dist/index.html
src/
  data/site.ts          Business data — phone, address, record-band flag
  data/classes.ts       The ten classes. Edit the schedule here and nowhere else
  hooks/useToday.ts     Current day, or null Fri–Sun
  hooks/useSchedule.ts  All derived state: tabs, class list, day summary, note
  components/           One file per section, in page order
  data/faq.ts           The seven answers — feeds the #faq section AND its JSON-LD
  components/StructuredData.tsx  All schema.org markup, derived from the two files above
  components/Picture.tsx  Responsive <picture> over the generated derivatives
  generated/images.json   Written by the photo pipeline — don't edit by hand
  index.css             Design tokens (@theme) — every colour and type size
```

Two files cover almost all routine edits:

- **Class times change** → `src/data/classes.ts`
- **Phone, address, instructor** → `src/data/site.ts`
- **A social profile, or real pricing** → `SOCIAL_PROFILES` / `PRICING`
  in `src/data/site.ts`. Both flow straight into the JSON-LD and (for
  pricing) the FAQ — one line each, no markup to hand-edit.

Everything else — the day tabs, class counts, the rail panel, the
"3 classes today" note, the SMS deep links, the JSON-LD hours — derives from
those two.

## Deviations from the handoff

Everything is per spec except the following, all deliberate.

### 1. Three colours changed for contrast (WCAG AA)

Three spec colours fail AA for small text and were adjusted. Hue preserved in
every case; the change is not noticeable side by side. The third was caught by
axe-core, the other two by hand.

| Token           | Spec      | Shipped   | Contrast            | Used by                     |
| --------------- | --------- | --------- | ------------------- | --------------------------- |
| Amber-on-amber  | `#5A4415` | `#4A3811` | 4.08:1 → **4.97:1** | Active day tab sub-labels   |
| Faint (as text) | `#5A6B85` | `#72829D` | 3.44:1 → **4.73:1** | Day note, footer            |
| Amber on blue   | `#E2A03F` | `#EFBB6A` | 3.73:1 → **4.79:1** | Coach section kickers       |

Amber stays the signal colour everywhere — only its value on brand-blue
surfaces changes. `#5A6B85` is kept exactly as specced for non-text
decoration. Revert any of them in `src/index.css` if the brand insists, but
all three currently fail AA.

### 2. Mobile (the prototype was desktop-only at 1360px)

Built to the handoff's suggested behaviours: display type scales fluidly via
`clamp()` (hero 142px → 56px floor), the hero's amber phone card goes
full-width, day tabs stay 4-across, the rail drops below the class rows, class
rows go time-over-name with a full-width claim button, and both program cards
stack.

Added per your call: a **sticky bottom "Text for a free class" bar** below
`lg`. Below `lg` the header collapses its nav into a disclosure menu and drops
its own amber CTA, so there's only ever one amber CTA on screen at a time — the
bottom bar. `MobileCtaBar.tsx`; the page wrapper in `App.tsx` carries matching
bottom padding so it can never cover the footer.

### 3. Header layout

The handoff's header is three groups under `justify-between`. That
centres the middle group between the two side groups, not against the
page — and because the brand cluster (300px) is wider than the CTA
(164px), the nav sat **68px off the viewport centre at every width**.

It's a `1fr auto 1fr` grid now, so the nav is centred against the page
(measured: 0px off at 1360/1440/1920/2560). Horizontal padding also
moved from 40px to 48px to match the sections, so the logo lines up with
their content instead of missing by 8px.

Two additions: the logo gets a faint ring (a dark navy mark on a
near-black bar was dissolving into it), and the nav highlights the
section you're currently reading via a scroll listener in
`useActiveSection`. Both the text colour and an amber underline change,
so the current item isn't signalled by colour alone.

### 4. Accessibility additions

- Day tabs are a real ARIA tablist with a roving tabindex — arrow keys, Home,
  and End move between days instead of four separate tab stops.
- A "Skip to the schedule" link, 44px minimum touch targets throughout
  and `prefers-reduced-motion` honoured on smooth scrolling.

### 5. Anchor scroll offset

**There is exactly one scroll offset: `scroll-padding-top` on `<html>`
in `src/index.css`.** Do not add `scroll-mt` to sections — the two
compound rather than override. Having both put every anchor 140px down
instead of ~80px, which left a visible gap under the header and kept
the nav's active indicator one section behind on every click.

`useActiveSection` reads that CSS value at runtime instead of keeping
its own copy, so the highlight can't drift away from where anchors
actually land. Change the offset in one place and both follow.

### 6. Clean URLs on in-page links

In-page anchors would normally leave `/#schedule` in the address bar.
The client didn't want that, so `src/lib/anchors.ts` intercepts the
click, scrolls, and drops the fragment with `history.replaceState`.

Calling `preventDefault` on a fragment link removes three browser
behaviours that have to be reproduced by hand, and the handler does all
three — miss any one and it's a regression:

1. **Scroll** honouring `scroll-padding-top` (via `scrollIntoView`).
2. **Focus** into the target. Without it the view jumps but tab order
   stays at the header, which strands keyboard and screen-reader users.
   The section is made focusable only long enough to receive focus.
3. **Reduced motion** — checked in JS, since an explicit `behavior:
   'smooth'` would otherwise override the CSS media query.

Modified clicks (cmd/ctrl/shift/middle) are left to the browser so
"open in new tab" still works.

**Trade-off, accepted by the client:** deep links like
`/#schedule` no longer survive, and the back button won't step through
in-page jumps. Arriving on an old `/#coach` link still scrolls
correctly — the URL is tidied afterwards, not before.

### 7. Kids / coach stacking order

Below `lg` the coach photo is `order-2`, so the section reads copy then
photo while every other stacked section reads the other way round.
That's deliberate. In DOM order the coach photo lands directly beneath
the kids-class photo from the section above — measured at **1px apart
across the full viewport width**, 520px of unbroken photography that
read as one confused block rather than two sections. Putting the blue
copy panel between them separates them by ~600px.

At `lg` the order reverts and the photo returns to the left column,
where it sits diagonally opposite the kids photo (they never overlap
horizontally — measured −72px at 1440).

### 8. The schedule rail

The handoff specced the amber rail panel as a recommendation resolved
in priority order: a beginner class if one runs that day, else a kids
class, else the first class. With the real schedule the teens-and-adults
class is beginner-friendly on all four nights, so the first branch
always won — the panel was permanently stuck on it and the other three
branches were unreachable. It also repeated the "beginners welcome" row
sitting immediately to its left.

It now shows what actually varies night to night: **gi or no-gi**, how
many classes run, and when the first one starts. A test asserts all
four days render a distinct panel.

### 9. Record band

`#record` is built and left disabled behind `SHOW_RECORD_BAND` in
`src/data/site.ts`, per the handoff. The 24/9/14/6 numbers in there are the
design's placeholders and were never verified. **Do not flip that flag until
the gym supplies real season results.**

### 10. The women's section

`#women` is not in the handoff. It sits between the programs cards and
the kids section, and it exists because a woman deciding whether to
walk into a grappling gym is weighing a different set of questions than
anyone else on the page, and none of the other sections answer them.

Two things about it are load-bearing:

**It argues from the art, not from adjectives.** Jiu jitsu assumes the
other person is bigger and stronger — that is a property of the art and
safe to state. "Empowering", "supportive" and "safe space" are what
every gym writes and none of them survive contact with a first night.
The section says concrete things instead, which is also why they have
to be true.

**Some of those concrete things are gym policy, not facts we can
verify from the outside** — see "Still open with the client". They sit
in `assurances()` in `src/components/Women.tsx`, deliberately together
in one place so Thomas can confirm or correct them at once. A woman who
reads "you spar when you decide to" and then gets pushed into sparring
on her first night is worse off than if the page had said nothing, so
this is not a claim to leave unconfirmed.

The first row of that list — the class name, days and time — is the
exception: it derives from `classes.ts` and can't drift. Facts belong
in the list, not in the paragraphs. An earlier draft opened the second
paragraph with "You'd train in Teens & Adults at 6:30p", which put a
scheduling detail where the persuasion should be and pushed the
argument further down the page.

The photograph needed a crop of its own. The original is a 1.5:1
tournament frame with the referee dead centre; dropped into the
section's portrait slot, `object-cover` kept the middle and produced a
section about women showing a man's back. It's now cropped hard right
to the raised hand and the SPI patch, at ~0.96:1, and the slot is
taller on mobile than the other section photos so the letterbox takes
its cut out of the spectators rather than off the top of the hand.

## Photography

All six slots are filled with real photos. Originals live in
`assets/photos/`; `scripts/images.mjs` turns them into responsive AVIF +
WebP + JPEG derivatives in `public/img/` (gitignored, regenerated before
`dev` and `build`).

| Slot | Source | Notes |
| --- | --- | --- |
| Hero | `recon-spi-united-group` | Low-light team shot with the belt. Dark floor sits under the headline. |
| Teens & adults card | `carlos-seminar-rolls` | Gi drilling. |
| Kids card | `kids-class` | The class lined up, trimmed to a 3.27:1 band. |
| Kids section | `kids-podium` | Top step of the podium. Cropped to the SPI athlete alone. |
| Women section | `women-hand-raised` | Hand raised after a tournament win. Cropped hard right — see below. |
| Coach | `thomaas-coaching` | Thomas cornering a student; cropped in the pipeline. |

### The two tournament photos, and the one that isn't used

The `#kids` section is the podium shot (`kids-podium`), cropped to the
SPI athlete alone. Two reasons beyond composition: the full frame
carries two children from other academies, who are not the gym's to
publish — and the untrimmed banner reads "SAVAGE" in graffiti behind a
section whose copy promises no yelling. Cropped to 1.51:1, it lands in
the ~1.57:1 slot almost uncropped, and at 2048px wide the source
downscales rather than stretching.

It replaced `kids-class`, the class lined up with its coaches — a
documentary group shot where the headline ("Confidence they can't be
talked out of") asks for one face. `kids-class` did not leave the site;
it moved to the Kids **card**, which suits it far better. A row of
people is a horizontal composition and that card is a ~3:1 letterbox,
so trimming the line-up to the band from heads to feet (3.27:1) fills
the slot with no dead space.

What it displaced there was `kids-mat` — two kids drilling, a square
subject in a 3:1 hole. Cropped to fit, it rendered as a field of empty
grey mat with the pair pushed into the right third and a stranger's
head cut off at the left edge. The lesson generalises: **match the
subject's natural composition to the slot's aspect** before reaching
for a crop. `kids-mat.jpg` is still in `assets/photos/`, unused.

Between them the two kids photographs now split the work: the card says
"here is the class", the section says "here is what it does for one of
them".

**Known deviation:** the banner behind her is red, which is not in the
Isla Noche palette and is the most saturated thing on the page. It was
accepted, not overlooked — a smiling child on a podium is the strongest
image a kids programme can show a parent, and the gold gi trim happens
to sit close to the amber. If the palette discipline matters more than
the photograph, `kids-class` is one entry away.

`assets/photos/kids-hand-raised.jpg` is a third tournament photo, not
used. It was tried in the Kids card and pulled: the card is a ~3:1
letterbox and the photograph is a vertical moment — an arm going up.
Cropping to that shape decapitated the coach and shrank the child to a
sixth of the frame, and at 640px wide it went visibly soft beside a
sharp neighbour. It fits the #kids slot, but the podium shot is better
there and the women's section above is already a hand-being-raised
photograph.

### Adding or changing a photo

1. Drop the original in `assets/photos/`.
2. Add an entry to `IMAGES` in `scripts/images.mjs` (with an optional
   `crop` in source pixels to trim dead space before resizing).
3. Reference it by id: `<Picture id="my-photo" alt="…" sizes="…" />`.

`npm run images` regenerates; `npm run images -- --force` rebuilds
everything. Sizes and intrinsic dimensions flow through
`src/generated/images.json`, so every `<img>` carries `width`/`height`
and the layout doesn't shift as photos load. Only the hero is `eager`;
the rest lazy-load.

### Font loading

Big Shoulders Display is condensed — **66.9%** the width of Arial at the
same size, set uppercase. Any moment spent in a fallback is therefore
very visible at the hero's 142px.

Three things together:

1. **Self-hosted with stable filenames** (`public/fonts/`, Latin subset,
   declared in `src/index.css`). `@fontsource` package imports get
   Vite-hashed URLs, and a hashed URL can't be named in a preload.
2. **Preloaded** from `index.html`, so the fonts fetch in parallel with
   the stylesheet instead of waiting for it to parse. This is the part
   that actually fixes it.
3. **Metric-matched fallback faces** as a safety net for slow
   connections. Note the weight ranges — without them the faces resolve
   regular-only and a request for weight 800 gets synthetically
   emboldened, which widens the text and defeats the match.

Measured on the production build:

| Connection | Fallback frames | Result |
| --- | --- | --- |
| Normal / cached | **0 of 480** | Display font at first paint, no swap |
| Fast 3G | 77 of 656 (to 1.27s) | One swap, then stable |

**`font-display: optional` was tried and rejected.** It removes the swap
completely, but on a cold cache it skips the webfont for the whole load
and the entire page renders in generic sans — the condensed face *is*
the design. `swap` plus preload is the right trade.

If you change a font family, re-measure — the numbers are specific to
these faces. They were measured in headless Chromium, whose `Arial` is a
substitute, so the fallback match on a real Mac is approximate. That only
affects the brief slow-connection case.

### Still wanted

- **A gi portrait of Thomas.** The coach section currently uses a
  tournament-corner shot of him in street clothes. It's authentic and it
  works, but a gi portrait is what the design asked for. The warm golds
  in that photo also sit awkwardly against the brand-blue panel.
- **A coach-teaching-a-kid shot.** Would be a stronger kids-card image
  than the cropped drilling pair.

The gym logo is at `public/assets/spi-logo.png`.

## Copy rules

- **The gym does not lend gis.** Earlier copy claimed it did, in the
  schedule rail and the claim confirmation. Both are gone. Do not reintroduce
  it. On no-gi nights the rail states the kit exactly; on gi nights it
  defers to the gym ("text us about what to wear") because a
  first-timer's gi options are the gym's call, not ours.
- **Amber means "free class" and nothing else.** The tagline is sand for
  this reason.
- **Never say "on the island."** Port Isabel is not South Padre Island.
- Belt rank appears in the lineage block only. The instructor bio leads
  with what he does, not his rank.
- **The schedule carries no CTAs.** Class rows are informational. A
  control on every time slot made it read as a booking form. The single
  "Text to claim any class" panel in the rail is the conversion point
  for that section — don't add per-row buttons back.
- **The programs cards don't list times.** The full schedule is directly
  above them; repeating it made the two sections read as the same
  content twice. The cards describe what each program is like.
- **Every CTA sends the same generic message.** `SMS_BODY` in
  `src/data/site.ts`, one value, used by all of them.
- **The women's section promises nothing the gym hasn't agreed to.** It
  earns its place by being specific, which means every specific in it
  has to hold on a Tuesday night. If a claim can't be confirmed, cut it
  rather than softening it into the usual adjectives — vague copy is
  useless there, but wrong copy is worse than useless.
- **"One class" is the motif, and it recurs on purpose.** The hero
  offers it, the coach section opens with Thomas taking one in 2020,
  and it closes the same section: "It starts the way his did: one
  class." His origin story and the reader's offer are the same thing —
  that's the page's one piece of real persuasion, so don't paraphrase
  it into "a day on the mat" or "a trial session" and break the echo.
- **Headlines carry the argument, not the body copy.** The hero H1 was
  "Train jiu jitsu in Port Isabel" and the programs H2 was "Who's
  training?" — a label and a rhetorical question, in the two largest
  type sizes on the page, while every persuasive line sat in 17px body
  text. Both are imperatives now. If a headline here can be swapped for
  a section label without losing anything, it isn't earning its size.
- **No age is a hard cutoff.** 13+ for teens and adults is a guide;
  where a teen trains also depends on size. Copy that states the band
  should leave room for the gym to place them.

## Still open with the client

1. **What a first-timer wears on a gi night.** The rail currently says
   "text us about what to wear" because the gym doesn't lend gis and we
   don't know the actual answer. One sentence from Thomas replaces it.
2. **The assurances in the women's section.** `assurances()` in
   `src/components/Women.tsx` states that a visitor may watch a class
   instead of training, that nobody is put into sparring before they
   choose to, and that Thomas is on the mat every class. The last is
   established elsewhere on the site; the first two are normal gym
   practice but were written by us, not confirmed by the gym. **Get a
   yes on both, or cut them.** They are the reason the section is worth
   anything, and the reason it could do harm if it's wrong.
   The body copy also says nobody will "throw you in with the biggest
   guy in the room" on a first night — same question, same answer
   needed.
3. **Whether the athlete in the tournament photo is happy to be the
   face of that section.** She's identifiable. The site already needs
   photo releases for the kids images; this is the same question for an
   adult who can answer it herself.
4. **A canonical Facebook URL.** `SOCIAL_PROFILES` in
   `src/data/site.ts` currently carries the share link the gym
   supplied (`facebook.com/share/1BZw6GmxyB/`) with its tracking query
   string stripped. That resolves, but `sameAs` is an identity claim
   and a share redirect is a weaker one than `facebook.com/<pagename>`.
   Swap it when the page's own address is to hand.

5. **The camera original of the tournament photo.** The supplied file is
   640px wide, which is why it isn't on the site — see Photography,
   "The tournament photo that isn't used". Drop the full-resolution
   version over `assets/photos/kids-hand-raised.jpg` and it's worth
   another look, though its shape still argues against the Kids card.
6. Real season results, before the record band can be enabled.
7. **A gi portrait of Thomas** — see Photography.
8. **Is "purple belt" still current?** It came from the handoff's
   verified-data section, but ranks change and it's now only in the
   lineage block.

Answered 2026-08-01 and now in the code: the live domain
(`spijiujitsuteam.com`), the Instagram and Facebook profiles, the 21:00
closing time, and membership pricing — which the gym deliberately does
not publish, because Thomas goes through the options with people in
person. The FAQ says exactly that rather than deflecting with "text us
for rates", and there is no membership `Offer` in the structured data
for Google to render a price from.
