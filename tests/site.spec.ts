import { expect, test, type Page } from '@playwright/test'

/**
 * The class rows for the selected day — plain divs, no per-row CTA.
 *
 * All four panels are in the DOM so the whole week ships in the static
 * HTML; three carry `hidden`. Scoped to the visible one, or this counts
 * every night at once.
 */
const classRows = (page: Page) => page.locator('[role="tabpanel"]:not([hidden]) > div')

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  expect(errors, 'uncaught page errors').toEqual([])
})

test.describe('schedule', () => {
  test('day tabs swap the class list', async ({ page }) => {
    const tabs = page.getByRole('tab')
    await expect(tabs).toHaveCount(4)

    await tabs.filter({ hasText: 'MON' }).click()
    await expect(classRows(page)).toHaveCount(3)
    await expect(page.getByRole('tabpanel')).toContainText('Little Ninjas')

    await tabs.filter({ hasText: 'THU' }).click()
    await expect(classRows(page)).toHaveCount(2)
    await expect(page.getByRole('tabpanel').getByText('Little Ninjas')).toHaveCount(0)
  })

  // The whole timetable has to be in the HTML of the first response,
  // not just the day that happens to be selected. Crawlers and AI
  // fetchers that read raw HTML never click a tab.
  test('every night ships in the static markup', async ({ page }) => {
    const panels = page.locator('[role="tabpanel"]')
    await expect(panels).toHaveCount(4)

    const text = await panels.evaluateAll((els) => els.map((el) => el.textContent ?? '').join('|'))
    expect(text).toContain('Little Ninjas')
    expect(text.match(/Teens & Adults/g)?.length, 'one per night').toBe(4)
  })

  test('every weekday has the confirmed class count', async ({ page }) => {
    for (const [day, count] of [
      ['MON', 3],
      ['TUE', 2],
      ['WED', 3],
      ['THU', 2],
    ] as const) {
      await page.getByRole('tab').filter({ hasText: day }).click()
      await expect(classRows(page)).toHaveCount(count)
    }
  })

  test('gi nights are labelled correctly', async ({ page }) => {
    await page.getByRole('tab').filter({ hasText: 'MON' }).click()
    await expect(page.getByRole('tabpanel')).toContainText('Gi')

    await page.getByRole('tab').filter({ hasText: 'TUE' }).click()
    await expect(page.getByRole('tabpanel')).toContainText('No-gi')
  })

  // The rail used to be a "recommendation" that resolved to the
  // beginner class first. Every night has one, so it froze on the
  // teens-and-adults class. It must track the selected day.
  test('the rail panel changes with the selected day', async ({ page }) => {
    const rail = page.locator('aside[aria-label="What to expect"]')
    const seen: string[] = []

    // No day-name assertion here: the selected day renders as "Tonight"
    // when it happens to be today, so anything keyed to a weekday name
    // fails one day in four.
    for (const day of ['MON', 'TUE', 'WED', 'THU']) {
      await page.getByRole('tab').filter({ hasText: day }).click()
      await expect(rail).toContainText(/night/i)
      seen.push((await rail.innerText()).trim())
    }

    expect(new Set(seen).size, 'every day should render a distinct panel').toBe(4)
    await page.getByRole('tab').filter({ hasText: 'MON' }).click()
    await expect(rail).toContainText('Gi night')
    await page.getByRole('tab').filter({ hasText: 'TUE' }).click()
    await expect(rail).toContainText('No-gi night')
  })

  test('arrow keys move between day tabs', async ({ page }) => {
    const tabs = page.getByRole('tab')
    await tabs.first().click()
    await page.keyboard.press('ArrowRight')
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('End')
    await expect(tabs.nth(3)).toHaveAttribute('aria-selected', 'true')
  })
})

