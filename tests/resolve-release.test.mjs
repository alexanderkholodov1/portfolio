import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { isReleaseTag, pickLatestPublishedRelease, resolveGameRelease } from '../scripts/resolve-galaxy-release.mjs';

const selection = { repository: 'alexanderkholodov1/little-galaxy', tag: 'latest' };

test('isReleaseTag validates standard and pre-release tags', () => {
  for (const valid of ['v1.0.0', 'v1.0.1', 'v1.0.0-alpha.1', 'v1.0.0-alpha.2', 'v0.1.0', 'v2.0.0-beta.3']) {
    assert.equal(isReleaseTag(valid), true, `Expected valid: ${valid}`);
  }
  for (const invalid of ['1.0.0', 'v1.0', 'main', 'latest', 'v1.0.0.0', '', null, undefined, {}]) {
    assert.equal(isReleaseTag(invalid), false, `Expected invalid: ${invalid}`);
  }
});

test('pickLatestPublishedRelease orders by publication time, includes pre-releases, and ignores semver and drafts', () => {
  const releases = [
    { tag_name: 'v1.0.1', published_at: '2026-10-23T10:00:00Z', draft: false, prerelease: false },
    { tag_name: 'v1.0.0', published_at: '2026-10-22T10:00:00Z', draft: false, prerelease: false },
    { tag_name: 'v1.0.0-alpha.2', published_at: '2026-10-24T12:00:00Z', draft: false, prerelease: true },
    { tag_name: 'v1.0.0-alpha.1', published_at: '2026-10-24T08:00:00Z', draft: false, prerelease: true },
    { tag_name: 'v2.0.0', published_at: '2026-10-25T00:00:00Z', draft: true, prerelease: false }, // draft must be ignored
  ];
  const picked = pickLatestPublishedRelease(releases);
  // v1.0.0-alpha.2 is the latest published non-draft release, despite v1.0.1 having higher semver.
  assert.equal(picked.tag_name, 'v1.0.0-alpha.2');

  // Drafts only or empty releases fail
  assert.throws(() => pickLatestPublishedRelease([{ tag_name: 'v1.0.0', published_at: '2026-10-20T00:00:00Z', draft: true }]), /no published releases/);
  assert.throws(() => pickLatestPublishedRelease([]), /no published releases/);
  assert.throws(() => pickLatestPublishedRelease(null), /Invalid/);
});

test('resolveGameRelease resolves latest published release with mock network transport and auth', async () => {
  const releases = [
    { tag_name: 'v1.0.1', published_at: '2026-10-23T00:00:00Z', draft: false, prerelease: false },
    { tag_name: 'v1.0.0-alpha.1', published_at: '2026-10-24T00:00:00Z', draft: false, prerelease: true },
  ];
  let requestedUrl;
  let authHeader;
  const fetchRelease = async (url, options) => {
    requestedUrl = url;
    authHeader = options.headers?.Authorization;
    return new Response(JSON.stringify(releases), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const resolved = await resolveGameRelease('galaxy', selection, { token: 'gh-token-123', fetchRelease });
  assert.equal(requestedUrl, 'https://api.github.com/repos/alexanderkholodov1/little-galaxy/releases?per_page=50');
  assert.equal(authHeader, 'Bearer gh-token-123');
  assert.equal(resolved.tag, 'v1.0.0-alpha.1');
  assert.equal(resolved.artifact, 'galaxy-dist-v1.0.0-alpha.1.tar.gz');
  assert.equal(resolved.repository, selection.repository);
});

test('resolveGameRelease resolves specific tag when galaxyTag is supplied', async () => {
  let requestedUrl;
  const fetchRelease = async (url) => {
    requestedUrl = url;
    return new Response(JSON.stringify({ tag_name: 'v1.0.0-alpha.1', draft: false }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const resolved = await resolveGameRelease('galaxy', selection, { galaxyTag: 'v1.0.0-alpha.1', fetchRelease });
  assert.equal(requestedUrl, 'https://api.github.com/repos/alexanderkholodov1/little-galaxy/releases/tags/v1.0.0-alpha.1');
  assert.equal(resolved.tag, 'v1.0.0-alpha.1');
  assert.equal(resolved.artifact, 'galaxy-dist-v1.0.0-alpha.1.tar.gz');
});

test('resolveGameRelease rejects invalid galaxyTag, 404s and network failures without fallback', async () => {
  await assert.rejects(resolveGameRelease('galaxy', selection, { galaxyTag: 'main' }), /GALAXY_TAG/);
  await assert.rejects(resolveGameRelease('galaxy', selection, { galaxyTag: '1.0.0' }), /GALAXY_TAG/);

  const fetch404 = async () => new Response('Not Found', { status: 404 });
  await assert.rejects(resolveGameRelease('galaxy', selection, { fetchRelease: fetch404 }), /HTTP 404.*no fallback/);
  await assert.rejects(resolveGameRelease('galaxy', selection, { galaxyTag: 'v1.0.9', fetchRelease: fetch404 }), /HTTP 404.*no fallback/);

  const fetchError = async () => { throw new Error('connection refused'); };
  await assert.rejects(resolveGameRelease('galaxy', selection, { fetchRelease: fetchError }), /connection refused/);
});

test('resolveGameRelease resolves offline metadata from artifactDirectory', async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'portfolio-resolve-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await writeFile(path.join(dir, 'version.json'), JSON.stringify({ version: '1.0.0-alpha.1', commit: 'a'.repeat(40) }));

  const resolved = await resolveGameRelease('galaxy', selection, { artifactDirectory: dir });
  assert.equal(resolved.tag, 'v1.0.0-alpha.1');
  assert.equal(resolved.artifact, 'galaxy-dist-v1.0.0-alpha.1.tar.gz');
});

test('scripts/resolve-galaxy-release.mjs CLI outputs resolved tag or json', () => {
  const script = fileURLToPath(new URL('../scripts/resolve-galaxy-release.mjs', import.meta.url));
  const root = path.resolve(path.dirname(script), '..');

  const tagResult = spawnSync(process.execPath, [script, '--tag', 'v1.0.1'], { cwd: root, encoding: 'utf8' });
  assert.equal(tagResult.status, 0);
  assert.equal(tagResult.stdout.trim(), 'v1.0.1');

  const jsonResult = spawnSync(process.execPath, [script, '--tag', 'v1.0.1', '--json'], { cwd: root, encoding: 'utf8' });
  assert.equal(jsonResult.status, 0);
  const parsed = JSON.parse(jsonResult.stdout);
  assert.equal(parsed.tag, 'v1.0.1');
  assert.equal(parsed.artifact, 'galaxy-dist-v1.0.1.tar.gz');
});
