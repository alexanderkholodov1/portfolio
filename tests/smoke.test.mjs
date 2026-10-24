import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { browserSmoke, launchChromium } from '../scripts/smoke-browser.mjs';

const commit = 'a'.repeat(40);
const expected = { version: '0.7.0', commit };
const boot = 'document.getElementById("root").append(document.createElement("main"));';

// A tiny fake deployment. `overrides` replaces individual files so each test breaks exactly one thing.
async function origin(t, overrides = {}) {
  const home = '<!doctype html><title>x</title><h1>Alexander</h1>';
  const galaxy = '<!doctype html><div id="root"></div><script type="module" src="/galaxy/assets/app.js"></script>';
  const files = {
    '/': home, '/es/': home, '/links/': home,
    '/galaxy/': galaxy, '/galaxy/screen': galaxy, '/galaxy/create': galaxy,
    '/galaxy/assets/app.js': boot,
    '/galaxy/version.json': JSON.stringify({ version: '0.7.0', commit }),
    ...overrides,
  };
  const server = createServer((request, response) => {
    const body = files[new URL(request.url, 'http://x').pathname];
    if (body === undefined) { response.writeHead(404).end('missing'); return; }
    const type = request.url.endsWith('.js') ? 'text/javascript' : request.url.endsWith('.json') ? 'application/json' : 'text/html';
    response.writeHead(200, { 'Content-Type': type }).end(body);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  return `http://127.0.0.1:${server.address().port}`;
}

let browser;
test.before(async () => { browser = await launchChromium(); });
test.after(async () => { await browser?.close(); });

test('a healthy deployment passes: portfolio renders and every galaxy route boots', async (t) => {
  assert.deepEqual(await browserSmoke(await origin(t), expected, { browser, rootTimeout: 3000, settle: 300 }), []);
});

test('a missing chunk fails the gate', async (t) => {
  const galaxy = '<!doctype html><div id="root"></div><script type="module" src="/galaxy/assets/app.js"></script>';
  const failures = await browserSmoke(await origin(t, { '/galaxy/assets/app.js': `${boot} import('/galaxy/assets/chunk-gone.js');` }), expected, { browser, rootTimeout: 3000, settle: 300 });
  assert.ok(failures.some((failure) => /\/galaxy\/\S*: .*chunk-gone/.test(failure)), failures.join('\n'));
  const missingEntry = await browserSmoke(await origin(t, { '/galaxy/screen': galaxy.replace('app.js', 'gone.js') }), expected, { browser, rootTimeout: 3000, settle: 300 });
  assert.ok(missingEntry.some((failure) => failure.startsWith('/galaxy/screen: ') && /never rendered/.test(failure)), missingEntry.join('\n'));
  assert.ok(missingEntry.some((failure) => /HTTP 404/.test(failure)));
});

test('a runtime error fails the gate, on the galaxy and on the portfolio', async (t) => {
  const galaxy = await browserSmoke(await origin(t, { '/galaxy/assets/app.js': `${boot} throw new Error('boom');` }), expected, { browser, rootTimeout: 3000, settle: 300 });
  assert.ok(galaxy.some((failure) => /runtime error: .*boom/.test(failure)), galaxy.join('\n'));
  const portfolio = await browserSmoke(await origin(t, { '/links/': '<h1>Links</h1><script>console.error("broken");</script>' }), expected, { browser, rootTimeout: 3000, settle: 300 });
  assert.deepEqual(portfolio.map((failure) => failure.split(':')[0]), ['/links/']);
});

test('an app root that never renders fails the gate', async (t) => {
  const failures = await browserSmoke(await origin(t, { '/galaxy/assets/app.js': '/* does nothing */' }), expected, { browser, rootTimeout: 3000, settle: 300 });
  assert.equal(failures.filter((failure) => /never rendered/.test(failure)).length, 3);
});

test('the same version with a different commit fails the gate', async (t) => {
  const served = JSON.stringify({ version: '0.7.0', commit: 'c'.repeat(40) });
  const failures = await browserSmoke(await origin(t, { '/galaxy/version.json': served }), expected, { browser, rootTimeout: 3000, settle: 300 });
  assert.deepEqual(failures, [`/galaxy/version.json: commit ${'c'.repeat(12)}, expected ${'a'.repeat(12)}`]);
  const other = await browserSmoke(await origin(t, { '/galaxy/version.json': JSON.stringify({ version: '0.6.0', commit }) }), expected, { browser, rootTimeout: 3000, settle: 300 });
  assert.deepEqual(other, ['/galaxy/version.json: version 0.6.0, expected 0.7.0']);
});

test('a portfolio route that is not served fails the gate', async (t) => {
  const failures = await browserSmoke(await origin(t, { '/es/': undefined }), expected, { browser, rootTimeout: 3000, settle: 300 });
  assert.ok(failures.some((failure) => failure.startsWith('/es/: ') && /HTTP 404/.test(failure)), failures.join('\n'));
});
