import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { assembleGames } from '../scripts/assemble-games.mjs';
import { deployLocal, smokeCheck } from '../scripts/deploy-local.mjs';
import { checkCredentials, parseArgs, pickRollbackTarget } from '../scripts/hosting-lib.mjs';
import { rollback } from '../scripts/rollback.mjs';

const pin = { repository: 'alexanderkholodov1/little-galaxy', tag: 'v0.1.0', artifact: 'galaxy-dist-v0.1.0.tar.gz' };
const commit = 'b'.repeat(40);
const version = JSON.stringify({ version: '0.7.0', commit, builtAt: '2026-10-22T00:00:00Z' });
const initialExitCode = process.exitCode;
const env = { GOOGLE_APPLICATION_CREDENTIALS: '/outside/repo/key-file.json' };

async function workspace(t) {
  const base = await mkdtemp(path.join(os.tmpdir(), 'portfolio-deploy-'));
  t.after(() => rm(base, { recursive: true, force: true }));
  const root = path.join(base, 'portfolio');
  const build = path.join(base, 'little-galaxy/apps/web/dist');
  await mkdir(path.join(root, 'dist'), { recursive: true });
  await mkdir(path.join(build, 'assets'), { recursive: true });
  await writeFile(path.join(root, 'games.json'), JSON.stringify({ schemaVersion: 1, games: { galaxy: pin } }));
  await writeFile(path.join(root, 'dist/index.html'), '<h1>Portfolio</h1>');
  await writeFile(path.join(build, 'index.html'), '<script src="/galaxy/assets/app.js"></script>');
  await writeFile(path.join(build, 'version.json'), version);
  await writeFile(path.join(build, 'assets/app.js'), 'console.log("fixture");');
  return { base, root, build };
}

// Every external effect is a mock: build commands, firebase CLI and HTTP.
function harness(t, ctx, { status = {}, served = '0.7.0', answer = 'promote' } = {}) {
  const calls = { exec: [], firebase: [], fetch: [], log: [] };
  const deps = {
    root: ctx.root, env, exists: () => true,
    log: (line) => calls.log.push(line),
    exec: async (command, args, options) => { calls.exec.push([command, ...args, options.cwd]); },
    firebase: async (args) => {
      calls.firebase.push(args);
      return args[0] === 'hosting:channel:deploy' ? JSON.stringify({ status: 'success', result: { alexanderkholodov: { url: 'https://alexanderkholodov--local-x-abc.web.app' } } }) : '';
    },
    fetch: async (url) => {
      calls.fetch.push(url);
      const route = new URL(url).pathname;
      const code = status[route] ?? 200;
      return route === '/galaxy/version.json' ? new Response(JSON.stringify({ version: served }), { status: code }) : new Response('ok', { status: code });
    },
    ask: async () => answer,
  };
  t.after(() => { process.exitCode = initialExitCode; });
  return { calls, deps };
}

test('dry-run prints every action and runs nothing', async (t) => {
  const ctx = await workspace(t);
  const { calls, deps } = harness(t, ctx);
  deps.assemble = () => { throw new Error('must not run'); };
  await deployLocal(['--dry-run', '--channel', 'rehearsal'], deps);
  assert.deepEqual([calls.exec, calls.firebase, calls.fetch], [[], [], []]);
  const text = calls.log.join('\n');
  for (const needle of ['build:site', 'hosting:channel:deploy rehearsal', 'hosting:clone alexanderkholodov:rehearsal alexanderkholodov:live', 'promote', 'no network call']) assert.ok(text.includes(needle), needle);
});

test('previews, passes smoke, promotes only after typed confirmation, and the dist is labelled local', async (t) => {
  const ctx = await workspace(t);
  const { calls, deps } = harness(t, ctx);
  deps.assemble = (options) => assembleGames({ ...options, allowedPublicKeys: [] });
  const result = await deployLocal(['--galaxy', path.join(ctx.base, 'little-galaxy'), '--channel', 'rehearsal'], deps);
  assert.equal(result.promoted, true);
  assert.deepEqual(calls.firebase.map((args) => args[0]), ['hosting:channel:deploy', 'hosting:clone']);
  assert.deepEqual(calls.firebase[1], ['hosting:clone', 'alexanderkholodov:rehearsal', 'alexanderkholodov:live']);
  assert.deepEqual(calls.exec.map((call) => call.slice(0, 3).join(' ')), ['pnpm run build:site', 'pnpm run build']);
  assert.ok(calls.fetch.slice(0, 5).every((url) => url.startsWith('https://alexanderkholodov--local-x-abc.web.app/')));
  assert.ok(calls.fetch.slice(5).every((url) => url.startsWith('https://alexanderkholodov.web.app/')));
  const receipt = JSON.parse(await readFile(path.join(ctx.root, 'dist/assembly.json'), 'utf8'));
  assert.equal(receipt.games.galaxy.source, 'local-build');
  assert.equal(receipt.games.galaxy.tag, 'v0.7.0');
  assert.equal(await readFile(path.join(ctx.root, 'dist/galaxy/version.json'), 'utf8'), version);
});

