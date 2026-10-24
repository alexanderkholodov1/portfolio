import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pickRollbackTarget } from '../scripts/hosting-lib.mjs';
import { rollback } from '../scripts/rollback.mjs';

const env = { GOOGLE_APPLICATION_CREDENTIALS: '/outside/repo/key-file.json' };
const base = { env, log() {}, exists: () => true, root: '/repo' };
const version = (id, status = 'FINALIZED') => ({ name: `projects/1/sites/alexanderkholodov/versions/${id}`, status, fileCount: '40' });
const release = (id, time, status = 'FINALIZED', extra = {}) => ({ name: `projects/1/sites/alexanderkholodov/channels/live/releases/r-${id}-${time}`, releaseTime: `2026-10-${time}T10:00:00Z`, version: version(id, status), ...extra });
const named = (release) => release.version.name.split('/').at(-1);

// Fake REST adapter: the channel resource, release pages by token, and version reads. Nothing ordered for the caller.
function fakeRest({ current, pages, versions = {}, onAsk = () => {} }) {
  const calls = { get: [], post: [] };
  let live = current;
  return {
    calls,
    setLive: (release) => { live = release; },
    get: async (resource, query = '') => {
      calls.get.push(resource + query);
      if (resource.endsWith('/channels/live')) return { release: live };
      if (resource.endsWith('/channels/live/releases')) {
        const token = new URLSearchParams(query).get('pageToken') ?? '';
        const page = pages[token];
        if (!page) throw new Error(`unexpected page token ${token}`);
        return page;
      }
      const id = resource.split('/').at(-1);
      return versions[id] ?? version(id);
    },
    post: async (resource, query, body) => { calls.post.push({ resource, query, body }); return { name: 'projects/1/sites/alexanderkholodov/channels/live/releases/new' }; },
    onAsk,
  };
}

const A = release('a', '01'); const B = release('b', '02'); const C = release('c', '03');

test('an unordered first page does not decide current or previous: the channel and releaseTime do', async () => {
  const rest = fakeRest({ current: C, pages: { '': { releases: [B, A, C] } } });
  const result = await rollback(['--yes'], { ...base, rest });
  assert.equal(result.rolledBackTo.split('/').at(-1), 'b');
  assert.equal(decodeURIComponent(rest.calls.post[0].query), '?versionName=projects/1/sites/alexanderkholodov/versions/b');
});

test('history is paginated: the target on a later page is found', async () => {
  const rest = fakeRest({ current: C, pages: { '': { releases: [C], nextPageToken: 'older' }, older: { releases: [A, B] } } });
  const result = await rollback(['--yes'], { ...base, rest });
  assert.equal(result.rolledBackTo.split('/').at(-1), 'b');
  assert.ok(rest.calls.get.some((call) => call.includes('pageToken=older')));
});

test('repeated, deleted and expired versions are skipped; a history of only those has no target', async () => {
  const noise = [release('c', '03'), release('c', '02'), release('x', '02', 'DELETED'), release('y', '02', 'EXPIRED'), release('z', '02', 'FINALIZED', { type: 'SITE_DISABLE' }), release('w', '02', 'CREATED')];
  assert.equal(named(pickRollbackTarget(C, [...noise, A]).target), 'a');
  assert.throws(() => pickRollbackTarget(C, noise), /No previous release/);
  assert.throws(() => pickRollbackTarget({}, [A]), /No live release/);
  const rest = fakeRest({ current: C, pages: { '': { releases: noise, nextPageToken: 'more' }, more: { releases: [{ ...A, releaseTime: 'not a time' }] } } });
  await assert.rejects(rollback(['--yes'], { ...base, rest }), /No previous release/);
  assert.equal(rest.calls.post.length, 0);
});

test('releases newer than the current one are never a rollback target', () => {
  const newer = release('n', '09');
  assert.equal(named(pickRollbackTarget(C, [newer, B]).target), 'b');
});

test('a release history that never ends is refused rather than guessed', async () => {
  const pages = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [i === 0 ? '' : `p${i}`, { releases: [C], nextPageToken: `p${i + 1}` }]));
  await assert.rejects(rollback(['--yes'], { ...base, rest: fakeRest({ current: C, pages }) }), /more than \d+ pages/);
});

test('rollback revalidates after confirmation: a changed live release or a deleted target writes nothing', async () => {
  const changed = fakeRest({ current: C, pages: { '': { releases: [A, B, C] } } });
  await assert.rejects(rollback([], { ...base, rest: changed, ask: async () => { changed.setLive(release('d', '04')); return 'rollback'; } }), /live release changed/);
  assert.equal(changed.calls.post.length, 0);
  const gone = fakeRest({ current: C, pages: { '': { releases: [A, B, C] } }, versions: { b: version('b', 'DELETED') } });
  await assert.rejects(rollback(['--yes'], { ...base, rest: gone }), /no longer available/);
  assert.equal(gone.calls.post.length, 0);
});

test('rollback shows both versions, confirms with the typed word, prints the deploy-only rollback hint', async () => {
  const rest = fakeRest({ current: C, pages: { '': { releases: [C, B, A] } } });
  const log = [];
  const result = await rollback([], { ...base, rest, log: (line) => log.push(line), ask: async () => 'rollback' });
  assert.equal(rest.calls.post.length, 1);
  assert.match(rest.calls.post[0].resource, /channels\/live\/releases$/);
  assert.equal(result.rolledBackTo, B.version.name);
  const text = log.join('\n');
  assert.match(text, /Live now:\s+c/);
  assert.match(text, /Will become live: b/);
  assert.match(text, /galaxy_tag set to a known-good release/);
});

test('rollback does nothing without the typed word, and --yes skips the prompt', async () => {
  const rest = fakeRest({ current: C, pages: { '': { releases: [C, B] } } });
  assert.deepEqual(await rollback([], { ...base, rest, ask: async () => 'no' }), { aborted: true });
  assert.equal(rest.calls.post.length, 0);
  await rollback(['--yes'], { ...base, rest, ask: () => { throw new Error('must not ask'); } });
  assert.equal(rest.calls.post.length, 1);
});

test('false or malformed confirmation arguments can never reach the production write', async () => {
  for (const argv of [['--yes=false'], ['--yes=0'], ['--yes=no'], ['--yes='], ['--yes=true'], ['--yes', 'false'], ['--yes', '--dry-run=false'], ['-y'], ['--YES'], ['yes']]) {
    const rest = fakeRest({ current: C, pages: { '': { releases: [C, B] } } });
    await assert.rejects(rollback(argv, { ...base, rest, ask: async () => 'rollback' }), /takes no value|Unexpected argument|Unknown flag/, argv.join(' '));
    assert.deepEqual([rest.calls.get, rest.calls.post], [[], []], argv.join(' '));
  }
});

test('rollback --dry-run makes no call and needs no credentials', async () => {
  const log = [];
  const rest = { get: () => { throw new Error('network'); }, post: () => { throw new Error('network'); } };
  await rollback(['--dry-run'], { env: {}, rest, log: (line) => log.push(line) });
  assert.match(log.join('\n'), /dry-run.*POST/);
});

test('tagged rollback uses the preview and smoke deployment path without changing the manifest', async () => {
  let called = false;
  await rollback(['--galaxy-tag', 'v1.0.1', '--dry-run'], { deploy: async (argv) => {
    called = true;
    assert.deepEqual(argv, ['--release', '--galaxy-tag', 'v1.0.1', '--dry-run']);
  } });
  assert.ok(called);
});
