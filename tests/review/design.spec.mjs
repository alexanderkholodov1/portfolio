// Design review, advisory: preferences of craft that never block a release (his decision of 2026-11-18, after a
// release waited on two buttons 4 px short of 44). CI prints the results in the job summary; the agent reads them
// and fixes what matters before asking him to merge. What breaks the site lives in tests/browser and blocks.
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (route) => (new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort()));
});

test('/links targets are at least 44 px tall at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  for (const route of ['/links/', '/es/links/']) {
    await page.goto(route);
    const heights = await page.locator('main a, nav a, footer a, .masthead a, .masthead button').evaluateAll((links) => links.map((link) => Math.round(link.getBoundingClientRect().height)));
    expect(heights.length).toBeGreaterThanOrEqual(9);
    for (const height of heights) expect(height).toBeGreaterThanOrEqual(44);
  }
});

test('navigation and preference controls are at least 44 by 44 px at 375px in English and Spanish', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const prefix of ['', '/es']) {
    for (const route of ['/', '/projects/', '/about/', '/links/']) {
      await page.goto(`${prefix}${route}`);
      // The home's chapter rail is a wide-screen aid (hidden on phones); the site navigation is body > nav.
      const boxes = await page.locator('.masthead a, .masthead button, body > nav a, footer a').evaluateAll((items) => items.map((item) => {
        const { width, height } = item.getBoundingClientRect();
        return { name: (item.getAttribute('aria-label') || item.textContent).trim().slice(0, 24), width: Math.round(width * 10) / 10, height: Math.round(height * 10) / 10 };
      }));
      expect(boxes.length, `${prefix}${route}`).toBeGreaterThanOrEqual(7);
      for (const box of boxes) {
        expect(box.width, `${prefix}${route} ${box.name} width`).toBeGreaterThanOrEqual(44);
        expect(box.height, `${prefix}${route} ${box.name} height`).toBeGreaterThanOrEqual(44);
      }
    }
  }
});

test('the external mark is drawn, not a glyph that may be missing from the font', async ({ page }) => {
  for (const route of ['/', '/links/', '/projects/', '/projects/galaxy/', '/experience/', '/es/links/']) {
    await page.goto(route);
    expect(await page.locator('body').innerText(), route).not.toContain('↗');
  }
  for (const route of ['/links/', '/es/links/']) {
    await page.goto(route);
    expect(await page.locator('a[href^="https://"] svg.mark').count()).toBeGreaterThan(0);
  }
});