test('any answer other than "promote" leaves live untouched', async (t) => {
  const ctx = await workspace(t);
  const { calls, deps } = harness(t, ctx, { answer: 'yes' });
  deps.assemble = (options) => assembleGames({ ...options, allowedPublicKeys: [] });
  const result = await deployLocal(['--galaxy', path.join(ctx.base, 'little-galaxy')], deps);
  assert.equal(result.promoted, false);
  assert.deepEqual(calls.firebase.map((args) => args[0]), ['hosting:channel:deploy']);
});

test('--yes promotes without asking, but never past a failed smoke check', async (t) => {
  const ctx = await workspace(t);
  const good = harness(t, ctx);
  good.deps.assemble = (options) => assembleGames({ ...options, allowedPublicKeys: [] });
  good.deps.ask = () => { throw new Error('must not ask'); };
  assert.equal((await deployLocal(['--yes', '--galaxy', path.join(ctx.base, 'little-galaxy')], good.deps)).promoted, true);
  for (const bad of [{ status: { '/links/': 500 } }, { served: '0.6.0' }]) {
    const { calls, deps } = harness(t, ctx, bad);
    deps.assemble = (options) => assembleGames({ ...options, allowedPublicKeys: [] });
    const result = await deployLocal(['--yes', '--galaxy', path.join(ctx.base, 'little-galaxy')], deps);
    assert.equal(result.promoted, false);
    assert.ok(!calls.firebase.some((args) => args[0] === 'hosting:clone'));
  }
});

test('pinned artifact mode skips the galaxy build', async (t) => {
  const ctx = await workspace(t);
  const { calls, deps } = harness(t, ctx);
  deps.assemble = async (options) => {
    assert.equal(options.artifactDirectory, path.resolve('/some/artifacts'));
    await mkdir(path.join(ctx.root, 'dist/galaxy'), { recursive: true });
    await writeFile(path.join(ctx.root, 'dist/galaxy/version.json'), version);
    return { games: { galaxy: { tag: 'v0.1.0', source: 'local-rehearsal', commit } } };
  };
  await deployLocal(['--artifact-dir', '/some/artifacts', '--no-smoke', '--yes'], deps);
  assert.deepEqual(calls.exec.map((call) => call.slice(0, 3).join(' ')), ['pnpm run build:site']);
  assert.deepEqual(calls.fetch, []);
});

test('rejects bad channels, live as a channel, and unsafe credential locations', async (t) => {
  const ctx = await workspace(t);
  const { deps } = harness(t, ctx);
  for (const channel of ['live', 'Bad_Name', '../x']) await assert.rejects(deployLocal(['--dry-run', '--channel', channel], deps), /Invalid channel/);
  assert.throws(() => checkCredentials({}, ctx.root), /GOOGLE_APPLICATION_CREDENTIALS/);
  assert.throws(() => checkCredentials({ GOOGLE_APPLICATION_CREDENTIALS: path.join(ctx.root, 'key.json') }, ctx.root, () => true), /under private/);
  assert.doesNotThrow(() => checkCredentials({ GOOGLE_APPLICATION_CREDENTIALS: path.join(ctx.root, 'private/key.json') }, ctx.root, () => true));
  assert.throws(() => parseArgs(['--nope'], {}), /Unknown flag/);
});

test('smoke check reports the wrong version and failing routes', async () => {
  const fetch = async (url) => new Response(url.endsWith('version.json') ? '{"version":"1.0.0"}' : 'ok', { status: url.endsWith('/es/') ? 404 : 200 });
  const failures = await smokeCheck('https://x.web.app', '0.7.0', fetch);
  assert.deepEqual(failures, ['/es/: HTTP 404', '/galaxy/version.json: version 1.0.0, expected 0.7.0']);
});

