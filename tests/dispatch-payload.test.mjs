import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { resolveDeploymentTag, validateDispatchPayload } from '../scripts/validate-dispatch-payload.mjs';

test('validateDispatchPayload accepts valid release tags', () => {
  for (const tag of ['v1.0.0', 'v1.0.1', 'v1.0.0-alpha.1', 'v1.0.0-alpha.2', 'v2.0.0-beta.1']) {
    assert.equal(validateDispatchPayload({ tag }), tag);
  }
});

test('validateDispatchPayload rejects missing, empty, or non-object payloads', () => {
  assert.throws(() => validateDispatchPayload(null), /client_payload object/);
  assert.throws(() => validateDispatchPayload(undefined), /client_payload object/);
  assert.throws(() => validateDispatchPayload(''), /client_payload object/);
  assert.throws(() => validateDispatchPayload([]), /client_payload object/);
  assert.throws(() => validateDispatchPayload(123), /client_payload object/);
});

test('validateDispatchPayload rejects missing, empty, wrong type or invalid tags', () => {
  // Empty or missing tag
  assert.throws(() => validateDispatchPayload({}), /nonempty client_payload\.tag string/);
  assert.throws(() => validateDispatchPayload({ tag: '' }), /nonempty client_payload\.tag string/);
  assert.throws(() => validateDispatchPayload({ tag: '   ' }), /nonempty client_payload\.tag string/);

  // Wrong types
  assert.throws(() => validateDispatchPayload({ tag: false }), /nonempty client_payload\.tag string/);
  assert.throws(() => validateDispatchPayload({ tag: 0 }), /nonempty client_payload\.tag string/);
  assert.throws(() => validateDispatchPayload({ tag: null }), /nonempty client_payload\.tag string/);
  assert.throws(() => validateDispatchPayload({ tag: {} }), /nonempty client_payload\.tag string/);

  // Invalid tag strings
  assert.throws(() => validateDispatchPayload({ tag: 'latest' }), /Invalid repository dispatch client_payload\.tag/);
  assert.throws(() => validateDispatchPayload({ tag: 'main' }), /Invalid repository dispatch client_payload\.tag/);
  assert.throws(() => validateDispatchPayload({ tag: '1.0.0' }), /Invalid repository dispatch client_payload\.tag/);
  assert.throws(() => validateDispatchPayload({ tag: 'v1.0' }), /Invalid repository dispatch client_payload\.tag/);
});

test('resolveDeploymentTag enforces dispatch validation and allows manual/main defaults', () => {
  // repository_dispatch must validate strictly
  assert.equal(resolveDeploymentTag({ eventName: 'repository_dispatch', payload: { tag: 'v1.0.0-alpha.1' } }), 'v1.0.0-alpha.1');
  assert.throws(() => resolveDeploymentTag({ eventName: 'repository_dispatch', payload: {} }), /nonempty client_payload\.tag string/);
  assert.throws(() => resolveDeploymentTag({ eventName: 'repository_dispatch', payload: { tag: '' } }), /nonempty client_payload\.tag string/);

  // workflow_dispatch allows empty tag (meaning latest) or valid release tag
  assert.equal(resolveDeploymentTag({ eventName: 'workflow_dispatch', inputTag: '' }), '');
  assert.equal(resolveDeploymentTag({ eventName: 'workflow_dispatch', inputTag: 'v1.0.1' }), 'v1.0.1');
  assert.throws(() => resolveDeploymentTag({ eventName: 'workflow_dispatch', inputTag: 'invalid' }), /Invalid workflow_dispatch galaxy_tag input/);

  // push and pull_request default to empty tag (meaning latest)
  assert.equal(resolveDeploymentTag({ eventName: 'push' }), '');
  assert.equal(resolveDeploymentTag({ eventName: 'pull_request' }), '');
});

test('scripts/validate-dispatch-payload.mjs CLI behaves correctly in CI environment', async (t) => {
  const script = fileURLToPath(new URL('../scripts/validate-dispatch-payload.mjs', import.meta.url));
  const root = path.resolve(path.dirname(script), '..');

  // Fails on missing payload in repository_dispatch
  const missingPayloadResult = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, GITHUB_EVENT_NAME: 'repository_dispatch', CLIENT_PAYLOAD_JSON: '{}' },
  });
  assert.equal(missingPayloadResult.status, 1);
  assert.match(missingPayloadResult.stderr, /Validation failed: Repository dispatch requires a nonempty client_payload\.tag string/);

  // Fails on falsy/wrong-type tag
  for (const badJson of ['{"tag":""}', '{"tag":false}', '{"tag":0}', '{"tag":"latest"}']) {
    const badResult = spawnSync(process.execPath, [script], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, GITHUB_EVENT_NAME: 'repository_dispatch', CLIENT_PAYLOAD_JSON: badJson },
    });
    assert.equal(badResult.status, 1, `Expected exit 1 for payload ${badJson}`);
  }

  // Succeeds on valid tag and writes to GITHUB_ENV
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'dispatch-test-'));
  t.after(() => rm(tmpDir, { recursive: true, force: true }));
  const githubEnvFile = path.join(tmpDir, 'github_env');

  const validResult = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      GITHUB_EVENT_NAME: 'repository_dispatch',
      CLIENT_PAYLOAD_JSON: JSON.stringify({ tag: 'v1.0.0-alpha.1' }),
      GITHUB_ENV: githubEnvFile,
    },
  });
  assert.equal(validResult.status, 0);
  const writtenEnv = await readFile(githubEnvFile, 'utf8');
  assert.equal(writtenEnv.trim(), 'GALAXY_TAG=v1.0.0-alpha.1');

  // Succeeds on push (empty tag written to GITHUB_ENV)
  const pushEnvFile = path.join(tmpDir, 'push_env');
  const pushResult = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      GITHUB_EVENT_NAME: 'push',
      GITHUB_ENV: pushEnvFile,
    },
  });
  assert.equal(pushResult.status, 0);
  const writtenPushEnv = await readFile(pushEnvFile, 'utf8');
  assert.equal(writtenPushEnv.trim(), 'GALAXY_TAG=');
});
