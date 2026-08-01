# Measurement plan — SPI Jiu Jitsu

The analytics design for a one-page site whose only conversion is a text
message. Written before the instrumentation, and the reference for
whoever configures the GA4 property.

**Status:** plan agreed, implemented. See "What lives where" for the code.

---

## 1. The one question

> Of the people who land on this page, how many end up contacting the
> gym — and what did the ones who did do differently from the ones who
> didn't?

Everything below exists to answer that. An event that doesn't help
answer it, or doesn't change a decision someone would actually make,
isn't in the plan.

## 2. What we are NOT tracking, and why

The brief was "we need to know everything". That is the wrong target,
and worth saying plainly: every extra event dilutes the reports, adds
a dimension nobody reads, and makes the numbers that matter harder to
find. Deliberately excluded:

| Not tracked | Why |
| --- | --- |
| Mouse movement, hover, heatmaps | Different tool (Clarity/Hotjar). GA4 models it badly and it drives no decision here. |
| Every scroll position | Quartiles answer "is the page too long". Pixel data does not. |
| Individual image views | No decision follows. |
| Time on each section | GA4's engagement time is already a better version of this. |
| Anything identifying a visitor | Names, phone numbers, and email in GA are a **Terms of Service violation** and get properties deleted. Never send them. |

## 3. The journey, and where each event sits

A single page has no page-path funnel — there is only one URL. The
journey is therefore reconstructed from scroll and interaction, which
is precisely why `section_view` carries so much weight here.

```
 arrive ─► orient ──────► engage ─────────► intend ──► (offline)
   │         │                │                │           │
page_view  scroll_depth   faq_open        cta_text_click   Thomas's
session_   section_view   schedule_day_   outbound_click   phone
 start                     select          (directions)
                          nav_click
```

## 4. The events

Seven custom events. GA4 also collects `page_view`, `session_start`,
`first_visit`, `user_engagement` and its own 90% `scroll` automatically —
those are not re-implemented.

| Event | Parameters | The decision it drives |
| --- | --- | --- |
| `cta_text_click` | `cta_location`, `cta_label`, `link_type` | **The conversion.** Which CTA placement actually earns contact — so you move, duplicate or delete the ones that don't. |
| `outbound_click` | `destination`, `outbound_url` | A directions click is the strongest non-contact intent signal on the site: they are working out how to drive there. |
| `section_view` | `section_id`, `section_index` | Which sections are ever seen. A section nobody reaches gets moved up or cut. |
| `scroll_depth` | `percent` (25/50/75/100) | Is the page too long? Where does attention die? |
| `schedule_day_select` | `day`, `class_count` | Which night people research. Feeds staffing and which class to promote. |
| `faq_open` | `faq_question` | **The highest-value diagnostic here.** What people are unsure about before committing. A question opened far more than the rest should be answered higher up the page — or signals something missing from the offer itself. |
| `nav_click` | `nav_target`, `nav_source` | Whether the nav earns its place, and what people go looking for. |

### Key events (GA4's term for conversions)

Live in **Admin → Data display → Events**, on the "Key events" tab.
Google merged the old standalone Key events page into this one; there is
no "New key event" button to look for.

**The simplest route is to wait for data**: once the site is deployed
and traffic has arrived, open the "Recent events" tab and click the star
beside `cta_text_click`. A key event does nothing until events exist.

To register it in advance, use **Create event**, and note the trap in
that dialog. It offers two modes:

- *Create without code* — manufactures a **synthetic** event from a
  trigger. Naming one after an event the code already sends produces a
  duplicate that fires on the chosen trigger *as well as* the real one.
  Pointing `cta_text_click` at `page_view` would have counted every
  visitor as a conversion.
- *Create with code* — registers the name and expects the site to send
  it. **This is the correct one here.** The tell is that the trigger
  fields vanish; if they are still on screen, the wrong mode is
  selected.

**`cta_text_click`** — the goal. Configure it:

- **Default value: none.** A placeholder like $1 puts fictional money in
  the Revenue column that someone will later read as real. The version
  worth setting is `average membership value × the share of texts that
  become members` — a real number, once the gym knows it.
- **Counting: once per session**, deliberately against GA's "once per
  event" default. One undecided visitor may tap the header CTA, then the
  FAQ's, then the sticky bar — three clicks, one intention. Counted per
  event the conversion number reads triple, and the only ratio that
  matters (GA conversions against texts actually received) becomes
  meaningless. Per session it means "sessions where someone tried to
  make contact", which is directly comparable to Thomas's phone. Nothing
  is lost: raw `cta_text_click` events with every `cta_location` remain
  in the Events report.

**Directions clicks** are the sensible secondary, but `outbound_click`
must *not* be marked as a key event — it also fires for Instagram and
Facebook, so social browsing would count as a conversion. A filtered
subset cannot be marked directly; it needs a synthetic event, which is
the legitimate use of Admin → Events → "Create event":

    Event name           directions_click
    Mark as key event    on
    Matching conditions  event_name equals outbound_click
                         destination equals directions

Only possible **after real traffic has arrived** — `outbound_click` does
not appear in that screen's dropdown until GA has seen it. Optional;
`cta_text_click` is the conversion that matters.

