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
    await expect(banner(page)).toHaveAttribute('href', '/little-galaxy/');
    expect(requests).toHaveLength(1);
    const url = new URL(requests[0]);
    expect(url.pathname).toBe('/v1/projects/little-galaxy/databases/(default)/documents/snapshots/live');
    expect(url.searchParams.get('key')).toBeTruthy();
    expect(url.searchParams.getAll('mask.fieldPaths')).toEqual(['creators', 'at']);

    await page.unroute(ENDPOINT);
    await answer(page, json(snapshot(1, 1000)));
    await page.goto('/es/');
    await expect(banner(page)).toHaveText('En vivo: Galaxia Colectiva · Be a Dragon 2026 · 1 creador→');
    await expect(banner(page)).toHaveAttribute('href', '/little-galaxy/?lang=es');
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
    for (const [route, text, target] of [['/', 'Collective Galaxy · Be a Dragon 2026', '/little-galaxy/'], ['/es/', 'Galaxia Colectiva · Be a Dragon 2026', '/little-galaxy/?lang=es']]) {
      await page.goto(`http://127.0.0.1:4173${route}`);
      await expect(page.locator('[data-live]')).toHaveText(`${text}→`);
      await expect(page.locator('[data-live]')).toHaveAttribute('href', target);
    }
  } finally { await context.close(); }
});

test('/links ships only the tiny inline preference initializer, has 44px targets and no horizontal scroll at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  for (const route of ['/links/', '/es/links/']) {
    const html = await (await page.request.get(route)).text();
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
    expect(scripts).toHaveLength(1);
    expect(scripts[0][1]).not.toMatch(/\bsrc=|type="module"/);
    expect(Buffer.byteLength(scripts[0][2])).toBeLessThan(900);
    expect(html).not.toMatch(/<link[^>]+rel="modulepreload"/i);
    await page.goto(route);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const heights = await page.locator('main a, nav a, footer a, .masthead a, .masthead button').evaluateAll((links) => links.map((link) => Math.round(link.getBoundingClientRect().height)));
    expect(heights.length).toBeGreaterThanOrEqual(9);
    for (const height of heights) expect(height).toBeGreaterThanOrEqual(44);
  }
});

