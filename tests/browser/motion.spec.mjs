// The motion budget in the browser: wherever the visitor is on a page, every animation that is running changes only
// compositor properties, and none runs far from the screen (sections pause their loops while out of view).
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (route) => (new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort()));
});

const COMPOSITED = ['transform', 'opacity', 'translate', 'scale', 'rotate', 'offset', 'composite', 'easing', 'computedOffset'];
const routes = ['/', '/projects/', '/experience/', '/services/', '/about/', '/links/', '/projects/galaxy/', '/projects/studium/', '/es/'];

for (const route of routes) {
  test(`${route}: running animations stay on the compositor and near the screen`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(route);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (const y of [0, height / 2, height]) {
      await page.evaluate((top) => scrollTo({ top, behavior: 'instant' }), y);
      await page.waitForTimeout(400);
      const problems = await page.evaluate((composited) => {
        const out = [];
        for (const a of document.getAnimations()) {
          if (a.playState !== 'running') continue;
          const name = a.animationName || a.transitionProperty || a.id || 'script animation';
          const el = a.effect?.target;
          const painted = new Set();
          for (const k of a.effect?.getKeyframes() ?? []) for (const p of Object.keys(k)) if (!composited.includes(p)) painted.add(p);
          if (painted.size) out.push(`${name} animates ${[...painted].join(', ')}`);
          const r = el?.getBoundingClientRect?.();
          // Finite entrances (a card rising into view) may finish just outside; only loops must be near the screen.
          const loops = a.effect?.getTiming().iterations === Infinity;
          if (loops && r && (r.bottom < -innerHeight || r.top > 2 * innerHeight)) out.push(`${name} loops ${Math.round(r.top)}px away on ${el.className || el.tagName}`);
        }
        return out;
      }, COMPOSITED);
      expect(problems, `${route} at ${Math.round(y)}px`).toEqual([]);
    }
  });
}
