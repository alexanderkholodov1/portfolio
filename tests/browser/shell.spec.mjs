import { test, expect } from '@playwright/test';

// Nothing outside the loopback harness is ever contacted.
test.beforeEach(async ({ context }) => {
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    return url.hostname === '127.0.0.1' ? route.continue() : route.abort();
  });
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
        // Own pages, the home's chapter anchors, his profiles and the live sites of his projects.
        expect(href).toMatch(/^(\/|#(main|who|work|community|learning|impact|services|contact)$|https:\/\/(www\.)?(github\.com\/(alexanderkholodov1|DhamarAM)\b|linkedin\.com\/in\/alexanderkholodov1\/|instagram\.com\/alexanderkholodov1\/|facebook\.com\/alexanderkholodov0\/|alexanderkholodov1\.itch\.io\/sublime-airlift|(munhub-lab|farpoint-horizon|nivela-ec|dragon-ocean-analyzer|alexanderkholodov)\.web\.app\/|panchobus-backend--panchobus-1\.us-east4\.hosted\.app\/))/);
      }
    }
  }
  const profile = await (await page.request.get('/profile.json')).json();
  expect(JSON.stringify(profile)).not.toContain('alexanderkholodov1/portfolio');
  expect(profile.links).toEqual([
    { label: 'Little Galaxy on GitHub', href: 'https://github.com/alexanderkholodov1/little-galaxy' },
    { label: 'MunHub', href: 'https://munhub-lab.web.app/' },
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
    expect(await page.locator('li.pcard').count()).toBeGreaterThanOrEqual(10);
    await expect(page.locator('.blank, .blank-block')).toHaveCount(0);
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

const paper = { light: 'rgb(243, 244, 247)', dark: 'rgb(7, 20, 33)' };
for (const [system, chosen] of [['light', 'dark'], ['dark', 'light']]) {
  test(`a ${chosen} choice against a ${system} system survives Home, Links, reload and Spanish Links`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.emulateMedia({ colorScheme: system });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', system);
    await page.locator('#theme').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', chosen);
    await page.locator('footer a', { hasText: 'Links' }).click();
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

test('the galaxy entry opens the assembled game with the language preserved', async ({ page }) => {
  await page.goto('/es/projects/galaxy/');
  await expect(page.getByRole('link', { name: /Abrir la galaxia/ })).toHaveAttribute('href', '/little-galaxy/?lang=es');
  await page.goto('/projects/galaxy/');
  await expect(page.getByRole('link', { name: /Open the galaxy/ })).toHaveAttribute('href', '/little-galaxy/');
});