## 5. Custom dimensions to register

GA4 will not report on an event parameter until it is registered as a
custom dimension. **Nothing below appears in reports until this is done**
(Admin → Custom definitions → Create custom dimension), all event-scoped:

`cta_location`, `cta_label`, `link_type`, `destination`, `section_id`,
`day`, `faq_question`, `nav_target`, `nav_source`, `percent`

Ten of the fifty event-scoped dimensions a free property allows.

## 6. GA4 property setup checklist

1. ~~Create the property and data stream.~~ **Done.** Measurement ID
   `G-62T44XVCE1`, stream `15362035876`.
2. ~~Set `GA_MEASUREMENT_ID`.~~ **Done** — it is in `.do/app.prod.yaml`,
   and deliberately absent from `app.dev.yaml` and local builds so the
   property fills with visitors rather than with us.

   **Do not also paste Google's copy-paste snippet into `index.html`.**
   `src/lib/analytics.ts` already loads the tag; a second `config` call
   doubles every page_view and there is no way to tell the halves apart
   afterwards.
3. Register the ten custom dimensions above.
4. Mark `cta_text_click` as a key event.
5. **Exclude internal traffic** — Admin → Data streams → Configure tag
   settings → Define internal traffic, using the gym's own IP. Without
   this, Thomas checking his own site is a meaningful share of traffic.
6. Set data retention to **14 months** (Admin → Data settings). The
   default is 2 months and it is not retroactive.
7. Link Search Console, so query data and behaviour sit in one place.
8. Leave Google Signals **off** initially. It adds demographics but also
   a privacy surface, and thresholds data in small properties — which
   this will be.

## 7. The funnel to build

GA4 → Explore → Funnel exploration:

```
session_start
  → section_view (section_id = schedule)
  → section_view (section_id = programs)
  → cta_text_click
```

Add `section_view (section_id = faq)` as a step to see whether reading
the FAQ helps or hurts conversion. That is a genuinely useful A/B-free
experiment on copy that already exists.

## 8. What this data cannot tell you

Read this section before trusting any number in it.

**A text click is not a text sent.** `sms:` opens the messaging app
pre-filled. Whether the visitor pressed send is invisible to the
browser. `cta_text_click` measures *intent*, and will always overcount
actual contact. **The source of truth is Thomas's phone.** Reconcile the
two monthly; the ratio between them is itself a useful number, and once
you know it you can forecast from GA.

**Fast bounces are undercounted.** The tag is deferred until the browser
is idle, to protect the LCP this site was carefully tuned for. Someone
who leaves within a second or two is never recorded. Effect: sessions
read slightly low, and engagement quality reads slightly high. The
trade was deliberate — see the README.

**Ad blockers.** Typically 10–30% of traffic blocks GA entirely, and it
is not a random 10–30%. Treat all totals as a floor, and trust *trends
and ratios* over absolute counts.

**Returning visitors look new.** Safari caps script-set cookies at 7
days, so a visitor returning after a fortnight counts as new. "New vs
returning" is unreliable on iOS, which is most of this audience.

**Small numbers are noisy.** A local gym might see a few hundred
sessions a month. A jump from 4 conversions to 7 is not a 75%
improvement, it is three people. Look at quarters, not weeks.

## 9. What lives where

| Concern | File |
| --- | --- |
| Measurement ID resolution + validation | `site.config.js` |
| Build-time injection | `vite.config.ts` (`__SPI_GA_ID__`) |
| Loader, consent defaults, event API | `src/lib/analytics.ts` |
| Delegated clicks, section views, scroll depth | `src/hooks/useAnalytics.ts` |
| Day-tab selection | `src/hooks/useSchedule.ts` |
| FAQ disclosure | `src/components/Faq.tsx` |
| Coverage | `tests/analytics.spec.ts` |

## 10. Decisions taken, with the alternatives

**gtag.js directly, not Google Tag Manager.** GTM's advantage is letting
a marketer add tags without a deploy. Nobody here will do that. Its cost
is a second container to load, a second place configuration hides, and
a layer that can't be code-reviewed or tested. Revisit only if the gym
hires an agency that needs tag access.

**No npm package.** Exactly three packages reach the browser
(`react`, `react-dom`, `scheduler`) and that is a documented property of
this build. A GA wrapper package would break it for a script tag and
forty lines of code.

**Deferred load, not eager.** See §8. LCP was measured at 2292 ms on
Fast 3G and the hero image is the LCP element; an eager 90 KB tag
competes with it for bandwidth on exactly the connections that can least
afford it.

**Consent Mode v2 with advertising denied by default.** All `ad_*`
storage is denied, analytics storage granted. No banner. This is the
privacy-forward default and needs no cookie banner for a US small
business collecting no advertising signal. **It becomes a legal question
the moment the gym runs Google Ads or takes meaningful EU traffic** —
revisit then, with advice, rather than assuming this still holds.

**Location derived from the DOM, not hand-tagged.** Click tracking is
delegated from `document` and resolves a CTA's location from its nearest
`section[id]`. Adding a new button anywhere on the page is therefore
instrumented automatically, and instrumentation cannot be forgotten —
the failure mode of every hand-tagged analytics implementation.
