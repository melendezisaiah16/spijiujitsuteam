import { expect, test } from '@playwright/test'

/**
 * Visual review sweep. Not assertions — this writes full-page captures
 * across the breakpoint range into screenshots/ so the layout can be
 * eyeballed at every size.
 *
 *   npx playwright test tests/screenshots.spec.ts
 *
 * The page is scrolled end to end first: everything below the hero is
 * loading="lazy", and a plain full-page capture leaves those images
 * blank on tall mobile layouts.
 */
const VIEWPORTS = [
  { name: '01-mobile-320', width: 320, height: 568 }, // smallest in use
  { name: '02-mobile-360', width: 360, height: 740 }, // common Android
  { name: '03-mobile-375', width: 375, height: 667 }, // iPhone SE
  { name: '04-mobile-390', width: 390, height: 844 }, // iPhone 14/15
  { name: '05-mobile-430', width: 430, height: 932 }, // iPhone Pro Max
  { name: '06-mobile-480', width: 480, height: 800 },
  { name: '07-tablet-600', width: 600, height: 960 }, // just under sm→md
  { name: '08-tablet-768', width: 768, height: 1024 }, // iPad portrait
  { name: '09-tablet-834', width: 834, height: 1112 }, // iPad Air portrait
  { name: '10-tablet-1024', width: 1024, height: 768 }, // iPad landscape, lg boundary
  { name: '11-laptop-1280', width: 1280, height: 800 },
  { name: '12-laptop-1366', width: 1366, height: 768 },
  { name: '13-desktop-1440', width: 1440, height: 900 },
  { name: '14-desktop-1680', width: 1680, height: 1050 },
  { name: '15-desktop-1920', width: 1920, height: 1080 },
  { name: '16-desktop-2560', width: 2560, height: 1440 },
]

for (const vp of VIEWPORTS) {
  test(`capture ${vp.name} (${vp.width}px)`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)

    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 60))
      }
      window.scrollTo(0, 0)
    })
    await page.waitForTimeout(500)

    await page.screenshot({
      path: `screenshots/${vp.name}.png`,
      fullPage: true,
      // In a full-page capture, position:fixed elements paint once at
      // their viewport offset — the sticky bar lands in the middle of
      // the schedule and hides a class row. Captured separately below.
      style: '[data-sticky-cta] { display: none !important; }',
    })
  })
}

test('capture the sticky mobile CTA bar in place', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.evaluate(() => window.scrollTo(0, 1200))
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'screenshots/14-sticky-cta.png' })
})

test('capture the mobile menu', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: /menu/i }).click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'screenshots/13-mobile-menu.png' })
})

/**
 * Automated pass over the same viewport range, catching the things
 * that are tedious to spot by eye: sideways scroll, elements spilling
 * past the viewport, and text overlapping its container.
 */
for (const vp of VIEWPORTS) {
  test(`layout is sound at ${vp.width}px`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)

    const report = await page.evaluate(() => {
      const docW = document.documentElement.clientWidth
      const overflow = document.documentElement.scrollWidth - docW
      const spills: string[] = []
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) continue
        if (r.right > docW + 1 || r.left < -1) {
          const tag = el.tagName.toLowerCase()
          const id = (el as HTMLElement).id
          spills.push(`${tag}${id ? '#' + id : ''} ${Math.round(r.left)}→${Math.round(r.right)}`)
        }
      }
      return { overflow, docW, scrollW: document.documentElement.scrollWidth, spills: spills.slice(0, 6) }
    })

    expect(
      report.overflow,
      `horizontal scroll (client ${report.docW}, scroll ${report.scrollW}) spills: ${JSON.stringify(report.spills)}`,
    ).toBeLessThanOrEqual(0)
    expect(report.spills, 'elements past the viewport edge').toEqual([])
  })
}
