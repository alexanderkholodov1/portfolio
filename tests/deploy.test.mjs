import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { assembleGames } from '../scripts/assemble-games.mjs';
import { deployLocal } from '../scripts/deploy-local.mjs';
import { checkCredentials, parseArgs } from '../scripts/hosting-lib.mjs';

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

const SITE_ID = 'alexanderkholodov';
const versionName = (id) => `projects/1/sites/${SITE_ID}/versions/${id}`;

// Every external effect is a mock: build commands, firebase CLI, REST, browser and prompts.
// `state` is the fake Hosting side: which version the preview channel and live channel serve.
function harness(t, ctx, { smokeFailures = [], answers = { preview: 'preview', promote: 'promote' }, previewVersion = 'v-tested' } = {}) {
  const calls = { exec: [], firebase: [], rest: [], smoke: [], asked: [], log: [], browserClosed: 0 };
  const state = { channelVersion: null, liveVersion: 'v-live-before' };
  const deps = {
    root: ctx.root, env, exists: () => true,
    log: (line) => calls.log.push(line),
    exec: async (command, args, options) => { calls.exec.push([command, ...args, options.cwd]); },
    firebase: async (args) => {
      calls.firebase.push(args);
      if (args[0] === 'hosting:channel:deploy') {
        state.channelVersion = previewVersion;
        return JSON.stringify({ status: 'success', result: { [SITE_ID]: { site: SITE_ID, url: 'https://alexanderkholodov--local-x-abc.web.app', version: previewVersion } } });
      }
      const source = args[1];
      state.liveVersion = source.includes('@') ? source.split('@')[1] : state.channelVersion; // a channel source follows the channel
      return '';
    },
    rest: { get: async (resource) => {
      calls.rest.push(resource);
      return { release: { version: { name: versionName(resource.endsWith('/channels/live') ? state.liveVersion : state.channelVersion) } } };
    } },
    launchBrowser: async () => ({ close: async () => { calls.browserClosed++; } }),
    smoke: async (origin, expected) => { calls.smoke.push({ origin, expected }); return smokeFailures; },
    ask: async (prompt) => {
      const phrase = /"(\w+)"/.exec(prompt)[1];
      calls.asked.push(phrase);
      if (deps.whileAsking) deps.whileAsking(phrase);
      return answers[phrase] ?? 'no';
    },
  };
  t.after(() => { process.exitCode = initialExitCode; });
  return { calls, state, deps };
}

const withAssembly = (deps) => { deps.assemble = (options) => assembleGames({ ...options, allowedPublicKeys: [] }); return deps; };
const hostingWrites = (calls) => calls.firebase.length;

test('dry-run prints every action and runs nothing', async (t) => {
  const ctx = await workspace(t);
  const { calls, deps } = harness(t, ctx);
  deps.assemble = () => { throw new Error('must not run'); };
  await deployLocal(['--dry-run', '--channel', 'rehearsal'], deps);
  assert.deepEqual([calls.exec, calls.firebase, calls.rest, calls.smoke, calls.asked], [[], [], [], [], []]);
  const text = calls.log.join('\n');
  for (const needle of ['build:site', 'hosting:channel:deploy rehearsal', 'hosting:clone alexanderkholodov@<version ID> alexanderkholodov:live', '"preview"', 'promote', 'headless Chromium', 'no network call']) assert.ok(text.includes(needle), needle);
});

