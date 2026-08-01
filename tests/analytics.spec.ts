import { expect, test, type Page } from '@playwright/test'

/**
 * Instrumentation coverage.
 *
 * These run against a dev build with no GA_MEASUREMENT_ID, which is the
 * point: without an ID `track()` still records into `window.dataLayer`
 * but gtag.js is never fetched, so the whole suite exercises the real
 * event payloads without a single row reaching the gym's property.
 */

/** dataLayer entries are `arguments` objects; Array.from normalises them. */
async function events(page: Page): Promise<Array<[string, string, Record<string, unknown>]>> {
  return page.evaluate(() =>
    (window.dataLayer ?? [])
      .map((entry) => Array.from(entry as ArrayLike<unknown>))
      .filter((entry) => entry[0] === 'event') as Array<[string, string, Record<string, unknown>]>,
  )
}

const named = (
  all: Array<[string, string, Record<string, unknown>]>,
  name: string,
): Array<Record<string, unknown>> => all.filter((e) => e[1] === name).map((e) => e[2])

test.beforeEach(async ({ page }) => {
  // sms:, tel: and target=_blank links would hand the click to the OS
  // or open a tab. The tracking listener is capture-phase, so it has
  // already run by the time this bubble-phase handler cancels the
  // navigation — exactly the ordering the real page relies on.
  await page.addInitScript(() => {
    document.addEventListener('click', (event) => {
      const link = (event.target as Element)?.closest?.('a[href]')
      if (link) event.preventDefault()
    })
  })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
})

test.describe('analytics', () => {
  // The whole reason for an env-gated ID: a dev or preview build must
  // not write into the property.
  test('no tag is loaded without a measurement ID', async ({ page }) => {
    await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(0)
    const consent = await page.evaluate(() =>
      (window.dataLayer ?? []).some((e) => Array.from(e as ArrayLike<unknown>)[0] === 'consent'),
    )
    expect(consent, 'consent defaults only prime when a tag will load').toBe(false)
  })

  test('the conversion fires with the location it was clicked from', async ({ page }) => {
    await page.locator('#women a[href^="sms:"]').first().click()
    await page.locator('#faq a[href^="sms:"]').first().click()

    const clicks = named(await events(page), 'cta_text_click')
    expect(clicks.length).toBe(2)
    expect(clicks.map((c) => c.cta_location)).toEqual(['women', 'faq'])
    expect(clicks[0]!.link_type).toBe('sms')
    expect(String(clicks[0]!.cta_label).length).toBeGreaterThan(0)
  })

  // Location is derived from the DOM rather than hand-tagged, so a CTA
  // added anywhere is instrumented automatically. This proves the
  // derivation covers every CTA actually on the page — including the
  // ones in regions with no section id.
  test('every sms CTA on the page resolves to a real location', async ({ page }) => {
    const hrefs = await page.locator('a[href^="sms:"]').all()
    expect(hrefs.length).toBeGreaterThanOrEqual(6)

    for (const link of hrefs) {
      await link.evaluate((el) => (el as HTMLElement).click())
    }

    const locations = named(await events(page), 'cta_text_click').map((c) => c.cta_location)
    expect(locations.length).toBe(hrefs.length)
    expect(locations, 'no CTA fell through to the "page" fallback').not.toContain('page')
    expect(new Set(locations).size, 'locations should actually differ').toBeGreaterThan(2)
  })

  test('outbound links are grouped by destination, not raw URL', async ({ page }) => {
    await page.getByRole('link', { name: /Get directions/ }).click()
    await page.locator('footer a[href*="instagram.com"]').click()

    const out = named(await events(page), 'outbound_click')
    expect(out.map((o) => o.destination)).toEqual(['directions', 'instagram'])
  })

  test('in-page navigation records target and source', async ({ page }) => {
    await page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name: 'Kids' }).click()
    const nav = named(await events(page), 'nav_click')
    expect(nav[0]).toMatchObject({ nav_target: 'kids', nav_source: 'header' })
  })

  test('day selection records the night and how many classes run', async ({ page }) => {
    await page.getByRole('tab').filter({ hasText: 'THU' }).click()
    const days = named(await events(page), 'schedule_day_select')
    expect(days[0]).toMatchObject({ day: 'Thu', class_count: 2 })
  })

  test('opening a question records which one, closing records nothing', async ({ page }) => {
    // Pinned by index, not by `:not([open])` — that selector re-resolves
    // between actions, so the second click would land on a different
    // question and "closing" would never actually be exercised.
    const closed = page.locator('#faq details').nth(1)
    const question = ((await closed.locator('h3').textContent()) ?? '').trim()

    await closed.locator('summary').click()
    await closed.locator('summary').click() // closing again must not fire

    const opens = named(await events(page), 'faq_open')
    // Exactly one: not two for open-then-close, and crucially not a
    // third from the item that renders open — hydration fires a toggle
    // for that one, which would have made question one look permanently
    // the most asked in every session.
    expect(opens.length).toBe(1)
    expect(String(opens[0]!.faq_question).toLowerCase()).toBe(question.toLowerCase())
  })

  test('sections and scroll depth are recorded as the page is read', async ({ page }) => {
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 300) {
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 40))
      }
    })
    // Lazy images load on the way down and make the page taller, so the
    // first "bottom" stops being the bottom. Settle, then go again.
    await page.waitForFunction(() => [...document.images].every((i) => i.complete))
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await page.waitForTimeout(400)

    const all = await events(page)
    const sections = named(all, 'section_view').map((s) => s.section_id)
    // "hero", not "top" — the explicit name beats the anchor id.
    expect(sections).toContain('hero')
    for (const id of ['schedule', 'programs', 'women', 'kids', 'coach', 'faq']) {
      expect(sections, `${id} never recorded a view`).toContain(id)
    }
    // Fires once each, never on the way back up.
    expect(new Set(sections).size).toBe(sections.length)

    expect(named(all, 'scroll_depth').map((s) => s.percent)).toEqual([25, 50, 75, 100])
  })

  // GA's Terms of Service, not a style preference: personal data in a
  // property gets it deleted rather than warned.
  test('no event carries anything that identifies a person', async ({ page }) => {
    await page.locator('a[href^="sms:"]').first().click()
    await page.getByRole('link', { name: /Get directions/ }).click()

    const payload = JSON.stringify(await events(page))
    expect(payload).not.toMatch(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/) // phone numbers
    expect(payload).not.toMatch(/@[a-z0-9-]+\.[a-z]{2,}/i) // email addresses
  })
})
