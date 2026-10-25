import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';

// Builds the site against tests/fixtures/two-projects.ts (a complete second project listed before the
// galaxy) and checks the rendered HTML in both languages. The fixture never enters the real build.
let out;
const page = (route) => readFile(path.join(out, route, 'index.html'), 'utf8');
const rows = (html) => [...html.matchAll(/<li class="entry project"[^>]*>([\s\S]*?)<\/li>/g)].map((match) => match[1]);

before(async () => {
  out = await mkdtemp(path.join(os.tmpdir(), 'portfolio-fixture-'));
  const result = spawnSync('pnpm', ['exec', 'astro', 'build', '--outDir', out], {
    env: { ...process.env, PORTFOLIO_CONTENT_FIXTURE: 'tests/fixtures/two-projects.ts', ASTRO_TELEMETRY_DISABLED: '1' },
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
after(() => rm(out, { recursive: true, force: true }));

for (const [lang, prefix, first, second, open] of [
  ['en', '', 'Lantern Works', 'Collective Galaxy', 'Open'],
  ['es', 'es/', 'Taller Linterna', 'Galaxia Colectiva', 'Abrir'],
]) {
  test(`Projects renders the whole collection in order, each project with its own link (${lang})`, async () => {
    const found = rows(await page(`${prefix}projects`));
    assert.equal(found.length, 2);
    assert.match(found[0], /<span class="figure number">01<\/span>/);
    assert.match(found[1], /<span class="figure number">02<\/span>/);
    assert.match(found[0], new RegExp(`<h2><a [^>]*href="https://example.org/lantern/"[^>]*>${first}</a></h2>`));
    assert.match(found[0], new RegExp(`href="https://example.org/lantern/"[^>]*>${open} `));
    assert.ok(!found[0].includes('little-galaxy') && !found[0].includes('/galaxy/'));
    assert.match(found[1], new RegExp(`<h2><a [^>]*href="/${prefix}projects/galaxy/"[^>]*>${second}</a></h2>`));
    assert.match(found[1], new RegExp(`href="/little-galaxy/${lang === 'es' ? '\\?lang=es' : ''}"[^>]*>${open} `));
    assert.match(found[1], /href="https:\/\/github\.com\/alexanderkholodov1\/little-galaxy"/);
  });

  test(`Home and the galaxy entry pick the galaxy by id, not by position (${lang})`, async () => {
    const home = await page(prefix.replace(/\/$/, ''));
    const feature = home.match(/<a class="entry feature" href="([^"]+)">([\s\S]*?)<\/a>/);
    assert.equal(feature[1], `/${prefix}projects/galaxy/`);
    assert.ok(feature[2].includes(second) && !feature[2].includes(first));
    assert.ok(/class="live"[\s\S]*?<\/a>/.exec(home)[0].includes(second));
    const entry = await page(`${prefix}projects/galaxy`);
    assert.match(entry, new RegExp(`<h1>${second}</h1>`));
    assert.ok(!entry.includes(first));
  });
}