test('previews after confirmation, passes the browser smoke, promotes the tested version ID after a second confirmation, and the dist is labelled local', async (t) => {
  const ctx = await workspace(t);
  const { calls, state, deps } = harness(t, ctx);
  withAssembly(deps);
  const result = await deployLocal(['--galaxy', path.join(ctx.base, 'little-galaxy'), '--channel', 'rehearsal'], deps);
  assert.equal(result.promoted, true);
  assert.deepEqual(calls.asked, ['preview', 'promote']);
  assert.deepEqual(calls.firebase, [
    ['hosting:channel:deploy', 'rehearsal', '--expires', '1d', '--json'],
    ['hosting:clone', 'alexanderkholodov@v-tested', 'alexanderkholodov:live'],
  ]);
  assert.equal(state.liveVersion, 'v-tested');
  assert.deepEqual(calls.exec.map((call) => call.slice(0, 3).join(' ')), ['pnpm run build:site', 'pnpm run build']);
  assert.deepEqual(calls.smoke.map((call) => call.origin), ['https://alexanderkholodov--local-x-abc.web.app', 'https://alexanderkholodov.web.app']);
  assert.deepEqual(calls.smoke[0].expected, { version: '0.7.0', commit });
  assert.equal(calls.browserClosed, 1);
  const receipt = JSON.parse(await readFile(path.join(ctx.root, 'dist/assembly.json'), 'utf8'));
  assert.equal(receipt.games.galaxy.source, 'local-build');
  assert.equal(receipt.games.galaxy.tag, 'v0.7.0');
  assert.equal(await readFile(path.join(ctx.root, 'dist/galaxy/version.json'), 'utf8'), version);
});

test('declining the preview prompt makes zero Hosting writes and zero Hosting reads', async (t) => {
  for (const answer of ['no', 'promote', 'yes', '']) {
    const ctx = await workspace(t);
    const { calls, deps } = harness(t, ctx, { answers: { preview: answer, promote: 'promote' } });
    withAssembly(deps);
    const result = await deployLocal(['--galaxy', path.join(ctx.base, 'little-galaxy'), '--yes'], deps);
    assert.equal(result.promoted, false, answer);
    assert.deepEqual([calls.firebase, calls.rest, calls.smoke], [[], [], []], answer);
    assert.deepEqual(calls.asked, ['preview']);
    assert.equal(calls.browserClosed, 1);
  }
});

test('a non-interactive run without --yes-preview stops before building or uploading anything', async (t) => {
  const ctx = await workspace(t);
  const { calls, deps } = harness(t, ctx);
  delete deps.ask;
  const tty = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY');
  Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });
  t.after(() => (tty ? Object.defineProperty(process.stdin, 'isTTY', tty) : delete process.stdin.isTTY));
  await assert.rejects(deployLocal(['--yes'], deps), /Not a terminal: pass --yes-preview/);
  assert.deepEqual([calls.exec, calls.firebase, calls.rest, calls.smoke], [[], [], [], []]);
});

test('--yes-preview uploads without asking but still asks before promotion; --yes alone never skips the preview question', async (t) => {
  const ctx = await workspace(t);
  const first = harness(t, ctx, { answers: { promote: 'nope' } });
  withAssembly(first.deps);
  const declined = await deployLocal(['--yes-preview', '--galaxy', path.join(ctx.base, 'little-galaxy')], first.deps);
  assert.equal(declined.promoted, false);
  assert.deepEqual(first.calls.asked, ['promote']);
  assert.deepEqual(first.calls.firebase.map((args) => args[0]), ['hosting:channel:deploy']);
  const second = harness(t, ctx, { answers: { preview: 'no' } });
  withAssembly(second.deps);
  await deployLocal(['--yes', '--galaxy', path.join(ctx.base, 'little-galaxy')], second.deps);
  assert.deepEqual(second.calls.asked, ['preview']);
  assert.equal(hostingWrites(second.calls), 0);
});

test('any promotion answer other than "promote" leaves live untouched', async (t) => {
  const ctx = await workspace(t);
  const { calls, deps } = harness(t, ctx, { answers: { preview: 'preview', promote: 'yes' } });
  withAssembly(deps);
  const result = await deployLocal(['--galaxy', path.join(ctx.base, 'little-galaxy')], deps);
  assert.equal(result.promoted, false);
  assert.deepEqual(calls.firebase.map((args) => args[0]), ['hosting:channel:deploy']);
});

