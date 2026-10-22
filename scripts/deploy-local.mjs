import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { assembleGames } from './assemble-games.mjs';
import { LIVE_ORIGIN, PROJECT, ROLLBACK_HINT, SITE, checkCredentials, confirm, firebaseRunner, getCurrentRelease, googleToken, parseArgs, restClient, versionId } from './hosting-lib.mjs';
import { checkPrivacy } from './privacy-check.mjs';
import { browserSmoke, launchChromium } from './smoke-browser.mjs';

const channelPattern = /^[a-z0-9][a-z0-9-]{0,62}$/;
const idPattern = /^[A-Za-z0-9_-]{1,64}$/;

// Streams a build command to the terminal; rejects on a non-zero exit.
function inherit(command, args, { cwd, env }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited with ${code}`))));
  });
}

export async function deployLocal(argv, deps = {}) {
  const root = deps.root ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const env = deps.env ?? process.env;
  const log = deps.log ?? console.log;
  const exec = deps.exec ?? inherit;
  const firebase = deps.firebase ?? firebaseRunner(root);
  const assemble = deps.assemble ?? assembleGames;
  const smoke = deps.smoke ?? browserSmoke;
  const flags = parseArgs(argv, {
    booleans: ['yes', 'yes-preview', 'dry-run', 'no-smoke', 'skip-galaxy-build'],
    strings: ['galaxy', 'galaxy-dist', 'artifact-dir', 'channel', 'expires'],
  });
  const artifactDirectory = flags['artifact-dir'] ?? env.GAMES_ARTIFACT_DIR;
  const galaxyDir = path.resolve(root, flags.galaxy ?? env.GALAXY_DIR ?? '../little-galaxy');
  const galaxyDist = path.resolve(galaxyDir, flags['galaxy-dist'] ?? 'apps/web/dist');
  // Seconds plus random bits: two runs never share a default channel.
  const channel = flags.channel ?? `local-${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}-${randomBytes(3).toString('hex')}`;
  const expires = flags.expires ?? '1d';
  if (!channelPattern.test(channel) || channel === 'live') throw new Error('Invalid channel id');
  if (!/^\d+[hd]$/.test(expires)) throw new Error('--expires must look like 12h or 2d');
  if (flags['no-smoke'] && flags.yes) throw new Error('--no-smoke is for preview-only diagnostics and cannot be combined with --yes: promotion always needs the smoke test');
  const deploy = ['hosting:channel:deploy', channel, '--expires', expires, '--json'];
  const cloneFor = (version) => ['hosting:clone', `${SITE}@${version}`, `${SITE}:live`];
  const galaxyStep = artifactDirectory
    ? `take the pinned release artifact from ${path.resolve(artifactDirectory)}`
    : `${flags['skip-galaxy-build'] ? 'use the existing' : 'build'} galaxy in ${galaxyDir} (pnpm run build), assemble ${galaxyDist} as a local build`;

  if (flags['dry-run']) {
    const steps = [
      'pnpm run build:site (Astro build + privacy gate)',
      galaxyStep,
      'assemble into dist/galaxy with the release checks and privacy gate; dist/assembly.json source = ' + (artifactDirectory ? 'local-rehearsal' : 'local-build'),
      'privacy gate over the whole dist/',
      `require GOOGLE_APPLICATION_CREDENTIALS outside the repository or in private/`,
      flags['no-smoke'] ? 'no headless browser (--no-smoke: preview only, promotion is impossible)' : 'start headless Chromium before anything is uploaded',
      flags['yes-preview'] ? `upload the preview without asking (--yes-preview)` : `ask for the word "preview" before the first Hosting write; non-interactive runs without --yes-preview stop before any upload`,
      `firebase ${deploy.join(' ')} --project ${PROJECT}; keep the version ID it returns`,
      'confirm the preview channel serves that version ID',
      flags['no-smoke'] ? 'stop: preview only' : 'browser smoke on the preview: portfolio /, /es/, /links/ render with no console errors or failed requests; /galaxy/, /galaxy/screen, /galaxy/create boot; galaxy version.json equals the assembled version and commit',
      'confirm the preview channel still serves that version ID',
      flags.yes ? 'promote without asking (--yes), only if the smoke test passed' : 'ask for the word "promote"',
      `firebase ${cloneFor('<version ID>').join(' ')} --project ${PROJECT}`,
      `browser smoke on ${LIVE_ORIGIN}`,
    ];
    steps.forEach((step, index) => log(`[dry-run] ${index + 1}. ${step}`));
    log('[dry-run] no build was run and no network call was made.');
    return { dryRun: true };
  }

  // Fail before building or uploading anything when nobody can answer the preview question.
  if (!flags['yes-preview'] && !deps.ask && !process.stdin.isTTY) throw new Error('Not a terminal: pass --yes-preview to authorize the preview upload. Nothing was built or uploaded.');
  checkCredentials(env, root, deps.exists);
  log(`Building the portfolio`);
  await exec('pnpm', ['run', 'build:site'], { cwd: root, env });
  const options = { root };
  if (artifactDirectory) options.artifactDirectory = artifactDirectory;
  else {
    if (!flags['skip-galaxy-build']) {
      log(`Building galaxy in ${galaxyDir}`);
      await exec('pnpm', ['run', 'build'], { cwd: galaxyDir, env });
    }
    options.artifactDirectory = '';
    options.localBuilds = { galaxy: galaxyDist };
  }
  const receipt = await assemble(options);
  const galaxyEntry = receipt.games.galaxy;
  log(`Assembled galaxy ${galaxyEntry.tag} (${galaxyEntry.source}) commit ${galaxyEntry.commit.slice(0, 12)}`);
  await (deps.privacy ?? checkPrivacy)({ root, allowedPublicKeys: [env.VITE_FIREBASE_API_KEY].filter(Boolean) });
  const assembled = JSON.parse(await readFile(path.join(root, 'dist/galaxy/version.json'), 'utf8'));
  const expected = { version: assembled.version, commit: assembled.commit };

  // The browser must exist before the first upload, so a missing Chromium never leaves a preview behind.
  const browser = flags['no-smoke'] ? null : await (deps.launchBrowser ?? launchChromium)();
  try {
    if (!await confirm({ yes: flags['yes-preview'], phrase: 'preview', ask: deps.ask })) { log('No preview was uploaded. Nothing changed on Hosting.'); return { previewUrl: null, promoted: false }; }
    const rest = deps.rest ?? restClient({ token: await googleToken() });
    const previewServes = async (version) => {
      const served = versionId((await getCurrentRelease(rest, channel)).version.name);
      return served === version ? [] : [`preview channel ${channel} serves version ${served}, not ${version}`];
    };

    log(`Deploying preview channel ${channel}`);
    const parsed = JSON.parse(await firebase(deploy));
    const previewUrl = parsed.result?.[SITE]?.url;
    const version = parsed.result?.[SITE]?.version;
    if (!previewUrl || !previewUrl.startsWith('https://')) throw new Error('The preview channel deploy returned no URL');
    if (!idPattern.test(version ?? '')) throw new Error('The preview channel deploy returned no version ID');
    log(`Preview: ${previewUrl} (version ${version})`);
    if (flags['no-smoke']) { log('Preview only (--no-smoke): not promoting. The preview stays up until it expires.'); return { previewUrl, version, promoted: false }; }

    const failures = [...await previewServes(version)];
    if (!failures.length) failures.push(...await smoke(previewUrl.replace(/\/$/, ''), expected, { browser, fetch: deps.fetch }));
    if (!failures.length) failures.push(...await previewServes(version));
    if (failures.length) {
      failures.forEach((failure) => log(`Smoke check failed: ${failure}`));
      log('Not promoting. The preview stays up until it expires.');
      process.exitCode = 1;
      return { previewUrl, version, promoted: false };
    }
    log(`Smoke check passed (galaxy ${expected.version}, commit ${expected.commit.slice(0, 12)})`);

    if (!await confirm({ yes: flags.yes, phrase: 'promote', ask: deps.ask })) { log('Not promoted. The preview stays up until it expires.'); return { previewUrl, version, promoted: false }; }
    // The immutable version ID, not the channel: whatever the channel serves now, live gets what was tested.
    await firebase(cloneFor(version));
    log(`Promoted version ${version} to live (${LIVE_ORIGIN}).`);
    const liveVersion = versionId((await getCurrentRelease(rest)).version.name);
    const live = [...(liveVersion === version ? [] : [`live serves version ${liveVersion}, expected ${version}`]), ...await smoke(LIVE_ORIGIN, expected, { browser, fetch: deps.fetch })];
    log(live.length ? `Live smoke check reported: ${live.join('; ')}` : 'Live smoke check passed');
    if (live.length) process.exitCode = 1;
    log(`To undo: pnpm run rollback. ${ROLLBACK_HINT}`);
    return { previewUrl, version, promoted: true };
  } finally { await browser?.close(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await deployLocal(process.argv.slice(2)); } catch (error) { console.error(`Local deploy failed: ${error.message}`); process.exitCode = 1; }
}
