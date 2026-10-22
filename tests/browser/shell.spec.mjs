import { test, expect } from '@playwright/test';

// No real Google service is ever contacted: everything outside the loopback harness is aborted,
// and the Firestore REST endpoint is answered by a mock registered per test.
const ENDPOINT = 'https://firestore.googleapis.com/**';
const hasKey = Boolean(process.env.VITE_FIREBASE_API_KEY);

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    return url.hostname === '127.0.0.1' ? route.continue() : route.abort();
  });
});

const snapshot = (count, ageMs) => ({
  name: 'projects/little-galaxy/databases/(default)/documents/snapshots/live',
  fields: { creators: { integerValue: String(count) }, at: { timestampValue: new Date(Date.now() - ageMs).toISOString() } },
});
const answer = (page, handler) => page.route(ENDPOINT, handler);
const json = (body, status = 200) => (route) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
const banner = (page) => page.locator('[data-live]');

test.describe('live banner', () => {
  test.skip(!hasKey, 'build without VITE_FIREBASE_API_KEY has an inert banner');

  test('a fresh snapshot shows the count, in English and Spanish, with correct plurals', async ({ page }) => {
    const requests = [];
    await answer(page, (route) => { requests.push(route.request().url()); return json(snapshot(17, 20_000))(route); });
    await page.goto('/');
    await expect(banner(page)).toHaveText('Live: Collective Galaxy · Be a Dragon 2026 · 17 creators→');
    await expect(banner(page)).toHaveAttribute('data-state', 'fresh');
    await expect(banner(page)).toHaveAttribute('href', '/galaxy/');
    expect(requests).toHaveLength(1);
    const url = new URL(requests[0]);
    expect(url.pathname).toBe('/v1/projects/little-galaxy/databases/(default)/documents/snapshots/live');
    expect(url.searchParams.get('key')).toBeTruthy();

    await page.unroute(ENDPOINT);
    await answer(page, json(snapshot(1, 1000)));
    await page.goto('/es/');
    await expect(banner(page)).toHaveText('En vivo: Galaxia Colectiva · Be a Dragon 2026 · 1 creador→');
    await expect(banner(page)).toHaveAttribute('href', '/galaxy/?lang=es');
  });

  test('a snapshot older than ten minutes shows the event and its time, never a count', async ({ page }) => {
    await answer(page, json(snapshot(99, 11 * 60_000)));
    await page.goto('/');
    await expect(banner(page)).toHaveAttribute('data-state', 'stale');
    await expect(banner(page)).toContainText('Collective Galaxy · Be a Dragon 2026 · last updated');
    await expect(banner(page)).not.toContainText('Live:');
    await expect(banner(page)).not.toContainText('99');
  });

  for (const [label, handler] of [
    ['an HTTP error', json({ error: { code: 403 } }, 403)],
    ['a network failure', (route) => route.abort()],
    ['a malformed document', json({ fields: { creators: { stringValue: 'many' } } })],
    ['a document without a timestamp', json({ fields: { creators: { integerValue: '5' } } })],
  ]) {
    test(`${label} leaves the event without a number`, async ({ page }) => {
      await answer(page, handler);
      await page.goto('/');
      await page.waitForLoadState('load');
      await page.waitForTimeout(300);
      await expect(banner(page)).toHaveText('Collective Galaxy · Be a Dragon 2026→');
      await expect(banner(page)).toHaveAttribute('data-state', 'idle');
    });
  }

  test('only the home page reads the snapshot', async ({ page }) => {
    const requests = [];
    await answer(page, (route) => { requests.push(route.request().url()); return json(snapshot(3, 1000))(route); });
    for (const route of ['/projects/', '/about/', '/links/', '/projects/galaxy/']) await page.goto(route);
    expect(requests).toHaveLength(0);
  });
});

test('without JavaScript the banner links to the galaxy and prints no number', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    for (const [route, text, target] of [['/', 'Collective Galaxy · Be a Dragon 2026', '/galaxy/'], ['/es/', 'Galaxia Colectiva · Be a Dragon 2026', '/galaxy/?lang=es']]) {
      await page.goto(`http://127.0.0.1:4173${route}`);
      await expect(page.locator('[data-live]')).toHaveText(`${text}→`);
      await expect(page.locator('[data-live]')).toHaveAttribute('href', target);
    }
  } finally { await context.close(); }
});

test('/links ships no script, has 44px targets and no horizontal scroll at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  for (const route of ['/links/', '/es/links/']) {
    const html = await (await page.request.get(route)).text();
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/<link[^>]+rel="modulepreload"/i);
    await page.goto(route);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const heights = await page.locator('main a, nav a, footer a, .masthead a').evaluateAll((links) => links.map((link) => Math.round(link.getBoundingClientRect().height)));
    expect(heights.length).toBeGreaterThanOrEqual(8);
    for (const height of heights) expect(height).toBeGreaterThanOrEqual(44);
  }
});

test('visitors never see placeholders, pending markers or the private repository', async ({ page }) => {
  for (const prefix of ['', '/es']) {
    for (const route of ['/', '/projects/', '/about/', '/links/', '/projects/galaxy/']) {
      await page.goto(`${prefix}${route}`);
      const html = await page.content();
      expect(html).not.toMatch(/\bTODO\b/);
      expect(html).not.toMatch(/P3:|lorem|placeholder|undefined|\[object/i);
      expect(html).not.toContain('alexanderkholodov1/portfolio');
      for (const href of await page.locator('a[href]').evaluateAll((links) => links.map((link) => link.getAttribute('href')))) {
        expect(href).not.toBe('#');
        expect(href).toMatch(/^(\/|#main$|https:\/\/github\.com\/alexanderkholodov1\/little-galaxy$)/);
      }
    }
  }
  const profile = await (await page.request.get('/profile.json')).json();
  expect(JSON.stringify(profile)).not.toContain('alexanderkholodov1/portfolio');
  expect(profile.links).toEqual([{ label: 'Collective Galaxy on GitHub', href: 'https://github.com/alexanderkholodov1/little-galaxy' }]);
  expect(profile.socials).toEqual([]);
  expect(profile).not.toHaveProperty('role');
});

test('empty content shows designed states, in both languages', async ({ page }) => {
  await page.goto('/projects/');
  await expect(page.getByText('Not yet entered in the log.')).toBeVisible();
  await page.goto('/es/projects/');
  await expect(page.getByText('Aún no registrada en el cuaderno.')).toBeVisible();
  await page.goto('/about/');
  await expect(page.getByRole('heading', { name: 'The full profile is not written yet.' })).toBeVisible();
  await page.goto('/es/about/');
  await expect(page.getByRole('heading', { name: 'El perfil completo aún no está escrito.' })).toBeVisible();
});

test('every page works in light and dark at phone width without horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  for (const scheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const route of ['/', '/projects/', '/about/', '/links/', '/projects/galaxy/', '/es/', '/es/projects/galaxy/']) {
      await page.goto(route);
      await expect(page.locator('html')).toHaveAttribute('data-theme', scheme).catch(async () => {
        // /links ships no script, so the theme comes from CSS alone.
        expect(route).toMatch(/links/);
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
});

test('the galaxy entry opens the assembled game with the language preserved', async ({ page }) => {
  await page.goto('/es/projects/galaxy/');
  await expect(page.getByRole('link', { name: /Abrir la galaxia/ })).toHaveAttribute('href', '/galaxy/?lang=es');
  await page.goto('/projects/galaxy/');
  await expect(page.getByRole('link', { name: /Open the galaxy/ })).toHaveAttribute('href', '/galaxy/');
});