test('--yes --yes-preview run unattended, but never past a failed browser smoke', async (t) => {
  const ctx = await workspace(t);
  const good = harness(t, ctx);
  withAssembly(good.deps);
  good.deps.ask = () => { throw new Error('must not ask'); };
  assert.equal((await deployLocal(['--yes', '--yes-preview', '--galaxy', path.join(ctx.base, 'little-galaxy')], good.deps)).promoted, true);
  const { calls, deps } = harness(t, ctx, { smokeFailures: ['/galaxy/screen: the app root never rendered'] });
  withAssembly(deps);
  const result = await deployLocal(['--yes', '--yes-preview', '--galaxy', path.join(ctx.base, 'little-galaxy')], deps);
  assert.equal(result.promoted, false);
  assert.ok(!calls.firebase.some((args) => args[0] === 'hosting:clone'));
  assert.ok(calls.log.some((line) => line.includes('never rendered')));
  assert.equal(process.exitCode, 1);
});

test('interleaving: the preview channel changes while waiting for confirmation, and live still gets the tested version ID', async (t) => {
  const ctx = await workspace(t);
  const { calls, state, deps } = harness(t, ctx);
  withAssembly(deps);
  deps.whileAsking = (phrase) => { if (phrase === 'promote') state.channelVersion = 'v-other-run'; }; // run B deploys to the same channel
  const result = await deployLocal(['--galaxy', path.join(ctx.base, 'little-galaxy'), '--channel', 'shared'], deps);
  assert.equal(result.promoted, true);
  assert.deepEqual(calls.firebase[1], ['hosting:clone', 'alexanderkholodov@v-tested', 'alexanderkholodov:live']);
  assert.equal(state.liveVersion, 'v-tested');
  assert.ok(!calls.log.some((line) => line.includes('live serves version')));
});

test('interleaving: the channel changes before or during the smoke test, so nothing is promoted', async (t) => {
  for (const when of ['before', 'during']) {
    const ctx = await workspace(t);
    const { calls, state, deps } = harness(t, ctx);
    withAssembly(deps);
    const firebase = deps.firebase;
    if (when === 'before') deps.firebase = async (args) => { const out = await firebase(args); state.channelVersion = 'v-other-run'; return out; };
    else deps.smoke = async () => { state.channelVersion = 'v-other-run'; return []; };
    const result = await deployLocal(['--yes', '--yes-preview', '--galaxy', path.join(ctx.base, 'little-galaxy')], deps);
    assert.equal(result.promoted, false, when);
    assert.ok(!calls.firebase.some((args) => args[0] === 'hosting:clone'), when);
    assert.ok(calls.log.some((line) => line.includes('serves version v-other-run, not v-tested')), when);
  }
});

test('a preview deploy that reports no version ID is never promoted', async (t) => {
  const ctx = await workspace(t);
  const { calls, deps } = harness(t, ctx);
  withAssembly(deps);
  deps.firebase = async (args) => { calls.firebase.push(args); return JSON.stringify({ result: { [SITE_ID]: { url: 'https://x.web.app' } } }); };
  await assert.rejects(deployLocal(['--yes', '--yes-preview', '--galaxy', path.join(ctx.base, 'little-galaxy')], deps), /no version ID/);
  assert.deepEqual(calls.firebase.map((args) => args[0]), ['hosting:channel:deploy']);
});

test('--no-smoke is preview-only: it cannot promote, with or without --yes', async (t) => {
  const ctx = await workspace(t);
  const { calls, deps } = harness(t, ctx);
  withAssembly(deps);
  const result = await deployLocal(['--no-smoke', '--yes-preview', '--galaxy', path.join(ctx.base, 'little-galaxy')], deps);
  assert.equal(result.promoted, false);
  assert.deepEqual(calls.firebase.map((args) => args[0]), ['hosting:channel:deploy']);
  assert.deepEqual(calls.smoke, []);
  assert.deepEqual(calls.asked, []);
  const refused = harness(t, ctx);
  await assert.rejects(deployLocal(['--no-smoke', '--yes', '--yes-preview'], refused.deps), /cannot be combined with --yes/);
  assert.deepEqual([refused.calls.exec, refused.calls.firebase], [[], []]);
});

