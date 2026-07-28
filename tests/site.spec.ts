import { expect, test, type Page } from '@playwright/test'

/** The class rows for the selected day — plain divs, no per-row CTA. */
const classRows = (page: Page) => page.locator('[role="tabpanel"] > div')

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
  // beginner class first. Every night has one, so it froze on "Adults"
  // and never changed. It must track the selected day.
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
    for (const label of ['Schedule', 'Programs', 'Kids', 'About']) {
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

  test('the nav follows the section under the header while scrolling', async ({ page }) => {
    for (const [y, expected] of [
      [1500, 'Programs'],
      [2300, 'Kids'],
      [700, 'Schedule'],
    ] as const) {
      await page.evaluate((to) => window.scrollTo({ top: to, behavior: 'instant' }), y)
      await page.waitForTimeout(250)
      await expect(page.locator('header nav a[aria-current="true"]')).toHaveText(expected)
    }
  })

  // Searching Maps for the street address lands on a neighbouring
  // house, so both links have to target the business itself.
  test('directions route to the gym coordinates, not the street address', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Get directions/ })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=26.0737075%2C-97.2120742',
    )
  })

  test('the address links to the business listing', async ({ page }) => {
    await expect(
      page.locator('address a[href*="cid="]'),
    ).toHaveAttribute('href', 'https://www.google.com/maps?cid=1768797045726719715')
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