test('local build passes the release checks: private material, wrong base, links and missing files are rejected', async (t) => {
  const ctx = await workspace(t);
  const run = () => assembleGames({ root: ctx.root, artifactDirectory: '', allowedPublicKeys: [], localBuilds: { galaxy: ctx.build } });
  await mkdir(path.join(ctx.root, 'dist/galaxy'));
  await writeFile(path.join(ctx.root, 'dist/galaxy/previous.txt'), 'previous');
  await writeFile(path.join(ctx.build, 'assets/leak.js'), '-----BEGIN PRIVATE KEY-----');
  await assert.rejects(run(), /Privacy gate/);
  await rm(path.join(ctx.build, 'assets/leak.js'));
  await symlink('/etc/hostname', path.join(ctx.build, 'assets/link'));
  await assert.rejects(run(), /symbolic link/);
  await rm(path.join(ctx.build, 'assets/link'));
  await writeFile(path.join(ctx.build, 'index.html'), '<script src="/assets/app.js"></script>');
  await assert.rejects(run(), /asset base/);
  await writeFile(path.join(ctx.build, 'index.html'), '<script src="/galaxy/assets/app.js"></script>');
  await writeFile(path.join(ctx.build, 'version.json'), '{"version":"x"}');
  await assert.rejects(run(), /metadata is invalid/);
  await rm(path.join(ctx.build, 'version.json'));
  await assert.rejects(run(), /missing index.html or version.json/);
  assert.equal(await readFile(path.join(ctx.root, 'dist/galaxy/previous.txt'), 'utf8'), 'previous');
  await assert.rejects(assembleGames({ root: ctx.root, artifactDirectory: '', localBuilds: { other: ctx.build } }), /unpinned/);
});

const release = (id, status = 'FINALIZED', time = '2026-10-22T10:00:00Z') => ({ name: `projects/1/sites/s/channels/live/releases/r-${id}`, releaseTime: time, version: { name: `projects/1/sites/s/versions/${id}`, status, fileCount: '40' } });

test('rollback picks the newest finalized release that differs from the live version', () => {
  const { current, target } = pickRollbackTarget([release('c'), release('c'), release('x', 'DELETED'), release('b'), release('a')]);
  assert.equal(current.version.name.at(-1), 'c');
  assert.equal(target.version.name.at(-1), 'b');
  assert.throws(() => pickRollbackTarget([release('a')]), /No previous release/);
  assert.throws(() => pickRollbackTarget([]), /No live release/);
});

function fakeRest(releases) {
  const posts = [];
  return { posts, get: async () => ({ releases }), post: async (resource, query, body) => { posts.push({ resource, query, body }); return { name: 'projects/1/sites/s/channels/live/releases/new' }; } };
}

test('rollback shows both versions, creates a live release for the previous one on confirmation, prints the git hint', async () => {
  const rest = fakeRest([release('c'), release('b'), release('a')]);
  const log = [];
  const result = await rollback([], { env, rest, log: (line) => log.push(line), exists: () => true, ask: async () => 'rollback', root: '/repo' });
  assert.equal(rest.posts.length, 1);
  assert.match(rest.posts[0].resource, /channels\/live\/releases$/);
  assert.equal(decodeURIComponent(rest.posts[0].query), '?versionName=projects/1/sites/s/versions/b');
  assert.equal(result.rolledBackTo, 'projects/1/sites/s/versions/b');
  const text = log.join('\n');
  assert.match(text, /Live now:\s+c/);
  assert.match(text, /Will become live: b/);
  assert.match(text, /revert the games\.json pin/);
});

test('rollback does nothing without the typed word, and --yes skips the prompt', async () => {
  const rest = fakeRest([release('c'), release('b')]);
  const base = { env, rest, log() {}, exists: () => true, root: '/repo' };
  assert.deepEqual(await rollback([], { ...base, ask: async () => 'no' }), { aborted: true });
  assert.equal(rest.posts.length, 0);
  await rollback(['--yes'], { ...base, ask: () => { throw new Error('must not ask'); } });
  assert.equal(rest.posts.length, 1);
});

test('rollback --dry-run makes no call and needs no credentials', async () => {
  const log = [];
  const rest = { get: () => { throw new Error('network'); }, post: () => { throw new Error('network'); } };
  await rollback(['--dry-run'], { env: {}, rest, log: (line) => log.push(line) });
  assert.match(log.join('\n'), /dry-run.*POST/);
});