test('false or malformed confirmation arguments cannot reach any Hosting write', async (t) => {
  const ctx = await workspace(t);
  const argvs = [['--yes=false'], ['--yes=0'], ['--yes=no'], ['--yes='], ['--yes=true'], ['--yes', 'false'], ['--yes-preview=false'], ['--yes-preview=0'], ['--no-smoke=false'], ['--no-smoke=true'], ['--dry-run=false'], ['--skip-galaxy-build=false'], ['--YES'], ['-y'], ['yes'], ['--yes-preview', '--yes=false']];
  for (const argv of argvs) {
    const { calls, deps } = harness(t, ctx);
    withAssembly(deps);
    await assert.rejects(deployLocal(argv, deps), /takes no value|Unexpected argument|Unknown flag/, argv.join(' '));
    assert.deepEqual([calls.exec, calls.firebase, calls.rest, calls.smoke, calls.asked], [[], [], [], [], []], argv.join(' '));
  }
});

test('selected artifact mode skips the galaxy build', async (t) => {
  const ctx = await workspace(t);
  const { calls, deps } = harness(t, ctx);
  deps.assemble = async (options) => {
    assert.equal(options.artifactDirectory, path.resolve('/some/artifacts'));
    await mkdir(path.join(ctx.root, 'dist/galaxy'), { recursive: true });
    await writeFile(path.join(ctx.root, 'dist/galaxy/version.json'), version);
    return { games: { galaxy: { tag: 'v0.1.0', source: 'local-rehearsal', commit } } };
  };
  await deployLocal(['--artifact-dir', '/some/artifacts', '--no-smoke', '--yes-preview'], deps);
  assert.deepEqual(calls.exec.map((call) => call.slice(0, 3).join(' ')), ['pnpm run build:site']);
  assert.deepEqual(calls.smoke, []);
});

test('rejects bad channels, live as a channel, and unsafe credential locations; default channels are unique', async (t) => {
  const ctx = await workspace(t);
  const { deps } = harness(t, ctx);
  for (const channel of ['live', 'Bad_Name', '../x']) await assert.rejects(deployLocal(['--dry-run', '--channel', channel], deps), /Invalid channel/);
  const names = [];
  for (let i = 0; i < 2; i++) {
    const { calls, deps: again } = harness(t, ctx);
    await deployLocal(['--dry-run'], again);
    names.push(/hosting:channel:deploy (\S+)/.exec(calls.log.join('\n'))[1]);
  }
  assert.match(names[0], /^local-\d{14}-[0-9a-f]{6}$/);
  assert.notEqual(names[0], names[1]);
  assert.throws(() => checkCredentials({}, ctx.root), /GOOGLE_APPLICATION_CREDENTIALS/);
  assert.throws(() => checkCredentials({ GOOGLE_APPLICATION_CREDENTIALS: path.join(ctx.root, 'key.json') }, ctx.root, () => true), /under private/);
  assert.doesNotThrow(() => checkCredentials({ GOOGLE_APPLICATION_CREDENTIALS: path.join(ctx.root, 'private/key.json') }, ctx.root, () => true));
  assert.throws(() => parseArgs(['--nope'], {}), /Unknown flag/);
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
  await assert.rejects(assembleGames({ root: ctx.root, artifactDirectory: '', localBuilds: { other: ctx.build } }), /unconfigured/);
});

test('release mode passes the deploy-only override to assembly and skips local galaxy builds', async (t) => {
  const ctx = await workspace(t);
  const { calls, deps } = harness(t, ctx);
  deps.assemble = async (options) => {
    assert.equal(options.galaxyTag, 'v0.7.0');
    assert.equal(options.allowDownload, true);
    assert.equal(options.artifactDirectory, '');
    await mkdir(path.join(ctx.root, 'dist/galaxy'), { recursive: true });
    await writeFile(path.join(ctx.root, 'dist/galaxy/version.json'), version);
    return { games: { galaxy: { tag: 'v0.7.0', source: 'github-release', commit } } };
  };
  await deployLocal(['--galaxy-tag', 'v0.7.0', '--yes-preview', '--yes'], deps);
  assert.deepEqual(calls.exec.map((call) => call.slice(0, 3).join(' ')), ['pnpm run build:site']);
  assert.equal(calls.smoke.length, 2);
  assert.equal(calls.browserClosed, 1);
});
