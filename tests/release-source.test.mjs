import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

test('Hosting guard accepts upstream receipts and rejects rehearsal or changed pins', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'portfolio-release-guard-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'dist'));
  const pin = { repository: 'alexanderkholodov1/galaxy', tag: 'v0.1.0', artifact: 'galaxy-dist-v0.1.0.tar.gz' };
  await writeFile(path.join(root, 'games.json'), JSON.stringify({ schemaVersion: 1, games: { galaxy: pin } }));
  const script = fileURLToPath(new URL('../scripts/verify-release-source.mjs', import.meta.url));
  for (const [source, tag, expected] of [['github-release', 'v0.1.0', 0], ['local-rehearsal', 'v0.1.0', 1], ['github-release', 'v0.2.0', 1]]) {
    await writeFile(path.join(root, 'dist/assembly.json'), JSON.stringify({ games: { galaxy: { ...pin, source, tag } } }));
    const result = spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, expected);
    if (expected) assert.match(result.stderr, /Hosting requires/);
  }
});
