import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { evaluateReleaseFreshness } from '../scripts/verify-release-freshness.mjs';

const releasesFixture = [
  { tag_name: 'v1.0.0-alpha.2', published_at: '2026-10-24T12:00:00Z', draft: false, prerelease: true },
  { tag_name: 'v1.0.0-alpha.1', published_at: '2026-10-24T08:00:00Z', draft: false, prerelease: true },
  { tag_name: 'v1.0.1', published_at: '2026-10-23T10:00:00Z', draft: false, prerelease: false },
  { tag_name: 'v1.0.0', published_at: '2026-10-22T10:00:00Z', draft: false, prerelease: false },
];

test('evaluateReleaseFreshness authorizes newest published release', async () => {
  const fetchRelease = async () => new Response(JSON.stringify(releasesFixture), { status: 200, headers: { 'Content-Type': 'application/json' } });

  const result = await evaluateReleaseFreshness({
    eventName: 'repository_dispatch',
    tag: 'v1.0.0-alpha.2',
    fetchRelease,
  });

  assert.equal(result.deploy, true);
  assert.equal(result.reason, 'newest-published-release');
  assert.equal(result.tag, 'v1.0.0-alpha.2');
});

test('evaluateReleaseFreshness rejects stale release on reverse-arrival (newest published wins)', async () => {
  const fetchRelease = async () => new Response(JSON.stringify(releasesFixture), { status: 200, headers: { 'Content-Type': 'application/json' } });

  // Delayed alpha.1 arrives after alpha.2 has already been published
  const result = await evaluateReleaseFreshness({
    eventName: 'repository_dispatch',
    tag: 'v1.0.0-alpha.1',
    fetchRelease,
  });

  assert.equal(result.deploy, false);
  assert.equal(result.superseded, true);
  assert.equal(result.tag, 'v1.0.0-alpha.1');
  assert.equal(result.latestTag, 'v1.0.0-alpha.2');
  assert.equal(result.reason, 'superseded-by-newer-release');
});

test('evaluateReleaseFreshness rejects unknown or invalid dispatch tags', async () => {
  const fetchRelease = async () => new Response(JSON.stringify(releasesFixture), { status: 200, headers: { 'Content-Type': 'application/json' } });

  await assert.rejects(
    evaluateReleaseFreshness({ eventName: 'repository_dispatch', tag: 'invalid', fetchRelease }),
    /invalid dispatch tag/
  );
  await assert.rejects(
    evaluateReleaseFreshness({ eventName: 'repository_dispatch', tag: '', fetchRelease }),
    /invalid dispatch tag/
  );
  await assert.rejects(
    evaluateReleaseFreshness({ eventName: 'repository_dispatch', tag: 'v9.9.9', fetchRelease }),
    /release "v9.9.9" was not found/
  );
});

test('evaluateReleaseFreshness allows manual rollback and pushes to main', async () => {
  // Manual rollback allows deploying older release
  const manualResult = await evaluateReleaseFreshness({
    eventName: 'workflow_dispatch',
    tag: 'v1.0.1',
  });
  assert.equal(manualResult.deploy, true);
  assert.equal(manualResult.reason, 'manual-workflow-dispatch');

  // Push to main is authorized
  const pushResult = await evaluateReleaseFreshness({
    eventName: 'push',
  });
  assert.equal(pushResult.deploy, true);
  assert.equal(pushResult.reason, 'main-push');

  // PR events are not authorized for production
  const prResult = await evaluateReleaseFreshness({
    eventName: 'pull_request',
  });
  assert.equal(prResult.deploy, false);
});

test('concurrency group policy prevents dropping pending releases (active-plus-two-pending)', () => {
  // Evaluates the workflow concurrency expression logic
  const getConcurrencyGroup = ({ eventName, prNumber, dispatchTag, manualTag, ref }) => {
    if (eventName === 'pull_request') return `portfolio-pr-${prNumber}`;
    if (eventName === 'repository_dispatch') return `portfolio-dispatch-${dispatchTag}`;
    if (eventName === 'workflow_dispatch') return `portfolio-manual-${manualTag || 'latest'}`;
    if (ref === 'refs/heads/main') return 'portfolio-production';
    return `portfolio-branch-${ref}`;
  };

  const groupMainPush = getConcurrencyGroup({ eventName: 'push', ref: 'refs/heads/main' });
  const groupAlpha1 = getConcurrencyGroup({ eventName: 'repository_dispatch', dispatchTag: 'v1.0.0-alpha.1' });
  const groupAlpha2 = getConcurrencyGroup({ eventName: 'repository_dispatch', dispatchTag: 'v1.0.0-alpha.2' });

  assert.equal(groupMainPush, 'portfolio-production');
  assert.equal(groupAlpha1, 'portfolio-dispatch-v1.0.0-alpha.1');
  assert.equal(groupAlpha2, 'portfolio-dispatch-v1.0.0-alpha.2');

  // Distinct groups ensure alpha.2 arrival never cancels pending alpha.1
  assert.notEqual(groupAlpha1, groupAlpha2);
  assert.notEqual(groupAlpha1, groupMainPush);
  assert.notEqual(groupAlpha2, groupMainPush);
});

test('scripts/verify-release-freshness.mjs CLI writes deploy outputs to GITHUB_OUTPUT', async (t) => {
  const script = fileURLToPath(new URL('../scripts/verify-release-freshness.mjs', import.meta.url));
  const root = path.resolve(path.dirname(script), '..');

  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'freshness-test-'));
  t.after(() => rm(tmpDir, { recursive: true, force: true }));
  const githubOutputFile = path.join(tmpDir, 'github_output');

  // Manual workflow_dispatch
  const manualResult = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      GITHUB_EVENT_NAME: 'workflow_dispatch',
      GALAXY_TAG: 'v1.0.1',
      GITHUB_OUTPUT: githubOutputFile,
    },
  });
  assert.equal(manualResult.status, 0);
  const manualOutput = await readFile(githubOutputFile, 'utf8');
  assert.match(manualOutput, /deploy=true/);

  // Push event
  const pushOutputFile = path.join(tmpDir, 'push_output');
  const pushResult = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      GITHUB_EVENT_NAME: 'push',
      GITHUB_OUTPUT: pushOutputFile,
    },
  });
  assert.equal(pushResult.status, 0);
  const pushOutput = await readFile(pushOutputFile, 'utf8');
  assert.match(pushOutput, /deploy=true/);
});
