import assert from 'node:assert/strict';
import { test } from 'node:test';
import { interpret, readLive, snapshotUrl, STALE_AFTER_MS } from '../src/lib/live-snapshot.ts';

const now = Date.parse('2026-10-22T15:00:00Z');
const doc = (count, ageMs, kind = 'integerValue') => ({
  fields: {
    creatorCount: { [kind]: count },
    updatedAt: { timestampValue: new Date(now - ageMs).toISOString() },
  },
});

test('a fresh integer count is returned as a number', () => {
  assert.deepEqual(interpret(doc('42', 30_000), now), { state: 'fresh', count: 42, updatedAt: now - 30_000 });
  assert.equal(interpret(doc('0', 0), now).count, 0);
  assert.equal(interpret(doc(7, 1000, 'doubleValue'), now).count, 7);
});

test('a snapshot older than ten minutes shows no count', () => {
  assert.equal(interpret(doc('42', STALE_AFTER_MS), now).state, 'fresh');
  const stale = interpret(doc('42', STALE_AFTER_MS + 1), now);
  assert.equal(stale.state, 'stale');
  assert.equal('count' in stale, false);
});

test('missing, malformed or implausible documents never yield a number', () => {
  for (const bad of [null, {}, { fields: {} }, doc('x', 0), doc('-3', 0), doc(2.5, 0, 'doubleValue'), doc('1e3', 0), doc('42', -10 * 60_000),
    { fields: { creatorCount: { integerValue: '5' } } }, { fields: { creatorCount: { integerValue: '5' }, updatedAt: { timestampValue: 'not a date' } } }]) {
    assert.deepEqual(interpret(bad, now), { state: 'unavailable' }, JSON.stringify(bad));
  }
});

test('the request targets only snapshots/live in the configured project', async () => {
  const requested = [];
  const fetcher = async (url, init) => { requested.push([url, init]); return { ok: true, json: async () => doc('3', 1000) }; };
  const reading = await readLive('little-galaxy', 'public-key', fetcher, now);
  assert.equal(reading.count, 3);
  assert.equal(requested[0][0], snapshotUrl('little-galaxy', 'public-key'));
  assert.match(requested[0][0], /^https:\/\/firestore\.googleapis\.com\/v1\/projects\/little-galaxy\/databases\/\(default\)\/documents\/snapshots\/live\?key=public-key$/);
  assert.equal(requested[0][1].cache, 'no-store');
});

test('network errors, HTTP errors and bad JSON are unavailable', async () => {
  assert.deepEqual(await readLive('p', 'k', async () => { throw new Error('offline'); }, now), { state: 'unavailable' });
  assert.deepEqual(await readLive('p', 'k', async () => ({ ok: false, status: 403, json: async () => ({}) }), now), { state: 'unavailable' });
  assert.deepEqual(await readLive('p', 'k', async () => ({ ok: true, json: async () => { throw new Error('bad json'); } }), now), { state: 'unavailable' });
});