// The markup search engines and AI answer engines actually read. It is
// derived from classes.ts and site.ts rather than hand-written, so
// these assertions are really checking that the derivation still works.
test.describe('structured data', () => {
  test('one valid JSON-LD graph, wired by @id', async ({ page }) => {
    const blocks = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((els) => els.map((el) => el.textContent ?? ''))
    expect(blocks, 'exactly one block — the whole graph').toHaveLength(1)

    const graph = JSON.parse(blocks[0]!)['@graph'] as Record<string, unknown>[]
    const byType = (t: string) =>
      graph.find((n) => [n['@type']].flat().includes(t)) as Record<string, any> | undefined

    for (const type of ['WebSite', 'WebPage', 'Person', 'SportsActivityLocation', 'FAQPage']) {
      expect(byType(type), `${type} node`).toBeTruthy()
    }

    const gym = byType('SportsActivityLocation')!
    // Every reference has to resolve to a node that exists, or the
    // graph is five disconnected islands wearing a trench coat.
    const ids = new Set(graph.map((n) => n['@id']))
    expect(ids.has(gym.employee['@id'])).toBe(true)
    expect(ids.has(byType('WebSite')!.publisher['@id'])).toBe(true)

    // Hours are derived from the timetable; these are the confirmed
    // windows. A schedule change that breaks the derivation shows up
    // here rather than in Google's search result.
    const hours = gym.openingHoursSpecification.map(
      (w: any) => `${w.dayOfWeek.join('/')} ${w.opens}-${w.closes}`,
    )
    expect(hours).toEqual(['Monday/Wednesday 17:00-21:00', 'Tuesday/Thursday 17:30-21:00'])

    expect(gym.sameAs.length, 'at least the Google Business Profile').toBeGreaterThan(0)
    // sameAs asserts "this is the same entity", so a click-attribution
    // parameter has no business in one. Query strings as such are
    // fine — the Google profile is identified by ?cid=, which is the
    // identifier itself rather than tracking.
    const TRACKING = /[?&](mibextid|fbclid|igshid|si|utm_[a-z]+)=/i
    for (const url of gym.sameAs) {
      expect(url, `${url} carries a tracking parameter`).not.toMatch(TRACKING)
    }
  })

  // The answers have to be in the DOM whether or not the disclosure is
  // open — that is the whole basis for collapsing them.
  test('collapsed answers are still in the markup', async ({ page }) => {
    const closed = page.locator('#faq details:not([open])').first()
    await expect(closed).toHaveCount(1)
    const text = (await closed.textContent()) ?? ''
    expect(text.length, 'answer present while collapsed').toBeGreaterThan(80)
    await expect(closed.locator('p')).toBeHidden()
  })

  test('the accordion opens on click and on keyboard', async ({ page }) => {
    const third = page.locator('#faq details').nth(2)
    await expect(third.locator('p')).toBeHidden()

    await third.locator('summary').click()
    await expect(third.locator('p')).toBeVisible()

    // <summary> is focusable and toggles on Enter for free — the main
    // reason this is native rather than a div with an onClick.
    await third.locator('summary').press('Enter')
    await expect(third.locator('p')).toBeHidden()
  })

  // Marking up a question that isn't on the page is a structured-data
  // violation. One array feeds both, and this proves it.
  test('every FAQ answer in the markup is visible on the page', async ({ page }) => {
    const block = await page.locator('script[type="application/ld+json"]').textContent()
    const faq = (JSON.parse(block!)['@graph'] as any[]).find((n) => n['@type'] === 'FAQPage')
    expect(faq.mainEntity.length).toBeGreaterThanOrEqual(5)

    // textContent, not innerText: the questions are uppercased by CSS
    // `text-transform`, which innerText applies and the DOM does not.
    // A crawler reads the underlying text, so this must too.
    const visible = ((await page.locator('#faq').textContent()) ?? '').replace(/\s+/g, ' ')
    for (const q of faq.mainEntity) {
      expect(visible, `question: ${q.name}`).toContain(q.name)
      expect(visible, `answer to: ${q.name}`).toContain(q.acceptedAnswer.text.replace(/\s+/g, ' '))
    }
  })
})

