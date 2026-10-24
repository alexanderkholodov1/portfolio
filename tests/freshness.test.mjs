import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
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

test('evaluateReleaseFreshness allows manual rollback via workflow_dispatch', async () => {
  // Manual rollback allows deploying older release
  const manualResult = await evaluateReleaseFreshness({
    eventName: 'workflow_dispatch',
    tag: 'v1.0.1',
  });
  assert.equal(manualResult.deploy, true);
  assert.equal(manualResult.reason, 'manual-workflow-dispatch');
  assert.equal(manualResult.tag, 'v1.0.1');

  // PR events are not authorized for production
  const prResult = await evaluateReleaseFreshness({
    eventName: 'pull_request',
  });
  assert.equal(prResult.deploy, false);
  assert.equal(prResult.reason, 'non-production-event');
});

test('main push refuses deploy after a newer dispatch has been published (main push after newer dispatch)', async () => {
  const fetchRelease = async () => new Response(JSON.stringify(releasesFixture), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

  // Main push assembled v1.0.0-alpha.1, but v1.0.0-alpha.2 was published/dispatched
  const stalePushResult = await evaluateReleaseFreshness({
    eventName: 'push',
    tag: 'v1.0.0-alpha.1',
    fetchRelease,
  });

  assert.equal(stalePushResult.deploy, false);
  assert.equal(stalePushResult.superseded, true);
  assert.equal(stalePushResult.reason, 'superseded-by-newer-release');
  assert.equal(stalePushResult.tag, 'v1.0.0-alpha.1');
  assert.equal(stalePushResult.latestTag, 'v1.0.0-alpha.2');

  // Verify refusal when assembled tag is passed via assemblyReceipt
  const receiptPushResult = await evaluateReleaseFreshness({
    eventName: 'push',
    assemblyReceipt: { games: { galaxy: { tag: 'v1.0.0-alpha.1' } } },
    fetchRelease,
  });
  assert.equal(receiptPushResult.deploy, false);
  assert.equal(receiptPushResult.superseded, true);
  assert.equal(receiptPushResult.tag, 'v1.0.0-alpha.1');
  assert.equal(receiptPushResult.latestTag, 'v1.0.0-alpha.2');

  // If the main push assembled the newest release (v1.0.0-alpha.2), it is authorized to deploy
  const freshPushResult = await evaluateReleaseFreshness({
    eventName: 'push',
    tag: 'v1.0.0-alpha.2',
    fetchRelease,
  });
  assert.equal(freshPushResult.deploy, true);
  assert.equal(freshPushResult.reason, 'newest-published-release');
  assert.equal(freshPushResult.tag, 'v1.0.0-alpha.2');
});

test('two dispatches in reverse order: newer release deploys and delayed older dispatch is refused', async () => {
  const fetchRelease = async () => new Response(JSON.stringify(releasesFixture), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

  // Dispatch 1: newer release v1.0.0-alpha.2 (published 12:00:00Z) arrives first
  const firstDispatchResult = await evaluateReleaseFreshness({
    eventName: 'repository_dispatch',
    tag: 'v1.0.0-alpha.2',
    fetchRelease,
  });
  assert.equal(firstDispatchResult.deploy, true);
  assert.equal(firstDispatchResult.reason, 'newest-published-release');
  assert.equal(firstDispatchResult.tag, 'v1.0.0-alpha.2');

  // Dispatch 2: older release v1.0.0-alpha.1 (published 08:00:00Z) arrives second (reverse arrival)
  const delayedDispatchResult = await evaluateReleaseFreshness({
    eventName: 'repository_dispatch',
    tag: 'v1.0.0-alpha.1',
    fetchRelease,
  });
  assert.equal(delayedDispatchResult.deploy, false);
  assert.equal(delayedDispatchResult.superseded, true);
  assert.equal(delayedDispatchResult.reason, 'superseded-by-newer-release');
  assert.equal(delayedDispatchResult.tag, 'v1.0.0-alpha.1');
  assert.equal(delayedDispatchResult.latestTag, 'v1.0.0-alpha.2');
});

test('concurrency group policy: all production triggers share production-deploy group with cancel-in-progress false', () => {
  const getConcurrencyConfig = ({ eventName, prNumber }) => {
    const isPR = eventName === 'pull_request';
    return {
      group: isPR ? `portfolio-pr-${prNumber}` : 'production-deploy',
      cancelInProgress: isPR,
    };
  };

  const mainPush = getConcurrencyConfig({ eventName: 'push' });
  const dispatchAlpha1 = getConcurrencyConfig({ eventName: 'repository_dispatch' });
  const dispatchAlpha2 = getConcurrencyConfig({ eventName: 'repository_dispatch' });
  const manualDeploy = getConcurrencyConfig({ eventName: 'workflow_dispatch' });
  const pr1 = getConcurrencyConfig({ eventName: 'pull_request', prNumber: 42 });
  const pr2 = getConcurrencyConfig({ eventName: 'pull_request', prNumber: 43 });

  // All production triggers share EXACTLY ONE concurrency group
  assert.equal(mainPush.group, 'production-deploy');
  assert.equal(dispatchAlpha1.group, 'production-deploy');
  assert.equal(dispatchAlpha2.group, 'production-deploy');
  assert.equal(manualDeploy.group, 'production-deploy');

  // Cancel-in-progress is FALSE for all production triggers to serialize deployments
  assert.equal(mainPush.cancelInProgress, false);
  assert.equal(dispatchAlpha1.cancelInProgress, false);
  assert.equal(dispatchAlpha2.cancelInProgress, false);
  assert.equal(manualDeploy.cancelInProgress, false);

  // PR preview jobs keep independent, cancellable per-PR queues
  assert.equal(pr1.group, 'portfolio-pr-42');
  assert.equal(pr2.group, 'portfolio-pr-43');
  assert.equal(pr1.cancelInProgress, true);
  assert.equal(pr2.cancelInProgress, true);
  assert.notEqual(pr1.group, pr2.group);
  assert.notEqual(pr1.group, mainPush.group);
});

test('evaluateReleaseFreshness reads assembled tag from disk when not passed directly', async (t) => {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'freshness-assembly-'));
  t.after(() => rm(tmpDir, { recursive: true, force: true }));

  const assemblyPath = path.join(tmpDir, 'assembly.json');
  await writeFile(
    assemblyPath,
    JSON.stringify({ schemaVersion: 1, games: { galaxy: { tag: 'v1.0.0-alpha.1' } } })
  );

  const fetchRelease = async () => new Response(JSON.stringify(releasesFixture), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

  const result = await evaluateReleaseFreshness({
    eventName: 'push',
    assemblyPath,
    fetchRelease,
  });

  assert.equal(result.deploy, false);
  assert.equal(result.superseded, true);
  assert.equal(result.tag, 'v1.0.0-alpha.1');
});

test('scripts/verify-release-freshness.mjs CLI writes deploy outputs to GITHUB_OUTPUT', async (t) => {
  const script = fileURLToPath(new URL('../scripts/verify-release-freshness.mjs', import.meta.url));
  const root = path.resolve(path.dirname(script), '..');

  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'freshness-test-'));
  t.after(() => rm(tmpDir, { recursive: true, force: true }));
  const githubOutputFile = path.join(tmpDir, 'github_output');

  // Write a fixture file for offline/hermetic CLI testing
  const fixtureFile = path.join(tmpDir, 'releases-fixture.json');
  await writeFile(fixtureFile, JSON.stringify(releasesFixture));

  // Manual workflow_dispatch
  const manualResult = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      GITHUB_EVENT_NAME: 'workflow_dispatch',
      INPUT_GALAXY_TAG: 'v1.0.1',
      GITHUB_OUTPUT: githubOutputFile,
      PORTFOLIO_RELEASES_FIXTURE: fixtureFile,
    },
  });
  assert.equal(manualResult.status, 0);
  const manualOutput = await readFile(githubOutputFile, 'utf8');
  assert.match(manualOutput, /deploy=true/);

  // Push event with latest release
  const pushOutputFile = path.join(tmpDir, 'push_output');
  const pushResult = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      GITHUB_EVENT_NAME: 'push',
      GALAXY_TAG: 'v1.0.0-alpha.2',
      GITHUB_OUTPUT: pushOutputFile,
      PORTFOLIO_RELEASES_FIXTURE: fixtureFile,
    },
  });
  assert.equal(pushResult.status, 0);
  const pushOutput = await readFile(pushOutputFile, 'utf8');
  assert.match(pushOutput, /deploy=true/);

  // Push event with superseded release
  const supersededOutputFile = path.join(tmpDir, 'superseded_output');
  const supersededResult = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      GITHUB_EVENT_NAME: 'push',
      GALAXY_TAG: 'v1.0.0-alpha.1',
      GITHUB_OUTPUT: supersededOutputFile,
      PORTFOLIO_RELEASES_FIXTURE: fixtureFile,
    },
  });
  assert.equal(supersededResult.status, 0);
  const supersededOutput = await readFile(supersededOutputFile, 'utf8');
  assert.match(supersededOutput, /deploy=false/);
  assert.match(supersededOutput, /superseded=true/);
});
