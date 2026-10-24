import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile, rm, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { Header } from 'tar';
import { test } from 'node:test';
import { assembleGames, validateArchive, validateManifest } from '../scripts/assemble-games.mjs';

const pin = { repository: 'alexanderkholodov1/little-galaxy', tag: 'v0.1.0', artifact: 'galaxy-dist-v0.1.0.tar.gz' };
const manifest = { schemaVersion: 1, games: { galaxy: pin } };
const version = Buffer.from(JSON.stringify({ version: '0.1.0', commit: 'a'.repeat(40), builtAt: '2026-10-21T00:00:00Z' }));
const entry = (name, data, type = 'File', linkpath) => ({ name, data: Buffer.from(data), type, linkpath });
const valid = () => [entry('./index.html', '<script src="/galaxy/assets/app.js"></script>'), entry('./version.json', version), entry('./assets/app.js', 'console.log("synthetic test fixture");')];

function tarball(entries) {
  const blocks = [];
  for (const { name, data, type, linkpath } of entries) {
    const block = Buffer.alloc(512);
    new Header({ path: name, size: data.length, mode: 0o644, type, linkpath }).encode(block);
    blocks.push(block, data, Buffer.alloc((512 - data.length % 512) % 512));
  }
  return gzipSync(Buffer.concat([...blocks, Buffer.alloc(1024)]));
}

async function fixture(t, entries = valid(), metadata = version) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'portfolio-assembly-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const artifactDirectory = path.join(root, 'release');
  await mkdir(artifactDirectory);
  await mkdir(path.join(root, 'dist/galaxy'), { recursive: true });
  await writeFile(path.join(root, 'dist/index.html'), '<h1>Portfolio</h1>');
  await writeFile(path.join(root, 'dist/galaxy/previous.txt'), 'previous known build');
  await writeFile(path.join(root, 'games.json'), JSON.stringify(manifest));
  const archive = tarball(entries);
  await writeFile(path.join(artifactDirectory, pin.artifact), archive);
  await writeFile(path.join(artifactDirectory, 'version.json'), metadata);
  const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
  await writeFile(path.join(artifactDirectory, 'SHA256SUMS'), `${hash(archive)}  ${pin.artifact}\n${hash(metadata)}  version.json\n`);
  return { root, artifactDirectory, allowDownload: false };
}

test('assembles a release-shaped local tarball, preserves portfolio and records its source', async (t) => {
  const options = await fixture(t);
  const result = await assembleGames(options);
  assert.equal(result.games.galaxy.source, 'local-rehearsal');
  assert.equal(result.games.galaxy.tag, pin.tag);
  assert.equal(await readFile(path.join(options.root, 'dist/galaxy/version.json'), 'utf8'), version.toString());
  assert.match(await readFile(path.join(options.root, 'dist/index.html'), 'utf8'), /Portfolio/);
  assert.ok(!(await readdir(path.join(options.root, 'dist/galaxy'))).includes('previous.txt'));
});

test('missing archive fails without attempting network', async (t) => {
  const options = await fixture(t);
  await rm(path.join(options.artifactDirectory, pin.artifact));
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('NETWORK MUST NOT RUN'); };
  t.after(() => { globalThis.fetch = originalFetch; });
  await assert.rejects(assembleGames({ ...options, allowDownload: true }), /ENOENT/);
  await assert.rejects(assembleGames({ root: options.root, artifactDirectory: '', allowDownload: false }), /needs GAMES_ARTIFACT_DIR/);
});

test('corrupt checksum leaves the previous game untouched', async (t) => {
  const options = await fixture(t);
  await writeFile(path.join(options.artifactDirectory, pin.artifact), 'corrupt archive');
  await assert.rejects(assembleGames(options), /checksum/);
  assert.equal(await readFile(path.join(options.root, 'dist/galaxy/previous.txt'), 'utf8'), 'previous known build');
});

for (const malicious of [entry('../escape', 'bad'), entry('/absolute', 'bad'), entry('./assets/link', '', 'SymbolicLink', '../../outside'), entry('./hardlink', '', 'Link', '/outside'), entry('./private/key.json', 'bad'), entry('./.env', 'bad'), entry('./assets\\escape', 'bad'), entry('./index.html', 'duplicate')]) {
  test(`rejects unsafe archive entry ${malicious.name}`, async (t) => {
    const options = await fixture(t, [...valid(), malicious]);
    await assert.rejects(validateArchive(path.join(options.artifactDirectory, pin.artifact)), /Unsafe/);
  });
}

test('rejects wrong version and mismatched standalone metadata', async (t) => {
  const wrong = Buffer.from(version.toString().replace('0.1.0', '0.2.0'));
  const entries = valid(); entries[1] = entry('./version.json', wrong);
  const options = await fixture(t, entries, wrong);
  await assert.rejects(assembleGames(options), /metadata does not match/);
  const mismatch = await fixture(t, valid(), wrong);
  await assert.rejects(assembleGames(mismatch), /version.json differ/);
});

test('rejects missing entrypoint, wrong base and private payload before replacement', async (t) => {
  const missing = await fixture(t, valid().slice(1));
  await assert.rejects(assembleGames(missing), /missing index/);
  const entries = valid(); entries[0] = entry('./index.html', '<script src="/assets/app.js"></script>');
  await assert.rejects(assembleGames(await fixture(t, entries)), /asset base/);
  const secret = await fixture(t, [...valid(), entry('./assets/data.js', '-----BEGIN PRIVATE KEY-----')]);
  await assert.rejects(assembleGames(secret), /Privacy gate/);
  assert.equal(await readFile(path.join(secret.root, 'dist/galaxy/previous.txt'), 'utf8'), 'previous known build');
});

test('rejects unpinned versions and unsafe mount paths', () => {
  for (const games of [{ galaxy: { ...pin, tag: 'latest' } }, { '../galaxy': pin }, { assets: pin }]) {
    assert.throws(() => validateManifest({ schemaVersion: 1, games }), /Invalid/);
  }
});

test('authorized download uses only the configured pinned release URLs (mock transport)', async (t) => {
  const options = await fixture(t);
  const requested = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    requested.push(url);
    const bytes = await readFile(path.join(options.artifactDirectory, url.split('/').at(-1)));
    return new Response(bytes);
  };
  t.after(() => { globalThis.fetch = originalFetch; });
  const result = await assembleGames({ ...options, artifactDirectory: '', allowDownload: true });
  assert.deepEqual(requested, [pin.artifact, 'SHA256SUMS', 'version.json'].map((file) => `https://github.com/${pin.repository}/releases/download/${pin.tag}/${file}`));
  assert.equal(result.games.galaxy.source, 'github-release');
});