test.describe('CTAs', () => {
  test('every phone CTA is a working sms: deep link', async ({ page }) => {
    const sms = page.locator('a[href^="sms:"]')
    await expect(sms.first()).toBeVisible()
    for (const href of await sms.evaluateAll((els) => els.map((e) => e.getAttribute('href')))) {
      expect(href).toMatch(/^sms:9566671971/)
    }
  })

  // `scroll-padding-top` on <html> and `scroll-mt` on the sections
  // compound rather than override. Having both put anchors 140px down
  // and left the nav highlight a section behind. Only one may exist.
  test('anchors land just under the header and light the right link', async ({ page }) => {
    const headerH = await page
      .locator('header')
      .evaluate((el) => el.getBoundingClientRect().height)

    for (const [label, id] of [
      ['Schedule', 'schedule'],
      ['Programs', 'programs'],
      ['Women', 'women'],
      ['Kids', 'kids'],
      ['About', 'coach'],
    ] as const) {
      await page.getByRole('navigation').getByRole('link', { name: label }).click()
      await page.waitForTimeout(700)

      const top = await page.locator(`#${id}`).evaluate((el) => el.getBoundingClientRect().top)
      expect(top, `${label} must clear the header`).toBeGreaterThanOrEqual(headerH - 1)
      expect(top, `${label} must not leave a gap under the header`).toBeLessThan(headerH + 40)

      await expect(
        page.getByRole('navigation').getByRole('link', { name: label }),
      ).toHaveAttribute('aria-current', 'true')
    }
  })

  test('in-page links scroll without leaving a #fragment in the URL', async ({ page }) => {
    for (const label of ['Schedule', 'Programs', 'Women', 'Kids', 'About']) {
      await page.getByRole('navigation').getByRole('link', { name: label }).click()
      await page.waitForTimeout(600)
      expect(new URL(page.url()).hash, `${label} left a hash behind`).toBe('')
    }

    // The logo and the in-body link go through the same handler.
    await page.locator('header a[href="#top"]').click()
    await page.waitForTimeout(500)
    expect(new URL(page.url()).hash).toBe('')

    await page.locator('#kids a[href="#schedule"]').click()
    await page.waitForTimeout(600)
    expect(new URL(page.url()).hash).toBe('')
    await expect(page.locator('#schedule')).toBeInViewport()
  })

  test('an old #link still scrolls, then tidies the URL', async ({ page }) => {
    await page.goto('/#coach')
    await page.waitForTimeout(900)
    await expect(page.locator('#coach')).toBeInViewport()
    expect(new URL(page.url()).hash).toBe('')
  })

  test('focus follows the jump for keyboard users', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: 'Programs' }).click()
    await page.waitForTimeout(600)
    // preventDefault kills the browser's own focus move, so the handler
    // has to do it — otherwise tab order stays stuck at the header.
    await expect(page.locator('#programs')).toBeFocused()
  })

  // Scroll targets come from the sections' own offsets. Fixed pixel
  // depths were silently invalidated the first time a section was
  // added above one of them — the test still passed, against the
  // wrong section.
  test('the nav follows the section under the header while scrolling', async ({ page }) => {
    for (const [id, expected] of [
      ['programs', 'Programs'],
      ['women', 'Women'],
      ['kids', 'Kids'],
      ['schedule', 'Schedule'],
    ] as const) {
      const top = await page
        .locator(`#${id}`)
        .evaluate((el) => el.getBoundingClientRect().top + window.scrollY)
      // 60px above the spy line, so this section has crossed it and
      // the next one is nowhere near.
      await page.evaluate((to) => window.scrollTo({ top: to, behavior: 'instant' }), top - 60)
      await page.waitForTimeout(250)
      await expect(page.locator('header nav a[aria-current="true"]')).toHaveText(expected)
    }
  })

  // Searching Maps for the street address lands on a neighbouring
  // house, so both links have to target the business itself.
  test('directions route to the gym coordinates, not the street address', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Get directions/ })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=26.0738256%2C-97.2121702',
    )
  })

  // Both destinations must be reachable from labelled links. The
  // profile link used to sit on the address text, where it looked like
  // a heading and nobody found it.
  test('the business profile has its own labelled link', async ({ page }) => {
    const profile = page.getByRole('link', { name: /Reviews & photos/ })
    await expect(profile).toBeVisible()
    await expect(profile).toHaveAttribute(
      'href',
      'https://www.google.com/maps?cid=1768797045726719715',
    )
    // The address itself is plain text now — no hidden affordance.
    await expect(page.locator('address a')).toHaveCount(0)
  })

  // The accounts were in the JSON-LD sameAs before they were anywhere
  // a person could click. Both come from one list now; this asserts the
  // human-facing half exists.
  test('social accounts are reachable from the footer', async ({ page }) => {
    const links = page.locator('footer nav[aria-label="Social media"] a')
    await expect(links).toHaveCount(2)

    for (const [i, host] of [
      [0, 'instagram.com'],
      [1, 'facebook.com'],
    ] as const) {
      const link = links.nth(i)
      await expect(link).toHaveAttribute('href', new RegExp(host.replace('.', '\\.')))
      await expect(link).toHaveAttribute('target', '_blank')
      // Without noopener the opened tab gets a handle on this one.
      await expect(link).toHaveAttribute('rel', /noopener/)
    }

    // Every visible account must also be claimed in the structured
    // data, or the two halves have drifted apart again.
    const block = await page.locator('script[type="application/ld+json"]').textContent()
    const gym = (JSON.parse(block!)['@graph'] as any[]).find((n) =>
      [n['@type']].flat().includes('SportsActivityLocation'),
    )
    for (const href of await links.evaluateAll((els) =>
      els.map((el) => el.getAttribute('href')),
    )) {
      expect(gym.sameAs, `${href} missing from sameAs`).toContain(href)
    }
  })

  test('the tagline appears in the closer and the footer', async ({ page }) => {
    await expect(page.getByText('Roll like a wave', { exact: true })).toBeVisible()
    await expect(page.locator('footer')).toContainText('ROLL LIKE A WAVE')
  })
})

