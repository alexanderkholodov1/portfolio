import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

test('Hosting guard accepts resolved latest and rollback receipts, rejects non-release or inconsistent output', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'portfolio-release-guard-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'dist/galaxy'), { recursive: true });
  const entry = { repository: 'alexanderkholodov1/little-galaxy', tag: 'v0.1.0', artifact: 'galaxy-dist-v0.1.0.tar.gz', commit: 'a'.repeat(40), sha256: 'b'.repeat(64), source: 'github-release' };
  await writeFile(path.join(root, 'dist/galaxy/version.json'), JSON.stringify({ version: '0.1.0', commit: entry.commit }));
  const script = fileURLToPath(new URL('../scripts/verify-release-source.mjs', import.meta.url));
  for (const [selection, override, changes, expected] of [
    ['latest', '', {}, 0], ['latest', 'v0.1.0', {}, 0], ['latest', 'v0.2.0', {}, 1],
    ['latest', '', { source: 'local-rehearsal' }, 1], ['latest', '', { source: 'local-build' }, 1],
    ['latest', '', { tag: 'latest' }, 1], ['latest', '', { artifact: 'other.tar.gz' }, 1],
    ['latest', '', { commit: 'c'.repeat(40) }, 1], ['latest', '', { sha256: '' }, 1],
    ['v0.1.0', '', {}, 0], ['v0.2.0', '', {}, 1],
  ]) {
    const config = { repository: entry.repository, tag: selection, ...(selection === 'latest' ? {} : { artifact: `galaxy-dist-${selection}.tar.gz` }) };
    await writeFile(path.join(root, 'games.json'), JSON.stringify({ schemaVersion: 1, games: { galaxy: config } }));
    await writeFile(path.join(root, 'dist/assembly.json'), JSON.stringify({ games: { galaxy: { ...entry, ...changes } } }));
    const result = spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8', env: { ...process.env, GALAXY_TAG: override } });
    assert.equal(result.status, expected, JSON.stringify({ selection, override, changes, stderr: result.stderr }));
    if (expected) assert.match(result.stderr, /Hosting requires/);
  }
});
