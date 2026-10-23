import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');
const routes = ['/', '/projects/', '/about/', '/links/', '/projects/galaxy/'];
for (const prefix of ['', '/es']) {
  for (const route of routes) {
    const filename = path.join(root, prefix, route, 'index.html');
    const html = await readFile(filename, 'utf8');
    assert.ok(html.includes(`<html lang="${prefix ? 'es' : 'en'}"`), `Wrong language: ${prefix}${route}`);
    assert.match(html, /<h1>/);
    assert.ok(!/\bTODO\b/.test(html) && !/P3:|lorem ipsum|coming soon|href="#"|disabled/i.test(html), `Placeholder in ${route}`);
    assert.ok(!html.includes('alexanderkholodov1/portfolio'), `Private repository linked in ${route}`);
    if (route === '/links/') {
      // The only script on Links is the inline theme initializer: no src, no module, under a kilobyte.
      const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
      assert.ok(scripts.length === 1 && !/src=|module/.test(scripts[0][1]) && scripts[0][2].length < 900, `Unexpected script on ${prefix}${route}`);
    }
    for (const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
      let target = path.join(root, decodeURIComponent(match[1]));
      if (match[1].endsWith('/')) target = path.join(target, 'index.html');
      await access(target);
    }
  }
}
const profile = JSON.parse(await readFile(path.join(root, 'profile.json'), 'utf8'));
assert.equal(profile.name, 'Alexander Kholodov');
assert.equal(profile.nav.length, 5);
assert.equal(profile.socials.length, 4);
assert.ok(profile.role);
assert.equal(profile.links.length, 5);
assert.ok(!JSON.stringify(profile).includes('alexanderkholodov1/portfolio'));
const metadata = JSON.parse(await readFile(path.join(root, 'galaxy/version.json'), 'utf8'));
const pin = JSON.parse(await readFile('games.json', 'utf8')).games.galaxy;
assert.equal(`v${metadata.version}`, pin.tag);
const tokens = await readFile(path.join(root, 'tokens.css'), 'utf8');
for (const token of ['paper', 'ink', 'action', 'rule', 'warning', 'confirmed', 'font-display', 'font-text']) assert.ok(tokens.includes(`--pf-${token}:`));
for (const file of await readdir(path.join(root, 'fonts'))) await access(path.join(root, 'fonts', file));
assert.equal(JSON.parse(await readFile('.firebaserc', 'utf8')).projects.default, 'alexanderkholodov');
const hosting = JSON.parse(await readFile('firebase.json', 'utf8')).hosting;
assert.equal(hosting.public, 'dist');
assert.deepEqual(hosting.rewrites, [{ source: '/galaxy{,/**}', destination: '/galaxy/index.html' }, { source: '**', destination: '/404.html' }]);
await access(path.join(root, '404.html'));
console.log('Built-site checks passed: bilingual routes, local links, shared contract, game pin and Hosting config');