test.describe('images', () => {
  // Everything below the hero is loading="lazy", so the page has to be
  // walked before any of it is expected to have decoded.
  for (const width of [320, 390, 768, 1440]) {
    test(`every photo decodes and fills its slot at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await page.goto('/')
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 400) {
          window.scrollTo(0, y)
          await new Promise((r) => setTimeout(r, 60))
        }
      })

      // The walk only *triggers* the lazy loads. Asserting straight
      // afterwards raced the last section's fetch, and every new
      // section pushed the page taller and made the race easier to
      // lose — wait for the network instead of adding another sleep.
      await page.waitForFunction(
        () => [...document.images].every((i) => i.complete),
        undefined,
        { timeout: 10_000 },
      )

      const shots = await page.locator('img').evaluateAll((els) =>
        (els as HTMLImageElement[]).map((el) => ({
          src: el.currentSrc || '(never loaded)',
          natural: el.naturalWidth,
          h: Math.round(el.getBoundingClientRect().height),
          w: Math.round(el.getBoundingClientRect().width),
        })),
      )

      expect(shots.length).toBeGreaterThanOrEqual(6)
      for (const s of shots) {
        expect(s.natural, `decoded: ${s.src}`).toBeGreaterThan(0)
        expect(s.h, `height: ${s.src}`).toBeGreaterThan(20)
        expect(s.w, `width: ${s.src}`).toBeGreaterThan(20)
      }
    })
  }
})

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('menu opens, navigates, and closes', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /menu/i })
    await expect(toggle).toBeVisible()
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Escape')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  test('sticky CTA bar stays visible while scrolling', async ({ page }) => {
    const bar = page.locator('a', { hasText: 'Text for a free class' }).last()
    await expect(bar).toBeInViewport()
    await page.evaluate(() => window.scrollTo(0, 3000))
    await expect(bar).toBeInViewport()
  })

  test('no horizontal overflow', async ({ page }) => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow, 'page scrolls sideways').toBeLessThanOrEqual(0)
  })
})
