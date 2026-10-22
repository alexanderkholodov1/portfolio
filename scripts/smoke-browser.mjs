// Headless-browser smoke test for a deployed origin (a preview channel or live). Every route is opened in a
// fresh context so nothing is served from a cache. Only same-origin requests are judged: the checks are about
// this deploy's own files, not about third-party services the pages may call.
const portfolioRoutes = ['/', '/es/', '/links/'];
const galaxyRoutes = ['/galaxy/', '/galaxy/screen', '/galaxy/create'];
const chunkError = /Loading (?:CSS )?chunk|dynamically imported module|Importing a module script failed|ChunkLoadError|Failed to fetch dynamically/i;

export async function launchChromium() {
  const { chromium } = await import('@playwright/test');
  return chromium.launch({ headless: true });
}

async function checkRoute(browser, origin, route, isGalaxy, { rootTimeout, settle }) {
  const problems = [];
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  try {
    const page = await context.newPage();
    const sameOrigin = (url) => url.startsWith(`${origin}/`);
    page.on('pageerror', (error) => problems.push(`runtime error: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      if (!isGalaxy || chunkError.test(message.text())) problems.push(`console error: ${message.text().slice(0, 200)}`);
    });
    page.on('requestfailed', (request) => {
      if (sameOrigin(request.url()) && !/ERR_ABORTED/.test(request.failure()?.errorText ?? '')) problems.push(`request failed: ${new URL(request.url()).pathname}`);
    });
    page.on('response', (response) => {
      if (sameOrigin(response.url()) && response.status() >= 400) problems.push(`HTTP ${response.status()}: ${new URL(response.url()).pathname}`);
    });
    const main = await page.goto(`${origin}${route}`, { waitUntil: 'load', timeout: 30_000 });
    if (main?.status() !== 200) problems.push(`HTTP ${main?.status()}`);
    if (isGalaxy) {
      const rendered = await page.waitForFunction(() => (document.getElementById('root')?.childElementCount ?? 0) > 0, null, { timeout: rootTimeout }).then(() => true, () => false);
      if (!rendered) problems.push('the app root never rendered');
    } else if (!(await page.evaluate(() => document.querySelector('h1')?.textContent ?? '')).trim()) problems.push('no heading rendered');
    await page.waitForTimeout(settle); // late chunk loads and runtime errors
  } catch (error) {
    problems.push(`could not load: ${error.message.split('\n')[0]}`);
  } finally { await context.close(); }
  return [...new Set(problems)].map((problem) => `${route}: ${problem}`);
}

// Returns a list of failures; an empty list means the origin passed.
export async function browserSmoke(origin, expected, { browser, fetch = globalThis.fetch, rootTimeout = 15_000, settle = 1000 } = {}) {
  const failures = [];
  const timing = { rootTimeout, settle };
  for (const route of portfolioRoutes) failures.push(...await checkRoute(browser, origin, route, false, timing));
  for (const route of galaxyRoutes) failures.push(...await checkRoute(browser, origin, route, true, timing));
  try {
    const response = await fetch(`${origin}/galaxy/version.json`, { signal: AbortSignal.timeout(30_000), headers: { 'Cache-Control': 'no-cache' } });
    if (response.status !== 200) failures.push(`/galaxy/version.json: HTTP ${response.status}`);
    else {
      const served = await response.json();
      if (served.version !== expected.version) failures.push(`/galaxy/version.json: version ${served.version}, expected ${expected.version}`);
      if (served.commit !== expected.commit) failures.push(`/galaxy/version.json: commit ${String(served.commit).slice(0, 12)}, expected ${expected.commit.slice(0, 12)}`);
    }
  } catch (error) { failures.push(`/galaxy/version.json: ${error.message}`); }
  return failures;
}
