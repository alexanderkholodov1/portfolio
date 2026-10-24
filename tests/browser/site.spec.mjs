import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

const pinnedGalaxy = JSON.parse(readFileSync(new URL('../../games.json', import.meta.url), 'utf8')).games.galaxy.tag.replace(/^v/, '');

test.beforeEach(async ({ context }) => {
  // Enforce the local-only boundary even if the assembled game initializes SDKs.
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    return url.hostname === '127.0.0.1' ? route.continue() : route.abort();
  });
});

test('bilingual route counterparts and complete navigation at phone width', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  for (const route of ['/', '/projects/', '/about/', '/links/', '/projects/galaxy/']) {
    await page.goto(route);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    const spanish = page.getByRole('link', { name: 'Read this page in Spanish' });
    await expect(spanish).toHaveAttribute('href', `/es${route}`);
    await spanish.click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole('link', { name: 'Leer esta página en inglés' })).toHaveAttribute('href', route);
  }
});

test('theme follows system, persists selection through reload and language navigation', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Dark theme' }).click();
  await expect(page.getByRole('button', { name: 'Dark theme' })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('link', { name: 'Read this page in Spanish' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('storage denial does not break theme controls', async ({ context, page }) => {
  await context.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage blocked'); } });
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Dark theme' })).toBeVisible();
  await page.getByRole('button', { name: 'Dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('pages and language links remain usable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'dark' });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/links/');
    await expect(page.locator('h1')).toHaveText('Links');
    await expect(page.getByRole('button')).toHaveCount(0);
    await page.getByRole('link', { name: 'Read this page in Spanish' }).click();
    await expect(page.locator('h1')).toHaveText('Enlaces');
    await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(7, 20, 33)');
  } finally { await context.close(); }
});

test('assembled Galaxy uses the real same-origin profile and shared tokens on deep links', async ({ page }) => {
  await page.goto('/galaxy/create?lang=es');
  await expect(page.getByRole('link', { name: 'Alexander Kholodov', exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('link[href="/tokens.css"]')).toHaveCount(1);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--pf-paper').trim())).toBeTruthy();
  const version = await page.request.get('/galaxy/version.json');
  expect((await version.json()).version).toBe(pinnedGalaxy);
  const missing = await page.request.get('/a-page-that-does-not-exist');
  // Only rendering is under test here; Hosting rewrite status needs a preview.
  expect(await missing.text()).toContain('<html lang="en"');
  expect(await missing.text()).toContain('404');
});