test('navigation and preference controls are at least 44 by 44 px at 375px in English and Spanish, with no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const prefix of ['', '/es']) {
    for (const route of ['/', '/projects/', '/about/', '/links/']) {
      await page.goto(`${prefix}${route}`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${prefix}${route} overflows`).toBe(true);
      const boxes = await page.locator('.masthead a, .masthead button, nav a, footer a').evaluateAll((items) => items.map((item) => {
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
        expect(href).toMatch(/^(\/|#main$|https:\/\/(www\.)?(github\.com\/(alexanderkholodov1|AlexanderKholodov1\/zkvote|DhamarAM\/hackathon_sala2026)|linkedin\.com\/in\/alexanderkholodov1\/|instagram\.com\/alexanderkholodov1\/|facebook\.com\/alexanderkholodov0\/|munra-1\.web\.app\/|alexanderkholodov1\.itch\.io\/sublime-airlift))/);
      }
    }
  }
  const profile = await (await page.request.get('/profile.json')).json();
  expect(JSON.stringify(profile)).not.toContain('alexanderkholodov1/portfolio');
  expect(profile.links).toEqual([
    { label: 'Collective Galaxy on GitHub', href: 'https://github.com/alexanderkholodov1/little-galaxy' },
    { label: 'MunHub Lab', href: 'https://munra-1.web.app/' },
    { label: 'ZKVote on GitHub', href: 'https://github.com/AlexanderKholodov1/zkvote' },
    { label: 'Dragon Ocean Analyzer on GitHub', href: 'https://github.com/DhamarAM/hackathon_sala2026' },
    { label: 'Sublime Airlift on Itch.io', href: 'https://alexanderkholodov1.itch.io/sublime-airlift' },
  ]);
  expect(profile.socials).toEqual([
    { label: 'LinkedIn', handle: 'alexanderkholodov1', href: 'https://www.linkedin.com/in/alexanderkholodov1/' },
    { label: 'Instagram', handle: 'alexanderkholodov1', href: 'https://www.instagram.com/alexanderkholodov1/' },
    { label: 'GitHub', handle: 'alexanderkholodov1', href: 'https://github.com/alexanderkholodov1' },
    { label: 'Facebook', handle: 'alexanderkholodov0', href: 'https://www.facebook.com/alexanderkholodov0/' },
  ]);
  expect(profile.role).toEqual({
    en: 'Computer Science Engineering student at Universidad San Francisco de Quito (2023–2028).',
    es: 'Estudiante de Ingeniería en Ciencias de la Computación en la Universidad San Francisco de Quito (2023–2028).',
  });
});

test('visitors never see editorial status: unfilled entries are omitted, in both languages', async ({ page }) => {
  const editorial = /\b(not yet|not written|yet entered|next entry|aún no|todavía no|no está escrito|próxima entrada|pending|pendiente)\b/i;
  for (const prefix of ['', '/es']) {
    for (const route of ['/', '/projects/', '/about/', '/links/', '/projects/galaxy/']) {
      await page.goto(`${prefix}${route}`);
      expect(await page.locator('body').innerText(), `${prefix}${route}`).not.toMatch(editorial);
    }
    await page.goto(`${prefix}/projects/`);
    await expect(page.locator('li.entry.project')).toHaveCount(14);
    await expect(page.locator('.blank, .blank-block')).toHaveCount(0);
    await page.goto(`${prefix}/about/`);
    await expect(page.locator('main h2')).toHaveCount(0);
  }
});

test('every page works in light and dark at phone width without horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  for (const scheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const route of ['/', '/projects/', '/about/', '/links/', '/projects/galaxy/', '/es/', '/es/links/', '/es/projects/galaxy/']) {
      await page.goto(route);
      await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
});

const paper = { light: 'rgb(241, 245, 249)', dark: 'rgb(7, 20, 33)' };
for (const [system, chosen] of [['light', 'dark'], ['dark', 'light']]) {
  test(`a ${chosen} choice against a ${system} system survives Home, Links, reload and Spanish Links`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.emulateMedia({ colorScheme: system });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', system);
    await page.locator('#theme').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', chosen);
    await page.locator('nav a', { hasText: 'Links' }).click();
    await expect(page).toHaveURL(/\/links\/$/);
    const check = async () => {
      await expect(page.locator('html')).toHaveAttribute('data-theme', chosen);
      await expect(page.locator('#theme')).toBeVisible();
      await expect(page.locator('#theme')).toHaveAttribute('aria-pressed', String(chosen === 'dark'));
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)).toBe(paper[chosen]);
    };
    await check();
    await page.reload();
    await check();
    await page.getByRole('link', { name: 'Read this page in Spanish' }).click();
    await expect(page).toHaveURL(/\/es\/links\/$/);
    await check();
    // The control on Links changes and persists the choice too.
    await page.locator('#theme').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', system);
    expect(await page.evaluate(() => localStorage.getItem('portfolio.theme'))).toBe(system);
  });
}

test('without JavaScript Links follows the system theme and shows no dead theme button', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'dark' });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/links/');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)).toBe(paper.dark);
    await expect(page.locator('#theme')).toBeHidden();
  } finally { await context.close(); }
});

test('ledger rows keep their children apart, arrows at the right margin, at 375px in both languages', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  for (const prefix of ['', '/es']) {
    for (const route of ['/', '/projects/', '/about/', '/links/', '/projects/galaxy/']) {
      await page.goto(`${prefix}${route}`);
      const rows = await page.locator('.entry').evaluateAll((entries) => entries.map((entry) => {
        const box = (element) => { const r = element.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, kind: element.className || element.tagName }; };
        return { parent: box(entry), children: [...entry.children].map(box), arrow: entry.querySelector(':scope > .arrow') ? box(entry.querySelector(':scope > .arrow')) : null };
      }));
      for (const row of rows) {
        for (const [i, a] of row.children.entries()) {
          expect(a.left, `${prefix}${route} child inside row`).toBeGreaterThanOrEqual(row.parent.left - 1);
          expect(a.right).toBeLessThanOrEqual(row.parent.right + 1);
          for (const b of row.children.slice(i + 1)) {
            const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            expect(overlapX > 1 && overlapY > 1, `${prefix}${route}: ${a.kind} overlaps ${b.kind}`).toBe(false);
          }
        }
        if (row.arrow) expect(Math.abs(row.arrow.right - row.parent.right)).toBeLessThanOrEqual(1);
      }
    }
  }
});

test('the Projects title link is a 44px target', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  for (const route of ['/projects/', '/es/projects/']) {
    await page.goto(route);
    const height = await page.locator('.entry h2 a').first().evaluate((link) => link.getBoundingClientRect().height);
    expect(height).toBeGreaterThanOrEqual(44);
  }
});

test('the external mark is drawn, not a glyph that may be missing from the font', async ({ page }) => {
  for (const route of ['/links/', '/projects/', '/projects/galaxy/', '/es/links/']) {
    await page.goto(route);
    expect(await page.locator('body').innerText()).not.toContain('↗');
    expect(await page.locator('a[href^="https://"] svg.mark').count()).toBeGreaterThan(0);
  }
});

test('on a phone the ledger and the orbit motif are both visible in the first screen, light and dark', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  for (const scheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const route of ['/', '/es/']) {
      await page.goto(route);
      for (const selector of ['.entry.feature', '.entry.feature .orbit', '.entry.feature .number']) {
        const box = await page.locator(selector).boundingBox();
        expect(box.y + box.height, `${route} ${scheme} ${selector}`).toBeLessThanOrEqual(800);
      }
    }
  }
});

test('the galaxy entry opens the assembled game with the language preserved', async ({ page }) => {
  await page.goto('/es/projects/galaxy/');
  await expect(page.getByRole('link', { name: /Abrir la galaxia/ })).toHaveAttribute('href', '/little-galaxy/?lang=es');
  await page.goto('/projects/galaxy/');
  await expect(page.getByRole('link', { name: /Open the galaxy/ })).toHaveAttribute('href', '/little-galaxy/');
});
